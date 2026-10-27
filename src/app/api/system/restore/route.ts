import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import fs from "fs"
import path from "path"
import { getUserSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Hanya Admin yang memiliki hak akses untuk memulihkan (restore) database." }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "Tidak ada berkas database yang dipilih." }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Validasi signature header SQLite (16 byte pertama: "SQLite format 3\0")
    const sqliteHeader = "SQLite format 3\0"
    const fileHeader = fileBuffer.slice(0, 16).toString("binary")

    if (fileHeader !== sqliteHeader) {
      return NextResponse.json(
        { success: false, error: "Format berkas tidak valid. Harap unggah berkas database SQLite (.db) hasil backup resmi BUMDes." },
        { status: 400 }
      )
    }

    let dbPath = path.join(process.cwd(), "prisma", "dev.db")
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(process.cwd(), "..", "bumdes-v2", "prisma", "dev.db")
    }

    // Disconnect Prisma Client sebelum menimpa berkas
    await db.$disconnect()

    // Hapus berkas WAL & SHM lama jika ada agar tidak bentrok
    try { if (fs.existsSync(dbPath + "-wal")) fs.unlinkSync(dbPath + "-wal") } catch {}
    try { if (fs.existsSync(dbPath + "-shm")) fs.unlinkSync(dbPath + "-shm") } catch {}

    // Tulis berkas database baru
    fs.writeFileSync(dbPath, fileBuffer)

    return NextResponse.json({
      success: true,
      message: `Database BUMDes berhasil dipulihkan dari berkas "${file.name}"! Halaman akan dimuat ulang.`
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
