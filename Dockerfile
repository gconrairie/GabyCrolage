# syntax=docker/dockerfile:1
# Build :
#   docker compose build --no-cache && docker compose up -d
# Run : http://gabycrolage-web:8080 derrière NPM — env_file .env pour IG_* (runtime).

FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

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
