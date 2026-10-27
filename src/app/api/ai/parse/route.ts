import { NextResponse } from "next/server"
import { parseTransactionWithGemini } from "@/lib/gemini"
import { getUserSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak. Silakan login terlebih dahulu." }, { status: 401 })
    }

    const body = await request.json()
    const prompt = (body.prompt || "").trim()

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Teks transaksi tidak boleh kosong." }, { status: 400 })
    }

    const data = await parseTransactionWithGemini(prompt)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("AI Parse Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses transaksi dengan AI" },
      { status: 500 }
    )
  }
}
