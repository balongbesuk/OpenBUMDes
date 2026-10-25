import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { logActivity } from "@/lib/audit"

// GET: List transaction templates (filtered by category / unit)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") // BKM / BKK
    const unitUsaha = searchParams.get("unitUsaha")

    const where: any = { isActive: true }
    if (category) where.category = category
    if (unitUsaha && unitUsaha !== "ALL") where.unitUsaha = unitUsaha

    const templates = await db.transactionTemplate.findMany({
      where,
      orderBy: { name: "asc" }
    })

    return NextResponse.json({ success: true, data: templates })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil template transaksi" },
      { status: 500 }
    )
  }
}

// POST: Add new transaction template (e.g. by admin or coordinator)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 })
    }

    const body = await request.json()
    const { category, name, unitUsaha, targetAccount, cashAccount, cashFlowGroup, description } = body

    if (!category || !name || !targetAccount || !cashAccount) {
      return NextResponse.json(
        { success: false, error: "Kolom kategori, nama, akun target, dan akun kas wajib diisi." },
        { status: 400 }
      )
    }

    const created = await db.transactionTemplate.create({
      data: {
        category,
        name,
        unitUsaha: unitUsaha || "UMUM",
        targetAccount,
        cashAccount,
        cashFlowGroup: cashFlowGroup || null,
        description: description || null
      }
    })

    await logActivity("CREATE_TRANSACTION_TEMPLATE", `Menambah template transaksi: ${name} (${category})`, session)

    return NextResponse.json({ success: true, data: created })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan template transaksi" },
      { status: 500 }
    )
  }
}
