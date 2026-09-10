FROM node:20-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV=production
ENV DB_PATH=/app/data/class-records.db
ENV MIGRATIONS_PATH=/app/server/db/migrations
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "scripts/start.sh"]
