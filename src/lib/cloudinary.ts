// Server-only Cloudinary helpers. When configured, the /api/admin/upload route
// streams optimized image buffers to Cloudinary; otherwise images are written to
// the local public/uploads folder. Admins always upload files (never URLs).

import { v2 as cloudinary } from "cloudinary"

export function isCloudinaryServerConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  )
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  return cloudinary
}

/**
 * Produce a signature for a direct (browser -> Cloudinary) signed upload.
 * Returns null when Cloudinary is not configured.
 */
export function signUpload(params: Record<string, string | number>) {
  if (!isCloudinaryServerConfigured()) return null
  const cld = configure()
  const timestamp = params.timestamp
  const signature = cld.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET as string,
  )
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  }
}
