import { getUserSession, AUTH_COOKIE_NAME } from "@/lib/auth"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya Admin yang berhak mereset database." },
        { status: 403 }
      )
    }

    // 1. Wipe all transactional data safely
    await db.$transaction(async (tx) => {
      await tx.journalLine.deleteMany()
      await tx.journalEntry.deleteMany()
      await tx.annualClosing.deleteMany()
      await tx.openingBalance.deleteMany()
    })

    // 2. Reset settings to default values (empty profile triggers setup page)
    const defaultSettings = [
      { key: "shu_pengurus_pct", value: "30" },
      { key: "shu_pengawas_pct", value: "10" },
      { key: "shu_sosial_pct", value: "10" },
      { key: "shu_modal_pct", value: "25" },
      { key: "shu_desa_pct", value: "25" },
      { key: "bumdes_name", value: "" },
      { key: "village_name", value: "" },
      { key: "district_name", value: "" },
      { key: "regency_name", value: "" }
    ]

    for (const s of defaultSettings) {
      await db.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: s
      })
    }

    const response = NextResponse.json({ success: true, message: "Database berhasil di-reset ke pengaturan awal!" })

    // Clear JWT token cookie
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    })

    // Clear legacy cookie
    response.cookies.set("bumdes_user", "", {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0,
    })

    return response
  } catch (error: any) {
    console.error("Reset database error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal melakukan reset database" },
      { status: 500 }
    )
  }
}

