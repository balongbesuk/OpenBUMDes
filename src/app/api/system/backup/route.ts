import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Hanya Admin yang dapat mengunduh backup database." }, { status: 403 })
    }

    // Flush any pending WAL pages into main dev.db file before reading
    try {
      await db.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE);")
    } catch {}

    // Cari dev.db
    let dbPath = path.join(process.cwd(), "prisma", "dev.db")
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(process.cwd(), "..", "bumdes-v2", "prisma", "dev.db")
    }

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ success: false, error: "File database SQLite tidak ditemukan." }, { status: 404 })
    }

    let fileBuffer: Buffer
    const tmpBackup = path.join(process.cwd(), "storage", `tmp_bak_${Date.now()}.db`)
    const storageDir = path.dirname(tmpBackup)
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })

    try {
      const escapedTmp = tmpBackup.replace(/\\/g, "/")
      await db.$executeRawUnsafe(`VACUUM INTO '${escapedTmp}'`)
      fileBuffer = fs.readFileSync(tmpBackup)
      try { fs.unlinkSync(tmpBackup) } catch {}
    } catch {
      fileBuffer = fs.readFileSync(dbPath)
    }
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const filename = `backup_bumdes_${timestamp}.db`

    return new Response(new Uint8Array(fileBuffer), {
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
