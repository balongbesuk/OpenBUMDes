"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Trash2, AlertCircle, CheckCircle, ListFilter, BookPlus, Sparkles } from "lucide-react"

interface LedgerAccount {
  code: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
  normal?: string | null
}

const ACCOUNT_GROUPS = [
  { prefix: "1.1.01", label: "1.1.01 Kas dan Setara Kas (Kas Tunai & Rekening Bank)", type: "ASSET", normal: "Debit" },
  { prefix: "1.1.03", label: "1.1.03 Piutang Usaha & Pinjaman", type: "ASSET", normal: "Debit" },
  { prefix: "1.1.05", label: "1.1.05 Persediaan Barang Dagangan & Unit Usaha", type: "ASSET", normal: "Debit" },
  { prefix: "1.1.06", label: "1.1.06 Perlengkapan / ATK Kantor", type: "ASSET", normal: "Debit" },
  { prefix: "1.3.01", label: "1.3.01 Aset Tetap (Peralatan, Mesin, Gedung, Kendaraan)", type: "ASSET", normal: "Debit" },
  { prefix: "2.1.01", label: "2.1.01 Utang Usaha & Tabungan/Simpanan", type: "LIABILITY", normal: "Kredit" },
  { prefix: "2.1.04", label: "2.1.04 Utang Pajak", type: "LIABILITY", normal: "Kredit" },
  { prefix: "3.1.01", label: "3.1.01 Penyertaan Modal Desa (APBDes)", type: "EQUITY", normal: "Kredit" },
  { prefix: "3.1.02", label: "3.1.02 Penyertaan Modal Masyarakat", type: "EQUITY", normal: "Kredit" },
  { prefix: "4.1.04", label: "4.1.04 Pendapatan Sewa (Gedung, Kios, PKL, Lahan)", type: "REVENUE", normal: "Kredit" },
  { prefix: "4.1.05", label: "4.1.05 Pendapatan Jasa Pelayanan / Komisi Loket / Unit", type: "REVENUE", normal: "Kredit" },
  { prefix: "4.2.01", label: "4.2.01 Pendapatan Penjualan / Bunga Bank", type: "REVENUE", normal: "Kredit" },
  { prefix: "5.1.01", label: "5.1.01 Beban Gaji & Honorarium Pengurus/Staf", type: "EXPENSE", normal: "Debit" },
  { prefix: "5.1.02", label: "5.1.02 Beban Operasional Kantor (Listrik, Air, Wifi)", type: "EXPENSE", normal: "Debit" },
  { prefix: "5.1.03", label: "5.1.03 Beban Pemeliharaan & Operasional Fasilitas", type: "EXPENSE", normal: "Debit" },
  { prefix: "5.2.01", label: "5.2.01 Beban Administrasi Bank", type: "EXPENSE", normal: "Debit" }
]

export default function CoaTab({ onRefreshReport }: { onRefreshReport?: () => void }) {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("ALL")

  // Modal Form State
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(ACCOUNT_GROUPS[0].prefix)
  const [accountCode, setAccountCode] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountType, setAccountType] = useState("ASSET")
  const [accountNormal, setAccountNormal] = useState("Debit")

  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/keuangan/coa")
      const result = await res.json()
      if (result.success) {
        setAccounts(result.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  // Auto-suggest next account code when group changes
  const handleGroupSelect = (groupPrefix: string) => {
    setSelectedGroup(groupPrefix)
    const grp = ACCOUNT_GROUPS.find((g) => g.prefix === groupPrefix)
    if (grp) {
      setAccountType(grp.type)
      setAccountNormal(grp.normal)

      // Find highest existing suffix under this prefix
      const matching = accounts
        .filter((a) => a.code.startsWith(groupPrefix))
        .map((a) => {
          const parts = a.code.split(".")
          return parseInt(parts[parts.length - 1], 10)
        })
        .filter((num) => !isNaN(num) && num < 90) // avoid 98, 99 reserved codes

      const nextNum = matching.length > 0 ? Math.max(...matching) + 1 : 1
      const suggested = `${groupPrefix}.${String(nextNum).padStart(2, "0")}`
      setAccountCode(suggested)
    }
  }

  const openModal = () => {
    setFormError(null)
    setFormSuccess(null)
    setAccountName("")
    handleGroupSelect(ACCOUNT_GROUPS[0].prefix)
    setShowAddModal(true)
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const res = await fetch("/api/keuangan/coa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: accountCode.trim(),
          name: accountName.trim(),
          type: accountType,
          normal: accountNormal
        })
      })

      const result = await res.json()
      if (result.success) {
        setFormSuccess(`Akun "${accountName}" (${accountCode}) berhasil ditambahkan ke COA & Template Transaksi!`)
        fetchAccounts()
        if (onRefreshReport) onRefreshReport()
        setTimeout(() => {
          setShowAddModal(false)
          setFormSuccess(null)
        }, 1200)
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAccount = async (code: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus akun [${code}] ${name}?`)) return
    try {
      const res = await fetch(`/api/keuangan/coa?code=${encodeURIComponent(code)}`, {
        method: "DELETE"
      })
      const result = await res.json()
      if (result.success) {
        fetchAccounts()
        if (onRefreshReport) onRefreshReport()
      } else {
        alert(result.error)
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredAccounts = accounts.filter((a) => {
    if (filterType !== "ALL" && a.type !== filterType) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    }
    return true
  })

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ASSET":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">ASET</span>
      case "LIABILITY":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">KEWAJIBAN</span>
      case "EQUITY":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">EKUITAS</span>
      case "REVENUE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PENDAPATAN</span>
      case "EXPENSE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">BEBAN / BIAYA</span>
      default:
        return <span>{type}</span>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookPlus className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                Bagan Akun Standar (COA) Kepmendes 136/2022
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Daftar kode akun dinamis. Anda bebas menambahkan rekening bank baru (e.g. Bank Jombang) atau unit usaha baru (e.g. Sewa PKL).
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tambah Akun Baru (COA)
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-100 p-3 rounded-2xl no-print text-xs shadow-sm">
        <div className="flex items-center gap-1.5 font-bold text-slate-500">
          <Search className="w-3.5 h-3.5" />
          <span>Cari Akun:</span>
        </div>

        <input
          type="text"
          placeholder="Ketik kode atau nama akun..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 w-64"
        />

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Kelompok:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer focus:border-indigo-500"
          >
            <option value="ALL">Semua Kelompok</option>
            <option value="ASSET">1 - Aset</option>
            <option value="LIABILITY">2 - Kewajiban</option>
            <option value="EQUITY">3 - Ekuitas</option>
            <option value="REVENUE">4 - Pendapatan</option>
            <option value="EXPENSE">5-7 - Beban / Pengeluaran</option>
          </select>
        </div>

        <div className="sm:ml-auto text-slate-400 font-semibold">
          Total Akun: <strong className="text-slate-800">{filteredAccounts.length}</strong>
        </div>
      </div>

      {/* Table COA */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5 w-36">Kode Akun</th>
                <th className="px-6 py-3.5">Nama Akun</th>
                <th className="px-4 py-3.5">Kelompok</th>
                <th className="px-4 py-3.5">Saldo Normal</th>
                <th className="px-6 py-3.5 text-center no-print w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Memuat data Bagan Akun (COA)...
                  </td>
                </tr>
              ) : filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono font-bold text-slate-800">{acc.code}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{acc.name}</td>
                    <td className="px-4 py-3">{getTypeBadge(acc.type)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{acc.normal || (acc.type === "ASSET" || acc.type === "EXPENSE" ? "Debit" : "Kredit")}</td>
                    <td className="px-6 py-3 text-center no-print">
                      <button
                        onClick={() => handleDeleteAccount(acc.code, acc.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Akun Kustom"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                    Tidak ada akun yang sesuai pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Akun COA Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
              <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tambah Akun Dinamis (COA)</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Tambahkan bank daerah baru atau unit kegiatan baru sesuai kebutuhan.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4">
              {/* Pilih Induk / Kelompok */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  1. Pilih Kelompok / Pos Akun
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => handleGroupSelect(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {ACCOUNT_GROUPS.map((g) => (
                    <option key={g.prefix} value={g.prefix}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kode Akun */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    2. Kode Akun (Kepmendes 136)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1.1.01.07"
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Saldo Normal
                  </label>
                  <select
                    value={accountNormal}
                    onChange={(e) => setAccountNormal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="Debit">Debit</option>
                    <option value="Kredit">Kredit</option>
                  </select>
                </div>
              </div>

              {/* Nama Akun */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  3. Nama Akun / Kegiatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas di Bank Jombang ATAU Pendapatan Sewa Lapak PKL"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-[11px] text-indigo-800">
                💡 <strong>Otomatis Terintegrasi:</strong> Akun ini akan langsung otomatis muncul di form BKM/BKK operator dan terjumlah ke Laporan Laba Rugi / Neraca sesuai nomor posnya!
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {formLoading ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
