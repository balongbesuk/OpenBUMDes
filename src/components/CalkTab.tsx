"use client"

import React, { useState, useEffect } from "react"
import { Save, FileText, Printer, Lock, Unlock, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { formatRupiah } from "@/lib/utils"

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

interface LpjTabProps {
  report: ReportData
  settings: any
}

interface LpjNarrative {
  year: number
  bab1: string
  bab2: string
  bab3: string
  bab4: string
  bab5: string
  bab6: string
  bab7: string
  bab8: string
  isLocked: boolean
}

export default function LpjTab({ report, settings }: LpjTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [activeSubTab, setActiveSubTab] = useState<number>(1)
  const [narrative, setNarrative] = useState<LpjNarrative | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchNarrative = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/keuangan/lpj-narrative?year=${selectedYear}`)
      const result = await res.json()
      if (result.success) {
        setNarrative(result.data)
      } else {
        throw new Error(result.error || "Gagal memuat narasi LPJ")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNarrative()
  }, [selectedYear])

  const handleSave = async () => {
    if (!narrative || narrative.isLocked) return

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/keuangan/lpj-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(narrative)
      })
      const result = await res.json()
      if (result.success) {
        setSuccess(result.message)
        setNarrative(result.data)
      } else {
        throw new Error(result.error || "Gagal menyimpan draf LPJ")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTextChange = (field: keyof LpjNarrative, value: string) => {
    if (!narrative) return
    setNarrative({
      ...narrative,
      [field]: value
    })
  }

  const getBabTitle = (index: number) => {
    const titles = [
      "Bab I: Ikhtisar Pencapaian",
      "Bab II: Laporan Manajemen",
      "Bab III: Profil BUM Desa",
      "Bab IV: Kinerja BUM Desa",
      "Bab V: Masalah & Strategi",
      "Bab VI: Potensi & Peluang",
      "Bab VII: Rencana Kerja",
      "Bab VIII: Penutup"
    ]
    return titles[index - 1]
  }

  const getBabField = (index: number): keyof LpjNarrative => {
    const fields: (keyof LpjNarrative)[] = [
      "bab1",
      "bab2",
      "bab3",
      "bab4",
      "bab5",
      "bab6",
      "bab7",
      "bab8"
    ]
    return fields[index - 1]
  }

  const calculateShuAllocation = (percentage: number) => {
    const profit = Math.max(report.labaRugi.netProfit, 0)
    return profit * (percentage / 100)
  }

  return (
    <div className="space-y-6">
      {/* Editor & Preview Section (No Print) */}
      <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-emerald-600" />
              Penyusunan Narasi Laporan Pertanggungjawaban (LPJ) Tahunan
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">
              Isi narasi resmi pertanggungjawaban BUMDes per bab sesuai panduan baku Kementerian Desa PDTT.
            </p>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tahun Buku:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer focus:border-emerald-500"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Archival Lock Warning Banner */}
        {narrative?.isLocked && (
          <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-xs font-semibold text-amber-800 flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ARSIP TERKUNCI (READ-ONLY):</span> Periode pembukuan tahun {selectedYear} telah ditutup buku. Narasi LPJ ini tidak dapat diedit kembali dan disimpan hanya untuk kepentingan pengarsipan dokumen sejarah BUMDes. Anda dapat mencetak/mengunduh dokumen lengkap di bawah ini.
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs text-slate-400 font-semibold">Memuat dokumen narasi BUMDES...</span>
          </div>
        ) : (
          narrative && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Sidebar chapters selectors */}
              <div className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-4 shrink-0">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSubTab(index)}
                    className={`px-3 py-2.5 rounded-xl text-[10px] font-bold text-left shrink-0 transition-all active:scale-95 flex items-center justify-between ${
                      activeSubTab === index
                        ? "bg-emerald-50 text-emerald-800 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <span>{getBabTitle(index).split(":")[0] + ":" + getBabTitle(index).split(":")[1]}</span>
                  </button>
                ))}
              </div>

              {/* Textarea editor panel */}
              <div className="md:col-span-3 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                    {getBabTitle(activeSubTab)}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                    {activeSubTab === 1 && "Tuliskan ringkasan perkembangan kinerja BUMDes selama tahun buku berjalan."}
                    {activeSubTab === 2 && "Tuliskan evaluasi tertulis dari Pelaksana Operasional (Direktur) dan Badan Pengawas."}
                    {activeSubTab === 3 && "Tuliskan profil BUMDes, visi misi, struktur SDM kepengurusan, dan persentase modal."}
                    {activeSubTab === 4 && "Tuliskan perkembangan detail unit usaha (Simpan Pinjam, Sewa, PPOB) dan program kerja."}
                    {activeSubTab === 5 && "Tuliskan kendala riil operasional yang dihadapi dan alternatif solusi pemecahannya."}
                    {activeSubTab === 6 && "Identifikasi potensi lokal desa yang belum dikembangkan serta prospek unit usaha baru."}
                    {activeSubTab === 7 && "Tuliskan rencana investasi, proyeksi sasaran pasar, dan rancangan anggaran biaya tahun depan."}
                    {activeSubTab === 8 && "Kalimat penutup penyusunan laporan pertanggungjawaban."}
                  </p>
                </div>

                <textarea
                  value={narrative[getBabField(activeSubTab)] as string}
                  onChange={(e) => handleTextChange(getBabField(activeSubTab), e.target.value)}
                  disabled={narrative.isLocked || saving}
                  rows={14}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-2xl text-xs text-slate-800 font-medium leading-relaxed font-sans placeholder-slate-300 disabled:opacity-75 disabled:cursor-not-allowed"
                  placeholder="Ketik isi bab laporan di sini..."
                />

                {!narrative.isLocked && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan Draf...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Simpan Draf Narasi
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Compiled Book-Style Printable Layout (Hidden on Screen, Visible on Print) */}
      {narrative && (
        <div className="print-only bg-white text-slate-900 font-serif leading-relaxed text-[11px] p-12 min-h-screen">
          {/* COVER PAGE */}
          <div className="print-page-layout-center pb-12 border-b border-slate-200">
            <div className="space-y-4 pt-16">
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
                LAPORAN PERTANGGUNGJAWABAN TAHUNAN
              </h1>
              <h2 className="text-lg font-bold uppercase tracking-wide text-slate-850">
                {settings?.bumdes_name || "BADAN USAHA MILIK DESA (BUM DESA)"}
              </h2>
              <p className="text-xs text-slate-500 font-semibold tracking-widest">
                TAHUN ANGGARAN {selectedYear}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-slate-700">Disusun Oleh:</p>
              <p className="text-sm font-bold text-slate-900">PELAKSANA OPERASIONAL BUM DESA</p>
              <p className="text-xs font-bold text-slate-500 uppercase mt-2">
                {settings?.village_name ? `DESA ${settings.village_name}, KECAMATAN ${settings.district_name}` : ""}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase">
                {settings?.regency_name ? `KABUPATEN ${settings.regency_name}` : ""}
              </p>
            </div>
            
            <p className="text-[10px] text-slate-400 font-semibold">Tercetak otomatis melalui Sistem LPJ Digital BUMDes</p>
          </div>

          {/* PAGE BREAK / LEMBAR PENGESAHAN */}
          <div className="page-break-before print-page-layout py-16 border-b border-slate-200">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">LEMBAR PENGESAHAN</h3>
              <p className="text-[11px] font-bold text-slate-650 uppercase">LAPORAN PERTANGGUNGJAWABAN BUM DESA</p>
              <p className="text-[10px] font-bold text-slate-450 uppercase">TAHUN ANGGARAN {selectedYear}</p>
            </div>

            <div className="text-justify px-12 leading-relaxed text-xs">
              Laporan Pertanggungjawaban Tahunan {settings?.bumdes_name || "BUM Desa"} Tahun Anggaran {selectedYear} ini telah diperiksa, dievaluasi, dan disahkan secara formal dalam forum tertinggi Musyawarah Desa (Musdes) pada tanggal 31 Desember {selectedYear}.
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-3 gap-4 text-center mt-12 text-[10px] leading-relaxed">
              <div className="space-y-12">
                <p>Menyetujui,<br /><b>Ketua Badan Pengawas</b></p>
                <div className="pt-2 border-t border-slate-350 w-36 mx-auto">
                  <p className="font-bold uppercase">{settings?.supervisor_name || "BADAN PENGAWAS"}</p>
                  {settings?.supervisor_nip && <p className="text-[8px] text-slate-500 font-mono mt-0.5">NIP/NIK. {settings.supervisor_nip}</p>}
                </div>
              </div>
              <div className="space-y-12">
                <p>Mengetahui/Mengesahkan,<br /><b>Penasihat (Kepala Desa)</b></p>
                <div className="pt-2 border-t border-slate-350 w-36 mx-auto">
                  <p className="font-bold uppercase">{settings?.leader_name || (settings?.village_name ? `Kades ${settings.village_name}` : "KEPALA DESA")}</p>
                  {settings?.leader_nip && <p className="text-[8px] text-slate-500 font-mono mt-0.5">NIP/NIK. {settings.leader_nip}</p>}
                </div>
              </div>
              <div className="space-y-12">
                <p>{settings?.village_name || "Desa"}, 31 Desember {selectedYear}<br /><b>Direktur/Kepala BUM Desa</b></p>
                <div className="pt-2 border-t border-slate-350 w-36 mx-auto">
                  <p className="font-bold uppercase">{settings?.director_name || "PELAKSANA OPERASIONAL"}</p>
                  {settings?.director_nip && <p className="text-[8px] text-slate-500 font-mono mt-0.5">NIP/NIK. {settings.director_nip}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* NARRATIVE REPORT CHAPTERS */}
          <div className="page-break-before space-y-12 py-8">
            <div className="text-center pb-2 border-b border-slate-900/10">
              <h3 className="text-xs font-bold uppercase text-slate-800">DOKUMEN UTAMA NARRATIVE REPORT LPJ</h3>
            </div>

            {/* BAB I */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB I: IKHTISAR PENCAPAIAN KINERJA</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab1}
              </p>
            </div>

            {/* BAB II */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB II: LAPORAN MANAJEMEN (OPERASIONAL & PENGAWASAN)</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab2}
              </p>
            </div>

            {/* BAB III */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB III: PROFIL BUM DESA, VISI-MISI & KEPENGURUSAN</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab3}
              </p>
            </div>

            {/* BAB IV */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB IV: KINERJA PENGEMBANGAN UNIT USAHA BUMDES</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab4}
              </p>
            </div>

            {/* BAB V */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB V: ANALISIS PERMASALAHAN DAN STRATAGI OPERASIONAL</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab5}
              </p>
            </div>

            {/* BAB VI */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB VI: IDENTIFIKASI POTENSI LOKAL DESA & PELUANG USAHA</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab6}
              </p>
            </div>

            {/* BAB VII */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB VII: RENCANA KERJA TAHUN BUKU BERIKUTNYA</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab7}
              </p>
            </div>

            {/* BAB VIII */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">BAB VIII: PENUTUP</h4>
              <p className="text-justify whitespace-pre-line leading-relaxed pl-4 text-slate-800">
                {narrative.bab8}
              </p>
            </div>
          </div>

          {/* FINANCIAL STATEMENTS ANNEXES */}
          {/* ANNEX I: BALANCE SHEET (NERACA) */}
          <div className="page-break-before py-8 space-y-6">
            <div className="text-center pb-2 border-b border-slate-900/10">
              <h3 className="text-xs font-bold uppercase text-slate-800">LAMPIRAN I: LAPORAN POSISI KEUANGAN (NERACA)</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                Per 31 Desember {selectedYear} (Format Baku SAK EMKM)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 divide-x divide-slate-300">
              {/* Left side: Assets */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">A. AKTIVA (ASET LANCAR)</span>
                <table className="w-full text-[10px] font-semibold text-slate-700">
                  <tbody>
                    {report.neraca.currentAssets.map((asset, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2">{asset.name}</td>
                        <td className="py-2 text-right">{formatRupiah(asset.amount)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-slate-900 bg-slate-50">
                      <td className="py-2">Total Aset Lancar</td>
                      <td className="py-2 text-right">{formatRupiah(report.neraca.totalCurrentAssets)}</td>
                    </tr>
                    <tr className="border-t border-slate-200 pt-2 font-bold text-slate-900">
                      <td className="py-2">Aset Tetap (Peralatan Net)</td>
                      <td className="py-2 text-right">{formatRupiah(report.neraca.fixedAssets.net)}</td>
                    </tr>
                    <tr className="border-t-2 border-slate-900 pt-2 font-bold text-slate-900 bg-slate-50">
                      <td className="py-2">TOTAL AKTIVA (ASET)</td>
                      <td className="py-2 text-right">{formatRupiah(report.neraca.totalAssets)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right side: Liabilities and Equity */}
              <div className="space-y-4 pl-8">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">B. PASIVA (LIABILITAS & EKUITAS)</span>
                <table className="w-full text-[10px] font-semibold text-slate-700">
                  <tbody>
                    {report.neraca.liabilities.map((liab, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2">{liab.name}</td>
                        <td className="py-2 text-right">{formatRupiah(liab.amount)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-slate-900 bg-slate-50">
                      <td className="py-2">Total Liabilitas</td>
                      <td className="py-2 text-right">{formatRupiah(report.neraca.totalLiabilities)}</td>
                    </tr>
                    {report.neraca.equity.map((eq, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2">{eq.name}</td>
                        <td className="py-2 text-right">{formatRupiah(eq.amount)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-slate-900 bg-slate-50">
                      <td className="py-2">Total Ekuitas</td>
                      <td className="py-2 text-right">{formatRupiah(report.neraca.totalEquity)}</td>
                    </tr>
                    <tr className="border-t-2 border-slate-900 pt-2 font-bold text-slate-900 bg-slate-50">
                      <td className="py-2">TOTAL PASIVA (MODAL + UTANG)</td>
                      <td className="py-2 text-right">{formatRupiah(report.neraca.totalLiabilitiesAndEquity)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ANNEX II: INCOME STATEMENT (LABA RUGI) */}
          <div className="page-break-before py-8 space-y-6">
            <div className="text-center pb-2 border-b border-slate-900/10">
              <h3 className="text-xs font-bold uppercase text-slate-800">LAMPIRAN II: LAPORAN PERHITUNGAN HASIL USAHA (LABA / RUGI)</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                Tahun Buku Berakhir 31 Desember {selectedYear}
              </p>
            </div>

            <div className="space-y-6">
              {/* Revenues */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">I. PENDAPATAN OPERASIONAL</span>
                <table className="w-full text-[10px] font-semibold text-slate-700">
                  <tbody>
                    {report.labaRugi.revenues.map((rev) => (
                      <tr key={rev.code} className="border-b border-slate-100">
                        <td className="py-1.5 w-24 font-mono">{rev.code}</td>
                        <td className="py-1.5">{rev.name}</td>
                        <td className="py-1.5 text-right">{formatRupiah(rev.amount)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-slate-900 bg-slate-50">
                      <td className="py-2"></td>
                      <td className="py-2">TOTAL PENDAPATAN</td>
                      <td className="py-2 text-right">{formatRupiah(report.labaRugi.totalRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expenses */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">II. BEBAN OPERASIONAL & BIAYA</span>
                <table className="w-full text-[10px] font-semibold text-slate-700">
                  <tbody>
                    {report.labaRugi.expenses.map((exp) => (
                      <tr key={exp.code} className="border-b border-slate-100">
                        <td className="py-1.5 w-24 font-mono">{exp.code}</td>
                        <td className="py-1.5">{exp.name}</td>
                        <td className="py-1.5 text-right">{formatRupiah(exp.amount)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold text-slate-900 bg-slate-50">
                      <td className="py-2"></td>
                      <td className="py-2">TOTAL BEBAN</td>
                      <td className="py-2 text-right">{formatRupiah(report.labaRugi.totalExpense)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net profit */}
              <div className="border-2 border-slate-900 p-3 flex justify-between font-bold text-slate-900 bg-slate-50/50">
                <span className="uppercase text-[10px]">SISA HASIL USAHA BERJALAN (LABA BERSIH)</span>
                <span className="text-xs">{formatRupiah(report.labaRugi.netProfit)}</span>
              </div>
            </div>
          </div>

          {/* ANNEX III: SHU ALLOCATIONS */}
          <div className="page-break-before py-8 space-y-6">
            <div className="text-center pb-2 border-b border-slate-900/10">
              <h3 className="text-xs font-bold uppercase text-slate-800">LAMPIRAN III: DAFTAR RENCANA PEMBAGIAN SHU BUMDES</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                Sesuai Ketetapan AD/ART untuk Tahun Anggaran {selectedYear}
              </p>
            </div>

            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2 text-left">Komponen Distribusi Laba Bersih</th>
                  <th className="py-2 text-center w-24">Persentase</th>
                  <th className="py-2 text-right w-44">Nilai Alokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-700">
                <tr>
                  <td className="py-2.5">Bonus Pengurus / Pelaksana Operasional BUMDes</td>
                  <td className="py-2.5 text-center">{report.shuSettings.pengurus}%</td>
                  <td className="py-2.5 text-right">{formatRupiah(calculateShuAllocation(report.shuSettings.pengurus))}</td>
                </tr>
                <tr>
                  <td className="py-2.5">Bonus Pengawas & Penasihat</td>
                  <td className="py-2.5 text-center">{report.shuSettings.pengawas}%</td>
                  <td className="py-2.5 text-right">{formatRupiah(calculateShuAllocation(report.shuSettings.pengawas))}</td>
                </tr>
                <tr>
                  <td className="py-2.5">Dana Sosial, Pendidikan & Pelatihan Desa</td>
                  <td className="py-2.5 text-center">{report.shuSettings.sosial}%</td>
                  <td className="py-2.5 text-right">{formatRupiah(calculateShuAllocation(report.shuSettings.sosial))}</td>
                </tr>
                <tr>
                  <td className="py-2.5">Penambahan Cadangan Modal BUMDes</td>
                  <td className="py-2.5 text-center">{report.shuSettings.modal}%</td>
                  <td className="py-2.5 text-right">{formatRupiah(calculateShuAllocation(report.shuSettings.modal))}</td>
                </tr>
                <tr>
                  <td className="py-2.5">Setoran Kas Desa (Pendapatan Asli Desa - PADes)</td>
                  <td className="py-2.5 text-center">{report.shuSettings.desa}%</td>
                  <td className="py-2.5 text-right">{formatRupiah(calculateShuAllocation(report.shuSettings.desa))}</td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-900 text-slate-900">
                  <td className="py-3">TOTAL ALOKASI HASIL USAHA TERBAGI</td>
                  <td className="py-3 text-center">100%</td>
                  <td className="py-3 text-right">
                    {formatRupiah(report.labaRugi.netProfit > 0 ? report.labaRugi.netProfit : 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
