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

    const updated = await db.$transaction(async (tx) => {
      // Hapus jurnal penutup JP secara atomik
      const jpProof = `JP/${parsedYear}/12/0001`
      await tx.journalEntry.deleteMany({
        where: {
          OR: [
            ...(closing.journalEntryId ? [{ id: closing.journalEntryId }] : []),
            { proofNumber: jpProof }
          ]
        }
      })

      return await tx.annualClosing.update({
        where: { year: parsedYear },
        data: {
          isLocked: false,
          journalEntryId: null,
          notes: closing.notes ? `${closing.notes} | Dibuka kembali: ${reason}` : `Dibuka kembali: ${reason}`
        }
      })
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
