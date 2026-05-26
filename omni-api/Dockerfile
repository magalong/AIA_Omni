# --- 1. build 前端 ---
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json vite.config.ts ./
COPY index.html ./
COPY src ./src
RUN npm run build

# --- 2. build 後端 ---
FROM node:20-alpine AS backend
WORKDIR /app
COPY omni-api/package.json omni-api/package-lock.json* ./
RUN npm install
COPY omni-api/tsconfig.json ./
COPY omni-api/src ./src
RUN npm run build && npm prune --omit=dev

# --- 3. 最終 image ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# 後端
COPY --from=backend /app/node_modules ./node_modules
COPY --from=backend /app/dist ./dist
COPY --from=backend /app/package.json ./package.json

# 前端打包產物放進 public/
COPY --from=frontend /frontend/dist ./public

EXPOSE 8080
CMD ["node", "dist/index.js"]
