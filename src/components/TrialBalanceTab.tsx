"use client"

import React, { useState, useEffect } from "react"
import {
  Printer,
  Scale,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Filter
} from "lucide-react"
import { formatRupiah, safePrintElement } from "@/lib/utils"

interface TrialBalanceTabProps {
  settings?: Record<string, string>
}

export default function TrialBalanceTab({ settings = {} }: TrialBalanceTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [meta, setMeta] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])

  const bumdesName = settings.bumdes_name || "BUMDesa Mandiri Sejahtera"
  const villageName = settings.village_name || "Balongbesuk"
  const subdistrictName = settings.subdistrict_name || "Diwek"
  const regencyName = settings.regency_name || "Jombang"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const directorNip = settings.director_nip || "-"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"
  const treasurerNip = settings.treasurer_nip || "-"

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/audit/trial-balance?year=${selectedYear}&month=${selectedMonth}`
      const res = await fetch(url)
      const json = await res.json()

      if (json.success) {
        setMeta(json.meta)
        setRows(json.data || [])
      } else {
        setError(json.error || "Gagal memuat neraca saldo")
      }
    } catch (e: any) {
      setError("Kesalahan koneksi: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedYear, selectedMonth])

  // Cetak Dokumen Bersih (Aman dari DOM XSS)
  const handlePrint = () => {
    const printContent = document.getElementById("trial-balance-print-area")
    if (!printContent) return
    safePrintElement(printContent, `Neraca Saldo (Trial Balance) - ${bumdesName} TA ${selectedYear}`)
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-2">
            <Scale className="w-3.5 h-3.5" />
            Uji Keseimbangan Akuntansi
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Neraca Saldo (Trial Balance)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kertas kerja pembuktian keseimbangan (*Balance Sheet Control*) debit dan kredit seluruh akun sebelum penutupan buku untuk lampiran berkas Inspektorat.
          </p>
        </div>

        {/* PRINT BUTTON */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Neraca Saldo</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Tahun Buku */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tahun Buku
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              {[new Date().getFullYear(), 2025, 2024].map((y) => (
                <option key={y} value={y}>
                  Tahun {y} {y === new Date().getFullYear() ? "(Tahun Berjalan)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Bulan */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Posisi Periode
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="all">Akhir Tahun (31 Desember)</option>
              <option value="1">Akhir Januari</option>
              <option value="2">Akhir Februari</option>
              <option value="3">Akhir Maret</option>
              <option value="4">Akhir April</option>
              <option value="5">Akhir Mei</option>
              <option value="6">Akhir Juni</option>
              <option value="7">Akhir Juli</option>
              <option value="8">Akhir Agustus</option>
              <option value="9">Akhir September</option>
              <option value="10">Akhir Oktober</option>
              <option value="11">Akhir November</option>
              <option value="12">Akhir Desember</option>
            </select>
          </div>
        </div>

        {/* STATUS BALANCE BADGE */}
        {meta && (
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold ${
              meta.isBalanced
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-rose-50 text-rose-800 border-rose-300"
            }`}
          >
            {meta.isBalanced ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-extrabold uppercase tracking-wide">Status: Seimbang 100% (Balance)</div>
                  <div className="text-[11px] font-normal text-emerald-600">Selisih: Rp 0,00 &bull; Siap Diaudit</div>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-extrabold uppercase tracking-wide">Peringatan: Selisih Pembukuan!</div>
                  <div className="text-[11px] font-normal text-rose-600">
                    Selisih: {formatRupiah(Math.abs(meta.difference))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* METRIC SUMMARY */}
      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Saldo Debit
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {formatRupiah(meta.totalDebitBalance || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi seluruh akun bersaldo debit</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Saldo Kredit
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {formatRupiah(meta.totalCreditBalance || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi seluruh akun bersaldo kredit</p>
          </div>

          <div
            className={`p-5 rounded-2xl border shadow-xs ${
              meta.isBalanced ? "bg-emerald-600 text-white border-emerald-600" : "bg-rose-600 text-white border-rose-600"
            }`}
          >
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Selisih Keseimbangan
            </span>
            <div className="text-2xl font-black mt-1">
              {formatRupiah(Math.abs(meta.difference || 0))}
            </div>
            <p className="text-[11px] text-emerald-100 mt-1">
              {meta.isBalanced ? "✓ Terverifikasi Nol (Klir)" : "⚠ Ada jurnal tidak berpasangan"}
            </p>
          </div>
        </div>
      )}

      {/* PRINT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8" id="trial-balance-print-area">
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
                Kertas Kerja Pemeriksaan
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                TA: {selectedYear}
              </p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              NERACA SALDO (TRIAL BALANCE)
            </h2>
            <p className="text-xs text-slate-500 mt-1 italic">
              Posisi Buku: {meta?.periodLabel}
            </p>
          </div>
        </div>

        {/* TABEL DATA NERACA SALDO */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
            <p className="text-sm">Menghitung neraca saldo...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Scale className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              Belum ada transaksi akuntansi pada periode ini
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Catat transaksi kas masuk atau keluar di BKU untuk membentuk saldo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center">Kode Akun</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Nama Akun Standar (COA)</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-32 text-center">Golongan</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right w-40">Saldo Debit (Rp)</th>
                  <th className="py-2.5 px-3 text-right w-40">Saldo Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, idx) => {
                  const firstChar = row.code.charAt(0)
                  const groupLabel =
                    firstChar === "1"
                      ? "Aset"
                      : firstChar === "2"
                      ? "Kewajiban"
                      : firstChar === "3"
                      ? "Ekuitas"
                      : firstChar === "4"
                      ? "Pendapatan"
                      : "Beban"

                  return (
                    <tr key={row.code || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold text-slate-700 text-center whitespace-nowrap">
                        {row.code}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 font-medium text-slate-800">
                        {row.name}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center text-slate-500 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10.5px]">
                          {groupLabel}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right font-mono font-semibold text-slate-800">
                        {row.debitBalance > 0 ? formatRupiah(row.debitBalance) : "-"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">
                        {row.creditBalance > 0 ? formatRupiah(row.creditBalance) : "-"}
                      </td>
                    </tr>
                  )
                })}

                {/* BARIS TOTAL */}
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-900">
                  <td colSpan={3} className="py-3 px-3 border-r border-slate-300 text-center uppercase tracking-wider">
                    TOTAL KESEIMBANGAN (BALANCE)
                  </td>
                  <td className="py-3 px-3 border-r border-slate-300 text-right font-mono font-black text-slate-900 bg-slate-200/50">
                    {formatRupiah(meta?.totalDebitBalance || 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-slate-900 bg-slate-200/50">
                    {formatRupiah(meta?.totalCreditBalance || 0)}
                  </td>
                </tr>

                {/* BARIS STATUS KLIR */}
                <tr className={meta?.isBalanced ? "bg-emerald-50 text-emerald-900 font-bold" : "bg-rose-50 text-rose-900 font-bold"}>
                  <td colSpan={3} className="py-2 px-3 border-r border-slate-300 text-right uppercase tracking-wider">
                    SELISIH DEBIT - KREDIT:
                  </td>
                  <td colSpan={2} className="py-2 px-3 text-center font-mono">
                    {meta?.isBalanced ? "Rp 0,00 (100% SEIMBANG / BALANCE)" : `SELISIH: ${formatRupiah(meta?.difference || 0)}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* KOLOM TANDA TANGAN AUDIT */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-slate-500 mb-1">Mengetahui,</p>
            <p className="font-bold text-slate-800 uppercase">DIREKTUR BUMDES</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{directorName}</p>
            <p className="text-[11px] text-slate-500">NIP. {directorNip}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">
              {villageName}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="font-bold text-slate-800 uppercase">BENDAHARA / PETUGAS AKUNTANSI</p>
            <div className="h-20"></div>
            <p className="font-bold text-slate-900 underline uppercase">{treasurerName}</p>
            <p className="text-[11px] text-slate-500">NIP. {treasurerNip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
