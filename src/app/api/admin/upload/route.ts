import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import sharp from "sharp"
import { v2 as cloudinary } from "cloudinary"
import { getSession } from "@/lib/auth"
import { isCloudinaryServerConfigured } from "@/lib/cloudinary"

export const runtime = "nodejs"

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

function uploadBufferToCloudinary(
  buffer: Buffer,
  publicId: string,
): Promise<{ secure_url: string }> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "the-style-syndicate/products",
        public_id: publicId,
        resource_type: "image",
      },
      (err, res) => {
        if (err || !res) reject(err ?? new Error("Upload failed"))
        else resolve({ secure_url: res.secure_url })
      },
    )
    stream.end(buffer)
  })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await req.formData()
  const files = form.getAll("files").filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 })
  }

  const useCloudinary = isCloudinaryServerConfigured()
  const results: { url: string; thumbnailUrl: string }[] = []

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || "unknown"}. Use JPG, PNG or WEBP.` },
        { status: 400 },
      )
    }
    const input = Buffer.from(await file.arrayBuffer())

    // Optimize: auto-rotate, cap dimensions (preserve aspect), strip metadata
    // (sharp drops metadata by default), re-encode to webp.
    const full = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    const thumb = await sharp(input)
      .rotate()
      .resize({ width: 500, height: 500, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 68 })
      .toBuffer()

    const id = randomUUID()

    if (useCloudinary) {
      const fullRes = await uploadBufferToCloudinary(full, id)
      const thumbRes = await uploadBufferToCloudinary(thumb, `${id}_thumb`)
      results.push({ url: fullRes.secure_url, thumbnailUrl: thumbRes.secure_url })
    } else {
      const dir = path.join(process.cwd(), "public", "uploads")
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, `${id}.webp`), full)
      await writeFile(path.join(dir, `${id}_thumb.webp`), thumb)
      results.push({ url: `/uploads/${id}.webp`, thumbnailUrl: `/uploads/${id}_thumb.webp` })
    }
  }

  return NextResponse.json({ images: results })
}
