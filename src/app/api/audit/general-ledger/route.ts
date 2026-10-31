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

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getUTCFullYear()
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

    const allAccounts = await db.ledgerAccount.findMany({
      orderBy: { code: "asc" }
    })
    const accountMap = new Map<string, { code: string; name: string; type: string; normal: string }>(
      allAccounts.map((a) => [a.code, a])
    )

    const distinctCodes = await db.journalLine.findMany({
      select: { accountCode: true },
      distinct: ["accountCode"]
    })
    const activeCodeSet = new Set(distinctCodes.map((d) => d.accountCode))
    for (const code of activeCodeSet) {
      if (!accountMap.has(code)) {
        const isNormalDeb = code.startsWith("1") || code.startsWith("5") || code.startsWith("6") || code.startsWith("7")
        accountMap.set(code, {
          code,
          name: `Akun ${code} (Belum Terdaftar COA)`,
          type: code.startsWith("1") ? "ASSET" : code.startsWith("2") ? "LIABILITY" : code.startsWith("3") ? "EQUITY" : code.startsWith("4") ? "REVENUE" : "EXPENSE",
          normal: isNormalDeb ? "Debit" : "Kredit"
        })
      }
    }

    const accountsList = Array.from(accountMap.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((acc) => ({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normal: acc.normal,
        hasTransactions: activeCodeSet.has(acc.code)
      }))

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

    const normalUpper = (selectedAccount.normal || "").toUpperCase()
    const isContraAsset =
      normalUpper === "KREDIT" ||
      normalUpper === "CREDIT" ||
      selectedAccount.code.startsWith("1.3.07") ||
      selectedAccount.code.startsWith("1.3.08") ||
      selectedAccount.code.startsWith("1.1.04") ||
      selectedAccount.code.startsWith("1.9.01.02") ||
      (selectedAccount.name || "").toLowerCase().includes("akumulasi") ||
      (selectedAccount.name || "").toLowerCase().includes("penyisihan")

    const isNormalDebit =
      !isContraAsset &&
      (normalUpper === "DEBIT" ||
        selectedAccount.type === "ASSET" ||
        selectedAccount.type === "EXPENSE" ||
        selectedAccount.code.startsWith("1") ||
        selectedAccount.code.startsWith("5") ||
        selectedAccount.code.startsWith("6") ||
        selectedAccount.code.startsWith("7"))

    // 1. Hitung Saldo Awal Akun (Opening Balance)
    let openingBalance = 0

    const obRecord = await db.openingBalance.findUnique({
      where: {
        year_accountCode: {
          year,
          accountCode: targetCode
        }
      }
    })

    let hasSaLines = false
    if (obRecord) {
      if (isNormalDebit) {
        openingBalance += obRecord.type === "DEBIT" ? obRecord.amount : -obRecord.amount
      } else {
        openingBalance += obRecord.type === "CREDIT" ? obRecord.amount : -obRecord.amount
      }
    } else {
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

      hasSaLines = saLines.length > 0
      saLines.forEach((l) => {
        if (isNormalDebit) {
          openingBalance += l.type === "DEBIT" ? l.amount : -l.amount
        } else {
          openingBalance += l.type === "CREDIT" ? l.amount : -l.amount
        }
      })
    }

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
                { proofNumber: { startsWith: `JP/${year}/` } },
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
    } else if (!obRecord && !hasSaLines) {
      // Akun Neraca (1, 2, 3) mewarisi saldo historis lintas tahun termasuk hasil jurnal penutup JP/ tahun lalu
      const isBalanceSheetAccount =
        targetCode.startsWith("1") || targetCode.startsWith("2") || targetCode.startsWith("3")
      if (isBalanceSheetAccount) {
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
    }

    // 2. Ambil mutasi operasional periode berjalan (kecualikan SA/... & JP/{year}/...)
    const currentLines = await db.journalLine.findMany({
      where: {
        accountCode: targetCode,
        journalEntry: {
          date: { gte: startDate, lte: endDate },
          NOT: {
            OR: [
              { proofNumber: { startsWith: "SA/" } },
              { proofNumber: { startsWith: `JP/${year}/` } },
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
