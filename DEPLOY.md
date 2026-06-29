# Self-hosting with Docker (app + PostgreSQL)

`docker compose` runs the Next.js app **and** a PostgreSQL database together. The
database and uploaded images live on **named volumes**, so they survive restarts and
redeploys.

> Prefer a managed platform? See **[VERCEL.md](VERCEL.md)** for Vercel + Neon.

> Run **one** app instance and **back up the database volume** regularly (below).

---

## 1. Prerequisites

- A host with **Docker** + **Docker Compose** (a small VPS works: DigitalOcean,
  Hetzner, AWS Lightsail).
- This repository on the host (`git clone https://github.com/tssnamya/website.git`).

## 2. Configure environment

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set **real** values (the DB URLs already point at the
bundled `db` service):

```env
DATABASE_URL=postgresql://tss:tsspass@db:5432/tss?schema=public
DIRECT_URL=postgresql://tss:tsspass@db:5432/tss?schema=public
AUTH_SECRET=<openssl rand -base64 48>
ADMIN_EMAIL=you@yourbrand.com
ADMIN_PASSWORD=<a strong password>
NEXT_PUBLIC_STORE_NAME=The Style Syndicate
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=9198xxxxxxxx
NEXT_PUBLIC_UPI_ID=yourbrand@okhdfcbank
NEXT_PUBLIC_SUPPORT_EMAIL=orders@yourbrand.com
```

> For a stronger setup, change the Postgres password in both `docker-compose.yml`
> (the `db` service) and the `DATABASE_URL`/`DIRECT_URL` above.

`.env.production` is gitignored — never commit it.

## 3. Build & run

```bash
docker compose up -d --build
```

On startup the app container waits for Postgres to be healthy, then:
1. applies migrations (`prisma migrate deploy`),
2. ensures the admin user + settings exist (no demo products),
3. starts on port **3000**.

- Storefront: `http://<host>:3000`
- Admin: `http://<host>:3000/admin` (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

After launch, set your UPI ID / WhatsApp number / policy in **/admin/settings** and add
your products. Business config lives in the database, so changing it never needs a rebuild.

## 4. HTTPS (required for a real domain)

The container serves plain HTTP on 3000. Put a TLS reverse proxy in front:

- **Easiest — Caddy** (automatic Let's Encrypt). `Caddyfile`:
  ```
  yourdomain.com {
      reverse_proxy localhost:3000
  }
  ```
- Or Nginx / Traefik.

## 5. Updating / redeploying

```bash
git pull
docker compose up -d --build
```

Data is untouched — it lives on the `tss-pgdata` and `tss-uploads` volumes.

## 6. Backups (do this!)

```bash
# Dump the Postgres database
docker compose exec db pg_dump -U tss tss > backup-$(date +%F).sql
```

Restore: `cat backup.sql | docker compose exec -T db psql -U tss tss`. Store backups
off the server (e.g. upload to cloud storage on a cron).

---

## Notes

- The image is single-stage for build reliability. It can be slimmed with a
  multi-stage / `output: 'standalone'` build later if size matters.
- For local development, start just the database: `docker compose up -d db` (exposed on
  host port 5433), then `npm run db:migrate && npm run db:seed && npm run dev`.
