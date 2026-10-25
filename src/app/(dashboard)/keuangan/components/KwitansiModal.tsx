"use client"

import React, { useRef } from "react"
import { Printer, X, Download, CheckCircle, ShieldCheck } from "lucide-react"
import { formatRupiah, terbilang } from "@/lib/utils"

export interface ReceiptItem {
  accountCode: string
  accountName?: string
  description: string
  amount: number
}

export interface ReceiptData {
  id: string
  proofNumber: string
  proofType: "BKM" | "BKK"
  date: string | Date
  payeeOrPayer: string // Penyetor (BKM) atau Penerima (BKK)
  unitUsaha: string
  note?: string | null
  items: ReceiptItem[]
  totalAmount: number
  bumdesName?: string
  villageName?: string
  operatorName?: string
  directorName?: string
  treasurerName?: string
  attachmentUrl?: string | null
  verificationStatus?: string
}

interface KwitansiModalProps {
  data: ReceiptData | null
  isOpen: boolean
  onClose: () => void
  onUploadedSigned?: (newUrl: string) => void
}

export default function KwitansiModal({
  data,
  isOpen,
  onClose,
  onUploadedSigned
}: KwitansiModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !data) return null

  const isBKM = data.proofType === "BKM"
  const themeColor = isBKM ? "text-sky-600" : "text-rose-600"
  const borderColor = isBKM ? "border-sky-500" : "border-rose-500"
  const headerBg = isBKM ? "bg-sky-500 text-white" : "bg-rose-500 text-white"
  const lightBg = isBKM ? "bg-sky-50/50" : "bg-rose-50/50"

  const formattedDate = new Date(data.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 no-print">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isBKM ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {data.proofNumber}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Kwitansi Standar Kepmendes 136/2022
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak Kwitansi
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {/* KWITANSI SLIP: Designed identical to Bimtek Slide 13 & 14 */}
          <div
            ref={printRef}
            className={`border-2 ${borderColor} rounded-2xl p-6 md:p-8 bg-white text-slate-800 shadow-sm print:shadow-none print:border-2 print:p-6 print:m-0 print:w-full print-kwitansi-sheet`}
          >
            {/* Header: Diterima Dari & Title/Nomor */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b border-slate-200">
              <div className="md:col-span-5 flex flex-col justify-end">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {isBKM ? "Diterima dari :" : "Dibayarkan kepada :"}
                </span>
                <span className="text-sm font-bold text-slate-900 border-b border-dotted border-slate-400 pb-1 mt-1">
                  {data.payeeOrPayer || "—"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  BUM Desa {data.bumdesName || "Desa"} (Unit: {data.unitUsaha})
                </span>
              </div>

              <div className="md:col-span-4 text-center flex flex-col items-center justify-center">
                <h2 className={`text-xl md:text-2xl font-black tracking-tight ${themeColor}`}>
                  {isBKM ? "BUKTI KAS MASUK" : "BUKTI KAS KELUAR"}
                </h2>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
                  BUM DESA {data.bumdesName?.toUpperCase() || ""}
                </span>
              </div>

              <div className="md:col-span-3 flex flex-col justify-end text-xs space-y-1">
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-semibold">Nomor :</span>
                  <span className="font-mono font-bold text-slate-800">{data.proofNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-semibold">Tanggal :</span>
                  <span className="font-semibold text-slate-800">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Table: Perkiraan | Uraian | Jumlah */}
            <div className="mt-4 border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className={headerBg}>
                    <th className="py-2.5 px-3 text-left font-bold uppercase tracking-wider w-28 md:w-36 border-r border-white/20">
                      Perkiraan
                    </th>
                    <th className="py-2.5 px-3 text-center font-bold uppercase tracking-wider border-r border-white/20">
                      U R A I A N
                    </th>
                    <th className="py-2.5 px-3 text-right font-bold uppercase tracking-wider w-36 md:w-44">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.items.map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? lightBg : "bg-white"}>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 border-r border-slate-200 align-top">
                        <div>{it.accountCode}</div>
                        {it.accountName && (
                          <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[130px]">
                            {it.accountName}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 border-r border-slate-200 align-top">
                        <div className="font-semibold">{it.description}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-top">
                        {formatRupiah(it.amount)}
                      </td>
                    </tr>
                  ))}
                  {/* Empty rows filler if few items to resemble slip book */}
                  {data.items.length < 3 &&
                    Array.from({ length: 3 - data.items.length }).map((_, i) => (
                      <tr key={`filler-${i}`} className="h-7">
                        <td className="border-r border-slate-200"></td>
                        <td className="border-r border-slate-200"></td>
                        <td></td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-600 border-r border-slate-300">
                      T O T A L :
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm font-black text-slate-900">
                      {formatRupiah(data.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terbilang & Catatan */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-1.5">
                <span className="font-bold uppercase tracking-wider text-slate-500 w-20 shrink-0">
                  Terbilang :
                </span>
                <span className="font-bold text-slate-900 italic">
                  &ldquo;{terbilang(data.totalAmount)}&rdquo;
                </span>
              </div>

              {data.note && (
                <div className="p-2 rounded-xl bg-slate-50/50 border border-dashed border-slate-200 flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] w-20 shrink-0">
                    Catatan :
                  </span>
                  <span className="text-slate-600 text-xs">{data.note}</span>
                </div>
              )}
            </div>

            {/* 4 Kolom Tanda Tangan: Pembukuan | Mengetahui | Kasir | Penyetor/Penerima */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* 1. Pembukuan */}
                <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-32">
                  <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Pembukuan
                  </span>
                  <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                  <div className="border-t border-dotted border-slate-400 pt-1">
                    <span className="font-bold text-slate-800 block text-[11px] truncate">
                      {data.operatorName || "Operator Induk"}
                    </span>
                    <span className="text-[9px] text-slate-400">Pencatat</span>
                  </div>
                </div>

                {/* 2. Mengetahui */}
                <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-32">
                  <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Mengetahui
                  </span>
                  <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                  <div className="border-t border-dotted border-slate-400 pt-1">
                    <span className="font-bold text-slate-800 block text-[11px] truncate">
                      {data.directorName || "Direktur BUM Desa"}
                    </span>
                    <span className="text-[9px] text-slate-400">Direktur / Ketua</span>
                  </div>
                </div>

                {/* 3. Kasir */}
                <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-32">
                  <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    Kasir
                  </span>
                  <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                  <div className="border-t border-dotted border-slate-400 pt-1">
                    <span className="font-bold text-slate-800 block text-[11px] truncate">
                      {data.treasurerName || "Bendahara"}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {isBKM ? "Penerima Uang" : "Yang Menyerahkan"}
                    </span>
                  </div>
                </div>

                {/* 4. Penyetor / Penerima */}
                <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-32">
                  <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                    {isBKM ? "Penyetor" : "Penerima"}
                  </span>
                  <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                  <div className="border-t border-dotted border-slate-400 pt-1">
                    <span className="font-bold text-slate-800 block text-[11px] truncate">
                      {data.payeeOrPayer || (isBKM ? "Penyetor" : "Penerima")}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {isBKM ? "Yang Menyerahkan" : "Yang Menerima Uang"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bukti TTD Upload Section (No Print) */}
          <div className="no-print p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-xs text-slate-800">
                  Dokumentasi Bukti Fisik Ber-TTD
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  data.attachmentUrl
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {data.attachmentUrl ? "✓ Bukti Fisik Diunggah" : "Belum Ada Foto Bukti TTD"}
              </span>
            </div>

            {data.attachmentUrl ? (
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <img
                  src={data.attachmentUrl}
                  alt="Bukti Kwitansi Ber-TTD"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    File bukti tanda tangan tersimpan
                  </p>
                  <a
                    href={data.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:underline font-semibold mt-0.5 inline-block"
                  >
                    Buka / Download Foto Asli
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Setelah kwitansi dicetak dan ditandatangani oleh para pihak (Pembukuan, Direktur,
                Kasir, dan Penyetor/Penerima), silakan scan atau foto lalu unggah bukti melalui
                daftar transaksi BKU.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
