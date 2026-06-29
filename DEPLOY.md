# Deploying The Style Syndicate (Docker + SQLite)

This app ships as a Docker image that **keeps SQLite and local image uploads**.
The database (`/data/prod.db`) and uploaded images (`/app/public/uploads`) live on
**named volumes**, so they survive restarts and redeploys.

> **Important:** run **exactly one instance** (SQLite is single-writer), and **back
> up the database volume** regularly (see below).

---

## 1. Prerequisites

- A host with **Docker** + **Docker Compose** (a small VPS works: DigitalOcean,
  Hetzner, AWS Lightsail; or a PaaS like Railway / Render / Fly.io).
- This repository on the host (`git clone https://github.com/tssnamya/website.git`).

## 2. Configure environment

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set **real** values:

```env
DATABASE_URL=file:/data/prod.db          # leave as-is (the volume path)
AUTH_SECRET=<openssl rand -base64 48>     # a long random string
ADMIN_EMAIL=you@yourbrand.com
ADMIN_PASSWORD=<a strong password>
NEXT_PUBLIC_STORE_NAME=The Style Syndicate
NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER=9198xxxxxxxx   # digits only
NEXT_PUBLIC_UPI_ID=yourbrand@okhdfcbank
NEXT_PUBLIC_SUPPORT_EMAIL=orders@yourbrand.com
```

Generate a secret: `openssl rand -base64 48`

`.env.production` is gitignored — never commit it.

## 3. Build & run

```bash
docker compose up -d --build
```

On first boot the container automatically:
1. applies database migrations (`prisma migrate deploy`),
2. ensures the admin user + settings exist (no demo products),
3. starts the app on port **3000**.

- Storefront: `http://<host>:3000`
- Admin: `http://<host>:3000/admin` (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

After launch, set your UPI ID, WhatsApp number and policy in **/admin/settings**, and
add your products. WhatsApp/UPI/business config is stored in the database, so changing
it never requires a rebuild.

## 4. HTTPS (required for a real domain)

The container serves plain HTTP on 3000. Put a TLS-terminating reverse proxy in front:

- **Easiest — Caddy** (automatic Let's Encrypt HTTPS). Example `Caddyfile`:
  ```
  yourdomain.com {
      reverse_proxy localhost:3000
  }
  ```
- Or Nginx/Traefik, or use a **PaaS** (Railway/Render/Fly) which provides HTTPS for you.

## 5. Updating / redeploying

```bash
git pull
docker compose up -d --build
```

Your data is untouched — it lives on the `tss-db` and `tss-uploads` volumes, not in
the container.

## 6. Backups (do this!)

Your entire database is one file on the `tss-db` volume. Back it up regularly:

```bash
# Copy the live DB out of the running container (good enough for low traffic)
docker compose cp web:/data/prod.db ./backup-$(date +%F).db
```

For a guaranteed-consistent snapshot, briefly stop first:
```bash
docker compose stop web
docker compose cp web:/data/prod.db ./backup-$(date +%F).db   # or copy the volume
docker compose start web
```

Store backups off the server (e.g. upload to cloud storage on a cron).

---

## Deploying on a PaaS (Railway / Render / Fly.io)

These detect the `Dockerfile` automatically. You must:

1. Add a **persistent volume** mounted at **`/data`** (the database) and another at
   **`/app/public/uploads`** (images). *(On Fly.io, declare volumes in `fly.toml`;
   on Railway/Render, add a volume in the service settings.)*
2. Set the environment variables from `.env.production` in the dashboard.
3. Ensure only **one** instance/replica runs.

---

## Notes

- The image is single-stage (~2.4 GB) for build reliability. It can be slimmed with a
  multi-stage / `output: 'standalone'` build later if image size matters.
- To move to Postgres in the future, switch the datasource provider in
  `prisma/schema.prisma` and set a Postgres `DATABASE_URL`; no app code changes needed.
