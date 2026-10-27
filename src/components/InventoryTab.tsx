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
import { formatRupiah, safePrintElement } from "@/lib/utils"
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
    accountCode: "1.1.04.01",
    notes: ""
  })

  // Form State Mutasi
  const [movementForm, setMovementForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "IN",
    qty: "1",
    costPerUnit: "",
    referenceProof: "",
    description: ""
  })

  const bumdesName = settings.bumdes_name || "BUMDesa Mandiri Sejahtera"
  const villageName = settings.village_name || "Balongbesuk"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"

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
      date: new Date().toISOString().split("T")[0],
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
            onClick={() => safePrintElement("printable-inventory-report")}
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

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
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
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto" id="printable-inventory-report">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Kode / SKU</th>
                <th className="py-3 px-4">Nama Barang Dagang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Stok Fisik</th>
                <th className="py-3 px-4">Satuan</th>
                <th className="py-3 px-4 text-right">Harga Pokok Rata-rata</th>
                <th className="py-3 px-4 text-right">Total Nilai Persediaan</th>
                <th className="py-3 px-4 text-center">Status Stok</th>
                <th className="py-3 px-4 text-center print:hidden">Aksi & Kartu Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
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
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{item.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4 text-slate-500">{item.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{item.currentQty.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatRupiah(item.avgCostPerUnit)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatRupiah(item.totalValue)}</td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-center print:hidden">
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
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider">Total Nilai Persediaan Akhir:</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm">
                    {formatRupiah(summary.totalInventoryValue)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Kolom TTD untuk Cetak LPJ */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 px-6 text-center text-xs">
            <div>
              <p className="text-slate-500">Mengetahui,</p>
              <p className="font-bold text-slate-800">Direktur / Kepala {bumdesName}</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">{directorName}</p>
            </div>
            <div>
              <p className="text-slate-500">{villageName}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="font-bold text-slate-800">Bendahara / Pengelola Gudang</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">{treasurerName}</p>
            </div>
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
                  onClick={() => safePrintElement("printable-stock-card")}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Kartu
                </button>
                <button onClick={() => setShowHistoryModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-4" id="printable-stock-card">
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><span className="text-slate-400 block">Satuan:</span> <strong className="text-slate-800">{activeItem.unit}</strong></div>
                <div><span className="text-slate-400 block">Kategori:</span> <strong className="text-slate-800">{activeItem.category}</strong></div>
                <div><span className="text-slate-400 block">Sisa Stok Akhir:</span> <strong className="text-emerald-700 text-sm font-bold">{activeItem.currentQty} {activeItem.unit}</strong></div>
                <div><span className="text-slate-400 block">Harga Rata-rata:</span> <strong className="text-slate-800 font-mono">{formatRupiah(activeItem.avgCostPerUnit)}</strong></div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">No Bukti</th>
                    <th className="py-2.5 px-3">Keterangan Mutasi</th>
                    <th className="py-2.5 px-3 text-right text-emerald-700">Masuk (+)</th>
                    <th className="py-2.5 px-3 text-right text-rose-700">Keluar (-)</th>
                    <th className="py-2.5 px-3 text-right">Nilai Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
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
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {new Date(m.date).toLocaleDateString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                          {m.referenceProof || "-"}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {m.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                          {m.type === "IN" ? `+${m.qty}` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                          {m.type === "OUT" ? `-${m.qty}` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatRupiah(m.totalCost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
