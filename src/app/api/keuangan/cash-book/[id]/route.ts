import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { logActivity } from "@/lib/audit"

// PATCH: Update verification status or upload signed receipt
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { verificationStatus, attachmentUrl, note } = body

    const existing = await db.journalEntry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: "Transaksi tidak ditemukan" }, { status: 404 })
    }

    const updated = await db.journalEntry.update({
      where: { id },
      data: {
        ...(verificationStatus ? { verificationStatus } : {}),
        ...(attachmentUrl !== undefined ? { attachmentUrl } : {}),
        ...(note !== undefined ? { note } : {})
      }
    })

    const session = await getUserSession()
    if (session) {
      await logActivity(
        "UPDATE_JOURNAL_PROOF",
        `Update bukti kas [${existing.proofNumber || existing.description}]: status=${verificationStatus || existing.verificationStatus}`,
        session
      )
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui bukti transaksi" },
      { status: 500 }
    )
  }
}
