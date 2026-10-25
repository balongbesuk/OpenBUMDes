import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAccountBalance } from "@/lib/ledger"

export async function GET() {
  try {
    // 1. Calculate Dynamic Revenues from COA (All accounts of type REVENUE or prefix 4.)
    const revenueAccounts = await db.ledgerAccount.findMany({
      where: {
        OR: [
          { type: "REVENUE" },
          { code: { startsWith: "4." } },
          { code: { startsWith: "4-" } }
        ]
      },
      orderBy: { code: "asc" }
    })

    const revenues: { code: string; name: string; amount: number }[] = []
    for (const acc of revenueAccounts) {
      const bal = await getAccountBalance(acc.code)
      if (bal !== 0) {
        revenues.push({ code: acc.code, name: acc.name, amount: bal })
      }
    }

    // 2. Calculate Dynamic Expenses from COA (All accounts of type EXPENSE or prefix 5., 6., 7.)
    const expenseAccounts = await db.ledgerAccount.findMany({
      where: {
        OR: [
          { type: "EXPENSE" },
          { code: { startsWith: "5." } },
          { code: { startsWith: "6." } },
          { code: { startsWith: "7." } },
          { code: { startsWith: "5-" } }
        ]
      },
      orderBy: { code: "asc" }
    })

    const expenses: { code: string; name: string; amount: number }[] = []
    for (const acc of expenseAccounts) {
      const bal = await getAccountBalance(acc.code)
      if (bal !== 0) {
        expenses.push({ code: acc.code, name: acc.name, amount: bal })
      }
    }

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netProfit = totalRevenue - totalExpense

    // 3. Dynamic Kas & Bank (All accounts under 1.1.01 or 1-1100..1-1300)
    const kasAccounts = await db.ledgerAccount.findMany({
      where: {
        OR: [
          { code: { startsWith: "1.1.01" } },
          { code: { startsWith: "1.1.02" } },
          { code: { in: ["1-1100", "1-1200", "1-1300"] } }
        ]
      }
    })
    let totalKasDanBank = 0
    for (const k of kasAccounts) {
      totalKasDanBank += await getAccountBalance(k.code)
    }

    const assetPiutangMasy = await getAccountBalance(["1-1400", "1.1.03.01"])
    const assetPiutangGapoktan = await getAccountBalance(["1-1500", "1.1.03.02"])
    const assetPeralatan = await getAccountBalance(["1-2100", "1.3.01.01", "1.3.01.02"])

    // Contra asset (Akumulasi Penyusutan)
    const accumDepLines = await db.journalLine.findMany({
      where: { accountCode: { in: ["1-2200", "1.3.02.01", "1.3.02.02"] } }
    })
    const accumDepDebit = accumDepLines.filter(l => l.type === "DEBIT").reduce((sum, l) => sum + l.amount, 0)
    const accumDepCredit = accumDepLines.filter(l => l.type === "CREDIT").reduce((sum, l) => sum + l.amount, 0)
    const assetAccumDep = accumDepCredit - accumDepDebit

    // Contra asset for Piutang (CKPN)
    const ckpnLines = await db.journalLine.findMany({
      where: { accountCode: { in: ["1-1450", "1.1.04.01"] } }
    })
    const ckpnDebit = ckpnLines.filter(l => l.type === "DEBIT").reduce((sum, l) => sum + l.amount, 0)
    const ckpnCredit = ckpnLines.filter(l => l.type === "CREDIT").reduce((sum, l) => sum + l.amount, 0)
    const assetCkpn = ckpnCredit - ckpnDebit

    const currentAssets = [
      { name: "Kas & Setara Kas (Kas Tunai & Rekening Bank)", amount: totalKasDanBank },
      { name: "Piutang Pinjaman Masyarakat", amount: assetPiutangMasy },
      { name: "Piutang Pinjaman Gapoktan", amount: assetPiutangGapoktan },
      { name: "Penyisihan Kerugian Piutang (CKPN)", amount: -assetCkpn }
    ]

    const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.amount, 0)
    const netFixedAssets = assetPeralatan - assetAccumDep
    const totalAssets = totalCurrentAssets + netFixedAssets

    // 4. Calculate Liability Accounts
    const liabPokok = await getAccountBalance(["2-1100", "2.1.01.01"])
    const liabWajib = await getAccountBalance(["2-1200", "2.1.01.02"])
    const liabShu = await getAccountBalance(["2-1300", "2.1.05.01"])
    const liabPajak = await getAccountBalance(["2-1400", "2.1.04.01"])

    const liabilities = [
      { name: "Tabungan Simpanan Pokok Anggota", amount: liabPokok },
      { name: "Tabungan Simpanan Wajib Anggota", amount: liabWajib },
      { name: "Hutang SHU Belum Dibagi", amount: liabShu },
      { name: "Hutang Pajak", amount: liabPajak }
    ]
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0)

    // 5. Calculate Equity Accounts
    const eqModalAwal = await getAccountBalance(["3-1100", "3.1.01.01"])
    const eqLabaDitahan = await getAccountBalance(["3-1200", "3.2.01.01"])

    const equity = [
      { name: "Penyertaan Modal Desa (APBDes)", amount: eqModalAwal },
      { name: "Laba Ditahan / Penambahan Modal", amount: eqLabaDitahan },
      { name: "Laba Tahun Berjalan", amount: netProfit }
    ]
    const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0)
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

    // Settings for SHU calculation
    const settingsList = await db.setting.findMany()
    const settings = settingsList.reduce((map: any, s) => {
      map[s.key] = s.value
      return map
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        labaRugi: {
          revenues,
          expenses,
          totalRevenue,
          totalExpense,
          netProfit
        },
        neraca: {
          currentAssets,
          totalCurrentAssets,
          fixedAssets: {
            peralatan: assetPeralatan,
            akumulasiPenyusutan: assetAccumDep,
            net: netFixedAssets
          },
          totalAssets,
          liabilities,
          totalLiabilities,
          equity,
          totalEquity,
          totalLiabilitiesAndEquity
        },
        shuSettings: {
          pengurus: parseFloat(settings.shu_pengurus_pct || "30"),
          pengawas: parseFloat(settings.shu_pengawas_pct || "10"),
          sosial: parseFloat(settings.shu_sosial_pct || "10"),
          modal: parseFloat(settings.shu_modal_pct || "25"),
          desa: parseFloat(settings.shu_desa_pct || "25")
        }
      }
    })
  } catch (error: any) {
    console.error("Fetch reports error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate financial reports" },
      { status: 500 }
    )
  }
}
