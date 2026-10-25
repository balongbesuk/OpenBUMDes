"use client"

import React from "react"
import { formatRupiah } from "@/lib/utils"

interface Liability {
  name: string
  amount: number
}

interface Equity {
  name: string
  amount: number
}

interface ArusKasModalTabProps {
  report: {
    labaRugi: {
      totalRevenue: number
      totalExpense: number
      netProfit: number
    }
    neraca: {
      fixedAssets: {
        peralatan: number
      }
      liabilities: Liability[]
      equity: Equity[]
      totalEquity: number
    }
  }
}

export default function ArusKasModalTab({ report }: ArusKasModalTabProps) {
  const pokokAmount = report.neraca.liabilities.find(l => l.name.includes("Pokok"))?.amount || 0
  const wajibAmount = report.neraca.liabilities.find(l => l.name.includes("Wajib"))?.amount || 0

  const kenaikanKas = (report.labaRugi.totalRevenue - report.labaRugi.totalExpense) -
    report.neraca.fixedAssets.peralatan +
    pokokAmount +
    wajibAmount

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Laporan Arus Kas */}
      <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm print-container space-y-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-2">
          LAPORAN ARUS KAS (CASH FLOW)
        </h3>
        
        <div className="space-y-4 text-xs font-semibold text-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Arus Kas dari Aktivitas Operasional</span>
          <table className="w-full">
            <tbody>
              <tr className="border-b border-slate-50/50">
                <td className="py-2">Penerimaan dari Pendapatan Unit Usaha</td>
                <td className="py-2 text-right text-emerald-700">{formatRupiah(report.labaRugi.totalRevenue)}</td>
              </tr>
              <tr className="border-b border-slate-50/50 text-slate-400 italic">
                <td className="py-2">Pembayaran untuk Beban & Biaya Operasional</td>
                <td className="py-2 text-right">({formatRupiah(report.labaRugi.totalExpense)})</td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td className="py-2">Arus Kas Bersih dari Operasional</td>
                <td className="py-2 text-right">{formatRupiah(report.labaRugi.totalRevenue - report.labaRugi.totalExpense)}</td>
              </tr>
            </tbody>
          </table>
          
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">2. Arus Kas dari Aktivitas Investasi</span>
          <table className="w-full">
            <tbody>
              <tr className="border-b border-slate-50/50 text-slate-400 italic">
                <td className="py-2">Pembelian Peralatan & Inventaris Aset Tetap</td>
                <td className="py-2 text-right">({formatRupiah(report.neraca.fixedAssets.peralatan)})</td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td className="py-2">Arus Kas Bersih dari Investasi</td>
                <td className="py-2 text-right">({formatRupiah(report.neraca.fixedAssets.peralatan)})</td>
              </tr>
            </tbody>
          </table>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pt-2">3. Arus Kas dari Aktivitas Pendanaan</span>
          <table className="w-full">
            <tbody>
              <tr className="border-b border-slate-50/50">
                <td className="py-2">Penerimaan Tabungan Simpanan Pokok Anggota</td>
                <td className="py-2 text-right text-emerald-700">
                  {formatRupiah(pokokAmount)}
                </td>
              </tr>
              <tr className="border-b border-slate-50/50">
                <td className="py-2">Penerimaan Tabungan Simpanan Wajib Anggota</td>
                <td className="py-2 text-right text-emerald-700">
                  {formatRupiah(wajibAmount)}
                </td>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td className="py-2">Arus Kas Bersih dari Pendanaan</td>
                <td className="py-2 text-right border-t border-slate-100">
                  {formatRupiah(pokokAmount + wajibAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-slate-200/60 pt-4 flex justify-between font-bold text-slate-900 bg-emerald-50/30 p-3 rounded-xl mt-6">
            <span>KENAIKAN / PENURUNAN BERSIH KAS</span>
            <span>
              {formatRupiah(kenaikanKas)}
            </span>
          </div>
        </div>
      </div>

      {/* Laporan Perubahan Ekuitas */}
      <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm print-container space-y-6">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-2">
          LAPORAN PERUBAHAN EKUITAS (MODAL)
        </h3>
        
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-slate-400 font-bold border-b border-slate-50">
              <th className="py-2">Komponen Ekuitas</th>
              <th className="py-2 text-right">Saldo Berjalan (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            <tr>
              <td className="py-3">Modal Awal Penyertaan Desa</td>
              <td className="py-3 text-right">
                {formatRupiah(report.neraca.equity.find(e => e.name.includes("Awal"))?.amount || 0)}
              </td>
            </tr>
            <tr>
              <td className="py-3">Laba Ditahan / Penambahan Modal</td>
              <td className="py-3 text-right">
                {formatRupiah(report.neraca.equity.find(e => e.name.includes("Ditahan"))?.amount || 0)}
              </td>
            </tr>
            <tr>
              <td className="py-3 text-emerald-800 font-bold">Laba Bersih Tahun Berjalan</td>
              <td className="py-3 text-right text-emerald-700">{formatRupiah(report.labaRugi.netProfit)}</td>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-150">
              <td className="py-3">TOTAL EKUITAS AKHIR</td>
              <td className="py-3 text-right text-emerald-800">{formatRupiah(report.neraca.totalEquity)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
