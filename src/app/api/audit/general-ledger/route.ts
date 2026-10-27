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
    const accountCode = searchParams.get("accountCode")

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()
    const month = monthParam && monthParam !== "all" ? parseInt(monthParam, 10) : null

    let startDate: Date
    let endDate: Date

    if (month) {
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    } else {
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
    }

    // Ambil daftar seluruh akun dari database
    const allAccounts = await db.ledgerAccount.findMany({
      orderBy: { code: "asc" }
    })
    const accountMap = new Map(allAccounts.map((a) => [a.code, a]))

    // Cari akun-akun yang pernah memiliki transaksi
    const distinctCodes = await db.journalLine.findMany({
      select: { accountCode: true },
      distinct: ["accountCode"]
    })
    const activeCodeSet = new Set(distinctCodes.map((d) => d.accountCode))

    const accountsList = allAccounts.map((acc) => ({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      normal: acc.normal,
      hasTransactions: activeCodeSet.has(acc.code)
    }))

    // Jika tidak ada accountCode yang dipilih, gunakan akun pertama yang aktif atau 1.1.01.01 (Kas Tunai)
    const targetCode =
      accountCode ||
      accountsList.find((a) => a.hasTransactions)?.code ||
      "1.1.01.01"

    const selectedAccount = accountMap.get(targetCode) || {
      code: targetCode,
      name: `Akun ${targetCode}`,
      type: targetCode.startsWith("1") ? "ASSET" : targetCode.startsWith("2") ? "LIABILITY" : targetCode.startsWith("3") ? "EQUITY" : targetCode.startsWith("4") ? "REVENUE" : "EXPENSE",
      normal: targetCode.startsWith("1") || targetCode.startsWith("5") || targetCode.startsWith("6") || targetCode.startsWith("7") ? "DEBIT" : "CREDIT"
    }

    const isNormalDebit = selectedAccount.normal === "DEBIT" || selectedAccount.type === "ASSET" || selectedAccount.type === "EXPENSE"

    // 1. Hitung Saldo Awal Akun (Opening Balance)
    let openingBalance = 0

    // Cek apakah ada record resmi di tabel OpeningBalance untuk tahun ini
    const obRecord = await db.openingBalance.findUnique({
      where: {
        year_accountCode: {
          year,
          accountCode: targetCode
        }
      }
    })

    if (obRecord) {
      if (isNormalDebit) {
        openingBalance += obRecord.type === "DEBIT" ? obRecord.amount : -obRecord.amount
      } else {
        openingBalance += obRecord.type === "CREDIT" ? obRecord.amount : -obRecord.amount
      }
    } else {
      // Jika belum di tabel OpeningBalance, cari di jurnal Memorial Saldo Awal (SA/...) tahun berjalan
      const saLines = await db.journalLine.findMany({
        where: {
          accountCode: targetCode,
          journalEntry: {
            OR: [
              { proofNumber: { startsWith: "SA/" } },
              { description: { contains: "Saldo Awal" } }
            ],
            date: {
              gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
              lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
            }
          }
        },
        select: { type: true, amount: true }
      })

      saLines.forEach((l) => {
        if (isNormalDebit) {
          openingBalance += l.type === "DEBIT" ? l.amount : -l.amount
        } else {
          openingBalance += l.type === "CREDIT" ? l.amount : -l.amount
        }
      })
    }

    // Jika filter bulan dipilih dan bulan > 1 (Februari dst.),
    // tambahkan akumulasi mutasi transaksi dari 1 Jan s.d. sebelum awal bulan berjalan (kecuali jurnal SA)
    if (month && month > 1) {
      const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
      const priorMonthLines = await db.journalLine.findMany({
        where: {
          accountCode: targetCode,
          journalEntry: {
            date: { gte: startOfYear, lt: startDate },
            NOT: {
              OR: [
                { proofNumber: { startsWith: "SA/" } },
                { description: { contains: "Saldo Awal" } }
              ]
            }
          }
        },
        select: { type: true, amount: true }
      })

      priorMonthLines.forEach((l) => {
        if (isNormalDebit) {
          openingBalance += l.type === "DEBIT" ? l.amount : -l.amount
        } else {
          openingBalance += l.type === "CREDIT" ? l.amount : -l.amount
        }
      })
    } else {
      // Jika terdapat mutasi riil bertanggal sebelum tahun berjalan (multi-tahun tanpa tutup buku)
      const historicalLines = await db.journalLine.findMany({
        where: {
          accountCode: targetCode,
          journalEntry: {
            date: { lt: new Date(Date.UTC(year, 0, 1, 0, 0, 0)) }
          }
        },
        select: { type: true, amount: true }
      })
      historicalLines.forEach((l) => {
        if (isNormalDebit) {
          openingBalance += l.type === "DEBIT" ? l.amount : -l.amount
        } else {
          openingBalance += l.type === "CREDIT" ? l.amount : -l.amount
        }
      })
    }

    // 2. Ambil mutasi transaksi pada periode berjalan (startDate s.d. endDate)
    // Jurnal Saldo Awal (SA/...) dikecualikan karena sudah tertuang di baris SALDO AWAL PERIODE
    const currentLines = await db.journalLine.findMany({
      where: {
        accountCode: targetCode,
        journalEntry: {
          date: { gte: startDate, lte: endDate },
          NOT: {
            OR: [
              { proofNumber: { startsWith: "SA/" } },
              { description: { contains: "Saldo Awal" } }
            ]
          }
        }
      },
      include: {
        journalEntry: {
          include: {
            lines: true
          }
        }
      },
      orderBy: [
        { journalEntry: { date: "asc" } },
        { journalEntry: { proofNumber: "asc" } }
      ]
    })

    let runningBalance = openingBalance
    let totalDebit = 0
    let totalCredit = 0

    const entries = currentLines.map((line) => {
      const entry = line.journalEntry
      const debitAmt = line.type === "DEBIT" ? line.amount : 0
      const creditAmt = line.type === "CREDIT" ? line.amount : 0

      totalDebit += debitAmt
      totalCredit += creditAmt

      if (isNormalDebit) {
        runningBalance += debitAmt - creditAmt
      } else {
        runningBalance += creditAmt - debitAmt
      }

      // Cari lawan akun (contra account)
      const contraLines = entry.lines.filter((l) => l.accountCode !== targetCode)
      const contraNames = contraLines
        .map((l) => {
          const acc = accountMap.get(l.accountCode)
          return acc ? `${acc.name} (${l.accountCode})` : l.accountCode
        })
        .join(", ")

      return {
        id: line.id,
        date: entry.date,
        proofNumber: entry.proofNumber,
        proofType: entry.proofType,
        description: entry.description,
        payeeOrPayer: entry.payeeOrPayer,
        unitName: entry.unitName,
        contraAccounts: contraNames || "-",
        debit: debitAmt,
        credit: creditAmt,
        balance: runningBalance
      }
    })

    const closingBalance = runningBalance

    return NextResponse.json({
      success: true,
      meta: {
        year,
        month,
        periodLabel: month ? `Bulan ${month} Tahun ${year}` : `Tahun ${year} Penuh`,
        account: selectedAccount,
        openingBalance,
        totalDebit,
        totalCredit,
        closingBalance
      },
      accounts: accountsList,
      entries
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
