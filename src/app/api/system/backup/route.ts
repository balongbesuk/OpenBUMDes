import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getUserSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Hanya Admin yang dapat mengunduh backup database." }, { status: 403 })
    }

    // Cari dev.db
    let dbPath = path.join(process.cwd(), "prisma", "dev.db")
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(process.cwd(), "..", "bumdes-v2", "prisma", "dev.db")
    }

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ success: false, error: "File database SQLite tidak ditemukan." }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(dbPath)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const filename = `backup_bumdes_${timestamp}.db`

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
