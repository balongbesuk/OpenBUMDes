"use client"

import React, { useState, useEffect } from "react"
import {
  Printer,
  Users,
  Search,
  RefreshCw,
  CreditCard,
  Building2,
  DollarSign,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"

interface SubsidiaryLedgerTabProps {
  settings?: Record<string, string>
}

export default function SubsidiaryLedgerTab({ settings = {} }: SubsidiaryLedgerTabProps) {
  const [selectedType, setSelectedType] = useState<"PIUTANG" | "UTANG">("PIUTANG")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedParty, setSelectedParty] = useState<string>("")
  const [searchPartyQuery, setSearchPartyQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [meta, setMeta] = useState<any>(null)
  const [parties, setParties] = useState<any[]>([])
  const [activePartyData, setActivePartyData] = useState<any>(null)

  const bumdesName = settings.bumdes_name || "BUMDesa Mandiri Sejahtera"
  const villageName = settings.village_name || "Balongbesuk"
  const subdistrictName = settings.subdistrict_name || "Diwek"
  const regencyName = settings.regency_name || "Jombang"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const directorNip = settings.director_nip || "-"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"
  const treasurerNip = settings.treasurer_nip || "-"

  const loadData = async (partyName?: string) => {
    setLoading(true)
    setError(null)
    try {
      const party = partyName !== undefined ? partyName : selectedParty
      const url = `/api/audit/subsidiary-ledger?type=${selectedType}&year=${selectedYear}${
        party ? `&party=${encodeURIComponent(party)}` : ""
      }`
      const res = await fetch(url)
      const json = await res.json()

      if (json.success) {
        setMeta(json.meta)
        setParties(json.parties || [])
        setActivePartyData(json.selectedParty)
        if (!selectedParty && json.selectedParty?.name) {
          setSelectedParty(json.selectedParty.name)
        }
      } else {
        setError(json.error || "Gagal memuat buku pembantu")
      }
    } catch (e: any) {
      setError("Kesalahan koneksi: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedType, selectedYear])

  const handleSelectParty = (name: string) => {
    setSelectedParty(name)
    loadData(name)
  }

  // Filter daftar rekanan untuk pencarian cepat
  const filteredParties = parties.filter((p) =>
    p.name.toLowerCase().includes(searchPartyQuery.toLowerCase())
  )

  // Cetak Dokumen Bersih
  const handlePrint = () => {
    const printContent = document.getElementById("sub-ledger-print-area")
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
  <title>${meta?.typeLabel || "Buku Pembantu"} - ${activePartyData?.name || ""}</title>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Buku Pembantu Rekanan (Sub-Ledger)
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Buku Pembantu Piutang & Utang
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kartu pengawasan piutang pelanggan/debitur dan kewajiban utang rekanan/pemasok per nama orang/badan usaha untuk bukti uji petik fisik Inspektorat.
          </p>
        </div>

        {/* PRINT BUTTON */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-violet-600" : ""}`} />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 shadow-md shadow-violet-100 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Pembantu</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS: PIUTANG vs UTANG */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => {
            setSelectedType("PIUTANG")
            setSelectedParty("")
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            selectedType === "PIUTANG"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Buku Pembantu Piutang (Tagihan)</span>
        </button>

        <button
          onClick={() => {
            setSelectedType("UTANG")
            setSelectedParty("")
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            selectedType === "UTANG"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4 text-rose-600" />
          <span>Buku Pembantu Utang (Kewajiban)</span>
        </button>
      </div>

      {/* FILTER & PARTY PICKER */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Pilih Rekanan */}
        <div className="md:col-span-8 space-y-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Pilih Nama Rekanan / Pelanggan ({parties.length} Terdaftar)</span>
            {activePartyData && (
              <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                {activePartyData.entries?.length || 0} Riwayat Transaksi
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={selectedParty}
              onChange={(e) => handleSelectParty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none pr-10"
            >
              {parties.length === 0 ? (
                <option value="">(Belum ada rekanan dengan transaksi {selectedType.toLowerCase()})</option>
              ) : (
                parties.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} &mdash; Sisa: {formatRupiah(p.balance)} ({p.transactionCount} transaksi)
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* Tahun Buku */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Tahun Buku
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          >
            {[new Date().getFullYear(), 2025, 2024].map((y) => (
              <option key={y} value={y}>
                Tahun {y} {y === new Date().getFullYear() ? "(Tahun Berjalan)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* METRIC SUMMARY */}
      {activePartyData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              {selectedType === "PIUTANG" ? "Total Tagihan Baru" : "Total Utang Baru"}
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {formatRupiah(activePartyData.totalAdd || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi penambahan</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              {selectedType === "PIUTANG" ? "Total Pembayaran Diterima" : "Total Pelunasan Dibayar"}
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {formatRupiah(activePartyData.totalPay || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi angsuran / pelunasan</p>
          </div>

          <div className="bg-gradient-to-tr from-violet-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
            <span className="text-xs font-bold text-violet-100 uppercase tracking-wider">
              {selectedType === "PIUTANG" ? "Sisa Piutang Berjalan" : "Sisa Utang Berjalan"}
            </span>
            <div className="text-2xl font-black mt-1">
              {formatRupiah(activePartyData.balance || 0)}
            </div>
            <p className="text-[11px] text-violet-100 mt-1">Kewajiban per {selectedYear}</p>
          </div>
        </div>
      )}

      {/* PRINT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8" id="sub-ledger-print-area">
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
                Kartu Pembantu Pengawasan
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                TA: {selectedYear}
              </p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              {selectedType === "PIUTANG"
                ? "KARTU BUKU PEMBANTU PIUTANG (PELANGGAN)"
                : "KARTU BUKU PEMBANTU UTANG (PEMASOK/VENDOR)"}
            </h2>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300">
              Nama Rekanan: {activePartyData?.name || selectedParty || "-"}
            </div>
            <p className="text-xs text-slate-500 mt-1 italic">
              Tahun Anggaran: {selectedYear}
            </p>
          </div>
        </div>

        {/* TABEL DATA KARTU PEMBANTU */}
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-2" />
            <p className="text-sm">Menghitung buku pembantu...</p>
          </div>
        ) : !activePartyData || activePartyData.entries?.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">
              Belum ada riwayat transaksi {selectedType.toLowerCase()} untuk rekanan ini
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Catat transaksi piutang atau utang di BKU dengan mencantumkan nama pihak pembayar/penerima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-24">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-32">No. Bukti</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Uraian / Deskripsi Transaksi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-40">Pos Akun</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right w-28">
                    {selectedType === "PIUTANG" ? "Tambah Piutang" : "Tambah Utang"}
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right w-28">
                    {selectedType === "PIUTANG" ? "Bayar / Angsur" : "Pelunasan"}
                  </th>
                  <th className="py-2.5 px-3 text-right w-32">Sisa Saldo (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activePartyData.entries.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 border-r border-slate-300 font-mono whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {item.proofNumber}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 font-medium text-slate-800">
                      <div>{item.description}</div>
                      {item.contraAccounts && (
                        <div className="text-[10.5px] text-slate-500 italic mt-0.5">
                          Lawan: {item.contraAccounts}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-slate-600 truncate max-w-[150px]">
                      {item.accountName}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right font-mono text-emerald-700">
                      {item.add > 0 ? formatRupiah(item.add) : "-"}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right font-mono text-rose-700">
                      {item.pay > 0 ? formatRupiah(item.pay) : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      {formatRupiah(item.balance)}
                    </td>
                  </tr>
                ))}

                {/* BARIS TOTAL REKAPITULASI */}
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-900">
                  <td colSpan={4} className="py-2.5 px-3 border-r border-slate-300 text-center uppercase tracking-wider">
                    TOTAL MUTASI & SISA SALDO AKHIR
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-emerald-800">
                    {formatRupiah(activePartyData.totalAdd || 0)}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-right font-mono text-rose-800">
                    {formatRupiah(activePartyData.totalPay || 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-violet-900 bg-violet-50/50">
                    {formatRupiah(activePartyData.balance || 0)}
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
