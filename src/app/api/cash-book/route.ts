import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { db } from "@/lib/db"
import { postJournalEntry, nextAssetCode } from "@/lib/ledger"
import { getUserSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const proofType = searchParams.get("proofType")

    const where: any = {}
    if (proofType && proofType !== "all") where.proofType = proofType

    if (year && year !== "all") {
      const y = parseInt(year, 10)
      if (month && month !== "all") {
        const m = parseInt(month, 10)
        where.date = {
          gte: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(y, m, 0, 23, 59, 59, 999))
        }
      } else {
        where.date = {
          gte: new Date(Date.UTC(y, 0, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999))
        }
      }
    }

    const entries = await db.journalEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: { lines: true }
    })

    return NextResponse.json({ success: true, data: entries })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak sah atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { date, proofType, description, payeeOrPayer, unitName, note, lines, attachmentUrl } = body

    if (!proofType || !description || !payeeOrPayer || !lines || lines.length < 2) {
      return NextResponse.json(
        { success: false, error: "Mohon lengkapi jenis bukti, keterangan, pihak terkait, dan minimal 2 baris jurnal." },
        { status: 400 }
      )
    }

    for (const l of lines) {
      const amt = Number(l.amount)
      if (isNaN(amt) || amt <= 0) {
        return NextResponse.json(
          { success: false, error: "Nominal setiap baris jurnal harus berupa angka positif lebih dari 0." },
          { status: 400 }
        )
      }
    }

    const uniqueCodes: string[] = Array.from(new Set(lines.map((l: any) => String(l.accountCode).trim())))
    const existingAccounts = await db.ledgerAccount.findMany({
      where: { code: { in: uniqueCodes } },
      select: { code: true }
    })
    if (existingAccounts.length !== uniqueCodes.length) {
      return NextResponse.json(
        { success: false, error: "Terdapat kode akun yang tidak terdaftar dalam Bagan Akun (COA) resmi." },
        { status: 400 }
      )
    }

    const txDate = date ? new Date(date) : new Date()
    const txYear = txDate.getUTCFullYear()

    // Validasi apakah tahun transaksi telah ditutup buku dan terkunci
    const closed = await db.annualClosing.findUnique({
      where: { year: txYear }
    })
    if (closed && closed.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Transaksi ditolak. Tahun pembukuan ${txYear} telah ditutup buku dan statusnya terkunci (Arsip LPJ Resmi).`
        },
        { status: 403 }
      )
    }

    const result = await postJournalEntry(
      txDate,
      proofType,
      description,
      payeeOrPayer,
      lines,
      unitName,
      note,
      attachmentUrl
    )

    // Otomatis Daftarkan ke Register Aset Tetap jika belanja aset (Akun 1.3.xx)
    if (proofType === "BKK") {
      const assetLine = lines.find((l: any) => {
        const code = String(l.accountCode || "").trim()
        return code.startsWith("1.3.") && !code.startsWith("1.3.07") && l.type === "DEBIT"
      })

      if (assetLine && body.autoRegisterAsset !== false) {
        try {
          const codeYear = txDate.getUTCFullYear()
          const existingAssets = await db.fixedAsset.findMany({
            where: { code: { startsWith: `AST-${codeYear}-` } },
            select: { code: true }
          })
          const autoCode = nextAssetCode(
            codeYear,
            existingAssets.map((a) => a.code)
          )
          const deprCode = assetLine.accountCode.startsWith("1.3.02")
            ? "1.3.07.01"
            : assetLine.accountCode.startsWith("1.3.04")
            ? "1.3.07.03"
            : assetLine.accountCode.startsWith("1.3.05")
            ? "1.3.07.04"
            : "1.3.07.02"

          const category = assetLine.accountCode.startsWith("1.3.02")
            ? "Kendaraan"
            : assetLine.accountCode.startsWith("1.3.04")
            ? "Meubelair"
            : assetLine.accountCode.startsWith("1.3.05")
            ? "Gedung & Bangunan"
            : "Peralatan & Mesin"

          const assetName = body.assetName?.trim() || description.trim()

          await db.fixedAsset.create({
            data: {
              code: body.assetCode?.trim().toUpperCase() || autoCode,
              name: assetName,
              category: body.assetCategory?.trim() || category,
              acquisitionDate: txDate,
              acquisitionCost: assetLine.amount,
              usefulLifeYears: Math.max(1, parseInt(body.usefulLifeYears, 10) || 4),
              salvageValue: Math.max(0, parseFloat(body.salvageValue) || 0),
              assetAccountCode: assetLine.accountCode,
              deprAccountCode: deprCode,
              expAccountCode: "6.1.05.01",
              location: body.location?.trim() || "Kantor BUMDes",
              condition: "BAIK",
              notes: `Otomatis dari BKK (${result?.entry?.proofNumber || proofType}): ${description}`
            }
          })
        } catch (assetErr) {
          console.error("Gagal otomatis registrasi aset:", assetErr)
        }
      }
    }

    // Otomatis Sinkronisasi ke Buku Pembantu Simpan Pinjam jika transaksi USP
    const isUspTx =
      unitName?.toLowerCase().includes("simpan pinjam") ||
      lines.some(
        (l: any) =>
          l.accountCode?.startsWith("1.1.02") ||
          l.accountCode === "2.1.01.02" ||
          l.accountCode === "2.1.01.03" ||
          l.accountCode === "4.1.08.01"
      )

    if (isUspTx && payeeOrPayer) {
      try {
        const cleanParty = payeeOrPayer.replace(/^(?:Pak|Bpk|Bapak|Ibu|Bu|Sdr|Sdri)\s+/i, "").trim()
        const member = await db.loanMember.findFirst({
          where: {
            OR: [
              { name: { equals: cleanParty } },
              { name: { contains: cleanParty } },
              { name: { equals: payeeOrPayer.trim() } }
            ]
          }
        })

        if (member) {
          const entryId = result?.entry?.id
          const finalProof = result?.entry?.proofNumber || proofType

          // 1. Simpanan Wajib (Kredit saat BKM, Debit saat BKK)
          const swLine = lines.find((l: any) => l.accountCode === "2.1.01.02" && l.type === (proofType === "BKM" ? "CREDIT" : "DEBIT"))
          if (swLine && swLine.amount > 0) {
            const amt = Number(swLine.amount)
            await db.loanMember.update({
              where: { id: member.id },
              data: { simpananWajib: { increment: proofType === "BKM" ? amt : -amt } }
            })
            await db.loanTransaction.create({
              data: {
                memberId: member.id,
                date: txDate,
                proofNumber: finalProof,
                type: "SIMPANAN_WAJIB",
                amount: amt,
                description: description || `Setoran Simpanan Wajib (${finalProof})`,
                journalEntryId: entryId
              }
            })
          }

          // 2. Simpanan Sukarela
          const ssLine = lines.find((l: any) => l.accountCode === "2.1.01.03" && l.type === (proofType === "BKM" ? "CREDIT" : "DEBIT"))
          if (ssLine && ssLine.amount > 0) {
            const amt = Number(ssLine.amount)
            await db.loanMember.update({
              where: { id: member.id },
              data: { simpananSukarela: { increment: proofType === "BKM" ? amt : -amt } }
            })
            await db.loanTransaction.create({
              data: {
                memberId: member.id,
                date: txDate,
                proofNumber: finalProof,
                type: "SIMPANAN_SUKARELA",
                amount: amt,
                description: description || `Setoran Simpanan Sukarela (${finalProof})`,
                journalEntryId: entryId
              }
            })
          }

          // 3. Simpanan Pokok
          const spLine = lines.find((l: any) => l.accountCode === "2.1.01.01" && l.type === (proofType === "BKM" ? "CREDIT" : "DEBIT"))
          if (spLine && spLine.amount > 0) {
            const amt = Number(spLine.amount)
            await db.loanMember.update({
              where: { id: member.id },
              data: { simpananPokok: { increment: proofType === "BKM" ? amt : -amt } }
            })
            await db.loanTransaction.create({
              data: {
                memberId: member.id,
                date: txDate,
                proofNumber: finalProof,
                type: "SIMPANAN_POKOK",
                amount: amt,
                description: description || `Setoran Simpanan Pokok (${finalProof})`,
                journalEntryId: entryId
              }
            })
          }

          // 4. Pembayaran Angsuran Pinjaman (BKM: 1.1.02.xx di posisi CREDIT)
          const angsuranLine = lines.find((l: any) => (l.accountCode === "1.1.02.01" || l.accountCode === "1.1.02.02") && l.type === "CREDIT" && proofType === "BKM")
          if (angsuranLine && angsuranLine.amount > 0) {
            const pokok = Number(angsuranLine.amount)
            const bungaLine = lines.find((l: any) => (l.accountCode === "4.1.08.01" || l.accountCode === "4.1.01.02") && l.type === "CREDIT")
            const bunga = bungaLine ? Number(bungaLine.amount) : 0
            const newSisa = Math.max(0, member.sisaPinjaman - pokok)

            await db.loanMember.update({
              where: { id: member.id },
              data: {
                sisaPinjaman: newSisa,
                statusPinjaman: newSisa <= 0 ? "LUNAS" : "BERJALAN"
              }
            })
            await db.loanTransaction.create({
              data: {
                memberId: member.id,
                date: txDate,
                proofNumber: finalProof,
                type: "ANGSURAN",
                amount: pokok + bunga,
                principalAmount: pokok,
                interestAmount: bunga,
                description: description || `Pembayaran Angsuran Pinjaman (${finalProof})`,
                journalEntryId: entryId
              }
            })
          }

          // 5. Pencairan Pinjaman (BKK: 1.1.02.xx di posisi DEBIT)
          const cairLine = lines.find((l: any) => (l.accountCode === "1.1.02.01" || l.accountCode === "1.1.02.02") && l.type === "DEBIT" && proofType === "BKK")
          if (cairLine && cairLine.amount > 0) {
            const cairAmt = Number(cairLine.amount)
            await db.loanMember.update({
              where: { id: member.id },
              data: {
                totalPinjaman: { increment: cairAmt },
                sisaPinjaman: { increment: cairAmt },
                statusPinjaman: "BERJALAN"
              }
            })
            await db.loanTransaction.create({
              data: {
                memberId: member.id,
                date: txDate,
                proofNumber: finalProof,
                type: "PENCAIRAN_PINJAMAN",
                amount: cairAmt,
                principalAmount: cairAmt,
                interestAmount: 0,
                description: description || `Pencairan Pinjaman (${finalProof})`,
                journalEntryId: entryId
              }
            })
          }
        }
      } catch (uspErr) {
        console.error("Gagal otomatis sinkronisasi simpan pinjam:", uspErr)
      }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak sah atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      )
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya akun Admin yang berwenang menghapus transaksi kas." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    let id = searchParams.get("id")
    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID transaksi tidak ditemukan." },
        { status: 400 }
      )
    }

    const existing = await db.journalEntry.findUnique({
      where: { id },
      include: { lines: true }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan atau sudah dihapus." },
        { status: 404 }
      )
    }

    // Cek apakah tahun transaksi sudah ditutup buku dan terkunci
    const txYear = new Date(existing.date).getUTCFullYear()
    const closed = await db.annualClosing.findUnique({
      where: { year: txYear }
    })
    if (closed && closed.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Penghapusan ditolak. Transaksi berada pada Tahun Pembukuan ${txYear} yang telah ditutup buku dan berstatus Terkunci (Arsip LPJ Resmi).`
        },
        { status: 403 }
      )
    }

    // Hapus berkas lampiran fisik di storage/uploads maupun legacy public/uploads
    if (existing.attachmentUrl && existing.attachmentUrl.startsWith("/uploads/")) {
      try {
        const fileName = path.basename(existing.attachmentUrl)
        for (const dir of [
          path.join(process.cwd(), "storage", "uploads"),
          path.join(process.cwd(), "public", "uploads")
        ]) {
          const filePath = path.join(dir, fileName)
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }
      } catch (err) {
        console.warn("Gagal menghapus berkas lampiran fisik:", err)
      }
    }

    // Hapus jurnal transaksi dan aset terkait secara atomik
    await db.$transaction(async (tx) => {
      if (existing.proofNumber) {
        await tx.fixedAsset.deleteMany({
          where: { notes: { contains: existing.proofNumber } }
        })
      }

      // Rollback mutasi simpan pinjam anggota jika ada
      const linkedLoans = await tx.loanTransaction.findMany({
        where: { OR: [{ journalEntryId: id }, { proofNumber: existing.proofNumber }] }
      })
      for (const lt of linkedLoans) {
        if (lt.type === "SIMPANAN_WAJIB") {
          await tx.loanMember.update({ where: { id: lt.memberId }, data: { simpananWajib: { decrement: lt.amount } } })
        } else if (lt.type === "SIMPANAN_SUKARELA") {
          await tx.loanMember.update({ where: { id: lt.memberId }, data: { simpananSukarela: { decrement: lt.amount } } })
        } else if (lt.type === "SIMPANAN_POKOK") {
          await tx.loanMember.update({ where: { id: lt.memberId }, data: { simpananPokok: { decrement: lt.amount } } })
        } else if (lt.type === "PENCAIRAN_PINJAMAN") {
          await tx.loanMember.update({ where: { id: lt.memberId }, data: { totalPinjaman: { decrement: lt.amount }, sisaPinjaman: { decrement: lt.amount } } })
        } else if (lt.type === "ANGSURAN") {
          await tx.loanMember.update({ where: { id: lt.memberId }, data: { sisaPinjaman: { increment: lt.principalAmount }, statusPinjaman: "BERJALAN" } })
        }
      }
      if (linkedLoans.length > 0) {
        await tx.loanTransaction.deleteMany({
          where: { id: { in: linkedLoans.map(l => l.id) } }
        })
      }

      await tx.journalEntry.delete({
        where: { id }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Transaksi ${existing.proofNumber || existing.description} berhasil dihapus.`
    })
  } catch (error: any) {
    console.error("Delete Journal Entry Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus transaksi" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak sah atau telah berakhir. Silakan login kembali." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, payeeOrPayer, description } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID transaksi tidak ditemukan." },
        { status: 400 }
      )
    }

    const existing = await db.journalEntry.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaksi tidak ditemukan." },
        { status: 404 }
      )
    }

    // Cek apakah tahun transaksi sudah ditutup buku dan terkunci
    const txYear = new Date(existing.date).getUTCFullYear()
    const closed = await db.annualClosing.findUnique({
      where: { year: txYear }
    })
    if (closed && closed.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Pengubahan ditolak. Transaksi berada pada Tahun Pembukuan ${txYear} yang telah ditutup buku dan berstatus Terkunci (Arsip LPJ Resmi).`
        },
        { status: 403 }
      )
    }

    const updated = await db.journalEntry.update({
      where: { id },
      data: {
        ...(payeeOrPayer !== undefined ? { payeeOrPayer: payeeOrPayer.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {})
      }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Data transaksi berhasil diperbarui."
    })
  } catch (error: any) {
    console.error("Patch Journal Entry Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui transaksi" },
      { status: 500 }
    )
  }
}
