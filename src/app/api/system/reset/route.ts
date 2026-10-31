import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import path from "path"
import fs from "fs"

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya Admin yang memiliki hak akses untuk mengosongkan aplikasi." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { confirmation } = body

    if (String(confirmation).trim().toUpperCase() !== "KOSONGKAN") {
      return NextResponse.json(
        { success: false, error: 'Harap ketik kata konfirmasi "KOSONGKAN" dengan tepat untuk mencegah ketidaksengajaan.' },
        { status: 400 }
      )
    }

    // Bersihkan seluruh data transaksi kas, jurnal harian, dan arsip penutupan
    // Catatan: Akun Bagan Akun (COA) dan kustomisasi pengguna sengaja TIDAK dihapus.
    await db.$transaction(async (tx) => {
      await tx.journalLine.deleteMany()
      await tx.journalEntry.deleteMany()
      await tx.annualClosing.deleteMany()
      await tx.openingBalance.deleteMany()
      await tx.inventoryMovement.deleteMany()
      await tx.inventoryItem.deleteMany()
      await tx.fixedAsset.deleteMany()
      await tx.loanTransaction.deleteMany()
      await tx.loanMember.deleteMany()

      // Safeguard: Jika karena alasan apa pun tabel ledgerAccount kosong, otomatis isi kembali dengan COA standar Kemendes 136
      const count = await tx.ledgerAccount.count()
      if (count === 0) {
        const coaPath = path.join(process.cwd(), "prisma", "coa_kemendes_136.json")
        if (fs.existsSync(coaPath)) {
          const raw = fs.readFileSync(coaPath, "utf-8")
          const coaList: { code: string; name: string; type: string; normal: string }[] = JSON.parse(raw)
          await tx.ledgerAccount.createMany({
            data: coaList
          })
        }
      }
    })

    for (const dir of [
      path.join(process.cwd(), "storage", "uploads"),
      path.join(process.cwd(), "public", "uploads")
    ]) {
      try {
        if (fs.existsSync(dir)) {
          for (const file of fs.readdirSync(dir)) {
            if (file.startsWith("kwitansi_")) {
              try {
                fs.unlinkSync(path.join(dir, file))
              } catch {}
            }
          }
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Seluruh data transaksi kas, jurnal harian, dan arsip tutup buku berhasil dikosongkan. Bagan Akun Standar Kepmendes 136 dan akun pengguna tetap aman."
    })
  } catch (error: any) {
    console.error("Reset application error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
