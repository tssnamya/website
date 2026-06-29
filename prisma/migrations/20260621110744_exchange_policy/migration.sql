-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
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
    "policySummary" TEXT NOT NULL DEFAULT 'Size exchanges only. Returns and refunds are not available.',
    "returnPolicy" TEXT NOT NULL DEFAULT 'We offer size exchanges only. If an item does not fit, message us on WhatsApp within 3 days of delivery and we will arrange an exchange, subject to availability. Returns and refunds are not available. Items must be unworn, unwashed, and in their original condition with all tags intact.',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("businessName", "contactEmail", "contactPhone", "freeShippingThreshold", "id", "lowStockThreshold", "paymentInstructions", "reservationMinutes", "shippingCharge", "updatedAt", "upiId", "whatsappNumber") SELECT "businessName", "contactEmail", "contactPhone", "freeShippingThreshold", "id", "lowStockThreshold", "paymentInstructions", "reservationMinutes", "shippingCharge", "updatedAt", "upiId", "whatsappNumber" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
