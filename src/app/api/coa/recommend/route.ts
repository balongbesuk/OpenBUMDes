import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const query = (body.query || "").trim()

    if (!query) {
      return NextResponse.json({ success: false, error: "Query wajib diisi" }, { status: 400 })
    }

    const lower = query.toLowerCase()

    // 1. Tentukan prefix kategori standar Kepmendesa 136/2022 secara cerdas
    let prefix = "6.1.04" // Default: Beban Operasional Umum
    let type = "EXPENSE"
    let normal = "Debit"
    let suggestedName = query.charAt(0).toUpperCase() + query.slice(1)
    let reason = "Dialokasikan pada kelompok Beban Operasional berdasarkan standar Kepmendesa PDTT No. 136/2022."

    if (
      lower.includes("gaji") ||
      lower.includes("honor") ||
      lower.includes("upah") ||
      lower.includes("tunjangan") ||
      lower.includes("insentif")
    ) {
      prefix = "6.1.01"
      type = "EXPENSE"
      normal = "Debit"
      suggestedName = `Beban Gaji / Honorarium (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, pos pengeluaran gaji dan upah dialokasikan pada kelompok Beban Operasional SDM & Ketenagakerjaan (Kode 6.1.01)."
    } else if (
      lower.includes("bank") ||
      lower.includes("rekening") ||
      lower.includes("tabungan") ||
      lower.includes("kas")
    ) {
      prefix = "1.1.01"
      type = "ASSET"
      normal = "Debit"
      suggestedName = `Kas di ${query}`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, rekening bank dan kas tunai operasional dialokasikan pada Aset Lancar Kas dan Setara Kas (Kode 1.1.01)."
    } else if (
      lower.includes("listrik") ||
      lower.includes("pln") ||
      lower.includes("air") ||
      lower.includes("pdam") ||
      lower.includes("wifi") ||
      lower.includes("internet") ||
      lower.includes("pulsa")
    ) {
      prefix = "6.1.04"
      type = "EXPENSE"
      normal = "Debit"
      suggestedName = `Beban Utilitas (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, beban daya dan jasa komunikasi dialokasikan pada Beban Operasional Kantor (Kode 6.1.04)."
    } else if (
      lower.includes("atk") ||
      lower.includes("kertas") ||
      lower.includes("kantor") ||
      lower.includes("cetak")
    ) {
      prefix = "6.1.02"
      type = "EXPENSE"
      normal = "Debit"
      suggestedName = `Beban Perlengkapan Kantor (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, belanja alat tulis dan perlengkapan kantor dialokasikan pada Beban Perlengkapan (Kode 6.1.02)."
    } else if (
      lower.includes("sewa") ||
      lower.includes("lapak") ||
      lower.includes("kios") ||
      lower.includes("los") ||
      lower.includes("gedung") ||
      lower.includes("lahan")
    ) {
      prefix = "4.1.04"
      type = "REVENUE"
      normal = "Credit"
      suggestedName = `Pendapatan Sewa (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, pendapatan sewa properti dan aset desa dialokasikan pada Pendapatan Sewa (Kode 4.1.04)."
    } else if (
      lower.includes("jual") ||
      lower.includes("dagang") ||
      lower.includes("toko") ||
      lower.includes("sembako") ||
      lower.includes("pupuk") ||
      lower.includes("barang")
    ) {
      prefix = "4.1.01"
      type = "REVENUE"
      normal = "Credit"
      suggestedName = `Pendapatan Penjualan (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, penjualan barang dagangan unit usaha dialokasikan pada Pendapatan Usaha Perdagangan (Kode 4.1.01)."
    } else if (
      lower.includes("sampah") ||
      lower.includes("parkir") ||
      lower.includes("wisata") ||
      lower.includes("jasa") ||
      lower.includes("retribusi")
    ) {
      prefix = "4.1.03"
      type = "REVENUE"
      normal = "Credit"
      suggestedName = `Pendapatan Jasa (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, penerimaan dari jasa layanan masyarakat dialokasikan pada Pendapatan Jasa Layanan (Kode 4.1.03)."
    } else if (
      lower.includes("utang") ||
      lower.includes("hutang") ||
      lower.includes("pinjaman")
    ) {
      prefix = "2.1.01"
      type = "LIABILITY"
      normal = "Credit"
      suggestedName = `Hutang Usaha (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, kewajiban jangka pendek operasional dialokasikan pada Kewajiban Lancar (Kode 2.1.01)."
    } else if (
      lower.includes("modal") ||
      lower.includes("penyertaan") ||
      lower.includes("investasi")
    ) {
      prefix = "3.1.02"
      type = "EQUITY"
      normal = "Credit"
      suggestedName = `Penyertaan Modal (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, modal tambahan pihak luar dialokasikan pada kelompok Ekuitas BUM Desa (Kode 3.1.02)."
    } else if (
      lower.includes("komputer") ||
      lower.includes("laptop") ||
      lower.includes("mesin") ||
      lower.includes("kendaraan") ||
      lower.includes("peralatan")
    ) {
      prefix = "1.3.01"
      type = "ASSET"
      normal = "Debit"
      suggestedName = `Aset Tetap Peralatan (${query})`
      reason = "Berdasarkan Kepmendesa PDTT No. 136/2022, inventaris bernilai ekonomis lebih dari 1 tahun dialokasikan pada Aset Tetap Peralatan (Kode 1.3.01)."
    }

    // 2. Cari nomor urut berikutnya yang masih kosong di database
    const existingAccounts = await db.ledgerAccount.findMany({
      where: {
        code: {
          startsWith: prefix
        }
      },
      select: { code: true }
    })

    const usedSuffixes = new Set<number>()
    for (const a of existingAccounts) {
      const parts = a.code.split(".")
      const num = parseInt(parts[parts.length - 1], 10)
      if (!isNaN(num) && num < 90) {
        usedSuffixes.add(num)
      }
    }

    let nextNum = 1
    while (usedSuffixes.has(nextNum)) {
      nextNum++
    }

    const recommendedCode = `${prefix}.${String(nextNum).padStart(2, "0")}`

    return NextResponse.json({
      success: true,
      data: {
        recommendedCode,
        suggestedName,
        type,
        normal,
        reason
      }
    })
  } catch (error: any) {
    console.error("COA recommendation error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mendapatkan rekomendasi akun" },
      { status: 500 }
    )
  }
}
