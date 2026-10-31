import { db } from "@/lib/db"

const SAFE_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon"
])

export async function GET() {
  try {
    const setting = await db.setting.findUnique({
      where: { key: "bumdes_logo" }
    })

    if (setting?.value && setting.value.startsWith("data:image")) {
      const parts = setting.value.split(",")
      const mime = (parts[0].match(/:(.*?);/)?.[1] || "image/png").toLowerCase()
      if (SAFE_IMAGE_MIMES.has(mime) && parts[1]) {
        const buffer = Buffer.from(parts[1], "base64")
        return new Response(buffer, {
          headers: {
            "Content-Type": mime,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=120, s-maxage=120"
          }
        })
      }
    }
  } catch (err) {
    console.error("Favicon route error:", err)
  }

  // 1x1 transparent PNG fallback
  const transparentPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64")
  return new Response(transparentPng, {
    headers: {
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600"
    }
  })
}
