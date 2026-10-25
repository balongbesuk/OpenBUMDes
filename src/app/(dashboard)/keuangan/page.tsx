"use client"

import React, { useState, useEffect } from "react"
import {
  BookOpen,
  TrendingUp,
  Scale,
  DollarSign,
  Printer,
  AlertTriangle,
  Lock,
  Calendar,
  FileText
} from "lucide-react"
import { useSettings } from "@/context/SettingsContext"
import LabaRugiTab from "./components/LabaRugiTab"
import NeracaTab from "./components/NeracaTab"
import ArusKasModalTab from "./components/ArusKasModalTab"
import BkuTab from "./components/BkuTab"
import CoaTab from "./components/CoaTab"
import PajakTab from "./components/PajakTab"
import AsetTab from "./components/AsetTab"
import ShuTab from "./components/ShuTab"
import TutupBukuTab from "./components/TutupBukuTab"
import LpjTab from "./components/LpjTab"
import { BookPlus } from "lucide-react"

interface ReportData {
  labaRugi: {
    revenues: { code: string; name: string; amount: number }[]
    expenses: { code: string; name: string; amount: number }[]
    totalRevenue: number
    totalExpense: number
    netProfit: number
  }
  neraca: {
    currentAssets: { name: string; amount: number }[]
    totalCurrentAssets: number
    fixedAssets: {
      peralatan: number
      akumulasiPenyusutan: number
      net: number
    }
    totalAssets: number
    liabilities: { name: string; amount: number }[]
    totalLiabilities: number
    equity: { name: string; amount: number }[]
    totalEquity: number
    totalLiabilitiesAndEquity: number
  }
  shuSettings: {
    pengurus: number
    pengawas: number
    sosial: number
    modal: number
    desa: number
  }
}

export default function KeuanganPage() {
  const settings = useSettings()
  const [activeTab, setActiveTab] = useState<"bku" | "coa" | "labarugi" | "neraca" | "aruskasmodal" | "pajak" | "aset" | "shu" | "tutupbuku" | "lpjtahunan">("bku")
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/keuangan/reports")
      const result = await res.json()
      if (result.success) {
        setReport(result.data)
      } else {
        throw new Error(result.error || "Gagal mengambil laporan keuangan")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64"></div>
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="h-96 bg-slate-200 rounded-3xl"></div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm">
        <p className="font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          Gagal Memuat Laporan Keuangan
        </p>
        <p className="mt-1 text-xs">{error || "Koneksi ke database terputus."}</p>
        <button
          onClick={fetchReports}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  // Double-entry balancing check
  const isNeracaBalanced = Math.abs(report.neraca.totalAssets - report.neraca.totalLiabilitiesAndEquity) < 0.1

  return (
    <div className="space-y-6">

      {/* Header (No print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pembukuan Keuangan & LPJ</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Unduh laporan neraca formal SAK EMKM, laporan perhitungan laba/rugi per unit usaha, tutup buku bulanan, dan rincian alokasi SHU.
          </p>
        </div>
        {activeTab !== "tutupbuku" && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-emerald-600/10 transition-all active:scale-95 shrink-0 w-fit"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan / PDF
          </button>
        )}
      </div>

      {/* Document print header */}
      {activeTab !== "lpjtahunan" && (
        <div className="hidden print-title text-center space-y-1">
          <h1 className="text-xl font-bold uppercase text-slate-900">{settings?.bumdes_name || "BUMDES"}</h1>
          <p className="text-sm font-semibold text-slate-500">
            {settings?.village_name ? `Desa ${settings.village_name}, Kecamatan ${settings.district_name}, Kabupaten ${settings.regency_name}` : ""}
          </p>
          <div className="border-b-2 border-slate-900 my-4" />
          <h2 className="text-sm font-bold uppercase text-slate-800 mt-2">
            {activeTab === "labarugi" && "Laporan Perhitungan Sisa Hasil Usaha (Laba / Rugi)"}
            {activeTab === "neraca" && "Laporan Posisi Keuangan (Neraca)"}
            {activeTab === "shu" && "Daftar Rencana Pembagian Hasil Usaha (SHU)"}
          </h2>
          <p className="text-xs text-slate-400 font-semibold">Tahun Anggaran Berjalan (T.A 2026)</p>
        </div>
      )}

      {/* Tabs navigation (No print) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-3xl w-full md:w-fit no-print">
        <button
          onClick={() => setActiveTab("bku")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "bku" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
          Buku Kas Umum (Jurnal)
        </button>
        <button
          onClick={() => setActiveTab("coa")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "coa" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <BookPlus className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
          Bagan Akun (COA)
        </button>
        <button
          onClick={() => setActiveTab("labarugi")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "labarugi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          Laba / Rugi
        </button>
        <button
          onClick={() => setActiveTab("neraca")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "neraca" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Scale className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
          Neraca SAK EMKM
        </button>
        <button
          onClick={() => setActiveTab("aruskasmodal")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "aruskasmodal" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
          Arus Kas & Modal
        </button>
        <button
          onClick={() => setActiveTab("pajak")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "pajak" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Scale className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
          Buku Pajak
        </button>
        <button
          onClick={() => setActiveTab("aset")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "aset" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-800" />
          Aset & Inventaris
        </button>
        <button
          onClick={() => setActiveTab("shu")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "shu" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
          Pembagian SHU
        </button>
        <button
          onClick={() => setActiveTab("tutupbuku")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "tutupbuku" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
          Tutup Buku
        </button>
        <button
          onClick={() => setActiveTab("lpjtahunan")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center ${
            activeTab === "lpjtahunan" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-650" />
          LPJ Tahunan Resmi
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "bku" && (
        <BkuTab onRefreshReport={fetchReports} />
      )}

      {activeTab === "coa" && (
        <CoaTab onRefreshReport={fetchReports} />
      )}

      {activeTab === "labarugi" && (
        <LabaRugiTab report={report} />
      )}

      {activeTab === "neraca" && (
        <NeracaTab report={report} isNeracaBalanced={isNeracaBalanced} />
      )}

      {activeTab === "shu" && (
        <ShuTab report={report} />
      )}

      {activeTab === "aruskasmodal" && (
        <ArusKasModalTab report={report} />
      )}

      {activeTab === "pajak" && (
        <PajakTab onRefreshReport={fetchReports} />
      )}

      {activeTab === "aset" && (
        <AsetTab onRefreshReport={fetchReports} />
      )}

      {activeTab === "tutupbuku" && (
        <TutupBukuTab />
      )}

      {activeTab === "lpjtahunan" && (
        <LpjTab report={report} settings={settings} />
      )}
    </div>
  )
}
