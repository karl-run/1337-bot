FROM oven/bun:1.0

WORKDIR /app

COPY package.json /app
COPY bun.lockb /app
COPY src /app

RUN bun install --production

ENV NODE_ENV=production

EXPOSE 3000

CMD ["server.ts"]
