"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X, Loader2, Search, Sparkles, HelpCircle } from "lucide-react"
import { showAppAlert } from "@/components/ui/AppDialog"
import { getLocalDateString } from "@/lib/utils"

interface ManualTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  coaList: Array<{ code: string; name: string }>
}

export function ManualTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  coaList
}: ManualTransactionModalProps) {
  const [form, setForm] = useState({
    date: getLocalDateString(),
    proofType: "BKK", // Default ke BKK jika mayoritas input pengeluaran
    description: "",
    payeeOrPayer: "",
    cashAccount: "1.1.01.01",
    contraAccount: "6.1.03.01",
    amount: "",
    cashFlowGroup: "OPERASI"
  })
  const [coaSearch, setCoaSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<"ALL" | "EXPENSE" | "REVENUE" | "ASSET">("EXPENSE")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAssetAccount = form.proofType === "BKK" && form.contraAccount.startsWith("1.3.") && !form.contraAccount.startsWith("1.3.07")
  const [autoRegisterAsset, setAutoRegisterAsset] = useState(true)
  const [assetLocation, setAssetLocation] = useState("Kantor BUMDes")
  const [assetLifeYears, setAssetLifeYears] = useState("4")

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        date: getLocalDateString(),
        proofType: "BKK",
        description: "",
        payeeOrPayer: "",
        cashAccount: "1.1.01.01",
        contraAccount: "6.1.03.01",
        amount: "",
        cashFlowGroup: "OPERASI"
      })
      setCoaSearch("")
      setFilterCategory("EXPENSE")
      setAutoRegisterAsset(true)
      setAssetLocation("Kantor BUMDes")
      setAssetLifeYears("4")
      setError(null)
    }
  }, [isOpen])

  // Handle proof type change: auto adjust filter & default account
  const handleProofTypeChange = (type: string) => {
    if (type === "BKM") {
      setForm((prev) => ({
        ...prev,
        proofType: type,
        contraAccount: "4.1.04.02", // Default sewa toko/lapak
        cashFlowGroup: "OPERASI"
      }))
      setFilterCategory("REVENUE")
    } else {
      setForm((prev) => ({
        ...prev,
        proofType: type,
        contraAccount: "6.1.03.01", // Default pemeliharaan & perbaikan
        cashFlowGroup: "OPERASI"
      }))
      setFilterCategory("EXPENSE")
    }
  }

  // Filter COA list based on search and category
  const filteredCoa = useMemo(() => {
    const q = coaSearch.toLowerCase().trim()
    return coaList.filter((c) => {
      // Category filter
      if (filterCategory === "EXPENSE" && !c.code.startsWith("6.") && !c.code.startsWith("5.")) return false
      if (filterCategory === "REVENUE" && !c.code.startsWith("4.")) return false
      if (filterCategory === "ASSET" && !c.code.startsWith("1.3.") && !c.code.startsWith("1.2.")) return false

      // Search query
      if (!q) return true
      return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    })
  }, [coaList, coaSearch, filterCategory])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) {
      showAppAlert("Nominal transaksi harus lebih dari 0", {
        title: "Nominal Tidak Valid",
        type: "warning"
      })
      return
    }

    const lines =
      form.proofType === "BKM"
        ? [
            { accountCode: form.cashAccount, type: "DEBIT", amount: amt, cashFlowGroup: form.cashFlowGroup },
            { accountCode: form.contraAccount, type: "CREDIT", amount: amt }
          ]
        : [
            { accountCode: form.contraAccount, type: "DEBIT", amount: amt },
            { accountCode: form.cashAccount, type: "CREDIT", amount: amt, cashFlowGroup: form.cashFlowGroup }
          ]

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/cash-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofType: form.proofType,
          date: form.date,
          description: form.description,
          payeeOrPayer: form.payeeOrPayer,
          lines,
          autoRegisterAsset: isAssetAccount ? autoRegisterAsset : false,
          location: assetLocation,
          usefulLifeYears: assetLifeYears
        })
      })
      const json = await res.json()
      if (json.success) {
        onSuccess()
        onClose()
      } else {
        setError(json.error || "Gagal menyimpan transaksi")
        showAppAlert("Gagal menyimpan: " + (json.error || "Terjadi kesalahan"), { type: "error" })
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi")
      showAppAlert("Error: " + err.message, { type: "error" })
    } finally {
      setLoading(false)
    }
  }

  // Quick preset accounts
  const quickBkkAccounts = [
    { code: "6.1.03.01", label: "🛠️ Pemeliharaan/Servis", flow: "OPERASI" },
    { code: "6.1.04.01", label: "⚡ Token/Listrik", flow: "OPERASI" },
    { code: "6.1.02.04", label: "🖨️ Cetak & Banner", flow: "OPERASI" },
    { code: "6.1.02.03", label: "☕ Konsumsi Rapat", flow: "OPERASI" },
    { code: "6.1.99.03", label: "🚗 Perjalanan Dinas", flow: "OPERASI" },
    { code: "1.3.03.01", label: "💻 Peralatan/Mesin", flow: "INVESTASI" },
    { code: "1.3.04.01", label: "🪑 Meubelair/Meja", flow: "INVESTASI" }
  ]

  const quickBkmAccounts = [
    { code: "4.1.04.02", label: "🏪 Sewa Kios / Rest Area", flow: "OPERASI" },
    { code: "4.1.04.03", label: "🏛️ Sewa Gedung GSG", flow: "OPERASI" },
    { code: "4.1.07.01", label: "🅿️ Pendapatan Parkir", flow: "OPERASI" }
  ]

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Catat Transaksi Manual</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Input penerimaan atau pengeluaran kas BUMDes dengan bantuan akun otomatis</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Jenis Bukti & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Bukti Kas</label>
              <select
                value={form.proofType}
                onChange={(e) => handleProofTypeChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#6777ef]"
              >
                <option value="BKK">BKK (Kas Keluar / Belanja / Beban)</option>
                <option value="BKM">BKM (Kas Masuk / Penerimaan / Sewa)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef]"
              />
            </div>
          </div>

          {/* Uraian */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Uraian Transaksi</label>
            <input
              type="text"
              required
              placeholder={form.proofType === "BKK" ? "Contoh: Belanja Speaker dan Kabel Listrik" : "Contoh: Pemasukan sewa lapak / gedung"}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef]"
            />
          </div>

          {/* Penyetor / Penerima */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {form.proofType === "BKK" ? "Penerima Uang (Toko / Penyedia / Pihak)" : "Penyetor Uang (Penyewa / Pihak)"}
            </label>
            <input
              type="text"
              required
              placeholder={form.proofType === "BKK" ? "Contoh: Toko Elektronik / Teknisi" : "Contoh: Bpk Bambang / Penyewa Kios"}
              value={form.payeeOrPayer}
              onChange={(e) => setForm((prev) => ({ ...prev, payeeOrPayer: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef]"
            />
          </div>

          {/* Akun Kas & Akun Lawan */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Kas / Bank</label>
                <select
                  value={form.cashAccount}
                  onChange={(e) => setForm((prev) => ({ ...prev, cashAccount: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#6777ef]"
                >
                  <option value="1.1.01.01">1.1.01.01 Kas Tunai (di Bendahara)</option>
                  <option value="1.1.01.06">1.1.01.06 Kas di Bank Jatim</option>
                  <option value="1.1.01.04">1.1.01.04 Kas di Bank BRI</option>
                  <option value="1.1.01.02">1.1.01.02 Kas di Bank BNI</option>
                  <option value="1.1.01.03">1.1.01.03 Kas di Bank Mandiri</option>
                  <option value="1.1.01.05">1.1.01.05 Kas di Bank BCA</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Akun Lawan (COA)</label>
                  <span className="text-[10px] text-slate-400">
                    {filteredCoa.length} akun cocok
                  </span>
                </div>
                <select
                  value={form.contraAccount}
                  onChange={(e) => setForm((prev) => ({ ...prev, contraAccount: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#6777ef]"
                >
                  {filteredCoa.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Smart Filter & Quick Search COA */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="🔍 Cari cepat akun COA (mis: perbaikan, listrik, speaker, sewa)..."
                    value={coaSearch}
                    onChange={(e) => setCoaSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#6777ef]"
                  />
                </div>
                {/* Filter kategori tabs */}
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setFilterCategory("EXPENSE")}
                    className={`px-2 py-1 rounded-md font-medium transition ${
                      filterCategory === "EXPENSE" ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Beban (6.x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("REVENUE")}
                    className={`px-2 py-1 rounded-md font-medium transition ${
                      filterCategory === "REVENUE" ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Pendapatan (4.x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory("ALL")}
                    className={`px-2 py-1 rounded-md font-medium transition ${
                      filterCategory === "ALL" ? "bg-slate-200 text-slate-800" : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Semua
                  </button>
                </div>
              </div>

              {/* Quick Pick Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Pilihan Populer:
                </span>
                {(form.proofType === "BKK" ? quickBkkAccounts : quickBkmAccounts).map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        contraAccount: item.code,
                        cashFlowGroup: item.flow
                      }))
                    }
                    className={`text-[10.5px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                      form.contraAccount === item.code
                        ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-indigo-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nominal & Grup Arus Kas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="Contoh: 110000"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:border-[#6777ef]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Grup Arus Kas</label>
                <span className="text-[10px] text-slate-400" title="Standar Laporan Arus Kas BUMDes">
                  Format LAK
                </span>
              </div>
              <select
                value={form.cashFlowGroup}
                onChange={(e) => setForm((prev) => ({ ...prev, cashFlowGroup: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#6777ef]"
              >
                <option value="OPERASI">Operasional Usaha (Rutin / Belanja / Servis)</option>
                <option value="INVESTASI">Investasi (Pengadaan Aset Tetap / Meubelair)</option>
                <option value="PENDANAAN">Pendanaan (Penyertaan Modal / Setor PADes)</option>
              </select>
            </div>
          </div>

          {/* Auto Register Fixed Asset Card (Jika Memilih Akun Aset Tetap 1.3) */}
          {isAssetAccount && (
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2.5 transition-all animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRegisterAsset}
                    onChange={(e) => setAutoRegisterAsset(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    📦 Daftarkan Otomatis ke Buku Register Aset & Kartu Penyusutan
                  </span>
                </label>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                  AUTO-LINK
                </span>
              </div>

              {autoRegisterAsset && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Masa Manfaat (Umur Ekonomis)
                    </label>
                    <select
                      value={assetLifeYears}
                      onChange={(e) => setAssetLifeYears(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="4">4 Tahun (Peralatan, Elektronik, Meubelair)</option>
                      <option value="8">8 Tahun (Mesin Pabrik / Alat Berat)</option>
                      <option value="16">16 Tahun (Peralatan Tahan Lama)</option>
                      <option value="20">20 Tahun (Bangunan / Gedung)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Lokasi / Unit Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={assetLocation}
                      onChange={(e) => setAssetLocation(e.target.value)}
                      placeholder="Contoh: Kantor BUMDes / Rest Area"
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips Info Box */}
          <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Panduan Praktis:</strong> Untuk belanja barang kecil operasional/servis (seperti speaker & kabel Rp 110rb), gunakan akun <strong>6.1.03.01 Pemeliharaan dan Perbaikan</strong> dengan Arus Kas <strong>Operasional Usaha</strong>.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#6777ef] text-white font-bold hover:bg-[#5868e4] shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
