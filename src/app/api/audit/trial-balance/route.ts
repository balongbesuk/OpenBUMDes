import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")
    const monthParam = searchParams.get("month")

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
    const month = monthParam && monthParam !== "all" ? parseInt(monthParam, 10) : null

    let endDate: Date
    if (month) {
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    } else {
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
    }

    // Ambil master akun
    const allAccounts = await db.ledgerAccount.findMany({
      orderBy: { code: "asc" }
    })

    // Cek apakah jurnal buka buku (SA) ada untuk tahun ini agar tidak menduplikasi saldo tahun lalu
    const hasOpeningJournal = await db.journalEntry.findFirst({
      where: { proofNumber: { startsWith: `SA/${year}/` } },
      select: { id: true }
    })
    const dateCondition = hasOpeningJournal
      ? { gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0)), lte: endDate }
      : { lte: endDate }

    // Agregasi mutasi debit & kredit untuk semua akun hingga batas waktu endDate
    const sums = await db.journalLine.groupBy({
      by: ["accountCode", "type"],
      where: {
        journalEntry: {
          date: dateCondition
        }
      },
      _sum: { amount: true }
    })

    const debitMap = new Map<string, number>()
    const creditMap = new Map<string, number>()

    sums.forEach((s) => {
      const amt = s._sum.amount || 0
      if (s.type === "DEBIT") {
        debitMap.set(s.accountCode, (debitMap.get(s.accountCode) || 0) + amt)
      } else {
        creditMap.set(s.accountCode, (creditMap.get(s.accountCode) || 0) + amt)
      }
    })

    let totalDebitBalance = 0
    let totalCreditBalance = 0
    let totalGrossDebit = 0
    let totalGrossCredit = 0

    const rows: any[] = []

    allAccounts.forEach((acc) => {
      const grossDeb = debitMap.get(acc.code) || 0
      const grossCred = creditMap.get(acc.code) || 0

      // Jika tidak pernah ada mutasi, lewati untuk menjaga lembar kerja tetap bersih (kecuali dibutuhkan)
      if (grossDeb === 0 && grossCred === 0) return

      totalGrossDebit += grossDeb
      totalGrossCredit += grossCred

      const isNormalDebit =
        acc.normal === "DEBIT" ||
        acc.type === "ASSET" ||
        acc.type === "EXPENSE" ||
        acc.code.startsWith("1") ||
        acc.code.startsWith("5") ||
        acc.code.startsWith("6") ||
        acc.code.startsWith("7")

      let netDebit = 0
      let netCredit = 0

      if (isNormalDebit) {
        const net = grossDeb - grossCred
        if (net >= 0) {
          netDebit = net
        } else {
          netCredit = Math.abs(net)
        }
      } else {
        const net = grossCred - grossDeb
        if (net >= 0) {
          netCredit = net
        } else {
          netDebit = Math.abs(net)
        }
      }

      totalDebitBalance += netDebit
      totalCreditBalance += netCredit

      rows.push({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normal: acc.normal,
        grossDebit: grossDeb,
        grossCredit: grossCred,
        debitBalance: netDebit,
        creditBalance: netCredit
      })
    })

    const difference = Math.round((totalDebitBalance - totalCreditBalance) * 100) / 100
    const isBalanced = Math.abs(difference) < 0.01

    return NextResponse.json({
      success: true,
      meta: {
        year,
        month,
        periodLabel: month ? `Per Akhir Bulan ${month} Tahun ${year}` : `Per 31 Desember ${year}`,
        totalDebitBalance,
        totalCreditBalance,
        totalGrossDebit,
        totalGrossCredit,
        difference,
        isBalanced
      },
      data: rows
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
