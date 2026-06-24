FROM oven/bun:1.3.11 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run src/index.ts --build 2>/dev/null || true

FROM base AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./

RUN mkdir -p data

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
