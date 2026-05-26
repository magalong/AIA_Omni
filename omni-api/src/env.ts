function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const PORT = Number(process.env.PORT ?? 8080);

const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// WebSocket 來源白名單；填 * 表示不檢查（僅開發用）
const WS_ALLOWED_ORIGINS = (process.env.WS_ALLOWED_ORIGINS ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const env = {
  PORT,
  CORS_ORIGINS,
  WS_ALLOWED_ORIGINS,
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY ?? '',
  DASHSCOPE_ASR_MODEL: process.env.DASHSCOPE_ASR_MODEL ?? 'qwen3-asr-flash-realtime-2026-02-10',
  DASHSCOPE_WS_URL:
    process.env.DASHSCOPE_WS_URL ??
    'wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime',
  DASHSCOPE_TTS_URL:
    process.env.DASHSCOPE_TTS_URL ??
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  // 連線閒置（無音訊）超過此秒數即關閉
  WS_IDLE_TIMEOUT_SEC: Number(process.env.WS_IDLE_TIMEOUT_SEC ?? 120),
  // 心跳秒數
  WS_HEARTBEAT_SEC: Number(process.env.WS_HEARTBEAT_SEC ?? 30),
};

export { required };
