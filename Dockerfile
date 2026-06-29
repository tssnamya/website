# The Style Syndicate — production image (PostgreSQL).
# Uploaded images live on a mounted volume; the database is an external Postgres
# (the bundled `db` service in docker-compose, or a managed Postgres / Neon).

FROM node:20-bookworm-slim

# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dummy URLs so Prisma Client can be generated/instantiated during the build.
# No connection is made at build time; real values come from the environment.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build?schema=public"

# Install deps. prisma/ is copied first so the `postinstall` (prisma generate)
# has the schema available.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Copy the source and build.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir -p /app/public/uploads && chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
