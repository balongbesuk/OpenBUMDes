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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
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
import { formatRupiah, safePrintElement } from "@/lib/utils"
import KwitansiModal from "@/components/KwitansiModal"
import AddCoaModal from "@/components/AddCoaModal"
import EditCoaModal from "@/components/EditCoaModal"
import ClosingTab from "@/components/ClosingTab"
import LoginModal from "@/components/LoginModal"
import SystemMaintenanceTab from "@/components/SystemMaintenanceTab"
import InlinePartyEditor from "@/components/InlinePartyEditor"
import { ManualTransactionModal } from "@/components/ManualTransactionModal"
import GeneralLedgerTab from "@/components/GeneralLedgerTab"
import TrialBalanceTab from "@/components/TrialBalanceTab"
import SubsidiaryLedgerTab from "@/components/SubsidiaryLedgerTab"
import EisHealthTab from "@/components/EisHealthTab"

export default function StislaApp() {
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth User State
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; name: string; role: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

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
  const [eisData, setEisData] = useState<any>(null)
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

  // Modal New Account (COA Dinamis) & Pagination States
  const [showCoaModal, setShowCoaModal] = useState(false)
  const [coaSearch, setCoaSearch] = useState("")
  const [coaCategoryFilter, setCoaCategoryFilter] = useState("all")
  const [coaPage, setCoaPage] = useState(1)
  const [coaPerPage, setCoaPerPage] = useState(15)
  const [editingCoa, setEditingCoa] = useState<any | null>(null)
  const [resettingCoa, setResettingCoa] = useState(false)

  // Buku Kas & Jurnal Search & Pagination States
  const [cashBookSearch, setCashBookSearch] = useState("")
  const [cashBookPage, setCashBookPage] = useState(1)
  const [cashBookPerPage, setCashBookPerPage] = useState(15)

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

  // Restore baseline Kemendesa 136 COA accounts
  const handleResetDefaultCoa = async () => {
    if (!confirm("Apakah Anda yakin ingin memulihkan seluruh nama akun standar Kepmendesa No. 136/2022 ke nama bawaan sistem?\n\nCatatan: Akun kustom tambahan yang Anda buat sendiri tetap aman dan tidak akan terhapus.")) {
      return
    }
    setResettingCoa(true)
    try {
      const res = await fetch("/api/keuangan/coa/reset-default", {
        method: "POST"
      })
      const json = await res.json()
      if (json.success) {
        alert(json.message || "Bagan Akun standar berhasil dipulihkan.")
        loadData()
      } else {
        alert(json.error || "Gagal memulihkan bagan akun standar.")
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setResettingCoa(false)
    }
  }

  // Delete custom user account
  const handleDeleteCoa = async (acc: any) => {
    if (acc.isStandard) {
      alert("Akun standar Kepmendesa No. 136/2022 tidak dapat dihapus karena merupakan bagan akun acuan wajib sistem. Anda dapat menyesuaikan namanya menggunakan tombol Edit.")
      return
    }
    if (!confirm(`Hapus akun kustom "${acc.code} - ${acc.name}" secara permanen?`)) {
      return
    }
    try {
      const res = await fetch(`/api/keuangan/coa?code=${encodeURIComponent(acc.code)}`, {
        method: "DELETE"
      })
      const json = await res.json()
      if (json.success) {
        alert(json.message || "Akun berhasil dihapus.")
        loadData()
      } else {
        alert(json.error || "Gagal menghapus akun.")
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    }
  }

  // Load Data
  const loadData = async (targetYear = selectedYear) => {
    setLoading(true)
    try {
      const [resEntries, resCoa, resRep, resSet, resGroups, resAiStatus, resClosing, resEis] = await Promise.all([
        fetch(`/api/cash-book?month=${selectedMonth}&year=${targetYear}&proofType=${proofTypeFilter}`).then(r => r.json()),
        fetch("/api/keuangan/coa").then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`/api/reports?year=${targetYear}`).then(r => r.json()),
        fetch("/api/settings").then(r => r.json()),
        fetch("/api/keuangan/coa").then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch("/api/ai/status").then(r => r.json()).catch(() => null),
        fetch("/api/closing").then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`/api/eis?year=${targetYear}`).then(r => r.json()).catch(() => null)
      ])

      if (resEntries.success) setEntries(resEntries.data)
      if (resCoa.success) setCoaList(resCoa.data)
      if (resRep.success) setReports({ ...resRep.data, isArchived: resRep.isArchived, closingMeta: resRep.closingMeta })
      if (resEis && resEis.success) setEisData(resEis)
      if (resSet.success) {
        setSettings(resSet.data)
        if (resSet.data.bumdes_logo) {
          setLogoPreview(resSet.data.bumdes_logo)
        }
      }
      if (resCoa.groups) setStandardGroups(resCoa.groups)
      else if (resGroups.success && resGroups.data?.groups) setStandardGroups(resGroups.data.groups)
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  // Health Score (0-100) Diselaraskan Penuh dengan EIS Standar PPAK 4.5
  const healthScore = eisData?.meta?.totalScore ?? (hasFinancialData ? 53 : 0)
  const healthCategory = eisData?.meta?.category || (healthScore >= 65 ? "SEHAT" : healthScore >= 30 ? "KURANG SEHAT" : "TIDAK SEHAT")

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
    if (healthCategory === "SEHAT") {
      return {
        text: `SEHAT (${healthScore} Poin)`,
        color: "bg-emerald-500 text-white",
        border: "border-emerald-300",
        bgLight: "bg-emerald-50",
        subtext: "Kinerja Keuangan Optimal (Standar PPAK 4.5)"
      }
    } else if (healthCategory === "KURANG SEHAT") {
      return {
        text: `KURANG SEHAT (${healthScore} Poin)`,
        color: "bg-amber-500 text-white",
        border: "border-amber-300",
        bgLight: "bg-amber-50",
        subtext: "Perlu Akselerasi Omzet & Penagihan Piutang"
      }
    } else {
      return {
        text: `TIDAK SEHAT (${healthScore} Poin)`,
        color: "bg-rose-500 text-white",
        border: "border-rose-300",
        bgLight: "bg-rose-50",
        subtext: "Kondisi Keuangan Kritis (Perlu Restrukturisasi)"
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

  // --- HELPER CETAK BERSIH LAPORAN RESMI (A4 PRINT VIEW - AMAN DARI DOM XSS) ---
  const handlePrintDocument = (elementId: string, docTitle: string) => {
    const printContent = document.getElementById(elementId)
    if (!printContent) return
    safePrintElement(
      printContent,
      `${docTitle} - ${settings.bumdes_name || "PPAK BUMDesa"} TA ${selectedYear}`
    )
  }

  // --- KOP RESMI LAPORAN KEUANGAN KEMENDES 136 ---
  const renderReportKop = (reportTitle: string, subtitle?: string) => (
    <div className="border-b-2 border-slate-800 pb-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {(settings.bumdes_logo || logoPreview) ? (
            <img
              src={settings.bumdes_logo || logoPreview}
              alt="Logo BUMDes"
              className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center">
              {(settings.bumdes_name || "B").charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-black text-xl text-slate-900 uppercase tracking-tight">
              {settings.bumdes_name || "PPAK BUMDesa"}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Desa {settings.village_name || "Balongbesuk"}, Kecamatan {settings.subdistrict_name || "Diwek"}, Kabupaten {settings.regency_name || "Jombang"}
            </p>
            <p className="text-[11px] text-slate-500">
              {settings.bumdes_address || `Kantor BUMDes Desa ${settings.village_name || "Balongbesuk"}`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider">
            Kepmendes PDTT 136/2022
          </span>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            TA: {selectedYear}
          </p>
        </div>
      </div>

      <div className="text-center mt-5">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
          {reportTitle}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-600 font-bold mt-0.5">
            {subtitle}
          </p>
        )}
        <p className="text-xs text-slate-500 mt-0.5 italic">
          Periode Tahun Buku: {selectedYear}
        </p>
      </div>
    </div>
  )

  // --- LEMBAR TANDA TANGAN AUDIT / PENGESAHAN LAPORAN KEUANGAN ---
  const renderReportSignatures = (includePenasihat = false) => (
    <div className={`mt-12 pt-6 border-t border-slate-200 text-xs ${includePenasihat ? "grid grid-cols-1 sm:grid-cols-3 gap-6 text-center" : "grid grid-cols-2 text-center"}`}>
      {includePenasihat && (
        <div>
          <p className="text-slate-500 mb-1">Mengetahui & Menyetujui,</p>
          <p className="font-bold text-slate-800 uppercase">PENASIHAT (KEPALA DESA)</p>
          <div className="h-20"></div>
          <p className="font-bold text-slate-900 underline uppercase">{settings.village_head || "MOCHAMAD SAIFUR"}</p>
          <p className="text-[11px] text-slate-500">Pemerintah Desa {settings.village_name || "Balongbesuk"}</p>
        </div>
      )}

      <div>
        <p className="text-slate-500 mb-1">{includePenasihat ? "Menyetujui," : "Mengetahui,"}</p>
        <p className="font-bold text-slate-800 uppercase">DIREKTUR BUMDES</p>
        <div className="h-20"></div>
        <p className="font-bold text-slate-900 underline uppercase">{settings.director_name || "DODIK SUSANTO, S.Fil.I"}</p>
        <p className="text-[11px] text-slate-500">NIP. {settings.director_nip || "-"}</p>
      </div>

      <div>
        <p className="text-slate-500 mb-1">
          {settings.village_name || "Balongbesuk"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p className="font-bold text-slate-800 uppercase">BENDAHARA / PETUGAS AKUNTANSI</p>
        <div className="h-20"></div>
        <p className="font-bold text-slate-900 underline uppercase">{settings.treasurer_name || "MAMIK KURNIAWATI"}</p>
        <p className="text-[11px] text-slate-500">NIP. {settings.treasurer_nip || "-"}</p>
      </div>
    </div>
  )

  const renderReportYearFilter = (reportTitle?: string, printElementId?: string) => (
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

        {printElementId && (
          <button
            type="button"
            onClick={() => handlePrintDocument(printElementId, reportTitle || "Laporan Keuangan")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#6777ef] text-white text-xs font-bold hover:bg-[#5868e4] shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak {reportTitle || "Laporan"}</span>
          </button>
        )}
      </div>
    </div>
  )

  // JIKA BELUM LOGIN: Tampilkan Halaman Masuk Layar Ganda Eksklusif
  if (!authLoading && !currentUser) {
    return (
      <LoginModal
        settings={settings}
        onSuccess={(user) => {
          setCurrentUser(user)
          loadData()
        }}
      />
    )
  }

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
                  onClick={() => handleNavClick("eis")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-left transition-all ${
                    activeTab === "eis"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Activity className="w-5 h-5 shrink-0" />
                  <span className="text-left leading-tight">EIS / Kesehatan BUMDes</span>
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

            {/* ===================== GRUP KHUSUS TERPISAH: BUKU & AUDIT INSPEKTORAT ===================== */}
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Buku & Audit Inspektorat</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Audit
                </span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavClick("general-ledger")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                    activeTab === "general-ledger"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span className="text-left leading-tight">Buku Besar (General Ledger)</span>
                </button>

                <button
                  onClick={() => handleNavClick("trial-balance")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                    activeTab === "trial-balance"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Scale className="w-4 h-4 shrink-0" />
                  <span className="text-left leading-tight">Neraca Saldo (Trial Balance)</span>
                </button>

                <button
                  onClick={() => handleNavClick("sub-ledger")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                    activeTab === "sub-ledger"
                      ? "bg-[#6777ef] text-white shadow-md shadow-indigo-200 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="text-left leading-tight">Buku Pembantu Piutang/Utang</span>
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

              {/* USER PROFILE CARD & INTERACTIVE MENU */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all duration-200 group text-left ${
                    showUserDropdown
                      ? "bg-indigo-50/90 border-indigo-200 shadow-xs ring-2 ring-indigo-100"
                      : "bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-xs"
                  }`}
                  aria-expanded={showUserDropdown}
                  title="Klik untuk membuka menu profil & akun"
                >
                  {/* Avatar with Gradient & Status Indicator */}
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                      {currentUser?.name?.charAt(0) || "U"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </div>

                  {/* Name & Role */}
                  <div className="hidden sm:block leading-tight pr-1">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                      {currentUser?.name || "Pengguna BUMDes"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                          currentUser?.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700 border border-purple-200/60"
                            : "bg-blue-100 text-blue-700 border border-blue-200/60"
                        }`}
                      >
                        {currentUser?.role === "ADMIN" ? "ADMINISTRATOR" : "OPERATOR KAS"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 hidden sm:block ${
                      showUserDropdown ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>

                {/* DROPDOWN POPOVER MENU */}
                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header Profil Lengkap */}
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-xl border border-slate-100 mb-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-md shrink-0 ring-2 ring-white">
                          {currentUser?.name?.charAt(0) || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {currentUser?.name || "Pengguna"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            @{currentUser?.username || "admin"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider">
                              Sesi Aktif &bull; {currentUser?.role === "ADMIN" ? "Akses Penuh" : "Akses Kasir"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate">{settings.bumdes_name || "BUM Desa"}</span>
                        <span className="font-semibold text-slate-600 shrink-0">TA {selectedYear}</span>
                      </div>
                    </div>

                    {/* Navigasi Cepat Pengguna */}
                    <div className="space-y-0.5 text-xs py-1">
                      {currentUser?.role === "ADMIN" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("settings")
                              setShowUserDropdown(false)
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 font-semibold transition-colors text-left"
                          >
                            <Sliders className="w-4 h-4 text-slate-400" />
                            <span>Pengaturan Instansi & AI</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("maintenance")
                              setShowUserDropdown(false)
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 font-semibold transition-colors text-left"
                          >
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>Kelola Akun & Database</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("cash-book")
                          setShowUserDropdown(false)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 font-semibold transition-colors text-left"
                      >
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>Buku Kas & Jurnal</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 my-1"></div>

                    {/* Tombol Logout Resmi */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                        <span>Keluar dari Akun</span>
                      </div>
                      <span className="text-[10px] text-rose-400 font-normal">Logout</span>
                    </button>
                  </div>
                )}
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

                    <div
                      onClick={() => handleNavClick("eis")}
                      className="flex items-center justify-between sm:justify-start gap-4 sm:gap-5 bg-[#f8fafc] hover:bg-slate-100/80 transition-all p-3.5 sm:p-4 rounded-xl border border-slate-200 shrink-0 cursor-pointer group"
                      title="Klik untuk membuka rincian 8 Indikator EIS"
                    >
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
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                          <span>{healthBadge.subtext}</span>
                          <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">➔</span>
                        </p>
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

                {/* EXECUTIVE STAT CARDS FOR BUKU KAS & JURNAL */}
                {(() => {
                  const q = cashBookSearch.toLowerCase().trim()
                  const filteredEntries = entries.filter((e: any) => {
                    if (attachmentFilter === "signed" && !e.attachmentUrl) return false
                    if (attachmentFilter === "unsigned" && !!e.attachmentUrl) return false

                    if (q) {
                      const matchProof = e.proofNumber?.toLowerCase().includes(q)
                      const matchDesc = e.description?.toLowerCase().includes(q)
                      const matchParty = e.payeeOrPayer?.toLowerCase().includes(q)
                      const matchAccount = e.lines?.some(
                        (l: any) =>
                          l.accountCode?.toLowerCase().includes(q) ||
                          getAccountName(l.accountCode)?.toLowerCase().includes(q)
                      )
                      if (!matchProof && !matchDesc && !matchParty && !matchAccount) return false
                    }
                    return true
                  })

                  const totalFilteredCount = filteredEntries.length
                  const signedCount = filteredEntries.filter((e: any) => !!e.attachmentUrl).length
                  const totalDebit = filteredEntries.reduce(
                    (sum: number, e: any) =>
                      sum +
                      (e.lines
                        ?.filter((l: any) => l.type === "DEBIT")
                        .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0) || 0),
                    0
                  )
                  const totalCredit = filteredEntries.reduce(
                    (sum: number, e: any) =>
                      sum +
                      (e.lines
                        ?.filter((l: any) => l.type === "CREDIT")
                        .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0) || 0),
                    0
                  )
                  const bkmTotal = filteredEntries
                    .filter((e: any) => e.proofType === "BKM")
                    .reduce(
                      (sum: number, e: any) =>
                        sum +
                        (e.lines
                          ?.filter((l: any) => l.type === "DEBIT")
                          .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0) || 0),
                      0
                    )
                  const bkkTotal = filteredEntries
                    .filter((e: any) => e.proofType === "BKK")
                    .reduce(
                      (sum: number, e: any) =>
                        sum +
                        (e.lines
                          ?.filter((l: any) => l.type === "CREDIT")
                          .reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0) || 0),
                      0
                    )
                  const isBalanced = Math.abs(totalDebit - totalCredit) < 1

                  // Paginasi
                  const totalPages =
                    cashBookPerPage === 0 ? 1 : Math.ceil(filteredEntries.length / cashBookPerPage) || 1
                  const currentPage = Math.min(Math.max(1, cashBookPage), totalPages)
                  const startIndex =
                    cashBookPerPage === 0 ? 0 : (currentPage - 1) * cashBookPerPage
                  const endIndex =
                    cashBookPerPage === 0
                      ? filteredEntries.length
                      : Math.min(startIndex + cashBookPerPage, filteredEntries.length)
                  const paginatedEntries =
                    cashBookPerPage === 0
                      ? filteredEntries
                      : filteredEntries.slice(startIndex, endIndex)

                  return (
                    <div className="space-y-4">
                      {/* STAT CARDS */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Total Transaksi
                            </span>
                            <BookOpen className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="text-lg sm:text-xl font-black text-slate-800 mt-1 font-mono">
                            {totalFilteredCount}{" "}
                            <span className="text-xs font-semibold text-slate-500">Item</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {selectedMonth === "all"
                              ? `TA ${selectedYear} Penuh`
                              : `Bulan ${selectedMonth} ${selectedYear}`}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                              Kas Masuk (BKM)
                            </span>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1 font-mono">
                            {formatRupiah(bkmTotal)}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Penerimaan kas periode ini</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
                              Kas Keluar (BKK)
                            </span>
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                          </div>
                          <div className="text-lg sm:text-xl font-black text-rose-500 mt-1 font-mono">
                            {formatRupiah(bkkTotal)}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Pengeluaran kas operasional</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#6777ef] uppercase tracking-wider block">
                              Keseimbangan
                            </span>
                            <Scale className="w-4 h-4 text-[#6777ef]" />
                          </div>
                          <div className="text-lg sm:text-xl font-black text-[#6777ef] mt-1 font-mono">
                            {isBalanced ? "100% Klir" : "Ada Selisih"}
                          </div>
                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                            {isBalanced
                              ? "Debit = Kredit (Seimbang)"
                              : `Selisih: ${formatRupiah(Math.abs(totalDebit - totalCredit))}`}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Bukti Fisik TTD
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div className="text-lg sm:text-xl font-black text-slate-800 mt-1 font-mono">
                            {signedCount}/{totalFilteredCount}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {totalFilteredCount > 0
                              ? `${Math.round((signedCount / totalFilteredCount) * 100)}% Kwitansi Ber-TTD`
                              : "0% Lengkap"}
                          </p>
                        </div>
                      </div>

                      {/* MAIN AUDIT TABLE CONTAINER */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        {/* HEADER BANNER */}
                        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                Buku Kas Umum (Jurnal Harian)
                              </h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  signedCount === totalFilteredCount && totalFilteredCount > 0
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {signedCount}/{totalFilteredCount} Bukti Fisik Ber-TTD
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                TA {selectedYear}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Seluruh penerimaan & pengeluaran kas tersimpan kronologis berpasangan sesuai standar Kepmendes 136/2022.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Tombol Unduh Excel 1 Tahun Penuh */}
                            <a
                              href={`/api/cash-book/export-excel?year=${encodeURIComponent(
                                String(selectedYear).replace(/[^0-9]/g, "")
                              )}`}
                              download
                              title={`Unduh seluruh transaksi Buku Kas & Jurnal selama 1 Tahun Penuh (${selectedYear}) ke Excel (.xlsx)`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Unduh Excel (1 Thn)</span>
                            </a>

                            <button
                              onClick={() => setShowManualModal(true)}
                              className="bg-[#6777ef] hover:bg-[#5868e4] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Catat Manual</span>
                            </button>
                          </div>
                        </div>

                        {/* TOOLBAR FILTER & SEARCH */}
                        <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                          {/* Search input */}
                          <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={cashBookSearch}
                              onChange={(e) => {
                                setCashBookSearch(e.target.value)
                                setCashBookPage(1)
                              }}
                              placeholder="Cari No. Bukti, Uraian, Rekanan, Akun..."
                              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6777ef] transition-colors"
                            />
                            {cashBookSearch && (
                              <button
                                onClick={() => {
                                  setCashBookSearch("")
                                  setCashBookPage(1)
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Bulan */}
                            <select
                              value={selectedMonth}
                              onChange={(e) => {
                                setSelectedMonth(e.target.value)
                                setCashBookPage(1)
                              }}
                              className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#6777ef] transition-colors"
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
                              onChange={(e) => {
                                setProofTypeFilter(e.target.value)
                                setCashBookPage(1)
                              }}
                              className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#6777ef] transition-colors"
                            >
                              <option value="all">Semua Bukti</option>
                              <option value="BKM">BKM (Kas Masuk)</option>
                              <option value="BKK">BKK (Kas Keluar)</option>
                              <option value="MEMORIAL">Memorial / Saldo Awal (BM/SA)</option>
                            </select>

                            {/* Filter Status Bukti Fisik */}
                            <select
                              value={attachmentFilter}
                              onChange={(e) => {
                                setAttachmentFilter(e.target.value)
                                setCashBookPage(1)
                              }}
                              className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#6777ef] transition-colors"
                            >
                              <option value="all">Semua Status Bukti</option>
                              <option value="signed">✓ Sudah TTD</option>
                              <option value="unsigned">⚠ Belum TTD</option>
                            </select>

                            {/* Opsi Baris Per Halaman */}
                            <div className="flex items-center gap-1.5 pl-1">
                              <span className="text-[11px] font-medium text-slate-400">Baris:</span>
                              <select
                                value={cashBookPerPage}
                                onChange={(e) => {
                                  setCashBookPerPage(parseInt(e.target.value, 10))
                                  setCashBookPage(1)
                                }}
                                className="bg-white border border-slate-200 text-xs rounded-xl px-2 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#6777ef] transition-colors"
                              >
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={0}>Semua</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* TABEL FORMAL GRID: BUKU KAS & JURNAL */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                                <th className="py-2.5 px-3 border-r border-slate-300 w-36">No. Bukti & Tanggal</th>
                                <th className="py-2.5 px-3 border-r border-slate-300">Uraian Transaksi & Pihak/Rekanan</th>
                                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[260px]">
                                  Kode & Nama Akun Jurnal (COA)
                                </th>
                                <th className="py-2.5 px-3 border-r border-slate-300 text-right w-36">Debit (Rp)</th>
                                <th className="py-2.5 px-3 border-r border-slate-300 text-right w-36">Kredit (Rp)</th>
                                <th className="py-2.5 px-3 text-center w-36">Kwitansi & Bukti Fisik</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {paginatedEntries.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-12 text-center text-slate-400 bg-slate-50/50">
                                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                    <p className="font-semibold text-slate-600">Tidak ada transaksi yang cocok</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                      {cashBookSearch
                                        ? `Tidak ditemukan transaksi dengan kata kunci "${cashBookSearch}".`
                                        : entries.length === 0
                                        ? "Belum ada transaksi di periode ini."
                                        : "Tidak ada transaksi yang cocok dengan filter yang dipilih."}
                                    </p>
                                  </td>
                                </tr>
                              ) : (
                                paginatedEntries.map((entry: any) => (
                                  <React.Fragment key={entry.id}>
                                    {entry.lines.map((line: any, idx: number) => (
                                      <tr key={line.id} className="hover:bg-slate-50/80 transition-colors">
                                        {idx === 0 ? (
                                          <td
                                            rowSpan={entry.lines.length}
                                            className="py-2.5 px-3 align-top font-mono text-[11px] border-r border-slate-300 bg-slate-50/30"
                                          >
                                            <div className="flex flex-col gap-1">
                                              <span
                                                className={`font-bold px-2 py-0.5 rounded text-[10.5px] inline-block w-fit ${
                                                  entry.proofType === "BKM"
                                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                    : entry.proofType === "MEMORIAL" ||
                                                      entry.proofType === "BM" ||
                                                      entry.proofType === "SA" ||
                                                      entry.proofNumber?.startsWith("SA/") ||
                                                      entry.proofNumber?.startsWith("BM/")
                                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                                }`}
                                              >
                                                {entry.proofNumber}
                                              </span>
                                              <span className="text-slate-500 text-[10.5px] font-sans">
                                                {new Date(entry.date).toLocaleDateString("id-ID", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  year: "numeric"
                                                })}
                                              </span>
                                            </div>
                                          </td>
                                        ) : null}

                                        {idx === 0 ? (
                                          <td
                                            rowSpan={entry.lines.length}
                                            className="py-2.5 px-3 align-top border-r border-slate-300"
                                          >
                                            <div className="font-bold text-slate-800 text-xs leading-snug">
                                              {entry.description}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-1">
                                              <InlinePartyEditor entry={entry} onSave={handleSaveParty} />
                                            </div>
                                          </td>
                                        ) : null}

                                        <td className="py-2 px-3 border-r border-slate-300">
                                          <div
                                            className={`flex items-baseline gap-2 ${
                                              line.type === "CREDIT" ? "pl-5" : ""
                                            }`}
                                          >
                                            <span className="font-mono font-bold text-slate-800 shrink-0 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                              {line.accountCode}
                                            </span>
                                            <span
                                              className={`text-xs ${
                                                line.type === "CREDIT"
                                                  ? "text-slate-600 font-medium italic"
                                                  : "text-slate-900 font-bold"
                                              }`}
                                            >
                                              {getAccountName(line.accountCode) || line.accountCode}
                                            </span>
                                          </div>
                                        </td>

                                        <td className="py-2 px-3 border-r border-slate-300 text-right font-mono font-bold">
                                          {line.type === "DEBIT" ? (
                                            <span className="text-emerald-700 bg-emerald-50/60 px-1.5 py-0.5 rounded">
                                              {formatRupiah(line.amount)}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300">-</span>
                                          )}
                                        </td>

                                        <td className="py-2 px-3 border-r border-slate-300 text-right font-mono font-bold">
                                          {line.type === "CREDIT" ? (
                                            <span className="text-rose-700 bg-rose-50/60 px-1.5 py-0.5 rounded">
                                              {formatRupiah(line.amount)}
                                            </span>
                                          ) : (
                                            <span className="text-slate-300">-</span>
                                          )}
                                        </td>

                                        {idx === 0 ? (
                                          <td
                                            rowSpan={entry.lines.length}
                                            className="py-2.5 px-3 align-top text-center bg-slate-50/30"
                                          >
                                            <div className="flex flex-col items-center gap-1.5">
                                              <button
                                                onClick={() => setSelectedKwitansi(entry)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-white hover:bg-[#6777ef] text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                                                title="Buka Cetak Kwitansi & Upload Bukti"
                                              >
                                                <Printer className="w-3 h-3" />
                                                <span>Cetak</span>
                                              </button>

                                              {entry.attachmentUrl ? (
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    onClick={() => setSelectedKwitansi(entry)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-bold transition-all shadow-xs cursor-pointer"
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
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 text-[10px] font-bold transition-all cursor-pointer"
                                                  title="Bukti tanda tangan belum diunggah. Klik untuk cetak dan unggah foto kwitansi."
                                                >
                                                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                                  <span>Belum TTD</span>
                                                </button>
                                              )}

                                              {currentUser?.role === "ADMIN" && (
                                                <button
                                                  onClick={() => {
                                                    setDeleteError(null)
                                                    setDeletingTransaction(entry)
                                                  }}
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-[10px] font-bold transition-all shadow-2xs mt-1 cursor-pointer"
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

                            {/* FORMAL AUDIT TOTAL MUTASI JURNAL ROW */}
                            <tfoot className="border-t-2 border-slate-400 bg-slate-100 font-black text-slate-900">
                              <tr>
                                <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300">
                                  <div className="flex items-center justify-between">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold ${
                                        isBalanced
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                          : "bg-rose-100 text-rose-800 border border-rose-300"
                                      }`}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      {isBalanced
                                        ? "Jurnal 100% Seimbang & Klir"
                                        : "Perhatian: Terdapat Selisih Jurnal"}
                                    </span>
                                    <span className="text-slate-800 uppercase tracking-wider text-xs">
                                      TOTAL MUTASI KAS & JURNAL:
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-xs font-black text-emerald-800 bg-emerald-50/50">
                                  {formatRupiah(totalDebit)}
                                </td>
                                <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-xs font-black text-rose-800 bg-rose-50/50">
                                  {formatRupiah(totalCredit)}
                                </td>
                                <td className="py-2.5 px-3 text-center text-[11px] font-bold text-slate-700">
                                  {signedCount}/{totalFilteredCount} TTD
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {cashBookPerPage > 0 && totalPages > 1 && (
                          <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs text-slate-500 font-medium">
                              Menampilkan{" "}
                              <span className="font-bold text-slate-800">
                                {filteredEntries.length === 0 ? 0 : startIndex + 1}
                              </span>{" "}
                              - <span className="font-bold text-slate-800">{endIndex}</span> dari{" "}
                              <span className="font-bold text-slate-800">{filteredEntries.length}</span> transaksi
                              {filteredEntries.length !== entries.length && (
                                <span className="text-slate-400"> (disaring dari total {entries.length})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setCashBookPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Sebelumnya</span>
                              </button>

                              {Array.from({ length: totalPages }).map((_, i) => {
                                const pageNum = i + 1
                                if (
                                  pageNum === 1 ||
                                  pageNum === totalPages ||
                                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setCashBookPage(pageNum)}
                                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        currentPage === pageNum
                                          ? "bg-[#6777ef] text-white shadow-xs"
                                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  )
                                }
                                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                  return (
                                    <span key={pageNum} className="px-1 text-slate-400 text-xs">
                                      &bull;
                                    </span>
                                  )
                                }
                                return null
                              })}

                              <button
                                onClick={() => setCashBookPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>Selanjutnya</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* TAB: 1. LABA RUGI */}
            {activeTab === "laba-rugi" && reports && (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportYearFilter("Laba Rugi", "laba-rugi-print-area")}

                {/* EXECUTIVE STAT CARDS (NO-PRINT) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Pendapatan</span>
                    <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1 font-mono">
                      {formatRupiah(reports.labaRugi.totalRevenue)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Seluruh pos pendapatan usaha</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Beban Usaha</span>
                    <div className="text-lg sm:text-xl font-black text-rose-500 mt-1 font-mono">
                      {formatRupiah(reports.labaRugi.totalExpense)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Biaya operasional & adm.</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Laba Bersih (SHU)</span>
                    <div className="text-lg sm:text-xl font-black text-[#6777ef] mt-1 font-mono">
                      {formatRupiah(reports.labaRugi.netProfit)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Surplus hasil usaha bersih</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Margin Laba (NPM)</span>
                    <div className="text-lg sm:text-xl font-black text-slate-800 mt-1 font-mono">
                      {reports.labaRugi.totalRevenue > 0
                        ? `${((reports.labaRugi.netProfit / reports.labaRugi.totalRevenue) * 100).toFixed(1)}%`
                        : "0.0%"}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Rasio laba thd omzet</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="laba-rugi-print-area">
                  {reports.isArchived && currentUser?.role === "ADMIN" && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
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

                  {renderReportKop("LAPORAN LABA RUGI KOMPREHENSIF", "Standar Kepmendesa PDTT No. 136 Tahun 2022")}

                  {/* TABEL FORMAL GRID: LABA RUGI */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center">Kode Akun</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Nama & Rincian Pos Akuntansi</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-36 text-center">Golongan Akun</th>
                          <th className="py-2.5 px-3 text-right w-44">Jumlah (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* SECTION I: PENDAPATAN */}
                        <tr className="bg-slate-50/80 font-bold text-slate-800">
                          <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-[#6777ef]">
                            I. PENDAPATAN USAHA (REVENUE)
                          </td>
                        </tr>
                        {reports.labaRugi.revenues.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 px-3 text-center text-slate-400 italic">
                              Belum ada akun pendapatan yang tercatat pada periode ini.
                            </td>
                          </tr>
                        ) : (
                          reports.labaRugi.revenues.map((r: any) => (
                            <tr key={r.code} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center text-slate-700">
                                {r.code}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                                {r.name}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Pendapatan Usaha
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                {formatRupiah(r.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-emerald-50/60 font-bold border-t border-b border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                            TOTAL PENDAPATAN USAHA (A)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-black">
                            {formatRupiah(reports.labaRugi.totalRevenue)}
                          </td>
                        </tr>

                        {/* SECTION II: BEBAN */}
                        <tr className="bg-slate-50/80 font-bold text-slate-800">
                          <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-rose-600">
                            II. BEBAN OPERASIONAL & USAHA (EXPENSES)
                          </td>
                        </tr>
                        {reports.labaRugi.expenses.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 px-3 text-center text-slate-400 italic">
                              Belum ada akun beban operasional yang tercatat pada periode ini.
                            </td>
                          </tr>
                        ) : (
                          reports.labaRugi.expenses.map((e: any) => (
                            <tr key={e.code} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center text-slate-700">
                                {e.code}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                                {e.name}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200 text-center">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Beban Operasional
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                {formatRupiah(e.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-rose-50/60 font-bold border-t border-b border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                            TOTAL BEBAN OPERASIONAL & USAHA (B)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-black">
                            {formatRupiah(reports.labaRugi.totalExpense)}
                          </td>
                        </tr>

                        {/* GRAND TOTAL ROW: LABA BERSIH (SHU) */}
                        <tr className="bg-indigo-50/80 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                          <td colSpan={3} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-xs sm:text-sm text-[#6777ef]">
                            SISA HASIL USAHA (SHU) / LABA BERSIH TAHUN BERJALAN (A - B)
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-[#6777ef]">
                            {formatRupiah(reports.labaRugi.netProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {renderReportSignatures()}
                </div>
              </div>
            )}

            {/* TAB: 2. NERACA */}
            {activeTab === "neraca" && reports && (
              <div className="max-w-5xl mx-auto space-y-4">
                {renderReportYearFilter("Neraca", "neraca-print-area")}

                {/* EXECUTIVE STAT CARDS (NO-PRINT) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Aset (Aktiva)</span>
                    <div className="text-lg sm:text-xl font-black text-[#6777ef] mt-1 font-mono">
                      {formatRupiah(reports.neraca.totalAssets)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Aset lancar & aset tetap bersih</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Kewajiban</span>
                    <div className="text-lg sm:text-xl font-black text-amber-600 mt-1 font-mono">
                      {formatRupiah(reports.neraca.totalLiabilities)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Utang lancar ke pihak ketiga</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Ekuitas</span>
                    <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1 font-mono">
                      {formatRupiah(reports.neraca.totalEquity)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Modal desa, cadangan & SHU</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Keseimbangan (Balance)</span>
                    <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>100% Klir</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Aktiva = Pasiva (Selisih Rp 0)</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="neraca-print-area">
                  {renderReportKop("LAPORAN POSISI KEUANGAN (NERACA)", "Standar SAK EMKM & Kepmendesa PDTT No. 136 Tahun 2022")}

                  <div className="flex items-center justify-center no-print">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>STATUS NERACA: 100% BALANCE (SEIMBANG) &bull; SELISIH RP 0</span>
                    </div>
                  </div>

                  {/* TABEL BERDAMPINGAN: AKTIVA VS PASIVA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* KOLOM KIRI: ASET (AKTIVA) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                            <th colSpan={2} className="py-2.5 px-3 border-r border-slate-300 text-xs uppercase tracking-wider text-[#6777ef]">
                              ASET (AKTIVA)
                            </th>
                            <th className="py-2.5 px-3 text-right w-36">Nilai (Rp)</th>
                          </tr>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                            <th className="py-1.5 px-3 border-r border-slate-200">Komponen Aset</th>
                            <th className="py-1.5 px-2 border-r border-slate-200 text-center w-24">Golongan</th>
                            <th className="py-1.5 px-3 text-right">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {/* A. Aset Lancar */}
                          <tr className="bg-slate-50/80 font-bold text-slate-800">
                            <td colSpan={3} className="py-1.5 px-3 border-r border-slate-300 text-[11px]">
                              A. ASET LANCAR
                            </td>
                          </tr>
                          {reports.neraca.currentAssets.map((a: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700 pl-4">{a.name}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-center">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  Lancar
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                {formatRupiah(a.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                            <td colSpan={2} className="py-2 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                              Subtotal Aset Lancar
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                              {formatRupiah(reports.neraca.totalCurrentAssets)}
                            </td>
                          </tr>

                          {/* B. Aset Tetap */}
                          <tr className="bg-slate-50/80 font-bold text-slate-800">
                            <td colSpan={3} className="py-1.5 px-3 border-r border-slate-300 text-[11px]">
                              B. ASET TETAP
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-700 pl-4">Nilai Perolehan Aset Tetap</td>
                            <td className="py-2 px-2 border-r border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Tetap
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {formatRupiah(reports.neraca.fixedAssets.peralatan)}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 border-r border-slate-200 text-slate-700 pl-4">Akumulasi Penyusutan</td>
                            <td className="py-2 px-2 border-r border-slate-200 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Kontra
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-500">
                              ({formatRupiah(reports.neraca.fixedAssets.akumulasiPenyusutan)})
                            </td>
                          </tr>
                          <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                            <td colSpan={2} className="py-2 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                              Subtotal Aset Tetap Bersih
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                              {formatRupiah(reports.neraca.fixedAssets.net)}
                            </td>
                          </tr>

                          {/* TOTAL AKTIVA */}
                          <tr className="bg-indigo-50 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                            <td colSpan={2} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-3 text-xs sm:text-sm text-[#6777ef]">
                              TOTAL ASET (AKTIVA)
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-xs sm:text-sm font-black text-[#6777ef]">
                              {formatRupiah(reports.neraca.totalAssets)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* KOLOM KANAN: KEWAJIBAN & EKUITAS (PASIVA) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                            <th colSpan={2} className="py-2.5 px-3 border-r border-slate-300 text-xs uppercase tracking-wider text-emerald-700">
                              KEWAJIBAN & EKUITAS (PASIVA)
                            </th>
                            <th className="py-2.5 px-3 text-right w-36">Nilai (Rp)</th>
                          </tr>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                            <th className="py-1.5 px-3 border-r border-slate-200">Komponen Pasiva</th>
                            <th className="py-1.5 px-2 border-r border-slate-200 text-center w-24">Golongan</th>
                            <th className="py-1.5 px-3 text-right">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {/* A. Kewajiban */}
                          <tr className="bg-slate-50/80 font-bold text-slate-800">
                            <td colSpan={3} className="py-1.5 px-3 border-r border-slate-300 text-[11px]">
                              A. KEWAJIBAN (UTANG)
                            </td>
                          </tr>
                          {reports.neraca.liabilities.map((l: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700 pl-4">{l.name}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-center">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Utang
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                {formatRupiah(l.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                            <td colSpan={2} className="py-2 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                              Subtotal Kewajiban
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700 font-bold">
                              {formatRupiah(reports.neraca.totalLiabilities)}
                            </td>
                          </tr>

                          {/* B. Ekuitas */}
                          <tr className="bg-slate-50/80 font-bold text-slate-800">
                            <td colSpan={3} className="py-1.5 px-3 border-r border-slate-300 text-[11px]">
                              B. EKUITAS (MODAL PEMILIK)
                            </td>
                          </tr>
                          {reports.neraca.equity.map((eq: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 border-r border-slate-200 text-slate-700 pl-4">{eq.name}</td>
                              <td className="py-2 px-2 border-r border-slate-200 text-center">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Ekuitas
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                                {formatRupiah(eq.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                            <td colSpan={2} className="py-2 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                              Subtotal Ekuitas
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                              {formatRupiah(reports.neraca.totalEquity)}
                            </td>
                          </tr>

                          {/* TOTAL PASIVA */}
                          <tr className="bg-emerald-50 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                            <td colSpan={2} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-3 text-xs sm:text-sm text-emerald-800">
                              TOTAL KEWAJIBAN & EKUITAS
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-xs sm:text-sm font-black text-emerald-700">
                              {formatRupiah(reports.neraca.totalLiabilitiesAndEquity)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {renderReportSignatures()}
                </div>
              </div>
            )}

            {/* TAB: 3. PERUBAHAN MODAL (LPE) */}
            {activeTab === "lpe" && reports && (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportYearFilter("Perubahan Ekuitas", "lpe-print-area")}

                {/* EXECUTIVE STAT CARDS (NO-PRINT) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Penyertaan Desa (APBDes)</span>
                    <div className="text-lg sm:text-xl font-black text-[#6777ef] mt-1 font-mono">
                      {formatRupiah(reports.lpe.modalAwalDesa)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Modal awal pemerintah desa</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Saldo Laba Awal Tahun</span>
                    <div className="text-lg sm:text-xl font-black text-slate-800 mt-1 font-mono">
                      {formatRupiah(reports.lpe.saldoLabaAwal)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi cadangan & laba lalu</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Penyetoran PADes</span>
                    <div className="text-lg sm:text-xl font-black text-amber-600 mt-1 font-mono">
                      {formatRupiah(reports.lpe.bagiHasilDesa)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Bagi hasil disetor ke kas desa</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Ekuitas Akhir</span>
                    <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1 font-mono">
                      {formatRupiah(reports.lpe.ekuitasAkhir)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Nilai bersih ekuitas per 31 Des</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="lpe-print-area">
                  {renderReportKop("LAPORAN PERUBAHAN EKUITAS (LPE)", "Standar Kepmendesa PDTT No. 136 Tahun 2022")}

                  {/* TABEL FORMAL GRID: LPE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <th className="py-2.5 px-3 border-r border-slate-300 w-14 text-center">No</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Komponen Perubahan Ekuitas BUMDes</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-36 text-center">Kategori Akun</th>
                          <th className="py-2.5 px-3 text-right w-44">Jumlah (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">1</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penyertaan Modal Desa Awal (APBDes)</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Modal Disetor</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(reports.lpe.modalAwalDesa)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">2</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penyertaan Modal Masyarakat Awal</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Modal Disetor</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(reports.lpe.modalAwalMasyarakat)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">3</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penambahan / (Pengurangan) Modal Tahun Berjalan</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Mutasi Modal</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">Rp 0</td>
                        </tr>
                        <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                            Jumlah Penyertaan Modal Akhir (I)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-black">
                            {formatRupiah(reports.lpe.totalPenyertaanModalAkhir)}
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">4</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Saldo Laba Awal Tahun (Cadangan & Laba Ditahan)</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Saldo Laba</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(reports.lpe.saldoLabaAwal)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">5</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penyetoran PADes / Bagi Hasil ke Kas Desa</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Distribusi SHU</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">({formatRupiah(reports.lpe.bagiHasilDesa)})</td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">6</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Sisa Hasil Usaha / Laba Bersih Tahun Berjalan</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">SHU Berjalan</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">+{formatRupiah(reports.lpe.labaPeriodeBerjalan)}</td>
                        </tr>
                        <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                            Jumlah Saldo Laba Akhir Tahun (II)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-black">
                            {formatRupiah(reports.lpe.saldoLabaAkhir)}
                          </td>
                        </tr>

                        {/* GRAND TOTAL: EKUITAS AKHIR */}
                        <tr className="bg-indigo-50/80 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                          <td colSpan={3} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-xs sm:text-sm text-[#6777ef]">
                            TOTAL EKUITAS AKHIR BUMDES PER 31 DESEMBER (I + II)
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-[#6777ef]">
                            {formatRupiah(reports.lpe.ekuitasAkhir)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {renderReportSignatures()}
                </div>
              </div>
            )}

            {/* TAB: 4. ARUS KAS (LAK) */}
            {activeTab === "lak" && reports && (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportYearFilter("Arus Kas", "lak-print-area")}

                {/* EXECUTIVE STAT CARDS (NO-PRINT) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 no-print">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Saldo Kas Awal (1 Jan)</span>
                    <div className="text-lg sm:text-xl font-black text-slate-800 mt-1 font-mono">
                      {formatRupiah(reports.lak.saldoKasAwal || 0)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Saldo awal kasir & rekening bank</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Arus Kas Operasional</span>
                    <div className={`text-lg sm:text-xl font-black mt-1 font-mono ${reports.lak.operasi.bersih >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {formatRupiah(reports.lak.operasi.bersih)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Kas bersih kegiatan operasional</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kenaikan / (Penurunan) Kas</span>
                    <div className={`text-lg sm:text-xl font-black mt-1 font-mono ${reports.lak.kenaikanKasBersih >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                      {reports.lak.kenaikanKasBersih >= 0 ? "+" : ""}{formatRupiah(reports.lak.kenaikanKasBersih)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Net cash flow 3 aktivitas</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Saldo Kas Akhir (31 Des)</span>
                    <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1 font-mono">
                      {formatRupiah(reports.lak.saldoKasAkhir)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sinkron 100% dengan Neraca</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="lak-print-area">
                  {renderReportKop("LAPORAN ARUS KAS (LAK)", "Metode Langsung (Direct Cash Flow) - Standar Kepmendes 136/2022")}

                  {/* TABEL FORMAL GRID: ARUS KAS METODE LANGSUNG */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <th className="py-2.5 px-3 border-r border-slate-300 w-14 text-center">No</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Uraian Arus Kas Entitas BUMDes</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-36 text-center">Klasifikasi Aktivitas</th>
                          <th className="py-2.5 px-3 text-right w-44">Jumlah Kas (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* I. AKTIVITAS OPERASIONAL */}
                        <tr className="bg-slate-50/80 font-bold text-slate-800">
                          <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-[#6777ef]">
                            I. ARUS KAS DARI AKTIVITAS OPERASIONAL
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">1.1</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                            Penerimaan Kas dari Pelanggan & Pendapatan Operasional Usaha
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Arus Kas Masuk</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                            +{formatRupiah(reports.lak.operasi.masuk)}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">1.2</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                            Pengeluaran Kas untuk Pembayaran Beban Operasional, Gaji & Pemeliharaan
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Arus Kas Keluar</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-500">
                            -{formatRupiah(reports.lak.operasi.keluar)}
                          </td>
                        </tr>
                        <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                            Arus Kas Bersih yang Diperoleh dari Aktivitas Operasi
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-black">
                            {formatRupiah(reports.lak.operasi.bersih)}
                          </td>
                        </tr>

                        {/* II. AKTIVITAS INVESTASI */}
                        <tr className="bg-slate-50/80 font-bold text-slate-800">
                          <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-indigo-700">
                            II. ARUS KAS DARI AKTIVITAS INVESTASI
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">2.1</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                            Perolehan / Pembelian Aset Tetap, Peralatan, & Fasilitas Usaha
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Investasi Aset</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            -{formatRupiah(reports.lak.investasi.keluar)}
                          </td>
                        </tr>
                        <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                            Arus Kas Bersih yang Digunakan untuk Aktivitas Investasi
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-black">
                            {formatRupiah(reports.lak.investasi.bersih)}
                          </td>
                        </tr>

                        {/* III. AKTIVITAS PENDANAAN */}
                        <tr className="bg-slate-50/80 font-bold text-slate-800">
                          <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-amber-700">
                            III. ARUS KAS DARI AKTIVITAS PENDANAAN
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">3.1</td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                            Penyetoran Bagian SHU ke Kas Desa (Pendapatan Asli Desa / PADes)
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Distribusi Kas</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                            -{formatRupiah(reports.lak.pendanaan.keluar)}
                          </td>
                        </tr>
                        <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                            Arus Kas Bersih yang Digunakan untuk Aktivitas Pendanaan
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-black">
                            {formatRupiah(reports.lak.pendanaan.bersih)}
                          </td>
                        </tr>

                        {/* REKONSILIASI SALDO KAS */}
                        <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-300">
                          <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-right pr-4 uppercase tracking-wider">
                            Kenaikan / (Penurunan) Kas Bersih Periode Berjalan
                          </td>
                          <td className={`py-2.5 px-3 text-right font-mono font-black ${reports.lak.kenaikanKasBersih >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                            {reports.lak.kenaikanKasBersih >= 0 ? "+" : ""}{formatRupiah(reports.lak.kenaikanKasBersih)}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/70 font-semibold text-slate-700">
                          <td colSpan={3} className="py-2 px-3 border-r border-slate-200 text-right pr-4">
                            Saldo Awal Kas dan Setara Kas per 1 Januari
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-800 font-bold">
                            {formatRupiah(reports.lak.saldoKasAwal || 0)}
                          </td>
                        </tr>

                        {/* GRAND TOTAL ROW: SALDO KAS AKHIR */}
                        <tr className="bg-emerald-50/80 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                          <td colSpan={3} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-xs sm:text-sm text-emerald-800">
                            SALDO AKHIR KAS & SETARA KAS PER 31 DESEMBER
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-emerald-700">
                            {formatRupiah(reports.lak.saldoKasAkhir)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {renderReportSignatures()}
                </div>
              </div>
            )}

            {/* TAB: 5. CaLK */}
            {activeTab === "calk" && reports && (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportYearFilter("CaLK", "calk-print-area")}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6" id="calk-print-area">
                  {renderReportKop("CATATAN ATAS LAPORAN KEUANGAN (CaLK)", "Standar Kepmendesa PDTT No. 136 Tahun 2022 & SAK EMKM")}

                  <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">1. INFORMASI UMUM ENTITAS</h3>
                      <p>
                        {settings.bumdes_name || "BUMDesa \"BAROKAH\""} didirikan berdasarkan Peraturan Desa Nomor 02 Tahun 2021 sesuai amanat Undang-Undang No. 6 Tahun 2014 tentang Desa serta Peraturan Pemerintah No. 11 Tahun 2021 tentang Badan Usaha Milik Desa. BUM Desa ini beralamat di {settings.bumdes_address || `Desa ${settings.village_name || "Balongbesuk"}, Kec. ${settings.subdistrict_name || "Diwek"}, Kab. ${settings.regency_name || "Jombang"}`}.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">2. KEBIJAKAN AKUNTANSI PENTING</h3>
                      <p className="mb-2">
                        Laporan keuangan disusun berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dan Keputusan Menteri Desa, PDT, dan Transmigrasi No. 136 Tahun 2022.
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Dasar Penyusunan:</strong> Berdasarkan konsep biaya historis dan asas akrual untuk laba rugi serta asas kas untuk laporan arus kas.</li>
                        <li><strong>Kas dan Setara Kas:</strong> Mencakup uang tunai di bendahara dan simpanan pada rekening perbankan resmi yang likuid tanpa batasan penarikan.</li>
                        <li><strong>Piutang Usaha:</strong> Dinyatakan sebesar nilai tagihan bruto yang belum diterima dari mitra/pelanggan per akhir periode pelaporan.</li>
                        <li><strong>Aset Tetap & Penyusutan:</strong> Dinyatakan sebesar harga perolehan dikurangi akumulasi penyusutan menggunakan metode garis lurus (*straight-line method*).</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-3">3. RINCIAN POS-POS LAPORAN POSISI KEUANGAN (NERACA)</h3>
                      
                      {/* A. ASET LANCAR */}
                      <div className="mb-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2 bg-slate-50 p-2 rounded">
                          A. Aset Lancar (Kas, Piutang, Persediaan)
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2 px-3 text-left">Komponen Aset Lancar</th>
                                <th className="py-2 px-3 text-right">Nilai Tercatat (Rp)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reports.neraca.currentAssets.map((a: any, i: number) => (
                                <tr key={i}>
                                  <td className="py-2 px-3 text-slate-700">{a.name}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(a.amount)}</td>
                                </tr>
                              ))}
                              <tr className="bg-slate-50/70 font-bold">
                                <td className="py-2 px-3 text-slate-900">Total Aset Lancar</td>
                                <td className="py-2 px-3 text-right font-mono text-emerald-600 font-black">{formatRupiah(reports.neraca.totalCurrentAssets)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* B. ASET TETAP */}
                      <div className="mb-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2 bg-slate-50 p-2 rounded">
                          B. Aset Tetap & Akumulasi Penyusutan
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <tbody className="divide-y divide-slate-100">
                              <tr>
                                <td className="py-2 px-3 text-slate-700">Nilai Perolehan Aset Tetap (Peralatan, Mesin, Gedung, Meubelair)</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(reports.neraca.fixedAssets.peralatan)}</td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 text-slate-700">Akumulasi Penyusutan Aset Tetap</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">({formatRupiah(reports.neraca.fixedAssets.akumulasiPenyusutan)})</td>
                              </tr>
                              <tr className="bg-slate-50/70 font-bold">
                                <td className="py-2 px-3 text-slate-900">Nilai Buku Bersih Aset Tetap</td>
                                <td className="py-2 px-3 text-right font-mono text-emerald-600 font-black">{formatRupiah(reports.neraca.fixedAssets.net)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* C. KEWAJIBAN & EKUITAS */}
                      <div className="mb-4">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2 bg-slate-50 p-2 rounded">
                          C. Kewajiban & Ekuitas Pemilik
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <tbody className="divide-y divide-slate-100">
                              {reports.neraca.liabilities.map((l: any, i: number) => (
                                <tr key={`l-${i}`}>
                                  <td className="py-2 px-3 text-slate-700">{l.name}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(l.amount)}</td>
                                </tr>
                              ))}
                              <tr className="bg-slate-50/50 font-semibold text-slate-800">
                                <td className="py-2 px-3">Total Kewajiban</td>
                                <td className="py-2 px-3 text-right font-mono">{formatRupiah(reports.neraca.totalLiabilities)}</td>
                              </tr>
                              {reports.neraca.equity.map((e: any, i: number) => (
                                <tr key={`e-${i}`}>
                                  <td className="py-2 px-3 text-slate-700">{e.name}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(e.amount)}</td>
                                </tr>
                              ))}
                              <tr className="bg-slate-50 font-bold">
                                <td className="py-2 px-3 text-slate-900">Total Ekuitas</td>
                                <td className="py-2 px-3 text-right font-mono text-emerald-600 font-black">{formatRupiah(reports.neraca.totalEquity)}</td>
                              </tr>
                              <tr className="bg-emerald-50 text-emerald-800 font-black">
                                <td className="py-2.5 px-3">TOTAL KEWAJIBAN & EKUITAS (SEIMBANG DENGAN TOTAL ASET)</td>
                                <td className="py-2.5 px-3 text-right font-mono text-sm">{formatRupiah(reports.neraca.totalLiabilitiesAndEquity)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">4. KINERJA OPERASIONAL LABA RUGI</h3>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span>Total Pendapatan Usaha (Omzet)</span>
                          <span className="font-mono font-bold text-emerald-600">{formatRupiah(reports.labaRugi.totalRevenue)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                          <span>Total Beban Operasional & Usaha</span>
                          <span className="font-mono font-bold text-rose-600">{formatRupiah(reports.labaRugi.totalExpense)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 font-bold text-slate-900">
                          <span>Sisa Hasil Usaha / Laba Bersih Tahun Berjalan (SHU)</span>
                          <span className="font-mono text-[#6777ef] text-sm">{formatRupiah(reports.labaRugi.netProfit)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2">5. PERTANGGUNGJAWABAN & PENGESAHAN</h3>
                      <p>
                        Laporan Keuangan ini telah disusun secara tertib, akuntabel, dan transparan berdasarkan bukti pembukuan yang sah, serta dipertanggungjawabkan dalam Musyawarah Desa (Musdes) Laporan Pertanggungjawaban (LPJ) BUM Desa Tahun Anggaran {selectedYear}.
                      </p>
                    </div>
                  </div>

                  {renderReportSignatures(true)}
                </div>
              </div>
            )}

            {/* TAB: COA DINAMIS (DENGAN PAGINASI, FILTER & PENCARIAN) */}
            {activeTab === "coa" && (() => {
              const q = coaSearch.toLowerCase().trim()
              const filteredCoa = coaList.filter((acc) => {
                const matchesSearch =
                  !q ||
                  acc.code.toLowerCase().includes(q) ||
                  acc.name.toLowerCase().includes(q)

                let matchesCategory = true
                if (coaCategoryFilter === "1") matchesCategory = acc.code.startsWith("1.")
                else if (coaCategoryFilter === "2") matchesCategory = acc.code.startsWith("2.")
                else if (coaCategoryFilter === "3") matchesCategory = acc.code.startsWith("3.")
                else if (coaCategoryFilter === "4") matchesCategory = acc.code.startsWith("4.")
                else if (coaCategoryFilter === "5-6-7")
                  matchesCategory =
                    acc.code.startsWith("5.") ||
                    acc.code.startsWith("6.") ||
                    acc.code.startsWith("7.")
                else if (coaCategoryFilter !== "all") matchesCategory = acc.type === coaCategoryFilter

                return matchesSearch && matchesCategory
              })

              const totalCoaPages = Math.max(1, Math.ceil(filteredCoa.length / coaPerPage))
              const safeCoaPage = Math.min(Math.max(1, coaPage), totalCoaPages)
              const coaStartIndex = (safeCoaPage - 1) * coaPerPage
              const paginatedCoa = filteredCoa.slice(coaStartIndex, coaStartIndex + coaPerPage)

              const assetCount = coaList.filter((a) => a.code.startsWith("1.")).length
              const liabCount = coaList.filter((a) => a.code.startsWith("2.")).length
              const eqCount = coaList.filter((a) => a.code.startsWith("3.")).length
              const revCount = coaList.filter((a) => a.code.startsWith("4.")).length
              const expCount = coaList.filter((a) => ["5.", "6.", "7."].some((p) => a.code.startsWith(p))).length

              // Generator nomor halaman (contoh: 1, 2, ..., 5, 6, ..., 15)
              const getPageNumbers = () => {
                if (totalCoaPages <= 5) {
                  return Array.from({ length: totalCoaPages }, (_, i) => i + 1)
                }
                const pages: (number | string)[] = [1]
                if (safeCoaPage > 3) pages.push("...")
                const start = Math.max(2, safeCoaPage - 1)
                const end = Math.min(totalCoaPages - 1, safeCoaPage + 1)
                for (let i = start; i <= end; i++) {
                  if (!pages.includes(i)) pages.push(i)
                }
                if (safeCoaPage < totalCoaPages - 2) pages.push("...")
                if (!pages.includes(totalCoaPages)) pages.push(totalCoaPages)
                return pages
              }

              return (
                <div className="space-y-6">
                  {/* RINGKASAN METRIK KATEGORI COA */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <button
                      onClick={() => {
                        setCoaCategoryFilter("all")
                        setCoaPage(1)
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        coaCategoryFilter === "all"
                          ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500/20"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">Semua Akun</span>
                      <div className="text-lg font-black mt-0.5">{coaList.length}</div>
                      <p className="text-[10px] opacity-60 mt-0.5">Daftar Akun Lengkap</p>
                    </button>

                    <button
                      onClick={() => {
                        setCoaCategoryFilter("1")
                        setCoaPage(1)
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        coaCategoryFilter === "1"
                          ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">1. Aset (Aktiva)</span>
                      <div className="text-lg font-black mt-0.5">{assetCount}</div>
                      <p className="text-[10px] opacity-60 mt-0.5">Kas, Piutang & Aset Tetap</p>
                    </button>

                    <button
                      onClick={() => {
                        setCoaCategoryFilter("2")
                        setCoaPage(1)
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        coaCategoryFilter === "2"
                          ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">2. Kewajiban</span>
                      <div className="text-lg font-black mt-0.5">{liabCount}</div>
                      <p className="text-[10px] opacity-60 mt-0.5">Utang & Simpanan Anggota</p>
                    </button>

                    <button
                      onClick={() => {
                        setCoaCategoryFilter("3")
                        setCoaPage(1)
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        coaCategoryFilter === "3"
                          ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">3. Ekuitas</span>
                      <div className="text-lg font-black mt-0.5">{eqCount}</div>
                      <p className="text-[10px] opacity-60 mt-0.5">Modal APBDes & Cadangan</p>
                    </button>

                    <button
                      onClick={() => {
                        setCoaCategoryFilter("4")
                        setCoaPage(1)
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all col-span-2 sm:col-span-1 ${
                        coaCategoryFilter === "4"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">4. Pendapatan</span>
                      <div className="text-lg font-black mt-0.5">{revCount}</div>
                      <p className="text-[10px] opacity-60 mt-0.5">Omzet & Bagi Hasil Unit</p>
                    </button>
                  </div>

                  {/* KONTEN UTAMA TABEL DENGAN FILTER & SEARCH BAR */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                          Bagan Akun Standar (COA Dinamis)
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#6777ef] border border-indigo-200">
                            {filteredCoa.length} Akun
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Bagan Akun Standar Kepmendesa No. 136/2022. Tersedia paginasi dan pencarian instan untuk kemudahan navigasi akun.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {(currentUser?.role === "ADMIN" || currentUser?.role === "BENDAHARA") && (
                          <button
                            type="button"
                            onClick={handleResetDefaultCoa}
                            disabled={resettingCoa}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer transition-all disabled:opacity-50"
                            title="Pulihkan seluruh nama akun standar Kepmendesa 136 ke bawaan sistem tanpa menghapus akun kustom pengguna"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${resettingCoa ? "animate-spin" : ""}`} />
                            <span>Pulihkan COA Bawaan Sistem</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowCoaModal(true)}
                          className="bg-[#6777ef] hover:bg-[#5868e4] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah Akun Baru (Dinamis)</span>
                        </button>
                      </div>
                    </div>

                    {/* TOOLBAR FILTER, SEARCH & PER-PAGE */}
                    <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={coaSearch}
                          onChange={(e) => {
                            setCoaSearch(e.target.value)
                            setCoaPage(1)
                          }}
                          placeholder="Cari kode atau nama akun (contoh: 1.1.01 atau Bank)..."
                          className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6777ef]/20 focus:border-[#6777ef] transition-all bg-slate-50/50"
                        />
                        {coaSearch && (
                          <button
                            onClick={() => {
                              setCoaSearch("")
                              setCoaPage(1)
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            title="Hapus pencarian"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Filter Kategori Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select
                            value={coaCategoryFilter}
                            onChange={(e) => {
                              setCoaCategoryFilter(e.target.value)
                              setCoaPage(1)
                            }}
                            className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#6777ef]"
                          >
                            <option value="all">Semua Golongan Akun ({coaList.length})</option>
                            <option value="1">1. Aset (Aktiva) ({assetCount})</option>
                            <option value="2">2. Kewajiban (Utang) ({liabCount})</option>
                            <option value="3">3. Ekuitas (Modal) ({eqCount})</option>
                            <option value="4">4. Pendapatan Usaha ({revCount})</option>
                            <option value="5-6-7">5, 6, 7. Beban-Beban ({expCount})</option>
                          </select>
                        </div>

                        {/* Per-Page Selector */}
                        <select
                          value={coaPerPage}
                          onChange={(e) => {
                            setCoaPerPage(parseInt(e.target.value, 10))
                            setCoaPage(1)
                          }}
                          className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:border-[#6777ef]"
                          title="Jumlah baris per halaman"
                        >
                          <option value="15">15 / hal</option>
                          <option value="25">25 / hal</option>
                          <option value="50">50 / hal</option>
                          <option value="100">100 / hal</option>
                        </select>
                      </div>
                    </div>

                    {/* TABEL DATA COA TERPAGINASI */}
                    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs min-w-[600px] border-collapse">
                        <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center">No</th>
                            <th className="py-2.5 px-4 border-r border-slate-200 w-32">Kode Akun</th>
                            <th className="py-2.5 px-3 border-r border-slate-200 w-28 text-center">Status</th>
                            <th className="py-2.5 px-4 border-r border-slate-200">Nama Akun</th>
                            <th className="py-2.5 px-4 border-r border-slate-200 w-44 text-center">Kategori Akuntansi</th>
                            <th className="py-2.5 px-4 border-r border-slate-200 text-center w-28">Saldo Normal</th>
                            <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedCoa.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                <p className="font-semibold text-slate-600">Tidak ada akun yang sesuai dengan pencarian/filter.</p>
                                <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau pilih &ldquo;Semua Golongan Akun&rdquo;.</p>
                              </td>
                            </tr>
                          ) : (
                            paginatedCoa.map((acc, index) => {
                              const rowNumber = coaStartIndex + index + 1
                              const code = acc.code
                              const isAsset = code.startsWith("1.")
                              const isLiab = code.startsWith("2.")
                              const isEquity = code.startsWith("3.")
                              const isRev = code.startsWith("4.")
                              const isExp = ["5.", "6.", "7."].some((p) => code.startsWith(p))

                              return (
                                <tr key={acc.code} className="hover:bg-indigo-50/40 transition-colors">
                                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-400">
                                    {rowNumber}
                                  </td>
                                  <td className="py-2.5 px-4 border-r border-slate-200 font-mono font-bold text-[#6777ef] whitespace-nowrap">
                                    {acc.code}
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-200 text-center whitespace-nowrap">
                                    {acc.isCustomized ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-block" title="Nama akun standar yang telah disesuaikan oleh pengguna">
                                        Disesuaikan
                                      </span>
                                    ) : acc.isStandard ? (
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 inline-block" title="Akun standar bawaan Kepmendesa 136">
                                        Standar
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block" title="Akun kustom tambahan pengguna">
                                        Kustom
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 border-r border-slate-200 text-slate-800">
                                    <div className="font-semibold">{acc.name}</div>
                                    {acc.isCustomized && acc.originalName && (
                                      <div className="text-[10px] text-slate-400 mt-0.5 italic flex items-center gap-1">
                                        <span>Bawaan:</span>
                                        <span className="font-mono text-slate-500">{acc.originalName}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 border-r border-slate-200 text-center">
                                    <span
                                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${
                                        isAsset
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : isLiab
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : isEquity
                                          ? "bg-purple-50 text-purple-700 border-purple-200"
                                          : isRev
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-rose-50 text-rose-700 border-rose-200"
                                      }`}
                                    >
                                      {acc.type}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 border-r border-slate-200 text-center">
                                    <span
                                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                        acc.normal?.toLowerCase() === "debit"
                                          ? "bg-slate-100 text-slate-700 border border-slate-200"
                                          : "bg-slate-100 text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      {acc.normal}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <div className="flex items-center justify-center gap-1">
                                      {(currentUser?.role === "ADMIN" || currentUser?.role === "BENDAHARA") && (
                                        <button
                                          type="button"
                                          onClick={() => setEditingCoa(acc)}
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors"
                                          title="Sesuaikan nama akun"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {!acc.isStandard && (currentUser?.role === "ADMIN" || currentUser?.role === "BENDAHARA") && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCoa(acc)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                          title="Hapus akun kustom pengguna"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION FOOTER CONTROLS */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                      <div>
                        Menampilkan{" "}
                        <strong className="text-slate-900 font-mono">
                          {filteredCoa.length > 0 ? coaStartIndex + 1 : 0}
                        </strong>{" "}
                        sampai{" "}
                        <strong className="text-slate-900 font-mono">
                          {Math.min(coaStartIndex + coaPerPage, filteredCoa.length)}
                        </strong>{" "}
                        dari{" "}
                        <strong className="text-slate-900 font-mono">{filteredCoa.length}</strong> akun
                        {filteredCoa.length !== coaList.length && (
                          <span className="text-slate-400 italic ml-1">
                            (difilter dari {coaList.length} total akun)
                          </span>
                        )}
                      </div>

                      {/* Tombol Halaman */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCoaPage((p) => Math.max(1, p - 1))}
                          disabled={safeCoaPage <= 1}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-medium"
                          title="Halaman Sebelumnya"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sebelumnya</span>
                        </button>

                        <div className="flex items-center gap-1 px-1">
                          {getPageNumbers().map((num, i) =>
                            typeof num === "number" ? (
                              <button
                                key={i}
                                onClick={() => setCoaPage(num)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                  safeCoaPage === num
                                    ? "bg-[#6777ef] text-white shadow-xs"
                                    : "text-slate-700 hover:bg-slate-100 border border-slate-200"
                                }`}
                              >
                                {num}
                              </button>
                            ) : (
                              <span key={i} className="px-1 text-slate-400 font-bold select-none">
                                {num}
                              </span>
                            )
                          )}
                        </div>

                        <button
                          onClick={() => setCoaPage((p) => Math.min(totalCoaPages, p + 1))}
                          disabled={safeCoaPage >= totalCoaPages}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-medium"
                          title="Halaman Selanjutnya"
                        >
                          <span className="hidden sm:inline">Selanjutnya</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

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

            {/* ===================== TAB-TAB KHUSUS BUKU & AUDIT INSPEKTORAT ===================== */}
            {activeTab === "general-ledger" && (
              <GeneralLedgerTab settings={settings} />
            )}

            {activeTab === "trial-balance" && (
              <TrialBalanceTab settings={settings} />
            )}

            {activeTab === "sub-ledger" && (
              <SubsidiaryLedgerTab settings={settings} />
            )}

            {/* TAB: EIS / KESEHATAN BUMDES */}
            {activeTab === "eis" && (
              <EisHealthTab settings={settings} />
            )}
          </main>
        </div>
      </div>


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

      {/* ===================== EDIT / CUSTOMIZE COA MODAL ===================== */}
      <EditCoaModal
        isOpen={!!editingCoa}
        onClose={() => setEditingCoa(null)}
        onSuccess={() => {
          setEditingCoa(null)
          loadData()
        }}
        account={editingCoa}
        isStandard={editingCoa?.isStandard}
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
