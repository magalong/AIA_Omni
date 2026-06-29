import { defineConfig } from 'vite';

// 補齊無 fallback 指令、放行實際用到的外部來源。字型已自架，故不再放行 Google Fonts。
// dev 時 Vite 會用 JS 注入 <style>，需要 style-src 'unsafe-inline'；
// build 後 CSS 走外部檔，正式環境不需要 'unsafe-inline'。
function buildCsp(allowInlineStyle: boolean) {
  return [
    "default-src 'none'",
    "script-src 'self' blob:",
    `style-src 'self'${allowInlineStyle ? " 'unsafe-inline'" : ''}`,
    "font-src 'self'",
    "img-src 'self' data: https://aia-ai-omni.oss-cn-shanghai.aliyuncs.com",
    "media-src 'self' https://*.aliyuncs.com https://syntrend-html-omni.moonshine-studio.net",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}

const baseHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

const proxy = {
  '/tts': 'http://localhost:8080',
  '/dify': 'http://localhost:8080',
  '/asr': {
    target: 'http://localhost:8080',
    ws: true,
  },
};

export default defineConfig({
  build: {
    // 不要把字型 inline 成 data: URI；輸出成獨立檔，CSP font-src 'self' 才不會擋
    assetsInlineLimit: (filePath: string) =>
      /\.(woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
  },
  server: {
    // dev：Vite 注入 inline style，需要 'unsafe-inline'
    headers: { ...baseHeaders, 'Content-Security-Policy': buildCsp(true) },
    proxy,
  },
  preview: {
    // build 預覽：行為等同正式，不需要 'unsafe-inline'
    headers: { ...baseHeaders, 'Content-Security-Policy': buildCsp(false) },
    proxy,
  },
});
