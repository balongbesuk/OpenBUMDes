"use client"

import React, { useState, useEffect } from "react"
import {
  Package,
  Plus,
  Printer,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Boxes,
  Trash2,
  X,
  FileSpreadsheet,
  CheckCircle2
} from "lucide-react"
import { formatRupiah, safePrintElement, getLocalDateString } from "@/lib/utils"
import { showAppAlert, showAppConfirm, showAppToast } from "@/components/ui/AppDialog"

interface InventoryTabProps {
  settings?: Record<string, string>
}

export default function InventoryTab({ settings = {} }: InventoryTabProps) {
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({ totalItems: 0, totalInventoryValue: 0, lowStockCount: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [activeItem, setActiveItem] = useState<any>(null)
  const [activeItemHistory, setActiveItemHistory] = useState<any>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Form State Tambah Barang
  const [itemForm, setItemForm] = useState({
    code: "",
    name: "",
    unit: "Pcs",
    category: "Barang Dagangan",
    initialQty: "0",
    initialCost: "0",
    minStock: "5",
    accountCode: "1.1.05.01",
    notes: ""
  })

  // Form State Mutasi
  const [movementForm, setMovementForm] = useState({
    date: getLocalDateString(),
    type: "IN",
    qty: "1",
    costPerUnit: "",
    referenceProof: "",
    description: ""
  })

  const bumdesName = settings.bumdes_name || "BUMDesa Mandiri Sejahtera"
  const villageName = settings.village_name || "Balongbesuk"
  const subdistrictName = settings.subdistrict_name || settings.district_name || "Diwek"
  const regencyName = settings.regency_name || "Jombang"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const directorNip = settings.director_nip || "-"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"
  const treasurerNip = settings.treasurer_nip || "-"

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/inventory")
      const json = await res.json()
      if (json.success) {
        setItems(json.data || [])
        setSummary(json.summary || { totalItems: 0, totalInventoryValue: 0, lowStockCount: 0 })
      } else {
        showAppAlert(json.error || "Gagal memuat data persediaan.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Kesalahan koneksi: " + e.message, { type: "error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenHistory = async (item: any) => {
    setActiveItem(item)
    setShowHistoryModal(true)
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/inventory?itemId=${encodeURIComponent(item.id)}`)
      const json = await res.json()
      if (json.success) {
        setActiveItemHistory(json.data)
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleOpenMovement = (item: any, defaultType: "IN" | "OUT" = "IN") => {
    setActiveItem(item)
    setMovementForm({
      date: getLocalDateString(),
      type: defaultType,
      qty: "1",
      costPerUnit: `${item.avgCostPerUnit || item.initialCost || 0}`,
      referenceProof: defaultType === "IN" ? "BKK-" : "BKM-",
      description: defaultType === "IN" ? `Pembelian ${item.name}` : `Penjualan ${item.name}`
    })
    setShowMovementModal(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ITEM",
          ...itemForm
        })
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Barang persediaan baru berhasil ditambahkan!", "success")
        setShowAddModal(false)
        setItemForm({
          code: "",
          name: "",
          unit: "Pcs",
          category: "Barang Dagangan",
          initialQty: "0",
          initialCost: "0",
          minStock: "5",
          accountCode: "1.1.04.01",
          notes: ""
        })
        loadData()
      } else {
        showAppAlert(json.error || "Gagal menyimpan barang.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Error: " + e.message, { type: "error" })
    }
  }

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeItem) return
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_MOVEMENT",
          itemId: activeItem.id,
          ...movementForm
        })
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Mutasi stok berhasil dicatat ke kartu persediaan!", "success")
        setShowMovementModal(false)
        loadData()
      } else {
        showAppAlert(json.error || "Gagal mencatat mutasi stok.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Error: " + e.message, { type: "error" })
    }
  }

  const handleDeleteItem = async (item: any) => {
    const confirmed = await showAppConfirm(
      `Hapus barang "${item.code} - ${item.name}" beserta seluruh riwayat mutasinya?`,
      {
        title: "Konfirmasi Hapus Barang",
        type: "danger",
        confirmText: "Ya, Hapus Permanen"
      }
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/inventory?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE"
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Barang berhasil dihapus.", "success")
        loadData()
      } else {
        showAppAlert(json.error || "Gagal menghapus barang.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Error: " + e.message, { type: "error" })
    }
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchCat = selectedCategory === "all" || item.category === selectedCategory
    return matchQuery && matchCat
  })

  const categories = Array.from(new Set(items.map((i) => i.category || "Barang Dagangan")))

  return (
    <div className="space-y-6">
      {/* Top Banner / Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Buku Pembantu Persediaan & Kartu Stok</h2>
              <p className="text-xs text-slate-500">
                Pencatatan mutasi barang dagangan, saldo fisik gudang, dan valuasi stok Kepmendesa 136
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => safePrintElement("printable-inventory-report", `Rekapitulasi Persediaan & Kartu Stok - ${bumdesName}`)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Rekap Stok</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Item Barang</span>
            <Boxes className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{summary.totalItems} <span className="text-xs font-normal text-slate-500">SKU</span></div>
          <p className="text-[11px] text-slate-400 mt-1">Terdaftar dalam master persediaan BUMDes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Nilai Persediaan</span>
            <TrendingUp className="w-4 h-4 text-[#6777ef]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#6777ef]">{formatRupiah(summary.totalInventoryValue)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Nilai aset lancar (COA Akun 1.1.04)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Peringatan Stok Menipis</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{summary.lowStockCount} <span className="text-xs font-normal text-slate-500">Item</span></div>
          <p className="text-[11px] text-slate-400 mt-1">Stok di bawah batas minimum pengingat</p>
        </div>
      </div>

      {/* AUDIT RECONCILIATION STATUS BANNER */}
      {summary.reconciliation && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            summary.reconciliation.isReconciled
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : "bg-amber-50/80 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  summary.reconciliation.isReconciled
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {summary.reconciliation.isReconciled ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Kontrol Audit & Rekonsiliasi Neraca (Akun {summary.reconciliation.accountCode})
                  </h4>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      summary.reconciliation.isReconciled
                        ? "bg-emerald-200/80 text-emerald-800"
                        : "bg-amber-200/80 text-amber-800"
                    }`}
                  >
                    {summary.reconciliation.isReconciled ? "SINKRON 100% (COCOK)" : "TERDAPAT SELISIH"}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed">
                  {summary.reconciliation.isReconciled ? (
                    <>
                      Nilai fisik gudang di Buku Pembantu Persediaan (
                      <strong>{formatRupiah(summary.reconciliation.subsidiaryTotal)}</strong>) cocok sempurna
                      dengan saldo pembukuan di Buku Besar Neraca (
                      <strong>{formatRupiah(summary.reconciliation.ledgerBalance)}</strong>).
                    </>
                  ) : (
                    <>
                      Terdapat selisih sebesar{" "}
                      <strong>{formatRupiah(Math.abs(summary.reconciliation.difference))}</strong> antara fisik gudang
                      (<strong>{formatRupiah(summary.reconciliation.subsidiaryTotal)}</strong>) dan saldo Buku Besar (
                      <strong>{formatRupiah(summary.reconciliation.ledgerBalance)}</strong>). Lakukan Stock Opname
                      atau catat Jurnal Penyesuaian jika ada barang rusak/hilang.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-medium">Selisih Buku Besar:</div>
                <div
                  className={`text-xs font-mono font-bold ${
                    summary.reconciliation.isReconciled ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {formatRupiah(summary.reconciliation.difference)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={loadData}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Muat Ulang Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
        </button>
      </div>

      {/* DOCUMENT PRINT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8" id="printable-inventory-report">
        {/* KOP RESMI DOKUMEN CETAK */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {settings.bumdes_logo ? (
                <img
                  src={settings.bumdes_logo}
                  alt="Logo BUMDes"
                  className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center">
                  {bumdesName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-black text-xl text-slate-900 uppercase tracking-tight">
                  {bumdesName}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Desa {villageName}, Kecamatan {subdistrictName}, Kabupaten {regencyName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {settings.bumdes_address || `Kantor BUMDes Desa ${villageName}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider">
                Dokumen Audit Inspektorat
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                TA: {new Date().getFullYear()}
              </p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              BUKU PEMBANTU PERSEDIAAN & REKAPITULASI STOK BARANG DAGANG
            </h2>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300">
              Standar Akuntansi Kepmendesa No. 136/2022 & SAK EMKM (Akun 1.1.04)
            </div>
            <p className="text-xs text-slate-500 mt-1 italic">
              Posisi Saldo Fisik & Nilai Buku Persediaan per {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* TABEL DATA PERSEDIAAN */}
        <div className="sm:hidden px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10.5px] text-slate-500 font-medium flex items-center justify-between mb-2">
          <span>Geser tabel untuk melihat rincian barang</span>
          <span className="text-emerald-600 font-bold">➔</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-300 w-28">Kode / SKU</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Nama Barang Dagang</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-32">Kategori</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-right w-24">Stok Fisik</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-20 text-center">Satuan</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-right w-32">Harga Rata-rata</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-right w-36">Total Nilai (Rp)</th>
                <th className="py-2.5 px-3 text-center w-28">Status</th>
                <th className="py-2.5 px-3 text-center w-36 print:hidden">Aksi & Mutasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Memuat data persediaan barang...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada data barang persediaan. Klik tombol "Tambah Barang" untuk memulai pencatatan stok fisik.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 border-r border-slate-300 font-mono font-medium text-slate-900">{item.code}</td>
                    <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-slate-500">{item.category}</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right font-bold text-slate-900">{item.currentQty.toLocaleString("id-ID")}</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-center text-slate-600">{item.unit}</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right font-mono text-slate-700">{formatRupiah(item.avgCostPerUnit)}</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right font-mono font-bold text-emerald-800">{formatRupiah(item.totalValue)}</td>
                    <td className="py-2 px-3 text-center">
                      {item.isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Menipis (≤ {item.minStock})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenMovement(item, "IN")}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title="Catat Barang Masuk (+)"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenMovement(item, "OUT")}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          title="Catat Barang Keluar (-)"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenHistory(item)}
                          className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#6777ef] text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Lihat Riwayat Kartu Stok"
                        >
                          Kartu Stok
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-900">
                  <td colSpan={6} className="py-2.5 px-3 border-r border-slate-300 text-right uppercase tracking-wider">
                    TOTAL NILAI PERSEDIAAN AKHIR:
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono font-black text-emerald-800 text-sm">
                    {formatRupiah(summary.totalInventoryValue)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* KOLOM TANDA TANGAN AUDIT */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-slate-500 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-800 uppercase">DIREKTUR BUMDES</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{directorName}</p>
            <p className="text-[11px] text-slate-500">NIP. {directorNip}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">
              {villageName}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="font-bold text-slate-800 uppercase">BENDAHARA / PENGELOLA BARANG</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{treasurerName}</p>
            <p className="text-[11px] text-slate-500">NIP. {treasurerNip}</p>
          </div>
        </div>
      </div>

      {/* ================= MODAL TAMBAH BARANG ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Tambah Barang Persediaan Baru</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kode / SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BRG-001"
                    value={itemForm.code}
                    onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Satuan Kemasan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Pcs / Sak / Kg / Botol"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Barang Dagang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pupuk NPK Phonska Plus 50kg"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kategori Usaha</label>
                  <input
                    type="text"
                    placeholder="Saprotan / Sembako / ATK"
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Peringatan Min. Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.minStock}
                    onChange={(e) => setItemForm({ ...itemForm, minStock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Stok Awal Fisik</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.initialQty}
                    onChange={(e) => setItemForm({ ...itemForm, initialQty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Harga Beli Awal / Satuan</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rp"
                    value={itemForm.initialCost}
                    onChange={(e) => setItemForm({ ...itemForm, initialCost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Lokasi rak / suplier utama (opsional)"
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL MUTASI STOK ================= */}
      {showMovementModal && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Catat Mutasi Stok</h3>
                <p className="text-xs text-slate-500 font-medium">{activeItem.code} - {activeItem.name}</p>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Jenis Mutasi *</label>
                  <select
                    value={movementForm.type}
                    onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="IN">Barang Masuk (Beli / Retur)</option>
                    <option value="OUT">Barang Keluar (Jual / Rusak)</option>
                    <option value="ADJUST">Penyesuaian (Stock Opname)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={movementForm.date}
                    onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Jumlah ({activeItem.unit}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    value={movementForm.qty}
                    onChange={(e) => setMovementForm({ ...movementForm, qty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Harga Beli / Unit (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rp"
                    value={movementForm.costPerUnit}
                    onChange={(e) => setMovementForm({ ...movementForm, costPerUnit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nomor Bukti Terkait</label>
                <input
                  type="text"
                  placeholder="Contoh: BKK-2026-004 atau No Nota"
                  value={movementForm.referenceProof}
                  onChange={(e) => setMovementForm({ ...movementForm, referenceProof: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Keterangan Mutasi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian stok baru dari distributor CV Tani Mulya"
                  value={movementForm.description}
                  onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KARTU STOK (HISTORY) ================= */}
      {showHistoryModal && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Kartu Stok Barang</h3>
                  <p className="text-xs text-slate-500 font-mono font-semibold">{activeItem.code} - {activeItem.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => safePrintElement("printable-stock-card", `Kartu Stok - ${activeItem.code} ${activeItem.name}`)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Kartu
                </button>
                <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 p-4" id="printable-stock-card">
              {/* KOP RESMI DOKUMEN CETAK KARTU STOK */}
              <div className="border-b-2 border-slate-800 pb-3 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {settings.bumdes_logo ? (
                      <img
                        src={settings.bumdes_logo}
                        alt="Logo BUMDes"
                        className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-0.5"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center">
                        {bumdesName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h1 className="font-black text-base text-slate-900 uppercase tracking-tight">
                        {bumdesName}
                      </h1>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Desa {villageName}, Kecamatan {subdistrictName}, Kabupaten {regencyName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider">
                      Kartu Inventaris Fisik
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      TA: {new Date().getFullYear()}
                    </p>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    KARTU STOK PERSEDIAAN BARANG DAGANG (STOCK CARD)
                  </h2>
                  <div className="inline-block mt-0.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300">
                    {activeItem.code} &mdash; {activeItem.name}
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-300 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><span className="text-slate-500 block text-[10px] uppercase">Satuan:</span> <strong className="text-slate-800">{activeItem.unit}</strong></div>
                <div><span className="text-slate-500 block text-[10px] uppercase">Kategori:</span> <strong className="text-slate-800">{activeItem.category}</strong></div>
                <div><span className="text-slate-500 block text-[10px] uppercase">Sisa Stok Akhir:</span> <strong className="text-emerald-700 text-sm font-bold">{activeItem.currentQty} {activeItem.unit}</strong></div>
                <div><span className="text-slate-500 block text-[10px] uppercase">Harga Pokok Rata-rata:</span> <strong className="text-slate-800 font-mono">{formatRupiah(activeItem.avgCostPerUnit)}</strong></div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="py-2 px-3 border-r border-slate-300 w-24">Tanggal</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-28">No. Bukti</th>
                    <th className="py-2 px-3 border-r border-slate-300">Keterangan Mutasi</th>
                    <th className="py-2 px-3 border-r border-slate-300 text-right text-emerald-800 w-24">Masuk (+)</th>
                    <th className="py-2 px-3 border-r border-slate-300 text-right text-rose-800 w-24">Keluar (-)</th>
                    <th className="py-2 px-3 text-right w-28">Total Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Memuat riwayat mutasi...
                      </td>
                    </tr>
                  ) : !activeItemHistory?.movements || activeItemHistory.movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada mutasi tercatat untuk barang ini.
                      </td>
                    </tr>
                  ) : (
                    activeItemHistory.movements.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 border-r border-slate-300 font-mono text-slate-700">
                          {new Date(m.date).toLocaleDateString("id-ID")}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold text-slate-800">
                          {m.referenceProof || "-"}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 font-medium text-slate-800">
                          {m.description}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-bold text-emerald-700">
                          {m.type === "IN" ? `+${m.qty}` : "-"}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-right font-bold text-rose-700">
                          {m.type === "OUT" ? `-${m.qty}` : "-"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(m.totalCost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* KOLOM TANDA TANGAN AUDIT */}
              <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-slate-500 mb-1">Mengetahui,</p>
                  <p className="font-bold text-slate-800 uppercase">DIREKTUR BUMDES</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-slate-900 underline uppercase">{directorName}</p>
                  <p className="text-[10px] text-slate-500">NIP. {directorNip}</p>
                </div>

                <div>
                  <p className="text-slate-500 mb-1">
                    {villageName}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="font-bold text-slate-800 uppercase">BENDAHARA / PENGELOLA BARANG</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-slate-900 underline uppercase">{treasurerName}</p>
                  <p className="text-[10px] text-slate-500">NIP. {treasurerNip}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
