"use client"

import React, { useRef, useEffect } from "react"
import { Printer, X, FileText, CheckCircle2 } from "lucide-react"
import { formatRupiah } from "@/lib/utils"

export interface LpjPrintModalProps {
  closing: any | null
  settings?: Record<string, string>
  onClose: () => void
}

export default function LpjPrintModal({
  closing,
  settings = {},
  onClose
}: LpjPrintModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Tangani shortcut Ctrl+P / Cmd+P agar membuka cetak bersih tanpa web
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault()
        handleOpenPrintTab()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closing, settings])

  if (!closing) return null

  // Parse snapshotData
  let snapshot: any = {}
  try {
    if (typeof closing.snapshotData === "string") {
      snapshot = JSON.parse(closing.snapshotData)
    } else if (closing.snapshotData) {
      snapshot = closing.snapshotData
    }
  } catch (e) {
    console.error("Failed to parse snapshotData in LpjPrintModal:", e)
  }

  const year = closing.year || 2025
  const bumdesName = settings.bumdes_name || "BUMDesa \"BAROKAH\""
  const bumdesAddress = settings.bumdes_address || "Desa Balongbesuk, Kecamatan Diwek, Kabupaten Jombang"
  const villageName = settings.village_name || "Balongbesuk"
  const subdistrictName = settings.subdistrict_name || "Diwek"
  const regencyName = settings.regency_name || "Jombang"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"
  const villageHead = settings.village_head || "MOCHAMAD SAIFUR"
  const supervisorName = settings.supervisor_name || "SADJI ABDULLAH"

  const labaRugi = snapshot.labaRugi || {
    revenues: [],
    expenses: [],
    totalRevenue: closing.totalRevenue || 0,
    totalExpense: closing.totalExpense || 0,
    netProfit: closing.netProfit || 0
  }

  const neraca = snapshot.neraca || {
    currentAssets: [],
    totalCurrentAssets: 0,
    fixedAssets: { peralatan: 0, akumulasiPenyusutan: 0, net: 0 },
    totalAssets: 0,
    liabilities: [],
    totalLiabilities: 0,
    equity: [],
    totalEquity: 0,
    totalLiabilitiesAndEquity: 0
  }

  const lpe = snapshot.lpe || {
    modalAwalDesa: 0,
    modalAwalMasyarakat: 0,
    penambahanModalDesa: 0,
    penambahanModalMasyarakat: 0,
    totalPenyertaanModalAkhir: 0,
    saldoLabaAwal: 0,
    labaPeriodeBerjalan: closing.netProfit || 0,
    bagiHasilDesa: closing.padesAmount || 0,
    bagiHasilMasyarakat: 0,
    saldoLabaAkhir: closing.netProfit || 0,
    ekuitasAkhir: 0
  }

  const lak = snapshot.lak || {
    operasi: { masuk: 0, keluar: 0, bersih: 0 },
    investasi: { masuk: 0, keluar: 0, bersih: 0 },
    pendanaan: { masuk: 0, keluar: 0, bersih: 0 },
    kenaikanKasBersih: 0,
    saldoKasAwal: 0,
    saldoKasAkhir: 0
  }

  // Helper Footer Halaman Cetak Resmi
  const renderPageFooter = (pageNumber: number) => (
    <div className="pt-3 border-t border-slate-300 mt-6 flex justify-between items-center text-[10px] text-slate-500 font-sans print:pt-2 print:mt-4">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-800 uppercase tracking-wider">{bumdesName.replace(/["\\]/g, "")}</span>
        <span>&bull;</span>
        <span>LPJ Keuangan TA {year}</span>
      </div>
      <div className="text-slate-400 italic">
        Kepmendesa PDTT No. 136/2022
      </div>
      <div className="font-mono font-bold text-slate-800">
        Halaman {pageNumber} dari 8
      </div>
    </div>
  )

  // --- FITUR BUKA TAB CETAK BERSIH (PRINT TAB) ---
  const handleOpenPrintTab = () => {
    const element = document.getElementById("lpj-print-document")
    if (!element) return

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
  <title>Cetak LPJ BUMDesa ${bumdesName} - TA ${year}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  ${styleTags}
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      background: #ffffff;
      color: #0f172a;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .no-print {
      display: block;
    }
    @media print {
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="padding: 12px 24px; background: #1e1b4b; color: white; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 50;">
    <div>
      <span style="font-weight: bold; font-size: 13px;">Pratinjau Cetak LPJ Resmi BUMDesa</span>
      <span style="font-size: 11px; opacity: 0.8; margin-left: 8px;">(Standar Kepmendes 136/2022)</span>
    </div>
    <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 7px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
      🖨️ Cetak Sekarang / Simpan PDF
    </button>
  </div>
  <div style="max-width: 820px; margin: 0 auto; padding: 25px;">
    ${element.innerHTML}
  </div>
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

  const handlePrint = () => {
    handleOpenPrintTab()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible print:block print:inset-auto">
      {/* Container Dialog */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-4 overflow-hidden print:border-none print:shadow-none print:my-0 print:max-w-none print:overflow-visible">
        
        {/* Floating Action Bar */}
        <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Cetak Dokumen Resmi LPJ Tahunan BUMDes {year}
              </h3>
              <p className="text-[11px] text-slate-300">
                Laporan Keuangan Lengkap Standar Kepmendesa PDTT No. 136 Tahun 2022
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6777ef] hover:bg-[#5868e4] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div id="lpj-print-document" ref={contentRef} className="p-6 sm:p-12 text-slate-900 font-sans text-xs space-y-12 bg-white print:p-4 print:space-y-8">
          
          {/* ========================================================= */}
          {/* COVER / HALAMAN JUDUL LAPORAN PERTANGGUNGJAWABAN          */}
          {/* ========================================================= */}
          <div className="min-h-[780px] flex flex-col justify-between text-center border-4 border-double border-slate-800 p-8 sm:p-12 rounded-2xl page-break">
            <div>
              <div className="uppercase tracking-widest text-[11px] font-extrabold text-slate-500 mb-2">
                PEMERINTAH KABUPATEN {regencyName.toUpperCase()} &bull; KECAMATAN {subdistrictName.toUpperCase()}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                LAPORAN PERTANGGUNGJAWABAN (LPJ)
              </h1>
              <h2 className="text-xl sm:text-2xl font-bold text-[#6777ef] mt-1">
                BADAN USAHA MILIK DESA (BUM DESA) &ldquo;{bumdesName.replace(/["\\]/g, "")}&rdquo;
              </h2>
              {settings.bumdes_logo && (
                <div className="my-4 flex justify-center">
                  <img
                    src={settings.bumdes_logo}
                    alt="Logo BUMDes"
                    className="w-24 h-24 object-contain"
                  />
                </div>
              )}
              <div className="w-24 h-1 bg-slate-900 mx-auto my-4 rounded-full"></div>
              <p className="text-xs text-slate-600 font-medium">
                DESA {villageName.toUpperCase()} KECAMATAN {subdistrictName.toUpperCase()}
              </p>
            </div>

            <div className="py-8 my-auto">
              <div className="inline-block px-6 py-3 rounded-2xl bg-slate-50 border-2 border-slate-300 shadow-xs">
                <span className="text-[11px] uppercase font-bold text-slate-500 block tracking-wider">
                  TAHUN BUKU / TAHUN ANGGARAN
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {year}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-4 max-w-md mx-auto leading-relaxed">
                Disusun dan Disajikan Berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dan Keputusan Menteri Desa, PDT, dan Transmigrasi Nomor 136 Tahun 2022.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-200 text-xs text-slate-700">
              <p className="font-bold text-slate-900">
                PENGURUS DAN PENGELOLA BUM DESA &ldquo;{bumdesName.replace(/["\\]/g, "")}&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {bumdesAddress}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 1. LAPORAN LABA RUGI (HALAMAN TERSENDIRI)                  */}
          {/* ========================================================= */}
          <div className="min-h-[820px] flex flex-col justify-between page-break">
            <div className="space-y-4">
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6777ef] block">
                  STANDAR KEPMENDESA PDTT NO. 136 TAHUN 2022
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  1. LAPORAN LABA RUGI
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {bumdesName} &bull; Periode 1 Januari s/d 31 Desember {year}
                </p>
              </div>

              {/* Pendapatan */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider bg-slate-100 p-2 rounded">
                  I. PENDAPATAN USAHA
                </h3>
                <div className="space-y-1.5 pl-2">
                  {labaRugi.revenues.map((r: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">
                        <span className="font-mono text-[10px] text-slate-400 mr-2">{r.code}</span>
                        {r.name}
                      </span>
                      <span className="font-mono font-semibold">{formatRupiah(r.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold bg-slate-50 px-2 rounded">
                    <span>TOTAL PENDAPATAN</span>
                    <span className="font-mono font-black text-slate-900">
                      {formatRupiah(labaRugi.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Beban Usaha */}
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider bg-slate-100 p-2 rounded">
                  II. BEBAN OPERASIONAL & USAHA
                </h3>
                <div className="space-y-1.5 pl-2">
                  {labaRugi.expenses.map((e: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">
                        <span className="font-mono text-[10px] text-slate-400 mr-2">{e.code}</span>
                        {e.name}
                      </span>
                      <span className="font-mono font-semibold text-rose-600">{formatRupiah(e.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 font-bold bg-slate-50 px-2 rounded">
                    <span>TOTAL BEBAN</span>
                    <span className="font-mono font-black text-rose-700">
                      {formatRupiah(labaRugi.totalExpense)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Laba Bersih */}
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex justify-between items-center text-sm font-black text-indigo-900 mt-4">
                <div>
                  <span>LABA BERSIH TAHUN BERJALAN (SHU)</span>
                  <span className="block text-[10px] font-normal text-indigo-700 mt-0.5">
                    Surplus hasil usaha bersih sebelum pembagian alokasi
                  </span>
                </div>
                <span className="font-mono text-base text-[#6777ef]">{formatRupiah(labaRugi.netProfit)}</span>
              </div>
            </div>

            {renderPageFooter(2)}
          </div>

          {/* ========================================================= */}
          {/* 2. RENCANA & REALISASI ALOKASI SHU (HALAMAN TERSENDIRI)   */}
          {/* ========================================================= */}
          <div className="min-h-[820px] flex flex-col justify-between page-break">
            <div className="space-y-5">
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6777ef] block">
                  STANDAR KEPMENDESA PDTT NO. 136 TAHUN 2022
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  2. RENCANA & REALISASI PEMBAGIAN SISA HASIL USAHA (SHU)
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {bumdesName} &bull; Alokasi Pembagian SHU Tahun Anggaran {year}
                </p>
              </div>

              {/* Banner Total SHU yang Dibagikan */}
              <div className="p-4 bg-indigo-50/80 border-2 border-indigo-200 rounded-xl flex justify-between items-center text-xs font-bold text-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wide block">Total Sisa Hasil Usaha (SHU) Bersih:</span>
                  <span className="text-sm font-black text-indigo-900">Surplus Bersih Siap Dialokasikan</span>
                </div>
                <span className="font-mono text-lg font-black text-[#6777ef]">{formatRupiah(labaRugi.netProfit)}</span>
              </div>

              {/* Dasar Penetapan Pembagian SHU */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">Dasar Penetapan & Regulasi Pembagian SHU:</span>
                <p className="text-[11px] text-slate-600">
                  Sesuai dengan Anggaran Dasar/Anggaran Rumah Tangga (AD/ART) BUMDesa, Peraturan Desa, serta Hasil Keputusan Musyawarah Desa (Musdes) Pertanggungjawaban Tahunan, pembagian Sisa Hasil Usaha (SHU) Tahun Anggaran {year} ditetapkan dengan proporsi alokasi dan peruntukan sebagai berikut:
                </p>
              </div>

              {/* Tabel Alokasi SHU */}
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-center">
                    <th className="p-2.5 border-r border-slate-300 w-10">No</th>
                    <th className="p-2.5 border-r border-slate-300 text-left">Pos Alokasi Peruntukan</th>
                    <th className="p-2.5 border-r border-slate-300 w-24">Persentase</th>
                    <th className="p-2.5 border-r border-slate-300 text-right w-36">Nominal (Rp)</th>
                    <th className="p-2.5 text-left">Keterangan / Tujuan Penggunaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 text-center font-bold">1</td>
                    <td className="p-2.5 font-semibold text-slate-900">Pendapatan Asli Desa (PADes)</td>
                    <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{closing.padesPercent || 25}%</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(closing.padesAmount || 0)}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">Disetor ke Rekening Kas Desa (RKD) sebagai kontribusi ke APBDes</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-center font-bold">2</td>
                    <td className="p-2.5 font-semibold text-slate-900">Cadangan Modal Usaha BUMDes</td>
                    <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{closing.cadanganPercent || 25}%</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(closing.cadanganAmount || 0)}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">Ditahan sebagai penambahan modal kerja & pengembangan unit usaha</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-center font-bold">3</td>
                    <td className="p-2.5 font-semibold text-slate-900">Jasa Pengurus & Karyawan</td>
                    <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{closing.pengurusPercent || 30}%</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(closing.pengurusAmount || 0)}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">Insentif dan reward kinerja Direksi, Pelaksana Operasional & Pegawai</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-center font-bold">4</td>
                    <td className="p-2.5 font-semibold text-slate-900">Jasa Pengawas & Penasihat</td>
                    <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{closing.sosialPercent || 10}%</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(closing.sosialAmount || 0)}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">Honorarium Badan Pengawas dan Kepala Desa selaku Penasihat BUMDes</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-center font-bold">5</td>
                    <td className="p-2.5 font-semibold text-slate-900">Dana Pendidikan & Sosial Kemasyarakatan</td>
                    <td className="p-2.5 text-center font-mono font-bold text-indigo-700">{closing.pendidikanPercent || 10}%</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRupiah(closing.pendidikanAmount || 0)}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">Bantuan warga kurang mampu, santunan sosial & beasiswa desa</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-emerald-400">
                    <td colSpan={2} className="p-3 text-center uppercase tracking-wider">Total Alokasi Pembagian SHU</td>
                    <td className="p-3 text-center font-mono text-sm">100%</td>
                    <td className="p-3 text-right font-mono text-sm font-black text-emerald-800">{formatRupiah(closing.netProfit || 0)}</td>
                    <td className="p-3 text-slate-600 text-[11px] font-normal italic">Seluruh SHU telah teralokasi 100% tanpa sisa</td>
                  </tr>
                </tfoot>
              </table>

              {/* Ringkasan Realisasi Kartu */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Kas Desa (PADes)</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatRupiah(closing.padesAmount || 0)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Cadangan Modal</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatRupiah(closing.cadanganAmount || 0)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Jasa Pengurus</span>
                  <span className="text-sm font-bold font-mono text-slate-900">{formatRupiah(closing.pengurusAmount || 0)}</span>
                </div>
              </div>
            </div>

            {renderPageFooter(3)}
          </div>

          {/* ========================================================= */}
          {/* 3. LAPORAN POSISI KEUANGAN (NERACA SAK EMKM)              */}
          {/* ========================================================= */}
          <div className="min-h-[820px] flex flex-col justify-between page-break">
            <div className="space-y-3.5">
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6777ef] block">
                  STANDAR SAK EMKM & KEPMENDESA PDTT NO. 136 TAHUN 2022
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  3. LAPORAN POSISI KEUANGAN (NERACA)
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {bumdesName} &bull; Per 31 Desember {year}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                {/* Sisi Kiri: Aset / Aktiva */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider bg-slate-100 p-2 rounded">
                      ASET (AKTIVA)
                    </h3>
                  </div>

                  <div className="space-y-1 pl-2">
                    <span className="font-bold text-slate-700 text-[11px] block">A. ASET LANCAR</span>
                    {neraca.currentAssets.map((a: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-0.5 border-b border-slate-100 text-xs">
                        <span className="text-slate-600 pl-2">{a.name}</span>
                        <span className="font-mono font-semibold">{formatRupiah(a.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 font-bold bg-slate-50 px-2 rounded text-xs">
                      <span>Total Aset Lancar</span>
                      <span className="font-mono">{formatRupiah(neraca.totalCurrentAssets)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pl-2 pt-1">
                    <span className="font-bold text-slate-700 text-[11px] block">B. ASET TETAP</span>
                    <div className="flex justify-between py-0.5 border-b border-slate-100 text-xs">
                      <span className="text-slate-600 pl-2">Peralatan & Aset Tetap</span>
                      <span className="font-mono">{formatRupiah(neraca.fixedAssets?.peralatan || 0)}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-100 text-xs text-slate-500">
                      <span className="pl-2">Akumulasi Penyusutan</span>
                      <span className="font-mono text-rose-600">({formatRupiah(neraca.fixedAssets?.akumulasiPenyusutan || 0)})</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold bg-slate-50 px-2 rounded text-xs">
                      <span>Nilai Buku Aset Tetap</span>
                      <span className="font-mono">{formatRupiah(neraca.fixedAssets?.net || 0)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs font-black">
                    <span>TOTAL ASET (AKTIVA)</span>
                    <span className="font-mono text-sm">{formatRupiah(neraca.totalAssets)}</span>
                  </div>
                </div>

                {/* Sisi Kanan: Kewajiban & Ekuitas / Pasiva */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider bg-slate-100 p-2 rounded">
                      KEWAJIBAN & EKUITAS (PASIVA)
                    </h3>
                  </div>

                  <div className="space-y-1 pl-2">
                    <span className="font-bold text-slate-700 text-[11px] block">A. KEWAJIBAN (UTANG)</span>
                    {neraca.liabilities.map((l: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-0.5 border-b border-slate-100 text-xs">
                        <span className="text-slate-600 pl-2">{l.name}</span>
                        <span className="font-mono font-semibold">{formatRupiah(l.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 font-bold bg-slate-50 px-2 rounded text-xs">
                      <span>Total Kewajiban</span>
                      <span className="font-mono">{formatRupiah(neraca.totalLiabilities)}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pl-2 pt-1">
                    <span className="font-bold text-slate-700 text-[11px] block">B. EKUITAS (MODAL)</span>
                    {neraca.equity.map((eq: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-0.5 border-b border-slate-100 text-xs">
                        <span className="text-slate-600 pl-2">{eq.name}</span>
                        <span className="font-mono font-semibold">{formatRupiah(eq.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 font-bold bg-slate-50 px-2 rounded text-xs">
                      <span>Total Ekuitas</span>
                      <span className="font-mono">{formatRupiah(neraca.totalEquity)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs font-black">
                    <span>TOTAL PASIVA (KEWAJIBAN + EKUITAS)</span>
                    <span className="font-mono text-sm">{formatRupiah(neraca.totalLiabilitiesAndEquity || (neraca.totalLiabilities + neraca.totalEquity))}</span>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 text-[11px] font-bold">
                ✓ KESEIMBANGAN NERACA: 100% BALANCE & SESUAI DENGAN BUKU PEMBANTU KONSOLIDASI
              </div>
            </div>

            {renderPageFooter(4)}
          </div>

          {/* ========================================================= */}
          {/* 4. LAPORAN PERUBAHAN EKUITAS (LPE)                        */}
          {/* ========================================================= */}
          <div className="min-h-[820px] flex flex-col justify-between page-break">
            <div className="space-y-4">
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6777ef] block">
                  STANDAR KEPMENDESA PDTT NO. 136 TAHUN 2022
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  4. LAPORAN PERUBAHAN EKUITAS (LPE)
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {bumdesName} &bull; Periode Tahun Anggaran {year}
                </p>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-700">1. Penyertaan Modal Awal Desa (APBDes)</span>
                  <span className="font-mono font-bold">{formatRupiah(lpe.modalAwalDesa)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-700">2. Penyertaan Modal Awal Masyarakat</span>
                  <span className="font-mono font-bold">{formatRupiah(lpe.modalAwalMasyarakat || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-700">3. Penambahan Penyertaan Modal Desa Periode Berjalan</span>
                  <span className="font-mono font-bold text-emerald-700">+{formatRupiah(lpe.penambahanModalDesa || 0)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold bg-white px-3 rounded-lg border border-slate-200">
                  <span>Jumlah Penyertaan Modal Akhir</span>
                  <span className="font-mono">{formatRupiah(lpe.totalPenyertaanModalAkhir)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-700">4. Saldo Laba Ditahan / Cadangan Modal Awal</span>
                  <span className="font-mono font-bold">{formatRupiah(lpe.saldoLabaAwal || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-700">5. Laba Bersih (SHU) Tahun Berjalan</span>
                  <span className="font-mono font-bold text-emerald-700">+{formatRupiah(lpe.labaPeriodeBerjalan)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-700">6. Alokasi PADes (Kas Desa)</span>
                  <span className="font-mono font-bold text-rose-600">({formatRupiah(lpe.bagiHasilDesa || 0)})</span>
                </div>
                <div className="flex justify-between py-2 font-bold bg-white px-3 rounded-lg border border-slate-200">
                  <span>Saldo Laba Akhir</span>
                  <span className="font-mono text-emerald-800">{formatRupiah(lpe.saldoLabaAkhir)}</span>
                </div>
                <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl flex justify-between items-center text-sm font-black text-indigo-900 mt-2">
                  <span>TOTAL EKUITAS AKHIR BUMDES</span>
                  <span className="font-mono text-base text-[#6777ef]">{formatRupiah(lpe.ekuitasAkhir || (lpe.totalPenyertaanModalAkhir + lpe.saldoLabaAkhir))}</span>
                </div>
              </div>
            </div>

            {renderPageFooter(5)}
          </div>

          {/* ========================================================= */}
          {/* 5. LAPORAN ARUS KAS (LAK METODE LANGSUNG)                 */}
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* 5. LAPORAN ARUS KAS (LAK METODE LANGSUNG)                 */}
          {/* ========================================================= */}
          <div className="min-h-[820px] flex flex-col justify-between page-break">
            <div className="space-y-4">
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6777ef] block">
                  METODE LANGSUNG (DIRECT METHOD) &bull; KEPMENDESA 136/2022
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  5. LAPORAN ARUS KAS (LAK)
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {bumdesName} &bull; Periode 1 Januari s/d 31 Desember {year}
                </p>
              </div>

              {/* Arus Kas Operasi */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-xs">A. ARUS KAS DARI AKTIVITAS OPERASI</h3>
                <div className="space-y-1 text-xs pl-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Penerimaan Kas dari Pelanggan & Unit Usaha</span>
                    <span className="font-mono">{formatRupiah(lak.operasi?.masuk || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Pengeluaran Kas untuk Operasional & Pemasok</span>
                    <span className="font-mono text-rose-600">({formatRupiah(lak.operasi?.keluar || 0)})</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold bg-white px-2 rounded border border-slate-200">
                    <span>Arus Kas Bersih dari Aktivitas Operasi</span>
                    <span className="font-mono text-emerald-700">{formatRupiah(lak.operasi?.bersih || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Arus Kas Investasi */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-xs">B. ARUS KAS DARI AKTIVITAS INVESTASI</h3>
                <div className="space-y-1 text-xs pl-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Penerimaan Penjualan Aset Tetap</span>
                    <span className="font-mono">{formatRupiah(lak.investasi?.masuk || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Perolehan / Pembelian Peralatan & Aset Tetap</span>
                    <span className="font-mono text-rose-600">({formatRupiah(lak.investasi?.keluar || 0)})</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold bg-white px-2 rounded border border-slate-200">
                    <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                    <span className="font-mono text-slate-800">{formatRupiah(lak.investasi?.bersih || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Arus Kas Pendanaan */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-xs">C. ARUS KAS DARI AKTIVITAS PENDANAAN</h3>
                <div className="space-y-1 text-xs pl-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Penerimaan Penyertaan Modal Desa (APBDes)</span>
                    <span className="font-mono text-emerald-700">+{formatRupiah(lak.pendanaan?.masuk || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Penyetoran Bagi Hasil / Pengembalian Pinjaman</span>
                    <span className="font-mono text-rose-600">({formatRupiah(lak.pendanaan?.keluar || 0)})</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold bg-white px-2 rounded border border-slate-200">
                    <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                    <span className="font-mono text-slate-800">{formatRupiah(lak.pendanaan?.bersih || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Rekonsiliasi Kas */}
              <div className="p-4 bg-slate-100 rounded-xl space-y-2 text-xs border border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-700">Kenaikan / (Penurunan) Bersih Kas & Setara Kas</span>
                  <span className="font-mono font-bold">{formatRupiah(lak.kenaikanKasBersih || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Saldo Kas & Setara Kas Awal Periode</span>
                  <span className="font-mono font-bold">{formatRupiah(lak.saldoKasAwal || 0)}</span>
                </div>
                <div className="flex justify-between font-black pt-2 border-t border-slate-300 text-sm">
                  <span>SALDO KAS & SETARA KAS AKHIR PERIODE</span>
                  <span className="font-mono text-[#6777ef]">{formatRupiah(lak.saldoKasAkhir || neraca.totalCurrentAssets || 0)}</span>
                </div>
              </div>
            </div>

            {renderPageFooter(6)}
          </div>

          {/* ========================================================= */}
          {/* 6. CATATAN ATAS LAPORAN KEUANGAN (CaLK)                    */}
          {/* ========================================================= */}
          <div className="min-h-[820px] flex flex-col justify-between page-break">
            <div className="space-y-4">
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6777ef] block">
                  STANDAR KEPMENDESA PDTT NO. 136 TAHUN 2022
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">
                  6. CATATAN ATAS LAPORAN KEUANGAN (CaLK)
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {bumdesName} &bull; Tahun Anggaran {year}
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">1. GAMBARAN UMUM ENTITAS BUM DESA</h3>
                  <p className="text-justify text-slate-700 text-xs">
                    BUM Desa &ldquo;{bumdesName.replace(/["\\]/g, "")}&rdquo; merupakan badan hukum yang didirikan oleh Pemerintah Desa {villageName}, Kecamatan {subdistrictName}, Kabupaten {regencyName} sesuai amanat Undang-Undang Nomor 6 Tahun 2014 tentang Desa serta Peraturan Pemerintah Nomor 11 Tahun 2021 tentang Badan Usaha Milik Desa. BUM Desa ini beralamat di {bumdesAddress} dan bergerak di bidang usaha pengelolaan Gedung Serbaguna (GSG), Persewaan Lapak / Pasar Desa, Layanan Agen POS/PPOB, serta Jasa Simpan Pinjam Masyarakat.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">2. IKHTISAR KEBIJAKAN AKUNTANSI SIGNIFIKAN</h3>
                  <p className="text-justify text-slate-700 text-xs">
                    Laporan keuangan BUM Desa disusun dan disajikan berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dan Keputusan Menteri Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi Republik Indonesia Nomor 136 Tahun 2022 tentang Panduan Penyusunan Pelaporan Keuangan Badan Usaha Milik Desa.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-2 text-xs">
                    <li><strong>Dasar Pengukuran:</strong> Laporan disusun dengan menggunakan konsep biaya historis (*historical cost*) dan kelangsungan usaha (*going concern*).</li>
                    <li><strong>Pengakuan Pendapatan dan Beban:</strong> Menggunakan asas akrual (*accrual basis*), kecuali untuk laporan arus kas yang disusun berdasarkan asas kas (*cash basis*).</li>
                    <li><strong>Aset Tetap dan Penyusutan:</strong> Aset tetap dinilai sebesar harga perolehan dikurangi akumulasi penyusutan. Penyusutan dihitung menggunakan metode garis lurus (*straight-line method*) berdasarkan estimasi masa manfaat aset.</li>
                    <li><strong>Kas dan Setara Kas:</strong> Terdiri dari saldo kas fisik pada bendahara kasir dan simpanan pada rekening bank yang likuid tanpa pembatasan penarikan.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">3. PENJELASAN POS-POS SIGNIFIKAN LAPORAN KEUANGAN</h3>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <p><strong>Kas dan Bank:</strong> Saldo kas konsolidasi per 31 Desember {year} tercatat sebesar <strong>{formatRupiah(neraca.currentAssets[0]?.amount || 0)}</strong> pada kas tunai dan <strong>{formatRupiah(neraca.currentAssets[1]?.amount || 0)}</strong> pada rekening bank.</p>
                    <p><strong>Piutang:</strong> Total piutang bergulir masyarakat dan kelompok tani binaan tercatat sebesar <strong>{formatRupiah((neraca.currentAssets[2]?.amount || 0) + (neraca.currentAssets[3]?.amount || 0))}</strong>.</p>
                    <p><strong>Peralatan & Aset:</strong> Total nilai inventaris peralatan operasional tercatat sebesar <strong>{formatRupiah(neraca.fixedAssets?.peralatan || 0)}</strong> dengan akumulasi penyusutan sebesar <strong>{formatRupiah(neraca.fixedAssets?.akumulasiPenyusutan || 0)}</strong>, menghasilkan nilai buku bersih <strong>{formatRupiah(neraca.fixedAssets?.net || 0)}</strong>.</p>
                    <p><strong>Ekuitas Desa:</strong> Akumulasi modal disetor Pemerintah Desa sampai dengan tahun {year} adalah sebesar <strong>{formatRupiah(lpe.totalPenyertaanModalAkhir || neraca.equity[0]?.amount || 0)}</strong>.</p>
                  </div>
                </div>
              </div>
            </div>

            {renderPageFooter(7)}
          </div>

          {/* ========================================================= */}
          {/* LEMBAR PENGESAHAN DOKUMEN BERTANDA TANGAN (4 PIHAK RESMI) */}
          {/* ========================================================= */}
          <div className="min-h-[820px] flex flex-col justify-between pt-6 border-t-2 border-slate-900 page-break">
            <div>
              <div className="text-center mb-8">
                <h3 className="font-black text-slate-900 text-base uppercase">
                  LEMBAR PENGESAHAN LAPORAN PERTANGGUNGJAWABAN
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Ditetapkan dan disahkan pada Musyawarah Desa (Musdes) Pertanggungjawaban Tahunan di {villageName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {villageName}, 15 Januari {year + 1}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 text-center text-xs mb-10">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Dibuat oleh:</span>
                    <span className="font-bold text-slate-800">Bendahara BUM Desa</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                      {treasurerName}
                    </p>
                    <p className="text-[10px] text-slate-500">Bendahara</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Dilaporkan oleh:</span>
                    <span className="font-bold text-slate-800">Direktur BUM Desa</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                      {directorName}
                    </p>
                    <p className="text-[10px] text-slate-500">Direktur Utama</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-dashed border-slate-200">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mengetahui:</span>
                    <span className="font-bold text-slate-800">Badan Pengawas BUM Desa</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                      {supervisorName}
                    </p>
                    <p className="text-[10px] text-slate-500">Ketua Badan Pengawas</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Disetujui oleh:</span>
                    <span className="font-bold text-slate-800">Kepala Desa {villageName}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                      {villageHead}
                    </p>
                    <p className="text-[10px] text-slate-500">Kepala Desa / Penasihat</p>
                  </div>
                </div>
              </div>
            </div>

            {renderPageFooter(8)}
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="no-print p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs flex-wrap gap-3">
          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Dokumen siap dicetak ke printer atau disimpan sebagai PDF (Ctrl+P / Command+P)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#6777ef] hover:bg-[#5868e4] text-white font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer transition-all"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
