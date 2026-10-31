import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getUserSession()
    const list = await db.setting.findMany()
    const map: Record<string, string> = {}
    list.forEach(s => { map[s.key] = s.value })

    // Anonymous visitors only receive public branding metadata
    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          bumdes_name: map.bumdes_name || "BUM Desa",
          village_name: map.village_name || "Desa",
          bumdes_logo: map.bumdes_logo || ""
        }
      })
    }

    // Hide secret API key from non-admin visitors
    if (session.role !== "ADMIN") {
      if (map.gemini_api_key) {
        map.gemini_api_key = "********"
      }
    }

    return NextResponse.json({ success: true, data: map })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya Admin yang dapat mengubah pengaturan sistem dan AI." },
        { status: 403 }
      )
    }

    const body = await request.json()
    if (body.leader_name !== undefined) {
      body.village_head = body.leader_name
    }
    await db.$transaction(async (tx) => {
      for (const [key, val] of Object.entries(body)) {
        if (val !== undefined) {
          // Prevent overwriting actual API key with masked placeholder
          if (key === "gemini_api_key" && val === "********") continue
          await tx.setting.upsert({
            where: { key },
            update: { value: String(val) },
            create: { key, value: String(val) }
          })
        }
      }
    })
    return NextResponse.json({ success: true, message: "Pengaturan berhasil disimpan." })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
