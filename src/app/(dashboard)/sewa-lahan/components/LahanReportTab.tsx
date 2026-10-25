"use client"

import React from "react"
import { TrendingDown, CheckCircle, AlertCircle, DollarSign } from "lucide-react"
import { formatRupiah } from "@/lib/utils"

interface LahanReportTabProps {
  reportMonth: string
  setReportMonth: (m: string) => void
  reportYear: string
  setReportYear: (y: string) => void
  reportLoading: boolean
  lahanReportData: {
    payments: any[]
    expenses: any[]
  }
}

export default function LahanReportTab({
  reportMonth,
  setReportMonth,
  reportYear,
  setReportYear,
  reportLoading,
  lahanReportData,
}: LahanReportTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filter Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex gap-3 items-center">
          <span className="text-xs font-bold text-slate-500 uppercase">Filter Laporan:</span>
          <select
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
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
          <select
            value={reportYear}
            onChange={(e) => setReportYear(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Tahun</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
        
        {reportLoading && (
          <span className="text-xs text-slate-400 font-semibold animate-pulse">
            Memuat data laporan...
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pendapatan Unit</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              {formatRupiah(lahanReportData.payments.reduce((sum, p) => sum + p.amount, 0))}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingDown className="w-6 h-6 rotate-180" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengeluaran Unit</span>
            <span className="text-xl font-bold text-rose-600 mt-1 block">
              {formatRupiah(lahanReportData.expenses.reduce((sum, e) => sum + e.amount, 0))}
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Laba Bersih Unit</span>
            {(() => {
              const net = lahanReportData.payments.reduce((sum, p) => sum + p.amount, 0) - 
                          lahanReportData.expenses.reduce((sum, e) => sum + e.amount, 0)
              return (
                <span className={`text-xl font-bold mt-1 block ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {formatRupiah(net)}
                </span>
              )
            })()}
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pemasukan Table */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Rincian Penerimaan Iuran Sewa Lahan
            </h4>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
              {lahanReportData.payments.length} Transaksi
            </span>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Pedagang</th>
                  <th className="px-4 py-3">Kavling</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px] text-slate-700">
                {lahanReportData.payments.length > 0 ? (
                  lahanReportData.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">{new Date(p.date).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-3 font-semibold">{p.tenantName}</td>
                      <td className="px-4 py-3 font-bold text-slate-600">{p.type} {p.kavlingNumber}</td>
                      <td className="px-4 py-3">{p.periodCovered}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatRupiah(p.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">
                      Tidak ada pemasukan tercatat pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pengeluaran Table */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              Rincian Pengeluaran Operasional Unit
            </h4>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
              {lahanReportData.expenses.length} Transaksi
            </span>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan Pengeluaran</th>
                  <th className="px-4 py-3">Kode Akun</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px] text-slate-700">
                {lahanReportData.expenses.length > 0 ? (
                  lahanReportData.expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">{new Date(e.date).toLocaleDateString("id-ID")}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{e.description}</td>
                      <td className="px-4 py-3 font-medium text-slate-400">{e.accountCode}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">{formatRupiah(e.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-semibold">
                      Tidak ada pengeluaran operasional tercatat pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
