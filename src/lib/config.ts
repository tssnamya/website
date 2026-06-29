// Public, browser-safe configuration sourced from NEXT_PUBLIC_* env vars.
// Next inlines these at build time, so this module is safe in client components.

export const publicConfig = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "The Style Syndicate",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "",
  upiId: process.env.NEXT_PUBLIC_UPI_ID || "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
} as const

export const isCloudinaryConfigured = Boolean(publicConfig.cloudinaryCloudName)
