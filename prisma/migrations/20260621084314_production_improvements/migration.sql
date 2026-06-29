-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN "thumbnailUrl" TEXT;

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "businessName" TEXT NOT NULL DEFAULT 'The Style Syndicate',
    "whatsappNumber" TEXT NOT NULL DEFAULT '',
    "upiId" TEXT NOT NULL DEFAULT '',
    "paymentInstructions" TEXT NOT NULL DEFAULT '',
    "shippingCharge" INTEGER NOT NULL DEFAULT 0,
    "freeShippingThreshold" INTEGER NOT NULL DEFAULT 0,
    "reservationMinutes" INTEGER NOT NULL DEFAULT 30,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 3,
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "houseFlat" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "shippingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "shippingCharge" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "notes" TEXT,
    "inventoryDeducted" BOOLEAN NOT NULL DEFAULT false,
    "reservationExpiresAt" DATETIME,
    "paidAt" DATETIME,
    "cancelledAt" DATETIME,
    "upiTransactionId" TEXT,
    "paymentVerifiedBy" TEXT,
    "paymentVerifiedAt" DATETIME,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Order" ("cancelledAt", "city", "createdAt", "customerName", "email", "houseFlat", "id", "inventoryDeducted", "landmark", "notes", "orderNumber", "paidAt", "paymentStatus", "phone", "pincode", "shippingStatus", "state", "street", "totalAmount", "updatedAt") SELECT "cancelledAt", "city", "createdAt", "customerName", "email", "houseFlat", "id", "inventoryDeducted", "landmark", "notes", "orderNumber", "paidAt", "paymentStatus", "phone", "pincode", "shippingStatus", "state", "street", "totalAmount", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_shippingStatus_idx" ON "Order"("shippingStatus");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_phone_idx" ON "Order"("phone");
CREATE INDEX "Order_reservationExpiresAt_idx" ON "Order"("reservationExpiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
