# Build frontend → servir uniquement les fichiers statiques (nginx alpine).
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Injecté au build (comme avec Vite ailleurs) — obligatoire pour que /mk/<secret> fonctionne.
ARG VITE_MEDIA_KIT_SECRET
ENV VITE_MEDIA_KIT_SECRET=$VITE_MEDIA_KIT_SECRET

RUN pnpm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
