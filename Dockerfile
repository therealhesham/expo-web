# syntax=docker/dockerfile:1

# ---- Build: export the Expo web app as static files ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# EXPO_PUBLIC_* vars are inlined into the JS bundle at build time, so they must
# be present here. In Coolify, set EXPO_PUBLIC_API_URL as an environment
# variable (with "Build Variable" enabled) to override this default.
ARG EXPO_PUBLIC_API_URL=https://rentapi.rawaes.com
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

RUN npx expo export --platform web --output-dir dist \
 && cp dist/+not-found.html dist/404.html

# ---- Serve: tiny static file server (Coolify's Traefik handles routing/SSL) ----
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve@14 && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY serve.json ./dist/serve.json

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/ >/dev/null || exit 1
CMD ["sh", "-c", "exec serve dist -l ${PORT:-3000} --no-clipboard"]
