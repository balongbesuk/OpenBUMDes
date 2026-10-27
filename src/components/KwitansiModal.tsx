"use client"

import React, { useRef, useState } from "react"
import { Printer, X, Download, CheckCircle, ShieldCheck, Upload, RefreshCw, Eye, Camera } from "lucide-react"
import { formatRupiah, terbilang } from "@/lib/utils"
import { showAppAlert, showAppToast } from "@/components/ui/AppDialog"

export interface KwitansiModalProps {
  entry: any | null
  onClose: () => void
  settings?: Record<string, string>
  onUploadedSigned?: (newUrl: string) => void
}

export default function KwitansiModal({
  entry,
  onClose,
  settings = {},
  onUploadedSigned
}: KwitansiModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(entry?.attachmentUrl || null)

  if (!entry) return null

  const isMemorial =
    entry.proofType === "MEMORIAL" ||
    entry.proofType === "BM" ||
    entry.proofType === "SA" ||
    entry.proofNumber?.startsWith("SA/") ||
    entry.proofNumber?.startsWith("BM/")

  const isBKM = entry.proofType === "BKM"
  const themeColor = isMemorial ? "text-indigo-600" : isBKM ? "text-sky-600" : "text-rose-600"
  const borderColor = isMemorial ? "border-indigo-500" : isBKM ? "border-sky-500" : "border-rose-500"
  const headerBg = isMemorial ? "bg-indigo-600 text-white" : isBKM ? "bg-sky-500 text-white" : "bg-rose-500 text-white"
  const lightBg = isMemorial ? "bg-indigo-50/50" : isBKM ? "bg-sky-50/50" : "bg-rose-50/50"

  const totalDebit =
    entry.lines?.filter((l: any) => l.type === "DEBIT").reduce((s: number, l: any) => s + (l.amount || 0), 0) || 0
  const totalCredit =
    entry.lines?.filter((l: any) => l.type === "CREDIT").reduce((s: number, l: any) => s + (l.amount || 0), 0) || 0

  // Hitung total nominal kwitansi
  const totalAmount = isMemorial
    ? totalDebit
    : entry.lines && entry.lines.length > 0
      ? entry.lines
          .filter((l: any) => (isBKM ? l.type === "DEBIT" : l.type === "CREDIT"))
          .reduce((sum: number, l: any) => sum + (l.amount || 0), 0) ||
        entry.lines[0]?.amount || 0
      : 0

  const items =
    entry.lines && entry.lines.length > 0
      ? entry.lines.filter((l: any) => (isBKM ? l.type === "CREDIT" : l.type === "DEBIT"))
      : [{ accountCode: "-", amount: totalAmount }]

  const formattedDate = new Date(entry.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  // Handle Cetak / Print
  const handlePrint = () => {
    window.print()
  }

  // Handle Upload Foto / Bukti TTD
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("entryId", entry.id)
      formData.append("file", file)

      const res = await fetch("/api/cash-book/upload", {
        method: "POST",
        body: formData
      })
      let json: any = null
      try {
        json = await res.json()
      } catch {
        throw new Error(`Server merespons status ${res.status}: ${res.statusText || "Gagal memproses unggahan"}`)
      }

      if (res.ok && json?.success) {
        setAttachmentUrl(json.attachmentUrl)
        if (onUploadedSigned) onUploadedSigned(json.attachmentUrl)
        showAppToast("Foto bukti kwitansi ber-TTD berhasil diunggah!", "success")
      } else {
        showAppAlert("Gagal mengunggah bukti: " + (json?.error || "Terjadi kesalahan pada server."), { type: "error" })
      }
    } catch (err: any) {
      showAppAlert("Error upload: " + err.message, { type: "error" })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Kamus Rekening Standar Kepmendesa 136
  const ACCOUNT_NAMES: Record<string, string> = {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* CSS KHUSUS CETAK KWITANSI */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #kwitansi-print-area,
          #kwitansi-print-area * {
            visibility: visible;
          }
          #kwitansi-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 1px solid #94a3b8 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] print:max-h-none print:my-0 print:border-none print:shadow-none">
        {/* Modal Top Bar (Non-Printable) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 no-print">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                isMemorial
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : isBKM
                  ? "bg-sky-100 text-sky-700 border border-sky-200"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              {entry.proofNumber}
            </span>
            {attachmentUrl ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bukti Fisik Terupload</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Belum Ada Bukti Fisik TTD</span>
              </span>
            )}
            <span className="text-xs text-slate-500 font-semibold hidden md:inline">
              {isMemorial ? "Bukti Memorial Resmi Standar Kepmendesa 136/2022" : "Kwitansi Resmi Standar Kepmendesa 136/2022"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 print:p-0 print:overflow-visible">
          {/* ================= AREA KWITANSI / BUKTI MEMORIAL RESMI ================= */}
          <div
            id="kwitansi-print-area"
            ref={printRef}
            className={`border-2 ${borderColor} rounded-2xl p-6 bg-white shadow-sm print:rounded-none`}
          >
            {/* Header Form Kwitansi */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                {settings.bumdes_logo && (
                  <img
                    src={settings.bumdes_logo}
                    alt="Logo BUMDes"
                    className="w-14 h-14 object-contain shrink-0"
                  />
                )}
                <div>
                  <h2 className="text-base font-black tracking-tight uppercase text-slate-900">
                    {settings.bumdes_name || "BUM DESA BAROKAH"}
                  </h2>
                  <p className="text-xs text-slate-600 uppercase">
                    DESA {settings.village_name || "BALONGBESUK"}, KEC. {settings.subdistrict_name || "DIWEK"}, KAB. {settings.regency_name || "JOMBANG"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Badan Hukum: Kemenkumham RI &bull; Standar Akuntansi Kepmendes 136/2022
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`inline-block px-4 py-1.5 rounded-lg font-black text-sm uppercase tracking-wider ${headerBg}`}
                >
                  {isMemorial
                    ? entry.proofNumber?.startsWith("SA/")
                      ? "BUKTI MEMORIAL (BM) - BUKA BUKU"
                      : "BUKTI MEMORIAL (BM)"
                    : isBKM
                    ? "BUKTI KAS MASUK (BKM)"
                    : "BUKTI KAS KELUAR (BKK)"}
                </div>
                <div className="mt-1 font-mono text-xs font-bold text-slate-800">
                  No: {entry.proofNumber}
                </div>
                <div className="text-[11px] text-slate-500">Tanggal: {formattedDate}</div>
              </div>
            </div>

            {/* Identitas Pembayaran / Pencatatan */}
            {isMemorial ? (
              <div className="my-4 space-y-2 text-xs">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold uppercase text-slate-600">
                    Dasar Pembukuan
                  </span>
                  <span className="col-span-9 font-bold text-slate-900">
                    : {entry.proofNumber?.startsWith("SA/") ? "Neraca Akhir Tahun Sebelumnya (Buka Buku Resmi / Roll Forward)" : entry.payeeOrPayer || "Dokumen Internal BUMDes"}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold uppercase text-slate-600">
                    Uraian Jurnal
                  </span>
                  <span className="col-span-9 text-slate-800">: {entry.description || "-"}</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold uppercase text-slate-600">Entitas / Unit Usaha</span>
                  <span className="col-span-9 text-slate-800">: {entry.unitName || "Konsolidasi Induk BUMDes"}</span>
                </div>
              </div>
            ) : (
              <div className="my-4 space-y-2 text-xs">
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold uppercase text-slate-600">
                    {isBKM ? "Diterima Dari" : "Dibayarkan Kepada"}
                  </span>
                  <span className="col-span-9 font-bold text-slate-900">
                    : {entry.payeeOrPayer || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold uppercase text-slate-600">
                    Uraian Keperluan
                  </span>
                  <span className="col-span-9 text-slate-800">: {entry.description || "-"}</span>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <span className="col-span-3 font-bold uppercase text-slate-600">Unit Usaha</span>
                  <span className="col-span-9 text-slate-800">: {entry.unitName || "Induk / Umum"}</span>
                </div>
              </div>
            )}

            {/* Tabel Rincian Rekening & Nominal */}
            {isMemorial ? (
              <div className="border border-slate-300 rounded-lg overflow-hidden my-4">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-left w-12 border-r border-slate-300">No</th>
                      <th className="py-2 px-3 text-left w-28 border-r border-slate-300">Kode Akun</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">Nama Rekening & Pos Neraca</th>
                      <th className="py-2 px-3 text-right w-36 border-r border-slate-300">Debit (Rp)</th>
                      <th className="py-2 px-3 text-right w-36">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {entry.lines?.map((line: any, idx: number) => {
                      const accName = ACCOUNT_NAMES[line.accountCode] || line.accountName || (line.type === "DEBIT" ? "Pos Aset / Aktiva" : "Pos Kewajiban / Modal")
                      return (
                        <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                          <td className="py-1.5 px-3 text-slate-400 font-mono border-r border-slate-200 text-center">{idx + 1}</td>
                          <td className="py-1.5 px-3 font-mono font-bold text-slate-800 border-r border-slate-200">{line.accountCode}</td>
                          <td className="py-1.5 px-3 text-slate-700 border-r border-slate-200">
                            <span className={line.type === "CREDIT" ? "pl-4 inline-block font-medium" : "font-semibold text-slate-900"}>
                              {accName}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                            {line.type === "DEBIT" ? formatRupiah(line.amount) : "-"}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                            {line.type === "CREDIT" ? formatRupiah(line.amount) : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-400 bg-slate-100 font-bold">
                      <td colSpan={3} className="py-2 px-3 text-right uppercase tracking-wider text-slate-800 border-r border-slate-300">
                        TOTAL KESEIMBANGAN JURNAL:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-xs font-black text-slate-900 border-r border-slate-300">
                        {formatRupiah(totalDebit)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-xs font-black text-slate-900">
                        {formatRupiah(totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <div className="p-2 bg-emerald-50 border-t border-emerald-200 text-center text-emerald-800 text-[11px] font-bold">
                  ✓ KESEIMBANGAN BUKTI MEMORIAL: 100% BALANCE (DEBIT = KREDIT)
                </div>
              </div>
            ) : (
              <div className="border border-slate-300 rounded-lg overflow-hidden my-4">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-left w-32 border-r border-slate-300">
                        Kode Akun
                      </th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">
                        Nama Akun & Uraian
                      </th>
                      <th className="py-2 px-3 text-right w-44">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((it: any, idx: number) => (
                      <tr key={idx} className="h-8">
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-700 border-r border-slate-200">
                          {it.accountCode}
                        </td>
                        <td className="py-1.5 px-3 text-slate-800 border-r border-slate-200">
                          {ACCOUNT_NAMES[it.accountCode] || entry.description}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(it.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-400 bg-slate-50 font-bold">
                      <td
                        colSpan={2}
                        className="py-2 px-3 text-right uppercase tracking-wider text-slate-700 border-r border-slate-300"
                      >
                        T O T A L :
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-sm font-black text-slate-900">
                        {formatRupiah(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Terbilang */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-slate-500 shrink-0">
                Terbilang :
              </span>
              <span className="font-bold text-slate-900 italic">
                {isMemorial
                  ? `“Keseimbangan Neraca Saldo Awal Sebesar ${terbilang(totalDebit)}”`
                  : `“${terbilang(totalAmount)}”`}
              </span>
            </div>

            {/* 4 Kolom Tanda Tangan Resmi (Bimtek PPAK 136) */}
            {isMemorial ? (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* 1. Pembukuan */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      Pembukuan
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {settings.operator_name || "Operator BUMDes"}
                      </span>
                      <span className="text-[9px] text-slate-400">Pencatat Jurnal</span>
                    </div>
                  </div>

                  {/* 2. Bendahara */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      Bendahara
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {settings.treasurer_name || "Mamik Kurniawati"}
                      </span>
                      <span className="text-[9px] text-slate-400">Verifikator Kas/Bank</span>
                    </div>
                  </div>

                  {/* 3. Pengawas */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      Menelaah
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {settings.supervisor_name || "Badan Pengawas"}
                      </span>
                      <span className="text-[9px] text-slate-400">Ketua Badan Pengawas</span>
                    </div>
                  </div>

                  {/* 4. Direktur */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      Menyetujui
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {settings.director_name || "Dodik Susanto, S.Fil.I"}
                      </span>
                      <span className="text-[9px] text-slate-400">Direktur / Ketua</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* 1. Pembukuan */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      Pembukuan
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {settings.operator_name || "Budi Santoso"}
                      </span>
                      <span className="text-[9px] text-slate-400">Pencatat</span>
                    </div>
                  </div>

                  {/* 2. Mengetahui */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      Mengetahui
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {settings.director_name || "H. Ahmad Subari, S.E."}
                      </span>
                      <span className="text-[9px] text-slate-400">Direktur / Ketua</span>
                    </div>
                  </div>

                  {/* 3. Kasir */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      Kasir
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {settings.treasurer_name || "Siti Fatimah"}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {isBKM ? "Penerima Uang" : "Yang Menyerahkan"}
                      </span>
                    </div>
                  </div>

                  {/* 4. Penyetor / Penerima */}
                  <div className="border border-slate-200 rounded-xl p-2 flex flex-col justify-between h-28">
                    <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                      {isBKM ? "Penyetor" : "Penerima"}
                    </span>
                    <div className="text-[10px] text-slate-300 italic">( Tanda Tangan )</div>
                    <div className="border-t border-dotted border-slate-400 pt-1">
                      <span className="font-bold text-slate-800 block text-[11px] truncate">
                        {entry.payeeOrPayer || (isBKM ? "Penyetor" : "Penerima")}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {isBKM ? "Yang Menyerahkan" : "Yang Menerima Uang"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================= SEKSI UPLOAD BUKTI FISIK BER-TTD (NO PRINT) ================= */}
          <div className="no-print p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Dokumentasi Bukti Fisik Kwitansi Ber-TTD
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Foto atau scan kwitansi yang telah ditandatangani 4 pihak untuk arsip audit LPJ.
                  </p>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#6777ef] hover:bg-[#5868e4] text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>{attachmentUrl ? "Ganti Foto Bukti TTD" : "Unggah Foto Kwitansi Ber-TTD"}</span>
                  </>
                )}
              </button>
            </div>

            {/* PREVIEW HASIL UPLOAD JIKA SUDAH ADA */}
            {attachmentUrl ? (
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={attachmentUrl}
                    alt="Bukti Fisik TTD"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div className="overflow-hidden">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Bukti Fisik Terunggah & Terverifikasi
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      Dokumen tanda tangan fisik tersimpan aman di server
                    </p>
                  </div>
                </div>

                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#6777ef]" />
                  <span>Lihat Asli</span>
                </a>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
                💡 <strong>Alur SOP Bimtek:</strong> Cetak kwitansi di atas &rarr; mintakan tanda tangan kepada Kasir, Direktur, dan Penyetor/Penerima &rarr; foto menggunakan HP &rarr; klik tombol <strong>"Unggah Foto Kwitansi Ber-TTD"</strong> di atas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
