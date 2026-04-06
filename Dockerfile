# syntax=docker/dockerfile:1
# Build : secret BuildKit id=dotenv → Vite lit /app/.env (pas copié dans l’image).
#   docker compose build   OU   docker build --secret id=dotenv,src=.env -t gabycrolage:latest .
# Run (port interne 8080 — Nginx Proxy Manager : http://gabycrolage-web:8080, sans TLS sur le conteneur) :
#   docker compose up -d   OU   docker run -d --env-file .env … gabycrolage:latest

FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN --mount=type=secret,id=dotenv,target=/app/.env \
  pnpm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY lib ./lib
COPY api ./api
COPY serve-prod.mjs ./serve-prod.mjs

RUN chown -R node:node /app
USER node

EXPOSE 8080
CMD ["node", "serve-prod.mjs"]
