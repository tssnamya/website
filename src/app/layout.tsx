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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: `${publicConfig.storeName} | Polo & Round Neck T-Shirts`,
    template: `%s | ${publicConfig.storeName}`,
  },
  description:
    "Explore our collection of thoughtfully designed polo and round neck T-shirts. Choose your preferred size and place your order through WhatsApp.",
  openGraph: {
    title: `${publicConfig.storeName} | Polo & Round Neck T-Shirts`,
    description:
      "Thoughtfully designed polo and round neck T-shirts. Choose your size and place your order through WhatsApp.",
    type: "website",
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
