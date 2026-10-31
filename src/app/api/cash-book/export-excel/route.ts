import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import * as XLSX from "xlsx"

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
    const yearParam = searchParams.get("year") || new Date().getFullYear().toString()
    const year = parseInt(yearParam, 10)

    // 1. Fetch Setting (BUMDes Name, Village Name)
    const settings = await db.setting.findMany()
    const settingMap: Record<string, string> = {}
    settings.forEach((s) => {
      settingMap[s.key] = s.value
    })
    const bumdesName = settingMap["bumdes_name"] || "BAROKAH"
    const villageName = settingMap["village_name"] || "Balongbesuk"
    const districtName = settingMap["subdistrict_name"] || settingMap["district_name"] || "Diwek"
    const regencyName = settingMap["regency_name"] || "Jombang"

    // 2. Fetch Chart of Accounts (COA)
    const coaList = await db.ledgerAccount.findMany()
    const coaMap = new Map<string, string>()
    coaList.forEach((a) => {
      coaMap.set(a.code, a.name)
    })

    // 3. Fetch All 1-Year Journal Entries
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))

    const entries = await db.journalEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: "asc" },
      include: { lines: true }
    })

    // 4. Build Sheet 1: Buku Kas & Jurnal Detail
    const sheetData: any[][] = [
      [`BUKU KAS UMUM & JURNAL TRANSAKSI KEUANGAN BUMDES`],
      [`BUMDesa "${bumdesName}" - Desa ${villageName}, Kec. ${districtName}, Kab. ${regencyName}`],
      [`Tahun Anggaran: ${year} (Periode 1 Tahun Penuh: 01 Januari ${year} s/d 31 Desember ${year})`],
      [`Standar: Keputusan Menteri Desa PDTT No. 136 Tahun 2022`],
      [], // Empty row
      [
        "No",
        "Tanggal",
        "No. Bukti",
        "Jenis Bukti",
        "Uraian Transaksi",
        "Penyetor / Penerima",
        "Unit Usaha",
        "Kode Akun",
        "Nama Akun (COA Kepmendes 136)",
        "Debit (Rp)",
        "Kredit (Rp)",
        "Grup Arus Kas",
        "Status Bukti Fisik",
        "Catatan"
      ]
    ]

    let rowNumber = 1
    let totalDebit = 0
    let totalKredit = 0

    // Monthly breakdown data for Sheet 2
    const monthlyStats: Record<
      number,
      { bkm: number; bkk: number; count: number }
    > = {}
    for (let m = 1; m <= 12; m++) {
      monthlyStats[m] = { bkm: 0, bkk: 0, count: 0 }
    }

    entries.forEach((entry) => {
      const entryDate = new Date(entry.date)
      const d = String(entryDate.getUTCDate()).padStart(2, "0")
      const m = String(entryDate.getUTCMonth() + 1).padStart(2, "0")
      const y = entryDate.getUTCFullYear()
      const formattedDate = `${d}/${m}/${y}`
      const monthNum = entryDate.getUTCMonth() + 1

      const statusFisik =
        entry.verificationStatus === "SIGNED_UPLOADED" || !!entry.attachmentUrl
          ? "Sudah TTD (Digital/Fisik)"
          : "Belum TTD"

      // Accumulate monthly stats
      let entryBkm = 0
      let entryBkk = 0

      entry.lines.forEach((line) => {
        const isDebit = line.type === "DEBIT"
        const debitAmt = isDebit ? line.amount : 0
        const kreditAmt = !isDebit ? line.amount : 0

        totalDebit += debitAmt
        totalKredit += kreditAmt

        // Count cash flow amounts for BKM / BKK (from cash account 1.1.01.xx)
        if (line.accountCode.startsWith("1.1.01.") && !(entry.lines.length >= 2 && entry.lines.every((x) => x.accountCode.startsWith("1.1.01.")))) {
          if (entry.proofType === "BKM" && isDebit) {
            entryBkm += line.amount
          } else if (entry.proofType === "BKK" && !isDebit) {
            entryBkk += line.amount
          }
        }

        const accountName = coaMap.get(line.accountCode) || line.accountCode

        sheetData.push([
          rowNumber,
          formattedDate,
          entry.proofNumber,
          entry.proofType,
          entry.description,
          entry.payeeOrPayer,
          entry.unitName || "Umum",
          line.accountCode,
          accountName,
          debitAmt,
          kreditAmt,
          line.cashFlowGroup || "-",
          statusFisik,
          entry.note || ""
        ])
      })

      if (monthlyStats[monthNum]) {
        monthlyStats[monthNum].bkm += entryBkm
        monthlyStats[monthNum].bkk += entryBkk
        monthlyStats[monthNum].count += 1
      }

      rowNumber++
    })

    // Add Total Row to Sheet 1
    sheetData.push([])
    sheetData.push([
      "",
      "",
      "",
      "",
      "TOTAL KESELURUHAN (1 TAHUN)",
      "",
      "",
      "",
      "",
      totalDebit,
      totalKredit,
      totalDebit === totalKredit ? "BALANCE (SEIMBANG)" : "TIDAK BALANCE",
      "",
      ""
    ])

    // Create Workbook
    const wb = XLSX.utils.book_new()

    // Sheet 1
    const ws1 = XLSX.utils.aoa_to_sheet(sheetData)

    // Set column widths for Sheet 1
    ws1["!cols"] = [
      { wch: 6 },  // No
      { wch: 12 }, // Tanggal
      { wch: 18 }, // No Bukti
      { wch: 12 }, // Jenis Bukti
      { wch: 38 }, // Uraian
      { wch: 28 }, // Pihak
      { wch: 18 }, // Unit
      { wch: 12 }, // Kode Akun
      { wch: 36 }, // Nama Akun
      { wch: 16 }, // Debit
      { wch: 16 }, // Kredit
      { wch: 20 }, // Arus Kas
      { wch: 22 }, // Status Bukti
      { wch: 30 }  // Catatan
    ]

    XLSX.utils.book_append_sheet(wb, ws1, `Buku Kas & Jurnal ${year}`)

    // 5. Build Sheet 2: Rekapitulasi Kas Bulanan
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember"
    ]

    const rekapData: any[][] = [
      [`REKAPITULASI ARUS KAS BULANAN (1 TAHUN ANGGARAN ${year})`],
      [`BUMDesa "${bumdesName}" - Desa ${villageName}`],
      [],
      [
        "No",
        "Bulan",
        "Penerimaan Kas / BKM (Rp)",
        "Pengeluaran Kas / BKK (Rp)",
        "Surplus / (Defisit) Bulanan (Rp)",
        "Total Transaksi"
      ]
    ]

    let totBkm = 0
    let totBkk = 0
    let totTx = 0

    monthNames.forEach((mName, idx) => {
      const mNum = idx + 1
      const st = monthlyStats[mNum] || { bkm: 0, bkk: 0, count: 0 }
      const net = st.bkm - st.bkk
      totBkm += st.bkm
      totBkk += st.bkk
      totTx += st.count

      rekapData.push([
        mNum,
        mName,
        st.bkm,
        st.bkk,
        net,
        st.count
      ])
    })

    rekapData.push([])
    rekapData.push([
      "",
      "TOTAL 1 TAHUN",
      totBkm,
      totBkk,
      totBkm - totBkk,
      totTx
    ])

    const ws2 = XLSX.utils.aoa_to_sheet(rekapData)
    ws2["!cols"] = [
      { wch: 6 },  // No
      { wch: 16 }, // Bulan
      { wch: 26 }, // BKM
      { wch: 26 }, // BKK
      { wch: 30 }, // Net
      { wch: 16 }  // Total Tx
    ]

    XLSX.utils.book_append_sheet(wb, ws2, `Rekap Kas Bulanan ${year}`)

    // 6. Generate binary buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    const filename = `Buku_Kas_dan_Jurnal_${bumdesName.replace(/\s+/g, "_")}_TA_${year}.xlsx`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    console.error("Export Excel Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
