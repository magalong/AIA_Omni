# omni-api

Hono + Node 後端，負責轉發 DashScope（ASR / TTS）與 Dify 等第三方 API（金鑰由後端補上），
並提供前端靜態檔。以 Docker 打包，部署到阿里雲 SAE。

## 開發

```bash
cd omni-api
npm install
cp .env.example .env
npm run dev
# http://localhost:8080/health
```

## Build

```bash
npm run build
npm start
```

## Docker

多階段 Dockerfile 會同時建置前端與後端，build context 需為專案根目錄：

```bash
# 於專案根目錄執行
docker build -t omni-api:latest -f omni-api/Dockerfile .
docker run --rm -p 8080:8080 --env-file omni-api/.env omni-api:latest
```

## 部署到阿里雲 SAE（流程概要）

1. `git push` 至 main → GitHub Actions 自動 build 並推送 image 至 ACR
2. ACR 推送事件經 EventBridge 通知 SAE 自動部署
3. 於 SAE 環境變數面板填入各 API key（`DASHSCOPE_API_KEY`、`DIFY_API_KEY`、`DASHSCOPE_WS_URL` 等）
4. 健康檢查路徑設為 `/health`
