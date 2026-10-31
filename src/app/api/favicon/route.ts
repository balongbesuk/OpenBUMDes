import { db } from "@/lib/db"
import fs from "fs"
import path from "path"

const SAFE_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml"
])

const DEFAULT_SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#047857"/>
  <path d="M32 10 L52 24 L52 50 L12 50 L12 24 Z" fill="#ffffff" fill-opacity="0.95"/>
  <path d="M32 16 L46 26 L46 46 L18 46 L18 26 Z" fill="#10b981"/>
  <circle cx="32" cy="34" r="7" fill="#fbbf24"/>
  <path d="M28 46 L36 46 L36 38 L28 38 Z" fill="#047857"/>
  <path d="M32 8 L8 24 L14 24 L32 12 L50 24 L56 24 Z" fill="#34d399"/>
</svg>`

export async function GET() {
  try {
    // 1. Prioritaskan logo kustom dari pengaturan database
    const setting = await db.setting.findUnique({
      where: { key: "bumdes_logo" }
    })

    if (setting?.value && setting.value.startsWith("data:image")) {
      const parts = setting.value.split(",")
      const mime = (parts[0].match(/:(.*?);/)?.[1] || "image/png").toLowerCase()
      if (SAFE_IMAGE_MIMES.has(mime) && parts[1]) {
        const buffer = Buffer.from(parts[1], "base64")
        return new Response(new Uint8Array(buffer), {
          headers: {
            "Content-Type": mime,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=120, s-maxage=120"
          }
        })
      }
    }
  } catch (err) {
    console.error("Favicon database query error:", err)
  }

  // 2. Fallback ke file logo/favicon fisik di folder public
  try {
    for (const filename of ["logo-bumdes.png", "favicon.ico"]) {
      const filePath = path.join(process.cwd(), "public", filename)
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath)
        const mime = filename.endsWith(".ico") ? "image/x-icon" : "image/png"
        return new Response(new Uint8Array(buffer), {
          headers: {
            "Content-Type": mime,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=86400"
          }
        })
      }
    }
  } catch (err) {
    console.error("Favicon filesystem fallback error:", err)
  }

  // 3. Fallback terakhir: SVG BUMDes resmi berkualitas tinggi
  return new Response(DEFAULT_SVG_ICON, {
    headers: {
      "Content-Type": "image/svg+xml",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400"
    }
  })
}
