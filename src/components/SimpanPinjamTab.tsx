"use client"

import React, { useState, useEffect } from "react"
import {
  Wallet,
  HandCoins,
  Users,
  Plus,
  Printer,
  Search,
  RefreshCw,
  Trash2,
  X,
  FileSpreadsheet,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  UserCheck,
  CreditCard,
  Building2
} from "lucide-react"
import { formatRupiah, safePrintElement, getLocalDateString } from "@/lib/utils"
import { showAppAlert, showAppConfirm, showAppToast } from "@/components/ui/AppDialog"

interface SimpanPinjamTabProps {
  settings?: Record<string, string>
  currentUser?: { id?: string; username?: string; name?: string; role?: string } | null
}

export default function SimpanPinjamTab({ settings = {}, currentUser }: SimpanPinjamTabProps) {
  const [internalRole, setInternalRole] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          if (d?.authenticated && d?.user?.role) setInternalRole(d.user.role)
        })
        .catch(() => {})
    }
  }, [currentUser])

  const isAdmin = (currentUser?.role || internalRole) === "ADMIN"

  const [members, setMembers] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    totalMembers: 0,
    totalActiveBorrowers: 0,
    totalSimpananPokok: 0,
    totalSimpananWajib: 0,
    totalSimpananSukarela: 0,
    totalSimpanan: 0,
    totalPinjamanDisalurkan: 0,
    totalSisaPinjaman: 0
  })
  const [reconciliation, setReconciliation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<"members" | "loans" | "recap">("members")
  const [searchQuery, setSearchQuery] = useState("")
  const [memberTypeFilter, setMemberTypeFilter] = useState("ALL")
  const [loanStatusFilter, setLoanStatusFilter] = useState("ALL")

  // Modals
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [memberDetail, setMemberDetail] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Forms
  const [memberForm, setMemberForm] = useState({
    memberNo: "",
    name: "",
    nik: "",
    phone: "",
    address: "",
    groupName: "",
    memberType: "INDIVIDU",
    simpananPokok: "50000",
    simpananWajib: "0",
    simpananSukarela: "0",
    initialLoan: "0",
    bungaPersen: "1.5",
    jangkaWaktuBulan: "12",
    notes: ""
  })

  const [txForm, setTxForm] = useState({
    type: "SIMPANAN_WAJIB",
    date: getLocalDateString(),
    amount: "",
    principalAmount: "0",
    interestAmount: "0",
    description: "",
    proofNumber: "",
    autoPostJournal: true
  })

  const bumdesName = settings.bumdes_name || "BUMDesa Mandiri Sejahtera"
  const villageName = settings.village_name || "Balongbesuk"
  const subdistrictName = settings.subdistrict_name || settings.district_name || "Diwek"
  const regencyName = settings.regency_name || "Jombang"
  const directorName = settings.director_name || "DODIK SUSANTO"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"
  const bumdesLogo = settings.bumdes_logo || ""

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (memberTypeFilter !== "ALL") params.set("type", memberTypeFilter)
      if (loanStatusFilter !== "ALL") params.set("loanStatus", loanStatusFilter)

      const res = await fetch(`/api/loans?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setMembers(json.data || [])
        setSummary(json.summary || {})
        setReconciliation(json.reconciliation || null)
      } else {
        showAppToast(json.error || "Gagal memuat data simpan pinjam", "error")
      }
    } catch (err: any) {
      showAppToast("Kesalahan jaringan: " + err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchQuery, memberTypeFilter, loanStatusFilter])

  // View member detail
  const handleOpenDetail = async (member: any) => {
    setSelectedMember(member)
    setShowDetailModal(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/loans?memberId=${member.id}`)
      const json = await res.json()
      if (json.success) {
        setMemberDetail(json.data)
      }
    } catch (e: any) {
      showAppToast("Gagal memuat detail anggota: " + e.message, "error")
    } finally {
      setDetailLoading(false)
    }
  }

  // Create member submit
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberForm.name.trim() || !memberForm.memberNo.trim()) {
      showAppAlert("Nomor anggota dan nama wajib diisi.", { type: "warning" })
      return
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_MEMBER",
          ...memberForm
        })
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Anggota berhasil didaftarkan!", "success")
        setShowAddMemberModal(false)
        setMemberForm({
          memberNo: "",
          name: "",
          nik: "",
          phone: "",
          address: "",
          groupName: "",
          memberType: "INDIVIDU",
          simpananPokok: "50000",
          simpananWajib: "0",
          simpananSukarela: "0",
          initialLoan: "0",
          bungaPersen: "1.5",
          jangkaWaktuBulan: "12",
          notes: ""
        })
        loadData()
      } else {
        showAppAlert(json.error || "Gagal mendaftarkan anggota", { type: "error" })
      }
    } catch (err: any) {
      showAppAlert("Error: " + err.message, { type: "error" })
    }
  }

  // Open transaction modal
  const handleOpenTransaction = (member: any, defaultType: string = "SIMPANAN_WAJIB") => {
    setSelectedMember(member)
    setTxForm({
      type: defaultType,
      date: getLocalDateString(),
      amount: defaultType === "SIMPANAN_WAJIB" ? "20000" : "",
      principalAmount: "0",
      interestAmount: "0",
      description: "",
      proofNumber: "",
      autoPostJournal: true
    })
    setShowTransactionModal(true)
  }

  // Submit transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    const amountNum = parseFloat(txForm.amount) || 0
    if (amountNum <= 0) {
      showAppAlert("Nominal transaksi harus lebih dari 0", { type: "warning" })
      return
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_TRANSACTION",
          memberId: selectedMember.id,
          type: txForm.type,
          date: txForm.date,
          amount: amountNum,
          principalAmount: parseFloat(txForm.principalAmount) || 0,
          interestAmount: parseFloat(txForm.interestAmount) || 0,
          description: txForm.description || `Transaksi ${txForm.type} - ${selectedMember.name}`,
          proofNumber: txForm.proofNumber,
          autoPostJournal: txForm.autoPostJournal
        })
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Transaksi berhasil dicatat & saldo diperbarui!", "success")
        setShowTransactionModal(false)
        loadData()
        if (showDetailModal && selectedMember) {
          handleOpenDetail(selectedMember)
        }
      } else {
        showAppAlert(json.error || "Gagal mencatat transaksi", { type: "error" })
      }
    } catch (err: any) {
      showAppAlert("Error: " + err.message, { type: "error" })
    }
  }

  // Seed sample data from SPJ 2025 Balongbesuk
  const handleSeedSampleData = async () => {
    const confirmed = await showAppConfirm(
      "Apakah Anda ingin memuat data awal Unit Simpan Pinjam BUMDes sesuai laporan riil SPJ 2025 Balongbesuk?\n\n• 65 Anggota Warga & Kelompok Tani (GAPOKTAN)\n• Total Simpanan Pokok & Wajib: Rp 17.840.000\n• Total Piutang Pinjaman USP: Rp 89.000.000\n\nSeluruh nama nasabah dan saldo diisi secara rinci per orang sesuai dokumen SPJ asli.",
      {
        title: "Muat Data Rinci SPJ 2025 Balongbesuk",
        confirmText: "Muat Data Rinci",
        cancelText: "Batal",
        type: "info"
      }
    )
    if (!confirmed) return

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEED_SAMPLE_DATA", force: true })
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Data contoh standar Simpan Pinjam berhasil dimuat!", "success")
        loadData()
      } else {
        showAppAlert(json.error || "Gagal memuat data contoh", { type: "error" })
      }
    } catch (err: any) {
      showAppAlert("Error: " + err.message, { type: "error" })
    }
  }

  // Delete member (Admin only)
  const handleDeleteMember = async (member: any) => {
    if (!isAdmin) {
      showAppAlert("Hanya Administrator yang berwenang menghapus data anggota.", { type: "warning" })
      return
    }

    if (member.sisaPinjaman > 0) {
      showAppAlert(`Anggota ${member.name} tidak dapat dihapus karena masih memiliki sisa pinjaman aktif sebesar ${formatRupiah(member.sisaPinjaman)}.`, { type: "error" })
      return
    }

    const confirmed = await showAppConfirm(
      `Apakah Anda yakin ingin menghapus data anggota "${member.name}" (${member.memberNo})?\nSeluruh riwayat simpan pinjam anggota ini akan dihapus permanen.`,
      {
        title: "Konfirmasi Hapus Anggota",
        confirmText: "Hapus Permanen",
        cancelText: "Batal",
        type: "error"
      }
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/loans?id=${member.id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        showAppToast("Anggota berhasil dihapus", "success")
        setShowDetailModal(false)
        loadData()
      } else {
        showAppAlert(json.error || "Gagal menghapus anggota", { type: "error" })
      }
    } catch (err: any) {
      showAppAlert("Error: " + err.message, { type: "error" })
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-200">
            <HandCoins className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">Buku Pembantu Simpan Pinjam (USP)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Standar Kepmendes 136/2022
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Subsidiary Ledger unit usaha simpan pinjam, tabungan anggota, kartu pinjaman, dan integrasi rekonsiliasi buku besar otomatis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {members.length === 0 && (
            <button
              onClick={handleSeedSampleData}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              Contoh Data SPJ 2025
            </button>
          )}

          <button
            onClick={() => safePrintElement("print-simpan-pinjam-area")}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Cetak Rekap
          </button>

          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={() => {
              const nextNo = `ANG-${String(members.length + 1).padStart(3, "0")}`
              setMemberForm((prev) => ({ ...prev, memberNo: nextNo }))
              setShowAddMemberModal(true)
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Anggota
          </button>
        </div>
      </div>

      {/* RECONCILIATION AUDIT STATUS BANNER */}
      {reconciliation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simpanan vs Kewajiban 2.1.01 */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            reconciliation.isSimpananBalanced
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : "bg-amber-50/70 border-amber-200 text-amber-900"
          }`}>
            <div className="flex items-center gap-3">
              {reconciliation.isSimpananBalanced ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Audit Saldo Simpanan vs Akun 2.1.01
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  Buku Bantu: <span className="font-semibold">{formatRupiah(reconciliation.subsidiarySimpanan)}</span> | Buku Besar: <span className="font-semibold">{formatRupiah(reconciliation.glSimpanan)}</span>
                </div>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              reconciliation.isSimpananBalanced
                ? "bg-emerald-200/60 text-emerald-800"
                : "bg-amber-200/60 text-amber-900"
            }`}>
              {reconciliation.isSimpananBalanced ? "REKONSILIASI BALANCE" : `SELISIH: ${formatRupiah(Math.abs(reconciliation.diffSimpanan))}`}
            </span>
          </div>

          {/* Piutang USP vs Aset Piutang 1.1.02 */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            reconciliation.isPiutangBalanced
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : "bg-amber-50/70 border-amber-200 text-amber-900"
          }`}>
            <div className="flex items-center gap-3">
              {reconciliation.isPiutangBalanced ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Audit Piutang Pinjaman vs Akun 1.1.02
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  Buku Bantu: <span className="font-semibold">{formatRupiah(reconciliation.subsidiaryPiutang)}</span> | Buku Besar: <span className="font-semibold">{formatRupiah(reconciliation.glPiutang)}</span>
                </div>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              reconciliation.isPiutangBalanced
                ? "bg-emerald-200/60 text-emerald-800"
                : "bg-amber-200/60 text-amber-900"
            }`}>
              {reconciliation.isPiutangBalanced ? "REKONSILIASI BALANCE" : `SELISIH: ${formatRupiah(Math.abs(reconciliation.diffPiutang))}`}
            </span>
          </div>
        </div>
      )}

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Anggota */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Anggota USP</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {summary.totalMembers} <span className="text-xs font-normal text-slate-500">Nasabah</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.totalActiveBorrowers} orang peminjam aktif
          </div>
        </div>

        {/* Total Simpanan Pokok & Wajib */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Simpanan Pokok & Wajib</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {formatRupiah(summary.totalSimpananPokok + summary.totalSimpananWajib)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Pokok: {formatRupiah(summary.totalSimpananPokok)} | Wajib: {formatRupiah(summary.totalSimpananWajib)}
          </div>
        </div>

        {/* Total Saldo Simpanan (Ekuitas/Kewajiban) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Seluruh Simpanan</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600">
            {formatRupiah(summary.totalSimpanan)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Termasuk sukarela {formatRupiah(summary.totalSimpananSukarela)}
          </div>
        </div>

        {/* Total Piutang Pinjaman USP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Sisa Piutang Pinjaman</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">
            {formatRupiah(summary.totalSisaPinjaman)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dari plafon total {formatRupiah(summary.totalPinjamanDisalurkan)}
          </div>
        </div>
      </div>

      {/* SUBTABS & FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("members")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === "members"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Daftar Anggota & Simpanan ({members.length})
            </button>

            <button
              onClick={() => setActiveSubTab("loans")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === "loans"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Kartu Pinjaman & Piutang ({members.filter((m) => m.totalPinjaman > 0).length})
            </button>

            <button
              onClick={() => setActiveSubTab("recap")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === "recap"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Lembar Rekapitulasi USP
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan No. Anggota, Nama, NIK, Dusun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={memberTypeFilter}
              onChange={(e) => setMemberTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Jenis Anggota</option>
              <option value="INDIVIDU">Individu / Perorangan</option>
              <option value="KELOMPOK">Kelompok / Poktan / Dusun</option>
            </select>

            <select
              value={loanStatusFilter}
              onChange={(e) => setLoanStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Status Pinjaman</option>
              <option value="BERJALAN">Pinjaman Aktif</option>
              <option value="LUNAS">Lunas</option>
              <option value="MACET">Macet / Bermasalah</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRINTABLE AREA */}
      <div id="print-simpan-pinjam-area" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Printable Header */}
        <div className="hidden print:block p-6 text-center border-b border-slate-300">
          <h2 className="text-xl font-bold uppercase tracking-wider">{bumdesName}</h2>
          <p className="text-sm text-slate-600">
            UNIT USAHA SIMPAN PINJAM (USP) DESA {villageName.toUpperCase()} KEC. {subdistrictName.toUpperCase()} KAB. {regencyName.toUpperCase()}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            BUKU PEMBANTU SIMPAN PINJAM & REKONSILIASI KEUANGAN PER {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* VIEW 1: DAFTAR ANGGOTA & SIMPANAN */}
        {activeSubTab === "members" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-center w-12">No</th>
                  <th className="py-3.5 px-4 font-bold">No. Anggota</th>
                  <th className="py-3.5 px-4 font-bold">Nama Anggota</th>
                  <th className="py-3.5 px-4 font-bold">Kelompok / Dusun</th>
                  <th className="py-3.5 px-4 font-bold text-right">Simp. Pokok</th>
                  <th className="py-3.5 px-4 font-bold text-right">Simp. Wajib</th>
                  <th className="py-3.5 px-4 font-bold text-right">Sukarela</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Simpanan</th>
                  <th className="py-3.5 px-4 font-bold text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Memuat data anggota simpan pinjam...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Belum ada data anggota simpan pinjam. Klik tombol <strong>&quot;Tambah Anggota&quot;</strong> atau <strong>&quot;Contoh Data SPJ 2025&quot;</strong>.
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => {
                    const totalSimpanan = (m.simpananPokok || 0) + (m.simpananWajib || 0) + (m.simpananSukarela || 0)
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{m.memberNo}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOpenDetail(m)}
                            className="font-bold text-slate-800 hover:text-indigo-600 text-left transition-colors"
                          >
                            {m.name}
                          </button>
                          {m.nik && <div className="text-[10px] text-slate-400 font-mono">NIK: {m.nik}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {m.groupName || m.address || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{formatRupiah(m.simpananPokok)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{formatRupiah(m.simpananWajib)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{formatRupiah(m.simpananSukarela)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatRupiah(totalSimpanan)}</td>
                        <td className="py-3 px-4 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenTransaction(m, "SIMPANAN_WAJIB")}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Setor Simpanan Wajib / Sukarela"
                            >
                              + Simpan
                            </button>
                            <button
                              onClick={() => handleOpenTransaction(m, "PENCAIRAN_PINJAMAN")}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                              title="Pencairan Pinjaman"
                            >
                              + Pinjam
                            </button>
                            <button
                              onClick={() => handleOpenDetail(m)}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                              title="Lihat Buku Tabungan / Kartu Pinjaman"
                            >
                              Kartu
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                    Total Simpanan Seluruh Anggota:
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(summary.totalSimpananPokok)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(summary.totalSimpananWajib)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(summary.totalSimpananSukarela)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatRupiah(summary.totalSimpanan)}</td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* VIEW 2: KARTU PINJAMAN & PIUTANG */}
        {activeSubTab === "loans" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-center w-12">No</th>
                  <th className="py-3.5 px-4 font-bold">No. Anggota</th>
                  <th className="py-3.5 px-4 font-bold">Nama Debitur</th>
                  <th className="py-3.5 px-4 font-bold">Jenis / Kelompok</th>
                  <th className="py-3.5 px-4 font-bold text-right">Plafon Pinjaman</th>
                  <th className="py-3.5 px-4 font-bold text-right">Sisa Pokok (Piutang)</th>
                  <th className="py-3.5 px-4 font-bold text-center">Bunga / Tenor</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.filter((m) => m.totalPinjaman > 0).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Belum ada catatan pinjaman yang disalurkan.
                    </td>
                  </tr>
                ) : (
                  members
                    .filter((m) => m.totalPinjaman > 0)
                    .map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-600">{m.memberNo}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{m.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {m.memberType === "KELOMPOK" ? "Kelompok / Poktan" : "Individu"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">{formatRupiah(m.totalPinjaman)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">{formatRupiah(m.sisaPinjaman)}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {m.bungaPersen}% / {m.jangkaWaktuBulan} bln
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.sisaPinjaman === 0
                              ? "bg-emerald-100 text-emerald-800"
                              : m.statusPinjaman === "MACET"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {m.sisaPinjaman === 0 ? "LUNAS" : m.statusPinjaman}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            {m.sisaPinjaman > 0 && (
                              <button
                                onClick={() => handleOpenTransaction(m, "ANGSURAN")}
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                              >
                                Bayar Angsuran
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDetail(m)}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              Kartu Pinjaman
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-[11px]">
                    Total Piutang Pinjaman USP:
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(summary.totalPinjamanDisalurkan)}</td>
                  <td className="py-3 px-4 text-right font-mono text-amber-700">{formatRupiah(summary.totalSisaPinjaman)}</td>
                  <td colSpan={3} className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* VIEW 3: LEMBAR REKAPITULASI USP (UNTUK LPJ TAHUNAN) */}
        {activeSubTab === "recap" && (
          <div className="p-6 space-y-6">
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                Ringkasan Rekapitulasi Unit Usaha Simpan Pinjam
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tabel Simpanan */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2 mb-3">
                    A. Struktur Simpanan Anggota (Kewajiban USP)
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-slate-100 py-1.5">
                        <td className="py-1.5 text-slate-600">Simpanan Pokok Anggota (Akun 2.1.01.01)</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{formatRupiah(summary.totalSimpananPokok)}</td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1.5">
                        <td className="py-1.5 text-slate-600">Simpanan Wajib Anggota (Akun 2.1.01.02)</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{formatRupiah(summary.totalSimpananWajib)}</td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1.5">
                        <td className="py-1.5 text-slate-600">Simpanan Sukarela / Tabungan (Akun 2.1.01.03)</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{formatRupiah(summary.totalSimpananSukarela)}</td>
                      </tr>
                      <tr className="font-bold text-emerald-800 bg-emerald-50/50">
                        <td className="py-2 px-1">TOTAL SIMPANAN ANGGOTA</td>
                        <td className="py-2 px-1 text-right font-mono">{formatRupiah(summary.totalSimpanan)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tabel Pinjaman */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2 mb-3">
                    B. Struktur Penyaluran & Piutang Pinjaman
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-slate-100 py-1.5">
                        <td className="py-1.5 text-slate-600">Total Plafon Pinjaman Disalurkan</td>
                        <td className="py-1.5 text-right font-mono font-semibold">{formatRupiah(summary.totalPinjamanDisalurkan)}</td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1.5">
                        <td className="py-1.5 text-slate-600">Pokok Pinjaman Telah Diangsur/Kembali</td>
                        <td className="py-1.5 text-right font-mono font-semibold text-emerald-600">
                          {formatRupiah(summary.totalPinjamanDisalurkan - summary.totalSisaPinjaman)}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100 py-1.5">
                        <td className="py-1.5 text-slate-600">Sisa Piutang Berjalan (Akun 1.1.02)</td>
                        <td className="py-1.5 text-right font-mono font-semibold text-amber-600">{formatRupiah(summary.totalSisaPinjaman)}</td>
                      </tr>
                      <tr className="font-bold text-indigo-800 bg-indigo-50/50">
                        <td className="py-2 px-1">TOTAL SISA PIUTANG ANGGOTA</td>
                        <td className="py-2 px-1 text-right font-mono">{formatRupiah(summary.totalSisaPinjaman)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Signature Block for Print */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-3 text-center text-xs">
              <div>
                <p className="text-slate-500 mb-16">Mengetahui,<br /><strong>Direktur BUMDes</strong></p>
                <p className="font-bold underline text-slate-800">{settings.director_name || "Nama Direktur"}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-16">Diperiksa oleh,<br /><strong>Badan Pengawas</strong></p>
                <p className="font-bold underline text-slate-800">{settings.supervisor_name || "Nama Pengawas"}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-16">Dibuat oleh,<br /><strong>Pengelola USP / Bendahara</strong></p>
                <p className="font-bold underline text-slate-800">{settings.treasurer_name || "Nama Bendahara"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================== MODAL TAMBAH ANGGOTA ===================== */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Registrasi Anggota Simpan Pinjam Baru</h3>
                  <p className="text-xs text-slate-500">Standar Kepmendes 136/2022</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Anggota *</label>
                  <input
                    type="text"
                    required
                    value={memberForm.memberNo}
                    onChange={(e) => setMemberForm({ ...memberForm, memberNo: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh: ANG-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Anggota *</label>
                  <select
                    value={memberForm.memberType}
                    onChange={(e) => setMemberForm({ ...memberForm, memberType: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="INDIVIDU">Perorangan / Warga</option>
                    <option value="KELOMPOK">Kelompok / Poktan / Dusun</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Anggota *</label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Nama nasabah / debitur"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIK (KTP)</label>
                  <input
                    type="text"
                    value={memberForm.nik}
                    onChange={(e) => setMemberForm({ ...memberForm, nik: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="16 digit NIK"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dusun / RT / Kelompok</label>
                  <input
                    type="text"
                    value={memberForm.groupName}
                    onChange={(e) => setMemberForm({ ...memberForm, groupName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Dusun Besuk RT 01"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Saldo Awal Simpanan (Optional)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Simpanan Pokok (Rp)</label>
                    <input
                      type="number"
                      value={memberForm.simpananPokok}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananPokok: e.target.value })}
                      className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Simpanan Wajib (Rp)</label>
                    <input
                      type="number"
                      value={memberForm.simpananWajib}
                      onChange={(e) => setMemberForm({ ...memberForm, simpananWajib: e.target.value })}
                      className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Pinjaman Langsung Awal (Optional)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">Plafon Pinjaman (Rp)</label>
                    <input
                      type="number"
                      value={memberForm.initialLoan}
                      onChange={(e) => setMemberForm({ ...memberForm, initialLoan: e.target.value })}
                      className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">Bunga / Jasa (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={memberForm.bungaPersen}
                      onChange={(e) => setMemberForm({ ...memberForm, bungaPersen: e.target.value })}
                      className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">Tenor (Bulan)</label>
                    <input
                      type="number"
                      value={memberForm.jangkaWaktuBulan}
                      onChange={(e) => setMemberForm({ ...memberForm, jangkaWaktuBulan: e.target.value })}
                      className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Bidang Usaha</label>
                <textarea
                  rows={2}
                  value={memberForm.notes}
                  onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Contoh: Usaha Toko Kelontong / Petani Padi"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all"
                >
                  Simpan Anggota Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL TRANSAKSI (SETOR / PINJAM / ANGSUR) ===================== */}
      {showTransactionModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Catat Mutasi Simpan Pinjam</h3>
                  <p className="text-xs text-slate-500">
                    {selectedMember.name} ({selectedMember.memberNo})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Transaksi *</label>
                <select
                  value={txForm.type}
                  onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="SIMPANAN_WAJIB">Setor Simpanan Wajib (Rutin)</option>
                  <option value="SIMPANAN_POKOK">Setor Simpanan Pokok (Awal)</option>
                  <option value="SIMPANAN_SUKARELA">Setor Simpanan Sukarela / Tabungan</option>
                  <option value="TARIK_SIMPANAN">Penarikan Simpanan Sukarela</option>
                  <option value="PENCAIRAN_PINJAMAN">Penyaluran / Pencairan Pinjaman Baru</option>
                  <option value="ANGSURAN">Pembayaran Angsuran Pinjaman</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Bukti (BKM/BKK)</label>
                  <input
                    type="text"
                    value={txForm.proofNumber}
                    onChange={(e) => setTxForm({ ...txForm, proofNumber: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh: BKM-001/USP"
                  />
                </div>
              </div>

              {txForm.type === "ANGSURAN" ? (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Rincian Pembayaran Angsuran
                  </div>
                  <div className="text-xs text-amber-800">
                    Sisa Pokok Saat Ini: <strong>{formatRupiah(selectedMember.sisaPinjaman)}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">Angsuran Pokok (Rp) *</label>
                      <input
                        type="number"
                        required
                        value={txForm.principalAmount}
                        onChange={(e) => {
                          const p = parseFloat(e.target.value) || 0
                          const i = parseFloat(txForm.interestAmount) || 0
                          setTxForm({
                            ...txForm,
                            principalAmount: e.target.value,
                            amount: String(p + i)
                          })
                        }}
                        className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">Jasa / Bunga (Rp)</label>
                      <input
                        type="number"
                        value={txForm.interestAmount}
                        onChange={(e) => {
                          const i = parseFloat(e.target.value) || 0
                          const p = parseFloat(txForm.principalAmount) || 0
                          setTxForm({
                            ...txForm,
                            interestAmount: e.target.value,
                            amount: String(p + i)
                          })
                        }}
                        className="w-full text-xs px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-amber-900">
                    Total Diterima Kas: {formatRupiah(parseFloat(txForm.amount) || 0)}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Transaksi (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full text-sm font-bold font-mono px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh: 100000"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                  placeholder={`Contoh: Setoran simpanan wajib bulan ${new Date().toLocaleDateString("id-ID", { month: "long" })}`}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Otomatis Catat ke Jurnal Kas BUMDes</div>
                  <div className="text-[11px] text-slate-500">Sinkronkan saldo Buku Kas Umum & Buku Besar</div>
                </div>
                <input
                  type="checkbox"
                  checked={txForm.autoPostJournal}
                  onChange={(e) => setTxForm({ ...txForm, autoPostJournal: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL DETAIL ANGGOTA & KARTU PINJAMAN ===================== */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedMember.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedMember.memberNo} • {selectedMember.groupName || selectedMember.address || "Dusun Balongbesuk"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => safePrintElement("print-member-card", `Kartu Simpan Pinjam - ${selectedMember.memberNo} - ${selectedMember.name}`)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  Cetak Kartu Resmi
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="print-member-card" className="p-6 overflow-y-auto space-y-6 text-slate-800 bg-white">
              {/* KOP RESMI BUMDES */}
              <div className="border-b-2 border-slate-900 pb-3 text-center">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    {bumdesLogo ? (
                      <img
                        src={bumdesLogo}
                        alt="Logo BUMDes"
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center">
                        {villageName ? villageName.charAt(0) : "B"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center">
                    <h2 className="text-base font-black tracking-wide uppercase text-slate-900 leading-tight">
                      BADAN USAHA MILIK DESA &ldquo;{bumdesName.replace(/["“”]/g, "").replace(/^BUMDES(A)?\s+/i, "").trim().toUpperCase()}&rdquo;
                    </h2>
                    <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-700 leading-tight mt-0.5">
                      UNIT USAHA SIMPAN PINJAM (USP)
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {settings.bumdes_address || `Desa ${villageName}, Kec. ${subdistrictName}, Kab. ${regencyName} - Jawa Timur`} • SPJ & Buku Register Anggota
                    </p>
                  </div>
                  <div className="w-16 h-16 shrink-0 hidden md:block print:block">
                    {/* Placeholder penyeimbang agar judul KOP di tengah presisi */}
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-300">
                  <span className="inline-block px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest bg-slate-900 text-white rounded">
                    KARTU PINJAMAN & SIMPANAN ANGGOTA
                  </span>
                </div>
              </div>

              {/* PROFIL DEBITUR & PINJAMAN */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">No. Anggota</span>
                    <span className="font-mono font-bold text-slate-900">: {selectedMember.memberNo}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Nama Anggota</span>
                    <span className="font-bold text-slate-900">: {selectedMember.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">NIK</span>
                    <span className="font-mono text-slate-700">: {selectedMember.nik || "-"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Dusun / Alamat</span>
                    <span className="text-slate-700">: {selectedMember.groupName || selectedMember.address || "Balongbesuk"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Plafon Pinjaman</span>
                    <span className="font-mono font-bold text-slate-900">
                      : {formatRupiah(selectedMember.plafonPinjaman || selectedMember.sisaPinjaman)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Sisa Pokok</span>
                    <span className="font-mono font-bold text-rose-600">
                      : {formatRupiah(selectedMember.sisaPinjaman)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Jasa / Tenor</span>
                    <span className="text-slate-700">
                      : {selectedMember.bungaPersen || 1.5}% / bln • {selectedMember.tenorBulan || 10} Bln
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500 font-medium">Status Pinjaman</span>
                    <span>
                      : <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        selectedMember.sisaPinjaman > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {selectedMember.sisaPinjaman > 0 ? "AKTIF / MENGANGSUR" : "LUNAS"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* BAGIAN A: REKAPITULASI SIMPANAN ANGGOTA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                    Bagian A: Posisi Simpanan Anggota
                  </h4>
                  <span className="text-[11px] text-slate-500">Kewajiban BUMDes (Akun 2.1.01)</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Simpanan Pokok</span>
                    <span className="text-xs font-bold font-mono text-slate-800">
                      {formatRupiah(selectedMember.simpananPokok)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Simpanan Wajib</span>
                    <span className="text-xs font-bold font-mono text-slate-800">
                      {formatRupiah(selectedMember.simpananWajib)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Simpanan Sukarela</span>
                    <span className="text-xs font-bold font-mono text-slate-800">
                      {formatRupiah(selectedMember.simpananSukarela || 0)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Simpanan</span>
                    <span className="text-xs font-black font-mono text-emerald-700">
                      {formatRupiah(selectedMember.simpananPokok + selectedMember.simpananWajib + (selectedMember.simpananSukarela || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* BAGIAN B: KARTU KONTROL PINJAMAN & ANGSURAN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                    Bagian B: Kartu Kontrol Pinjaman & Angsuran
                  </h4>
                  <span className="text-[11px] text-slate-500">Piutang Anggota (Akun 1.1.02)</span>
                </div>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-12 border-r border-slate-200">Ke-</th>
                        <th className="py-2 px-2.5 border-r border-slate-200">Tanggal</th>
                        <th className="py-2 px-2.5 border-r border-slate-200">No. Bukti / Ket</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-200">Angsuran Pokok</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-200">Jasa / Bunga</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-200">Total Bayar</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-200">Sisa Pokok</th>
                        <th className="py-2 px-2 text-center w-16">Paraf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Baris Pencairan Awal Pinjaman */}
                      <tr className="bg-amber-50/40 font-medium">
                        <td className="py-2 px-2.5 text-center font-bold text-slate-600 border-r border-slate-200">0</td>
                        <td className="py-2 px-2.5 font-mono text-slate-700 border-r border-slate-200">
                          {selectedMember.tglPinjam ? new Date(selectedMember.tglPinjam).toLocaleDateString("id-ID") : "Awal TA"}
                        </td>
                        <td className="py-2 px-2.5 font-semibold text-slate-800 border-r border-slate-200">
                          Pencairan / Saldo Awal Piutang
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-500 border-r border-slate-200">-</td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-500 border-r border-slate-200">-</td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-500 border-r border-slate-200">-</td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                          {formatRupiah(selectedMember.plafonPinjaman || selectedMember.sisaPinjaman)}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-400 font-mono text-[9px]">Admin</td>
                      </tr>

                      {/* Baris Transaksi Angsuran */}
                      {detailLoading ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                            Memuat data mutasi...
                          </td>
                        </tr>
                      ) : memberDetail?.transactions && memberDetail.transactions.filter((t: any) => t.type.includes("ANGSURAN") || t.type === "PENCAIRAN_PINJAMAN").length > 0 ? (
                        memberDetail.transactions
                          .filter((t: any) => t.type.includes("ANGSURAN"))
                          .map((tx: any, idx: number) => (
                            <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 text-center font-bold font-mono text-slate-700 border-r border-slate-200">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-2.5 font-mono text-slate-600 border-r border-slate-200">
                                {new Date(tx.date).toLocaleDateString("id-ID")}
                              </td>
                              <td className="py-2 px-2.5 text-slate-700 border-r border-slate-200">
                                <span className="font-mono text-[10px] text-slate-500 block">{tx.proofNumber || "-"}</span>
                                {tx.description}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono text-slate-800 border-r border-slate-200">
                                {formatRupiah(tx.principalAmount || tx.amount)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono text-slate-600 border-r border-slate-200">
                                {formatRupiah(tx.interestAmount || 0)}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                                {formatRupiah(tx.amount + (tx.interestAmount || 0))}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-semibold text-rose-700 border-r border-slate-200">
                                {formatRupiah(selectedMember.sisaPinjaman)}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-400 font-mono text-[9px]">✓</td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                            Belum ada catatan angsuran tunai yang masuk untuk periode pinjaman ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-2 px-2.5 text-right uppercase tracking-wider text-slate-700 border-r border-slate-200">
                          Sisa Pokok Pinjaman Saat Ini :
                        </td>
                        <td colSpan={3} className="py-2 px-2.5 font-mono text-xs text-rose-600 border-r border-slate-200">
                          {formatRupiah(selectedMember.sisaPinjaman)}
                        </td>
                        <td colSpan={2} className="py-2 px-2.5 text-center text-[10px] text-slate-500">
                          {selectedMember.sisaPinjaman === 0 ? "LUNAS TUNTAS" : "BELUM LUNAS"}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* LEMBAR PENGESAHAN & TANDA TANGAN 3 PIHAK */}
              <div className="pt-4 border-t border-slate-200 break-inside-avoid">
                <div className="text-right text-xs text-slate-700 mb-2 font-medium">
                  {villageName}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div>
                    <p className="text-slate-600 font-medium">Nasabah / Debitur,</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="font-bold underline text-slate-900">{selectedMember.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">NIK: {selectedMember.nik || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Pengelola Unit Simpan Pinjam,</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="font-bold underline text-slate-900">{treasurerName}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Bendahara / Kasir USP</p>
                  </div>
                  <div>
                    <p className="text-slate-600 font-medium">Mengetahui,</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="font-bold underline text-slate-900">{directorName}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Direktur BUMDes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              {isAdmin && (
                <button
                  onClick={() => handleDeleteMember(selectedMember)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Anggota
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all ml-auto"
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
