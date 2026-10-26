import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const keySetting = await db.setting.findUnique({ where: { key: "gemini_api_key" } })
    const apiKey = keySetting?.value?.trim() || process.env.GEMINI_API_KEY

    const modelSetting = await db.setting.findUnique({ where: { key: "gemini_model" } })
    let selectedModel = modelSetting?.value?.trim() || "gemini-2.5-flash"
    if (selectedModel.startsWith("gemini-3")) {
      selectedModel = "gemini-2.5-flash"
    }

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        configured: false,
        message: "API Key belum dimasukkan."
      })
    }

    // Ping / validasi kunci ke Google AI Studio
    let keyValid = false
    let testError = null
    try {
      const ai = new GoogleGenAI({ apiKey })
      // Ambil iterasi pertama dari model list untuk cek validitas API Key
      const list = await ai.models.list()
      for await (const m of list) {
        if (m.name) {
          keyValid = true
          break
        }
      }
    } catch (err: any) {
      testError = err.message || "Gagal memverifikasi API Key"
    }

    // Hitung perkiraan penggunaan harian dari jurnal yang dibuat hari ini
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const todayUsage = await db.journalEntry.count({
      where: {
        createdAt: { gte: startOfToday }
      }
    })

    const freeDailyLimit = 1500 // Kuota resmi gratis harian Google AI Studio Free Tier
    const remainingRequests = Math.max(0, freeDailyLimit - todayUsage)

    return NextResponse.json({
      success: true,
      configured: true,
      keyValid,
      testError,
      selectedModel,
      quotaInfo: {
        tierName: "Google AI Studio Free Tier",
        freeDailyQuota: freeDailyLimit,
        todayUsage,
        remainingRequestsToday: remainingRequests,
        rateLimitRpm: "15 RPM (Request Per Menit)",
        costPerRequest: "Rp 0 (100% Gratis)",
        quotaDashboardUrl: "https://aistudio.google.com/app/plan_information"
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
