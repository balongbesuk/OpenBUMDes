"use client"

import React, { useState, useEffect } from "react"
import {
  Building2,
  Plus,
  Printer,
  Search,
  RefreshCw,
  Trash2,
  X,
  FileSpreadsheet,
  Calendar,
  Layers,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { formatRupiah, safePrintElement } from "@/lib/utils"
import { showAppAlert, showAppConfirm, showAppToast } from "@/components/ui/AppDialog"

interface FixedAssetsTabProps {
  settings?: Record<string, string>
}

export default function FixedAssetsTab({ settings = {} }: FixedAssetsTabProps) {
  const [assets, setAssets] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    totalAssetsCount: 0,
    totalAcquisitionCost: 0,
    totalAccumulatedDepreciation: 0,
    totalBookValue: 0,
    totalCurrentYearDepreciation: 0
  })
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)

  // Form State Tambah Aset
  const [assetForm, setAssetForm] = useState({
    code: "",
    name: "",
    category: "Peralatan & Mesin",
    acquisitionDate: new Date().toISOString().split("T")[0],
    acquisitionCost: "",
    usefulLifeYears: "4",
    salvageValue: "0",
    assetAccountCode: "1.2.01.01",
    deprAccountCode: "1.2.02.01",
    expAccountCode: "6.1.05.01",
    location: "Kantor BUMDes",
    condition: "BAIK",
    notes: ""
  })

  const bumdesName = settings.bumdes_name || "BUMDesa Mandiri Sejahtera"
  const villageName = settings.village_name || "Balongbesuk"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"

  const loadData = async (targetYear = selectedYear) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/assets?year=${targetYear}`)
      const json = await res.json()
      if (json.success) {
        setAssets(json.data || [])
        setSummary(json.summary || {
          totalAssetsCount: 0,
          totalAcquisitionCost: 0,
          totalAccumulatedDepreciation: 0,
          totalBookValue: 0,
          totalCurrentYearDepreciation: 0
        })
      } else {
        showAppAlert(json.error || "Gagal memuat register aset tetap.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Kesalahan koneksi: " + e.message, { type: "error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedYear)
  }, [selectedYear])

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ASSET",
          ...assetForm
        })
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Aset tetap baru berhasil didaftarkan ke inventaris!", "success")
        setShowAddModal(false)
        setAssetForm({
          code: "",
          name: "",
          category: "Peralatan & Mesin",
          acquisitionDate: new Date().toISOString().split("T")[0],
          acquisitionCost: "",
          usefulLifeYears: "4",
          salvageValue: "0",
          assetAccountCode: "1.2.01.01",
          deprAccountCode: "1.2.02.01",
          expAccountCode: "6.1.05.01",
          location: "Kantor BUMDes",
          condition: "BAIK",
          notes: ""
        })
        loadData(selectedYear)
      } else {
        showAppAlert(json.error || "Gagal menyimpan aset tetap.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Error: " + e.message, { type: "error" })
    }
  }

  const handleDeleteAsset = async (asset: any) => {
    const confirmed = await showAppConfirm(
      `Hapus aset tetap "${asset.code} - ${asset.name}" dari register inventaris?`,
      {
        title: "Konfirmasi Hapus Aset",
        type: "danger",
        confirmText: "Ya, Hapus Aset"
      }
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/assets?id=${encodeURIComponent(asset.id)}`, {
        method: "DELETE"
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Aset tetap berhasil dihapus.", "success")
        loadData(selectedYear)
      } else {
        showAppAlert(json.error || "Gagal menghapus aset.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Error: " + e.message, { type: "error" })
    }
  }

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchQuery =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.location && asset.location.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchCat = selectedCategory === "all" || asset.category === selectedCategory
    return matchQuery && matchCat
  })

  const categories = Array.from(new Set(assets.map((a) => a.category || "Peralatan & Mesin")))

  return (
    <div className="space-y-6">
      {/* Top Banner / Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-[#6777ef] border border-indigo-100">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Daftar Register & Jadwal Penyusutan Aset Tetap</h2>
              <p className="text-xs text-slate-500">
                Pencatatan inventaris barang modal, tarif amortisasi garis lurus SAK EMKM, dan nilai buku bersih
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>Tahun Buku {y}</option>
            ))}
          </select>

          <button
            onClick={() => safePrintElement("printable-assets-report")}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Register</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#6777ef] hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aset Tetap</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Unit Aset</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{summary.totalAssetsCount} <span className="text-xs font-normal text-slate-500">Unit</span></div>
          <p className="text-[11px] text-slate-400 mt-1">Barang modal & inventaris BUMDes</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Perolehan (Beli)</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-blue-600">{formatRupiah(summary.totalAcquisitionCost)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total harga beli kotor seluruh unit</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akumulasi Penyusutan</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-rose-600">{formatRupiah(summary.totalAccumulatedDepreciation)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Hingga 31 Des {selectedYear} (COA 1.2.02)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Buku Bersih</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600">{formatRupiah(summary.totalBookValue)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Nilai aset riil tercatat di Neraca</p>
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
                placeholder="Cari kode, nama aset, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Semua Kelompok Aset</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => loadData(selectedYear)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto" id="printable-assets-report">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">No Reg / Kode</th>
                <th className="py-3 px-4">Nama Aset Tetap</th>
                <th className="py-3 px-4">Kelompok</th>
                <th className="py-3 px-4">Tgl Beli</th>
                <th className="py-3 px-4 text-right">Harga Perolehan</th>
                <th className="py-3 px-4 text-center">Masa (Th)</th>
                <th className="py-3 px-4 text-right">Beban {selectedYear}</th>
                <th className="py-3 px-4 text-right">Akum. Penyusutan</th>
                <th className="py-3 px-4 text-right">Nilai Buku Bersih</th>
                <th className="py-3 px-4 text-center">Kondisi</th>
                <th className="py-3 px-4 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6777ef]" />
                    Memuat daftar inventaris aset tetap...
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Belum ada aset tetap tercatat. Klik tombol "Tambah Aset Tetap" untuk mendaftarkan barang modal BUMDes.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{asset.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{asset.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Lokasi: {asset.location}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{asset.category}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {new Date(asset.acquisitionDate).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {formatRupiah(asset.acquisitionCost)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {asset.usefulLifeYears} th
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatRupiah(asset.currentYearExpense)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-medium">
                      ({formatRupiah(asset.accumulatedDepreciation)})
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatRupiah(asset.bookValue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        asset.condition === "BAIK"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : asset.condition === "RUSAK RINGAN"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center print:hidden">
                      <button
                        onClick={() => handleDeleteAsset(asset)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Aset Tetap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredAssets.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">Total Nilai Bersih Inventaris ({selectedYear}):</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">
                    {formatRupiah(summary.totalAcquisitionCost)}
                  </td>
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatRupiah(summary.totalCurrentYearDepreciation)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700">
                    ({formatRupiah(summary.totalAccumulatedDepreciation)})
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm">
                    {formatRupiah(summary.totalBookValue)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Kolom TTD untuk Cetak LPJ */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 px-6 text-center text-xs">
            <div>
              <p className="text-slate-500">Mengetahui & Menyetujui,</p>
              <p className="font-bold text-slate-800">Direktur / Kepala {bumdesName}</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">{directorName}</p>
            </div>
            <div>
              <p className="text-slate-500">{villageName}, 31 Desember {selectedYear}</p>
              <p className="font-bold text-slate-800">Bendahara / Pengurus Barang</p>
              <div className="h-16"></div>
              <p className="font-bold underline text-slate-900">{treasurerName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL TAMBAH ASET TETAP ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#6777ef]" />
                <h3 className="font-bold text-slate-800 text-base">Daftarkan Aset Tetap Baru</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">No. Registrasi / Kode *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AST-2026-001"
                    value={assetForm.code}
                    onChange={(e) => setAssetForm({ ...assetForm, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kelompok Aset *</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Peralatan & Mesin">Peralatan & Mesin</option>
                    <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                    <option value="Gedung & Bangunan">Gedung & Bangunan</option>
                    <option value="Inventaris Kantor / Mebel">Inventaris Kantor / Mebel</option>
                    <option value="Aset Tetap Lainnya">Aset Tetap Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Aset Tetap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mobil Pick-Up Suzuki Carry Grand Max"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tanggal Perolehan (Beli) *</label>
                  <input
                    type="date"
                    required
                    value={assetForm.acquisitionDate}
                    onChange={(e) => setAssetForm({ ...assetForm, acquisitionDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Harga Beli / Perolehan (Rp) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Rp"
                    value={assetForm.acquisitionCost}
                    onChange={(e) => setAssetForm({ ...assetForm, acquisitionCost: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Masa Manfaat (Tahun) *</label>
                  <select
                    value={assetForm.usefulLifeYears}
                    onChange={(e) => setAssetForm({ ...assetForm, usefulLifeYears: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="4">4 Tahun (Kendaraan Ringan, Komputer, ATK)</option>
                    <option value="8">8 Tahun (Mesin Pabrik / Alat Berat)</option>
                    <option value="16">16 Tahun (Peralatan Tahan Lama)</option>
                    <option value="20">20 Tahun (Bangunan / Gedung Permanen)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Estimasi Nilai Sisa/Residu (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={assetForm.salvageValue}
                    onChange={(e) => setAssetForm({ ...assetForm, salvageValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Lokasi / Unit Penanggung Jawab</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kantor Utama / Gudang Unit Usaha"
                    value={assetForm.location}
                    onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Kondisi Fisik Saat Ini</label>
                  <select
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BAIK">BAIK (Siap Pakai)</option>
                    <option value="RUSAK RINGAN">RUSAK RINGAN (Butuh Servis)</option>
                    <option value="RUSAK BERAT">RUSAK BERAT (Afkir)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Nomor Polisi / No Rangka / Catatan Pengadaan (opsional)"
                  value={assetForm.notes}
                  onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
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
                  className="px-5 py-2 rounded-xl bg-[#6777ef] hover:bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/20 cursor-pointer"
                >
                  Daftarkan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
