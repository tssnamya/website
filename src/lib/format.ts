// Formatting helpers. Money is stored as whole rupees (integers).

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

/** 499 -> "₹499", 1499 -> "₹1,499" */
export function formatINR(rupees: number): string {
  return inr.format(rupees)
}

/** 123 -> "TSS-000123" */
export function orderCode(orderNumber: number): string {
  return `TSS-${String(orderNumber).padStart(6, "0")}`
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatDate(date: Date | string): string {
  return dateFmt.format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFmt.format(new Date(date))
}

/** Build a URL-safe slug from a product name. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
