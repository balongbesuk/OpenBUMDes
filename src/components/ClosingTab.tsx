"use client"

import React, { useState, useEffect } from "react"
import {
  Lock,
  Unlock,
  Archive,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Printer,
  Save,
  ArrowRight,
  TrendingUp,
  Scale,
  DollarSign,
  Plus,
  Trash2,
  Info,
  Sparkles,
  ShieldCheck,
  Activity,
  Copy,
  Check
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import LpjPrintModal from "@/components/LpjPrintModal"

interface ClosingTabProps {
  selectedYear: string
  onSelectYear: (year: string) => void
  onNavigateTab: (tabName: string) => void
  onRefresh: () => void
  closingList: any[]
  reports: any
  accounts: any[]
  settings?: Record<string, string>
}

export default function ClosingTab({
  selectedYear,
  onSelectYear,
  onNavigateTab,
  onRefresh,
  closingList = [],
  reports,
  accounts = [],
  settings = {}
}: ClosingTabProps) {
  const [subTab, setSubTab] = useState<"arsip" | "tutup" | "buka">("arsip")
  const [selectedLpjClosing, setSelectedLpjClosing] = useState<any | null>(null)

  // --- State Tutup Buku ---
  const [closingYear, setClosingYear] = useState<string>(selectedYear)
  const [closedBy, setClosedBy] = useState("Bendahara & Direktur BUMDes")
  const [closingNotes, setClosingNotes] = useState("")
  const [shuRates, setShuRates] = useState({
    pades: 40,
    cadangan: 20,
    pengurus: 20,
    sosial: 10,
    pendidikan: 10
  })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [closingLoading, setClosingLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // --- State AI Pra-Audit & Kesehatan Keuangan ---
  const isAiConfigured = Boolean(settings?.gemini_api_key && settings.gemini_api_key.trim().length > 0)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditData, setAuditData] = useState<any>(null)
  const [auditError, setAuditError] = useState<string | null>(null)

  // --- State AI Narasi LPJ Musdes ---
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeData, setNarrativeData] = useState<any>(null)
  const [narrativeError, setNarrativeError] = useState<string | null>(null)
  const [copiedNarrative, setCopiedNarrative] = useState(false)

  const handleRunAudit = async () => {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const res = await fetch("/api/ai/health-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: parseInt(closingYear, 10) })
      })
      const json = await res.json()
      if (json.success) {
        setAuditData(json.data)
      } else {
        setAuditError(json.error || "Gagal melakukan audit kesehatan keuangan")
      }
    } catch (e: any) {
      setAuditError("Koneksi gagal: " + e.message)
    } finally {
      setAuditLoading(false)
    }
  }

  const handleGenerateNarrative = async () => {
    setNarrativeLoading(true)
    setNarrativeError(null)
    try {
      const res = await fetch("/api/ai/lpj-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: parseInt(closingYear, 10) })
      })
      const json = await res.json()
      if (json.success) {
        setNarrativeData(json.data)
      } else {
        setNarrativeError(json.error || "Gagal membuat narasi LPJ Musdes")
      }
    } catch (e: any) {
      setNarrativeError("Koneksi gagal: " + e.message)
    } finally {
      setNarrativeLoading(false)
    }
  }

  const handleCopyNarrative = () => {
    if (!narrativeData?.summary) return
    navigator.clipboard.writeText(narrativeData.summary)
    setCopiedNarrative(true)
    setTimeout(() => setCopiedNarrative(false), 2500)
  }

  // --- State Reopen ---
  const [reopenModalYear, setReopenModalYear] = useState<number | null>(null)
  const [reopenReason, setReopenReason] = useState("")
  const [reopenLoading, setReopenLoading] = useState(false)

  // --- State Buka Buku / Saldo Awal ---
  const [openingYear, setOpeningYear] = useState<string>(selectedYear || "2026")
  const [openingAccounts, setOpeningAccounts] = useState<
    { accountCode: string; name: string; type: "DEBIT" | "CREDIT"; amount: number }[]
  >([])
  const [openingLoading, setOpeningLoading] = useState(false)
  const [openingExists, setOpeningExists] = useState(false)

  // Cek apakah tahun yang dipilih di form tutup sudah berstatus ditutup
  const currentClosingRecord = closingList.find((c) => c.year === parseInt(closingYear, 10))
  const isCurrentlyLocked = currentClosingRecord && currentClosingRecord.isLocked

  // Hitung live net profit berjalan dari reports
  const netProfitLive = reports?.labaRugi?.netProfit || 0
  const totalRevLive = reports?.labaRugi?.totalRevenue || 0
  const totalExpLive = reports?.labaRugi?.totalExpense || 0

  // Kalkulasi nominal SHU live
  const calcShuNominal = (rate: number) => {
    if (netProfitLive <= 0) return 0
    return Math.round((netProfitLive * rate) / 100)
  }

  const totalShuRate =
    (shuRates.pades || 0) +
    (shuRates.cadangan || 0) +
    (shuRates.pengurus || 0) +
    (shuRates.sosial || 0) +
    (shuRates.pendidikan || 0)

  // Load Saldo Awal Preview
  const loadOpeningBalance = async (targetYear: string) => {
    setOpeningLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch(`/api/opening-balance?year=${targetYear}`)
      const data = await res.json()
      if (data.success) {
        setOpeningAccounts(data.data || [])
        setOpeningExists(data.exists)
      } else {
        setStatusMessage({ type: "error", text: data.error || "Gagal memuat pratinjau saldo awal" })
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: e.message || "Gagal memuat saldo awal" })
    } finally {
      setOpeningLoading(false)
    }
  }

  useEffect(() => {
    if (subTab === "buka") {
      loadOpeningBalance(openingYear)
    }
  }, [subTab, openingYear])

  // Handler Tutup Buku
  const handleExecuteClosing = async () => {
    setClosingLoading(true)
    setStatusMessage(null)
    setShowConfirmModal(false)
    try {
      const res = await fetch("/api/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(closingYear, 10),
          closedBy,
          shuRates,
          notes: closingNotes
        })
      })
      const data = await res.json()
      if (data.success) {
        setStatusMessage({ type: "success", text: data.message })
        onRefresh()
        setSubTab("arsip")
      } else {
        setStatusMessage({ type: "error", text: data.error || "Gagal menjalankan tutup buku" })
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: e.message || "Terjadi kesalahan sistem saat tutup buku" })
    } finally {
      setClosingLoading(false)
    }
  }

  // Handler Reopen
  const handleExecuteReopen = async () => {
    if (!reopenModalYear) return
    setReopenLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch("/api/closing/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: reopenModalYear,
          reason: reopenReason || "Koreksi pembukuan oleh pengurus"
        })
      })
      const data = await res.json()
      if (data.success) {
        setStatusMessage({ type: "success", text: data.message })
        setReopenModalYear(null)
        setReopenReason("")
        onRefresh()
      } else {
        setStatusMessage({ type: "error", text: data.error || "Gagal membuka kunci periode" })
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: e.message || "Terjadi kesalahan" })
    } finally {
      setReopenLoading(false)
    }
  }

  // Handler Simpan Saldo Awal
  const handleSaveOpeningBalance = async () => {
    setOpeningLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch("/api/opening-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(openingYear, 10),
          accounts: openingAccounts
        })
      })
      const data = await res.json()
      if (data.success) {
        setStatusMessage({ type: "success", text: data.message })
        setOpeningExists(true)
        onRefresh()
      } else {
        setStatusMessage({ type: "error", text: data.error || "Gagal menyimpan saldo awal" })
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: e.message || "Terjadi kesalahan" })
    } finally {
      setOpeningLoading(false)
    }
  }

  // Balance calculation for opening balance
  const totalDebitOpening = openingAccounts
    .filter((a) => a.type === "DEBIT")
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0)
  const totalCreditOpening = openingAccounts
    .filter((a) => a.type === "CREDIT")
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0)
  const isOpeningBalanced = Math.abs(totalDebitOpening - totalCreditOpening) < 0.01

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 text-sm font-medium">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white rounded-2xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-800 text-xs font-bold border border-indigo-200/60 mb-3 shadow-2xs">
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
              Siklus Akuntansi Resmi Kepmendes 136/2022
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">
              Tutup Buku, Buka Buku & Arsip Laporan Tahunan
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Jalankan penutupan pembukuan akhir tahun 31 Desember, pembagian SHU, penguncian arsip LPJ permanen, serta roll-forward Saldo Awal tahun baru 1 Januari.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefresh()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-2xs transition-all hover:shadow-xs self-start md:self-auto shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2.5 mt-6 pt-5 border-t border-indigo-100/90">
          <button
            onClick={() => setSubTab("arsip")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === "arsip"
                ? "bg-white text-amber-800 shadow-sm border border-amber-200 font-bold"
                : "bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80"
            }`}
          >
            <Archive className="w-4 h-4 text-amber-600" />
            Arsip Laporan Tahunan ({closingList.length})
          </button>
          <button
            onClick={() => setSubTab("tutup")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === "tutup"
                ? "bg-white text-rose-800 shadow-sm border border-rose-200 font-bold"
                : "bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80"
            }`}
          >
            <Lock className="w-4 h-4 text-rose-600" />
            Tutup Buku Akhir Tahun (Annual Closing)
          </button>
          <button
            onClick={() => setSubTab("buka")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === "buka"
                ? "bg-white text-emerald-800 shadow-sm border border-emerald-200 font-bold"
                : "bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80"
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            Buka Buku & Saldo Awal (Roll-Forward)
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: ARSIP LAPORAN TAHUNAN (TAHUN-TAHUN SEBELUMNYA)       */}
      {/* ============================================================== */}
      {subTab === "arsip" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Arsip Resmi Laporan Keuangan Tahunan (LPJ Musdes)
              </h3>
              <p className="text-xs text-slate-500">
                Seluruh laporan tahun sebelumnya tersimpan permanen dalam snapshot read-only dan dapat dilihat kembali sewaktu-waktu.
              </p>
            </div>
          </div>

          {closingList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-600">
                <Archive className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Belum Ada Arsip Tutup Buku Tahunan</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Ketika Anda menjalankan proses <strong>Tutup Buku Akhir Tahun</strong>, sistem akan secara otomatis membekukan laporan keuangan tahun tersebut ke dalam arsip ini agar tidak dapat diubah-ubah lagi.
              </p>
              <button
                onClick={() => setSubTab("tutup")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                Mulai Tutup Buku Tahun Ini
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {closingList.map((closing) => {
                const dateStr = closing.closedAt
                  ? new Date(closing.closedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })
                  : "-"

                return (
                  <div
                    key={closing.id || closing.year}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-indigo-900 flex flex-col items-center justify-center font-bold shadow-2xs">
                          <span className="text-[10px] text-indigo-600 font-semibold tracking-wider">THN</span>
                          <span className="text-base leading-none font-black text-indigo-950">{closing.year}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-800">
                              Laporan Keuangan Tahunan {closing.year}
                            </h4>
                            {closing.isLocked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Lock className="w-2.5 h-2.5" />
                                TERKUNCI (READ-ONLY)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Unlock className="w-2.5 h-2.5" />
                                DIBUKA KEMBALI
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ditutup pada: <span className="font-semibold">{dateStr}</span> oleh{" "}
                            <span className="font-semibold text-slate-700">{closing.closedBy}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            onSelectYear(String(closing.year))
                            onNavigateTab("laba-rugi")
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all border border-indigo-200"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Lihat Laporan Tahun Ini
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLpjClosing(closing)
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak LPJ
                        </button>
                        {closing.isLocked && (
                          <button
                            onClick={() => setReopenModalYear(closing.year)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all border border-rose-200"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Buka Kunci
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Financial Summary Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Total Omset / Pendapatan</span>
                        <span className="text-sm font-bold font-mono text-slate-800">
                          {formatRupiah(closing.totalRevenue)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] text-slate-500 block">Total Beban Usaha</span>
                        <span className="text-sm font-bold font-mono text-rose-600">
                          {formatRupiah(closing.totalExpense)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <span className="text-[11px] text-emerald-700 font-medium block">
                          Laba Bersih (SHU)
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-800">
                          {formatRupiah(closing.netProfit)}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <span className="text-[11px] text-blue-700 font-medium block">
                          Alokasi PADes ({closing.padesPercent}%)
                        </span>
                        <span className="text-sm font-bold font-mono text-blue-800">
                          {formatRupiah(closing.padesAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Rincian Alokasi SHU */}
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
                      <span>
                        Cadangan Umum: <strong>{formatRupiah(closing.cadanganAmount)}</strong>
                      </span>
                      <span>
                        Jasa Pengurus/Pengawas: <strong>{formatRupiah(closing.pengurusAmount)}</strong>
                      </span>
                      <span>
                        Dana Sosial: <strong>{formatRupiah(closing.sosialAmount)}</strong>
                      </span>
                      <span>
                        Dana Pendidikan: <strong>{formatRupiah(closing.pendidikanAmount)}</strong>
                      </span>
                    </div>

                    {closing.notes && (
                      <div className="mt-2 text-[11px] text-slate-400 italic">
                        Catatan: {closing.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: TUTUP BUKU AKHIR TAHUN (ANNUAL CLOSING)              */}
      {/* ============================================================== */}
      {subTab === "tutup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Form Eksekusi Tutup Buku */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                Formulir Tutup Buku & Jurnal Penutup Akhir Tahun
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Proses ini akan menolkan akun nominal (Pendapatan & Beban), mentransfer laba bersih ke akun Ekuitas Laba Ditahan (3.1.03.01), serta mengunci pembukuan agar arsip LPJ resmi terjaga.
              </p>

              {isCurrentlyLocked ? (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <strong>Peringatan:</strong> Tahun <strong>{closingYear}</strong> saat ini sudah berstatus ditutup buku (Terkunci). Jika Anda menjalankannya kembali, Jurnal Penutup dan arsip snapshot akan diperbarui ulang.
                    </div>
                  </div>
                  {currentClosingRecord && (
                    <button
                      type="button"
                      onClick={() => setSelectedLpjClosing(currentClosingRecord)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak LPJ {closingYear}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      Tahun <strong>{closingYear}</strong> belum ditutup. Anda dapat melihat pratinjau dokumen resmi LPJ sebelum melakukan tutup buku.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLpjClosing({
                        id: `draft-${closingYear}`,
                        year: parseInt(closingYear, 10),
                        closedAt: new Date().toISOString(),
                        closedBy: closedBy || "Pengurus BUMDes",
                        totalRevenue: totalRevLive,
                        totalExpense: totalExpLive,
                        netProfit: netProfitLive,
                        padesPercent: shuRates.pades,
                        padesAmount: calcShuNominal(shuRates.pades),
                        cadanganPercent: shuRates.cadangan,
                        cadanganAmount: calcShuNominal(shuRates.cadangan),
                        pengurusPercent: shuRates.pengurus,
                        pengurusAmount: calcShuNominal(shuRates.pengurus),
                        sosialPercent: shuRates.sosial,
                        sosialAmount: calcShuNominal(shuRates.sosial),
                        pendidikanPercent: shuRates.pendidikan,
                        pendidikanAmount: calcShuNominal(shuRates.pendidikan),
                        snapshotData: JSON.stringify(reports),
                        isLocked: false,
                        notes: "Pratinjau Draft LPJ Sebelum Tutup Buku"
                      })
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#6777ef] hover:bg-[#5868e4] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Pratinjau LPJ Draft {closingYear}</span>
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* ASISTEN AI: PRA-AUDIT KEUANGAN & RINGKASAN MUSDES          */}
              {/* ========================================================= */}
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-emerald-50/50 border border-indigo-100 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isAiConfigured ? "Asisten AI: Pra-Audit & Analisis Musdes" : "Asisten Cerdas: Pra-Audit & Analisis Musdes"} ({closingYear})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAiConfigured
                          ? "Deteksi anomali pembukuan sebelum tutup buku dan susun ringkasan pidato LPJ Musdes via Gemini AI."
                          : "Deteksi anomali pembukuan sebelum tutup buku dan susun ringkasan naskah LPJ Musdes (Mode Otomatis Cerdas)."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunAudit}
                      disabled={auditLoading}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {auditLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>Menganalisis...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isAiConfigured ? "Pra-Audit AI" : "Pra-Audit Otomatis"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateNarrative}
                      disabled={narrativeLoading}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {narrativeLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyusun Narasi...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isAiConfigured ? "Narasi Musdes AI" : "Ringkasan Musdes"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!isAiConfigured && (
                  <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-700">Mode Cerdas Bawaan Aktif:</span>
                      <span>Pra-Audit dan Ringkasan Musdes berjalan offline tanpa butuh token.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab("settings")}
                      className="text-indigo-600 font-bold hover:underline shrink-0 text-left sm:text-right"
                    >
                      Aktifkan Gemini AI di Pengaturan &rarr;
                    </button>
                  </div>
                )}

                {auditError && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{auditError}</span>
                  </div>
                )}

                {narrativeError && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{narrativeError}</span>
                  </div>
                )}

                {/* HASIL PRA-AUDIT */}
                {auditData && (
                  <div className="mt-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Status Kesehatan Pembukuan:</span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                            auditData.overallStatus === "SEHAT"
                              ? "bg-emerald-100 text-emerald-800"
                              : auditData.overallStatus === "PERHATIAN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {auditData.overallStatus} ({auditData.healthScore}/100)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                        <span>BOPO: <strong>{auditData.metrics.bopoPercent}%</strong></span>
                        <span>Margin Laba: <strong>{auditData.metrics.netMarginPercent}%</strong></span>
                        <span>Kas Akhir: <strong>{formatRupiah(auditData.metrics.cashEnd)}</strong></span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {auditData.issues.map((issue: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg text-xs border ${
                            issue.type === "critical"
                              ? "bg-rose-50/70 border-rose-200 text-rose-900"
                              : issue.type === "warning"
                              ? "bg-amber-50/70 border-amber-200 text-amber-900"
                              : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-0.5">
                            {issue.type === "critical" ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            ) : issue.type === "warning" ? (
                              <Info className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>{issue.title}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-700 ml-5">{issue.detail}</p>
                          <p className="text-[10.5px] italic text-slate-500 ml-5 mt-1">
                            Saran: {issue.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HASIL NARASI LPJ MUSDES */}
                {narrativeData && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-300" />
                        <span className="text-xs font-bold text-amber-200">
                          Ikhtisar Eksekutif Musdes TA {closingYear}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-slate-300">
                          {narrativeData.engine === "GEMINI_AI" ? "AI Generated" : "Analisis Cerdas Standar"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyNarrative}
                        className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedNarrative ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-300" />
                            <span>Salin Narasi</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-200 font-sans">
                      {narrativeData.summary}
                    </p>

                    {narrativeData.recommendations && narrativeData.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[11px] font-bold text-amber-300 block mb-1">
                          Rekomendasi Strategis Tahun Depan:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                          {narrativeData.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tahun Buku yang Ditutup
                  </label>
                  <select
                    value={closingYear}
                    onChange={(e) => {
                      setClosingYear(e.target.value)
                      onSelectYear(e.target.value)
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="2024">Tahun Buku 2024</option>
                    <option value="2025">Tahun Buku 2025</option>
                    <option value="2026">Tahun Buku 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Penanggung Jawab / Otorisator
                  </label>
                  <input
                    type="text"
                    value={closedBy}
                    onChange={(e) => setClosedBy(e.target.value)}
                    placeholder="Contoh: Bendahara & Direktur BUMDes"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Rincian Alokasi Bagi Hasil SHU (%) */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Rencana Alokasi Sisa Hasil Usaha (SHU)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Sesuaikan persentase alokasi sesuai Anggaran Dasar / Anggaran Rumah Tangga (AD/ART) BUMDes.
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      totalShuRate === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    Total: {totalShuRate}% {totalShuRate === 100 ? "✓" : "(Harus 100%)"}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* PADes */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800">
                        1. Pendapatan Asli Desa (PADes)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Disetor ke Kas Desa sebagai kontribusi APBDes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={shuRates.pades}
                        onChange={(e) =>
                          setShuRates({ ...shuRates, pades: parseFloat(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-1.5 text-right font-mono font-bold rounded-lg border border-slate-300 text-xs"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                      <span className="text-xs font-mono font-bold text-indigo-700 w-28 text-right">
                        {formatRupiah(calcShuNominal(shuRates.pades))}
                      </span>
                    </div>
                  </div>

                  {/* Dana Cadangan Umum */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800">
                        2. Cadangan Modal / Dana Cadangan
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Pengembangan usaha dan penguatan ekuitas BUMDes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={shuRates.cadangan}
                        onChange={(e) =>
                          setShuRates({ ...shuRates, cadangan: parseFloat(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-1.5 text-right font-mono font-bold rounded-lg border border-slate-300 text-xs"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                      <span className="text-xs font-mono font-bold text-indigo-700 w-28 text-right">
                        {formatRupiah(calcShuNominal(shuRates.cadangan))}
                      </span>
                    </div>
                  </div>

                  {/* Jasa Pengurus & Pengawas */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800">
                        3. Jasa Pengurus & Pengawas BUMDes
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Tantiem pengelola, pelaksana operasional & penasihat
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={shuRates.pengurus}
                        onChange={(e) =>
                          setShuRates({ ...shuRates, pengurus: parseFloat(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-1.5 text-right font-mono font-bold rounded-lg border border-slate-300 text-xs"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                      <span className="text-xs font-mono font-bold text-indigo-700 w-28 text-right">
                        {formatRupiah(calcShuNominal(shuRates.pengurus))}
                      </span>
                    </div>
                  </div>

                  {/* Dana Sosial */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800">
                        4. Dana Sosial & Lingkungan Desa
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Bantuan kemasyarakatan & kelestarian lingkungan desa
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={shuRates.sosial}
                        onChange={(e) =>
                          setShuRates({ ...shuRates, sosial: parseFloat(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-1.5 text-right font-mono font-bold rounded-lg border border-slate-300 text-xs"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                      <span className="text-xs font-mono font-bold text-indigo-700 w-28 text-right">
                        {formatRupiah(calcShuNominal(shuRates.sosial))}
                      </span>
                    </div>
                  </div>

                  {/* Dana Pendidikan */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 gap-4">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-800">
                        5. Dana Pendidikan & Pelatihan SDM
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Peningkatan kapasitas staf & kelembagaan
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={shuRates.pendidikan}
                        onChange={(e) =>
                          setShuRates({ ...shuRates, pendidikan: parseFloat(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-1.5 text-right font-mono font-bold rounded-lg border border-slate-300 text-xs"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                      <span className="text-xs font-mono font-bold text-indigo-700 w-28 text-right">
                        {formatRupiah(calcShuNominal(shuRates.pendidikan))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catatan / Notula */}
              <div className="mt-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Berita Acara / Rekomendasi Musdes (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Contoh: Disahkan dalam Musyawarah Desa LPJ Akhir Tahun BUMDes Barokah..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-5 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  disabled={totalShuRate !== 100 || closingLoading}
                  onClick={() => setShowConfirmModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all"
                >
                  <Lock className="w-4 h-4" />
                  Jalankan Tutup Buku & Buat Jurnal Penutup
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Pratinjau Kinerja Tahun Berjalan */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Pratinjau Kinerja Tahun {closingYear}
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Pendapatan Operasional</span>
                  <span className="text-base font-bold font-mono text-slate-800">
                    {formatRupiah(totalRevLive)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Beban Operasional</span>
                  <span className="text-base font-bold font-mono text-rose-600">
                    {formatRupiah(totalExpLive)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 block">
                    Laba Bersih Tahun Berjalan (SHU)
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-700">
                    {formatRupiah(netProfitLive)}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-1">
                    {netProfitLive > 0
                      ? "Akan dialihkan ke akun Laba Ditahan (3.1.03.01)"
                      : "Operasional impas atau defisit"}
                  </span>
                </div>
              </div>

              <div className="mt-5 p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 text-xs space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Info className="w-4 h-4" /> Konsekuensi Tutup Buku:
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800/90 leading-relaxed">
                  <li>Akun pendapatan (4) dan beban (5,6,7) di-reset ke 0.</li>
                  <li>Dibuat nomor bukti Memorial otomatis JP/{closingYear}/12/0001.</li>
                  <li>Tahun {closingYear} berstatus terkunci dari transaksi baru.</li>
                  <li>Laporan keuangan dibekukan sebagai arsip permanen LPJ.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: BUKA BUKU & SALDO AWAL (ROLL-FORWARD)                 */}
      {/* ============================================================== */}
      {subTab === "buka" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                Pencatatan Saldo Awal & Buka Buku Tahun Baru (Roll-Forward)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tarik otomatis saldo akhir Neraca tahun sebelumnya per 31 Desember menjadi Saldo Awal 1 Januari tahun buku baru.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Tahun Buku Baru:</label>
              <select
                value={openingYear}
                onChange={(e) => setOpeningYear(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="2025">Tahun 2025</option>
                <option value="2026">Tahun 2026</option>
              </select>
              <button
                type="button"
                onClick={() => loadOpeningBalance(openingYear)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tarik Ulang
              </button>
            </div>
          </div>

          {openingExists && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Tahun {openingYear} telah memiliki catatan Saldo Awal (Buka Buku) di sistem.
              </span>
              <span className="text-[11px] bg-blue-200/60 px-2.5 py-0.5 rounded-full font-bold">
                Tersimpan
              </span>
            </div>
          )}

          {/* Table Opening Balance */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3" colSpan={2}>Pilihan Akun Neraca (Kepmendes 136)</th>
                  <th className="px-4 py-3 text-center">Posisi</th>
                  <th className="px-4 py-3 text-right">Nominal Saldo Awal (Rp)</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openingAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      Tidak ada akun neraca terdeteksi. Silakan klik &ldquo;Tarik Ulang&rdquo; atau tambah akun manual di bawah.
                    </td>
                  </tr>
                ) : (
                  openingAccounts.map((acc, index) => {
                    const neracaAccounts = (accounts || []).filter((a: any) => {
                      const c = a.code || ""
                      return c.startsWith("1.") || c.startsWith("2.") || c.startsWith("3.")
                    })
                    const hasCurrent = neracaAccounts.some((na: any) => na.code === acc.accountCode)

                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5" colSpan={2}>
                          <select
                            value={acc.accountCode}
                            onChange={(e) => {
                              const found = (accounts || []).find((a: any) => a.code === e.target.value)
                              const updated = [...openingAccounts]
                              const code = e.target.value
                              const isContra =
                                code.startsWith("1.3.07") ||
                                code.startsWith("1.3.08") ||

                                found?.normal === "Kredit" ||
                                (found?.name || "").toLowerCase().includes("akumulasi")
                              const defaultSide = isContra
                                ? "CREDIT"
                                : code.startsWith("1.")
                                ? "DEBIT"
                                : "CREDIT"

                              updated[index] = {
                                ...updated[index],
                                accountCode: code,
                                name: found?.name || updated[index].name,
                                type: defaultSide
                              }
                              setOpeningAccounts(updated)
                            }}
                            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                          >
                            {!hasCurrent && (
                              <option value={acc.accountCode}>
                                {acc.accountCode} - {acc.name}
                              </option>
                            )}
                            {neracaAccounts.map((a: any) => (
                              <option key={a.code} value={a.code}>
                                {a.code} - {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...openingAccounts]
                              updated[index].type = updated[index].type === "DEBIT" ? "CREDIT" : "DEBIT"
                              setOpeningAccounts(updated)
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              acc.type === "DEBIT"
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                            title="Klik untuk ubah posisi Debit / Kredit"
                          >
                            {acc.type}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="relative inline-flex items-center">
                            <span className="absolute left-2.5 text-[11px] font-bold text-slate-400 select-none">
                              Rp
                            </span>
                            <input
                              type="text"
                              value={acc.amount ? Number(acc.amount).toLocaleString("id-ID") : ""}
                              onChange={(e) => {
                                const rawVal = e.target.value.replace(/\D/g, "")
                                const val = rawVal ? parseInt(rawVal, 10) : 0
                                const updated = [...openingAccounts]
                                updated[index].amount = val
                                setOpeningAccounts(updated)
                              }}
                              placeholder="0"
                              className="w-44 pl-8 pr-3 py-1.5 text-right font-mono font-bold text-slate-800 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setOpeningAccounts(openingAccounts.filter((_, i) => i !== index))
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            
            {/* Tombol Tambah Akun Saldo Awal */}
            <div className="p-2.5 bg-slate-50/70 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Format angka otomatis menggunakan pemisah ribuan Rupiah Indonesia (Rp).
              </span>
              <button
                type="button"
                onClick={() => {
                  const neracaAccounts = (accounts || []).filter((a: any) => {
                    const c = a.code || ""
                    return c.startsWith("1.") || c.startsWith("2.") || c.startsWith("3.")
                  })
                  const defaultAcc = neracaAccounts.find(
                    (a: any) => !openingAccounts.some((oa) => oa.accountCode === a.code)
                  ) || neracaAccounts[0] || { code: "1.1.01.06", name: "Kas di Bank Jatim", normal: "Debit" }

                  const isContra =
                    defaultAcc.code.startsWith("1.3.07") ||
                    defaultAcc.code.startsWith("1.3.08") ||

                    defaultAcc.normal === "Kredit"
                  const defaultSide = isContra
                    ? "CREDIT"
                    : defaultAcc.code.startsWith("1.")
                    ? "DEBIT"
                    : "CREDIT"

                  setOpeningAccounts([
                    ...openingAccounts,
                    {
                      accountCode: defaultAcc.code,
                      name: defaultAcc.name,
                      type: defaultSide,
                      amount: 0
                    }
                  ])
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Tambah Baris Akun
              </button>
            </div>
          </div>

          {/* Balance Indicator & Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Debit:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatRupiah(totalDebitOpening)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total Kredit:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatRupiah(totalCreditOpening)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status Keseimbangan:</span>
                {isOpeningBalanced ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    BALANCE (SEIMBANG)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    SELISIH: {formatRupiah(Math.abs(totalDebitOpening - totalCreditOpening))}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!isOpeningBalanced || openingLoading || openingAccounts.length === 0}
              onClick={handleSaveOpeningBalance}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              {openingLoading ? "Menyimpan..." : "Simpan Saldo Awal & Buka Pembukuan"}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL KONFIRMASI TUTUP BUKU AKHIR TAHUN                         */}
      {/* ============================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Konfirmasi Tutup Buku Akhir Tahun {closingYear}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Tindakan ini akan memproses siklus akhir tahun sesuai standar akuntansi:
            </p>
            <ul className="text-xs text-slate-600 list-disc list-inside mt-2 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <li>Akun Pendapatan & Beban di-reset ke Rp 0.</li>
              <li>Laba bersih <strong>{formatRupiah(netProfitLive)}</strong> ditransfer ke Laba Ditahan.</li>
              <li>Jurnal Penutup (JP/{closingYear}/12/0001) dibuat otomatis.</li>
              <li>Arsip laporan tahun {closingYear} dibekukan dan terkunci.</li>
            </ul>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteClosing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Ya, Jalankan Tutup Buku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL BUKA KUNCI PERIODE (REOPEN)                               */}
      {/* ============================================================== */}
      {reopenModalYear && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Unlock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Buka Kembali Kunci Tahun {reopenModalYear}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Membuka kunci periode memungkinkan Anda mengoreksi transaksi tahun tersebut. Jurnal penutup (JP) sebelumnya akan dicabut sementara.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Pembukaan Kunci
              </label>
              <input
                type="text"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Contoh: Koreksi penyesuaian bukti transaksi fisik..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setReopenModalYear(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={reopenLoading}
                onClick={handleExecuteReopen}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
              >
                {reopenLoading ? "Membuka..." : "Buka Kunci Periode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK LPJ LENGKAP KEMENTERIAN DESA (KEPMENDES 136/2022) */}
      {selectedLpjClosing && (
        <LpjPrintModal
          closing={selectedLpjClosing}
          settings={settings}
          onClose={() => setSelectedLpjClosing(null)}
        />
      )}
    </div>
  )
}
