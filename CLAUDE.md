@AGENTS.md

# The Style Syndicate — Project Guide

A premium, WhatsApp-based clothing ordering platform. Customers browse a catalog,
pick a size, enter delivery details, and place an order via WhatsApp (no online
payment gateway). The business confirms payment over UPI and runs everything from
a secure admin panel. Built to evolve into full e-commerce later.

There are exactly **two modules**: the customer storefront (`/`) and the admin
panel (`/admin`). There is no separate homepage — `/` is the catalog.

---

## ⚠️ Critical environment & operational notes (read first)

- **OS is Windows.** Primary shell is PowerShell; a Bash tool (Git Bash) is also
  available. Working directory: `c:\0`. **Not a git repo.**
- **Node.js is NOT globally installed.** It lives at
  `C:\Users\namya\node-v20.18.1-win-x64`. It is on the persistent **user PATH**,
  but freshly opened terminals (and the VS Code integrated terminal, if it was
  open before the PATH change) may not see it. **Always prepend it in scripts:**
  ```powershell
  $env:Path = "C:\Users\namya\node-v20.18.1-win-x64;$env:Path"
  ```
- **Prisma `generate` EPERM:** a running `next dev` server locks
  `node_modules/.prisma/client/query_engine-windows.dll.node`. Before
  `prisma migrate dev` / `prisma generate`, **stop Node first**:
  `Get-Process node | Stop-Process -Force`. After a schema change, the dev server
  must be restarted to pick up the new client.
- **Next 16 allows only ONE `next dev` instance.** The user typically runs theirs
  on **port 3000**. A second instance exits with "Another next dev server is
  already running." To test, hit their `:3000` server, or stop it first.
- **`@prisma/client` auto-loads `.env`** at runtime, so `tsx`/`node` scripts in
  `prisma/` resolve `DATABASE_URL` without manual dotenv loading.
- **Favicon caching:** browsers cache favicons hard; after changing the logo,
  hard-refresh (Ctrl+Shift+R).
- **`NEXT_PUBLIC_*` env changes require a dev-server restart** to take effect.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router) · React 19 · TypeScript |
| Styling/UI | Tailwind CSS v4 · shadcn/ui (radix-ui unified pkg) · Framer Motion · lucide-react |
| Backend | Next.js Server Actions + Route Handlers |
| ORM/DB | Prisma 6 · **PostgreSQL** (local: `docker compose up -d db` on :5433; prod: Neon/Vercel). `directUrl` for migrations. |
| Auth | Custom JWT session (jose, HS256) in an httpOnly cookie · bcryptjs |
| Validation | Zod + React Hook Form (client and server) |
| Images | **sharp** (optimize/thumbnail) → local `public/uploads` in dev, Cloudinary in prod |

> Spec asked for Next.js 15; `create-next-app@latest` installed **16** (a superset
> with the same App Router / React 19 / Tailwind v4 stack). All features map 1:1.

---

## Commands

```powershell
npm run dev          # dev server (storefront :3000, admin at /admin)
npm run build        # production build
npm run start        # run production build
npm run lint         # ESLint (script is `eslint`; `next lint` is REMOVED in Next 16)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed products + admin + counter + settings
npm run db:reset     # drop, re-migrate, re-seed
npm run db:studio    # Prisma Studio (visual DB browser, :5555)
npm run verify       # self-contained integration test (order/inventory/reservation rules)
```

Always confirm green: `npm run lint` (0 problems), `npx tsc --noEmit` (0 errors),
`npm run verify` (currently 11/11), `npm run build`.

---

## Directory map

```
prisma/
  schema.prisma          # Product, ProductImage, ProductInventory, Order, OrderItem,
                         # AdminUser, Counter, AuditLog, Settings
  seed.ts                # sample catalog + admin + counter + settings (from .env)
  verify.ts              # self-cleaning integration test (creates a throwaway product)
public/
  logo.jpeg              # brand logo (used as site logo + favicon source)
  uploads/               # locally uploaded product images (gitignored)
src/
  app/
    layout.tsx           # root layout: fonts (Inter + Playfair), metadata, Toaster, logo favicon (icon.jpeg)
    (shop)/              # storefront group (header + footer)
      page.tsx           # catalog "/" (search/category/sort)
      product/[slug]/    # product detail
      policies/          # Exchange & Returns page (reads Settings)
    admin/
      login/             # public login page (server shell + client LoginForm in Suspense)
      (panel)/           # auth-guarded shell: dashboard, analytics, products, inventory, orders, settings
    api/admin/upload/    # sharp image upload route (multipart -> webp + thumbnail)
  components/
    ui/                  # shadcn primitives
    shop/                # site-header, site-footer, product-card/grid, order-panel, checkout-sheet, size-chart, stock-badge
    admin/               # nav, page-header, stat-card, product-form, image-manager, product/order row-actions,
                         # filters, inventory-table, settings-form, status-badge, copy-button, login-form
  lib/                   # db, auth, session, settings, validations, whatsapp, format, audit, constants, config, types, cloudinary, utils
  server/
    queries.ts           # read layer (catalog, admin products, orders, dashboard, analytics, reserved-stock)
    actions/             # orders.ts, products.ts, settings.ts, auth.ts (all server actions)
  proxy.ts               # Next 16 middleware: guards /admin/* (was middleware.ts)
```

---

## Routes

Route groups `(shop)` / `(panel)` are organizational only — they do **not** appear in the
URL. `proxy.ts` guards all `/admin/*` except `/admin/login`. Public pages are `/`,
`/product/[slug]`, and `/policies`; everything else 404s. There is **no public link to
`/admin`** anywhere on the storefront (reachable only by typing the URL + logging in).

**Public (no auth):**

| URL | Page | Linked from |
| --- | --- | --- |
| `/` | Catalog (search / filter / sort) | header logo + "Catalog", footer "Catalog" |
| `/product/[slug]` | Product detail | catalog product cards |
| `/policies` | Exchange & Returns | header "Exchange & Returns", footer, product "Learn more" |

**Admin (login required, guarded by `proxy.ts`):**

| URL | Page | Linked from |
| --- | --- | --- |
| `/admin/login` | Login (the only public admin page) | auto-redirect when unauthenticated |
| `/admin` | Dashboard | admin sidebar nav |
| `/admin/analytics` | Analytics (revenue/orders/customers) | admin sidebar nav |
| `/admin/products` | Product list (search/filter, CRUD) | admin sidebar nav |
| `/admin/products/new` | Add product | "Add Product" button |
| `/admin/products/[id]/edit` | Edit product | product row "Edit", inventory rows, dashboard |
| `/admin/inventory` | Inventory (inline stock editing) | admin sidebar nav |
| `/admin/orders` | Orders (payment/shipping lifecycle) | admin sidebar nav |
| `/admin/settings` | Business settings | admin sidebar nav |

**API / system:**

| URL | Purpose |
| --- | --- |
| `POST /api/admin/upload` | Image upload (login-required; sharp → WebP + thumbnail) |
| `/icon.png` | Favicon (circular logo, `src/app/icon.png`) |
| `/_not-found` | 404 page |

---

## Database models (key points)

- **Product**: name, slug(unique), category, shortDescription, description, price(₹ int),
  costPrice?, fabric, gsm?, fitType, washInstructions, **status** (`ACTIVE`/`INACTIVE`/`DRAFT`),
  **archivedAt** (soft delete). Indexed: status, archivedAt, category.
- **ProductImage**: url, **thumbnailUrl?**, displayOrder. First image = primary.
- **ProductInventory**: per (productId, size) unique; `stock` is **physical** stock.
- **Order**: orderNumber(unique int → `TSS-000123`), customer + address fields, notes
  (customer delivery instructions), paymentStatus(`PENDING`/`PAID`), shippingStatus
  (`NOT_STARTED`/`PACKED`/`SHIPPED`/`DELIVERED`), subtotal, shippingCharge, totalAmount,
  **inventoryDeducted** (double-deduct guard), **reservationExpiresAt**, paidAt, cancelledAt,
  upiTransactionId, paymentVerifiedBy/At, adminNotes. Indexed: paymentStatus, shippingStatus,
  createdAt, phone, reservationExpiresAt.
- **OrderItem**: productId? (SetNull on delete), denormalized productName, size, qty, unitPrice, subtotal.
- **AdminUser**: email(unique), passwordHash (bcrypt), role (`OWNER`, future staff roles).
- **Counter**: single row `id="order"` → atomic order numbering (also acts as a write lock).
- **AuditLog**: actorEmail, action, entity, entityId?, summary, createdAt.
- **Settings**: single row `id="singleton"` — businessName, whatsappNumber, upiId,
  paymentInstructions, shippingCharge, freeShippingThreshold, reservationMinutes,
  lowStockThreshold, contactEmail, contactPhone, **policySummary**, **returnPolicy**.

### Full schema (`prisma/schema.prisma`)

Provider is `postgresql` (Neon in prod, local Docker Postgres in dev). All money fields are
**integer rupees (INR)**. No DB-native enums/arrays are used, so the schema is portable
between SQLite and PostgreSQL with no model changes. String "enums" (status fields) are
validated in app code via Zod + the unions in `src/lib/constants.ts`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // pooled connection (app runtime)
  directUrl = env("DIRECT_URL") // direct connection (migrations)
}

model Product {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  category         String
  shortDescription String   @default("")
  description      String   @default("")
  price            Int // selling price, whole rupees (INR)
  costPrice        Int? // optional, for profit reporting
  fabric           String   @default("")
  gsm              Int? // optional fabric weight
  fitType          String   @default("")
  washInstructions String   @default("")
  status           String   @default("DRAFT") // ACTIVE | INACTIVE | DRAFT
  archivedAt       DateTime? // soft delete: hidden everywhere, order history preserved
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  images     ProductImage[]
  inventory  ProductInventory[]
  orderItems OrderItem[]

  @@index([status])
  @@index([archivedAt])
  @@index([category])
}

model ProductImage {
  id           String  @id @default(cuid())
  productId    String
  url          String // optimized full-size image (local /uploads or Cloudinary)
  thumbnailUrl String? // generated thumbnail
  displayOrder Int     @default(0)
  product      Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
}

model ProductInventory {
  id        String  @id @default(cuid())
  productId String
  size      String // "M" | "L" | "XL"
  stock     Int     @default(0) // physical stock (reservations are computed, not stored here)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, size])
  @@index([productId])
}

model Order {
  id                   String    @id @default(cuid())
  orderNumber          Int       @unique // rendered as TSS-000001; assigned atomically via Counter
  customerName         String
  phone                String
  email                String?
  houseFlat            String
  street               String
  landmark             String?
  city                 String
  state                String
  pincode              String
  paymentStatus        String    @default("PENDING") // PENDING | PAID
  shippingStatus       String    @default("NOT_STARTED") // NOT_STARTED | PACKED | SHIPPED | DELIVERED
  subtotal             Int       @default(0) // items subtotal before shipping
  shippingCharge       Int       @default(0)
  totalAmount          Int // grand total = subtotal + shippingCharge
  notes                String? // customer delivery instructions
  inventoryDeducted    Boolean   @default(false) // guards against double stock decrement
  reservationExpiresAt DateTime? // stock reservation lapses at this time while pending
  paidAt               DateTime?
  cancelledAt          DateTime? // order is cancelled when set
  upiTransactionId     String? // payment tracking
  paymentVerifiedBy    String?
  paymentVerifiedAt    DateTime?
  adminNotes           String? // internal, not shared with customer
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  items OrderItem[]

  @@index([paymentStatus])
  @@index([shippingStatus])
  @@index([createdAt])
  @@index([phone])
  @@index([reservationExpiresAt])
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String? // nullable so order history survives product deletion
  productName String // denormalized snapshot
  size        String
  quantity    Int
  unitPrice   Int
  subtotal    Int
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@index([productId])
}

model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String // bcrypt
  role         String   @default("OWNER") // future: OWNER | STAFF
  createdAt    DateTime @default(now())
}

// Atomic sequence generator; row id="order" backs TSS-000001 numbers and acts
// as the write-lock that serializes concurrent checkouts (oversell prevention).
model Counter {
  id    String @id
  value Int    @default(0)
}

// Single-row business settings (id="singleton"), editable from /admin/settings.
model Settings {
  id                    String   @id @default("singleton")
  businessName          String   @default("The Style Syndicate")
  whatsappNumber        String   @default("")
  upiId                 String   @default("")
  paymentInstructions   String   @default("")
  shippingCharge        Int      @default(0)
  freeShippingThreshold Int      @default(0) // 0 = no free-shipping rule
  reservationMinutes    Int      @default(30)
  lowStockThreshold     Int      @default(3)
  contactEmail          String   @default("")
  contactPhone          String   @default("")
  policySummary         String   @default("Size exchanges only. Returns and refunds are not available.")
  returnPolicy          String   @default("…full exchange/return policy text…")
  updatedAt             DateTime @updatedAt
}

// Audit trail for critical admin actions.
model AuditLog {
  id         String   @id @default(cuid())
  actorEmail String
  action     String // e.g. PRODUCT_CREATED, PAYMENT_VERIFIED, SETTINGS_CHANGED
  entity     String // PRODUCT | ORDER | SETTINGS
  entityId   String?
  summary    String
  createdAt  DateTime @default(now())

  @@index([createdAt])
  @@index([entity])
}
```

> The authoritative source is `prisma/schema.prisma`. After editing it: stop Node
> (DLL lock), then `npm run db:migrate` (regenerates the client), then restart dev.

---

## Core business rules (these are tested in `prisma/verify.ts`)

1. **Order saved BEFORE WhatsApp.** Checkout persists the order, then opens WhatsApp.
2. **Temporary stock reservation (no oversell).** On checkout the quantity is *reserved*
   (`reservationExpiresAt = now + Settings.reservationMinutes`, default 30). Displayed/customer
   stock = **physical − active reservations** (`computeReservedMap` in queries.ts). A reservation
   is "active" while: PENDING, not cancelled, not deducted, and `reservationExpiresAt > now`.
   Creation runs in a transaction that **updates the Counter row first** (write/row lock),
   serializing concurrent checkouts on SQLite and Postgres → prevents overselling.
3. **Inventory only drops on payment.** Physical `ProductInventory.stock` is decremented
   only when admin marks an order **Paid** (`markOrderPaid`), guarded by `inventoryDeducted`
   so it never double-deducts. Marking paid also clears the reservation and records
   `paymentVerifiedBy/At`.
4. **Expiry is lazy.** Expired reservations simply stop counting (availability auto-restores).
   There is **no cron sweep** — an expired pending order stays PENDING (admin sees "Reservation
   expired"). A scheduled cleanup is a future enhancement.
5. **Cancel** releases the reservation immediately and restocks if it was already deducted.
6. **Status/visibility gating.** Only `status==="ACTIVE" && archivedAt===null` products appear
   in the catalog / are orderable; others 404 on the detail page.
7. **Server is source of truth.** Price, name, stock, shipping, totals are recomputed server-side
   in `createOrder` — never trusted from the client.
8. **Shipping** = flat `shippingCharge`, free when subtotal ≥ `freeShippingThreshold` (>0).
   Grand total = subtotal + shipping.
9. **Soft delete:** `deleteProduct` hard-deletes only if unreferenced by orders; otherwise it
   archives (preserves order history).

---

## Auth & security

- Login (`/admin/login`) → `verifyCredentials` (bcrypt) → `createSessionCookie` (jose HS256,
  httpOnly, sameSite=lax, secure in prod, 8h).
- `proxy.ts` guards all `/admin/*` except `/admin/login`; tampered/forged tokens are rejected.
- Every **mutating** admin server action calls `requireAdmin()`. `createOrder` is public.
- No raw SQL (all Prisma, parameterized). No `dangerouslySetInnerHTML`. Zod validates all input.
- Audit logging on: product create/update/duplicate/status/archive/delete, inventory update,
  payment verification, shipping update, order cancel, settings change.

---

## Settings = no-code configuration

Almost everything the business needs is editable at **`/admin/settings`** (DB `Settings`
singleton), so no code/`.env` edits are needed to change: business name, WhatsApp number,
UPI ID, payment instructions, shipping charge, free-shipping threshold, reservation timeout,
low-stock threshold, contact email/phone, and the **Exchange & Return policy** (summary +
full text). `.env` `NEXT_PUBLIC_*` values only seed the initial defaults. `getSettings()`
(lib/settings.ts) is the single read path; `toPublicSettings()` is the browser-safe subset.

The **policy** drives: footer line, product-page "Exchange Policy" block, checkout note, and the
**`/policies`** page (full text). Edit it in Settings → updates everywhere.

---

## Image uploads (no URL inputs anywhere)

Admins upload files (drag-drop / picker, JPG/PNG/WEBP, multiple). `/api/admin/upload` uses
**sharp** to auto-rotate, cap to 1600px (preserve aspect), strip metadata, encode WebP, and
generate a 500px thumbnail. Dev writes to `public/uploads/`; if Cloudinary env vars are set it
streams to Cloudinary instead. Only URLs are stored. Reorder/set-primary/remove in the UI;
`next/image` lazy-loads on the storefront. **Serverless (Vercel) needs Cloudinary** — its disk
is ephemeral.

---

## Brand voice & copy conventions (enforced)

The Style Syndicate is a premium apparel brand: professional, elegant, minimal, trustworthy.
When writing or editing any user-facing string:
- **No em dashes** in displayed copy (use commas/periods/restructure). Em dashes in code
  comments are fine.
- **No marketing clichés / unsupportable claims:** avoid "built to last", "no account needed",
  "in seconds", "premium essentials", "world-class", etc. State only factual, product-led copy.
- **No developer terms in customer view** (no "Product ID", internal IDs, "slug", "draft" shown
  to customers; those belong only in admin).
- **Buttons & form labels:** Title Case ("Place Order on WhatsApp", "Save Changes", "Full Name",
  optional fields marked "(Optional)").
- **Validation/toasts:** polite, full sentences ending in a period ("Please enter your full
  name.", "Your settings have been saved successfully.").
- **"Free"** not "FREE". No ALL-CAPS, no `!!!`/`???`, no emoji in production copy.
- **American English**, Oxford commas, consistent capitalization for headings
  ("Order Details", "Payment Status").
- WhatsApp message format: greeting → "I would like to place the following order." → Order ID →
  Product/Size/Quantity/Unit Price → Customer/Phone → Delivery Address → Subtotal/Shipping/Total
  → Additional Instructions (if any) → "Please share the payment details to complete my order."
  (No internal Product ID.)

---

## Testing & verification done this build

- `npm run verify` → **11/11** (order saved PENDING, no stock change on create, deduct-once on
  Paid, restock on cancel, reservation counts/blocks oversell, expiry releases). Self-contained:
  creates and deletes its own throwaway DRAFT product, so it works against any catalog state.
- Live HTTP battery passed: routing, 404s, catalog status/archive gating, auth guard (307),
  authenticated access (200), upload security (401/400), forged/tampered JWT rejected.
- ESLint, `tsc`, and `next build` all clean.

---

## Production / launch checklist (NOT yet deployed — runs only on localhost)

1. **Deploy** to Vercel (public URL + HTTPS).
2. **Switch DB to Postgres:** set `provider = "postgresql"` in `schema.prisma`, set a
   Neon/Supabase `DATABASE_URL` (use a **pooled** connection on serverless,
   `?pgbouncer=true&connection_limit=1`), run `prisma migrate deploy` + `npm run db:seed`.
   Schema is portable (no DB enums/arrays).
3. **Configure Cloudinary** env vars (image uploads need persistent storage on serverless).
4. **Set real secrets:** strong `AUTH_SECRET`; change admin password from `admin123`.
5. **Set real UPI ID** in `/admin/settings` (WhatsApp number is already set).
6. **Add real products** with real photos (catalog was used/edited during testing).
7. Do one real phone test of the full WhatsApp → UPI → mark-paid flow.

---

## Current state (as of this build)

- Default admin: `admin@thestylesyndicate.test` / `admin123` (change before launch).
- WhatsApp number configured in `.env` + Settings; UPI ID is still a placeholder.
- Catalog was edited during testing — at last check ~1 ACTIVE product the user created
  ("Mustard & Navy Color Block Polo T-Shirt") plus an archived one. Seed adds 6 demo products
  (Polo / Round Neck categories) if reseeded.
- Logo (`public/logo.png`) is the site logo (header/footer/admin/login) and the favicon
  (`src/app/icon.png`).
