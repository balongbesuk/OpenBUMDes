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

    const MAX_DB_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_DB_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran berkas backup terlalu besar (maksimal 50 MB)." },
        { status: 400 }
      )
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

    // Validasi keberadaan tabel inti OpenBUMDes tanpa alokasi string raksasa tambahan di RAM
    const requiredTables = ["User", "LedgerAccount", "JournalEntry"]
    const missingTable = requiredTables.find((t) => !fileBuffer.includes(t, 0, "latin1"))
    if (missingTable) {
      return NextResponse.json(
        { success: false, error: `Berkas SQLite bukan backup OpenBUMDes yang sah (tabel ${missingTable} tidak ditemukan).` },
        { status: 400 }
      )
    }

    let dbPath = path.join(process.cwd(), "prisma", "dev.db")
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(process.cwd(), "..", "bumdes-v2", "prisma", "dev.db")
    }
    const backupPath = dbPath + ".bak"

    // Disconnect Prisma Client dan salin cadangan darurat sebelum menimpa berkas
    await db.$disconnect()
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
    }

    try {
      try { if (fs.existsSync(dbPath + "-wal")) fs.unlinkSync(dbPath + "-wal") } catch {}
      try { if (fs.existsSync(dbPath + "-shm")) fs.unlinkSync(dbPath + "-shm") } catch {}

      fs.writeFileSync(dbPath, fileBuffer)

      // Uji baca tabel inti & pastikan minimal ada 1 akun pengguna agar Admin tidak terkunci keluar
      const userCount = await db.user.count()
      await db.ledgerAccount.count()
      if (userCount === 0) {
        throw new Error("Berkas backup tidak memiliki akun pengguna aktif.")
      }
    } catch {
      await db.$disconnect().catch(() => {})
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, dbPath)
      }
      return NextResponse.json(
        { success: false, error: "Berkas database rusak, kosong dari akun pengguna, atau skema tidak cocok. Database sebelumnya telah dipulihkan otomatis." },
        { status: 400 }
      )
    } finally {
      try { if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath) } catch {}
    }

    return NextResponse.json({
      success: true,
      message: `Database BUMDes berhasil dipulihkan dari berkas "${file.name}"! Halaman akan dimuat ulang.`
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
