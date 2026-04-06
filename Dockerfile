# syntax=docker/dockerfile:1
# Build : VITE_MEDIA_KIT_SECRET via build-arg (Compose lit automatiquement le .env pour l’interpolation).
#   docker compose build --no-cache && docker compose up -d
# Run : http://gabycrolage-web:8080 derrière NPM — env_file .env pour IG_* (runtime).

FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite prend d’abord process.env pour VITE_* — indispensable si le montage secret BuildKit ne fournit pas .env au build.
ARG VITE_MEDIA_KIT_SECRET
ENV VITE_MEDIA_KIT_SECRET=$VITE_MEDIA_KIT_SECRET

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
