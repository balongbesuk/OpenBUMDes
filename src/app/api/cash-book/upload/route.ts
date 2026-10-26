import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak sah atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const entryId = formData.get("entryId") as string
    const file = formData.get("file") as File | null

    if (!entryId) {
      return NextResponse.json(
        { success: false, error: "ID transaksi tidak ditemukan." },
        { status: 400 }
      )
    }

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "Berkas foto/dokumen bukti fisik wajib dipilih." },
        { status: 400 }
      )
    }

    // Validasi tipe file (hanya gambar dan PDF)
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf"
    ]
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format berkas tidak didukung. Harap unggah foto (JPG, PNG, WEBP) atau PDF." },
        { status: 400 }
      )
    }

    // Batas ukuran berkas 10MB
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran berkas terlalu besar. Maksimal 10 MB." },
        { status: 400 }
      )
    }

    const existingEntry = await db.journalEntry.findUnique({
      where: { id: entryId }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: "Data transaksi tidak ditemukan di basis data." },
        { status: 404 }
      )
    }

    // Ekstrak ekstensi berkas
    const originalName = file.name || "bukti.jpg"
    const ext = path.extname(originalName).toLowerCase() || (file.type === "application/pdf" ? ".pdf" : ".jpg")
    const cleanExt = [".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(ext) ? ext : ".jpg"

    // Pastikan direktori public/uploads ada
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Nama berkas unik
    const fileName = `kwitansi_${entryId}_${Date.now()}${cleanExt}`
    const filePath = path.join(uploadDir, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    const publicUrl = `/uploads/${fileName}`

    // Hapus berkas lama jika ada di public/uploads
    if (existingEntry.attachmentUrl && existingEntry.attachmentUrl.startsWith("/uploads/")) {
      const oldFileName = path.basename(existingEntry.attachmentUrl)
      const oldFilePath = path.join(uploadDir, oldFileName)
      if (fs.existsSync(oldFilePath) && oldFileName !== fileName) {
        try {
          fs.unlinkSync(oldFilePath)
        } catch {
          // Abaikan jika berkas lama tidak dapat dihapus
        }
      }
    }

    // Perbarui entri transaksi di basis data
    await db.journalEntry.update({
      where: { id: entryId },
      data: {
        attachmentUrl: publicUrl,
        verificationStatus: "SIGNED_UPLOADED"
      }
    })

    return NextResponse.json({
      success: true,
      attachmentUrl: publicUrl,
      message: "Foto bukti fisik kwitansi berhasil diunggah."
    })
  } catch (error: any) {
    console.error("Upload Kwitansi Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan saat mengunggah berkas." },
      { status: 500 }
    )
  }
}
