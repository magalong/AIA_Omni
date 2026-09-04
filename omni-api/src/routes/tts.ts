import { Hono } from 'hono';
import { env } from '../env.js';

// DashScope TTS 端點（中國區）
const TTS_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

const tts = new Hono();

tts.post('/', async (c) => {


  if (!env.DASHSCOPE_API_KEY) {
    return c.json({ error: 'DASHSCOPE_API_KEY 未設定' }, 503);
  }

  const body = await c.req.json();

  const upstream = await fetch(TTS_URL, {
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
