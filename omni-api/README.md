# omni-api

Hono + Node 後端，負責轉發 Azure / Dify / ElevenLabs 等第三方 API。
未來打包 Docker 部署到阿里雲 SAE。

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

```bash
docker build -t omni-api:latest .
docker run --rm -p 8080:8080 --env-file .env omni-api:latest
```

## 部署到阿里雲 SAE（流程概要）

1. 推 image 到阿里雲容器映像服務（ACR）
2. SAE 建立應用，選擇 ACR image
3. 環境變數面板填入 `CORS_ORIGINS` 與各 API key
4. 健康檢查路徑設為 `/health`
5. 綁定自有網域並啟用 HTTPS
