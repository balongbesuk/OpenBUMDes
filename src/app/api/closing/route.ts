import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { calculateFinancialReports } from "@/lib/reports"

// Helper function to build a full snapshot of 5 financial reports for a given year
async function generateYearReportsSnapshot(year: number) {
  return await calculateFinancialReports(year)
}

// GET: Ambil status tutup buku semua tahun atau tahun spesifik
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

    // 2. Validasi & Hitung Alokasi SHU
    const padesRate = Math.max(0, Number(shuRates.pades ?? 40))
    const cadanganRate = Math.max(0, Number(shuRates.cadangan ?? 20))
    const pengurusRate = Math.max(0, Number(shuRates.pengurus ?? 20))
    const sosialRate = Math.max(0, Number(shuRates.sosial ?? 10))
    const pendidikanRate = Math.max(0, Number(shuRates.pendidikan ?? 10))
    const totalRate = padesRate + cadanganRate + pengurusRate + sosialRate + pendidikanRate
    if (Math.abs(totalRate - 100) > 0.01) {
      return NextResponse.json(
        { success: false, error: `Total persentase alokasi SHU harus tepat 100% (saat ini ${totalRate}%).` },
        { status: 400 }
      )
    }

    const padesAmount = netProfit > 0 ? Math.round((netProfit * padesRate) / 100) : 0
    const pengurusAmount = netProfit > 0 ? Math.round((netProfit * pengurusRate) / 100) : 0
    const sosialAmount = netProfit > 0 ? Math.round((netProfit * sosialRate) / 100) : 0
    const pendidikanAmount = netProfit > 0 ? Math.round((netProfit * pendidikanRate) / 100) : 0
    const cadanganAmount = netProfit > 0 ? Math.max(0, netProfit - (padesAmount + pengurusAmount + sosialAmount + pendidikanAmount)) : 0

    // 3. Buat Jurnal Penutup (Closing Entries) per 31 Desember
    const closingDate = new Date(`${parsedYear}-12-31T23:59:59.000Z`)
    const closingProofNumber = `JP/${parsedYear}/12/0001`

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

    // 4. Eksekusi Jurnal Penutup & Simpan Record AnnualClosing secara atomik dalam satu transaksi
    const closingRecord = await db.$transaction(async (tx) => {
      const lockCheck = await tx.annualClosing.findUnique({ where: { year: parsedYear } })
      if (lockCheck && lockCheck.isLocked) {
        throw new Error(`Tahun ${parsedYear} sudah ditutup dan berstatus terkunci.`)
      }

      // Pastikan akun 3.1.03.01 terdaftar di master
      await tx.ledgerAccount.upsert({
        where: { code: "3.1.03.01" },
        update: {},
        create: {
          code: "3.1.03.01",
          name: "Laba Ditahan / Sisa Hasil Usaha Ditahan",
          type: "EQUITY",
          normal: "Kredit"
        }
      })

      // Hapus jurnal penutup lama jika ada (kasus proses ulang)
      await tx.journalEntry.deleteMany({
        where: { proofNumber: closingProofNumber }
      })

      let createdEntryId: string | null = null
      if (closingLines.length > 0) {
        const entry = await tx.journalEntry.create({
          data: {
            proofNumber: closingProofNumber,
            proofType: "MEMORIAL",
            date: closingDate,
            description: `Jurnal Penutup (Closing Entries) Akhir Tahun Buku ${parsedYear} BUMDes`,
            payeeOrPayer: "Sistem Akuntansi BUMDes",
            unitName: "Umum",
            note: `Tutup buku tahun ${parsedYear} oleh ${closedBy}. Laba Bersih: Rp ${netProfit.toLocaleString("id-ID")}`,
            verificationStatus: "VERIFIED",
            lines: {
              create: closingLines.map((l) => ({
                accountCode: l.accountCode,
                type: l.type,
                amount: l.amount
              }))
            }
          }
        })
        createdEntryId = entry.id
      }

      const closingData = {
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

      return await tx.annualClosing.upsert({
        where: { year: parsedYear },
        create: { year: parsedYear, ...closingData },
        update: closingData
      })
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
