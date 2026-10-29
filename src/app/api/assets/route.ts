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
    const targetYear = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10)

    const assets = await db.fixedAsset.findMany({
      orderBy: { acquisitionDate: "asc" }
    })

    const formatted = assets.map((asset) => {
      const acqDate = new Date(asset.acquisitionDate)
      const acqYear = acqDate.getFullYear()
      const acqMonth = acqDate.getMonth() + 1 // 1-12

      const cost = asset.acquisitionCost
      const salvage = asset.salvageValue || 0
      const depreciableAmount = Math.max(0, cost - salvage)
      const usefulYears = Math.max(1, asset.usefulLifeYears)

      // Metode Garis Lurus (Straight-Line Method)
      const annualDepreciation = depreciableAmount / usefulYears
      const monthlyDepreciation = annualDepreciation / 12

      // Hitung akumulasi penyusutan hingga akhir tahun target
      let totalMonthsElapsed = 0
      if (targetYear >= acqYear) {
        if (targetYear === acqYear) {
          totalMonthsElapsed = 12 - acqMonth + 1 // Bulan berjalan di tahun perolehan
        } else {
          const firstYearMonths = 12 - acqMonth + 1
          const fullYearsBetween = targetYear - acqYear - 1
          totalMonthsElapsed = firstYearMonths + fullYearsBetween * 12 + 12
        }
      }

      const maxDepreciableMonths = usefulYears * 12
      const activeMonths = Math.min(totalMonthsElapsed, maxDepreciableMonths)
      const accumulatedDepreciation = Math.min(depreciableAmount, activeMonths * monthlyDepreciation)
      const bookValue = Math.max(salvage, cost - accumulatedDepreciation)

      // Beban tahun berjalan
      let currentYearExpense = 0
      if (targetYear >= acqYear && totalMonthsElapsed > 0) {
        if (targetYear === acqYear) {
          currentYearExpense = Math.min(depreciableAmount, (12 - acqMonth + 1) * monthlyDepreciation)
        } else if (activeMonths < maxDepreciableMonths) {
          const remainingMonths = maxDepreciableMonths - (activeMonths - 12)
          currentYearExpense = Math.min(annualDepreciation, remainingMonths * monthlyDepreciation)
        } else if (activeMonths === maxDepreciableMonths && totalMonthsElapsed - 12 < maxDepreciableMonths) {
          const monthsInYear = maxDepreciableMonths - (totalMonthsElapsed - 12)
          currentYearExpense = Math.max(0, monthsInYear * monthlyDepreciation)
        }
      }

      return {
        id: asset.id,
        code: asset.code,
        name: asset.name,
        category: asset.category,
        acquisitionDate: asset.acquisitionDate,
        acquisitionCost: cost,
        usefulLifeYears: usefulYears,
        salvageValue: salvage,
        annualDepreciation,
        monthlyDepreciation,
        accumulatedDepreciation,
        currentYearExpense,
        bookValue,
        isFullyDepreciated: accumulatedDepreciation >= depreciableAmount,
        assetAccountCode: asset.assetAccountCode,
        deprAccountCode: asset.deprAccountCode,
        expAccountCode: asset.expAccountCode,
        location: asset.location || "Kantor BUMDes",
        condition: asset.condition || "BAIK",
        notes: asset.notes
      }
    })

    // Agregasi Buku Besar untuk Aset Tetap (1.3.xx / 1.2.01) dan Akumulasi Penyusutan (1.3.07 / 1.2.02)
    const hasOpeningJournal = await db.journalEntry.findFirst({
      where: { proofNumber: { startsWith: `SA/${targetYear}/` } },
      select: { id: true }
    })
    const assetDateCondition = hasOpeningJournal
      ? { gte: new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0)), lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999)) }
      : { lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999)) }

    const assetLines = await db.journalLine.findMany({
      where: {
        OR: [
          { accountCode: { startsWith: "1.3." } },
          { accountCode: { startsWith: "1.2.01" } }
        ],
        NOT: [
          { accountCode: { startsWith: "1.3.07" } }
        ],
        journalEntry: {
          date: assetDateCondition
        }
      },
      select: { type: true, amount: true }
    })
    let ledgerAssetCost = 0
    assetLines.forEach((l) => {
      if (l.type === "DEBIT") ledgerAssetCost += l.amount
      else ledgerAssetCost -= l.amount
    })

    const deprLines = await db.journalLine.findMany({
      where: {
        OR: [
          { accountCode: { startsWith: "1.3.07" } },
          { accountCode: { startsWith: "1.2.02" } }
        ],
        journalEntry: {
          date: assetDateCondition
        }
      },
      select: { type: true, amount: true }
    })
    let ledgerDepr = 0
    deprLines.forEach((l) => {
      if (l.type === "CREDIT") ledgerDepr += l.amount
      else ledgerDepr -= l.amount
    })

    const totalAcquisitionCost = formatted.reduce((acc, curr) => acc + curr.acquisitionCost, 0)
    const totalAccumulatedDepreciation = formatted.reduce((acc, curr) => acc + curr.accumulatedDepreciation, 0)
    const totalBookValue = formatted.reduce((acc, curr) => acc + curr.bookValue, 0)
    const totalCurrentYearDepreciation = formatted.reduce((acc, curr) => acc + curr.currentYearExpense, 0)
    const priorAccumulatedDepreciation = totalAccumulatedDepreciation - totalCurrentYearDepreciation

    const costDiff = totalAcquisitionCost - ledgerAssetCost
    const deprDiff = totalAccumulatedDepreciation - ledgerDepr
    const isCostReconciled = Math.abs(costDiff) < 1
    const isDeprFullyPosted = Math.abs(deprDiff) < 1
    const isOpeningDeprReconciled = Math.abs(priorAccumulatedDepreciation - ledgerDepr) < 1
    const isPendingClosingDepreciation = isOpeningDeprReconciled && !isDeprFullyPosted

    const summary = {
      totalAssetsCount: formatted.length,
      totalAcquisitionCost,
      totalAccumulatedDepreciation,
      totalBookValue,
      totalCurrentYearDepreciation,
      priorAccumulatedDepreciation,
      reconciliation: {
        subsidiaryCost: totalAcquisitionCost,
        ledgerAssetCost,
        costDiff,
        isCostReconciled,
        subsidiaryDepr: totalAccumulatedDepreciation,
        ledgerDepr,
        deprDiff,
        isDeprReconciled: isDeprFullyPosted || isOpeningDeprReconciled,
        isDeprFullyPosted,
        isPendingClosingDepreciation,
        pendingDepreciationAmount: totalCurrentYearDepreciation,
        isFullyReconciled: isCostReconciled && (isDeprFullyPosted || isOpeningDeprReconciled)
      }
    }

    return NextResponse.json({
      success: true,
      year: targetYear,
      data: formatted,
      summary
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat register aset tetap" }, { status: 500 })
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

    if (action === "CREATE_ASSET") {
      const {
        code,
        name,
        category,
        acquisitionDate,
        acquisitionCost,
        usefulLifeYears,
        salvageValue,
        assetAccountCode,
        deprAccountCode,
        expAccountCode,
        location,
        condition,
        notes
      } = body

      if (!code || !name || !acquisitionDate || !acquisitionCost) {
        return NextResponse.json({ success: false, error: "Nomor Registrasi, Nama Aset, Tanggal Beli, dan Harga Perolehan wajib diisi." }, { status: 400 })
      }

      const existing = await db.fixedAsset.findUnique({
        where: { code: code.trim().toUpperCase() }
      })
      if (existing) {
        return NextResponse.json({ success: false, error: `Nomor registrasi aset "${code}" sudah terdaftar.` }, { status: 400 })
      }

      const newAsset = await db.fixedAsset.create({
        data: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          category: category?.trim() || "Peralatan & Mesin",
          acquisitionDate: new Date(acquisitionDate),
          acquisitionCost: Math.max(0, parseFloat(acquisitionCost) || 0),
          usefulLifeYears: Math.max(1, parseInt(usefulLifeYears, 10) || 4),
          salvageValue: Math.max(0, parseFloat(salvageValue) || 0),
          assetAccountCode: assetAccountCode?.trim() || "1.2.01.01",
          deprAccountCode: deprAccountCode?.trim() || "1.2.02.01",
          expAccountCode: expAccountCode?.trim() || "6.1.05.01",
          location: location?.trim() || "Kantor BUMDes",
          condition: condition?.trim() || "BAIK",
          notes: notes?.trim() || null
        }
      })

      return NextResponse.json({ success: true, message: "Aset tetap berhasil didaftarkan ke register.", data: newAsset })
    }

    if (action === "UPDATE_CONDITION") {
      const { id, condition } = body
      if (!id || !["BAIK", "RUSAK RINGAN", "RUSAK BERAT"].includes(condition)) {
        return NextResponse.json({ success: false, error: "ID dan status kondisi fisik valid wajib disertakan." }, { status: 400 })
      }
      const updated = await db.fixedAsset.update({
        where: { id },
        data: { condition }
      })
      return NextResponse.json({ success: true, message: `Kondisi fisik aset diperbarui menjadi ${condition}`, data: updated })
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan aset tetap" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const body = await request.json()
    const { id, condition, location, notes } = body
    if (!id) {
      return NextResponse.json({ success: false, error: "ID aset tetap wajib disertakan." }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (condition && ["BAIK", "RUSAK RINGAN", "RUSAK BERAT"].includes(condition)) {
      dataToUpdate.condition = condition
    }
    if (location !== undefined) dataToUpdate.location = location
    if (notes !== undefined) dataToUpdate.notes = notes

    const updated = await db.fixedAsset.update({
      where: { id },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, message: "Kondisi fisik aset berhasil diperbarui.", data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui kondisi aset" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Administrator yang memiliki hak akses menghapus data aset tetap." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID aset tetap wajib disertakan." }, { status: 400 })
    }

    await db.fixedAsset.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Aset tetap berhasil dihapus dari register inventaris." })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus aset tetap" }, { status: 500 })
  }
}
