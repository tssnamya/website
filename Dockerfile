# The Style Syndicate — production image.
# Keeps SQLite + local image uploads; both live on mounted volumes so they
# persist across container restarts and redeploys.

FROM node:20-bookworm-slim

# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# SQLite database lives on the /data volume (overridable via env at runtime).
ENV DATABASE_URL="file:/data/prod.db"

# Install dependencies (dev deps are needed for the Next.js build).
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source and build the app + Prisma client.
COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Volume mount points for the database and uploaded images.
RUN mkdir -p /data /app/public/uploads && chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
