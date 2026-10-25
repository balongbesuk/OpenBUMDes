"use client"

import React, { useState, useEffect } from "react"
import {
  Activity,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Building2,
  HelpCircle,
  Award,
  Sparkles,
  ChevronRight
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"

interface EisHealthTabProps {
  settings?: Record<string, string>
}

export default function EisHealthTab({ settings = {} }: EisHealthTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [meta, setMeta] = useState<any>(null)
  const [indicators, setIndicators] = useState<any[]>([])

  const bumdesName = settings.bumdes_name || "BUMDesa Mandiri Sejahtera"
  const villageName = settings.village_name || "Balongbesuk"
  const subdistrictName = settings.subdistrict_name || "Diwek"
  const regencyName = settings.regency_name || "Jombang"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const directorNip = settings.director_nip || "-"
  const villageHead = settings.village_head || "MOCHAMAD SAIFUR"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"
  const treasurerNip = settings.treasurer_nip || "-"

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/eis?year=${selectedYear}`
      const res = await fetch(url)
      const json = await res.json()

      if (json.success) {
        setMeta(json.meta)
        setIndicators(json.indicators || [])
      } else {
        setError(json.error || "Gagal memuat data EIS")
      }
    } catch (e: any) {
      setError("Kesalahan koneksi: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedYear])

  // Cetak Dokumen Bersih
  const handlePrint = () => {
    const printContent = document.getElementById("eis-print-area")
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      window.print()
      return
    }

    const styleTags = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((el) => el.outerHTML)
      .join("\n")

    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>EIS Tingkat Kesehatan Keuangan - ${bumdesName} TA ${selectedYear}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  ${styleTags}
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #fff !important; }
      @page { size: A4 portrait; margin: 12mm; }
      .no-print { display: none !important; }
    }
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #fff; color: #1e293b; padding: 20px; }
  </style>
</head>
<body>
  ${printContent.innerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" />
            Executive Information System (EIS)
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Penilaian Tingkat Kesehatan Keuangan BUMDes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Standar Resmi Formulir EIS Aplikasi PPAK BUM Desa Ver 4.5 & Pedoman Evaluasi Pembinaan Kemendesa PDTT.
          </p>
        </div>

        {/* PRINT BUTTON */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-600" : ""}`} />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-sm hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Ringkasan Eksekutif</span>
          </button>
        </div>
      </div>

      {/* FILTER TAHUN */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tahun Evaluasi Buku:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all cursor-pointer"
          >
            {[new Date().getFullYear(), 2025, 2024].map((y) => (
              <option key={y} value={y}>
                Tahun Buku {y} {y === new Date().getFullYear() ? "(Tahun Berjalan)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Skor maksimal total 100 poin (8 Indikator Keuangan)</span>
        </div>
      </div>

      {/* HERO SCORE BANNER */}
      {meta && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          {/* Background decorative pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-8">
            <Award className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Score Big Display */}
            <div className="md:col-span-4 flex items-center gap-5 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
              <div
                className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center font-black text-3xl shadow-lg shrink-0 ${
                  !meta.hasData || meta.category === "BELUM ADA DATA"
                    ? "bg-slate-800 text-slate-400 border border-slate-700 shadow-slate-900/40"
                    : meta.category === "SEHAT"
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : meta.category === "KURANG SEHAT"
                    ? "bg-amber-500 text-white shadow-amber-500/20"
                    : "bg-rose-500 text-white shadow-rose-500/20"
                }`}
              >
                <span>{meta.hasData ? meta.totalScore : "-"}</span>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80 mt-0.5">
                  {meta.hasData ? "/ 100" : "NIHIL"}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Predikat Kesehatan
                </span>
                <h3
                  className={`text-2xl font-black tracking-tight mt-0.5 ${
                    !meta.hasData || meta.category === "BELUM ADA DATA"
                      ? "text-slate-300"
                      : meta.category === "SEHAT"
                      ? "text-emerald-400"
                      : meta.category === "KURANG SEHAT"
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {meta.category}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tahun Anggaran {selectedYear}
                </p>
              </div>
            </div>

            {/* Explanation / Diagnosis */}
            <div className="md:col-span-8 space-y-3">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Analisis Eksekutif untuk Penasihat (Kades) & Direktur</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {!meta.hasData || meta.category === "BELUM ADA DATA"
                  ? "Database saat ini masih kosong (belum ada transaksi kas, jurnal operasional, atau saldo awal pembukuan yang tercatat). Silakan lakukan pencatatan Saldo Awal melalui menu Tutup & Buka Buku atau catat transaksi pertama melalui tombol '+ Catat Transaksi'."
                  : meta.category === "SEHAT"
                  ? "Kondisi keuangan BUMDes berada dalam status SEHAT. Keseimbangan perputaran kas, margin keuntungan, dan kemandirian modal mampu menopang operasional serta memberikan kontribusi PADes yang optimal."
                  : meta.category === "KURANG SEHAT"
                  ? "Kondisi keuangan BUMDes berada dalam kategori KURANG SEHAT. Perputaran omzet atau pengembalian laba atas modal masih perlu diakselerasi, dan penagihan piutang perlu diperketat agar arus kas tidak terhambat."
                  : "Kondisi keuangan BUMDes berada dalam kategori TIDAK SEHAT. Diperlukan restrukturisasi unit usaha, efisiensi beban operasional secara ketat, dan percepatan penagihan tagihan pihak ketiga."}
              </p>

              {/* Status Chips */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  Total Aset: <strong className="text-white">{meta.hasData ? formatRupiah(meta.financialOverview.totalAset) : "Rp 0 (Nihil)"}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  Laba Bersih: <strong className="text-white">{meta.hasData ? formatRupiah(meta.financialOverview.labaBersih) : "Rp 0 (Nihil)"}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  Modal Sendiri: <strong className="text-white">{meta.hasData ? formatRupiah(meta.financialOverview.modalPemilik) : "Rp 0 (Nihil)"}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BANNER NOTIFIKASI JIKA DATABASE KOSONG */}
      {meta && !meta.hasData && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-amber-950">Database BUMDes Masih Kosong</p>
            <p className="text-amber-800 leading-relaxed">
              Belum ada mutasi transaksi atau saldo awal pembukuan yang tercatat untuk Tahun Anggaran {selectedYear}. Seluruh indikator rasio keuangan di bawah berstatus <strong>Nihil (0 poin)</strong>.
            </p>
            <p className="text-amber-700 text-[11px] pt-1 font-medium">
              💡 Untuk memulai analisis kesehatan keuangan, silakan catat Saldo Awal di menu <strong>Tutup & Buka Buku</strong> atau catat transaksi pertama melalui tombol <strong>+ Catat Transaksi</strong> di pojok kanan atas.
            </p>
          </div>
        </div>
      )}

      {/* DOCUMENT PRINT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8" id="eis-print-area">
        {/* KOP DOKUMEN CETAK */}
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
                Dokumen EIS BUMDes
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                TA: {selectedYear}
              </p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              RINGKASAN INFORMASI EKSEKUTIF (EIS)
            </h2>
            <p className="text-sm font-bold text-slate-700">
              HASIL PENILAIAN TINGKAT KESEHATAN BUM DESA ASPEK KEUANGAN
            </p>
            <p className="text-xs text-slate-500 mt-0.5 italic">
              Standar PPAK BUMDesa Kepmendes 136/2022 &bull; Tahun Anggaran {selectedYear}
            </p>
          </div>
        </div>

        {/* TABEL 8 INDIKATOR */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-500 mb-2" />
            <p className="text-sm">Menghitung indikator kesehatan BUMDes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-10">No.</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-56">Indikator Kinerja</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Formula & Data Dasar Perhitungan</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-28">Nilai Rasio</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Skor Maks</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Skor Diperoleh</th>
                  <th className="py-2.5 px-3 w-48">Diagnosa Lapangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {indicators.map((ind) => (
                  <tr key={ind.no} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold text-slate-700">
                      {ind.no}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-800">
                      <div>{ind.name}</div>
                      <div className="text-[10px] font-normal text-slate-500 mt-0.5 italic">{ind.formula}</div>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-slate-600 font-mono text-[11px]">
                      {ind.components}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-slate-800 bg-slate-50/50">
                      {ind.valueDisplay}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono text-slate-500">
                      {ind.maxScore}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-black text-indigo-700 bg-indigo-50/40">
                      {ind.score}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {ind.notes}
                    </td>
                  </tr>
                ))}

                {/* BARIS TOTAL SKOR */}
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-900">
                  <td colSpan={4} className="py-3 px-3 border-r border-slate-300 text-center uppercase tracking-wider">
                    TOTAL SKOR KESEHATAN KEUANGAN BUMDES
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 text-center font-mono font-black">
                    100
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 text-center font-mono font-black text-base text-indigo-900 bg-indigo-100/60">
                    {meta?.hasData ? meta?.totalScore : 0}
                  </td>
                  <td className="py-3 px-3 font-bold uppercase tracking-wide">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        !meta?.hasData || meta?.category === "BELUM ADA DATA"
                          ? "bg-slate-200 text-slate-700 border border-slate-300"
                          : meta?.category === "SEHAT"
                          ? "bg-emerald-100 text-emerald-800"
                          : meta?.category === "KURANG SEHAT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {meta?.category}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* KETERANGAN SKALA PREDIKAT KEPUTUSAN */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <p className="font-bold text-slate-800">Pedoman Kategori Tingkat Kesehatan BUMDes (PPAK Ver 4.5):</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-800 block">1. SEHAT (Skor ≥ 65)</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Kinerja sangat baik, likuiditas dan perputaran modal optimal. Layak menambah unit usaha atau penyertaan modal.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <span className="font-bold text-amber-800 block">2. KURANG SEHAT (30 ≤ Skor &lt; 65)</span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Kinerja cukup, namun terdapat kendala seperti lambatnya perputaran piutang atau margin laba yang tipis. Perlu pembinaan.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <span className="font-bold text-rose-800 block">3. TIDAK SEHAT (Skor &lt; 30)</span>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Mengalami kerugian operasional atau modal tergerus utang. Memerlukan audit investigasi dan restrukturisasi total.
              </p>
            </div>
          </div>
        </div>

        {/* KOLOM TANDA TANGAN AUDIT */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-slate-500 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-800 uppercase">PENASIHAT (KEPALA DESA)</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{villageHead}</p>
            <p className="text-[11px] text-slate-500">Pemerintah Desa {villageName}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">
              {villageName}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="font-bold text-slate-800 uppercase">DIREKTUR BUMDES</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{directorName}</p>
            <p className="text-[11px] text-slate-500">NIP. {directorNip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
