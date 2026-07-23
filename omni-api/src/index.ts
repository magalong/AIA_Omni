
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { env } from './env.js';
import { attachAsrWs } from './routes/asr-ws.js';
import { tts } from './routes/tts.js';
import { dify } from './routes/dify.js';

const app = new Hono();

app.use('*', logger());

app.use(
  '*',
  cors({
    origin: env.CORS_ORIGINS.includes('*') ? '*' : env.CORS_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// 安全 HTTP headers：套用在所有回應（含 serveStatic 發出的前端 HTML）
// 補齊 CSP 無 fallback 的指令（base-uri / form-action / frame-ancestors），
// 並放行實際用到的外部來源（OSS 圖、Google Fonts、R2 影片）
const CSP = [
  "default-src 'none'",
  "script-src 'self' blob:",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data: https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com",
  "media-src 'self' https://*.aliyuncs.com",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

app.use('*', async (c, next) => {
  await next();
  c.header('Content-Security-Policy', CSP);
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('X-Frame-Options', 'DENY');
});

app.get('/health', (c) => c.json({ status: 'ok', ts: Date.now() }));

app.route('/tts', tts);
app.route('/dify', dify);



// 前端靜態檔案（放在 /public 目錄）
app.use('/*', serveStatic({ root: './public' }));

// SPA fallback：所有未匹配的路由回 index.html
app.use('/*', serveStatic({ root: './public', path: 'index.html' }));

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`omni-api listening on http://0.0.0.0:${info.port}`);
});

// 掛載 DashScope ASR WebSocket 代理於 /asr
attachAsrWs(server as unknown as import('http').Server);
