"use client"

import React, { useState, useEffect } from "react"
import {
  BookOpen,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Printer,
  Upload,
  FileCheck2,
  Trash2,
  Search,
  ExternalLink
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import KwitansiModal, { ReceiptData } from "./KwitansiModal"
import { useSettings } from "@/context/SettingsContext"

interface BkuTabProps {
  onRefreshReport: () => void
}

interface TemplateOption {
  id: string
  category: "BKM" | "BKK"
  name: string
  unitUsaha: string
  targetAccount: string
  cashAccount: string
  cashFlowGroup?: string | null
  description?: string | null
}

interface FormLineItem {
  id: string
  templateId?: string
  name: string
  accountCode: string
  amount: string
  cashFlowGroup?: string
}

export default function BkuTab({ onRefreshReport }: BkuTabProps) {
  const settings = useSettings()

  // Cash Book (BKU) states
  const [cashBook, setCashBook] = useState<any[]>([])
  const [loadingBku, setLoadingBku] = useState(false)

  // Filtering & Pagination states
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterProofType, setFilterProofType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [paginationInfo, setPaginationInfo] = useState<{
    total: number
    pages: number
    currentPage: number
    limit: number
  } | null>(null)

  // Templates
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Multi-line Friendly Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalMode, setModalMode] = useState<"BKM" | "BKK">("BKM")
  const [formDate, setFormDate] = useState("")
  const [formPayeeOrPayer, setFormPayeeOrPayer] = useState("")
  const [formUnit, setFormUnit] = useState<"SP" | "GEDUNG" | "LAHAN" | "PPOB" | "UMUM">("UMUM")
  const [formCashAccount, setFormCashAccount] = useState("1.1.01.01")
  const [formNote, setFormNote] = useState("")
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [lineItems, setLineItems] = useState<FormLineItem[]>([])

  // Modal feedback
  const [formSubmitLoading, setFormSubmitLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Kwitansi Print Modal
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null)
  const [showKwitansiModal, setShowKwitansiModal] = useState(false)

  // Upload TTD Modal
  const [uploadTargetEntry, setUploadTargetEntry] = useState<any | null>(null)
  const [uploadingSigned, setUploadingSigned] = useState(false)

  // Fetch templates once
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await fetch("/api/keuangan/templates")
      const result = await res.json()
      if (result.success) {
        setTemplates(result.data || [])
      }
    } catch (err) {
      console.error("Fetch templates error:", err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Fetch BKU entries
  const fetchBku = async (
    page = currentPage,
    month = filterMonth,
    year = filterYear,
    limit = pageSize
  ) => {
    setLoadingBku(true)
    try {
      const query = new URLSearchParams()
      if (month !== "all") query.append("month", month)
      if (year !== "all") query.append("year", year)
      query.append("page", page.toString())
      query.append("limit", limit.toString())

      const res = await fetch(`/api/keuangan/cash-book?${query.toString()}`)
      const result = await res.json()
      if (result.success) {
        setCashBook(result.data || [])
        setPaginationInfo(result.pagination || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingBku(false)
    }
  }

  useEffect(() => {
    fetchBku(currentPage, filterMonth, filterYear, pageSize)
  }, [currentPage, filterMonth, filterYear, pageSize])

  const openCreateModal = (mode: "BKM" | "BKK") => {
    setModalMode(mode)
    setFormError(null)
    setFormSuccess(null)
    setFormDate(new Date().toISOString().split("T")[0])
    setFormPayeeOrPayer("")
    setFormUnit("UMUM")
    setFormCashAccount("1.1.01.01") // Kas Tunai default
    setFormNote("")
    setFormAttachmentUrl(null)

    // Init with 1 empty line
    setLineItems([
      {
        id: Math.random().toString(),
        name: "",
        accountCode: mode === "BKM" ? "4.1.04.01" : "5.1.01.01",
        amount: "",
        cashFlowGroup: ""
      }
    ])
    setShowAddModal(true)
  }

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: "",
        accountCode: modalMode === "BKM" ? "4.1.04.01" : "5.1.02.01",
        amount: "",
        cashFlowGroup: ""
      }
    ])
  }

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return
    setLineItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleTemplateSelect = (index: number, templateId: string) => {
    const selected = templates.find((t) => t.id === templateId)
    if (!selected) return

    setLineItems((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        templateId: selected.id,
        name: selected.name,
        accountCode: selected.targetAccount,
        cashFlowGroup: selected.cashFlowGroup || ""
      }
      return copy
    })

    // If unit or cashAccount is UMUM or empty, sync with template
    if (selected.unitUsaha && selected.unitUsaha !== "UMUM") {
      setFormUnit(selected.unitUsaha as any)
    }
    if (selected.cashAccount) {
      setFormCashAccount(selected.cashAccount)
    }
  }

  const handleLineChange = (index: number, field: keyof FormLineItem, val: string) => {
    setLineItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const parsed = parseFloat(item.amount)
      return sum + (isNaN(parsed) ? 0 : parsed)
    }, 0)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setFormError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      const result = await res.json()
      if (result.success) {
        setFormAttachmentUrl(result.url)
      } else {
        throw new Error(result.error || "Gagal mengunggah file")
      }
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const total = calculateTotal()
      if (total <= 0) {
        throw new Error("Total nominal transaksi harus lebih besar dari 0.")
      }

      // Check all lines have descriptions and accounts
      for (const item of lineItems) {
        if (!item.name.trim()) {
          throw new Error("Mohon lengkapi jenis transaksi / uraian di setiap baris.")
        }
        const amt = parseFloat(item.amount)
        if (isNaN(amt) || amt <= 0) {
          throw new Error(`Nominal untuk "${item.name}" harus lebih besar dari 0.`)
        }
      }

      // Build Journal Lines:
      // If BKM (Kas Masuk):
      // - Debit Kas (total)
      // - Credit each target account
      // If BKK (Kas Keluar):
      // - Debit each target account
      // - Credit Kas (total)
      const lines = []
      if (modalMode === "BKM") {
        lines.push({
          accountCode: formCashAccount,
          type: "DEBIT",
          amount: total,
          cashFlowGroup: lineItems[0]?.cashFlowGroup || null
        })
        for (const item of lineItems) {
          lines.push({
            accountCode: item.accountCode,
            type: "CREDIT",
            amount: parseFloat(item.amount),
            cashFlowGroup: item.cashFlowGroup || null
          })
        }
      } else {
        for (const item of lineItems) {
          lines.push({
            accountCode: item.accountCode,
            type: "DEBIT",
            amount: parseFloat(item.amount),
            cashFlowGroup: item.cashFlowGroup || null
          })
        }
        lines.push({
          accountCode: formCashAccount,
          type: "CREDIT",
          amount: total,
          cashFlowGroup: lineItems[0]?.cashFlowGroup || null
        })
      }

      const compositeDesc =
        lineItems.map((l) => l.name).join("; ") +
        (formPayeeOrPayer ? ` (${modalMode === "BKM" ? "Dari" : "Untuk"}: ${formPayeeOrPayer})` : "")

      const res = await fetch("/api/keuangan/cash-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate || undefined,
          description: compositeDesc,
          unitUsaha: formUnit,
          proofType: modalMode,
          payeeOrPayer: formPayeeOrPayer,
          note: formNote || null,
          lines,
          attachmentUrl: formAttachmentUrl
        })
      })

      const result = await res.json()
      if (result.success) {
        setFormSuccess(
          `Transaksi ${modalMode === "BKM" ? "Kas Masuk (BKM)" : "Kas Keluar (BKK)"} berhasil dibukukan!`
        )
        fetchBku(1, filterMonth, filterYear, pageSize)
        setCurrentPage(1)
        onRefreshReport()

        // Automatically prompt kwitansi modal for immediate print
        const createdEntry = result.data.entry
        openKwitansiForEntry(createdEntry, result.data.lines)

        setTimeout(() => {
          setShowAddModal(false)
          setFormSuccess(null)
        }, 1200)
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitLoading(false)
    }
  }

  // Open Kwitansi Print Modal
  const openKwitansiForEntry = (entry: any, linesParam?: any[]) => {
    const lines = linesParam || entry.lines || []
    const isBKM =
      entry.proofType === "BKM" ||
      (!entry.proofType && lines.some((l: any) => l.type === "DEBIT" && l.accountCode.startsWith("1")))

    // Separate Cash account and target items
    const cashLine = lines.find((l: any) =>
      isBKM ? l.type === "DEBIT" : l.type === "CREDIT"
    )
    const targetLines = lines.filter((l: any) => l.id !== cashLine?.id)

    const total = targetLines.reduce((s: number, l: any) => s + l.amount, 0) || cashLine?.amount || 0

    const items =
      targetLines.length > 0
        ? targetLines.map((l: any) => ({
            accountCode: l.accountCode,
            description: entry.description || "Transaksi Kas",
            amount: l.amount
          }))
        : [
            {
              accountCode: lines[0]?.accountCode || "-",
              description: entry.description,
              amount: total
            }
          ]

    setActiveReceipt({
      id: entry.id,
      proofNumber: entry.proofNumber || `${isBKM ? "BKM" : "BKK"}-${entry.id.slice(0, 6)}`,
      proofType: isBKM ? "BKM" : "BKK",
      date: entry.date,
      payeeOrPayer: entry.payeeOrPayer || (isBKM ? "Masyarakat / Unit" : "Penerima Kas"),
      unitUsaha: entry.unitUsaha,
      note: entry.note,
      items,
      totalAmount: total,
      bumdesName: settings.bumdes_name || "Desa",
      villageName: settings.village_name || "",
      operatorName: "Operator Induk",
      directorName: settings.director_name || "H. Suryono, S.Sos",
      treasurerName: settings.treasurer_name || "Siti Rahmawati, S.E.",
      attachmentUrl: entry.attachmentUrl,
      verificationStatus: entry.verificationStatus
    })

    setShowKwitansiModal(true)
  }

  // Handle uploading signed receipt from table row
  const handleUploadSignedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTargetEntry) return
    setUploadingSigned(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      const result = await res.json()
      if (result.success) {
        // Update journalEntry
        await fetch(`/api/keuangan/cash-book/${uploadTargetEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachmentUrl: result.url,
            verificationStatus: "SIGNED_UPLOADED"
          })
        })
        fetchBku(currentPage, filterMonth, filterYear, pageSize)
        setUploadTargetEntry(null)
      } else {
        alert(result.error || "Gagal mengunggah foto bukti")
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUploadingSigned(false)
    }
  }

  // Filter local for proofType or status
  const filteredCashBook = cashBook.filter((entry) => {
    if (filterProofType !== "all" && entry.proofType !== filterProofType) return false
    if (filterStatus !== "all" && entry.verificationStatus !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight">
                Buku Kas Umum & Bukti Kwitansi (BKM / BKK)
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Pengisian mudah berbasis transaksi fisik tanpa ribet memilih akun debit/kredit manual.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openCreateModal("BKM")}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-sky-600/10 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4" />
            + Buat Bukti Kas Masuk (BKM)
          </button>
          <button
            onClick={() => openCreateModal("BKK")}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-rose-600/10 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowUpCircle className="w-4 h-4" />
            + Buat Bukti Kas Keluar (BKK)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-100 p-3 rounded-2xl no-print text-xs shadow-sm">
        <div className="flex items-center gap-1.5 font-bold text-slate-500">
          <Search className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={filterMonth}
          onChange={(e) => {
            setFilterMonth(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
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
          value={filterYear}
          onChange={(e) => {
            setFilterYear(e.target.value)
            setCurrentPage(1)
          }}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
        >
          <option value="all">Semua Tahun</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>

        <select
          value={filterProofType}
          onChange={(e) => setFilterProofType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
        >
          <option value="all">Semua Jenis Bukti</option>
          <option value="BKM">BKM (Kas Masuk)</option>
          <option value="BKK">BKK (Kas Keluar)</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
        >
          <option value="all">Semua Status Bukti</option>
          <option value="DRAFT">🟡 Belum Ada Bukti Fisik</option>
          <option value="SIGNED_UPLOADED">🟣 Bukti TTD Terunggah</option>
          <option value="VERIFIED">🟢 Terverifikasi</option>
        </select>

        <div className="sm:ml-auto flex items-center gap-2">
          <span className="text-slate-400 font-medium">Tampilkan:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10))
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none cursor-pointer focus:border-blue-500 transition-colors"
          >
            <option value="10">10 Baris</option>
            <option value="20">20 Baris</option>
            <option value="50">50 Baris</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden print-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">No. Bukti / Tanggal</th>
                <th className="px-4 py-3.5">Unit</th>
                <th className="px-5 py-3.5">Uraian / Pihak Transaksi</th>
                <th className="px-4 py-3.5">Kode Akun</th>
                <th className="px-5 py-3.5 text-right">Debit (Rp)</th>
                <th className="px-5 py-3.5 text-right">Kredit (Rp)</th>
                <th className="px-5 py-3.5 text-center no-print">Bukti & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {loadingBku ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Memuat data Buku Kas Umum...
                  </td>
                </tr>
              ) : filteredCashBook.length > 0 ? (
                filteredCashBook.map((entry) => {
                  const isBKM = entry.proofType === "BKM"
                  const isBKK = entry.proofType === "BKK"

                  return (
                    <React.Fragment key={entry.id}>
                      {entry.lines.map((line: any, idx: number) => (
                        <tr key={line.id} className="hover:bg-slate-50/40 transition-colors">
                          {idx === 0 ? (
                            <>
                              <td
                                className="px-5 py-3.5 align-top border-r border-slate-100 font-semibold"
                                rowSpan={entry.lines.length}
                              >
                                <div className="space-y-1">
                                  {entry.proofNumber ? (
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                                        isBKM
                                          ? "bg-sky-100 text-sky-700 border border-sky-200"
                                          : isBKK
                                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                                          : "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {entry.proofNumber}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-mono italic">
                                      Jurnal Umum
                                    </span>
                                  )}
                                  <div className="text-slate-500 text-[11px]">
                                    {new Date(entry.date).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                  </div>
                                </div>
                              </td>

                              <td
                                className="px-4 py-3.5 align-top border-r border-slate-100"
                                rowSpan={entry.lines.length}
                              >
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
                                  {entry.unitUsaha}
                                </span>
                              </td>

                              <td
                                className="px-5 py-3.5 align-top border-r border-slate-100 font-medium text-slate-800"
                                rowSpan={entry.lines.length}
                              >
                                <div>
                                  <span className="font-semibold">{entry.description}</span>
                                  {entry.payeeOrPayer && (
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      <span className="font-semibold text-slate-400">
                                        {isBKM ? "Penyetor: " : "Penerima: "}
                                      </span>
                                      {entry.payeeOrPayer}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </>
                          ) : null}

                          <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-slate-600 border-r border-slate-100">
                            {line.accountCode}
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono font-semibold text-slate-800 border-r border-slate-100">
                            {line.type === "DEBIT" ? formatRupiah(line.amount) : "—"}
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono font-semibold text-slate-800 border-r border-slate-100">
                            {line.type === "CREDIT" ? formatRupiah(line.amount) : "—"}
                          </td>

                          {idx === 0 ? (
                            <td
                              className="px-5 py-3.5 align-top text-center no-print"
                              rowSpan={entry.lines.length}
                            >
                              <div className="flex flex-col items-center gap-1.5">
                                {/* Print receipt button */}
                                <button
                                  onClick={() => openKwitansiForEntry(entry)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] shadow transition-all active:scale-95"
                                  title="Cetak Kwitansi BKM / BKK Standar Bimtek"
                                >
                                  <Printer className="w-3 h-3" />
                                  Cetak
                                </button>

                                {/* Bukti Status Badge & Upload */}
                                {entry.attachmentUrl ? (
                                  <div className="flex items-center gap-1">
                                    <a
                                      href={entry.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded-md"
                                    >
                                      <FileCheck2 className="w-3 h-3" />
                                      Bukti TTD
                                    </a>
                                  </div>
                                ) : (
                                  <label className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md cursor-pointer transition-colors">
                                    <Upload className="w-2.5 h-2.5" />
                                    <span>Upload TTD</span>
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      className="hidden"
                                      onChange={(e) => {
                                        setUploadTargetEntry(entry)
                                        handleUploadSignedFile(e)
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Tidak ada transaksi Buku Kas Umum yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {paginationInfo && paginationInfo.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-3xl no-print text-xs shadow-sm">
          <div className="text-slate-500 font-medium">
            Halaman <span className="font-bold text-slate-700">{paginationInfo.currentPage}</span>{" "}
            dari <span className="font-bold text-slate-700">{paginationInfo.pages}</span> (Total{" "}
            <span className="font-bold text-slate-700">{paginationInfo.total}</span> entri)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={paginationInfo.currentPage === 1 || loadingBku}
              className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(paginationInfo.pages, prev + 1))}
              disabled={paginationInfo.currentPage === paginationInfo.pages || loadingBku}
              className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {/* MODAL INPUT TRANSAKSI RAMAH OPERATOR (MULTI-BARIS) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-2xl shadow-2xl p-6 md:p-8 relative my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <span
                className={`p-3 rounded-2xl ${
                  modalMode === "BKM" ? "bg-sky-100 text-sky-600" : "bg-rose-100 text-rose-600"
                }`}
              >
                {modalMode === "BKM" ? (
                  <ArrowDownCircle className="w-6 h-6" />
                ) : (
                  <ArrowUpCircle className="w-6 h-6" />
                )}
              </span>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {modalMode === "BKM"
                    ? "Form Bukti Kas Masuk (BKM)"
                    : "Form Bukti Kas Keluar (BKK)"}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Input setoran dari unit usaha atau pengeluaran operasional. Kode akun & jurnal
                  terbentuk otomatis.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pr-1 flex-1">
              {/* Row 1: Tanggal, Pihak (Penyetor / Penerima), Unit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {modalMode === "BKM" ? "Diterima Dari (Penyetor)" : "Dibayarkan Ke (Penerima)"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      modalMode === "BKM"
                        ? "Contoh: Bpk. Joko (Staf Sewa Gedung)"
                        : "Contoh: Toko Berkah ATK"
                    }
                    value={formPayeeOrPayer}
                    onChange={(e) => setFormPayeeOrPayer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Unit Usaha
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="UMUM">BUMDES Umum / Induk</option>
                    <option value="SP">Unit Simpan Pinjam</option>
                    <option value="GEDUNG">Unit Gedung GSG</option>
                    <option value="LAHAN">Unit Sewa Lahan / Lapak</option>
                    <option value="PPOB">Unit PPOB / Loket Desa</option>
                  </select>
                </div>
              </div>

              {/* Rekening Kas yang Terpengaruh */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">
                  {modalMode === "BKM" ? "Masuk ke Rekening Kas:" : "Uang Diambil dari Kas:"}
                </span>
                <select
                  value={formCashAccount}
                  onChange={(e) => setFormCashAccount(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none"
                >
                  <option value="1.1.01.01">1.1.01.01 Kas Tunai BUMDES</option>
                  <option value="1.1.01.04">1.1.01.04 Kas di Bank BRI</option>
                  <option value="1.1.01.06">1.1.01.06 Kas di Bank Jatim</option>
                  <option value="1.1.01.98">1.1.01.98 Kas Kecil (Petty Cash)</option>
                </select>
              </div>

              {/* Multi-line Rincian Transaksi */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rincian Pos Transaksi (Bisa Lebih dari 1 Baris)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lineItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400">
                          Baris #{idx + 1}
                        </span>

                        {/* Quick Template Selector */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Pilih Template Cepat:
                          </span>
                          <select
                            value={item.templateId || ""}
                            onChange={(e) => handleTemplateSelect(idx, e.target.value)}
                            className="text-[11px] px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none max-w-[220px]"
                          >
                            <option value="">-- Pilih Jenis Transaksi --</option>
                            {templates
                              .filter((t) => t.category === modalMode)
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            required
                            placeholder="Uraian transaksi (misal: Sewa gedung acara pernikahan Bpk Slamet)"
                            value={item.name}
                            onChange={(e) => handleLineChange(idx, "name", e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="number"
                            required
                            placeholder="Nominal (Rp)"
                            value={item.amount}
                            onChange={(e) => handleLineChange(idx, "amount", e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:bg-white text-right"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>
                          Akun Terhubung: <strong className="font-mono text-slate-600">{item.accountCode}</strong>
                        </span>
                        {item.cashFlowGroup && (
                          <span className="italic">LAK: {item.cashFlowGroup}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
                  Total Nominal Kwitansi :
                </span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {formatRupiah(calculateTotal())}
                </span>
              </div>

              {/* Catatan Tambahan & Lampiran Fisik Awal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: No order #1234 atau catatan fisik"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Lampirkan Bukti Fisik / Foto Nota (Opsional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {uploading && (
                    <p className="text-[10px] text-blue-600 font-semibold animate-pulse">
                      Mengunggah berkas...
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className={`w-full py-3.5 text-white font-black rounded-2xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                    modalMode === "BKM"
                      ? "bg-sky-600 hover:bg-sky-700 shadow-sky-600/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  {formSubmitLoading
                    ? "Menyimpan Transaksi & Menyiapkan Kwitansi..."
                    : `Simpan Transaksi & Buka Kwitansi ${modalMode}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kwitansi Modal Popup */}
      <KwitansiModal
        isOpen={showKwitansiModal}
        onClose={() => setShowKwitansiModal(false)}
        data={activeReceipt}
      />
    </div>
  )
}
