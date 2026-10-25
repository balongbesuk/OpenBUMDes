import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { logActivity } from "@/lib/audit"

// GET: List all Chart of Accounts (COA) with optional filtering/search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""

    const where: any = {}
    if (type && type !== "ALL") {
      where.type = type
    }
    if (search.trim()) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } }
      ]
    }

    const accounts = await db.ledgerAccount.findMany({
      where,
      orderBy: { code: "asc" }
    })

    return NextResponse.json({ success: true, data: accounts })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil daftar akun COA" },
      { status: 500 }
    )
  }
}

// POST: Add a new dynamic account to COA (e.g. 1.1.01.07 Kas di Bank Jombang)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, normal, type } = body

    if (!code || !name || !type) {
      return NextResponse.json(
        { success: false, error: "Kode Akun, Nama Akun, dan Kelompok Akun wajib diisi" },
        { status: 400 }
      )
    }

    // Check if account code already exists
    const existing = await db.ledgerAccount.findUnique({
      where: { code: code.trim() }
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Kode akun ${code} sudah terdaftar dengan nama: ${existing.name}` },
        { status: 400 }
      )
    }

    const created = await db.ledgerAccount.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        type,
        normal: normal || (type === "ASSET" || type === "EXPENSE" ? "Debit" : "Kredit")
      }
    })

    // Also auto-create a friendly Transaction Template for this new account!
    let templateCategory = "BKM"
    let defaultCashAcc = "1.1.01.01"
    let cashFlowGroup = "Penerimaan kas dari penjualan jasa"

    if (type === "EXPENSE") {
      templateCategory = "BKK"
      cashFlowGroup = "Pengeluaran kas untuk pembayaran beban-beban yang lain"
    } else if (type === "REVENUE") {
      templateCategory = "BKM"
      cashFlowGroup = "Penerimaan kas dari penjualan jasa"
    } else if (type === "ASSET" && code.startsWith("1.1.01")) {
      // It's a new bank or cash account
      templateCategory = "BKM"
      defaultCashAcc = code.trim()
    }

    await db.transactionTemplate.create({
      data: {
        category: templateCategory,
        name: name.trim(),
        unitUsaha: "UMUM",
        targetAccount: code.trim(),
        cashAccount: defaultCashAcc,
        cashFlowGroup,
        description: `Transaksi ${name.trim()}`
      }
    })

    await logActivity("CREATE_COA_ACCOUNT", `Menambahkan akun COA baru: ${code} - ${name} (${type})`, session)

    return NextResponse.json({ success: true, data: created })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambahkan akun COA" },
      { status: 500 }
    )
  }
}

// DELETE: Delete account from COA if not used in any journal lines
export async function DELETE(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    if (!code) {
      return NextResponse.json({ success: false, error: "Kode akun wajib dicantumkan" }, { status: 400 })
    }

    // Check if account has been used in transactions
    const usedCount = await db.journalLine.count({
      where: { accountCode: code }
    })
    if (usedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Akun ${code} tidak dapat dihapus karena sudah memiliki ${usedCount} riwayat transaksi jurnal.`
        },
        { status: 400 }
      )
    }

    await db.ledgerAccount.delete({
      where: { code }
    })

    // Remove associated template if any
    await db.transactionTemplate.deleteMany({
      where: { targetAccount: code }
    })

    await logActivity("DELETE_COA_ACCOUNT", `Menghapus akun COA: ${code}`, session)

    return NextResponse.json({ success: true, message: `Akun ${code} berhasil dihapus.` })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus akun COA" },
      { status: 500 }
    )
  }
}
