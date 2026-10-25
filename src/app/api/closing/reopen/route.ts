import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"

// POST: Buka Kembali Kunci Tutup Buku (Reopen Period)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya akun Administrator yang memiliki hak akses untuk membuka kembali periode buku." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { year, reason = "Penyesuaian transaksi" } = body

    if (!year) {
      return NextResponse.json({ success: false, error: "Tahun buku harus ditentukan." }, { status: 400 })
    }

    const parsedYear = parseInt(String(year), 10)

    const closing = await db.annualClosing.findUnique({
      where: { year: parsedYear }
    })

    if (!closing) {
      return NextResponse.json({ success: false, error: `Arsip tutup buku tahun ${parsedYear} tidak ditemukan.` }, { status: 404 })
    }

    // Hapus jurnal penutup JP jika ada
    if (closing.journalEntryId) {
      try {
        await db.journalEntry.delete({
          where: { id: closing.journalEntryId }
        })
      } catch (e) {
        console.warn("Could not delete closing journal entry:", e)
      }
    } else {
      const jpProof = `JP/${parsedYear}/12/0001`
      await db.journalEntry.deleteMany({
        where: { proofNumber: jpProof }
      })
    }

    // Update status isLocked menjadi false
    const updated = await db.annualClosing.update({
      where: { year: parsedYear },
      data: {
        isLocked: false,
        journalEntryId: null,
        notes: closing.notes ? `${closing.notes} | Dibuka kembali: ${reason}` : `Dibuka kembali: ${reason}`
      }
    })

    return NextResponse.json({
      success: true,
      message: `Kunci periode tahun ${parsedYear} berhasil dibuka kembali. Anda dapat menambahkan atau mengoreksi transaksi tahun tersebut.`,
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
