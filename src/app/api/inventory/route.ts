import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"

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

    // Hitung ringkasan per barang
    const formatted = items.map((item) => {
      let qty = item.initialQty
      let totalCost = item.initialQty * item.initialCost

      // Urutkan per tanggal untuk tracking saldo mutasi
      const sortedMovements = [...item.movements].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      sortedMovements.forEach((m) => {
        if (m.type === "IN") {
          qty += m.qty
          totalCost += m.totalCost || m.qty * (m.costPerUnit || item.initialCost)
        } else if (m.type === "OUT") {
          const avgCost = qty > 0 ? totalCost / qty : item.initialCost
          qty -= m.qty
          totalCost -= m.qty * avgCost
        } else if (m.type === "ADJUST") {
          qty = m.qty
          totalCost = m.qty * (m.costPerUnit || item.initialCost)
        }
      })

      const finalQty = Math.max(0, qty)
      const avgCostPerUnit = finalQty > 0 ? Math.max(0, totalCost / finalQty) : item.initialCost

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        unit: item.unit,
        category: item.category || "Barang Dagangan",
        initialQty: item.initialQty,
        initialCost: item.initialCost,
        currentQty: finalQty,
        avgCostPerUnit,
        totalValue: finalQty * avgCostPerUnit,
        minStock: item.minStock,
        isLowStock: finalQty <= item.minStock,
        accountCode: item.accountCode,
        notes: item.notes,
        movementCount: item.movements.length,
        createdAt: item.createdAt
      }
    })

    const summary = {
      totalItems: formatted.length,
      totalInventoryValue: formatted.reduce((acc, curr) => acc + curr.totalValue, 0),
      lowStockCount: formatted.filter((i) => i.isLowStock).length
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

      const newItem = await db.inventoryItem.create({
        data: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          unit: unit?.trim() || "Pcs",
          category: category?.trim() || "Barang Dagangan",
          initialQty: initQ,
          initialCost: initC,
          currentQty: initQ,
          minStock: Math.max(0, parseFloat(minStock) || 5),
          accountCode: accountCode?.trim() || "1.1.04.01",
          notes: notes?.trim() || null
        }
      })

      // Jika ada stok awal > 0, buat movement record pertama
      if (initQ > 0) {
        await db.inventoryMovement.create({
          data: {
            itemId: newItem.id,
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

      return NextResponse.json({ success: true, message: "Barang persediaan berhasil ditambahkan.", data: newItem })
    }

    if (action === "ADD_MOVEMENT") {
      const { itemId, date, type, qty, costPerUnit, referenceProof, description } = body

      if (!itemId || !type || !qty) {
        return NextResponse.json({ success: false, error: "Data mutasi barang tidak lengkap." }, { status: 400 })
      }

      const item = await db.inventoryItem.findUnique({ where: { id: itemId } })
      if (!item) {
        return NextResponse.json({ success: false, error: "Barang tidak ditemukan." }, { status: 404 })
      }

      const numQty = parseFloat(qty)
      if (isNaN(numQty) || numQty <= 0) {
        return NextResponse.json({ success: false, error: "Jumlah mutasi harus lebih dari 0." }, { status: 400 })
      }

      const unitCost = parseFloat(costPerUnit) || item.initialCost || 0
      const totalCost = numQty * unitCost

      const movement = await db.inventoryMovement.create({
        data: {
          itemId,
          date: date ? new Date(date) : new Date(),
          type: type.toUpperCase(), // "IN", "OUT", "ADJUST"
          qty: numQty,
          costPerUnit: unitCost,
          totalCost,
          referenceProof: referenceProof?.trim() || null,
          description: description?.trim() || (type === "IN" ? "Barang Masuk / Pembelian" : "Barang Keluar / Penjualan")
        }
      })

      // Update currentQty pada item
      let newQty = item.currentQty
      if (type === "IN") newQty += numQty
      else if (type === "OUT") newQty = Math.max(0, newQty - numQty)
      else if (type === "ADJUST") newQty = numQty

      await db.inventoryItem.update({
        where: { id: itemId },
        data: { currentQty: newQty }
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
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID barang wajib disertakan" }, { status: 400 })
    }

    await db.inventoryItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Barang persediaan dan riwayat mutasi berhasil dihapus." })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus barang" }, { status: 500 })
  }
}
