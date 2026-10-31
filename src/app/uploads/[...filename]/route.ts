import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getUserSession } from "@/lib/auth"

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string[] }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { filename } = await context.params
    if (!filename || filename.length === 0) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Gabungkan path dan cegah directory traversal
    const safePath = path.join(...filename)
    if (safePath.includes("..") || path.isAbsolute(safePath)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Utamakan folder privat storage/uploads, fallback ke public/uploads untuk lampiran lama
    const privatePath = path.join(process.cwd(), "storage", "uploads", safePath)
    const legacyPath = path.join(process.cwd(), "public", "uploads", safePath)
    const filePath = fs.existsSync(privatePath) ? privatePath : fs.existsSync(legacyPath) ? legacyPath : null

    if (!filePath) {
      return new NextResponse("File Not Found", { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()

    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".pdf": "application/pdf"
    }

    const contentType = mimeTypes[ext] || "application/octet-stream"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600"
      }
    })
  } catch (error) {
    console.error("Error serving upload file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
