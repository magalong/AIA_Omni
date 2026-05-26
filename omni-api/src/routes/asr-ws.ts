import type { Server, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { env } from '../env.js';

const ASR_PATH = '/asr';

function isOriginAllowed(origin: string | undefined): boolean {
  if (env.WS_ALLOWED_ORIGINS.includes('*')) return true;
  if (!origin) return false;
  return env.WS_ALLOWED_ORIGINS.includes(origin);
}

export function attachAsrWs(server: Server) {
  if (!env.DASHSCOPE_API_KEY) {
    console.warn('[asr-ws] DASHSCOPE_API_KEY 未設定，/asr 端點將拒絕連線');
  }

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    if (url.pathname !== ASR_PATH) return;

    const origin = req.headers.origin;
    if (!isOriginAllowed(origin)) {
      console.warn(`[asr-ws] 拒絕來源: ${origin}`);
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    if (!env.DASHSCOPE_API_KEY) {
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (client: WebSocket) => {
    const upstreamUrl = `${env.DASHSCOPE_WS_URL}?model=${encodeURIComponent(env.DASHSCOPE_ASR_MODEL)}`;
    const upstream = new WebSocket(upstreamUrl, {
      headers: { Authorization: `bearer ${env.DASHSCOPE_API_KEY}` },
    });

    let lastActivity = Date.now();
    const touch = () => (lastActivity = Date.now());

    const pendingFromClient: Array<Buffer | string> = [];
    let upstreamReady = false;

    upstream.on('open', () => {
      upstreamReady = true;
      for (const msg of pendingFromClient) upstream.send(msg);
      pendingFromClient.length = 0;
    });

    client.on('message', (data, isBinary) => {
      touch();
      const payload = isBinary ? (data as Buffer) : data.toString();
      if (upstreamReady && upstream.readyState === WebSocket.OPEN) {
        upstream.send(payload);
      } else {
        pendingFromClient.push(payload);
      }
    });

    upstream.on('message', (data, isBinary) => {
      touch();
      if (client.readyState === WebSocket.OPEN) {
        client.send(isBinary ? (data as Buffer) : data.toString());
      }
    });

    // 心跳：偵測殭屍連線
    let alive = true;
    client.on('pong', () => {
      alive = true;
      touch();
    });
    const heartbeat = setInterval(() => {
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

    // 閒置逾時
    const idleCheck = setInterval(() => {
      if (Date.now() - lastActivity > env.WS_IDLE_TIMEOUT_SEC * 1000) {
        console.log('[asr-ws] 閒置逾時，關閉連線');
        closeAll();
      }
    }, 10_000);

    let closed = false;
    function closeAll() {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      clearInterval(idleCheck);
      try { client.close(); } catch {}
      try { upstream.close(); } catch {}
    }

    client.on('close', (code, reason) => { console.log(`[asr-ws] client closed: ${code} ${reason}`); closeAll(); });
    upstream.on('close', (code, reason) => { console.log(`[asr-ws] upstream(DashScope) closed: ${code} ${String(reason)}`); closeAll(); });
    client.on('error', (e) => { console.error('[asr-ws] client error', e.message); closeAll(); });
    upstream.on('error', (e) => { console.error('[asr-ws] upstream error', e.message); closeAll(); });
  });

  console.log(`[asr-ws] 已掛載於 ${ASR_PATH}（model=${env.DASHSCOPE_ASR_MODEL}）`);
}
