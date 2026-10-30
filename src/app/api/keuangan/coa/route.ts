import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import path from "path"
import fs from "fs"

let standardCoaCache: Map<string, string> | null = null
function getStandardCoaMap() {
  if (!standardCoaCache) {
    try {
      const coaPath = path.join(process.cwd(), "prisma", "coa_kemendes_136.json")
      if (fs.existsSync(coaPath)) {
        const raw = fs.readFileSync(coaPath, "utf-8")
        const list: { code: string; name: string }[] = JSON.parse(raw)
        standardCoaCache = new Map(list.map(item => [item.code, item.name]))
      } else {
        standardCoaCache = new Map()
      }
    } catch {
      standardCoaCache = new Map()
    }
  }
  return standardCoaCache
}

// GET: List all Chart of Accounts (COA) with optional filtering/search
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const session = await getUserSession(); if (!session) return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 }); const search = searchParams.get("search") || ""
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

    const standardMap = getStandardCoaMap()
    const enriched = accounts.map((acc) => {
      const isStandard = standardMap.has(acc.code)
      const originalName = standardMap.get(acc.code)
      const isCustomized = isStandard && originalName !== acc.name
      return {
        ...acc,
        isStandard,
        isCustomized,
        originalName: isStandard ? originalName : null
      }
    })

const STANDARD_GROUPS = [
  { prefix: "1.1.01", name: "Kas dan Setara Kas", type: "ASSET", normal: "Debit" },
  { prefix: "1.1.03", name: "Piutang Usaha", type: "ASSET", normal: "Debit" },
  { prefix: "1.1.05", name: "Persediaan", type: "ASSET", normal: "Debit" },
  { prefix: "1.3.01", name: "Aset Tetap Berwujud", type: "ASSET", normal: "Debit" },
  { prefix: "2.1.01", name: "Kewajiban Jangka Pendek", type: "LIABILITY", normal: "Credit" },
  { prefix: "3.1.01", name: "Ekuitas / Modal BUMDes", type: "EQUITY", normal: "Credit" },
  { prefix: "4.1.01", name: "Pendapatan Usaha Utama", type: "REVENUE", normal: "Credit" },
  { prefix: "4.1.02", name: "Pendapatan Jasa & Sewa", type: "REVENUE", normal: "Credit" },
  { prefix: "6.1.01", name: "Beban Operasional SDM", type: "EXPENSE", normal: "Debit" },
  { prefix: "6.1.04", name: "Beban Operasional Lainnya", type: "EXPENSE", normal: "Debit" }
]

    return NextResponse.json({ success: true, data: enriched, groups: STANDARD_GROUPS })
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
        targetAccount: code.trim(),
        cashAccount: defaultCashAcc,
        cashFlowGroup,
        description: `Transaksi ${name.trim()}`
      }
    })


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

    // Check if account has been used in transactions or referenced in inventory/assets
    const [usedCount, invCount, assetCount] = await Promise.all([
      db.journalLine.count({ where: { accountCode: code } }),
      db.inventoryItem.count({ where: { accountCode: code } }),
      db.fixedAsset.count({
        where: {
          OR: [
            { assetAccountCode: code },
            { deprAccountCode: code },
            { expAccountCode: code }
          ]
        }
      })
    ])

    if (usedCount > 0 || invCount > 0 || assetCount > 0) {
      const reasons: string[] = []
      if (usedCount > 0) reasons.push(`${usedCount} riwayat transaksi jurnal`)
      if (invCount > 0) reasons.push(`${invCount} barang inventaris`)
      if (assetCount > 0) reasons.push(`${assetCount} register aset tetap`)
      return NextResponse.json(
        {
          success: false,
          error: `Akun ${code} tidak dapat dihapus karena masih terhubung dengan ${reasons.join(", ")}.`
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


    return NextResponse.json({ success: true, message: `Akun ${code} berhasil dihapus.` })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus akun COA" },
      { status: 500 }
    )
  }
}

// PUT: Update/customize existing COA account (custom name, type, normal balance)
export async function PUT(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 })
    }

    const body = await request.json()
    const { code, name, normal, type } = body

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: "Kode Akun dan Nama Akun wajib diisi" },
        { status: 400 }
      )
    }

    const existing = await db.ledgerAccount.findUnique({
      where: { code: code.trim() }
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Akun ${code} tidak ditemukan` },
        { status: 404 }
      )
    }

    const updateData: any = {
      name: name.trim()
    }
    if (normal) updateData.normal = normal
    if (type) updateData.type = type

    const updated = await db.ledgerAccount.update({
      where: { code: code.trim() },
      data: updateData
    })

    // Also update any associated transaction templates
    await db.transactionTemplate.updateMany({
      where: { targetAccount: code.trim() },
      data: {
        name: name.trim(),
        description: `Transaksi ${name.trim()}`
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui akun COA" },
      { status: 500 }
    )
  }
}

