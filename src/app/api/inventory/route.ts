import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"
import { calculateInventoryValuation } from "@/lib/ledger"

export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak. Silakan masuk terlebih dahulu." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")

    if (itemId) {
      const item = await db.inventoryItem.findUnique({
        where: { id: itemId },
        include: {
          movements: {
            orderBy: [{ date: "desc" }, { createdAt: "desc" }]
          }
        }
      })
      if (!item) {
        return NextResponse.json({ success: false, error: "Barang tidak ditemukan" }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: item })
    }

    const items = await db.inventoryItem.findMany({
      include: {
        movements: true
      },
      orderBy: { code: "asc" }
    })

    const formatted = items.map((item) => {
      const { currentQty, avgCostPerUnit, totalValue } = calculateInventoryValuation(item)

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        unit: item.unit,
        category: item.category || "Barang Dagangan",
        initialQty: item.initialQty,
        initialCost: item.initialCost,
        currentQty,
        avgCostPerUnit,
        totalValue,
        minStock: item.minStock,
        isLowStock: currentQty <= item.minStock,
        accountCode: item.accountCode,
        notes: item.notes,
        movementCount: item.movements.length,
        createdAt: item.createdAt
      }
    })

    const targetYear = parseInt(searchParams.get("year") || `${new Date().getUTCFullYear()}`, 10)
    const hasSa = await db.journalEntry.findFirst({
      where: { proofNumber: { startsWith: `SA/${targetYear}/` } },
      select: { id: true }
    })
    const invDateFilter = hasSa
      ? { gte: new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0)), lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999)) }
      : { lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999)) }

    const invLines = await db.journalLine.findMany({
      where: {
        OR: [
          { accountCode: { startsWith: "1.1.05" } },
          { accountCode: { startsWith: "1.1.06" } }
        ],
        journalEntry: { date: invDateFilter }
      },
      select: { type: true, amount: true }
    })
    let ledgerInventoryBalance = 0
    invLines.forEach((l) => {
      if (l.type === "DEBIT") ledgerInventoryBalance += l.amount
      else ledgerInventoryBalance -= l.amount
    })

    const totalInventoryValue = formatted.reduce((acc, curr) => acc + curr.totalValue, 0)
    const difference = totalInventoryValue - ledgerInventoryBalance

    const summary = {
      totalItems: formatted.length,
      totalInventoryValue,
      lowStockCount: formatted.filter((i) => i.isLowStock).length,
      reconciliation: {
        subsidiaryTotal: totalInventoryValue,
        ledgerBalance: ledgerInventoryBalance,
        difference,
        isReconciled: Math.abs(difference) < 1,
        accountCode: "1.1.05",
        accountName: "Persediaan Barang Dagangan"
      }
    }

    return NextResponse.json({
      success: true,
      data: formatted,
      summary
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat persediaan" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "CREATE_ITEM") {
      const { code, name, unit, category, initialQty, initialCost, minStock, accountCode, notes } = body

      if (!code || !name) {
        return NextResponse.json({ success: false, error: "Kode/SKU dan Nama Barang wajib diisi." }, { status: 400 })
      }

      const existing = await db.inventoryItem.findUnique({
        where: { code: code.trim().toUpperCase() }
      })
      if (existing) {
        return NextResponse.json({ success: false, error: `Kode barang "${code}" sudah terdaftar.` }, { status: 400 })
      }

      const initQ = Math.max(0, parseFloat(initialQty) || 0)
      const initC = Math.max(0, parseFloat(initialCost) || 0)

      if (initQ > 0) {
        const curYear = new Date().getUTCFullYear()
        const closed = await db.annualClosing.findUnique({ where: { year: curYear } })
        if (closed?.isLocked) {
          return NextResponse.json(
            { success: false, error: `Pendaftaran stok awal ditolak. Tahun pembukuan ${curYear} telah ditutup buku dan dikunci.` },
            { status: 403 }
          )
        }
      }

      const newItem = await db.$transaction(async (tx) => {
        const created = await tx.inventoryItem.create({
          data: {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            unit: unit?.trim() || "Pcs",
            category: category?.trim() || "Barang Dagangan",
            initialQty: initQ,
            initialCost: initC,
            currentQty: initQ,
            minStock: Math.max(0, parseFloat(minStock) || 5),
            accountCode: accountCode?.trim() || "1.1.05.01",
            notes: notes?.trim() || null
          }
        })

        if (initQ > 0) {
          await tx.inventoryMovement.create({
            data: {
              itemId: created.id,
              date: new Date(),
              type: "IN",
              qty: initQ,
              costPerUnit: initC,
              totalCost: initQ * initC,
              description: "Saldo Stok Awal Barang",
              referenceProof: "SALDO-AWAL"
            }
          })
        }

        return created
      })

      return NextResponse.json({ success: true, message: "Barang persediaan berhasil ditambahkan.", data: newItem })
    }

    if (action === "ADD_MOVEMENT") {
      const { itemId, date, type, qty, costPerUnit, referenceProof, description } = body
      const normType = String(type || "").toUpperCase()

      if (!itemId || !["IN", "OUT", "ADJUST"].includes(normType) || qty === undefined || qty === null || qty === "") {
        return NextResponse.json({ success: false, error: "Data mutasi barang tidak lengkap." }, { status: 400 })
      }

      const item = await db.inventoryItem.findUnique({ where: { id: itemId } })
      if (!item) {
        return NextResponse.json({ success: false, error: "Barang tidak ditemukan." }, { status: 404 })
      }

      const numQty = parseFloat(qty)
      if (isNaN(numQty) || (normType === "ADJUST" ? numQty < 0 : numQty <= 0)) {
        return NextResponse.json(
          { success: false, error: normType === "ADJUST" ? "Jumlah stok opname tidak boleh negatif." : "Jumlah mutasi harus lebih dari 0." },
          { status: 400 }
        )
      }

      if (normType === "OUT" && item.currentQty < numQty) {
        return NextResponse.json({
          success: false,
          error: `Stok barang tidak mencukupi untuk dikeluarkan. Tersedia: ${item.currentQty} ${item.unit}, diminta: ${numQty} ${item.unit}.`
        }, { status: 400 })
      }

      const txDate = date ? new Date(date) : new Date()
      const txYear = txDate.getUTCFullYear()
      const closed = await db.annualClosing.findUnique({ where: { year: txYear } })
      if (closed?.isLocked) {
        return NextResponse.json(
          { success: false, error: `Mutasi ditolak. Tahun pembukuan ${txYear} telah ditutup buku dan dikunci.` },
          { status: 403 }
        )
      }

      const unitCost = parseFloat(costPerUnit) || item.initialCost || 0
      const totalCost = numQty * unitCost

      const movement = await db.$transaction(async (tx) => {
        const m = await tx.inventoryMovement.create({
          data: {
            itemId,
            date: txDate,
            type: normType,
            qty: numQty,
            costPerUnit: unitCost,
            totalCost,
            referenceProof: referenceProof?.trim() || null,
            description:
              description?.trim() ||
              (normType === "IN" ? "Barang Masuk / Pembelian" : normType === "OUT" ? "Barang Keluar / Penjualan" : "Penyesuaian Stok Opname")
          }
        })

        if (normType === "IN") {
          await tx.inventoryItem.update({
            where: { id: itemId },
            data: { currentQty: { increment: numQty } }
          })
        } else if (normType === "OUT") {
          await tx.inventoryItem.update({
            where: { id: itemId },
            data: { currentQty: { decrement: numQty } }
          })
        } else if (normType === "ADJUST") {
          await tx.inventoryItem.update({
            where: { id: itemId },
            data: { currentQty: numQty }
          })
        }

        return m
      })

      return NextResponse.json({ success: true, message: "Mutasi stok barang berhasil dicatat.", data: movement })
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses persediaan" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses ditolak. Hanya Admin yang dapat menghapus barang inventaris." }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID barang wajib disertakan" }, { status: 400 })
    }

    const item = await db.inventoryItem.findUnique({
      where: { id },
      include: { movements: { select: { date: true } } }
    })
    if (!item) {
      return NextResponse.json({ success: false, error: "Barang tidak ditemukan atau sudah dihapus." }, { status: 404 })
    }

    const lockedClosings = await db.annualClosing.findMany({ where: { isLocked: true }, select: { year: true } })
    const lockedYears = new Set(lockedClosings.map((c) => c.year))
    const mutLockedYear = item.movements
      .map((m) => new Date(m.date).getUTCFullYear())
      .find((y) => lockedYears.has(y))
    if (mutLockedYear) {
      return NextResponse.json({
        success: false,
        error: `Penghapusan ditolak. Barang "${item.name}" memiliki riwayat mutasi pada Tahun Anggaran ${mutLockedYear} yang telah ditutup buku dan berstatus Terkunci (Arsip LPJ Resmi).`
      }, { status: 403 })
    }

    if (item.currentQty > 0) {
      return NextResponse.json({
        success: false,
        error: `Barang "${item.name}" tidak dapat dihapus karena masih memiliki stok sebanyak ${item.currentQty} ${item.unit}. Harap lakukan mutasi keluar atau sesuaikan stok menjadi 0 terlebih dahulu.`
      }, { status: 400 })
    }

    await db.inventoryItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Barang persediaan dan riwayat mutasi berhasil dihapus." })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus barang" }, { status: 500 })
  }
}
