import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Product images are admin-supplied URLs (Cloudinary, etc.). Allow any
    // https host; admins control what is entered.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Allow full-quality rendering for the brand logo.
    qualities: [75, 100],
  },
}

export default nextConfig
