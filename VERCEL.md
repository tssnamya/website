# Deploying The Style Syndicate to Vercel

Vercel is serverless, so it needs a **hosted Postgres** (the app is already
configured for it) and **Cloudinary** for image storage (Vercel's disk is
ephemeral). This guide takes you from zero to live.

You'll create three free accounts: **Neon** (Postgres), **Cloudinary** (images),
and **Vercel** (hosting). Total time ~20 minutes.

---

## 1. Create the database (Neon)

1. Sign up at <https://neon.tech> and create a project (pick a region near your
   customers, e.g. AWS Mumbai `ap-south-1`).
2. In the project dashboard, open **Connection Details**. You need **two** strings:
   - **Pooled** connection (the host contains `-pooler`) → this is `DATABASE_URL`.
   - **Direct** connection (no `-pooler`) → this is `DIRECT_URL`.
   Both look like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require   # pooled
   postgresql://USER:PASSWORD@ep-xxxx.ap-south-1.aws.neon.tech/neondb?sslmode=require           # direct
   ```
   Keep both handy.

## 2. Create image storage (Cloudinary)

1. Sign up at <https://cloudinary.com>.
2. From the dashboard copy: **Cloud name**, **API Key**, **API Secret**.
   When these are set, the app automatically uploads product images to Cloudinary
   (no code change). Without them, uploads would be lost on Vercel.

## 3. Import the project into Vercel

1. Sign up at <https://vercel.com> with your GitHub account.
2. **Add New → Project →** import **`tssnamya/website`**.
3. Framework is auto-detected as **Next.js**. Before deploying, set the items below.

### Build Command (important)

Override the **Build Command** (Project → Settings → General → Build & Output) to:

```
npm run vercel-build
```

This runs `prisma migrate deploy` (creates the tables in Neon) → bootstraps the
admin & settings → `next build`. (`prisma generate` runs automatically via
`postinstall`.)

### Environment Variables

Add these (Project → Settings → Environment Variables), for **Production** (and
Preview if you want):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_URL` | Neon **direct** connection string |
| `AUTH_SECRET` | a long random string — `openssl rand -base64 48` |
| `ADMIN_EMAIL` | your admin login email |
| `ADMIN_PASSWORD` | a strong admin password |
| `NEXT_PUBLIC_STORE_NAME` | `The Style Syndicate` |
| `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER` | your number, digits only (e.g. `9198…`) |
| `NEXT_PUBLIC_UPI_ID` | your UPI ID |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | your support email |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
| `CLOUDINARY_API_KEY` | from Cloudinary |
| `CLOUDINARY_API_SECRET` | from Cloudinary |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | same as `CLOUDINARY_CLOUD_NAME` |

## 4. Deploy

Click **Deploy**. The build will:
1. install deps (and generate the Prisma client),
2. apply migrations to Neon,
3. create your admin user + settings,
4. build and deploy.

When it's done you get a URL like `https://website-xxxx.vercel.app`.

- Storefront: `https://<your-url>/`
- Admin: `https://<your-url>/admin` (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

## 5. Go live

1. In **/admin/settings** set your real UPI ID, WhatsApp number, shipping, and
   policy (these are stored in the database — no redeploy needed to change them).
2. Add your products with photos (uploads go to Cloudinary automatically).
3. Add a **custom domain** in Vercel → Settings → Domains (Vercel provisions HTTPS).
4. Do one real phone test: place an order → WhatsApp opens → pay UPI → mark paid →
   confirm stock drops.

---

## Updating the site later

Push to GitHub `main` → Vercel auto-deploys. Migrations apply automatically during
each build (idempotent). Your data in Neon is untouched.

## Notes & gotchas

- **Two URLs are required.** `DATABASE_URL` (pooled) is used by the app at runtime;
  `DIRECT_URL` (direct) is used by migrations. Don't swap them.
- If migrations fail on the pooled URL, ensure `DIRECT_URL` is the **direct** Neon
  string. If Prisma complains about prepared statements on the pooled connection,
  append `&pgbouncer=true` to `DATABASE_URL`.
- The admin password is created on first deploy from `ADMIN_PASSWORD`. To change it
  later, update the env var and redeploy (there's no in-app password change yet).
- Free tiers are fine to start; Neon and Vercel both scale up when you need it.

## Local development after this change

The app now uses Postgres everywhere. For local dev, run a local Postgres and point
`.env` at it:

```bash
docker compose up -d db          # starts Postgres on localhost:5433
# .env already has: DATABASE_URL / DIRECT_URL = postgresql://tss:tsspass@localhost:5433/tss
npm run db:migrate               # or db:deploy
npm run db:seed                  # demo products for local testing
npm run dev
```
