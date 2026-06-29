# The Style Syndicate — WhatsApp-Based Clothing Ordering Platform

A premium, production-ready product catalog where customers browse, pick a size,
enter delivery details, and place an order via **WhatsApp**. Orders are saved to
the database **before** WhatsApp opens (so leads are never lost), payment is
collected manually over **UPI**, and the owner verifies payment and manages
inventory and fulfilment from a secure admin panel.

There are exactly **two modules**: the customer **storefront** (`/`) and the
**admin panel** (`/admin`). There is no separate homepage — `/` is the catalog.

> **No payment gateway in v1.** The architecture is structured so payment gateways,
> customer accounts, carts and shipping integrations can be added later without
> major refactoring.

---

## Tech stack

| Layer        | Choice                                                           |
| ------------ | ---------------------------------------------------------------- |
| Framework    | **Next.js 16** (App Router) · React 19 · TypeScript              |
| Styling / UI | Tailwind CSS v4 · shadcn/ui · Framer Motion · lucide-react       |
| Backend      | Next.js Server Actions + Route Handlers                         |
| Database     | Prisma ORM — **PostgreSQL** (Neon on Vercel; local via Docker)  |
| Auth         | Secure JWT session (jose, HS256) in an httpOnly cookie · bcryptjs |
| Validation   | Zod + React Hook Form (client **and** server)                   |
| Images       | **sharp** (optimize + thumbnail) → local `public/uploads/` in dev, Cloudinary in prod |

> The spec requested Next.js 15; `create-next-app@latest` installs **16** (a
> superset with the same App Router / React 19 / Tailwind v4 stack). Everything
> maps 1:1.

---

## Quick start

```bash
npm install                 # install dependencies (also generates the Prisma client)
cp .env.example .env        # then edit values (see below)

docker compose up -d db     # start local PostgreSQL on :5433 (matches .env defaults)
npm run db:migrate          # apply migrations
npm run db:seed             # seed demo products + admin user + counter + settings

npm run dev                 # http://localhost:3000
```

> **Deploying to Vercel?** See **[VERCEL.md](VERCEL.md)**. Self-hosting with Docker?
> See **[DEPLOY.md](DEPLOY.md)** (`docker compose up -d --build` runs the app + Postgres).

- **Storefront:** <http://localhost:3000>
- **Admin:** <http://localhost:3000/admin> (no public link — bookmark it)

**Default admin login** (from `.env`, change before production):

- Email: `admin@thestylesyndicate.test`
- Password: `admin123`

> On Windows, if `npm`/`node` is "not recognized", open a fresh terminal (Node is
> on the user PATH) or prepend its folder, e.g.
> `C:\Users\<you>\node-v20.18.1-win-x64`.

---

## Environment variables (`.env`)

`.env` only seeds the **initial defaults**. After the first seed, almost all of
this is editable from **`/admin/settings`** with no code or `.env` changes.

| Variable                               | Purpose                                               |
| -------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`                         | Postgres **pooled** connection string (app runtime) |
| `DIRECT_URL`                           | Postgres **direct** connection string (migrations)  |
| `AUTH_SECRET`                          | Session signing secret (≥ 32 chars). **Change it.**   |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`       | Seeded admin credentials (`npm run db:seed`)          |
| `NEXT_PUBLIC_STORE_NAME`               | Initial brand name                                    |
| `NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER` | Initial WhatsApp number, **digits only** (e.g. `9198…`) |
| `NEXT_PUBLIC_UPI_ID`                   | Initial UPI ID                                        |
| `NEXT_PUBLIC_SUPPORT_EMAIL`            | Initial support email                                 |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Optional; enables Cloudinary image storage (needed in serverless prod) |

---

## Routes

Route groups `(shop)` / `(panel)` organize the code only — they do **not** appear
in the URL. `proxy.ts` (middleware) guards all `/admin/*` except `/admin/login`.
There is **no public link to `/admin`** anywhere on the storefront.

**Public (no auth):**

| URL               | Page                | Reachable from                                   |
| ----------------- | ------------------- | ------------------------------------------------ |
| `/`               | Catalog (search/filter/sort) | header logo + "Catalog", footer          |
| `/product/[slug]` | Product detail      | catalog product cards                            |
| `/policies`       | Exchange & Returns  | header, footer, product page "Learn more"        |

**Admin (login required):**

| URL                          | Page                              |
| ---------------------------- | --------------------------------- |
| `/admin/login`               | Login (only public admin page)    |
| `/admin`                     | Dashboard                         |
| `/admin/analytics`           | Analytics                         |
| `/admin/products`            | Product list                      |
| `/admin/products/new`        | Add product                       |
| `/admin/products/[id]/edit`  | Edit product                      |
| `/admin/inventory`           | Inventory (inline stock edit)     |
| `/admin/orders`              | Orders                            |
| `/admin/settings`            | Business settings                 |

**API / system:** `POST /api/admin/upload` (login-required image upload) ·
`/icon.png` (favicon) · `/_not-found` (404).

---

## How ordering works

```
Customer browses catalog (/)
        ↓ selects product → size → quantity
Fills delivery form → order saved to DB with Payment = PENDING   ← saved FIRST
        ↓ stock for that size is RESERVED (default 30 min)
WhatsApp opens with a pre-filled message (Order ID, items, address, totals)
        ↓
Owner shares the UPI QR → customer pays
        ↓
Admin verifies payment → "Mark Payment as Paid"   ← physical inventory deducted HERE
        ↓
Admin marks Packed → Shipped → Delivered
```

### Key business rules (all covered by `npm run verify`)

- **Order saved before WhatsApp** — the form persists the order, then opens
  WhatsApp. Abandoned checkouts still leave a record.
- **Temporary stock reservation (no oversell).** On checkout the quantity is
  *reserved* (`reservationExpiresAt = now + Settings.reservationMinutes`, default
  30). Customer-visible stock = `physical − active reservations`, so two customers
  cannot both buy the last unit. Creation runs in a transaction that updates the
  `Counter` row first (a write/row lock), serializing concurrent checkouts on
  SQLite and Postgres. Reservations auto-release on expiry or cancellation.
- **Inventory only drops on payment.** Physical stock is decremented only when an
  admin marks the order **Paid**, guarded by `inventoryDeducted` so it can never
  double-deduct. Cancelling a paid order **restocks** automatically.
- **Configurable shipping.** Flat charge + free-shipping threshold (Settings);
  grand total = subtotal + shipping, computed server-side.
- **Status gating.** Only `ACTIVE`, non-archived products appear in the catalog and
  are orderable; others 404.
- **Server is the source of truth.** Price, name, stock, shipping and totals are
  recomputed on the server — never trusted from the client.
- **Human order IDs** like `TSS-000123`, assigned atomically via the `Counter` row.

---

## Storefront (customer-facing)

- **Catalog** (`/`) — responsive product grid with search, category filter, and
  sort (newest / price), animated cards, and real-time stock badges (showing
  *available* stock, i.e. physical minus active reservations).
- **Product detail** (`/product/[slug]`) — image gallery, description, size chart,
  fabric/GSM/fit/care, size + quantity selectors, live price + shipping breakdown,
  and an **Exchange Policy** note.
- **Checkout** — a slide-over form (name, mobile, email, full address, optional
  delivery instructions) with polite, helpful validation. On submit the order is
  saved and WhatsApp opens with a clean, pre-filled message:

  ```
  Hello,
  I would like to place the following order.
  Order ID: TSS-000001
  Product / Size / Quantity / Unit Price
  Customer Name / Phone
  Delivery Address
  Subtotal / Shipping / Total
  Additional Instructions (if any)
  Please share the payment details to complete my order.
  ```
- **Exchange & Returns** (`/policies`) — the full policy, editable from Settings.

---

## Admin panel (`/admin`)

Protected by `proxy.ts` — all `/admin/*` require a valid session except
`/admin/login`. Every mutating action re-checks the session server-side. The whole
store is operable from the UI without ever touching the database.

- **Dashboard** — 8 live metrics (total/active products, today's/total orders,
  pending & paid orders, revenue, low/out-of-stock), recent orders, a
  "needs restock" quick-nav, and a recent-activity audit feed.
- **Analytics** — revenue (today / week / month / total) with a 7-day chart, order
  breakdown (pending/paid/cancelled/delivered), top performers (best seller /
  category / size), customers (total / repeat / new), and inventory health.
- **Products** — full CRUD with search + category + status filters. Fields: name,
  slug, short & full description, selling price, cost price, fabric, GSM, fit type,
  wash care, images, and per-size stock (M/L/XL). **Status** (Active / Inactive /
  Draft — only Active shows in the catalog), **Duplicate** (copies into a draft,
  stock reset), **Archive / Restore**, and **soft-delete** (products referenced by
  orders are archived to preserve order history; unreferenced ones hard-delete).
- **Inventory** — edit stock by size inline, with live search, category filter, and
  Green/Amber/Red indicators.
- **Orders** — searchable (order ID, name, phone) + filterable (payment, shipping,
  **date range**). Mark paid → packed → shipped → delivered, or cancel (with
  confirmation). Full details with **payment tracking** (UPI transaction ID,
  verified by/at, internal admin notes), **copy shortcuts** (phone, address, full
  order summary), and "Message Customer on WhatsApp".
- **Settings** — business name, WhatsApp number, UPI ID, payment instructions,
  shipping charge, free-shipping threshold, reservation timeout, low-stock
  threshold, contact email/phone, and the **Exchange & Return policy** (short
  summary + full text). All editable in the UI; `.env` only provides seed defaults.

### Exchange & Return policy

Editable in **Settings → Exchange & return policy**. The **summary** appears on
product pages, checkout, and the footer; the **full policy** renders on the
`/policies` page (linked from the header and footer). One setting drives all four
surfaces, so there is never a contradiction. Default: *size exchanges only, no
returns or refunds.*

### Local image uploads (no URL fields)

Product images are **uploaded from your computer** (drag & drop or file picker,
multiple at once, JPG/PNG/WEBP only — others rejected). The `/api/admin/upload`
route uses **sharp** to auto-rotate, cap dimensions (preserve aspect ratio),
**strip metadata**, **compress to WebP**, and **generate a thumbnail**. In dev,
files are written to `public/uploads/`; when Cloudinary env vars are set the same
route streams the optimized buffers to Cloudinary instead. Only URLs are stored.
Reorder by drag, set a primary, remove. `next/image` lazy-loads on the storefront.

### Audit log

Critical actions (product create/update/duplicate/status/archive/delete, inventory
update, payment verification, shipping update, order cancel, settings change) are
recorded in `AuditLog` and surfaced on the dashboard. The `AdminUser.role` field is
in place for future staff roles & permissions.

---

## Branding (logo & favicon)

- Site logo: `public/logo.png`, shown in the storefront header/footer and admin
  header/login. Rendered as a circular mark (`rounded-full`) at high resolution
  (256/640px source, quality 100) so it stays crisp when zoomed.
- Favicon: `src/app/icon.png` — a **circular** (transparent-corner) version of the
  logo, generated with sharp so the browser tab shows a round badge, not a square.

---

## Security

- JWT session (jose HS256) in an **httpOnly**, `sameSite=lax`, secure-in-prod
  cookie; 8-hour expiry. Passwords hashed with **bcrypt**.
- `proxy.ts` guards all `/admin/*` except login; forged/tampered tokens are
  rejected. Every mutating admin action calls `requireAdmin()`. `createOrder` is
  the only public write and re-validates everything server-side.
- **No raw SQL** (all Prisma, parameterized). **No `dangerouslySetInnerHTML`**;
  React auto-escapes and the WhatsApp message is URL-encoded. Server Actions have
  built-in CSRF/origin checks; the upload route is protected by the session cookie.
- All input validated with Zod on both client and server.
- No public link to the admin exists on the storefront.

---

## Database

8 models in `prisma/schema.prisma` (the authoritative source): **Product**,
**ProductImage**, **ProductInventory**, **Order**, **OrderItem**, **AdminUser**,
**Counter** (atomic order numbering + checkout lock), **Settings** (single-row,
no-code config), **AuditLog**. Money is stored as **integer rupees (INR)**. No
DB-native enums/arrays are used (status fields are strings validated in app code),
so the schema is portable between SQLite and PostgreSQL with no model changes. Hot
columns are indexed: `slug`, `phone`, `orderNumber`, `status`, `paymentStatus`,
`shippingStatus`, `reservationExpiresAt`, `createdAt`, `category`.

---

## Project structure

```
prisma/
  schema.prisma         # all 8 models
  seed.ts               # demo catalog + admin + counter + settings (from .env)
  verify.ts             # self-contained integration test (npm run verify)
public/
  logo.png              # brand logo (source for site logo + favicon)
  uploads/              # locally uploaded product images (gitignored)
src/
  proxy.ts              # Next 16 middleware: guards /admin/*
  app/
    layout.tsx          # fonts, metadata, Toaster; src/app/icon.png = favicon
    (shop)/             # storefront: catalog (/), product/[slug], policies
    admin/
      login/            # public login page
      (panel)/          # protected shell: dashboard, analytics, products,
                        #   inventory, orders, settings
    api/admin/upload/   # sharp image-upload route
  components/
    ui/                 # shadcn primitives
    shop/               # header, footer, product card/grid, order panel,
                        #   checkout sheet, size chart, stock badge
    admin/              # nav, page-header, stat-card, product-form, image-manager,
                        #   row-actions, filters, inventory-table, settings-form,
                        #   status-badge, copy-button, login-form
  lib/                  # db, auth, session, settings, validations, whatsapp,
                        #   format, audit, constants, config, types, cloudinary
  server/
    queries.ts          # read layer (catalog, admin, dashboard, analytics, reserved)
    actions/            # orders.ts, products.ts, settings.ts, auth.ts
```

---

## Scripts

| Script               | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | Start the dev server                                     |
| `npm run build`      | Production build                                         |
| `npm run start`      | Run the production build                                 |
| `npm run lint`       | ESLint (the script is `eslint`; `next lint` is removed in Next 16) |
| `npm run db:migrate` | Create/apply a migration                                 |
| `npm run db:seed`    | Seed products, admin, counter and settings               |
| `npm run db:reset`   | Drop, re-migrate and re-seed the DB                      |
| `npm run db:studio`  | Open Prisma Studio (visual DB browser)                   |
| `npm run verify`     | Order/inventory/reservation integration test (self-cleaning) |

---

## Testing & verification

- `npm run verify` → **11/11** assertions: order saved PENDING, no stock change on
  create, deduct-once on Paid, restock on cancel, reservation counts/blocks
  oversell, expiry releases. It creates and deletes its own throwaway DRAFT
  product, so it runs against any catalog state.
- `npm run lint` (0 problems), `npx tsc --noEmit` (0 errors), and `npm run build`
  all pass. Routing, auth-guard, status gating, upload security, and tampered-JWT
  rejection were also confirmed with live HTTP checks.

---

## Going to production

The database is **PostgreSQL** and the build is wired for serverless. Two paths:

- **Vercel (recommended)** — full step-by-step in **[VERCEL.md](VERCEL.md)**: create
  a Neon Postgres + Cloudinary, import the repo, set env vars, set the Build Command
  to `npm run vercel-build` (which runs `prisma migrate deploy`, bootstraps the admin,
  then builds). Deploys on every `git push`.
- **Self-hosted Docker** — see **[DEPLOY.md](DEPLOY.md)**: `docker compose up -d --build`
  runs the app + a Postgres database with persistent volumes.

**Connection pooling (serverless):** `DATABASE_URL` is the Neon **pooled** endpoint
(used at runtime); `DIRECT_URL` is the **direct** endpoint (used for migrations). The
Prisma client is a singleton (`lib/db.ts`).

**Image storage:** serverless filesystems are ephemeral, so **set the Cloudinary
env vars in production** — the upload route then streams optimized buffers to
Cloudinary automatically. No UI change.

### Pre-launch checklist

- [ ] Deploy to Vercel (public URL + HTTPS).
- [ ] Switch DB to Postgres (Neon/Supabase) + run `migrate deploy` + seed.
- [ ] Set Cloudinary env vars (for persistent image storage).
- [ ] Set a strong `AUTH_SECRET` and change the admin password from `admin123`.
- [ ] Set your real **UPI ID** in `/admin/settings` (WhatsApp number too).
- [ ] Add your real products with real photos.
- [ ] Do one end-to-end phone test of WhatsApp → UPI → mark paid → stock drop.

---

## Built to extend

Structured so these can be layered in without rework: Razorpay / PhonePe / Cashfree
payments, customer accounts, cart, wishlist, coupons, reviews, order tracking,
Shiprocket / Delhivery, email/SMS notifications.

- A payment gateway slots in between "order saved" and "mark paid" — the
  `Order.paymentStatus` lifecycle and the `markOrderPaid` inventory hook already
  model the transition.
- `OrderItem` supports multiple line items per order, so a cart is a UI change, not
  a schema change.
- Auth is isolated in `lib/auth.ts` + `lib/session.ts`; customer accounts can reuse
  the same session primitives.
- Settings (`/admin/settings`) and the `Settings` model make most business config
  changeable without code.
```
