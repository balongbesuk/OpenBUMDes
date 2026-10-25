"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Scale,
  Layers,
  Activity,
  FileText,
  ListOrdered,
  Sliders,
  Sparkles,
  Printer,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart,
  HelpCircle,
  Menu,
  X,
  Paperclip,
  Zap,
  Lock,
  CalendarCheck,
  Archive,
  Database,
  LogOut,
  Users,
  Upload,
  ImageIcon,
  Trash2,
  Pencil,
  Check,
  FileSpreadsheet,
  Download
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import KwitansiModal from "@/components/KwitansiModal"
import AddCoaModal from "@/components/AddCoaModal"
import ClosingTab from "@/components/ClosingTab"
import LoginModal from "@/components/LoginModal"
import SystemMaintenanceTab from "@/components/SystemMaintenanceTab"
import InlinePartyEditor from "@/components/InlinePartyEditor"
import { ManualTransactionModal } from "@/components/ManualTransactionModal"

export default function StislaApp() {
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth User State
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Data State
  const [entries, setEntries] = useState<any[]>([])
  const [coaList, setCoaList] = useState<any[]>([])

  // Helper mendapatkan nama akun dari COA / Standar Kepmendesa 136
  const getAccountName = (code: string) => {
    const found = coaList.find((a: any) => a.code === code)
    if (found && found.name) return found.name
    const fallbackNames: Record<string, string> = {
      "1.1.01.01": "Kas Tunai di Bendahara",
      "1.1.01.02": "Kas Kecil (Petty Cash)",
      "1.1.01.06": "Kas Rekening Bank Jatim",
      "1.1.03.01": "Piutang Usaha GSG & Sewa",
      "1.1.03.99": "Piutang Lain-lain (SPP / Pinjaman)",
      "1.1.04.01": "Persediaan Barang Dagangan",
      "1.1.05.01": "Uang Muka Operasional",
      "1.3.01.01": "Tanah / Lahan Usaha",
      "1.3.02.01": "Gedung & Bangunan Serbaguna",
      "1.3.03.01": "Peralatan & Inventaris Kantor",
      "1.3.07.01": "Akumulasi Penyusutan Bangunan",
      "1.3.07.02": "Akumulasi Penyusutan Peralatan",
      "2.1.01.01": "Hutang Usaha / Operasional",
      "2.1.05.01": "Hutang Bagi Hasil SHU (Kas Desa / PADes)",
      "2.2.01.01": "Hutang Jangka Panjang Bank",
      "3.1.01.01": "Penyertaan Modal Desa (APBDes)",
      "3.1.02.01": "Penyertaan Modal Masyarakat",
      "3.1.03.01": "Cadangan Umum / Cadangan Modal",
      "3.3.01.01": "Saldo Laba Ditahan (SHU Lalu)"
    }
    return fallbackNames[code] || ""
  }
  const [reports, setReports] = useState<any>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string>("")
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [standardGroups, setStandardGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Mohon pilih file gambar yang valid (PNG, JPG, WEBP, atau SVG).")
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran file gambar maksimal 3MB.")
      return
    }

    if (file.type === "image/svg+xml") {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_SIZE = 360
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL("image/webp", 0.85)
          setLogoPreview(compressed)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>(() => (new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState("2026")
  const [proofTypeFilter, setProofTypeFilter] = useState("all")
  const [attachmentFilter, setAttachmentFilter] = useState<string>("all")

  // AI Prompt State (Buku Kas)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<any>(null)
  const isAiConfigured = Boolean((settings.gemini_api_key && settings.gemini_api_key.trim().length > 0) || aiStatus?.configured)

  // Kwitansi Modal State
  const [selectedKwitansi, setSelectedKwitansi] = useState<any>(null)

  // Modal Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false)

  // Modal New Account (COA Dinamis)
  const [showCoaModal, setShowCoaModal] = useState(false)

  // Closing / Tutup Buku State
  const [closingList, setClosingList] = useState<any[]>([])

  // Modal Konfirmasi Hapus Transaksi (Khusus Admin)
  const [deletingTransaction, setDeletingTransaction] = useState<any | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/cash-book?id=${deletingTransaction.id}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menghapus transaksi")
      }
      setDeletingTransaction(null)
      await loadData()
    } catch (err: any) {
      setDeleteError(err.message || "Gagal menghapus transaksi")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handler Edit Nama Pihak (Zero Lag via InlinePartyEditor)
  const handleSaveParty = async (id: string, newName: string) => {
    const res = await fetch("/api/cash-book", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        payeeOrPayer: newName.trim()
      })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      alert(data.error || "Gagal memperbarui nama pihak")
      throw new Error(data.error || "Gagal memperbarui nama pihak")
    }
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, payeeOrPayer: newName.trim() } : e
      )
    )
  }

  // Load Data
  const loadData = async (targetYear = selectedYear) => {
    setLoading(true)
    try {
      const [resEntries, resCoa, resRep, resSet, resGroups, resAiStatus, resClosing] = await Promise.all([
        fetch(`/api/cash-book?month=${selectedMonth}&year=${targetYear}&proofType=${proofTypeFilter}`).then(r => r.json()),
        fetch("/api/keuangan/coa").then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`/api/reports?year=${targetYear}`).then(r => r.json()),
        fetch("/api/settings").then(r => r.json()),
        fetch("/api/keuangan/coa").then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch("/api/ai/status").then(r => r.json()).catch(() => null),
        fetch("/api/closing").then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ])

      if (resEntries.success) setEntries(resEntries.data)
      if (resCoa.success) setCoaList(resCoa.data)
      if (resRep.success) setReports({ ...resRep.data, isArchived: resRep.isArchived, closingMeta: resRep.closingMeta })
      if (resSet.success) {
        setSettings(resSet.data)
        if (resSet.data.bumdes_logo) {
          setLogoPreview(resSet.data.bumdes_logo)
        }
      }
      if (resGroups.success && resGroups.data?.groups) setStandardGroups(resGroups.data.groups)
      if (resAiStatus && resAiStatus.success) setAiStatus(resAiStatus)
      if (resClosing && resClosing.success) setClosingList(resClosing.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check auth session
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.authenticated && data.user) {
          setCurrentUser(data.user)
        } else {
          setCurrentUser(null)
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false))

    loadData()
  }, [selectedMonth, selectedYear, proofTypeFilter])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
  }

  const handleNavClick = (tab: string) => {
    if (tab === "closing" && currentUser?.role !== "ADMIN") {
      alert("Akses Terbatas: Menu Tutup & Buka Buku hanya dapat diakses oleh akun Administrator.")
      return
    }
    setActiveTab(tab)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  // AI Parser Submit (Buku Kas)
  const handleAiProcess = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiResult(null)
    setAiError(null)
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      })
      const json = await res.json()
      if (json.success) {
        setAiResult(json.data)
        setAiError(null)
      } else {
        setAiError(json.error || "Gagal memproses dengan Gemini AI. Periksa API Key.")
      }
    } catch (e: any) {
      setAiError("Terjadi kesalahan jaringan: " + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  // Save AI Generated Transaction
  const handleSaveAiTransaction = async () => {
    if (!aiResult) return
    try {
      const res = await fetch("/api/cash-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofType: aiResult.proofType,
          date: aiResult.date || new Date().toISOString().split("T")[0],
          description: aiResult.description,
          payeeOrPayer: aiResult.payeeOrPayer,
          unitName: aiResult.unitName || "Umum",
          lines: aiResult.lines
        })
      })
      const json = await res.json()
      if (json.success) {
        alert("Transaksi berhasil dicatat ke Buku Kas & Jurnal!")
        setAiPrompt("")
        setAiResult(null)
        loadData()
      } else {
        alert("Gagal menyimpan: " + json.error)
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    }
  }



  // Calculate BUMDes Health Metrics
  const totalKas = reports?.neraca?.totalCurrentAssets || 0
  const totalPendapatan = reports?.labaRugi?.totalRevenue || 0
  const totalBeban = reports?.labaRugi?.totalExpense || 0
  const labaBersih = reports?.labaRugi?.netProfit || 0
  const totalAset = reports?.neraca?.totalAssets || 0
  const totalKewajiban = reports?.neraca?.totalLiabilities || 0
  const totalEkuitas = reports?.neraca?.totalEquity || 0

  // Deteksi apakah database sudah memiliki catatan transaksi / saldo awal
  const hasFinancialData = Boolean(
    totalAset > 0 ||
    totalPendapatan > 0 ||
    totalBeban > 0 ||
    totalKewajiban > 0 ||
    totalEkuitas > 0 ||
    (entries && entries.length > 0)
  )

  // Ratios
  const netProfitMargin = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0
  const roe = totalEkuitas > 0 ? (labaBersih / totalEkuitas) * 100 : 0
  const debtToAssetRatio = totalAset > 0 ? (totalKewajiban / totalAset) * 100 : 0
  const cashCoverageRatio = totalKewajiban > 0 ? totalKas / totalKewajiban : 0

  // Health Score (0-100) - Hanya dihitung jika sudah ada data keuangan
  let healthScore = 0
  if (hasFinancialData) {
    healthScore = 70
    if (totalKewajiban === 0 || debtToAssetRatio <= 20) healthScore += 15
    if (labaBersih > 0) healthScore += 10
    if (netProfitMargin >= 20) healthScore += 5
    if (healthScore > 100) healthScore = 100
  }

  const getHealthBadge = () => {
    if (!hasFinancialData) {
      return {
        text: "BELUM ADA DATA",
        color: "bg-slate-500 text-white",
        border: "border-slate-300",
        bgLight: "bg-slate-100",
        subtext: "Menunggu Input Data Transaksi / Saldo Awal"
      }
    }
    if (healthScore >= 85) {
      return {
        text: "SANGAT SEHAT (Kategori AA)",
        color: "bg-emerald-500 text-white",
        border: "border-emerald-300",
        bgLight: "bg-emerald-50",
        subtext: "Bebas Risiko Gagal Bayar"
      }
    } else if (healthScore >= 70) {
      return {
        text: "SEHAT (Kategori A)",
        color: "bg-blue-600 text-white",
        border: "border-blue-300",
        bgLight: "bg-blue-50",
        subtext: "Kondisi Operasional Stabil"
      }
    } else {
      return {
        text: "CUKUP SEHAT (Kategori B)",
        color: "bg-amber-500 text-white",
        border: "border-amber-300",
        bgLight: "bg-amber-50",
        subtext: "Perlu Peningkatan Likuiditas"
      }
    }
  }

  const healthBadge = getHealthBadge()

  // List tahun laporan keuangan yang tersedia (tidak memunculkan tahun depan > 2026)
  const availableReportYears = Array.from(
    new Set([
      "2026",
      "2025",
      "2024",
      ...closingList.map((c: any) => String(c.year))
    ])
  )
    .filter((y) => parseInt(y, 10) <= 2026)
    .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))

  const renderReportYearFilter = (reportTitle?: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 mb-2 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#6777ef] shrink-0">
          <CalendarCheck className="w-5 h-5" />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
            Tahun Buku / Periode Laporan {reportTitle ? `(${reportTitle})` : ""}
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <select
              value={selectedYear}
              onChange={(e) => {
                const yr = e.target.value
                setSelectedYear(yr)
                loadData(yr)
              }}
              className="bg-white border border-slate-300 hover:border-[#6777ef] text-xs font-bold text-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#6777ef] shadow-xs cursor-pointer transition-colors"
            >
              {availableReportYears.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr} {yr === "2026" ? "(Tahun Berjalan)" : ""}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
              Pilih tahun untuk memeriksa arsip atau data tahun sebelumnya
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        {reports?.isArchived ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Arsip Resmi LPJ (Telah Tutup Buku)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Data Berjalan (Live)</span>
          </span>
        )}

        <button
          type="button"
          onClick={() => loadData(selectedYear)}
          title="Muat ulang laporan"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#6777ef] hover:border-[#6777ef] hover:bg-indigo-50/50 shadow-xs transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#6777ef]" : ""}`} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-800 flex flex-col antialiased">
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* WRAPPER */}
      <div className="flex flex-1 min-w-0">
        {/* ===================== STISLA SIDEBAR ===================== */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out select-none shadow-lg lg:shadow-none lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Brand Header (3 Tingkat) */}
          <div className="min-h-[5rem] py-3.5 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 pr-1">
              {(settings.bumdes_logo || logoPreview) ? (
                <img
                  src={settings.bumdes_logo || logoPreview}
                  alt="Logo BUMDes"
                  className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6777ef] to-[#5161ce] flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                  {settings.bumdes_name ? settings.bumdes_name.charAt(0).toUpperCase() : "P"}
                </div>
              )}
              <div className="leading-tight overflow-hidden flex-1 min-w-0">
                {/* Tingkat 1: Nama Resmi BUMDes */}
                <h1
                  title={settings.bumdes_name || "PPAK BUMDesa"}
                  className="font-extrabold text-slate-800 tracking-tight text-sm leading-tight truncate"
                >
                  {settings.bumdes_name || "PPAK BUMDesa"}
                </h1>

                {/* Tingkat 2: Wilayah Desa & Kecamatan */}
                <p className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-0.5">
                  Desa {settings.village_name || "Balongbesuk"}
                  {settings.subdistrict_name ? `, Kec. ${settings.subdistrict_name}` : ""}
                </p>

                {/* Tingkat 3: Regulasi Akuntansi Kepmendes */}
                <div className="mt-1 flex items-center">
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 tracking-wide">
                    Kepmendes 136
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menu Utama
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick("dashboard")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === "dashboard"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  <span>Dashboard Kesehatan</span>
                </button>

                <button
                  onClick={() => handleNavClick("cash-book")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    activeTab === "cash-book"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <span>Buku Kas & Jurnal</span>
                </button>

                {currentUser?.role === "ADMIN" && (
                  <button
                    onClick={() => handleNavClick("closing")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      activeTab === "closing"
                        ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Lock className="w-5 h-5 shrink-0" />
                    <span>Tutup & Buka Buku</span>
                    {closingList.length > 0 && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {closingList.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Laporan Keuangan (136)
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick("laba-rugi")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeTab === "laba-rugi"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>1. Laba Rugi</span>
                </button>

                <button
                  onClick={() => handleNavClick("neraca")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeTab === "neraca"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>2. Neraca (SAK EMKM)</span>
                </button>

                <button
                  onClick={() => handleNavClick("lpe")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeTab === "lpe"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>3. Perubahan Modal</span>
                </button>

                <button
                  onClick={() => handleNavClick("lak")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeTab === "lak"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>4. Arus Kas (LAK)</span>
                </button>

                <button
                  onClick={() => handleNavClick("calk")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeTab === "calk"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>5. Catatan (CaLK)</span>
                </button>
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Master & Pengaturan
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick("coa")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    activeTab === "coa"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <ListOrdered className="w-4 h-4 shrink-0" />
                  <span>Bagan Akun (COA Dinamis)</span>
                </button>

                {currentUser?.role === "ADMIN" && (
                  <button
                    onClick={() => handleNavClick("settings")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      activeTab === "settings"
                        ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <Sliders className="w-4 h-4 shrink-0" />
                    <span>Pengaturan & AI</span>
                  </button>
                )}

                {currentUser?.role === "ADMIN" && (
                  <button
                    onClick={() => handleNavClick("maintenance")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      activeTab === "maintenance"
                        ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <Database className="w-4 h-4 shrink-0" />
                    <span>Backup & Pemeliharaan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full ${
                  hasFinancialData ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500"
                } flex items-center justify-center font-bold text-xs shrink-0`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">Kesehatan BUMDes</p>
                <p
                  className={`text-[11px] ${
                    hasFinancialData ? "text-emerald-600 font-semibold" : "text-slate-500 font-medium"
                  } flex items-center gap-1`}
                >
                  {hasFinancialData ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  )}
                  {healthBadge.text.split("(")[0]}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ===================== MAIN CONTENT ===================== */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                title="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 overflow-hidden">
                <span className="hidden sm:inline text-slate-400 text-sm font-medium">BUMDes</span>
                <span className="hidden sm:inline text-slate-300">/</span>
                <span className="text-slate-800 font-bold text-sm sm:text-base truncate">
                  {activeTab === "dashboard"
                    ? "Dashboard Kesehatan"
                    : activeTab === "cash-book"
                    ? "Buku Kas & Jurnal"
                    : activeTab === "closing"
                    ? "Tutup & Buka Buku"
                    : activeTab === "laba-rugi"
                    ? "Laba Rugi"
                    : activeTab === "neraca"
                    ? "Neraca (SAK EMKM)"
                    : activeTab === "lpe"
                    ? "Perubahan Ekuitas"
                    : activeTab === "lak"
                    ? "Arus Kas (LAK)"
                    : activeTab === "calk"
                    ? "Catatan (CaLK)"
                    : activeTab === "coa"
                    ? "Bagan Akun (COA Dinamis)"
                    : activeTab === "maintenance"
                    ? "Backup & Pemeliharaan Sistem"
                    : "Pengaturan & AI"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 bg-[#6777ef] hover:bg-[#5868e4] text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Catat Transaksi</span>
                <span className="sm:hidden">Catat</span>
              </button>

              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              {/* User Profile & Logout */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-right">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[#6777ef] font-bold text-xs uppercase shrink-0">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                      {currentUser?.name || "Pengguna"}
                    </p>
                    <span
                      className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        currentUser?.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {currentUser?.role === "ADMIN" ? "ADMIN" : "OPERATOR"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar dari akun"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 flex-1 min-w-0 overflow-y-auto">
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs overflow-hidden relative">
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#6777ef] border border-indigo-100">
                        <Sparkles className="w-3.5 h-3.5" />
                        Analisis Otomatis Akuntansi Kepmendes 136
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Indeks Kesehatan Keuangan BUMDes
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                        Menganalisis rasio likuiditas kas, efisiensi operasional, kemandirian modal, dan solvabilitas dari seluruh jurnal yang tersimpan.
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-5 bg-[#f8fafc] p-3.5 sm:p-4 rounded-xl border border-slate-200 shrink-0">
                      <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-black text-[#6777ef]">
                          {hasFinancialData ? healthScore : "-"}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {hasFinancialData ? "Skor / 100" : "Belum Ada Data"}
                        </div>
                      </div>
                      <div className="h-10 w-px bg-slate-200"></div>
                      <div>
                        <div className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-extrabold ${healthBadge.color}`}>
                          {healthBadge.text}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium">{healthBadge.subtext}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6">
                    <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">1. Likuiditas Kas</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            totalKas > 0
                              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                              : "text-slate-500 bg-slate-100 border-slate-200"
                          }`}
                        >
                          {totalKas > 0 ? "Sangat Aman" : "Belum Ada Saldo"}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-800">{formatRupiah(totalKas)}</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Kas siap pakai untuk operasional harian BUMDes.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">2. Margin Keuntungan</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            totalPendapatan > 0
                              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                              : "text-slate-500 bg-slate-100 border-slate-200"
                          }`}
                        >
                          {totalPendapatan > 0 ? `${netProfitMargin.toFixed(1)}%` : "0.0%"}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-800">{formatRupiah(labaBersih)}</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Surplus laba bersih setelah dikurangi semua beban.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">3. Solvabilitas (Utang)</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            totalKewajiban === 0
                              ? "text-slate-500 bg-slate-100 border-slate-200"
                              : debtToAssetRatio <= 20
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : debtToAssetRatio <= 50
                              ? "text-blue-700 bg-blue-50 border-blue-200"
                              : "text-amber-700 bg-amber-50 border-amber-200"
                          }`}
                        >
                          {totalKewajiban === 0
                            ? "0% Utang"
                            : `${debtToAssetRatio <= 20 ? "Aman" : debtToAssetRatio <= 50 ? "Terkendali" : "Tinggi"} (${debtToAssetRatio.toFixed(1)}% Aset)`}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-800">{formatRupiah(totalKewajiban)}</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {totalKewajiban === 0
                          ? "Kemandirian modal penuh tanpa beban kewajiban."
                          : `Porsi utang hanya ${debtToAssetRatio.toFixed(1)}% dari total aset (kas mencukupi ${cashCoverageRatio.toFixed(1)}x lipat).`}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">4. Total Ekuitas Desa</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            totalEkuitas > 0
                              ? "text-indigo-600 bg-indigo-50 border-indigo-200"
                              : "text-slate-500 bg-slate-100 border-slate-200"
                          }`}
                        >
                          {totalEkuitas > 0 ? `Tumbuh ${roe.toFixed(1)}%` : "Nihil"}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-800">{formatRupiah(totalEkuitas)}</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Akumulasi modal APBDes + sisa hasil usaha.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 p-3.5 sm:p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#6777ef] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-indigo-950">Catatan Diagnosa untuk Kepala Desa & Direktur:</span>{" "}
                      {!hasFinancialData ? (
                        <span>
                          Database saat ini masih kosong (belum ada transaksi atau saldo awal yang tercatat). Silakan lakukan pencatatan Saldo Awal tahun melalui menu <strong>Tutup & Buka Buku</strong> atau catat transaksi pertama melalui tombol <strong>&ldquo;+ Catat Transaksi&rdquo;</strong> di atas.
                        </span>
                      ) : (
                        <span>
                          BUMDes dalam kondisi finansial prima dengan rasio kas memadai dan tingkat beban operasional hanya{" "}
                          {totalPendapatan > 0 ? ((totalBeban / totalPendapatan) * 100).toFixed(1) : 0}% dari pendapatan.
                          Pertahankan cadangan likuiditas minimal 3 bulan beban kantor, dan kelebihan kas dapat dialokasikan untuk pengembangan unit usaha baru.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kas & Bank</div>
                      <div className="text-lg sm:text-xl font-black text-slate-800 mt-1">{formatRupiah(totalKas)}</div>
                      <div
                        className={`text-[11px] ${
                          totalKas > 0 ? "text-emerald-600 font-semibold" : "text-slate-400 font-medium"
                        } mt-1 flex items-center gap-1`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {totalKas > 0 ? "Siap Digunakan" : "Saldo Nihil"}
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#6777ef] flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendapatan Usaha</div>
                      <div
                        className={`text-lg sm:text-xl font-black ${
                          totalPendapatan > 0 ? "text-emerald-600" : "text-slate-800"
                        } mt-1`}
                      >
                        {formatRupiah(totalPendapatan)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-1">Tahun Berjalan</div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Beban Operasional</div>
                      <div
                        className={`text-lg sm:text-xl font-black ${
                          totalBeban > 0 ? "text-rose-500" : "text-slate-800"
                        } mt-1`}
                      >
                        {formatRupiah(totalBeban)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-1">
                        {totalBeban > 0 ? "Efisien & Terkendali" : "Nihil"}
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Laba Bersih (SHU)</div>
                      <div
                        className={`text-lg sm:text-xl font-black ${
                          labaBersih > 0 ? "text-indigo-600" : labaBersih < 0 ? "text-rose-600" : "text-slate-800"
                        } mt-1`}
                      >
                        {formatRupiah(labaBersih)}
                      </div>
                      <div
                        className={`text-[11px] ${
                          labaBersih > 0
                            ? "text-indigo-600 font-semibold"
                            : labaBersih < 0
                            ? "text-rose-600 font-semibold"
                            : "text-slate-400 font-medium"
                        } mt-1`}
                      >
                        {labaBersih > 0 ? "Surplus Positif" : labaBersih < 0 ? "Defisit" : "Nihil"}
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#6777ef]" />
                        Struktur Modal & Posisi Keuangan
                      </h3>
                      <button
                        onClick={() => handleNavClick("neraca")}
                        className="text-xs text-[#6777ef] font-semibold hover:underline"
                      >
                        Lihat Neraca &rarr;
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                        <span className="text-slate-600 font-medium">Aset Lancar (Kas & Bank)</span>
                        <span className="font-bold text-slate-900">{formatRupiah(totalKas)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                        <span className="text-slate-600 font-medium">Aset Tetap Bersih</span>
                        <span className="font-bold text-slate-900">{formatRupiah(reports?.neraca?.fixedAssets?.net || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50 bg-slate-50 px-2 rounded">
                        <span className="font-bold text-slate-800">Total Aset BUMDes</span>
                        <span className="font-extrabold text-[#6777ef]">{formatRupiah(totalAset)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                        <span className="text-slate-600 font-medium">Kewajiban / Utang Usaha</span>
                        <span className="font-bold text-slate-900">{formatRupiah(totalKewajiban)}</span>
                      </div>
                      <div
                        className={`flex items-center justify-between text-xs py-2 px-2 rounded font-bold ${
                          totalEkuitas > 0 ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-800"
                        }`}
                      >
                        <span>Total Ekuitas Bersih</span>
                        <span>{formatRupiah(totalEkuitas)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#6777ef]" />
                        Transaksi Kas Terakhir
                      </h3>
                      <button
                        onClick={() => handleNavClick("cash-book")}
                        className="text-xs text-[#6777ef] font-semibold hover:underline"
                      >
                        Ke Buku Kas &rarr;
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {entries && entries.length > 0 ? (
                        entries.slice(0, 4).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <div className="overflow-hidden pr-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                    tx.proofType === "BKM"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {tx.proofNumber}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                  {tx.description}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                Pihak: {tx.payeeOrPayer} &bull;{" "}
                                {new Date(tx.date).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedKwitansi(tx)}
                              className="p-1.5 rounded bg-slate-100 hover:bg-[#6777ef] hover:text-white text-slate-600 transition-colors shrink-0"
                              title="Cetak Kwitansi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Belum ada transaksi kas yang dicatat.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BUKU KAS & JURNAL */}
            {activeTab === "cash-book" && (
              <div className="space-y-6">
                {/* BANNER CATAT TRANSAKSI OTOMATIS (HYBRID: GEMINI AI ATAU OFFLINE RULES) */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-[#6777ef] rounded-2xl p-4 sm:p-6 text-white shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {isAiConfigured ? (
                        <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                      ) : (
                        <Zap className="w-5 h-5 text-amber-300 shrink-0" />
                      )}
                      <h2 className="font-bold text-base sm:text-lg">
                        {isAiConfigured
                          ? "Catat Transaksi Otomatis dengan Chat Gemini AI"
                          : "Catat Transaksi Otomatis (Asisten Cerdas Kepmendes 136)"}
                      </h2>
                    </div>

                    {isAiConfigured && aiStatus && aiStatus.configured ? (
                      <div className="flex items-center gap-2 text-[11px] bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full text-emerald-100 border border-white/15 self-start sm:self-auto flex-wrap">
                        <span className="font-medium">
                          Model: <strong className="text-white font-mono">{settings.gemini_model || "gemini-3.5-flash-lite"}</strong>
                        </span>
                        <span className="text-white/40">&bull;</span>
                        <span>
                          Sisa Kuota: <strong className="text-amber-300 font-bold">{aiStatus.quotaInfo?.remainingRequestsToday ?? 1500}</strong> / {aiStatus.quotaInfo?.freeDailyQuota ?? 1500} req
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] bg-black/20 backdrop-blur-xs px-3 py-1 rounded-full text-emerald-100 border border-white/15 self-start sm:self-auto">
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span className="font-medium text-amber-200">Mode Cerdas Offline</span>
                        <span className="text-white/40">&bull;</span>
                        <span className="text-emerald-200">100% Hemat Kuota & Gratis</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-emerald-100 max-w-2xl mb-4">
                    {isAiConfigured
                      ? "Ketik transaksi harian seperti pembukuan biasa. Gemini AI akan otomatis menentukan jenis bukti (BKM/BKK), akun Kepmendes 136, dan komponen Arus Kas."
                      : "Ketik transaksi harian seperti biasa. Sistem aturan cerdas otomatis menentukan jenis bukti (BKM/BKK), akun Kepmendes 136, dan komponen Arus Kas tanpa butuh internet & kuota token."}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAiProcess()}
                      placeholder="Contoh: Terima sewa gedung dari pak budi 1,5 juta tunai..."
                      className="flex-1 bg-white/10 text-white placeholder-emerald-200 border border-white/20 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:bg-white focus:text-slate-900 transition-all shadow-inner"
                    />
                    <button
                      onClick={handleAiProcess}
                      disabled={aiLoading}
                      className="bg-white text-slate-900 font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#6777ef]" />
                          <span>Menganalisis...</span>
                        </>
                      ) : (
                        <>
                          {isAiConfigured ? (
                            <Sparkles className="w-4 h-4 text-[#6777ef]" />
                          ) : (
                            <Zap className="w-4 h-4 text-[#6777ef]" />
                          )}
                          <span>{isAiConfigured ? "Proses AI" : "Proses Otomatis"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiError && (
                    <div className="mt-3 p-3 bg-rose-500/20 border border-rose-300/40 rounded-xl text-xs text-white flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {aiResult && (
                    <div className="mt-4 bg-white text-slate-800 p-4 rounded-xl border border-emerald-200 shadow-lg animate-in fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                          {aiResult.engine === "GEMINI_AI" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Hasil Analisis Gemini AI ({aiResult.modelUsed || "Cloud"})
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-emerald-600" />
                              Hasil Analisis Cerdas Standar Kepmendes 136 (Hemat Token / Offline)
                            </>
                          )}
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                            aiResult.proofType === "BKM"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          Bukti: {aiResult.proofType}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-slate-400">Uraian:</span>
                          <p className="font-bold text-slate-800">{aiResult.description}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Pihak:</span>
                          <p className="font-bold text-slate-800">{aiResult.payeeOrPayer}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                        <div className="text-[11px] font-bold text-slate-500 mb-1.5">Jurnal Berpasangan:</div>
                        {aiResult.lines?.map((line: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs py-1">
                            <span className={line.type === "CREDIT" ? "pl-3 text-slate-600" : "font-semibold text-slate-800"}>
                              {line.accountCode} - {line.type}
                            </span>
                            <span className="font-mono font-bold">{formatRupiah(line.amount)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAiResult(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSaveAiTransaction}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#6777ef] text-white hover:bg-[#5868e4] shadow"
                        >
                          Simpan ke Kas
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {(() => {
                    const signedCount = entries.filter((e: any) => !!e.attachmentUrl).length
                    const totalCount = entries.length
                    const displayedEntries = entries.filter((e: any) => {
                      if (attachmentFilter === "signed") return !!e.attachmentUrl
                      if (attachmentFilter === "unsigned") return !e.attachmentUrl
                      return true
                    })

                    return (
                      <>
                        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Buku Kas Umum (Jurnal Harian)</h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  signedCount === totalCount && totalCount > 0
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {signedCount}/{totalCount} Bukti Fisik Ber-TTD
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">Seluruh penerimaan & pengeluaran kas tersimpan kronologis lengkap dengan status bukti fisik.</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                            {/* Filter Bulan */}
                            <select
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#6777ef]"
                            >
                              <option value="all">Semua Bulan</option>
                              <option value="1">Januari</option>
                              <option value="2">Februari</option>
                              <option value="3">Maret</option>
                              <option value="4">April</option>
                              <option value="5">Mei</option>
                              <option value="6">Juni</option>
                              <option value="7">Juli</option>
                              <option value="8">Agustus</option>
                              <option value="9">September</option>
                              <option value="10">Oktober</option>
                              <option value="11">November</option>
                              <option value="12">Desember</option>
                            </select>

                            {/* Filter Jenis Bukti */}
                            <select
                              value={proofTypeFilter}
                              onChange={(e) => setProofTypeFilter(e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
                            >
                              <option value="all">Semua Bukti</option>
                              <option value="BKM">BKM (Kas Masuk)</option>
                              <option value="BKK">BKK (Kas Keluar)</option>
                            </select>

                            {/* Filter Status Bukti Fisik */}
                            <select
                              value={attachmentFilter}
                              onChange={(e) => setAttachmentFilter(e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
                            >
                              <option value="all">Semua Status Bukti</option>
                              <option value="signed">✓ Sudah TTD ({signedCount})</option>
                              <option value="unsigned">⚠ Belum TTD ({totalCount - signedCount})</option>
                            </select>

                            {/* Tombol Unduh Excel 1 Tahun Penuh */}
                            <a
                              href={`/api/cash-book/export-excel?year=${encodeURIComponent(String(selectedYear).replace(/[^0-9]/g, ""))}`}
                              download
                              title={`Unduh seluruh transaksi Buku Kas & Jurnal selama 1 Tahun Penuh (${selectedYear}) ke Excel (.xlsx)`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Unduh Excel (1 Thn)</span>
                            </a>

                            <button
                              onClick={() => setShowManualModal(true)}
                              className="bg-[#6777ef] hover:bg-[#5868e4] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Catat Manual</span>
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[800px]">
                            <thead className="bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                              <tr>
                                <th className="py-3 px-4">No. Bukti / Tgl</th>
                                <th className="py-3 px-4">Uraian & Penyetor/Penerima</th>
                                <th className="py-3 px-4 min-w-[220px]">Kode & Nama Akun</th>
                                <th className="py-3 px-4 text-right">Debit (Rp)</th>
                                <th className="py-3 px-4 text-right">Kredit (Rp)</th>
                                <th className="py-3 px-4 text-center">Kwitansi & Bukti Fisik</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {displayedEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                    {entries.length === 0
                                      ? "Belum ada transaksi di periode ini."
                                      : "Tidak ada transaksi yang cocok dengan filter status bukti."}
                                  </td>
                                </tr>
                              ) : (
                                displayedEntries.map((entry) => (
                                  <React.Fragment key={entry.id}>
                                    {entry.lines.map((line: any, idx: number) => (
                                      <tr key={line.id} className="hover:bg-slate-50/70 transition-colors">
                                        {idx === 0 ? (
                                          <td
                                            rowSpan={entry.lines.length}
                                            className="py-3 px-4 align-top font-mono text-[11px] border-r border-slate-50"
                                          >
                                            <span
                                              className={`font-bold px-2 py-0.5 rounded ${
                                                entry.proofType === "BKM"
                                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                  : entry.proofType === "MEMORIAL" || entry.proofType === "BM" || entry.proofType === "SA" || entry.proofNumber?.startsWith("SA/") || entry.proofNumber?.startsWith("BM/")
                                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                                              }`}
                                            >
                                              {entry.proofNumber}
                                            </span>
                                            <div className="text-slate-400 mt-1">
                                              {new Date(entry.date).toLocaleDateString("id-ID")}
                                            </div>
                                          </td>
                                        ) : null}

                                        {idx === 0 ? (
                                          <td
                                            rowSpan={entry.lines.length}
                                            className="py-3 px-4 align-top border-r border-slate-50"
                                          >
                                            <div className="font-bold text-slate-800 text-xs">{entry.description}</div>
                                            <div className="text-[11px] text-slate-500 mt-1">
                                              <InlinePartyEditor entry={entry} onSave={handleSaveParty} />
                                            </div>
                                          </td>
                                        ) : null}

                                        <td className="py-2.5 px-4">
                                          <div className={`flex items-baseline gap-2 ${line.type === "CREDIT" ? "pl-5" : ""}`}>
                                            <span className="font-mono font-bold text-slate-800 shrink-0 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                              {line.accountCode}
                                            </span>
                                            <span className={`text-xs ${line.type === "CREDIT" ? "text-slate-600 font-medium italic" : "text-slate-900 font-bold"}`}>
                                              {getAccountName(line.accountCode) || line.accountCode}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono font-medium">
                                          {line.type === "DEBIT" ? formatRupiah(line.amount) : "-"}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-mono font-medium">
                                          {line.type === "CREDIT" ? formatRupiah(line.amount) : "-"}
                                        </td>

                                        {idx === 0 ? (
                                          <td
                                            rowSpan={entry.lines.length}
                                            className="py-3 px-4 align-top text-center"
                                          >
                                            <div className="flex flex-col items-center gap-1.5">
                                              <button
                                                onClick={() => setSelectedKwitansi(entry)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-white hover:bg-[#6777ef] text-[11px] font-bold shadow-xs transition-all"
                                                title="Buka Cetak Kwitansi & Upload Bukti"
                                              >
                                                <Printer className="w-3 h-3" />
                                                <span>Cetak</span>
                                              </button>

                                              {/* Penanda Status Bukti Fisik Terupload */}
                                              {entry.attachmentUrl ? (
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    onClick={() => setSelectedKwitansi(entry)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-bold transition-all shadow-xs"
                                                    title="Bukti fisik sudah diunggah. Klik untuk melihat."
                                                  >
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                                    <span>Sudah TTD</span>
                                                  </button>
                                                  <a
                                                    href={entry.attachmentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                                    title="Lihat Foto Bukti Fisik Asli"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <Paperclip className="w-3 h-3" />
                                                  </a>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={() => setSelectedKwitansi(entry)}
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 text-[10px] font-bold transition-all"
                                                  title="Bukti tanda tangan belum diunggah. Klik untuk cetak dan unggah foto kwitansi."
                                                >
                                                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                                  <span>Belum TTD</span>
                                                </button>
                                              )}

                                              {/* Tombol Hapus Khusus Admin */}
                                              {currentUser?.role === "ADMIN" && (
                                                <button
                                                  onClick={() => {
                                                    setDeleteError(null)
                                                    setDeletingTransaction(entry)
                                                  }}
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-[10px] font-bold transition-all shadow-2xs mt-1"
                                                  title="Hapus transaksi ini (Khusus Admin)"
                                                >
                                                  <Trash2 className="w-3 h-3 text-rose-600" />
                                                  <span>Hapus</span>
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        ) : null}
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* TAB: 1. LABA RUGI */}
            {activeTab === "laba-rugi" && reports && (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportYearFilter("Laba Rugi")}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-8 space-y-6">
                  {reports.isArchived && currentUser?.role === "ADMIN" && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold flex-shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">
                            ARSIP RESMI LPJ TAHUN {selectedYear} (TELAH TUTUP BUKU)
                          </div>
                          <div className="text-[11px] text-amber-100">
                            Ditutup oleh {reports.closingMeta?.closedBy} &bull; Laba Bersih: {formatRupiah(reports.closingMeta?.netProfit || 0)} &bull; Status Terkunci (Read-Only)
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("closing")}
                        className="px-3 py-1.5 bg-white text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-50 transition-all shadow-xs"
                      >
                        Buka di Tutup Buku
                      </button>
                    </div>
                  )}

                  <div className="text-center border-b border-slate-200 pb-5">
                    <div className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-[#6777ef]">
                      Standar Kepmendesa PDTT No. 136 Tahun 2022
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">LAPORAN LABA RUGI</h2>
                    <p className="text-xs text-slate-500 font-medium">{settings.bumdes_name || "BUM Desa Barokah"} &bull; Periode Tahun {selectedYear}</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 bg-slate-50 p-2 rounded">
                      I. PENDAPATAN USAHA
                    </h4>
                    <table className="w-full text-xs">
                      <tbody>
                        {reports.labaRugi.revenues.length === 0 ? (
                          <tr><td className="py-2 text-slate-400 italic">Belum ada pendapatan tercatat.</td></tr>
                        ) : (
                          reports.labaRugi.revenues.map((r: any) => (
                            <tr key={r.code} className="border-b border-slate-50">
                              <td className="py-2 text-slate-500 font-mono w-24 sm:w-28">{r.code}</td>
                              <td className="py-2 text-slate-800 font-medium">{r.name}</td>
                              <td className="py-2 text-right font-mono font-bold">{formatRupiah(r.amount)}</td>
                            </tr>
                          ))
                        )}
                        <tr className="border-t border-slate-200 font-bold bg-slate-50/50">
                          <td colSpan={2} className="py-2.5 px-2 text-slate-800">TOTAL PENDAPATAN</td>
                          <td className="py-2.5 px-2 text-right font-mono text-emerald-600 font-black">
                            {formatRupiah(reports.labaRugi.totalRevenue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 bg-slate-50 p-2 rounded">
                      II. BEBAN OPERASIONAL & USAHA
                    </h4>
                    <table className="w-full text-xs">
                      <tbody>
                        {reports.labaRugi.expenses.length === 0 ? (
                          <tr><td className="py-2 text-slate-400 italic">Belum ada beban tercatat.</td></tr>
                        ) : (
                          reports.labaRugi.expenses.map((e: any) => (
                            <tr key={e.code} className="border-b border-slate-50">
                              <td className="py-2 text-slate-500 font-mono w-24 sm:w-28">{e.code}</td>
                              <td className="py-2 text-slate-800 font-medium">{e.name}</td>
                              <td className="py-2 text-right font-mono font-bold">{formatRupiah(e.amount)}</td>
                            </tr>
                          ))
                        )}
                        <tr className="border-t border-slate-200 font-bold bg-slate-50/50">
                          <td colSpan={2} className="py-2.5 px-2 text-slate-800">TOTAL BEBAN</td>
                          <td className="py-2.5 px-2 text-right font-mono text-rose-500 font-black">
                            {formatRupiah(reports.labaRugi.totalExpense)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-extrabold text-[#6777ef] tracking-wider">
                        LABA BERSIH TAHUN BERJALAN (SHU)
                      </span>
                      <p className="text-[11px] text-slate-500">Akan ditransfer otomatis ke Ekuitas di Neraca.</p>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-[#6777ef] font-mono">
                      {formatRupiah(reports.labaRugi.netProfit)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: 2. NERACA */}
            {activeTab === "neraca" && reports && (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportYearFilter("Neraca")}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-8 space-y-6">
                  <div className="text-center border-b border-slate-200 pb-5">
                    <div className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-[#6777ef]">
                      Standar SAK EMKM & Kepmendesa PDTT No. 136 Tahun 2022
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">LAPORAN POSISI KEUANGAN (NERACA)</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {settings.bumdes_name || "BUM Desa Barokah"} &bull;{" "}
                      {selectedYear === "2026" ? "Per 24 Oktober 2026 (Tahun Berjalan)" : `Per 31 Desember ${selectedYear} (Tutup Buku)`}
                    </p>
                  </div>

                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>STATUS NERACA: 100% BALANCE (SEIMBANG)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 border-b-2 border-[#6777ef] pb-1">
                      ASET (AKTIVA)
                    </h3>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">A. ASET LANCAR</div>
                      {reports.neraca.currentAssets.map((a: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 pl-3 border-b border-slate-50">
                          <span className="text-slate-600">{a.name}</span>
                          <span className="font-mono font-bold text-slate-800">{formatRupiah(a.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold bg-slate-50 p-2 rounded">
                        <span>Total Aset Lancar</span>
                        <span className="font-mono">{formatRupiah(reports.neraca.totalCurrentAssets)}</span>
                      </div>

                      <div className="text-xs font-bold text-slate-700 pt-2">B. ASET TETAP</div>
                      <div className="flex justify-between text-xs py-1 pl-3 border-b border-slate-50">
                        <span className="text-slate-600">Peralatan & Aset Tetap</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatRupiah(reports.neraca.fixedAssets.peralatan)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1 pl-3 border-b border-slate-50">
                        <span className="text-slate-600">Akumulasi Penyusutan</span>
                        <span className="font-mono font-bold text-rose-500">
                          ({formatRupiah(reports.neraca.fixedAssets.akumulasiPenyusutan)})
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold bg-slate-50 p-2 rounded">
                        <span>Aset Tetap Bersih</span>
                        <span className="font-mono">{formatRupiah(reports.neraca.fixedAssets.net)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center text-xs sm:text-sm font-extrabold text-[#6777ef]">
                      <span>TOTAL ASET</span>
                      <span className="font-mono">{formatRupiah(reports.neraca.totalAssets)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-slate-900 border-b-2 border-emerald-500 pb-1">
                      KEWAJIBAN & EKUITAS (PASIVA)
                    </h3>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">A. KEWAJIBAN (UTANG)</div>
                      {reports.neraca.liabilities.map((l: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 pl-3 border-b border-slate-50">
                          <span className="text-slate-600">{l.name}</span>
                          <span className="font-mono font-bold text-slate-800">{formatRupiah(l.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold bg-slate-50 p-2 rounded">
                        <span>Total Kewajiban</span>
                        <span className="font-mono">{formatRupiah(reports.neraca.totalLiabilities)}</span>
                      </div>

                      <div className="text-xs font-bold text-slate-700 pt-2">B. EKUITAS (MODAL)</div>
                      {reports.neraca.equity.map((eq: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 pl-3 border-b border-slate-50">
                          <span className="text-slate-600">{eq.name}</span>
                          <span className="font-mono font-bold text-slate-800">{formatRupiah(eq.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-bold bg-slate-50 p-2 rounded">
                        <span>Total Ekuitas</span>
                        <span className="font-mono text-emerald-600">{formatRupiah(reports.neraca.totalEquity)}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs sm:text-sm font-extrabold text-emerald-700">
                      <span>TOTAL KEWAJIBAN & EKUITAS</span>
                      <span className="font-mono">{formatRupiah(reports.neraca.totalLiabilitiesAndEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* TAB: 3. PERUBAHAN MODAL (LPE) */}
            {activeTab === "lpe" && reports && (
              <div className="max-w-3xl mx-auto space-y-4">
                {renderReportYearFilter("Perubahan Ekuitas")}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-8 space-y-6">
                  <div className="text-center border-b border-slate-200 pb-5">
                    <div className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-[#6777ef]">
                      Standar Kepmendesa PDTT No. 136 Tahun 2022
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">LAPORAN PERUBAHAN EKUITAS (LPE)</h2>
                    <p className="text-xs text-slate-500 font-medium">{settings.bumdes_name || "BUM Desa Barokah"} &bull; Periode Tahun {selectedYear}</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">1. Penyertaan Modal Desa Awal (APBDes)</span>
                      <span className="font-mono font-bold">{formatRupiah(reports.lpe.modalAwalDesa)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">2. Penyertaan Modal Masyarakat Awal</span>
                      <span className="font-mono font-bold">{formatRupiah(reports.lpe.modalAwalMasyarakat)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">3. Penambahan / Pengurangan Modal Periode Berjalan</span>
                      <span className="font-mono font-bold">Rp 0</span>
                    </div>
                    <div className="flex justify-between py-2.5 font-bold bg-slate-50 px-2 rounded">
                      <span>Jumlah Penyertaan Modal Akhir</span>
                      <span className="font-mono">{formatRupiah(reports.lpe.totalPenyertaanModalAkhir)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">4. Saldo Laba Awal (Cadangan Modal)</span>
                      <span className="font-mono font-bold">{formatRupiah(reports.lpe.saldoLabaAwal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">5. Laba Bersih Tahun Berjalan</span>
                      <span className="font-mono font-bold text-emerald-600">+{formatRupiah(reports.lpe.labaPeriodeBerjalan)}</span>
                    </div>
                    <div className="flex justify-between py-2.5 font-bold bg-slate-50 px-2 rounded">
                      <span>Saldo Laba Akhir</span>
                      <span className="font-mono text-emerald-600">{formatRupiah(reports.lpe.saldoLabaAkhir)}</span>
                    </div>

                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center text-xs sm:text-sm font-black text-[#6777ef]">
                      <span>EKUITAS AKHIR BUMDES</span>
                      <span className="font-mono">{formatRupiah(reports.lpe.ekuitasAkhir)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: 4. ARUS KAS (LAK) */}
            {activeTab === "lak" && reports && (
              <div className="max-w-3xl mx-auto space-y-4">
                {renderReportYearFilter("Arus Kas")}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-8 space-y-6">
                  <div className="text-center border-b border-slate-200 pb-5">
                    <div className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-[#6777ef]">
                      Metode Langsung (Direct Cash Flow) - Kepmendes 136
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">LAPORAN ARUS KAS (LAK)</h2>
                    <p className="text-xs text-slate-500 font-medium">{settings.bumdes_name || "BUM Desa Barokah"} &bull; Periode Tahun {selectedYear}</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 bg-slate-50 p-2 rounded">
                        I. AKTIVITAS OPERASIONAL
                      </h4>
                      <div className="space-y-1.5 pl-3">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">Arus Kas Masuk dari Operasional Usaha</span>
                          <span className="font-mono font-bold text-emerald-600">+{formatRupiah(reports.lak.operasi.masuk)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">Arus Kas Keluar untuk Beban Operasional</span>
                          <span className="font-mono font-bold text-rose-500">-{formatRupiah(reports.lak.operasi.keluar)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold">
                          <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                          <span className="font-mono text-emerald-700">{formatRupiah(reports.lak.operasi.bersih)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 bg-slate-50 p-2 rounded">
                        II. AKTIVITAS INVESTASI
                      </h4>
                      <div className="space-y-1.5 pl-3">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">Perolehan / Pembelian Aset Tetap</span>
                          <span className="font-mono font-bold text-slate-800">-{formatRupiah(reports.lak.investasi.keluar)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold">
                          <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                          <span className="font-mono">{formatRupiah(reports.lak.investasi.bersih)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 bg-slate-50 p-2 rounded">
                        III. AKTIVITAS PENDANAAN
                      </h4>
                      <div className="space-y-1.5 pl-3">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-600">Penerimaan Penyertaan Modal APBDes / Masyarakat</span>
                          <span className="font-mono font-bold text-emerald-600">+{formatRupiah(reports.lak.pendanaan.masuk)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold">
                          <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                          <span className="font-mono text-emerald-700">{formatRupiah(reports.lak.pendanaan.bersih)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs sm:text-sm font-black text-emerald-800">
                      <div>
                        <span>SALDO KAS AKHIR PERIODE</span>
                        <p className="text-[11px] font-normal text-slate-500">Sama persis dengan Kas & Bank di Neraca.</p>
                      </div>
                      <span className="font-mono text-sm sm:text-base">{formatRupiah(reports.lak.saldoKasAkhir)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: 5. CaLK */}
            {activeTab === "calk" && (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportYearFilter("CaLK")}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-8 space-y-6">
                  <div className="text-center border-b border-slate-200 pb-5">
                    <div className="text-[11px] sm:text-xs uppercase font-extrabold tracking-widest text-[#6777ef]">
                      Standar Kepmendesa PDTT No. 136 Tahun 2022
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      CATATAN ATAS LAPORAN KEUANGAN (CaLK)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Tahun Anggaran {selectedYear}</p>
                  </div>

                  <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">1. INFORMASI UMUM ENTITAS</h3>
                      <p>
                        {settings.bumdes_name || "BUM Desa Barokah"} didirikan berdasarkan Peraturan Desa Nomor 02 Tahun 2021 sesuai amanat Undang-Undang No. 6 Tahun 2014 tentang Desa serta Peraturan Pemerintah No. 11 Tahun 2021 tentang Badan Usaha Milik Desa. BUM Desa ini beralamat di Desa Balongbesuk, Kabupaten Jombang, Jawa Timur.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">2. KEBIJAKAN AKUNTANSI PENTING</h3>
                      <p className="mb-2">
                        Laporan keuangan disusun berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dan Keputusan Menteri Desa, PDT, dan Transmigrasi No. 136 Tahun 2022.
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Dasar Penyusunan:</strong> Berdasarkan konsep biaya historis dan asas akrual untuk laba rugi serta asas kas untuk laporan arus kas.</li>
                        <li><strong>Kas dan Setara Kas:</strong> Mencakup uang tunai di kasir dan simpanan di rekening bank yang likuid tanpa batasan penarikan.</li>
                        <li><strong>Aset Tetap & Penyusutan:</strong> Dinyatakan sebesar harga perolehan dikurangi akumulasi penyusutan menggunakan metode garis lurus (*straight-line method*).</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">3. RINCIAN POS KAS & SETARA KAS</h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span>Kas Tunai di Bendahara</span>
                          <span className="font-mono font-bold">{formatRupiah(totalKas)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold text-slate-900">
                          <span>Total Kas & Setara Kas</span>
                          <span className="font-mono text-[#6777ef]">{formatRupiah(totalKas)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">4. PERTANGGUNGJAWABAN & PENGESAHAN</h3>
                      <p>
                        Laporan Keuangan ini telah diperiksa dan disetujui dalam Musyawarah Desa (Musdes) Laporan Pertanggungjawaban (LPJ) BUM Desa Tahun Anggaran {selectedYear}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: COA DINAMIS */}
            {activeTab === "coa" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Bagan Akun Standar (COA Dinamis)</h3>
                      <p className="text-xs text-slate-500">
                        Daftar 220 Akun Resmi Kepmendes 136. Anda dapat menambahkan rekening bank atau pos unit usaha baru dengan bantuan AI & rekomendasi kode otomatis.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCoaModal(true)}
                      className="bg-[#6777ef] hover:bg-[#5868e4] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs w-full sm:w-auto justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Akun Baru (Dinamis)</span>
                    </button>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px]">
                      <thead className="bg-[#f8fafc] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-4">Kode Akun</th>
                          <th className="py-3 px-4">Nama Akun</th>
                          <th className="py-3 px-4">Kategori Akuntansi</th>
                          <th className="py-3 px-4 text-center">Saldo Normal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {coaList.map((acc) => (
                          <tr key={acc.code} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-mono font-bold text-[#6777ef]">{acc.code}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">{acc.name}</td>
                            <td className="py-2.5 px-4">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {acc.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center font-semibold text-slate-600">{acc.normal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS & GEMINI AI */}
            {activeTab === "settings" && currentUser?.role === "ADMIN" && (
              <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 shadow-xs space-y-8">
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#6777ef]" />
                    {isAiConfigured ? "Pengaturan BUMDes & Gemini AI" : "Pengaturan Profil & Sistem BUMDes"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Konfigurasi logo resmi, identitas lembaga, pejabat penandatangan dokumen (Kepmendes 136/2022), serta integrasi Gemini AI opsional.
                  </p>
                </div>

                {/* KARTU STATUS KUNCI & KUOTA KREDIT GEMINI AI (Hanya jika API key diisi) */}
                {isAiConfigured && aiStatus && (
                  <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white text-slate-800 shadow-sm border border-indigo-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-indigo-100/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-[#6777ef] flex items-center justify-center shrink-0 shadow-2xs border border-indigo-200/50">
                          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 flex-wrap">
                            <span>Status & Kuota Kredit Gemini AI</span>
                            {aiStatus.keyValid ? (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Kunci Aktif
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                ⚠ Kunci Tidak Valid / Belum Dikonfigurasi
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {aiStatus.quotaInfo?.tierName || "Google AI Studio Free Tier"} &bull; Kuota di-reset otomatis setiap hari oleh Google.
                          </p>
                        </div>
                      </div>

                      <a
                        href={aiStatus.quotaInfo?.quotaDashboardUrl || "https://aistudio.google.com/app/plan_information"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-2xs transition-all hover:shadow-xs self-start sm:self-auto shrink-0"
                      >
                        <span>Cek Kuota di Google Studio ↗</span>
                      </a>
                    </div>

                    {/* 3 Metrik Kuota */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5 pt-1">
                      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Model AI Terpilih
                        </span>
                        <div className="text-sm font-mono font-bold text-indigo-600 mt-0.5 truncate">
                          {settings.gemini_model || "gemini-3.5-flash-lite"}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {settings.gemini_model === "gemini-3.8-flash"
                            ? "Advanced Thinking"
                            : settings.gemini_model === "gemini-2.5-pro"
                            ? "Model Kualitas Tinggi"
                            : "Super Cepat (~2 dtk)"}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Sisa Kuota Hari Ini
                        </span>
                        <div className="text-sm font-bold text-emerald-600 mt-0.5">
                          {aiStatus.quotaInfo?.remainingRequestsToday ?? 1500} Request
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          dari batas {aiStatus.quotaInfo?.freeDailyQuota ?? 1500} req/hari (Gratis)
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Batas Kecepatan (Rate Limit)
                        </span>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {aiStatus.quotaInfo?.rateLimitRpm || "15 RPM (Request Per Menit)"}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Biaya: {aiStatus.quotaInfo?.costPerRequest || "Rp 0 (100% Gratis)"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Kuota Harian */}
                    <div className="mt-3.5 pt-3.5 border-t border-indigo-100/80">
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-slate-500 font-medium">Penggunaan Kuota Hari Ini:</span>
                        <span className="font-bold text-slate-800">
                          {aiStatus.quotaInfo?.todayUsage ?? 0} / {aiStatus.quotaInfo?.freeDailyQuota ?? 1500} request ({((aiStatus.quotaInfo?.todayUsage ?? 0) / (aiStatus.quotaInfo?.freeDailyQuota ?? 1500) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 border border-slate-200/70 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-[#6777ef] h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(1, ((aiStatus.quotaInfo?.todayUsage ?? 0) / (aiStatus.quotaInfo?.freeDailyQuota ?? 1500) * 100)))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const updates = Object.fromEntries(formData.entries())
                    updates.bumdes_logo = logoPreview
                    if (updates.leader_name) {
                      updates.village_head = updates.leader_name
                    }
                    try {
                      const res = await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updates)
                      })
                      const json = await res.json()
                      if (json.success) {
                        alert("Pengaturan BUMDes berhasil disimpan!")
                        loadData()
                      } else {
                        alert("Gagal menyimpan: " + (json.error || "Terjadi kesalahan."))
                      }
                    } catch (err: any) {
                      alert("Error: " + err.message)
                    }
                  }}
                  className="space-y-6 text-xs"
                >
                  {/* ================= BAGIAN 1: LOGO & IDENTITAS LEMBAGA ================= */}
                  <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider">
                      <Building2 className="w-4 h-4 text-[#6777ef]" />
                      <span>1. Logo Resmi & Identitas Lembaga BUMDes</span>
                    </div>

                    {/* UPLOAD LOGO BUMDES */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Logo Resmi BUMDes
                      </label>
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />
                      {logoPreview ? (
                        <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200">
                          <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                            <img
                              src={logoPreview}
                              alt="Pratinjau Logo BUMDes"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Logo BUMDes Siap Digunakan</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Logo akan otomatis dicetak pada lembar Kwitansi, Kop Laporan Keuangan, dan Sampul LPJ.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#6777ef] font-bold text-[11px] transition-colors"
                              >
                                Ganti Logo
                              </button>
                              <button
                                type="button"
                                onClick={() => setLogoPreview("")}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => logoInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 hover:border-[#6777ef] hover:bg-indigo-50/30 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-colors bg-white group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6777ef] group-hover:scale-105 transition-transform flex items-center justify-center mx-auto mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="font-bold text-slate-800 text-xs">
                            Klik di sini untuk mengunggah Logo BUMDes
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Format didukung: PNG, JPG, WEBP, atau SVG (Maks. 3MB, otomatis dioptimasi)
                          </p>
                        </div>
                      )}
                    </div>

                    {/* NAMA BUMDES */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Resmi BUMDes
                      </label>
                      <input
                        type="text"
                        name="bumdes_name"
                        defaultValue={settings.bumdes_name || "BUM Desa Barokah"}
                        placeholder="Contoh: BUM Desa Barokah Balongbesuk"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef] font-semibold text-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Nama entitas hukum BUMDes yang tercantum pada sertifikat Kemenkumham RI.
                      </p>
                    </div>

                    {/* GRID WILAYAH */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nama Desa</label>
                        <input
                          type="text"
                          name="village_name"
                          defaultValue={settings.village_name || "Balongbesuk"}
                          placeholder="Contoh: Balongbesuk"
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kecamatan</label>
                        <input
                          type="text"
                          name="subdistrict_name"
                          defaultValue={settings.subdistrict_name || "Diwek"}
                          placeholder="Contoh: Diwek"
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
                        <input
                          type="text"
                          name="regency_name"
                          defaultValue={settings.regency_name || "Jombang"}
                          placeholder="Contoh: Jombang"
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
                        />
                      </div>
                    </div>

                    {/* ALAMAT */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alamat Kantor BUMDes</label>
                      <input
                        type="text"
                        name="bumdes_address"
                        defaultValue={settings.bumdes_address || ""}
                        placeholder="Contoh: Jl. Raya Balongbesuk No. 12, Kec. Diwek, Kab. Jombang"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
                      />
                    </div>
                  </div>

                  {/* ================= BAGIAN 2: DATA PEJABAT PENANDATANGAN ================= */}
                  <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider">
                      <Users className="w-4 h-4 text-[#6777ef]" />
                      <span>2. Data Pejabat Penandatangan Dokumen (Kepmendes 136/2022)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* PENASIHAT (KEPALA DESA) */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>Penasihat (Kepala Desa)</span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nama Kepala Desa
                          </label>
                          <input
                            type="text"
                            name="leader_name"
                            defaultValue={settings.leader_name || settings.village_head || ""}
                            placeholder="Contoh: Mochamad Saifur"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            NIP / NIK Kepala Desa
                          </label>
                          <input
                            type="text"
                            name="leader_nip"
                            defaultValue={settings.leader_nip || ""}
                            placeholder="Contoh: 19800812 201001 1 003"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                      </div>

                      {/* KETUA BADAN PENGAWAS */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Ketua Badan Pengawas</span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nama Ketua Pengawas
                          </label>
                          <input
                            type="text"
                            name="supervisor_name"
                            defaultValue={settings.supervisor_name || ""}
                            placeholder="Contoh: Sadji Abdullah"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            NIP / NIK Pengawas
                          </label>
                          <input
                            type="text"
                            name="supervisor_nip"
                            defaultValue={settings.supervisor_nip || ""}
                            placeholder="Contoh: 3517112233440003"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                      </div>

                      {/* DIREKTUR BUMDES */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                          <Building2 className="w-4 h-4 text-[#6777ef]" />
                          <span>Pelaksana Operasional (Direktur)</span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nama Direktur BUMDes
                          </label>
                          <input
                            type="text"
                            name="director_name"
                            defaultValue={settings.director_name || "H. Ahmad Subari, S.E."}
                            placeholder="Contoh: Dodik Susanto, S.Fil.I"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            NIP / NIK Direktur
                          </label>
                          <input
                            type="text"
                            name="director_nip"
                            defaultValue={settings.director_nip || ""}
                            placeholder="Contoh: 3517123456780001"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                      </div>

                      {/* BENDAHARA / KASIR */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          <span>Bendahara / Kasir</span>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nama Bendahara
                          </label>
                          <input
                            type="text"
                            name="treasurer_name"
                            defaultValue={settings.treasurer_name || "Siti Fatimah"}
                            placeholder="Contoh: Mamik Kurniawati"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            NIP / NIK Bendahara
                          </label>
                          <input
                            type="text"
                            name="treasurer_nip"
                            defaultValue={settings.treasurer_nip || ""}
                            placeholder="Contoh: 3517098765430002"
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PETUGAS PEMBUKUAN (OPERATOR) */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Petugas Pembukuan (Operator Input Akuntansi)
                      </label>
                      <input
                        type="text"
                        name="operator_name"
                        defaultValue={settings.operator_name || "Budi Santoso"}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Pejabat yang menandatangani kolom &ldquo;Pembukuan&rdquo; pada form Bukti Kas Masuk (BKM) dan Bukti Kas Keluar (BKK).
                      </p>
                    </div>
                  </div>

                  {/* ================= BAGIAN 3: INTEGRASI GOOGLE GEMINI AI ================= */}
                  <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>3. Integrasi Google Gemini AI (Opsional)</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Google Gemini API Key</label>
                      <input
                        type="password"
                        name="gemini_api_key"
                        defaultValue={settings.gemini_api_key || ""}
                        placeholder="AIzaSy..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#6777ef]"
                      />
                      {!isAiConfigured ? (
                        <p className="text-[11px] text-amber-700 mt-1.5 bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg leading-relaxed">
                          💡 <strong>Catatan:</strong> Fitur input transaksi otomatis Chat Gemini AI saat ini <strong>disembunyikan</strong>. Dapatkan kunci API secara gratis dari <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#6777ef] underline font-bold">Google AI Studio</a> lalu simpan di atas untuk mengaktifkannya.
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                          ✓ Fitur Gemini AI aktif. Hapus isi kolom di atas dan simpan jika ingin menonaktifkan & menyembunyikan seluruh fitur AI.
                        </p>
                      )}
                    </div>

                    {/* PILIHAN MODEL GEMINI AI */}
                    {isAiConfigured && (
                      <div className="animate-in fade-in">
                        <label className="block font-bold text-slate-700 mb-1">
                          Pilihan Model Gemini AI
                        </label>
                        <select
                          name="gemini_model"
                          defaultValue={settings.gemini_model || "gemini-3.5-flash-lite"}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#6777ef]"
                        >
                          <option value="gemini-3.5-flash-lite">
                            ⚡ Gemini 3.5 Flash Lite (Rekomendasi - Super Cepat ~2 dtk, Paling Hemat Kuota)
                          </option>
                          <option value="gemini-3.5-flash">
                            🚀 Gemini 3.5 Flash (Seimbang - Cepat & Cerdas untuk Kalimat Panjang)
                          </option>
                          <option value="gemini-3.8-flash">
                            🧠 Gemini 3.8 Flash (Penalaran Lanjutan - Advanced Reasoning Multi-Pos)
                          </option>
                          <option value="gemini-2.5-pro">
                            💎 Gemini 2.5 Pro (Model Kualitas Maksimal untuk Analisis Rumit)
                          </option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Model Flash Lite sangat disarankan untuk operasional desa karena memiliki latensi tercepat dan menghemat pemakaian kuota token harian.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* TOMBOL SIMPAN */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-[#6777ef] hover:bg-[#5868e4] text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-indigo-200 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Seluruh Pengaturan BUMDes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: TUTUP & BUKA BUKU (HANYA ADMIN) */}
            {activeTab === "closing" && (
              currentUser?.role === "ADMIN" ? (
                <ClosingTab
                  selectedYear={selectedYear}
                  onSelectYear={(yr) => setSelectedYear(yr)}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onRefresh={() => loadData(selectedYear)}
                  closingList={closingList}
                  reports={reports}
                  accounts={coaList}
                  settings={settings}
                />
              ) : (
                <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base mb-1">Akses Terbatas (Khusus Admin)</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Menu Tutup & Buka Buku memerlukan hak otorisasi Administrator BUMDes untuk menjaga integritas penutupan pembukuan dan arsip LPJ resmi.
                  </p>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="px-4 py-2 bg-[#6777ef] text-white rounded-xl text-xs font-bold hover:bg-[#5868e4] shadow-xs transition-all"
                  >
                    Kembali ke Dashboard
                  </button>
                </div>
              )
            )}

            {/* TAB: PEMELIHARAAN SISTEM (USERS, BACKUP, RESTORE, RESET) */}
            {activeTab === "maintenance" && currentUser?.role === "ADMIN" && (
              <SystemMaintenanceTab
                currentUser={currentUser}
                onRefresh={() => loadData()}
              />
            )}
          </main>
        </div>
      </div>

      {/* ===================== LOGIN MODAL (JIKA BELUM LOGIN) ===================== */}
      {!authLoading && !currentUser && (
        <LoginModal onSuccess={(user) => setCurrentUser(user)} />
      )}

      {/* ===================== MODAL CETAK KWITANSI ===================== */}
      {selectedKwitansi && (
        <KwitansiModal
          entry={selectedKwitansi}
          onClose={() => setSelectedKwitansi(null)}
          settings={settings}
          onUploadedSigned={(newUrl) => {
            loadData()
            setSelectedKwitansi((prev: any) =>
              prev ? { ...prev, attachmentUrl: newUrl, verificationStatus: "SIGNED_UPLOADED" } : null
            )
          }}
        />
      )}

      {/* ===================== MODAL CATAT MANUAL (ISOLATED ZERO-LAG) ===================== */}
      <ManualTransactionModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => {
          alert("Transaksi berhasil dicatat ke Buku Kas & Jurnal!")
          loadData()
        }}
        coaList={coaList}
      />

      {/* ===================== ISOLATED ADD COA MODAL (ZERO LAG) ===================== */}
      <AddCoaModal
        isOpen={showCoaModal}
        onClose={() => setShowCoaModal(false)}
        onSuccess={loadData}
        coaList={coaList}
        standardGroups={standardGroups}
      />

      {/* ===================== MODAL KONFIRMASI HAPUS TRANSAKSI (ADMIN ONLY) ===================== */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Hapus Transaksi Kas?
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Anda akan menghapus transaksi berikut secara permanen dari Buku Kas dan Laporan Keuangan resmi:
            </p>

            <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nomor Bukti:</span>
                <span className="font-mono font-bold text-slate-800">
                  {deletingTransaction.proofNumber || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Uraian:</span>
                <span className="font-bold text-slate-800 text-right max-w-[220px] truncate" title={deletingTransaction.description}>
                  {deletingTransaction.description}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pihak:</span>
                <span className="font-semibold text-slate-700">
                  {deletingTransaction.payeeOrPayer}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Total Nominal:</span>
                <span className="font-mono font-black text-rose-600 text-sm">
                  {formatRupiah(
                    deletingTransaction.lines?.[0]?.amount ||
                    deletingTransaction.lines?.reduce((s: number, l: any) => l.type === "DEBIT" ? s + l.amount : s, 0) ||
                    0
                  )}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed mb-5">
              <strong>Peringatan:</strong> Seluruh baris jurnal berpasangan akan dihapus permanen. Laporan Laba Rugi dan Neraca akan otomatis disesuaikan ulang.
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeletingTransaction(null)
                  setDeleteError(null)
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteTransaction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? "Menghapus..." : "Ya, Hapus Transaksi Ini"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
