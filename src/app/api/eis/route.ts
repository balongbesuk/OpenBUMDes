import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { calculateFinancialReports } from "@/lib/reports"

export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getUTCFullYear()

    const [reports, totalTransactions, totalOpeningBalances] = await Promise.all([
      calculateFinancialReports(year),
      db.journalEntry.count(),
      db.openingBalance.count()
    ])

    const totalPendapatanUsaha = reports.labaRugi.totalRevenue
    const totalBeban = reports.labaRugi.totalExpense
    const labaBersih = reports.labaRugi.netProfit

    const kasDanBank = Math.max(
      0,
      reports.lak?.saldoKasAkhir ??
        reports.neraca.currentAssets
          .filter((a) => a.name.toLowerCase().includes("kas") || a.name.toLowerCase().includes("bank"))
          .reduce((s, a) => s + a.amount, 0)
    )
    const piutangUsaha = Math.max(
      0,
      reports.neraca.currentAssets
        .filter((a) => a.name.toLowerCase().includes("piutang"))
        .reduce((s, a) => s + a.amount, 0)
    )
    const persediaan = Math.max(
      0,
      reports.neraca.currentAssets
        .filter((a) => a.name.toLowerCase().includes("persediaan") || a.name.toLowerCase().includes("perlengkapan"))
        .reduce((s, a) => s + a.amount, 0)
    )
    const asetLancarLain = Math.max(
      0,
      reports.neraca.currentAssets
        .filter(
          (a) =>
            !a.name.toLowerCase().includes("kas") &&
            !a.name.toLowerCase().includes("bank") &&
            !a.name.toLowerCase().includes("piutang") &&
            !a.name.toLowerCase().includes("persediaan") &&
            !a.name.toLowerCase().includes("perlengkapan")
        )
        .reduce((s, a) => s + a.amount, 0)
    )
    const asetTetap = Math.max(0, reports.neraca.fixedAssets.peralatan)
    const akumulasiPenyusutan = Math.max(0, reports.neraca.fixedAssets.akumulasiPenyusutan)
    const utangLancar = Math.max(0, reports.neraca.totalCurrentLiabilities)
    const utangJkPanjang = Math.max(0, reports.neraca.totalLiabilities - reports.neraca.totalCurrentLiabilities)
    const rawEquityExProfit = reports.neraca.totalEquity - labaBersih

    const asetTetapNet = Math.max(0, asetTetap - akumulasiPenyusutan)
    const asetLancar = kasDanBank + piutangUsaha + persediaan + asetLancarLain

    const hasAnyRecord =
      (totalTransactions > 0 || totalOpeningBalances > 0) &&
      (totalPendapatanUsaha !== 0 ||
        totalBeban !== 0 ||
        kasDanBank !== 0 ||
        piutangUsaha !== 0 ||
        persediaan !== 0 ||
        asetLancarLain !== 0 ||
        asetTetap !== 0 ||
        utangLancar !== 0 ||
        utangJkPanjang !== 0 ||
        rawEquityExProfit !== 0)

    if (!hasAnyRecord) {
      const emptyIndicators = [
        {
          no: 1,
          name: "Imbalan kepada Pemilik (ROE)",
          formula: "Laba Bersih : Modal Pemilik x 100%",
          maxScore: 29,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Laba: Rp 0 | Modal: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        },
        {
          no: 2,
          name: "Imbalan Investasi (ROI)",
          formula: "(EBIT + Penyusutan) : Total Aset x 100%",
          maxScore: 22,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Hasil: Rp 0 | Aset: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        },
        {
          no: 3,
          name: "Rasio Kas (Cash Ratio)",
          formula: "Kas & Bank : Utang Lancar x 100%",
          maxScore: 7,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Kas: Rp 0 | Utang: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        },
        {
          no: 4,
          name: "Rasio Lancar (Current Ratio)",
          formula: "Aset Lancar : Utang Lancar x 100%",
          maxScore: 7,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Aset: Rp 0 | Utang: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        },
        {
          no: 5,
          name: "Collection Period (Hari Penagihan Piutang)",
          formula: "Piutang Usaha : Total Pendapatan x 365 hari",
          maxScore: 7,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Piutang: Rp 0 | Omzet: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        },
        {
          no: 6,
          name: "Perputaran Persediaan (Hari)",
          formula: "Persediaan : Total Pendapatan x 365 hari",
          maxScore: 7,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Persediaan: Rp 0 | Omzet: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        },
        {
          no: 7,
          name: "Perputaran Total Aset (TATO)",
          formula: "Pendapatan Usaha : Total Aset x 100%",
          maxScore: 7,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Omzet: Rp 0 | Aset: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        },
        {
          no: 8,
          name: "Rasio Modal Pemilik thd Total Aset",
          formula: "Modal Sendiri : Total Aset x 100%",
          maxScore: 14,
          rawValue: 0,
          valueDisplay: "Nihil",
          score: 0,
          components: "Modal: Rp 0 | Aset: Rp 0",
          notes: "Database kosong / Belum ada transaksi"
        }
      ]

      return NextResponse.json({
        success: true,
        meta: {
          year,
          hasData: false,
          totalScore: 0,
          maxPossibleScore: 100,
          category: "BELUM ADA DATA",
          categoryBadge: "bg-slate-100 text-slate-600 border-slate-300",
          financialOverview: {
            totalPendapatanUsaha: 0,
            totalBeban: 0,
            labaBersih: 0,
            kasDanBank: 0,
            piutangUsaha: 0,
            persediaan: 0,
            totalAset: 0,
            utangLancar: 0,
            modalPemilik: 0
          }
        },
        indicators: emptyIndicators
      })
    }

    const totalAset = Math.max(1, asetLancar + asetTetapNet)
    const modalPemilik = Math.max(1, reports.neraca.totalEquity)

    // 1. ROE (Return on Equity) - Max 29
    const roeVal = modalPemilik > 0 ? labaBersih / modalPemilik : 0
    let roeScore = 0
    if (roeVal >= 0.15) roeScore = 29
    else if (roeVal >= 0.13) roeScore = 26
    else if (roeVal >= 0.11) roeScore = 23
    else if (roeVal >= 0.09) roeScore = 20
    else if (roeVal >= 0.079) roeScore = 17
    else if (roeVal >= 0.066) roeScore = 14
    else if (roeVal >= 0.053) roeScore = 12
    else if (roeVal >= 0.04) roeScore = 10
    else if (roeVal >= 0.025) roeScore = 8
    else if (roeVal >= 0.01) roeScore = 6
    else if (roeVal >= 0) roeScore = 3
    else roeScore = 0

    // 2. ROI (Return on Investment) - Max 22
    const ebit = labaBersih
    const roiVal = totalAset > 0 ? (ebit + akumulasiPenyusutan) / totalAset : 0
    let roiScore = 0
    if (roiVal >= 0.18) roiScore = 22
    else if (roiVal >= 0.15) roiScore = 19
    else if (roiVal >= 0.13) roiScore = 17
    else if (roiVal >= 0.12) roiScore = 15
    else if (roiVal >= 0.105) roiScore = 13
    else if (roiVal >= 0.09) roiScore = 11
    else if (roiVal >= 0.07) roiScore = 9
    else if (roiVal >= 0.05) roiScore = 7
    else if (roiVal >= 0.03) roiScore = 6
    else if (roiVal >= 0.01) roiScore = 4
    else if (roiVal >= 0) roiScore = 3
    else roiScore = 1

    // 3. Rasio Kas (Cash Ratio) - Max 7
    let cashRatioVal = 0
    let cashRatioScore = 7
    if (utangLancar > 0) {
      cashRatioVal = kasDanBank / utangLancar
      if (cashRatioVal >= 0.35) cashRatioScore = 7
      else if (cashRatioVal >= 0.25) cashRatioScore = 6
      else if (cashRatioVal >= 0.15) cashRatioScore = 4
      else if (cashRatioVal >= 0.10) cashRatioScore = 3
      else if (cashRatioVal >= 0.05) cashRatioScore = 1
      else cashRatioScore = 0
    } else {
      cashRatioVal = 9.99
      cashRatioScore = 7
    }

    // 4. Rasio Lancar (Current Ratio) - Max 7
    let currentRatioVal = 0
    let currentRatioScore = 7
    if (utangLancar > 0) {
      currentRatioVal = asetLancar / utangLancar
      if (currentRatioVal >= 1.25) currentRatioScore = 7
      else if (currentRatioVal >= 1.10) currentRatioScore = 6
      else if (currentRatioVal >= 1.0) currentRatioScore = 4
      else if (currentRatioVal >= 0.95) currentRatioScore = 3
      else if (currentRatioVal >= 0.9) currentRatioScore = 1
      else currentRatioScore = 0
    } else {
      currentRatioVal = 9.99
      currentRatioScore = 7
    }

    // 5. Collection Period (Hari Penagihan Piutang) - Max 7
    let cpDays = 0
    let cpScore = 7
    if (totalPendapatanUsaha > 0 && piutangUsaha > 0) {
      cpDays = Math.round((piutangUsaha / totalPendapatanUsaha) * 365)
      if (cpDays <= 60) cpScore = 7
      else if (cpDays <= 90) cpScore = 5.5
      else if (cpDays <= 120) cpScore = 5
      else if (cpDays <= 150) cpScore = 4
      else if (cpDays <= 180) cpScore = 3.5
      else if (cpDays <= 210) cpScore = 3
      else if (cpDays <= 240) cpScore = 2
      else if (cpDays <= 270) cpScore = 1
      else cpScore = 0
    } else if (piutangUsaha === 0) {
      cpDays = 0
      cpScore = 7
    } else {
      cpDays = 365
      cpScore = 0
    }

    // 6. Perputaran Persediaan (Hari) - Max 7
    let ppDays = 0
    let ppScore = 7
    if (totalPendapatanUsaha > 0 && persediaan > 0) {
      ppDays = Math.round((persediaan / totalPendapatanUsaha) * 365)
      if (ppDays <= 60) ppScore = 7
      else if (ppDays <= 90) ppScore = 5.5
      else if (ppDays <= 120) ppScore = 5
      else if (ppDays <= 150) ppScore = 4
      else if (ppDays <= 180) ppScore = 3.5
      else if (ppDays <= 210) ppScore = 3
      else if (ppDays <= 240) ppScore = 2
      else if (ppDays <= 270) ppScore = 1
      else ppScore = 0
    } else {
      ppDays = 0
      ppScore = 7
    }

    // 7. Perputaran Total Aset (TATO) - Max 7
    const tatoVal = totalAset > 0 ? totalPendapatanUsaha / totalAset : 0
    let tatoScore = 0
    if (tatoVal >= 1.2) tatoScore = 7
    else if (tatoVal >= 1.05) tatoScore = 6
    else if (tatoVal >= 0.9) tatoScore = 5.5
    else if (tatoVal >= 0.75) tatoScore = 5
    else if (tatoVal >= 0.6) tatoScore = 4
    else if (tatoVal >= 0.4) tatoScore = 3
    else if (tatoVal >= 0.2) tatoScore = 2
    else tatoScore = 1

    // 8. Rasio Total Modal Pemilik thd Total Aset - Max 14
    const solVal = totalAset > 0 ? modalPemilik / totalAset : 0
    let solScore = 0
    if (solVal >= 0.8) solScore = 14
    else if (solVal >= 0.7) solScore = 13
    else if (solVal >= 0.6) solScore = 12
    else if (solVal >= 0.5) solScore = 11
    else if (solVal >= 0.4) solScore = 10
    else if (solVal >= 0.3) solScore = 8
    else if (solVal >= 0.2) solScore = 6
    else if (solVal >= 0.1) solScore = 4
    else solScore = 2

    const totalScore =
      Math.round((roeScore + roiScore + cashRatioScore + currentRatioScore + cpScore + ppScore + tatoScore + solScore) * 10) / 10

    let category = "TIDAK SEHAT"
    let categoryBadge = "bg-rose-50 text-rose-700 border-rose-300"
    if (totalScore >= 65) {
      category = "SEHAT"
      categoryBadge = "bg-emerald-50 text-emerald-700 border-emerald-300"
    } else if (totalScore >= 30) {
      category = "KURANG SEHAT"
      categoryBadge = "bg-amber-50 text-amber-700 border-amber-300"
    }

    const indicators = [
      {
        no: 1,
        name: "Imbalan kepada Pemilik (ROE)",
        formula: "Laba Bersih : Modal Pemilik x 100%",
        maxScore: 29,
        rawValue: roeVal,
        valueDisplay: `${(roeVal * 100).toFixed(1)}%`,
        score: roeScore,
        components: `Laba: Rp ${labaBersih.toLocaleString("id-ID")} | Modal: Rp ${modalPemilik.toLocaleString("id-ID")}`,
        notes: roeVal >= 0.15 ? "Sangat Menguntungkan (≥ 15%)" : roeVal >= 0.05 ? "Cukup Menguntungkan" : "Perlu Peningkatan Laba"
      },
      {
        no: 2,
        name: "Imbalan Investasi (ROI)",
        formula: "(EBIT + Penyusutan) : Total Aset x 100%",
        maxScore: 22,
        rawValue: roiVal,
        valueDisplay: `${(roiVal * 100).toFixed(1)}%`,
        score: roiScore,
        components: `Hasil Investasi: Rp ${(ebit + akumulasiPenyusutan).toLocaleString("id-ID")} | Aset: Rp ${totalAset.toLocaleString("id-ID")}`,
        notes: roiVal >= 0.15 ? "Efektivitas Aset Tinggi (≥ 15%)" : "Optimalisasi Aset Diperlukan"
      },
      {
        no: 3,
        name: "Rasio Kas (Cash Ratio)",
        formula: "Kas & Bank : Utang Lancar x 100%",
        maxScore: 7,
        rawValue: cashRatioVal,
        valueDisplay: utangLancar === 0 ? "Bebas Utang" : `${(cashRatioVal * 100).toFixed(1)}%`,
        score: cashRatioScore,
        components: `Kas & Bank: Rp ${kasDanBank.toLocaleString("id-ID")} | Utang Lancar: Rp ${utangLancar.toLocaleString("id-ID")}`,
        notes: utangLancar === 0 ? "Sangat Aman (Tanpa Beban Utang Lancar)" : cashRatioVal >= 0.35 ? "Likuiditas Sangat Baik" : "Waspadai Likuiditas Kas"
      },
      {
        no: 4,
        name: "Rasio Lancar (Current Ratio)",
        formula: "Aset Lancar : Utang Lancar x 100%",
        maxScore: 7,
        rawValue: currentRatioVal,
        valueDisplay: utangLancar === 0 ? "Bebas Utang" : `${(currentRatioVal * 100).toFixed(1)}%`,
        score: currentRatioScore,
        components: `Aset Lancar: Rp ${asetLancar.toLocaleString("id-ID")} | Utang Lancar: Rp ${utangLancar.toLocaleString("id-ID")}`,
        notes: currentRatioVal >= 1.25 || utangLancar === 0 ? "Solven Jangka Pendek (Aman)" : "Aset Lancar Terbatas"
      },
      {
        no: 5,
        name: "Periode Penagihan (Collection Period)",
        formula: "Piutang Usaha : Pendapatan x 365 Hari",
        maxScore: 7,
        rawValue: cpDays,
        valueDisplay: `${cpDays} Hari`,
        score: cpScore,
        components: `Piutang: Rp ${piutangUsaha.toLocaleString("id-ID")} | Omzet: Rp ${totalPendapatanUsaha.toLocaleString("id-ID")}`,
        notes: cpDays <= 60 ? "Penagihan Cepat (≤ 60 Hari)" : cpDays <= 120 ? "Penagihan Wajar" : "Piutang Menumpuk (Perlu Tagih)"
      },
      {
        no: 6,
        name: "Perputaran Persediaan",
        formula: "Persediaan : Pendapatan x 365 Hari",
        maxScore: 7,
        rawValue: ppDays,
        valueDisplay: `${ppDays} Hari`,
        score: ppScore,
        components: `Persediaan: Rp ${persediaan.toLocaleString("id-ID")} | Omzet: Rp ${totalPendapatanUsaha.toLocaleString("id-ID")}`,
        notes: ppDays <= 60 ? "Barang Cepat Laku (≤ 60 Hari)" : "Perputaran Normal / Minim Stok"
      },
      {
        no: 7,
        name: "Perputaran Total Aset (TATO)",
        formula: "Pendapatan Usaha : Total Aset x 100%",
        maxScore: 7,
        rawValue: tatoVal,
        valueDisplay: `${(tatoVal * 100).toFixed(1)}%`,
        score: tatoScore,
        components: `Pendapatan: Rp ${totalPendapatanUsaha.toLocaleString("id-ID")} | Total Aset: Rp ${totalAset.toLocaleString("id-ID")}`,
        notes: tatoVal >= 0.75 ? "Aset Produktif" : "Aset Belum Dimaksimalkan Menghasilkan Omzet"
      },
      {
        no: 8,
        name: "Rasio Modal Pemilik thd Total Aset",
        formula: "Modal Sendiri : Total Aset x 100%",
        maxScore: 14,
        rawValue: solVal,
        valueDisplay: `${(solVal * 100).toFixed(1)}%`,
        score: solScore,
        components: `Modal Sendiri: Rp ${modalPemilik.toLocaleString("id-ID")} | Total Aset: Rp ${totalAset.toLocaleString("id-ID")}`,
        notes: solVal >= 0.7 ? "Kemandirian Modal Tinggi (Aman dari Utang)" : "Porsi Modal Perlu Diperkuat"
      }
    ]

    return NextResponse.json({
      success: true,
      meta: {
        year,
        hasData: true,
        totalScore,
        maxPossibleScore: 100,
        category,
        categoryBadge,
        financialOverview: {
          totalPendapatanUsaha,
          totalBeban,
          labaBersih,
          kasDanBank,
          piutangUsaha,
          persediaan,
          totalAset,
          utangLancar,
          modalPemilik
        }
      },
      indicators
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
