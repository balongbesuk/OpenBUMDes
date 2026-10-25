import { getUserSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { postJournalEntry } from "@/lib/ledger"
import { isPeriodLocked } from "@/lib/period-lock"
import { logActivity } from "@/lib/audit"
import { bkuEntrySchema } from "@/lib/validation"

// GET: Fetch journal entries for Buku Kas Umum with filtering and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filter query params
    const monthParam = searchParams.get("month") // e.g. "1" to "12", "all" or empty
    const yearParam = searchParams.get("year")   // e.g. "2026", "all" or empty
    const pageParam = searchParams.get("page")   // e.g. "1"
    const limitParam = searchParams.get("limit") // e.g. "20"

    const month = monthParam && monthParam !== "all" ? parseInt(monthParam, 10) : null
    const year = yearParam && yearParam !== "all" ? parseInt(yearParam, 10) : null
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 20
    const skip = (page - 1) * limit

    // Build query conditions
    const where: any = {}
    
    if (year !== null) {
      if (month !== null) {
        // Specific month & year
        const start = new Date(year, month - 1, 1)
        const end = new Date(year, month, 0, 23, 59, 59, 999)
        where.date = { gte: start, lte: end }
      } else {
        // Specific year, all months
        const start = new Date(year, 0, 1)
        const end = new Date(year, 11, 31, 23, 59, 59, 999)
        where.date = { gte: start, lte: end }
      }
    } else if (month !== null) {
      // Specific month for current year
      const currentYear = new Date().getFullYear()
      const start = new Date(currentYear, month - 1, 1)
      const end = new Date(currentYear, month, 0, 23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    // Query total count for pagination metadata
    const totalCount = await db.journalEntry.count({ where })
    
    // Query data with skip & take
    const entries = await db.journalEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        lines: true
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    })
  } catch (error: any) {
    console.error("Fetch cash book error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch cash book entries" },
      { status: 500 }
    )
  }
}

// POST: Post a new general ledger expense/income entry
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate payload using Zod schema
    const validationResult = bkuEntrySchema.safeParse(body)
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(err => err.message).join(", ")
      return NextResponse.json(
        { success: false, error: `Validasi gagal: ${errorMsg}` },
        { status: 400 }
      )
    }

    const {
      date,
      description,
      unitUsaha,
      lines,
      attachmentUrl,
      proofNumber,
      proofType,
      payeeOrPayer,
      note,
      verificationStatus
    } = validationResult.data
    const txDate = date ? new Date(date) : new Date()

    // Verify lock period status
    if (await isPeriodLocked(txDate)) {
      return NextResponse.json(
        { success: false, error: "Transaksi ditolak. Periode keuangan untuk tanggal tersebut telah dikunci (Tutup Buku)." },
        { status: 400 }
      )
    }

    // Auto-generate proof number if proofType is provided but proofNumber is empty
    let finalProofNumber = proofNumber
    if (proofType && !finalProofNumber) {
      const year = txDate.getFullYear()
      const month = String(txDate.getMonth() + 1).padStart(2, "0")
      const prefix = `${proofType}/${year}/${month}/`
      const count = await db.journalEntry.count({
        where: {
          proofNumber: { startsWith: prefix }
        }
      })
      finalProofNumber = `${prefix}${String(count + 1).padStart(4, "0")}`
    }

    const result = await postJournalEntry(
      txDate,
      description,
      unitUsaha,
      lines,
      attachmentUrl,
      {
        proofNumber: finalProofNumber,
        proofType,
        payeeOrPayer,
        note,
        verificationStatus
      }
    )

    // Log to audit log
    const session = await getUserSession()
    if (session) {
      const actDetail = `Mencatat transaksi ${proofType || "jurnal"}: ${description} (${finalProofNumber || "-"}) senilai Rp ${lines.find(l => l.type === 'DEBIT')?.amount.toLocaleString("id-ID")}`
      await logActivity("POST_JOURNAL_ENTRY", actDetail, session)
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Post journal entry error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membukukan transaksi" },
      { status: 500 }
    )
  }
}
