import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { postJournalEntry } from "@/lib/ledger"
import { getUserSession } from "@/lib/auth"

// Helper function to build a full snapshot of 5 financial reports for a given year
async function generateYearReportsSnapshot(year: number) {
  const endDate = new Date(`${year}-12-31T23:59:59.999Z`)
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`)

  const allAccounts = await db.ledgerAccount.findMany()
  const accountMap = new Map(allAccounts.map((a) => [a.code, a]))

  // 1. LABA RUGI TAHUNAN (Tanpa jurnal penutup JP agar mencerminkan operasional riil)
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

  // 2. NERACA TAHUNAN (Per 31 Desember)
  // Kas
  const kasLines = await db.journalLine.findMany({
    where: {
      accountCode: { startsWith: "1.1.01" },
      journalEntry: { date: { lte: endDate } }
    }
  })
  let totalKas = 0
  kasLines.forEach((l) => {
    totalKas += l.type === "DEBIT" ? l.amount : -l.amount
  })

  // Piutang
  const piutangLines = await db.journalLine.findMany({
    where: {
      OR: [{ accountCode: { startsWith: "1.1.02" } }, { accountCode: { startsWith: "1.1.03" } }],
      journalEntry: { date: { lte: endDate } }
    }
  })
  let totalPiutang = 0
  piutangLines.forEach((l) => {
    totalPiutang += l.type === "DEBIT" ? l.amount : -l.amount
  })

  // Persediaan
  const persediaanLines = await db.journalLine.findMany({
    where: {
      OR: [{ accountCode: { startsWith: "1.1.05" } }, { accountCode: { startsWith: "1.1.06" } }],
      journalEntry: { date: { lte: endDate } }
    }
  })
  let totalPersediaan = 0
  persediaanLines.forEach((l) => {
    totalPersediaan += l.type === "DEBIT" ? l.amount : -l.amount
  })

  // Aset Tetap & Akumulasi Penyusutan
  const fixedLines = await db.journalLine.findMany({
    where: {
      accountCode: { startsWith: "1.3" },
      journalEntry: { date: { lte: endDate } }
    }
  })
  let asetTetap = 0
  let accumPenyusutan = 0
  fixedLines.forEach((l) => {
    const code = l.accountCode
    const acc = accountMap.get(code)
    const isAccPenyusutan =
      code.startsWith("1.3.07") ||
      code.startsWith("1.3.08") ||
      acc?.normal === "Kredit" ||
      (acc?.name || "").toLowerCase().includes("akumulasi")
    if (isAccPenyusutan) {
      accumPenyusutan += l.type === "CREDIT" ? l.amount : -l.amount
    } else {
      asetTetap += l.type === "DEBIT" ? l.amount : -l.amount
    }
  })

  const currentAssets = [
    { name: "Kas & Setara Kas (Kas Tunai & Rekening Bank)", amount: totalKas },
    { name: "Piutang Usaha / Pinjaman", amount: totalPiutang },
    { name: "Persediaan / Perlengkapan (ATK)", amount: totalPersediaan }
  ]
  const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.amount, 0)
  const netFixedAssets = Math.max(0, asetTetap - accumPenyusutan)
  const totalAssets = totalCurrentAssets + netFixedAssets

  // Kewajiban
  const liabLines = await db.journalLine.findMany({
    where: {
      accountCode: { startsWith: "2." },
      journalEntry: { date: { lte: endDate } }
    }
  })
  let totalLiabilities = 0
  liabLines.forEach((l) => {
    totalLiabilities += l.type === "CREDIT" ? l.amount : -l.amount
  })

  const liabilities = [
    { name: "Kewajiban Jangka Pendek & Titipan Anggota", amount: totalLiabilities }
  ]

  // Ekuitas
  const eqModalLines = await db.journalLine.findMany({
    where: {
      accountCode: { startsWith: "3.1.01" },
      journalEntry: { date: { lte: endDate } }
    }
  })
  let eqModalAwal = 0
  eqModalLines.forEach((l) => {
    eqModalAwal += l.type === "CREDIT" ? l.amount : -l.amount
  })

  const eqMasyLines = await db.journalLine.findMany({
    where: {
      accountCode: { startsWith: "3.1.02" },
      journalEntry: { date: { lte: endDate } }
    }
  })
  let eqModalMasy = 0
  eqMasyLines.forEach((l) => {
    eqModalMasy += l.type === "CREDIT" ? l.amount : -l.amount
  })

  const eqDitahanLines = await db.journalLine.findMany({
    where: {
      OR: [
        { accountCode: { startsWith: "3.1.03" } },
        { accountCode: { startsWith: "3.2" } },
        { accountCode: { startsWith: "3.3" } }
      ],
      journalEntry: { date: { lte: endDate } }
    }
  })
  let eqLabaDitahan = 0
  eqDitahanLines.forEach((l) => {
    eqLabaDitahan += l.type === "CREDIT" ? l.amount : -l.amount
  })

  const equity = [
    { name: "Penyertaan Modal Desa (APBDes)", amount: eqModalAwal },
    { name: "Penyertaan Modal Masyarakat", amount: eqModalMasy },
    { name: "Cadangan Modal / Laba Ditahan", amount: eqLabaDitahan },
    { name: "Laba Bersih Periode Berjalan", amount: netProfit }
  ]
  const totalEquity = equity.reduce((s, e) => s + e.amount, 0)
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  // 3. LPE
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

  // 4. LAK (Kalkulasi Arus Kas Langsung)
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
    const prevClosing = await db.annualClosing.findFirst({
      where: { year: year - 1 }
    })
    if (prevClosing) {
      try {
        const snap = JSON.parse(prevClosing.snapshotData)
        saldoKasAwal = snap.lak?.saldoKasAkhir || 0
      } catch {}
    }
    if (saldoKasAwal === 0) {
      const priorLines = await db.journalLine.findMany({
        where: {
          accountCode: { startsWith: "1.1.01" },
          OR: [
            { journalEntry: { date: { lt: startDate } } },
            { journalEntry: { proofNumber: { startsWith: "SA/" } } }
          ]
        }
      })
      priorLines.forEach((l) => {
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
    saldoKasAwal: Math.max(0, saldoKasAwal),
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

// GET: Ambil status tutup buku semua tahun atau tahun spesifik
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")

    if (yearParam) {
      const year = parseInt(yearParam, 10)
      const record = await db.annualClosing.findUnique({
        where: { year }
      })
      return NextResponse.json({
        success: true,
        data: record
      })
    }

    const closings = await db.annualClosing.findMany({
      orderBy: { year: "desc" }
    })

    return NextResponse.json({
      success: true,
      data: closings
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Jalankan Tutup Buku & Jurnal Penutup Akhir Tahun
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya akun Administrator yang memiliki hak akses untuk melakukan tutup buku tahunan." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      year,
      closedBy = session.name || "Pengurus BUMDes",
      shuRates = { pades: 40, cadangan: 20, pengurus: 20, sosial: 10, pendidikan: 10 },
      notes = ""
    } = body

    if (!year) {
      return NextResponse.json({ success: false, error: "Tahun buku harus ditentukan." }, { status: 400 })
    }

    const parsedYear = parseInt(String(year), 10)

    // Cek apakah tahun ini sudah pernah ditutup dan terkunci
    const existing = await db.annualClosing.findUnique({
      where: { year: parsedYear }
    })

    if (existing && existing.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Tahun ${parsedYear} sudah ditutup buku dan statusnya terkunci. Silakan buka kembali kunci periode jika ingin mengulang proses.`
        },
        { status: 400 }
      )
    }

    // 1. Generate snapshot laporan resmi 5 komponen
    const snapshot = await generateYearReportsSnapshot(parsedYear)
    const { totalRevenue, totalExpense, netProfit } = snapshot.labaRugi

    // 2. Hitung Alokasi SHU
    const padesRate = shuRates.pades ?? 40
    const cadanganRate = shuRates.cadangan ?? 20
    const pengurusRate = shuRates.pengurus ?? 20
    const sosialRate = shuRates.sosial ?? 10
    const pendidikanRate = shuRates.pendidikan ?? 10

    const padesAmount = netProfit > 0 ? (netProfit * padesRate) / 100 : 0
    const cadanganAmount = netProfit > 0 ? (netProfit * cadanganRate) / 100 : 0
    const pengurusAmount = netProfit > 0 ? (netProfit * pengurusRate) / 100 : 0
    const sosialAmount = netProfit > 0 ? (netProfit * sosialRate) / 100 : 0
    const pendidikanAmount = netProfit > 0 ? (netProfit * pendidikanRate) / 100 : 0

    // 3. Buat Jurnal Penutup (Closing Entries) per 31 Desember
    const closingDate = new Date(`${parsedYear}-12-31T23:59:59.000Z`)
    const closingProofNumber = `JP/${parsedYear}/12/0001`

    // Hapus jurnal penutup lama jika ada (kasus proses ulang)
    const oldEntry = await db.journalEntry.findUnique({
      where: { proofNumber: closingProofNumber }
    })
    if (oldEntry) {
      await db.journalEntry.delete({ where: { id: oldEntry.id } })
    }

    const closingLines: { accountCode: string; type: "DEBIT" | "CREDIT"; amount: number }[] = []

    // Debit seluruh akun pendapatan (menolkan akun pendapatan)
    snapshot.labaRugi.revenues.forEach((r) => {
      if (r.amount > 0) {
        closingLines.push({ accountCode: r.code, type: "DEBIT", amount: r.amount })
      } else if (r.amount < 0) {
        closingLines.push({ accountCode: r.code, type: "CREDIT", amount: Math.abs(r.amount) })
      }
    })

    // Kredit seluruh akun beban (menolkan akun beban)
    snapshot.labaRugi.expenses.forEach((e) => {
      if (e.amount > 0) {
        closingLines.push({ accountCode: e.code, type: "CREDIT", amount: e.amount })
      } else if (e.amount < 0) {
        closingLines.push({ accountCode: e.code, type: "DEBIT", amount: Math.abs(e.amount) })
      }
    })

    // Pindahkan selisih laba bersih ke Akun Ekuitas / Laba Ditahan (3.1.03.01)
    if (netProfit > 0) {
      closingLines.push({ accountCode: "3.1.03.01", type: "CREDIT", amount: netProfit })
    } else if (netProfit < 0) {
      closingLines.push({ accountCode: "3.1.03.01", type: "DEBIT", amount: Math.abs(netProfit) })
    }

    // Pastikan akun 3.1.03.01 terdaftar di master
    const ditahanAcc = await db.ledgerAccount.findUnique({ where: { code: "3.1.03.01" } })
    if (!ditahanAcc) {
      await db.ledgerAccount.create({
        data: {
          code: "3.1.03.01",
          name: "Laba Ditahan / Sisa Hasil Usaha Ditahan",
          type: "EQUITY",
          normal: "CREDIT"
        }
      })
    }

    let createdEntryId: string | null = null
    if (closingLines.length > 0) {
      const { entry } = await postJournalEntry(
        closingDate,
        "MEMORIAL",
        `Jurnal Penutup (Closing Entries) Akhir Tahun Buku ${parsedYear} BUMDes`,
        "Sistem Akuntansi BUMDes",
        closingLines,
        "Umum",
        `Tutup buku tahun ${parsedYear} oleh ${closedBy}. Laba Bersih: Rp ${netProfit.toLocaleString("id-ID")}`,
        null,
        closingProofNumber
      )
      createdEntryId = entry.id
    }

    // 4. Simpan Record AnnualClosing lengkap dengan snapshot JSON
    const closingRecord = await db.annualClosing.upsert({
      where: { year: parsedYear },
      create: {
        year: parsedYear,
        closedAt: new Date(),
        closedBy,
        totalRevenue,
        totalExpense,
        netProfit,
        padesPercent: padesRate,
        padesAmount,
        cadanganPercent: cadanganRate,
        cadanganAmount,
        pengurusPercent: pengurusRate,
        pengurusAmount,
        sosialPercent: sosialRate,
        sosialAmount,
        pendidikanPercent: pendidikanRate,
        pendidikanAmount,
        journalEntryId: createdEntryId,
        snapshotData: JSON.stringify(snapshot),
        isLocked: true,
        notes: notes || null
      },
      update: {
        closedAt: new Date(),
        closedBy,
        totalRevenue,
        totalExpense,
        netProfit,
        padesPercent: padesRate,
        padesAmount,
        cadanganPercent: cadanganRate,
        cadanganAmount,
        pengurusPercent: pengurusRate,
        pengurusAmount,
        sosialPercent: sosialRate,
        sosialAmount,
        pendidikanPercent: pendidikanRate,
        pendidikanAmount,
        journalEntryId: createdEntryId,
        snapshotData: JSON.stringify(snapshot),
        isLocked: true,
        notes: notes || null
      }
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil melakukan Tutup Buku Akhir Tahun ${parsedYear}. Seluruh saldo nominal telah di-reset dan laba bersih ditransfer ke Laba Ditahan.`,
      data: closingRecord
    })
  } catch (error: any) {
    console.error("Error executing annual closing:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
