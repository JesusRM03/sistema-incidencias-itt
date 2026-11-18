FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng fonts-dejavu-core util-linux && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/scripts ./scripts
RUN mkdir -p /app/var/evidencias /app/artifacts && chown node:node /app/var/evidencias /app/artifacts
COPY --chmod=0555 deploy/start.sh /usr/local/bin/itt-start
USER node
ENTRYPOINT ["/usr/local/bin/itt-start"]
CMD ["node", "server/index.js"]
