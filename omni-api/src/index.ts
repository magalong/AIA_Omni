import { existsSync } from 'node:fs';
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

app.get('/health', (c) => c.json({ status: 'ok', ts: Date.now() }));

app.route('/tts', tts);
app.route('/dify', dify);

// TODO: 路由將陸續從 Cloudflare Workers 搬遷至此
// app.route('/azure', azureRoutes);
// app.route('/elevenlabs', elevenlabsRoutes);

// 前端靜態檔案（放在 /public 目錄）
app.use('/*', serveStatic({ root: './public' }));

// SPA fallback：所有未匹配的路由回 index.html
app.use('/*', serveStatic({ root: './public', path: 'index.html' }));

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`omni-api listening on http://0.0.0.0:${info.port}`);
});

// 掛載 DashScope ASR WebSocket 代理於 /asr
attachAsrWs(server as unknown as import('http').Server);
