import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { postJournalEntry } from "@/lib/ledger"
import { getUserSession } from "@/lib/auth"

// GET: Ambil saldo awal tahun buku baru (atau pratinjau roll-forward dari tahun lalu)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get("year")

    if (!yearParam) {
      return NextResponse.json({ success: false, error: "Parameter year diperlukan." }, { status: 400 })
    }

    const year = parseInt(yearParam, 10)
    const prevYear = year - 1

    // 1. Cek apakah sudah pernah disimpan di tabel OpeningBalance
    const existing = await db.openingBalance.findMany({
      where: { year }
    })

    const allAccounts = await db.ledgerAccount.findMany({
      orderBy: { code: "asc" }
    })
    const accountMap = new Map(allAccounts.map((a) => [a.code, a]))

    if (existing.length > 0) {
      const formatted = existing.map((e) => {
        const acc = accountMap.get(e.accountCode)
        return {
          accountCode: e.accountCode,
          name: acc?.name || `Akun ${e.accountCode}`,
          type: e.type,
          amount: e.amount
        }
      })
      return NextResponse.json({
        success: true,
        exists: true,
        data: formatted
      })
    }

    // 2. Jika belum ada, otomatis hitung Saldo Akhir Neraca per 31 Desember tahun sebelumnya (prevYear)
    const prevClosingDate = new Date(`${prevYear}-12-31T23:59:59.999Z`)

    // Ambil seluruh akun neraca (Kepala 1: Aset, Kepala 2: Kewajiban, Kepala 3: Ekuitas)
    const lines = await db.journalLine.findMany({
      where: {
        journalEntry: { date: { lte: prevClosingDate } }
      }
    })

    const balanceMap = new Map<string, { debit: number; credit: number }>()
    lines.forEach((l) => {
      const firstChar = l.accountCode.charAt(0)
      if (["1", "2", "3"].includes(firstChar)) {
        const cur = balanceMap.get(l.accountCode) || { debit: 0, credit: 0 }
        if (l.type === "DEBIT") cur.debit += l.amount
        else cur.credit += l.amount
        balanceMap.set(l.accountCode, cur)
      }
    })

    const previewAccounts: { accountCode: string; name: string; type: "DEBIT" | "CREDIT"; amount: number }[] = []

    balanceMap.forEach((val, code) => {
      const acc = accountMap.get(code)
      const firstChar = code.charAt(0)
      let netBal = 0
      let side: "DEBIT" | "CREDIT" = "DEBIT"

      // Kontra aset seperti 1.3.02 (Akumulasi Penyusutan) bersaldo normal Kredit
      if (code.startsWith("1.3.02")) {
        netBal = val.credit - val.debit
        side = "CREDIT"
      } else if (firstChar === "1") {
        netBal = val.debit - val.credit
        side = "DEBIT"
      } else {
        // Kewajiban & Ekuitas bersaldo normal Kredit
        netBal = val.credit - val.debit
        side = "CREDIT"
      }

      if (netBal > 0) {
        previewAccounts.push({
          accountCode: code,
          name: acc?.name || `Akun ${code}`,
          type: side,
          amount: netBal
        })
      }
    })

    // Pastikan Kas (1.1.01.01) dan Modal Desa (3.1.01.01) ada di daftar pratinjau
    if (!previewAccounts.some((a) => a.accountCode === "1.1.01.01")) {
      previewAccounts.unshift({
        accountCode: "1.1.01.01",
        name: "Kas di BUM Desa",
        type: "DEBIT",
        amount: 0
      })
    }
    if (!previewAccounts.some((a) => a.accountCode === "3.1.01.01")) {
      previewAccounts.push({
        accountCode: "3.1.01.01",
        name: "Penyertaan Modal Desa (APBDes)",
        type: "CREDIT",
        amount: 0
      })
    }

    return NextResponse.json({
      success: true,
      exists: false,
      data: previewAccounts,
      prevYear
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Simpan Saldo Awal & Bentuk Jurnal Buka Buku (SA/{year}/01/0001)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Hanya akun Administrator yang memiliki hak akses untuk mengatur saldo awal buku." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { year, accounts = [] } = body

    if (!year) {
      return NextResponse.json({ success: false, error: "Tahun buku harus ditentukan." }, { status: 400 })
    }

    const parsedYear = parseInt(String(year), 10)

    // Validasi data akun
    const validLines: { accountCode: string; type: "DEBIT" | "CREDIT"; amount: number }[] = []
    let totalDebit = 0
    let totalCredit = 0

    accounts.forEach((acc: any) => {
      const amt = parseFloat(acc.amount) || 0
      if (amt > 0) {
        const side = acc.type === "CREDIT" ? "CREDIT" : "DEBIT"
        validLines.push({ accountCode: acc.accountCode, type: side, amount: amt })
        if (side === "DEBIT") totalDebit += amt
        else totalCredit += amt
      }
    })

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Saldo awal tidak seimbang / balance! Total Debit: Rp ${totalDebit.toLocaleString("id-ID")}, Total Kredit: Rp ${totalCredit.toLocaleString("id-ID")}. Selisih: Rp ${Math.abs(totalDebit - totalCredit).toLocaleString("id-ID")}`
        },
        { status: 400 }
      )
    }

    // 1. Simpan ke database OpeningBalance
    await db.$transaction(async (tx) => {
      // Hapus data lama jika ada
      await tx.openingBalance.deleteMany({ where: { year: parsedYear } })

      for (const line of validLines) {
        await tx.openingBalance.create({
          data: {
            year: parsedYear,
            accountCode: line.accountCode,
            type: line.type,
            amount: line.amount
          }
        })
      }

      // 2. Bentuk Jurnal Buka Buku (SA/{year}/01/0001) per 1 Januari
      const openingDate = new Date(`${parsedYear}-01-01T00:00:01.000Z`)
      const openingProofNumber = `SA/${parsedYear}/01/0001`

      // Hapus jurnal buka buku lama jika ada
      const oldEntry = await tx.journalEntry.findUnique({ where: { proofNumber: openingProofNumber } })
      if (oldEntry) {
        await tx.journalEntry.delete({ where: { id: oldEntry.id } })
      }

      if (validLines.length > 0) {
        const entry = await tx.journalEntry.create({
          data: {
            proofNumber: openingProofNumber,
            proofType: "MEMORIAL",
            date: openingDate,
            description: `Pencatatan Saldo Awal (Buka Buku) Tahun ${parsedYear} BUMDes`,
            payeeOrPayer: "Sistem Akuntansi BUMDes",
            unitName: "Umum",
            note: `Saldo Awal Tahun Buku ${parsedYear} (Roll Forward)`,
            verificationStatus: "VERIFIED"
          }
        })

        for (const line of validLines) {
          await tx.journalLine.create({
            data: {
              journalEntryId: entry.id,
              accountCode: line.accountCode,
              type: line.type,
              amount: line.amount
            }
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan Saldo Awal dan membuka pembukuan tahun ${parsedYear}. Jurnal buka buku resmi SA/${parsedYear}/01/0001 telah tercatat.`
    })
  } catch (error: any) {
    console.error("Error saving opening balance:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
