import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { postJournalEntry } from "@/lib/ledger"
import { getUserSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const proofType = searchParams.get("proofType")

    const where: any = {}
    if (proofType && proofType !== "all") where.proofType = proofType

    if (year && year !== "all") {
      const y = parseInt(year, 10)
      if (month && month !== "all") {
        const m = parseInt(month, 10)
        where.date = {
          gte: new Date(y, m - 1, 1),
          lte: new Date(y, m, 0, 23, 59, 59, 999)
        }
      } else {
        where.date = {
          gte: new Date(y, 0, 1),
          lte: new Date(y, 11, 31, 23, 59, 59, 999)
        }
      }
    }

    const entries = await db.journalEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: { lines: true }
    })

    return NextResponse.json({ success: true, data: entries })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak sah atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { date, proofType, description, payeeOrPayer, unitName, note, lines, attachmentUrl } = body

    if (!proofType || !description || !payeeOrPayer || !lines || lines.length < 2) {
      return NextResponse.json(
        { success: false, error: "Mohon lengkapi jenis bukti, keterangan, pihak terkait, dan minimal 2 baris jurnal." },
        { status: 400 }
      )
    }

    const txDate = date ? new Date(date) : new Date()
    const txYear = txDate.getFullYear()

    // Validasi apakah tahun transaksi telah ditutup buku dan terkunci
    const closed = await db.annualClosing.findUnique({
      where: { year: txYear }
    })
    if (closed && closed.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Transaksi ditolak. Tahun pembukuan ${txYear} telah ditutup buku dan statusnya terkunci (Arsip LPJ Resmi).`
        },
        { status: 403 }
      )
    }

    const result = await postJournalEntry(
      txDate,
      proofType,
      description,
      payeeOrPayer,
      lines,
      unitName,
      note,
      attachmentUrl
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak sah atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      )
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya akun Admin yang berwenang menghapus transaksi kas." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    let id = searchParams.get("id")
    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID transaksi tidak ditemukan." },
        { status: 400 }
      )
    }

    const existing = await db.journalEntry.findUnique({
      where: { id },
      include: { lines: true }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan atau sudah dihapus." },
        { status: 404 }
      )
    }

    // Cek apakah tahun transaksi sudah ditutup buku dan terkunci
    const txYear = new Date(existing.date).getFullYear()
    const closed = await db.annualClosing.findUnique({
      where: { year: txYear }
    })
    if (closed && closed.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Penghapusan ditolak. Transaksi berada pada Tahun Pembukuan ${txYear} yang telah ditutup buku dan berstatus Terkunci (Arsip LPJ Resmi).`
        },
        { status: 403 }
      )
    }

    // Hapus jurnal transaksi (baris jurnal otomatis terhapus via onDelete: Cascade)
    await db.journalEntry.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `Transaksi ${existing.proofNumber || existing.description} berhasil dihapus.`
    })
  } catch (error: any) {
    console.error("Delete Journal Entry Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus transaksi" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak sah atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, payeeOrPayer, description } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID transaksi tidak ditemukan." },
        { status: 400 }
      )
    }

    const existing = await db.journalEntry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan." },
        { status: 404 }
      )
    }

    // Cek apakah tahun transaksi sudah ditutup buku dan terkunci
    const txYear = new Date(existing.date).getFullYear()
    const closed = await db.annualClosing.findUnique({
      where: { year: txYear }
    })
    if (closed && closed.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Pengubahan ditolak. Transaksi berada pada Tahun Pembukuan ${txYear} yang telah ditutup buku dan berstatus Terkunci (Arsip LPJ Resmi).`
        },
        { status: 403 }
      )
    }

    const updated = await db.journalEntry.update({
      where: { id },
      data: {
        ...(payeeOrPayer !== undefined ? { payeeOrPayer: payeeOrPayer.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {})
      }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Data transaksi berhasil diperbarui."
    })
  } catch (error: any) {
    console.error("Patch Journal Entry Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui transaksi" },
      { status: 500 }
    )
  }
}


