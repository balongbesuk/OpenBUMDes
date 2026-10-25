import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import path from "path"
import fs from "fs"

export async function POST() {
  try {
    const session = await getUserSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
      return NextResponse.json(
        { success: false, error: "Hanya Administrator atau Bendahara yang memiliki akses untuk merestorasi COA standar." },
        { status: 403 }
      )
    }

    const coaPath = path.join(process.cwd(), "prisma", "coa_kemendes_136.json")
    if (!fs.existsSync(coaPath)) {
      return NextResponse.json(
        { success: false, error: "Berkas template master coa_kemendes_136.json tidak ditemukan." },
        { status: 500 }
      )
    }

    const raw = fs.readFileSync(coaPath, "utf-8")
    const coaList: { code: string; name: string; type: string; normal: string }[] = JSON.parse(raw)

    let restoredCount = 0
    await db.$transaction(async (tx) => {
      for (const item of coaList) {
        await tx.ledgerAccount.upsert({
          where: { code: item.code },
          update: {
            name: item.name,
            type: item.type,
            normal: item.normal
          },
          create: {
            code: item.code,
            name: item.name,
            type: item.type,
            normal: item.normal
          }
        })
        restoredCount++
      }
    })

    return NextResponse.json({
      success: true,
      restoredCount,
      message: `Berhasil merestorasi ${restoredCount} akun standar Kepmendesa PDTT No. 136/2022 ke nama bawaan sistem. Akun kustom tambahan pengguna tetap aman tersimpan.`
    })
  } catch (error: any) {
    console.error("Reset default COA error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
