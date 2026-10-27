import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { calculateFinancialReports } from "@/lib/reports"

export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak. Silakan login terlebih dahulu." }, { status: 401 })
    }

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

    // 2. Hitung dinamis menggunakan engine laporan standar
    const reports = await calculateFinancialReports(currentYear)
    return NextResponse.json({
      success: true,
      data: reports
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
