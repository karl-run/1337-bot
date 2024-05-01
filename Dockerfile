FROM oven/bun:1

WORKDIR /app
COPY dist/server.js /app/server.js

EXPOSE 3000

ENV NODE_ENV=production

CMD ["server.js"]
