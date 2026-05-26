import { Hono } from 'hono';
import { env } from '../env.js';

const tts = new Hono();

tts.post('/', async (c) => {
  console.log('[tts] DASHSCOPE_API_KEY:', env.DASHSCOPE_API_KEY ? `${env.DASHSCOPE_API_KEY.slice(0, 6)}...${env.DASHSCOPE_API_KEY.slice(-4)}` : '(空)');
  console.log('[tts] DASHSCOPE_TTS_URL:', env.DASHSCOPE_TTS_URL);

  if (!env.DASHSCOPE_API_KEY) {
    return c.json({ error: 'DASHSCOPE_API_KEY 未設定' }, 503);
  }

  const body = await c.req.json();

  const upstream = await fetch(env.DASHSCOPE_TTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: c.req.raw.signal,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
  });
});

export { tts };
