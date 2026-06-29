#!/bin/sh
# Container startup: apply migrations, ensure admin/settings exist, then serve.
set -e

echo "[entrypoint] Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy

echo "[entrypoint] Ensuring admin user, counter and settings exist..."
npm run db:bootstrap

echo "[entrypoint] Starting The Style Syndicate on port ${PORT:-3000}..."
exec npm run start
