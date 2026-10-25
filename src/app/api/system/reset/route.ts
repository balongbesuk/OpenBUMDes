import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"

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
    await db.$transaction(async (tx) => {
      await tx.journalLine.deleteMany()
      await tx.journalEntry.deleteMany()
      await tx.annualClosing.deleteMany()
      await tx.openingBalance.deleteMany()
    })

    return NextResponse.json({
      success: true,
      message: "Seluruh data transaksi kas, jurnal harian, dan arsip tutup buku berhasil dikosongkan. Bagan Akun Standar Kepmendes 136 dan akun pengguna tetap aman."
    })
  } catch (error: any) {
    console.error("Reset application error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
