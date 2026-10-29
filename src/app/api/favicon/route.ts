import { db } from "@/lib/db"

export async function GET() {
  try {
    const setting = await db.setting.findUnique({
      where: { key: "bumdes_logo" }
    })

    if (setting?.value && setting.value.startsWith("data:image")) {
      const parts = setting.value.split(",")
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png"
      const buffer = Buffer.from(parts[1], "base64")
      return new Response(buffer, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=120, s-maxage=120"
        }
      })
    }
  } catch (err) {
    console.error("Favicon route error:", err)
  }

  // 1x1 transparent PNG fallback
  const transparentPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64")
  return new Response(transparentPng, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" }
  })
}

