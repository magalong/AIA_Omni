import type { Server, IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../env.js';

const ASR_PATH = '/asr';

function isOriginAllowed(origin: string | undefined, host: string | undefined): boolean {
  if (env.WS_ALLOWED_ORIGINS.includes('*')) return true;
  if (!origin) return false;
  // 同源自動放行：origin 的 host 與請求的 Host 相同（前後端同源部署不需額外設白名單）
  try {
    if (host && new URL(origin).host === host) return true;
  } catch {}
  return env.WS_ALLOWED_ORIGINS.includes(origin);
}

function rejectUpgrade(socket: Duplex, statusLine: string): void {
  socket.write(`HTTP/1.1 ${statusLine}\r\n\r\n`);
  socket.destroy();
}

// 驗證 upgrade 請求；通過才轉交 wss 處理，否則直接回應拒絕
function handleUpgrade(
  wss: WebSocketServer,
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
): void {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (url.pathname !== ASR_PATH) return; // 非 /asr，交給其他 handler

  if (!isOriginAllowed(req.headers.origin, req.headers.host)) {
    console.warn(`[asr-ws] 拒絕來源: ${req.headers.origin}`);
    return rejectUpgrade(socket, '403 Forbidden');
  }

  if (!env.DASHSCOPE_API_KEY) {
    return rejectUpgrade(socket, '503 Service Unavailable');
  }

  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
}

// 可重複呼叫的關閉器；額外清理工作用 addCleanup 註冊（例如 clearInterval）
type Closer = (() => void) & { addCleanup: (fn: () => void) => void };

function createCloser(client: WebSocket, upstream: WebSocket): Closer {
  let closed = false;
  const cleanups: Array<() => void> = [];

  const closeAll = (() => {
    if (closed) return;
    closed = true;
    for (const fn of cleanups) fn();
    try { client.close(); } catch {}
    try { upstream.close(); } catch {}
  }) as Closer;

  closeAll.addCleanup = (fn) => { cleanups.push(fn); };
  return closeAll;
}

function createUpstream(): WebSocket {
  const upstreamUrl = `${env.DASHSCOPE_WS_URL}?model=${encodeURIComponent(env.DASHSCOPE_ASR_MODEL)}`;
  return new WebSocket(upstreamUrl, {
    headers: { Authorization: `bearer ${env.DASHSCOPE_API_KEY}` },
  });
}

// client ⇆ upstream 雙向轉送；upstream 未連上前先把 client 訊息暫存
function setupRelay(client: WebSocket, upstream: WebSocket, touch: () => void): void {
  const pending: Array<Buffer | string> = [];
  let upstreamReady = false;

  upstream.on('open', () => {
    upstreamReady = true;
    for (const msg of pending) upstream.send(msg);
    pending.length = 0;
  });

  client.on('message', (data, isBinary) => {
    touch();
    const payload = isBinary ? (data as Buffer) : data.toString();
    if (upstreamReady && upstream.readyState === WebSocket.OPEN) {
      upstream.send(payload);
    } else {
      pending.push(payload);
    }
  });

  upstream.on('message', (data, isBinary) => {
    touch();
    if (client.readyState === WebSocket.OPEN) {
      client.send(isBinary ? (data as Buffer) : data.toString());
    }
  });
}

// 心跳：偵測殭屍連線
function startHeartbeat(client: WebSocket, touch: () => void, closeAll: Closer): void {
  let alive = true;
  client.on('pong', () => {
    alive = true;
    touch();
  });

  const timer = setInterval(() => {
    if (!alive) {
      console.log('[asr-ws] 心跳逾時，關閉連線');
      return closeAll();
    }
    alive = false;
    try {
      client.ping();
    } catch {
      closeAll();
    }
  }, env.WS_HEARTBEAT_SEC * 1000);

  closeAll.addCleanup(() => clearInterval(timer));
}

// 閒置逾時：太久沒活動就關閉
function startIdleCheck(getLastActivity: () => number, closeAll: Closer): void {
  const timer = setInterval(() => {
    if (Date.now() - getLastActivity() > env.WS_IDLE_TIMEOUT_SEC * 1000) {
      console.log('[asr-ws] 閒置逾時，關閉連線');
      closeAll();
    }
  }, 10_000);

  closeAll.addCleanup(() => clearInterval(timer));
}

// 任一端關閉或出錯就一起收掉
function setupTermination(client: WebSocket, upstream: WebSocket, closeAll: Closer): void {
  client.on('close', (code, reason) => {
    console.log(`[asr-ws] client closed: ${code} ${reason}`);
    closeAll();
  });
  upstream.on('close', (code, reason) => {
    console.log(`[asr-ws] upstream(DashScope) closed: ${code} ${String(reason)}`);
    closeAll();
  });
  client.on('error', (e) => {
    console.error('[asr-ws] client error', e.message);
    closeAll();
  });
  upstream.on('error', (e) => {
    console.error('[asr-ws] upstream error', e.message);
    closeAll();
  });
}

function handleConnection(client: WebSocket): void {
  const upstream = createUpstream();

  let lastActivity = Date.now();
  const touch = () => { lastActivity = Date.now(); };

  const closeAll = createCloser(client, upstream);
  setupRelay(client, upstream, touch);
  startHeartbeat(client, touch, closeAll);
  startIdleCheck(() => lastActivity, closeAll);
  setupTermination(client, upstream, closeAll);
}

export function attachAsrWs(server: Server): void {
  if (!env.DASHSCOPE_API_KEY) {
    console.warn('[asr-ws] DASHSCOPE_API_KEY 未設定，/asr 端點將拒絕連線');
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => handleUpgrade(wss, req, socket, head));
  wss.on('connection', (client: WebSocket) => handleConnection(client));

  console.log(`[asr-ws] 已掛載於 ${ASR_PATH}（model=${env.DASHSCOPE_ASR_MODEL}）`);
}
