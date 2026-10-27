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
    const imageBase64 = body.imageBase64 || body.image || undefined
    const mimeType = body.mimeType || undefined

    if (!prompt && !imageBase64) {
      return NextResponse.json({ success: false, error: "Teks atau foto bukti transaksi tidak boleh kosong." }, { status: 400 })
    }

    const data = await parseTransactionWithGemini(prompt, imageBase64, mimeType)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("AI Parse Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses transaksi dengan AI" },
      { status: 500 }
    )
  }
}
