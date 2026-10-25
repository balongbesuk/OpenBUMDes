import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") || "PIUTANG").toUpperCase() // "PIUTANG" atau "UTANG"
    const partyParam = searchParams.get("party")
    const yearParam = searchParams.get("year")

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    // Tentukan kriteria prefix akun
    const prefixes =
      type === "PIUTANG"
        ? ["1.1.02", "1.1.03", "1.1.04"] // Piutang Usaha, Piutang Lain-lain, Uang Muka
        : ["2.1", "2.2"] // Kewajiban / Utang Usaha, Utang Pajak, Utang Bank

    // Ambil master akun
    const allAccounts = await db.ledgerAccount.findMany({
      orderBy: { code: "asc" }
    })
    const accountMap = new Map(allAccounts.map((a) => [a.code, a]))

    // Ambil seluruh journal line yang menyentuh akun piutang/utang
    const lines = await db.journalLine.findMany({
      where: {
        OR: prefixes.map((prefix) => ({ accountCode: { startsWith: prefix } }))
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

    // Kelompokkan per Pihak Rekanan / Payer / Payee
    const partyMap = new Map<string, any>()

    lines.forEach((line) => {
      const entry = line.journalEntry
      const party = (entry.payeeOrPayer || "Umum / Tanpa Nama").trim()

      if (!partyMap.has(party)) {
        partyMap.set(party, {
          name: party,
          totalAdd: 0, // Penambahan Piutang (Debit) / Penambahan Utang (Kredit)
          totalPay: 0, // Pelunasan Piutang (Kredit) / Pelunasan Utang (Debit)
          balance: 0,
          entries: []
        })
      }

      const pData = partyMap.get(party)
      const isDebit = line.type === "DEBIT"
      const isCredit = line.type === "CREDIT"

      let add = 0
      let pay = 0

      if (type === "PIUTANG") {
        // Piutang: Tambah di Debit, Berkurang (Bayar) di Kredit
        if (isDebit) add = line.amount
        else pay = line.amount
        pData.totalAdd += add
        pData.totalPay += pay
        pData.balance += add - pay
      } else {
        // Utang: Tambah di Kredit, Berkurang (Bayar) di Debit
        if (isCredit) add = line.amount
        else pay = line.amount
        pData.totalAdd += add
        pData.totalPay += pay
        pData.balance += add - pay
      }

      // Cari lawan akun
      const contraLines = entry.lines.filter((l) => l.accountCode !== line.accountCode)
      const contraNames = contraLines
        .map((l) => {
          const acc = accountMap.get(l.accountCode)
          return acc ? `${acc.name} (${l.accountCode})` : l.accountCode
        })
        .join(", ")

      pData.entries.push({
        id: line.id,
        date: entry.date,
        proofNumber: entry.proofNumber,
        proofType: entry.proofType,
        accountCode: line.accountCode,
        accountName: accountMap.get(line.accountCode)?.name || line.accountCode,
        description: entry.description,
        contraAccounts: contraNames || "-",
        add,
        pay,
        balance: pData.balance
      })
    })

    const partiesList = Array.from(partyMap.values()).map((p) => ({
      name: p.name,
      totalAdd: p.totalAdd,
      totalPay: p.totalPay,
      balance: p.balance,
      transactionCount: p.entries.length
    }))

    // Tentukan pihak yang sedang dipilih
    const selectedPartyName =
      partyParam || (partiesList.length > 0 ? partiesList[0].name : null)

    const selectedPartyData = selectedPartyName ? partyMap.get(selectedPartyName) || null : null

    // Total Agregat seluruh rekanan
    const grandTotalAdd = partiesList.reduce((s, p) => s + p.totalAdd, 0)
    const grandTotalPay = partiesList.reduce((s, p) => s + p.totalPay, 0)
    const grandTotalBalance = partiesList.reduce((s, p) => s + p.balance, 0)

    return NextResponse.json({
      success: true,
      meta: {
        type,
        year,
        typeLabel: type === "PIUTANG" ? "Buku Pembantu Piutang" : "Buku Pembantu Utang / Kewajiban",
        grandTotalAdd,
        grandTotalPay,
        grandTotalBalance,
        totalParties: partiesList.length
      },
      parties: partiesList,
      selectedParty: selectedPartyData
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
