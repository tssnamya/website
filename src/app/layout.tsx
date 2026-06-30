import type { Metadata } from "next"
import { Inter, Playfair_Display, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { publicConfig } from "@/lib/config"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

// Resolve the public site URL: explicit override, else Vercel's production
// domain (so social/WhatsApp share previews use absolute, live image URLs).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")

const shareDescription =
  "Thoughtfully designed polo and round neck T-shirts. Choose your size and place your order through WhatsApp."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${publicConfig.storeName} | Polo & Round Neck T-Shirts`,
    template: `%s | ${publicConfig.storeName}`,
  },
  description:
    "Explore our collection of thoughtfully designed polo and round neck T-shirts. Choose your preferred size and place your order through WhatsApp.",
  openGraph: {
    title: `${publicConfig.storeName} | Polo & Round Neck T-Shirts`,
    description: shareDescription,
    type: "website",
    siteName: publicConfig.storeName,
    images: [
      { url: "/logo.png", width: 1254, height: 1254, alt: publicConfig.storeName },
    ],
  },
  twitter: {
    card: "summary",
    title: `${publicConfig.storeName} | Polo & Round Neck T-Shirts`,
    description: shareDescription,
    images: ["/logo.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
