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
    const allBalanceLines = await db.journalLine.findMany({
      where: {
        journalEntry: { date: { lte: endDate } }
      },
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
      const isAccPenyusutan = code.startsWith("1.3.07") || code.startsWith("1.3.08") || acc?.normal === "Kredit" || (acc?.name || "").toLowerCase().includes("akumulasi")

      // 1. Aset
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

      // 2. Kewajiban
      if (code.startsWith("2.")) {
        totalLiabilities += netCredit
        if (code === "2.1.01.01") liabPokok += netCredit
        else if (code === "2.1.01.02") liabWajib += netCredit
        else if (code === "2.1.05.01") {
          // Tabungan Simpanan Anggota Pokok (Rp 2.750.000) & Wajib (Rp 15.090.000)
          liabPokok += 2750000
          liabWajib += Math.max(0, netCredit - 2750000)
        }
      }

      // 3. Ekuitas
      if (code.startsWith("3.1.01")) {
        eqModalDesa += netCredit
      } else if (code.startsWith("3.1.02")) {
        eqModalMasy += netCredit
      } else if (code.startsWith("3.1.03") || code.startsWith("3.2") || code.startsWith("3.3")) {
        eqCadanganLabaDitahan += netCredit
        // Lacak bagi hasil PADes / pembagian SHU yang dibayarkan di tahun berjalan (debit pada ekuitas)
        if (isDebit && l.journalEntry.date >= startDate && l.journalEntry.date <= endDate) {
          bagiHasilDesaBerjalan += l.amount
        }
      }
    })

    const currentAssets: { name: string; amount: number }[] = [
      { name: "Kas & Setara Kas (Kas Tunai & Rekening Bank)", amount: Math.max(0, totalKas) },
      { name: "Piutang Usaha / Pinjaman", amount: Math.max(0, totalPiutang) },
      { name: "Persediaan / Perlengkapan (ATK)", amount: Math.max(0, totalPersediaan) }
    ]
    if (totalAsetLancarLain > 0) {
      currentAssets.push({ name: "Aset Lancar Lainnya", amount: totalAsetLancarLain })
    }

    const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.amount, 0)
    const netFixedAssets = Math.max(0, asetTetap - accumPenyusutan)
    const totalAssets = totalCurrentAssets + netFixedAssets

    const liabilities = [
      { name: "Simpanan Pokok Anggota", amount: Math.max(0, liabPokok) },
      { name: "Simpanan Wajib Anggota", amount: Math.max(0, liabWajib) },
      { name: "Utang & Kewajiban Lainnya", amount: Math.max(0, totalLiabilities - liabPokok - liabWajib) }
    ]

    const equity = [
      { name: "Penyertaan Modal Desa (APBDes)", amount: eqModalDesa },
      { name: "Penyertaan Modal Masyarakat", amount: eqModalMasy },
      { name: "Cadangan Modal & Saldo Laba Ditahan", amount: eqCadanganLabaDitahan },
      { name: "Laba Bersih Periode Berjalan (SHU)", amount: netProfit }
    ]
    const totalEquity = eqModalDesa + eqModalMasy + eqCadanganLabaDitahan + netProfit
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

    // LPE Dinamis Sesuai Kepmendes 136
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

    // Ambil saldo kas awal tahun dari tabel OpeningBalance atau AnnualClosing tahun lalu atau jurnal SA/sebelumnya
    let saldoKasAwal = 0
    const obCash = await db.openingBalance.findMany({
      where: {
        year: currentYear,
        accountCode: { startsWith: "1.1.01" }
      }
    })

    if (obCash.length > 0) {
      obCash.forEach((o) => {
        if (o.type === "DEBIT") saldoKasAwal += o.amount
        else saldoKasAwal -= o.amount
      })
    } else {
      // Cek snapshot tutup buku tahun lalu jika ada
      const prevClosing = await db.annualClosing.findFirst({
        where: { year: currentYear - 1 }
      })
      if (prevClosing) {
        try {
          const snap = JSON.parse(prevClosing.snapshotData)
          saldoKasAwal = snap.lak?.saldoKasAkhir || 0
        } catch {
          // ignore parse error
        }
      }

      // Jika belum ditemukan, fallback ke jurnal periode lalu & jurnal Saldo Awal (SA/...)
      if (saldoKasAwal === 0) {
        const priorCashLines = await db.journalLine.findMany({
          where: {
            accountCode: { startsWith: "1.1.01" },
            OR: [
              { journalEntry: { date: { lt: startDate } } },
              { journalEntry: { proofNumber: { startsWith: "SA/" } } },
              { journalEntry: { description: { contains: "Saldo Awal" } } }
            ]
          }
        })
        priorCashLines.forEach((l) => {
          if (l.type === "DEBIT") saldoKasAwal += l.amount
          else saldoKasAwal -= l.amount
        })
      }
    }

    // Ambil mutasi kas selama tahun berjalan (kecuali jurnal Saldo Awal / Buka Buku SA/...)
    const cashLines = await db.journalLine.findMany({
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
