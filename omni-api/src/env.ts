function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const PORT = Number(process.env.PORT ?? 8080);

// 預設空白：沒設環境變數時「不放行任何跨域」，避免正式環境誤帶 ACAO: *
// （前端與 API 同源，本來就不需要 CORS；要開放跨域再透過 CORS_ORIGINS 明確指定）
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// WebSocket 來源白名單；預設空白＝只允許同源（填 * 才是不檢查，僅開發用）
const WS_ALLOWED_ORIGINS = (process.env.WS_ALLOWED_ORIGINS ?? '')
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
  // Dify 聊天 API（雲端版預設；自架請改成你的網域 + /v1/chat-messages）
  DIFY_API_KEY: process.env.DIFY_API_KEY ?? '',
  DIFY_API_URL:
    process.env.DIFY_API_URL ?? 'https://api.dify.ai/v1/chat-messages',
  // 連線閒置（無音訊）超過此秒數即關閉
  WS_IDLE_TIMEOUT_SEC: Number(process.env.WS_IDLE_TIMEOUT_SEC ?? 120),
  // 心跳秒數
  WS_HEARTBEAT_SEC: Number(process.env.WS_HEARTBEAT_SEC ?? 30),
};

export { required };
