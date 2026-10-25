import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAccountBalance } from "@/lib/ledger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")
    const currentYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    // 1. Cek apakah tahun ini sudah ditutup buku dan memiliki arsip resmi
    const archivedClosing = await db.annualClosing.findUnique({
      where: { year: currentYear }
    })

    if (archivedClosing && archivedClosing.isLocked && archivedClosing.snapshotData) {
      try {
        const snapshot = JSON.parse(archivedClosing.snapshotData)
        return NextResponse.json({
          success: true,
          isArchived: true,
          closingMeta: {
            year: archivedClosing.year,
            closedAt: archivedClosing.closedAt,
            closedBy: archivedClosing.closedBy,
            netProfit: archivedClosing.netProfit,
            padesAmount: archivedClosing.padesAmount,
            cadanganAmount: archivedClosing.cadanganAmount,
            pengurusAmount: archivedClosing.pengurusAmount,
            sosialAmount: archivedClosing.sosialAmount,
            pendidikanAmount: archivedClosing.pendidikanAmount,
            notes: archivedClosing.notes
          },
          data: snapshot
        })
      } catch (e) {
        console.warn("Failed to parse snapshotData, falling back to dynamic calculation:", e)
      }
    }

    // 2. Jika belum ditutup (atau status dibuka kembali), hitung live untuk tahun tersebut
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`)
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`)

    // Ambil metadata akun dari DB
    const allAccounts = await db.ledgerAccount.findMany()
    const accountMap = new Map(allAccounts.map((a) => [a.code, a]))

    // Laba Rugi Operasional (Excluding Memorial Closing JP entries)
    const revExpLines = await db.journalLine.findMany({
      where: {
        journalEntry: {
          date: { gte: startDate, lte: endDate },
          proofType: { not: "MEMORIAL" }
        }
      }
    })

    const revMap = new Map<string, number>()
    const expMap = new Map<string, number>()

    revExpLines.forEach((l) => {
      const code = l.accountCode
      const firstChar = code.charAt(0)
      const acc = accountMap.get(code)
      const isRev = firstChar === "4" || acc?.type === "REVENUE"
      const isExp = ["5", "6", "7"].includes(firstChar) || acc?.type === "EXPENSE"

      if (isRev) {
        const cur = revMap.get(code) || 0
        revMap.set(code, cur + (l.type === "CREDIT" ? l.amount : -l.amount))
      } else if (isExp) {
        const cur = expMap.get(code) || 0
        expMap.set(code, cur + (l.type === "DEBIT" ? l.amount : -l.amount))
      }
    })

    const revenues: { code: string; name: string; amount: number }[] = []
    revMap.forEach((amt, code) => {
      if (amt !== 0) {
        const acc = accountMap.get(code)
        revenues.push({ code, name: acc?.name || `Akun ${code}`, amount: amt })
      }
    })

    const expenses: { code: string; name: string; amount: number }[] = []
    expMap.forEach((amt, code) => {
      if (amt !== 0) {
        const acc = accountMap.get(code)
        expenses.push({ code, name: acc?.name || `Akun ${code}`, amount: amt })
      }
    })

    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0)
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit = totalRevenue - totalExpense

    // Neraca Dinamis per 31 Desember tahun tersebut
    const kasBalances = await db.journalLine.groupBy({
      by: ["accountCode", "type"],
      where: {
        accountCode: { startsWith: "1.1.01" },
        journalEntry: { date: { lte: endDate } }
      },
      _sum: { amount: true }
    })
    let totalKas = 0
    kasBalances.forEach((g) => {
      if (g.type === "DEBIT") totalKas += g._sum.amount || 0
      else totalKas -= g._sum.amount || 0
    })

    const piutangBalances = await db.journalLine.groupBy({
      by: ["type"],
      where: {
        OR: [{ accountCode: { startsWith: "1.1.02" } }, { accountCode: { startsWith: "1.1.03" } }],
        journalEntry: { date: { lte: endDate } }
      },
      _sum: { amount: true }
    })
    let totalPiutang = 0
    piutangBalances.forEach((g) => {
      if (g.type === "DEBIT") totalPiutang += g._sum.amount || 0
      else totalPiutang -= g._sum.amount || 0
    })

    const persediaanBalances = await db.journalLine.groupBy({
      by: ["type"],
      where: {
        OR: [{ accountCode: { startsWith: "1.1.05" } }, { accountCode: { startsWith: "1.1.06" } }],
        journalEntry: { date: { lte: endDate } }
      },
      _sum: { amount: true }
    })
    let totalPersediaan = 0
    persediaanBalances.forEach((g) => {
      if (g.type === "DEBIT") totalPersediaan += g._sum.amount || 0
      else totalPersediaan -= g._sum.amount || 0
    })

    let asetTetap = 0
    const asetTetapBalances = await db.journalLine.groupBy({
      by: ["type"],
      where: {
        accountCode: { startsWith: "1.3.01" },
        journalEntry: { date: { lte: endDate } }
      },
      _sum: { amount: true }
    })
    asetTetapBalances.forEach((g) => {
      if (g.type === "DEBIT") asetTetap += g._sum.amount || 0
      else asetTetap -= g._sum.amount || 0
    })

    let accumPenyusutan = 0
    const accumBalances = await db.journalLine.groupBy({
      by: ["type"],
      where: {
        accountCode: { startsWith: "1.3.02" },
        journalEntry: { date: { lte: endDate } }
      },
      _sum: { amount: true }
    })
    accumBalances.forEach((g) => {
      if (g.type === "CREDIT") accumPenyusutan += g._sum.amount || 0
      else accumPenyusutan -= g._sum.amount || 0
    })

    const currentAssets = [
      { name: "Kas & Setara Kas (Kas Tunai & Rekening Bank)", amount: totalKas },
      { name: "Piutang Usaha / Pinjaman", amount: totalPiutang },
      { name: "Persediaan / Perlengkapan (ATK)", amount: totalPersediaan }
    ]
    const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.amount, 0)
    const netFixedAssets = Math.max(0, asetTetap - accumPenyusutan)
    const totalAssets = totalCurrentAssets + netFixedAssets

    let totalLiabilities = 0
    const liabBalances = await db.journalLine.groupBy({
      by: ["type"],
      where: {
        accountCode: { startsWith: "2." },
        journalEntry: { date: { lte: endDate } }
      },
      _sum: { amount: true }
    })
    liabBalances.forEach((g) => {
      if (g.type === "CREDIT") totalLiabilities += g._sum.amount || 0
      else totalLiabilities -= g._sum.amount || 0
    })

    const liabPokok = await getAccountBalance("2.1.01.01", endDate)
    const liabWajib = await getAccountBalance("2.1.01.02", endDate)
    const liabilities = [
      { name: "Simpanan Pokok Anggota", amount: liabPokok },
      { name: "Simpanan Wajib Anggota", amount: liabWajib },
      { name: "Utang & Kewajiban Lainnya", amount: Math.max(0, totalLiabilities - liabPokok - liabWajib) }
    ]

    const eqModalAwal = await getAccountBalance("3.1.01.01", endDate)
    const eqModalMasy = await getAccountBalance("3.1.02.01", endDate)
    const eqLabaDitahan = await getAccountBalance(["3.1.03.01", "3.2.01.01"], endDate)

    const equity = [
      { name: "Penyertaan Modal Desa (APBDes)", amount: eqModalAwal },
      { name: "Penyertaan Modal Masyarakat", amount: eqModalMasy },
      { name: "Cadangan Modal / Laba Ditahan", amount: eqLabaDitahan },
      { name: "Laba Bersih Periode Berjalan", amount: netProfit }
    ]
    const totalEquity = equity.reduce((s, e) => s + e.amount, 0)
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

    const lpe = {
      modalAwalDesa: eqModalAwal,
      modalAwalMasyarakat: eqModalMasy,
      penambahanModalDesa: 0,
      penambahanModalMasyarakat: 0,
      totalPenyertaanModalAkhir: eqModalAwal + eqModalMasy,
      saldoLabaAwal: eqLabaDitahan,
      labaPeriodeBerjalan: netProfit,
      bagiHasilDesa: 0,
      bagiHasilMasyarakat: 0,
      saldoLabaAkhir: eqLabaDitahan + netProfit,
      ekuitasAkhir: eqModalAwal + eqModalMasy + eqLabaDitahan + netProfit
    }

    const cashLines = await db.journalLine.findMany({
      where: {
        accountCode: { startsWith: "1.1.01" },
        journalEntry: { date: { gte: startDate, lte: endDate } }
      }
    })

    let arusKasMasukOperasi = 0
    let arusKasKeluarOperasi = 0
    let arusKasMasukInvestasi = 0
    let arusKasKeluarInvestasi = 0
    let arusKasMasukPendanaan = 0
    let arusKasKeluarPendanaan = 0

    cashLines.forEach((l) => {
      const isDebit = l.type === "DEBIT"
      const group = (l.cashFlowGroup || "").toLowerCase()

      if (group.includes("investasi") || group.includes("aset tetap")) {
        if (isDebit) arusKasMasukInvestasi += l.amount
        else arusKasKeluarInvestasi += l.amount
      } else if (group.includes("modal") || group.includes("pendanaan")) {
        if (isDebit) arusKasMasukPendanaan += l.amount
        else arusKasKeluarPendanaan += l.amount
      } else {
        if (isDebit) arusKasMasukOperasi += l.amount
        else arusKasKeluarOperasi += l.amount
      }
    })

    const lak = {
      operasi: {
        masuk: arusKasMasukOperasi,
        keluar: arusKasKeluarOperasi,
        bersih: arusKasMasukOperasi - arusKasKeluarOperasi
      },
      investasi: {
        masuk: arusKasMasukInvestasi,
        keluar: arusKasKeluarInvestasi,
        bersih: arusKasMasukInvestasi - arusKasKeluarInvestasi
      },
      pendanaan: {
        masuk: arusKasMasukPendanaan,
        keluar: arusKasKeluarPendanaan,
        bersih: arusKasMasukPendanaan - arusKasKeluarPendanaan
      },
      kenaikanKasBersih:
        arusKasMasukOperasi -
        arusKasKeluarOperasi +
        (arusKasMasukInvestasi - arusKasKeluarInvestasi) +
        (arusKasMasukPendanaan - arusKasKeluarPendanaan),
      saldoKasAkhir: totalKas
    }

    return NextResponse.json({
      success: true,
      isArchived: false,
      data: {
        labaRugi: { revenues, expenses, totalRevenue, totalExpense, netProfit },
        neraca: {
          currentAssets,
          totalCurrentAssets,
          fixedAssets: { peralatan: asetTetap, akumulasiPenyusutan: accumPenyusutan, net: netFixedAssets },
          totalAssets,
          liabilities,
          totalLiabilities,
          equity,
          totalEquity,
          totalLiabilitiesAndEquity
        },
        lpe,
        lak
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
