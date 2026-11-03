# Minimal image for now (used by the one-shot migrate service). P1.11 slims it down
# (multi-stage, prod-only deps, non-root user) and adds the worker/web entry points.
FROM node:26.13.0-slim
RUN npm install -g pnpm@12.17.0
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
