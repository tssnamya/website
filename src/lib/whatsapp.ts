// Pure, isomorphic helpers to build the pre-filled WhatsApp order message.
// No DB or server imports so it can run on the server or in the browser.

import { formatINR, orderCode } from "@/lib/format"

export interface WhatsAppLineItem {
  productId: string | null
  productName: string
  size: string
  quantity: number
  unitPrice: number
}

export interface WhatsAppOrderPayload {
  orderNumber: number
  storeName: string
  customerName: string
  phone: string
  houseFlat: string
  street: string
  landmark?: string | null
  city: string
  state: string
  pincode: string
  items: WhatsAppLineItem[]
  subtotal: number
  shippingCharge: number
  totalAmount: number
  notes?: string | null
}

/** Builds the human-readable message body the customer sends to the business. */
export function buildWhatsAppMessage(p: WhatsAppOrderPayload): string {
  const addressLines = [
    p.houseFlat,
    p.street,
    p.landmark ? p.landmark : null,
    `${p.city}, ${p.state} - ${p.pincode}`,
  ].filter(Boolean)

  const productBlocks = p.items
    .map((it) =>
      [
        `Product: ${it.productName}`,
        `Size: ${it.size}`,
        `Quantity: ${it.quantity}`,
        `Unit Price: ${formatINR(it.unitPrice)}`,
      ].join("\n"),
    )
    .join("\n\n")

  const lines = [
    `Hello,`,
    ``,
    `I would like to place the following order.`,
    ``,
    `Order ID: ${orderCode(p.orderNumber)}`,
    ``,
    productBlocks,
    ``,
    `Customer Name: ${p.customerName}`,
    `Phone: ${p.phone}`,
    ``,
    `Delivery Address:`,
    ...addressLines,
    ``,
    `Subtotal: ${formatINR(p.subtotal)}`,
    `Shipping: ${p.shippingCharge > 0 ? formatINR(p.shippingCharge) : "Free"}`,
    `Total: ${formatINR(p.totalAmount)}`,
  ]

  if (p.notes && p.notes.trim()) {
    lines.push(``, `Additional Instructions: ${p.notes.trim()}`)
  }

  lines.push(``, `Please share the payment details to complete my order.`)
  return lines.join("\n")
}

/** wa.me deep link with the message pre-filled. `businessNumber` = digits only. */
export function buildWhatsAppUrl(businessNumber: string, message: string): string {
  const number = businessNumber.replace(/\D/g, "")
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
