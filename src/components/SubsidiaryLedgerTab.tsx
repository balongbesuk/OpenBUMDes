"use client"

import React, { useState, useEffect } from "react"
import {
  Printer,
  Users,
  RefreshCw,
  CreditCard,
  Building2,
  Landmark,
  ReceiptText,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
  CheckCircle2
} from "lucide-react"
import { formatRupiah, safePrintElement } from "@/lib/utils"

interface SubsidiaryLedgerTabProps {
  settings?: Record<string, string>
}

type SubLedgerType = "PIUTANG" | "UTANG" | "BANK" | "PAJAK"

export default function SubsidiaryLedgerTab({ settings = {} }: SubsidiaryLedgerTabProps) {
  const [selectedType, setSelectedType] = useState<SubLedgerType>("PIUTANG")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedParty, setSelectedParty] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [meta, setMeta] = useState<any>(null)
  const [parties, setParties] = useState<any[]>([])
  const [activePartyData, setActivePartyData] = useState<any>(null)

  // Modal Quick Action (Bank & Pajak)
  const [showQuickModal, setShowQuickModal] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [txAmount, setTxAmount] = useState<string>("")
  const [txDesc, setTxDesc] = useState<string>("")
  const [txPayee, setTxPayee] = useState<string>("")

  // Bank form state
  const [bankSubType, setBankSubType] = useState<string>("BUNGA_BANK")
  const [bankAccountCode, setBankAccountCode] = useState<string>("1.1.01.06")

  // Pajak form state
  const [taxSubType, setTaxSubType] = useState<string>("POTONG_PAJAK")
  const [taxAccountCode, setTaxAccountCode] = useState<string>("2.1.02.01")
  const [taxCounterCode, setTaxCounterCode] = useState<string>("1.1.01.01")
  const [taxNtpn, setTaxNtpn] = useState<string>("")

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
        if ((!selectedParty || partyName === "") && json.selectedParty?.name) {
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
    loadData("")
  }, [selectedType, selectedYear])

  const handleSelectParty = (name: string) => {
    setSelectedParty(name)
    loadData(name)
  }

  const openQuickModal = () => {
    setTxDate(new Date().toISOString().slice(0, 10))
    setTxAmount("")
    setTxDesc("")
    setTaxNtpn("")
    if (selectedType === "BANK") {
      const code = activePartyData?.accountCode
      if (code && code !== "ALL_BANK") {
        setBankAccountCode(code)
      } else {
        setBankAccountCode("1.1.01.06")
      }
      setTxPayee("Bank Operasional BUMDes")
    } else if (selectedType === "PAJAK") {
      const code = activePartyData?.accountCode
      if (code && code !== "ALL_TAX") {
        setTaxAccountCode(code)
      } else {
        setTaxAccountCode("2.1.02.01")
      }
      setTxPayee("Kas Negara / Kantor Pajak")
    }
    setShowQuickModal(true)
  }

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAmount || Number(txAmount) <= 0) return
    setSubmitting(true)
    setError(null)
    try {
      const payload =
        selectedType === "BANK"
          ? {
              action: "RECORD_BANK",
              subType: bankSubType,
              bankAccountCode,
              date: txDate,
              amount: Number(txAmount),
              description: txDesc,
              payeeOrPayer: txPayee
            }
          : {
              action: "RECORD_PAJAK",
              subType: taxSubType,
              taxAccountCode,
              counterAccountCode: taxCounterCode,
              ntpn: taxNtpn,
              date: txDate,
              amount: Number(txAmount),
              description: txDesc,
              payeeOrPayer: txPayee
            }

      const res = await fetch("/api/audit/subsidiary-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || "Gagal menyimpan transaksi")
      } else {
        setShowQuickModal(false)
        await loadData(selectedParty)
      }
    } catch (err: any) {
      alert("Gagal menghubungi server: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Cetak Dokumen Bersih (Aman dari DOM XSS)
  const handlePrint = () => {
    const printContent = document.getElementById("sub-ledger-print-area")
    if (!printContent) return
    safePrintElement(printContent, `${meta?.typeLabel || "Buku Pembantu"} - ${activePartyData?.name || ""}`)
  }

  // Label Dinamis berdasarkan Sub-Tab
  const getPickerLabel = () => {
    if (selectedType === "BANK") return "Pilih Rekening Bank BUMDes"
    if (selectedType === "PAJAK") return "Pilih Jenis Pajak (PPN / PPh)"
    return `Pilih Nama Rekanan / Pelanggan (${parties.length} Terdaftar)`
  }

  const getMetricAddLabel = () => {
    if (selectedType === "PIUTANG") return "Total Tagihan Baru"
    if (selectedType === "UTANG") return "Total Utang Baru"
    if (selectedType === "BANK") return "Total Setoran & Bunga Masuk (Debit)"
    return "Total Pajak Dipungut / Dipotong (Kredit)"
  }

  const getMetricPayLabel = () => {
    if (selectedType === "PIUTANG") return "Total Pembayaran Diterima"
    if (selectedType === "UTANG") return "Total Pelunasan Dibayar"
    if (selectedType === "BANK") return "Total Penarikan & Biaya Admin (Kredit)"
    return "Total Pajak Disetor ke Negara (Debit)"
  }

  const getMetricBalanceLabel = () => {
    if (selectedType === "PIUTANG") return "Sisa Piutang Berjalan"
    if (selectedType === "UTANG") return "Sisa Utang Berjalan"
    if (selectedType === "BANK") return "Saldo Akhir Rekening Bank"
    return "Sisa Pajak Belum Disetor"
  }

  const getPrintTitle = () => {
    if (selectedType === "PIUTANG") return "KARTU BUKU PEMBANTU PIUTANG (PELANGGAN)"
    if (selectedType === "UTANG") return "KARTU BUKU PEMBANTU UTANG (PEMASOK/VENDOR)"
    if (selectedType === "BANK") return "BUKU KAS PEMBANTU BANK"
    return "BUKU PEMBANTU PAJAK (PEMUNGUTAN & PENYETORAN)"
  }

  const getTableColAdd = () => {
    if (selectedType === "PIUTANG") return "Tambah Piutang"
    if (selectedType === "UTANG") return "Tambah Utang"
    if (selectedType === "BANK") return "Penerimaan / Setoran (Debit)"
    return "Pemotongan / Pungutan (Kredit)"
  }

  const getTableColPay = () => {
    if (selectedType === "PIUTANG") return "Bayar / Angsur"
    if (selectedType === "UTANG") return "Pelunasan"
    if (selectedType === "BANK") return "Pengeluaran / Tarikan (Kredit)"
    return "Penyetoran ke Negara (Debit)"
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Buku Pembantu Pengawasan (Sub-Ledger Kepmendes 136)
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Buku Pembantu Bank, Pajak, Piutang & Utang
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Otomatisasi Buku Kas Pembantu Bank, Buku Pembantu Pajak (PPN/PPh), serta Kartu Piutang & Utang terintegrasi langsung dari Jurnal Umum & BKU.
          </p>
        </div>

        {/* ACTION & PRINT BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(selectedType === "BANK" || selectedType === "PAJAK") && (
            <button
              onClick={openQuickModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {selectedType === "BANK"
                  ? "Catat Bunga / Admin / Mutasi Bank"
                  : "Catat Potong / Setor Pajak (NTPN)"}
              </span>
            </button>
          )}

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
            <span>Cetak Buku Pembantu</span>
          </button>
        </div>
      </div>

      {/* 4 SUB-TABS: BANK, PAJAK, PIUTANG, UTANG */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => {
            setSelectedType("BANK")
            setSelectedParty("")
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === "BANK"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Landmark className="w-4 h-4 text-blue-600" />
          <span>Buku Kas Pembantu Bank</span>
        </button>

        <button
          onClick={() => {
            setSelectedType("PAJAK")
            setSelectedParty("")
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === "PAJAK"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ReceiptText className="w-4 h-4 text-amber-600" />
          <span>Buku Pembantu Pajak</span>
        </button>

        <button
          onClick={() => {
            setSelectedType("PIUTANG")
            setSelectedParty("")
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === "PIUTANG"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Buku Pembantu Piutang</span>
        </button>

        <button
          onClick={() => {
            setSelectedType("UTANG")
            setSelectedParty("")
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedType === "UTANG"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4 text-rose-600" />
          <span>Buku Pembantu Utang</span>
        </button>
      </div>

      {/* FILTER & PARTY / ACCOUNT PICKER */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 space-y-1.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>{getPickerLabel()}</span>
            {activePartyData && (
              <span className="text-[11px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                {activePartyData.entries?.length || 0} Riwayat Mutasi
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
                <option value="">(Belum ada data transaksi {selectedType.toLowerCase()})</option>
              ) : (
                parties.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} &mdash; Saldo: {formatRupiah(p.balance)} ({p.transactionCount} mutasi)
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
              {getMetricAddLabel()}
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {formatRupiah(activePartyData.totalAdd || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi penambahan tahun {selectedYear}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              {getMetricPayLabel()}
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {formatRupiah(activePartyData.totalPay || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi pengurangan / setoran</p>
          </div>

          <div className="bg-gradient-to-tr from-violet-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md">
            <span className="text-xs font-bold text-violet-100 uppercase tracking-wider">
              {getMetricBalanceLabel()}
            </span>
            <div className="text-2xl font-black mt-1">
              {formatRupiah(activePartyData.balance || 0)}
            </div>
            <p className="text-[11px] text-violet-100 mt-1">Posisi saldo per akhir {selectedYear}</p>
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
                Lampiran SPJ Kepmendes 136
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                TA: {selectedYear}
              </p>
            </div>
          </div>

          <div className="text-center mt-5">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              {getPrintTitle()}
            </h2>
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300">
              {selectedType === "BANK"
                ? `Rekening: ${activePartyData?.name || selectedParty || "-"}`
                : selectedType === "PAJAK"
                ? `Pos Pajak: ${activePartyData?.name || selectedParty || "-"}`
                : `Nama Rekanan: ${activePartyData?.name || selectedParty || "-"}`}
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
              Belum ada riwayat mutasi pada buku pembantu ini di tahun {selectedYear}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedType === "BANK"
                ? "Transaksi yang menggunakan akun Bank (1.1.01.02 s/d 1.1.01.06) di BKU atau tombol Catat Mutasi Bank di atas akan otomatis tampil di sini."
                : selectedType === "PAJAK"
                ? "Gunakan tombol Catat Potong / Setor Pajak di kanan atas untuk mencatat pungutan PPN/PPh beserta nomor NTPN/ID Billing."
                : "Catat transaksi piutang atau utang di BKU dengan mencantumkan nama pihak pembayar/penerima."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-24">Tanggal</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-32">No. Bukti</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Uraian / Keterangan Mutasi</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-44">
                    {selectedType === "PAJAK" ? "Jenis Pajak & NTPN" : "Pos Akun"}
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right w-32">
                    {getTableColAdd()}
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-right w-32">
                    {getTableColPay()}
                  </th>
                  <th className="py-2.5 px-3 text-right w-32">Saldo (Rp)</th>
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
                      {(selectedType === "BANK" || selectedType === "PAJAK") && item.payeeOrPayer && item.payeeOrPayer !== "-" && (
                        <div className="text-[10.5px] text-slate-500 mt-0.5">
                          Pihak: <span className="font-semibold">{item.payeeOrPayer}</span>
                        </div>
                      )}
                      {item.contraAccounts && (
                        <div className="text-[10.5px] text-slate-500 italic mt-0.5">
                          Lawan: {item.contraAccounts}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-slate-700">
                      <div className="font-medium truncate max-w-[170px]">{item.accountName}</div>
                      {item.note && (
                        <div className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-mono font-bold text-amber-800">
                          {item.note}
                        </div>
                      )}
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
                    TOTAL MUTASI & SALDO AKHIR
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

      {/* MODAL QUICK ENTRY (BUKU BANK & BUKU PAJAK) */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {selectedType === "BANK" ? (
                  <Landmark className="w-5 h-5 text-blue-400" />
                ) : (
                  <ReceiptText className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="font-bold text-sm">
                  {selectedType === "BANK"
                    ? "Catat Cepat Mutasi Rekening Bank (Auto-Jurnal)"
                    : "Catat Pemotongan / Penyetoran Pajak (Auto-Jurnal)"}
                </h3>
              </div>
              <button
                onClick={() => setShowQuickModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="p-6 space-y-4 text-xs">
              {selectedType === "BANK" ? (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Rekening Bank BUMDes</label>
                    <select
                      value={bankAccountCode}
                      onChange={(e) => setBankAccountCode(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                    >
                      <option value="1.1.01.02">1.1.01.02 - Kas di Bank BNI</option>
                      <option value="1.1.01.03">1.1.01.03 - Kas di Bank Mandiri</option>
                      <option value="1.1.01.04">1.1.01.04 - Kas di Bank BRI</option>
                      <option value="1.1.01.05">1.1.01.05 - Kas di Bank BCA</option>
                      <option value="1.1.01.06">1.1.01.06 - Kas di Bank Jatim</option>
                      <option value="1.1.02.01">1.1.02.01 - Deposito &lt;= 3 bulan</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jenis Transaksi Mutasi Bank</label>
                    <select
                      value={bankSubType}
                      onChange={(e) => setBankSubType(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                    >
                      <option value="BUNGA_BANK">Pendapatan Bunga / Jasa Giro Bank (+ Tambah Saldo Bank)</option>
                      <option value="ADMIN_BANK">Biaya Administrasi Rekening Bank (- Potong Saldo Bank)</option>
                      <option value="PAJAK_BUNGA">Potongan Pajak Bunga Bank (- Potong Saldo Bank)</option>
                      <option value="SETOR_TUNAI">Setor Tunai dari Kas Tunai ke Bank (+ Tambah Saldo Bank)</option>
                      <option value="TARIK_TUNAI">Tarik Tunai dari Bank ke Kas Bendahara (- Kurangi Saldo Bank)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Jenis Transaksi Pajak</label>
                      <select
                        value={taxSubType}
                        onChange={(e) => {
                          const val = e.target.value
                          setTaxSubType(val)
                          if (val === "BAYAR_PAJAK_LANGSUNG" && taxAccountCode.startsWith("2.1.02")) {
                            setTaxAccountCode("7.3.01.10")
                          } else if (val !== "BAYAR_PAJAK_LANGSUNG" && taxAccountCode.startsWith("7.3.01")) {
                            setTaxAccountCode("2.1.02.01")
                          }
                        }}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                      >
                        <option value="BAYAR_PAJAK_LANGSUNG">1. Bayar Pajak Badan / UMKM Langsung (7.3.01)</option>
                        <option value="POTONG_PAJAK">2. Pungut / Potong Pajak Pihak Lain (+ Utang 2.1.02)</option>
                        <option value="SETOR_PAJAK">3. Setor Utang Pajak Pungutan ke Negara (- 2.1.02)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Pos Akun Pajak (Kepmendes 136)</label>
                      <select
                        value={taxAccountCode}
                        onChange={(e) => setTaxAccountCode(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                      >
                        {taxSubType === "BAYAR_PAJAK_LANGSUNG" ? (
                          <>
                            <option value="7.3.01.10">7.3.01.10 - Beban PPh Final (UMKM 0,5%)</option>
                            <option value="7.3.01.09">7.3.01.09 - Beban PPh 29 (Badan Tahunan)</option>
                            <option value="7.3.01.08">7.3.01.08 - Beban PPh 25 (Angsuran)</option>
                            <option value="7.3.01.03">7.3.01.03 - Beban Pajak Daerah</option>
                            <option value="7.3.01.02">7.3.01.02 - Beban Pajak Bunga Bank</option>
                            <option value="7.3.01.99">7.3.01.99 - Beban Pajak Lainnya</option>
                          </>
                        ) : (
                          <>
                            <option value="2.1.02.01">2.1.02.01 - PPN Keluaran</option>
                            <option value="2.1.02.02">2.1.02.02 - PPh Pasal 21 (Honor/Gaji)</option>
                            <option value="2.1.02.03">2.1.02.03 - PPh Pasal 23 (Jasa/Sewa)</option>
                            <option value="2.1.02.04">2.1.02.04 - PPh Pasal 29</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">
                        {taxSubType === "POTONG_PAJAK"
                          ? "Diterima / Dipotong Melalui Akun"
                          : "Dibayar / Disetor Menggunakan Kas"}
                      </label>
                      <select
                        value={taxCounterCode}
                        onChange={(e) => setTaxCounterCode(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                      >
                        <option value="1.1.01.01">1.1.01.01 - Kas Tunai Bendahara</option>
                        <option value="1.1.01.06">1.1.01.06 - Kas di Bank Jatim</option>
                        <option value="1.1.01.04">1.1.01.04 - Kas di Bank BRI</option>
                        <option value="1.1.01.02">1.1.01.02 - Kas di Bank BNI</option>
                        <option value="1.1.01.03">1.1.01.03 - Kas di Bank Mandiri</option>
                        {taxSubType === "POTONG_PAJAK" && (
                          <>
                            <option value="7.3.01.10">7.3.01.10 - Beban PPh Final (Akrual)</option>
                            <option value="7.3.01.06">7.3.01.06 - Beban PPh 21 (Akrual)</option>
                            <option value="7.3.01.07">7.3.01.07 - Beban PPh 23 (Akrual)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Nomor NTPN / ID Billing (Opsional)</label>
                      <input
                        type="text"
                        value={taxNtpn}
                        onChange={(e) => setTaxNtpn(e.target.value)}
                        placeholder="Contoh: 849201928371..."
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Pihak / Bank / Wajib Pajak</label>
                <input
                  type="text"
                  value={txPayee}
                  onChange={(e) => setTxPayee(e.target.value)}
                  placeholder="Contoh: Bank Jatim Cab. Jombang / KPP Pratama"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Uraian Keterangan Jurnal</label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder={
                    selectedType === "BANK"
                      ? "Kosongkan untuk deskripsi otomatis sesuai jenis mutasi bank..."
                      : "Contoh: Setor PPh 21 Honor Pengurus Bulan Oktober..."
                  }
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Menyimpan..." : "Simpan ke Jurnal & Buku Pembantu"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
