# syntax=docker/dockerfile:1

# ---- Estágio 1: build (instala dependências) ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY src ./src

# ---- Estágio 2: runtime (imagem final enxuta) ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Usuário não-root (boas práticas de segurança de imagem)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/src ./src
COPY --chown=appuser:appgroup package.json ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
