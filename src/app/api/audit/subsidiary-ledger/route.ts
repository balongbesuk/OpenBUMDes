import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { postJournalEntry } from "@/lib/ledger"

export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = (searchParams.get("type") || "PIUTANG").toUpperCase() // "PIUTANG" | "UTANG" | "BANK" | "PAJAK"
    const partyParam = searchParams.get("party")
    const yearParam = searchParams.get("year")

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    // Ambil master akun
    const allAccounts = await db.ledgerAccount.findMany({
      orderBy: { code: "asc" }
    })
    const accountMap = new Map(allAccounts.map((a) => [a.code, a]))

    // Cek apakah tahun terpilih memiliki Jurnal Saldo Awal (SA/{year}/) agar tidak double-count lintas tahun
    const hasSaCount = await db.journalEntry.count({
      where: { proofNumber: { startsWith: `SA/${year}/` } }
    })

    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
    const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
    const dateFilter = hasSaCount > 0 ? { gte: startOfYear, lte: endOfYear } : { lte: endOfYear }

    // Tentukan kriteria filter akun berdasarkan jenis buku pembantu
    let whereAccount: any = {}
    if (type === "PIUTANG") {
      whereAccount = {
        OR: ["1.1.02", "1.1.03"].map((prefix) => ({ accountCode: { startsWith: prefix } }))
      }
    } else if (type === "UTANG") {
      whereAccount = {
        OR: ["2.1", "2.2"].map((prefix) => ({ accountCode: { startsWith: prefix } })),
        NOT: { accountCode: { startsWith: "2.1.02" } } // Pisahkan Utang Pajak ke Buku Pajak
      }
    } else if (type === "BANK") {
      whereAccount = {
        OR: [
          {
            accountCode: { startsWith: "1.1.01." },
            NOT: { accountCode: { in: ["1.1.01.01", "1.1.01.98"] } }
          },
          { accountCode: { startsWith: "1.1.02" } }
        ]
      }
    } else if (type === "PAJAK") {
      // Sesuai Kepmendes 136: Tarik Utang Pajak Pungut/Potong (2.1.02.xx) DAN Beban Pajak Badan/Final (7.3.01.xx)
      whereAccount = {
        OR: [
          { accountCode: { startsWith: "2.1.02" } },
          { accountCode: { startsWith: "7.3.01" } }
        ]
      }
    }

    const rawLines = await db.journalLine.findMany({
      where: {
        ...whereAccount,
        journalEntry: {
          date: dateFilter,
          NOT: { proofNumber: { startsWith: "JP/" } }
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

    // Disambiguasi kode 1.1.02 (Deposito Bank vs Piutang USP) & batasi beban pajak 7.3.01 di tahun berjalan:
    const lines = rawLines.filter((l) => {
      if (l.accountCode.startsWith("7.3.01") && new Date(l.journalEntry.date) < startOfYear) return false
      if (!l.accountCode.startsWith("1.1.02")) return true
      const accName = (accountMap.get(l.accountCode)?.name || "").toLowerCase()
      const desc = (l.journalEntry.description || "").toLowerCase()
      const isUspReceivable =
        accName.includes("piutang") ||
        accName.includes("pinjaman") ||
        l.journalEntry.proofNumber.startsWith("SA-USP") ||
        desc.includes("simpan pinjam")
      return type === "PIUTANG" ? isUspReceivable : !isUspReceivable
    })

    const partyMap = new Map<string, any>()

    // Pre-populate daftar rekening Bank atau Jenis Pajak agar tetap muncul di dropdown meskipun belum ada mutasi
    if (type === "BANK") {
      partyMap.set("Semua Rekening Bank (Gabungan)", {
        name: "Semua Rekening Bank (Gabungan)",
        accountCode: "ALL_BANK",
        totalAdd: 0,
        totalPay: 0,
        balance: 0,
        entries: []
      })
      const bankAccounts = allAccounts.filter(
        (a) =>
          (a.code.startsWith("1.1.01.") && a.code !== "1.1.01.01" && a.code !== "1.1.01.98") ||
          (a.code.startsWith("1.1.02.") && !a.name.toLowerCase().includes("piutang"))
      )
      for (const acc of bankAccounts) {
        const key = `${acc.code} - ${acc.name}`
        partyMap.set(key, {
          name: key,
          accountCode: acc.code,
          totalAdd: 0,
          totalPay: 0,
          balance: 0,
          entries: []
        })
      }
    } else if (type === "PAJAK") {
      partyMap.set("Semua Jenis Pajak (Gabungan)", {
        name: "Semua Jenis Pajak (Gabungan)",
        accountCode: "ALL_TAX",
        totalAdd: 0,
        totalPay: 0,
        balance: 0,
        entries: []
      })
      const taxAccounts = allAccounts.filter(
        (a) => a.code.startsWith("2.1.02") || a.code.startsWith("7.3.01")
      )
      for (const acc of taxAccounts) {
        const key = `${acc.code} - ${acc.name}`
        partyMap.set(key, {
          name: key,
          accountCode: acc.code,
          totalAdd: 0,
          totalPay: 0,
          balance: 0,
          entries: []
        })
      }
    }

    const pushLineToBucket = (bucketKey: string, line: any, isNormalDebit: boolean) => {
      if (!partyMap.has(bucketKey)) {
        partyMap.set(bucketKey, {
          name: bucketKey,
          totalAdd: 0,
          totalPay: 0,
          balance: 0,
          entries: []
        })
      }

      const pData = partyMap.get(bucketKey)
      const entry = line.journalEntry
      const isDebit = line.type === "DEBIT"

      let add = 0
      let pay = 0

      if (type === "PAJAK" && line.accountCode.startsWith("7.3.01")) {
        // Pembayaran Beban Pajak Badan/Final (7.3.01.xx):
        // Jika lawan akunnya Kas/Bank (dibayar langsung tanpa mampir ke Utang Pajak 2.1.02),
        // maka dicatat sekaligus di kolom Kewajiban Pajak (add) & Setor Pajak (pay) = Sisa Rp 0.
        const hasTaxLiabilityLine = entry.lines.some((l: any) => l.accountCode.startsWith("2.1.02"))
        if (hasTaxLiabilityLine) {
          // Jika sudah ada baris 2.1.02 di jurnal yang sama, lewati baris 7.3.01 agar tidak dobel catat
          return
        }
        if (isDebit) {
          add = line.amount
          pay = line.amount
        } else {
          // Koreksi/reversal beban pajak
          add = -line.amount
          pay = -line.amount
        }
      } else if (isNormalDebit) {
        // PIUTANG & BANK: Normal Debit (Tambah/Setor di Debit, Kurang/Tarik di Kredit)
        if (isDebit) add = line.amount
        else pay = line.amount
      } else {
        // UTANG & PAJAK (2.1.02): Normal Kredit (Tambah/Potong di Kredit, Bayar/Setor di Debit)
        if (!isDebit) add = line.amount
        else pay = line.amount
      }

      pData.totalAdd += add
      pData.totalPay += pay
      pData.balance += add - pay

      const contraLines = entry.lines.filter((l: any) => l.id !== line.id)
      const contraNames = contraLines
        .map((l: any) => {
          const acc = accountMap.get(l.accountCode)
          return acc ? `${acc.name} (${l.accountCode})` : l.accountCode
        })
        .join(", ")

      pData.entries.push({
        id: `${line.id}-${bucketKey}`,
        date: entry.date,
        proofNumber: entry.proofNumber,
        proofType: entry.proofType,
        accountCode: line.accountCode,
        accountName: accountMap.get(line.accountCode)?.name || line.accountCode,
        payeeOrPayer: entry.payeeOrPayer || "-",
        description: entry.description,
        note: entry.note || null,
        contraAccounts: contraNames || "-",
        add,
        pay,
        balance: pData.balance
      })
    }

    lines.forEach((line) => {
      const entry = line.journalEntry
      const acc = accountMap.get(line.accountCode)
      const accLabel = acc ? `${acc.code} - ${acc.name}` : line.accountCode

      if (type === "BANK") {
        pushLineToBucket("Semua Rekening Bank (Gabungan)", line, true)
        pushLineToBucket(accLabel, line, true)
      } else if (type === "PAJAK") {
        pushLineToBucket("Semua Jenis Pajak (Gabungan)", line, false)
        pushLineToBucket(accLabel, line, false)
      } else if (type === "PIUTANG") {
        const party = (entry.payeeOrPayer || "Umum / Tanpa Nama").trim()
        pushLineToBucket(party, line, true)
      } else {
        const party = (entry.payeeOrPayer || "Umum / Tanpa Nama").trim()
        pushLineToBucket(party, line, false)
      }
    })

    // Untuk PAJAK, urutkan akun yang punya transaksi di atas (setelah Semua Jenis Pajak)
    const rawPartiesList = Array.from(partyMap.values()).map((p) => ({
      name: p.name,
      accountCode: p.accountCode || null,
      totalAdd: p.totalAdd,
      totalPay: p.totalPay,
      balance: p.balance,
      transactionCount: p.entries.length
    }))

    const partiesList =
      type === "PAJAK" || type === "BANK"
        ? [
            rawPartiesList[0],
            ...rawPartiesList.slice(1).sort((a, b) => b.transactionCount - a.transactionCount)
          ]
        : rawPartiesList

    // Tentukan pilihan aktif
    let defaultPartyName: string | null = null
    if (partiesList.length > 0) {
      if (type === "BANK") {
        const withTx = partiesList.find((p) => p.accountCode !== "ALL_BANK" && p.transactionCount > 0)
        defaultPartyName = withTx ? withTx.name : partiesList[0].name
      } else {
        defaultPartyName = partiesList[0].name
      }
    }

    const selectedPartyName =
      partyParam && partyMap.has(partyParam) ? partyParam : defaultPartyName

    const selectedPartyData = selectedPartyName ? partyMap.get(selectedPartyName) || null : null

    // Hitung Grand Total tanpa double-count bucket gabungan
    const nonAggregateParties = partiesList.filter(
      (p) => p.accountCode !== "ALL_BANK" && p.accountCode !== "ALL_TAX"
    )
    const grandTotalAdd = nonAggregateParties.reduce((s, p) => s + p.totalAdd, 0)
    const grandTotalPay = nonAggregateParties.reduce((s, p) => s + p.totalPay, 0)
    const grandTotalBalance = nonAggregateParties.reduce((s, p) => s + p.balance, 0)

    const typeLabels: Record<string, string> = {
      PIUTANG: "Buku Pembantu Piutang",
      UTANG: "Buku Pembantu Utang / Kewajiban",
      BANK: "Buku Kas Pembantu Bank",
      PAJAK: "Buku Pembantu Pajak"
    }

    return NextResponse.json({
      success: true,
      meta: {
        type,
        year,
        typeLabel: typeLabels[type] || "Buku Pembantu",
        grandTotalAdd,
        grandTotalPay,
        grandTotalBalance,
        totalParties: nonAggregateParties.length
      },
      parties: partiesList,
      selectedParty: selectedPartyData
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const body = await request.json()
    const { action, date, amount, description, payeeOrPayer, unitName } = body

    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: "Nominal harus lebih dari 0" }, { status: 400 })
    }

    const txDate = date ? new Date(date) : new Date()
    const txYear = txDate.getUTCFullYear()

    // Proteksi Tutup Buku Tahunan
    const lockedYear = await db.annualClosing.findUnique({ where: { year: txYear } })
    if (lockedYear?.isLocked) {
      return NextResponse.json(
        { success: false, error: `Tahun buku ${txYear} sudah ditutup dan dikunci.` },
        { status: 403 }
      )
    }

    if (action === "RECORD_BANK") {
      const bankAccountCode = body.bankAccountCode || "1.1.01.06"
      const subType = body.subType || "BUNGA_BANK" // BUNGA_BANK | ADMIN_BANK | PAJAK_BUNGA | SETOR_TUNAI | TARIK_TUNAI

      let proofType: "BKM" | "BKK" = "BKM"
      let lines: { accountCode: string; type: "DEBIT" | "CREDIT"; amount: number; cashFlowGroup?: string }[] = []
      let defaultDesc = ""

      if (subType === "BUNGA_BANK") {
        proofType = "BKM"
        defaultDesc = "Pendapatan Bunga / Jasa Giro Bank"
        lines = [
          { accountCode: bankAccountCode, type: "DEBIT", amount: numAmount, cashFlowGroup: "OPERATING" },
          { accountCode: "7.1.01.01", type: "CREDIT", amount: numAmount, cashFlowGroup: "OPERATING" }
        ]
      } else if (subType === "ADMIN_BANK") {
        proofType = "BKK"
        defaultDesc = "Biaya Administrasi Rekening Bank"
        lines = [
          { accountCode: "7.2.01.01", type: "DEBIT", amount: numAmount, cashFlowGroup: "OPERATING" },
          { accountCode: bankAccountCode, type: "CREDIT", amount: numAmount, cashFlowGroup: "OPERATING" }
        ]
      } else if (subType === "PAJAK_BUNGA") {
        proofType = "BKK"
        defaultDesc = "Potongan Pajak Bunga Bank"
        lines = [
          { accountCode: "7.3.01.02", type: "DEBIT", amount: numAmount, cashFlowGroup: "OPERATING" },
          { accountCode: bankAccountCode, type: "CREDIT", amount: numAmount, cashFlowGroup: "OPERATING" }
        ]
      } else if (subType === "SETOR_TUNAI") {
        proofType = "BKK"
        defaultDesc = "Setor Tunai Kas Bendahara ke Rekening Bank"
        lines = [
          { accountCode: bankAccountCode, type: "DEBIT", amount: numAmount },
          { accountCode: "1.1.01.01", type: "CREDIT", amount: numAmount }
        ]
      } else if (subType === "TARIK_TUNAI") {
        proofType = "BKM"
        defaultDesc = "Penarikan Tunai dari Rekening Bank ke Kas Bendahara"
        lines = [
          { accountCode: "1.1.01.01", type: "DEBIT", amount: numAmount },
          { accountCode: bankAccountCode, type: "CREDIT", amount: numAmount }
        ]
      } else {
        return NextResponse.json({ success: false, error: "Jenis mutasi bank tidak valid" }, { status: 400 })
      }

      const result = await postJournalEntry(
        txDate,
        proofType,
        description?.trim() || defaultDesc,
        payeeOrPayer?.trim() || "Bank Operasional BUMDes",
        lines,
        unitName || "Umum",
        body.note || null
      )

      return NextResponse.json({ success: true, data: result.entry })
    }

    if (action === "RECORD_PAJAK") {
      const taxAccountCode = body.taxAccountCode || "2.1.02.01"
      const subType = body.subType || "POTONG_PAJAK" // POTONG_PAJAK | SETOR_PAJAK | BAYAR_PAJAK_LANGSUNG
      const cashOrCounterCode = body.counterAccountCode || "1.1.01.01"
      const ntpn = body.ntpn?.trim()

      let proofType: "BKM" | "BKK" | "MEMORIAL" = "BKM"
      let lines: { accountCode: string; type: "DEBIT" | "CREDIT"; amount: number; cashFlowGroup?: string }[] = []
      let defaultDesc = ""

      if (subType === "BAYAR_PAJAK_LANGSUNG") {
        // Pembayaran Beban Pajak Badan/Final langsung dari Kas/Bank ke 7.3.01.xx
        proofType = "BKK"
        defaultDesc = `Pembayaran Pajak Penerimaan Negara${ntpn ? ` (NTPN: ${ntpn})` : ""}`
        lines = [
          { accountCode: taxAccountCode, type: "DEBIT", amount: numAmount, cashFlowGroup: "OPERATING" },
          { accountCode: cashOrCounterCode, type: "CREDIT", amount: numAmount, cashFlowGroup: "OPERATING" }
        ]
      } else if (subType === "POTONG_PAJAK") {
        const isCash = cashOrCounterCode.startsWith("1.1.01") || cashOrCounterCode.startsWith("1.1.02")
        proofType = isCash ? "BKM" : "MEMORIAL"
        defaultDesc = "Pemungutan / Pemotongan Pajak Bendahara"
        lines = [
          {
            accountCode: cashOrCounterCode,
            type: "DEBIT",
            amount: numAmount,
            cashFlowGroup: isCash ? "OPERATING" : undefined
          },
          { accountCode: taxAccountCode, type: "CREDIT", amount: numAmount }
        ]
      } else if (subType === "SETOR_PAJAK") {
        proofType = "BKK"
        defaultDesc = `Penyetoran Pajak ke Kas Negara${ntpn ? ` (NTPN: ${ntpn})` : ""}`
        lines = [
          { accountCode: taxAccountCode, type: "DEBIT", amount: numAmount },
          {
            accountCode: cashOrCounterCode,
            type: "CREDIT",
            amount: numAmount,
            cashFlowGroup: "OPERATING"
          }
        ]
      } else {
        return NextResponse.json({ success: false, error: "Jenis transaksi pajak tidak valid" }, { status: 400 })
      }

      const result = await postJournalEntry(
        txDate,
        proofType,
        description?.trim() || defaultDesc,
        payeeOrPayer?.trim() || "Kementerian Keuangan / Kas Negara",
        lines,
        unitName || "Umum",
        ntpn ? `NTPN: ${ntpn}` : body.note || null
      )

      return NextResponse.json({ success: true, data: result.entry })
    }

    return NextResponse.json({ success: false, error: "Action tidak dikenali" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
