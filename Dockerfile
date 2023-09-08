FROM gcr.io/distroless/nodejs:18

WORKDIR /app

COPY dist /app

EXPOSE 3000

ENV NODE_ENV=production

CMD ["index.js"]
