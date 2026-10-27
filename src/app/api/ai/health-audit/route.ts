import { NextResponse } from "next/server"
import { runFinancialHealthAudit } from "@/lib/gemini"
import { getUserSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak. Silakan login." }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const currentYear = new Date().getFullYear()
    const year = Number(body.year) || currentYear

    const data = await runFinancialHealthAudit(year)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Financial Health Audit AI Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan audit kesehatan keuangan" },
      { status: 500 }
    )
  }
}
