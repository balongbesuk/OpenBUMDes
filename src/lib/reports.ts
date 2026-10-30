import { db } from "@/lib/db"

export interface FinancialReportsResult {
  labaRugi: {
    revenues: { code: string; name: string; amount: number }[]
    expenses: { code: string; name: string; amount: number }[]
    totalRevenue: number
    totalExpense: number
    netProfit: number
  }
  neraca: {
    currentAssets: { name: string; amount: number }[]
    totalCurrentAssets: number
    fixedAssets: { peralatan: number; akumulasiPenyusutan: number; net: number }
    totalAssets: number
    liabilities: { name: string; amount: number }[]
    totalLiabilities: number
    equity: { name: string; amount: number }[]
    totalEquity: number
    totalLiabilitiesAndEquity: number
  }
  lpe: {
    modalAwalDesa: number
    modalAwalMasyarakat: number
    penambahanModalDesa: number
    penambahanModalMasyarakat: number
    totalPenyertaanModalAkhir: number
    saldoLabaAwal: number
    labaPeriodeBerjalan: number
    bagiHasilDesa: number
    bagiHasilMasyarakat: number
    saldoLabaAkhir: number
    ekuitasAkhir: number
  }
  lak: {
    saldoKasAwal: number
    operasi: { masuk: number; keluar: number; bersih: number }
    investasi: { masuk: number; keluar: number; bersih: number }
    pendanaan: { masuk: number; keluar: number; bersih: number }
    kenaikanKasBersih: number
    saldoKasAkhir: number
  }
}

export async function calculateFinancialReports(year: number): Promise<FinancialReportsResult> {
  const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))

  const allAccounts = await db.ledgerAccount.findMany({
    orderBy: { code: "asc" }
  })
  const accountMap = new Map(allAccounts.map((a) => [a.code, a]))

  // 1. LABA RUGI OPERASIONAL (sertakan Memorial Penyusutan/Penyesuaian, kecualikan Jurnal Penutup JP/ & Saldo Awal SA/)
  const revExpLines = await db.journalLine.findMany({
    where: {
      journalEntry: {
        date: { gte: startDate, lte: endDate },
        NOT: {
          OR: [
            { proofNumber: { startsWith: "JP/" } },
            { proofNumber: { startsWith: "SA/" } },
            { proofNumber: { startsWith: "SA-" } }
          ]
        }
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

  // 2. NERACA TAHUNAN
  // Check if roll-forward opening entry (SA) exists for this year
  const hasOpeningJournal = await db.journalEntry.findFirst({
    where: {
      proofNumber: { startsWith: `SA/${year}/` }
    },
    select: { id: true }
  })

  // If SA entry exists for this year, start cumulative balance from this year's startDate
  // to prevent double-counting prior year entries!
  const balanceWhere: any = hasOpeningJournal
    ? { journalEntry: { date: { gte: startDate, lte: endDate } } }
    : { journalEntry: { date: { lte: endDate } } }

  const allBalanceLines = await db.journalLine.findMany({
    where: balanceWhere,
    include: {
      journalEntry: { select: { date: true, proofType: true } }
    }
  })

  let totalKas = 0
  let totalPiutang = 0
  let totalPersediaan = 0
  let totalAsetLancarLain = 0
  let asetTetap = 0
  let accumPenyusutan = 0
  let totalLiabilities = 0
  let liabPokok = 0
  let liabWajib = 0
  let eqModalDesa = 0
  let eqModalMasy = 0
  let eqCadanganLabaDitahan = 0
  let bagiHasilDesaBerjalan = 0

  allBalanceLines.forEach((l) => {
    const code = l.accountCode
    const isDebit = l.type === "DEBIT"
    const netDebit = isDebit ? l.amount : -l.amount
    const netCredit = !isDebit ? l.amount : -l.amount
    const acc = accountMap.get(code)
    const isAccPenyusutan =
      code.startsWith("1.3.07") ||
      code.startsWith("1.3.08") ||
      acc?.normal === "Kredit" ||
      (acc?.name || "").toLowerCase().includes("akumulasi")

    // Aset
    if (code.startsWith("1.1.01")) {
      totalKas += netDebit
    } else if (code.startsWith("1.1.02") || code.startsWith("1.1.03") || code.startsWith("1.1.04")) {
      totalPiutang += netDebit
    } else if (code.startsWith("1.1.05") || code.startsWith("1.1.06")) {
      totalPersediaan += netDebit
    } else if (code.startsWith("1.1")) {
      totalAsetLancarLain += netDebit
    } else if (code.startsWith("1.3")) {
      if (isAccPenyusutan) {
        accumPenyusutan += netCredit
      } else {
        asetTetap += netDebit
      }
    }

    // Kewajiban
    if (code.startsWith("2.")) {
      totalLiabilities += netCredit
      if (code === "2.1.01.01") liabPokok += netCredit
      else if (code === "2.1.01.02") liabWajib += netCredit
      else if (code.startsWith("2.1.05")) liabWajib += netCredit
    }

    // Ekuitas
    if (code.startsWith("3.1.01")) {
      eqModalDesa += netCredit
    } else if (code.startsWith("3.1.02")) {
      eqModalMasy += netCredit
    } else if (code.startsWith("3.1.03") || code.startsWith("3.2") || code.startsWith("3.3")) {
      eqCadanganLabaDitahan += netCredit
      if (isDebit && l.journalEntry.date >= startDate && l.journalEntry.date <= endDate) {
        bagiHasilDesaBerjalan += l.amount
      }
    }
  })

  const currentAssets = [
    { name: "Kas & Setara Kas (Kas Tunai & Rekening Bank)", amount: totalKas },
    { name: "Piutang Usaha / Pinjaman", amount: totalPiutang },
    { name: "Persediaan / Perlengkapan (ATK)", amount: totalPersediaan }
  ]
  if (totalAsetLancarLain !== 0) {
    currentAssets.push({ name: "Aset Lancar Lainnya", amount: totalAsetLancarLain })
  }

  const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.amount, 0)
  const netFixedAssets = asetTetap - accumPenyusutan
  const totalAssets = totalCurrentAssets + netFixedAssets

  const otherLiabilities = totalLiabilities - liabPokok - liabWajib
  const liabilities = [
    { name: "Simpanan Pokok Anggota", amount: liabPokok },
    { name: "Simpanan Wajib Anggota", amount: liabWajib },
    { name: "Utang & Kewajiban Lainnya", amount: otherLiabilities }
  ]

  const equity = [
    { name: "Penyertaan Modal Desa (APBDes)", amount: eqModalDesa },
    { name: "Penyertaan Modal Masyarakat", amount: eqModalMasy },
    { name: "Cadangan Modal & Saldo Laba Ditahan", amount: eqCadanganLabaDitahan },
    { name: "Laba Bersih Periode Berjalan (SHU)", amount: netProfit }
  ]
  const totalEquity = eqModalDesa + eqModalMasy + eqCadanganLabaDitahan + netProfit
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  // 3. LPE (Laporan Perubahan Ekuitas)
  const saldoLabaAwalTahun = eqCadanganLabaDitahan + bagiHasilDesaBerjalan
  const saldoLabaAkhirTahun = eqCadanganLabaDitahan + netProfit
  const lpe = {
    modalAwalDesa: eqModalDesa,
    modalAwalMasyarakat: eqModalMasy,
    penambahanModalDesa: 0,
    penambahanModalMasyarakat: 0,
    totalPenyertaanModalAkhir: eqModalDesa + eqModalMasy,
    saldoLabaAwal: saldoLabaAwalTahun,
    labaPeriodeBerjalan: netProfit,
    bagiHasilDesa: bagiHasilDesaBerjalan,
    bagiHasilMasyarakat: 0,
    saldoLabaAkhir: saldoLabaAkhirTahun,
    ekuitasAkhir: eqModalDesa + eqModalMasy + saldoLabaAkhirTahun
  }

  // 4. LAK (Laporan Arus Kas)
  let saldoKasAwal = 0
  const obCash = await db.openingBalance.findMany({
    where: {
      year,
      accountCode: { startsWith: "1.1.01" }
    }
  })

  if (obCash.length > 0) {
    obCash.forEach((o) => {
      if (o.type === "DEBIT") saldoKasAwal += o.amount
      else saldoKasAwal -= o.amount
    })
  } else {
    // Check previous year closing snapshot
    const prevClosing = await db.annualClosing.findFirst({
      where: { year: year - 1 }
    })
    if (prevClosing?.snapshotData) {
      try {
        const snap = JSON.parse(prevClosing.snapshotData)
        saldoKasAwal = snap.lak?.saldoKasAkhir || 0
      } catch {}
    } else {
      // Prior transactions before this year
      const priorCashLines = await db.journalLine.findMany({
        where: {
          accountCode: { startsWith: "1.1.01" },
          journalEntry: { date: { lt: startDate } }
        }
      })
      priorCashLines.forEach((l) => {
        if (l.type === "DEBIT") saldoKasAwal += l.amount
        else saldoKasAwal -= l.amount
      })
    }
  }

  const cashLinesYear = await db.journalLine.findMany({
    where: {
      accountCode: { startsWith: "1.1.01" },
      journalEntry: {
        date: { gte: startDate, lte: endDate },
        NOT: {
          OR: [
            { proofNumber: { startsWith: "SA/" } },
            { description: { contains: "Saldo Awal" } }
          ]
        }
      }
    }
  })

  let arusKasMasukOperasi = 0
  let arusKasKeluarOperasi = 0
  let arusKasMasukInvestasi = 0
  let arusKasKeluarInvestasi = 0
  let arusKasMasukPendanaan = 0
  let arusKasKeluarPendanaan = 0

  cashLinesYear.forEach((l) => {
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
    saldoKasAwal,
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

  return {
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
}
