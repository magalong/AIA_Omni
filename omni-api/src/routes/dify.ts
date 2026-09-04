import { Hono } from 'hono';
import { env } from '../env.js';

// Dify chat-messages 端點（雲端版）
const DIFY_URL = 'https://api.dify.ai/v1/chat-messages';

const dify = new Hono();

// 轉發 Dify chat-messages（streaming SSE）。前端只送 body，金鑰由後端補上。
dify.post('/', async (c) => {
  if (!env.DIFY_API_KEY) {
    return c.json({ error: 'DIFY_API_KEY 未設定' }, 503);
  }

  const body = await c.req.json();

  const upstream = await fetch(DIFY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: c.req.raw.signal,
  });

  // 原樣串流回前端（SSE）
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});

export { dify };
