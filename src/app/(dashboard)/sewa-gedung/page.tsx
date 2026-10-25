"use client"

import React, { useState, useEffect } from "react"
import {
  Building2,
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  X,
  MapPin,
  CalendarDays,
  Printer,
  TrendingDown,
  DollarSign
} from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import KwitansiModal from "@/components/KwitansiModal"
import { useSettings } from "@/context/SettingsContext"
import GedungSettingsTab from "./GedungSettingsTab"

interface Booking {
  id: string
  customerName: string
  type: string // BADMINTON, RAPAT, PESTA
  dateStart: string
  dateEnd: string
  totalFee: number
  dpAmount: number
  status: string // BOOKED, PAID, CANCELLED
  createdAt?: string
}

export default function SewaGedungPage() {
  const settings = useSettings()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"kalender" | "laporan" | "pengaturan">("kalender")
  const [reportMonth, setReportMonth] = useState<string>("all")
  const [reportYear, setReportYear] = useState<string>("2026")
  const [gedungReportData, setGedungReportData] = useState<{
    bookings: Booking[]
    revenues: any[]
    expenses: any[]
  }>({ bookings: [], revenues: [], expenses: [] })
  const [reportLoading, setReportLoading] = useState<boolean>(false)

  // Modal States
  const [activeModal, setActiveModal] = useState<"booking" | "payment" | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Form States
  const [customerName, setCustomerName] = useState("")
  const [bookingType, setBookingType] = useState<"BADMINTON" | "RAPAT" | "PESTA">("BADMINTON")
  const [startDateStr, setStartDateStr] = useState("")
  const [startTimeStr, setStartTimeStr] = useState("08:00")
  const [endDateStr, setEndDateStr] = useState("")
  const [endTimeStr, setEndTimeStr] = useState("10:00")
  const [totalFee, setTotalFee] = useState("")
  const [dpAmount, setDpAmount] = useState("")
  
  const [payAmount, setPayAmount] = useState("")

  const [formSubmitLoading, setFormSubmitLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // POS Thermal Receipt state
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)

  const [printType, setPrintType] = useState<"bookings" | "laporan_gedung" | null>(null)

  const handlePrint = (type: "bookings" | "laporan_gedung" = "bookings") => {
    setPrintType(type)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  const fetchReportData = async () => {
    setReportLoading(true)
    try {
      const res = await fetch(`/api/sewa-gedung/reports?month=${reportMonth}&year=${reportYear}`)
      const result = await res.json()
      if (result.success) {
        setGedungReportData(result.data)
      } else {
        console.error("Gagal memuat laporan gedung:", result.error)
      }
    } catch (err) {
      console.error("Kesalahan memuat laporan gedung:", err)
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "laporan") {
      fetchReportData()
    }
  }, [activeTab, reportMonth, reportYear])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sewa-gedung/bookings")
      const result = await res.json()
      if (result.success) {
        setBookings(result.data)
      } else {
        throw new Error(result.error || "Gagal mengambil data booking")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  // Auto set end date when start date is entered
  useEffect(() => {
    if (startDateStr && !endDateStr) {
      setEndDateStr(startDateStr)
    }
  }, [startDateStr, endDateStr])

  // Custom calendar helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth)

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Find bookings for a specific day
  const getBookingsForDay = (dayNum: number) => {
    const checkDate = new Date(currentYear, currentMonth, dayNum)
    return bookings.filter((b) => {
      const bStart = new Date(b.dateStart)
      const bEnd = new Date(b.dateEnd)
      
      const bStartDay = new Date(bStart.getFullYear(), bStart.getMonth(), bStart.getDate())
      const bEndDay = new Date(bEnd.getFullYear(), bEnd.getMonth(), bEnd.getDate())
      
      return checkDate >= bStartDay && checkDate <= bEndDay
    })
  }

  // Handle Form Submissions
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitLoading(true)
    setFormError(null)
    setFormSuccess(null)

    const dateStart = `${startDateStr}T${startTimeStr}:00`
    const dateEnd = `${endDateStr}T${endTimeStr}:00`

    try {
      const res = await fetch("/api/sewa-gedung/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          type: bookingType,
          dateStart,
          dateEnd,
          totalFee: parseFloat(totalFee),
          dpAmount: parseFloat(dpAmount || "0")
        })
      })

      const result = await res.json()

      if (result.success) {
        setFormSuccess("Reservasi gedung berhasil dicatat!")
        setCustomerName("")
        setTotalFee("")
        setDpAmount("")
        
        // Open POS Receipt modal for DP payment if paid
        const dpVal = parseFloat(dpAmount || "0")
        if (dpVal > 0) {
          setReceiptData({
            title: `DP Pemesanan Gedung (${bookingType})`,
            customerName: customerName,
            customerCode: `Kavling Gedung`,
            date: new Date(),
            amount: dpVal,
            details: [
              { label: "Penyewa", value: customerName },
              { label: "Keperluan", value: bookingType },
              { label: "Total Tarif", value: parseFloat(totalFee) },
              { label: "Masa Sewa", value: `${startDateStr} ${startTimeStr} s.d ${endDateStr} ${endTimeStr}` },
              { label: "Status Pembayaran", value: "UANG MUKA (DP)" }
            ],
            accounts: [
              { code: "1-1100", name: "Kas BUMDES", type: "DEBIT" },
              { code: "4-1300", name: "Pendapatan Sewa Gedung", type: "CREDIT" }
            ]
          })
          setTimeout(() => {
            setShowReceipt(true)
          }, 800)
        }

        fetchBookings()
        setTimeout(() => {
          setActiveModal(null)
          setFormSuccess(null)
        }, 1500)
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitLoading(false)
    }
  }

  const handlePayRemaining = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return
    setFormSubmitLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const res = await fetch("/api/sewa-gedung/bookings/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          amount: parseFloat(payAmount)
        })
      })

      const result = await res.json()

      if (result.success) {
        setFormSuccess("Pelunasan sewa gedung berhasil dicatat!")
        setPayAmount("")

        // Open POS Receipt modal for final settlement
        setReceiptData({
          title: `Pelunasan Sewa Gedung (${selectedBooking.type})`,
          customerName: selectedBooking.customerName,
          customerCode: `Pelunasan Sewa`,
          date: new Date(),
          amount: parseFloat(payAmount),
          details: [
            { label: "Penyewa", value: selectedBooking.customerName },
            { label: "Keperluan", value: selectedBooking.type },
            { label: "Total Tarif", value: selectedBooking.totalFee },
            { label: "Uang Muka (DP)", value: selectedBooking.dpAmount },
            { label: "Pembayaran Pelunasan", value: parseFloat(payAmount) }
          ],
          accounts: [
            { code: "1-1100", name: "Kas BUMDES", type: "DEBIT" },
            { code: "4-1300", name: "Pendapatan Sewa Gedung", type: "CREDIT" }
          ]
        })
        setTimeout(() => {
          setShowReceipt(true)
        }, 800)

        fetchBookings()
        setTimeout(() => {
          setActiveModal(null)
          setFormSuccess(null)
        }, 1500)
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormSubmitLoading(false)
    }
  }

  // Helper styles for badges
  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case "BADMINTON":
        return "bg-emerald-50 text-emerald-800 border-emerald-200"
      case "RAPAT":
        return "bg-blue-50 text-blue-800 border-blue-200"
      case "PESTA":
        return "bg-purple-50 text-purple-800 border-purple-200"
      default:
        return "bg-slate-50 text-slate-800 border-slate-200"
    }
  }

  const getBookingTypeDotColor = (type: string) => {
    switch (type) {
      case "BADMINTON":
        return "bg-emerald-500"
      case "RAPAT":
        return "bg-blue-500"
      case "PESTA":
        return "bg-purple-500"
      default:
        return "bg-slate-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* style tag */}
      <style jsx global>{`
        @media print {
          aside, header, nav, .no-print, button, select, input, .no-print-element {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {printType && (
        <div className="fixed top-0 inset-x-0 bg-slate-900/90 text-white py-3 px-6 z-[100] flex items-center justify-between no-print backdrop-blur-sm">
          <span className="font-semibold text-xs flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            Pratinjau Cetak: Laporan Rekapitulasi Sewa Gedung & Lapangan
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 shadow-md shadow-emerald-600/10 flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Dokumen
            </button>
            <button
              onClick={() => setPrintType(null)}
              className="bg-slate-700 hover:bg-slate-655 text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {!printType ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sewa Gedung & Lapangan</h1>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                Kelola reservasi sewa gedung serbaguna (pesta/rapat) dan lapangan badminton desa terintegrasi kalender.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrint(activeTab === "laporan" ? "laporan_gedung" : "bookings")}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-sm transition-all active:scale-95 shrink-0 w-fit"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                Cetak Laporan
              </button>
              <button
                onClick={() => {
                  setCustomerName("")
                  setTotalFee("")
                  setDpAmount("")
                  setFormError(null)
                  setFormSuccess(null)
                  setActiveModal("booking")
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-emerald-600/10 transition-all active:scale-95 shrink-0 w-fit"
              >
                <Plus className="w-4 h-4" />
                Booking Baru
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200/50">
            <button
              onClick={() => setActiveTab("kalender")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "kalender" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Kalender & Jadwal Sewa
            </button>
            <button
              onClick={() => setActiveTab("laporan")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "laporan" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Laporan & Rekap
            </button>
            <button
              onClick={() => setActiveTab("pengaturan")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "pengaturan" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Pengaturan
            </button>
          </div>

          {activeTab === "laporan" ? (
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pendapatan Unit</span>
                    <span className="text-xl font-bold text-emerald-600 mt-1 block">
                      {formatRupiah(gedungReportData.revenues.reduce((sum, r) => sum + r.amount, 0))}
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
                      {formatRupiah(gedungReportData.expenses.reduce((sum, e) => sum + e.amount, 0))}
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
                      const net = gedungReportData.revenues.reduce((sum, r) => sum + r.amount, 0) - 
                                  gedungReportData.expenses.reduce((sum, e) => sum + e.amount, 0)
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

                <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pemesanan Gedung</span>
                    <span className="text-xl font-bold text-indigo-650 mt-1 block">
                      {gedungReportData.bookings.length} Booking
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pemasukan & Aktivitas Table */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Aktivitas Pemesanan & Pemasukan Gedung
                    </h4>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                      {gedungReportData.bookings.length} Acara
                    </span>
                  </div>
                  <div className="overflow-x-auto flex-1 max-h-[400px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3">Penyewa</th>
                          <th className="px-4 py-3">Keperluan</th>
                          <th className="px-4 py-3 text-right">Tarif</th>
                          <th className="px-4 py-3 text-right">Dibayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px] text-slate-700">
                        {gedungReportData.bookings.length > 0 ? (
                          gedungReportData.bookings.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3">{new Date(b.dateStart).toLocaleDateString("id-ID")}</td>
                              <td className="px-4 py-3 font-semibold">{b.customerName}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  b.type === "PESTA" ? "bg-purple-50 text-purple-700" :
                                  b.type === "RAPAT" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  {b.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-slate-700">{formatRupiah(b.totalFee)}</td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatRupiah(b.dpAmount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">
                              Tidak ada pemesanan terdaftar.
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
                      Rincian Pengeluaran Operasional Gedung
                    </h4>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                      {gedungReportData.expenses.length} Transaksi
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
                        {gedungReportData.expenses.length > 0 ? (
                          gedungReportData.expenses.map((e) => (
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
          ) : activeTab === "pengaturan" ? (
            <GedungSettingsTab />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendar Column */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-800 font-bold text-sm tracking-tight">
              Kalender Pemesanan Gedung
            </h2>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-655 hover:text-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 min-w-[100px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-655 hover:text-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {/* Days header */}
            {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((dayName) => (
              <div key={dayName} className="text-center py-2 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                {dayName.slice(0, 3)}
              </div>
            ))}

            {/* Empty prefix cells */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="p-2 bg-slate-50/30 rounded-2xl min-h-[50px] border border-transparent" />
            ))}

            {/* Days cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1
              const dayBookings = getBookingsForDay(dayNum)
              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => {
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                    setStartDateStr(dateStr)
                    setEndDateStr(dateStr)
                    setCustomerName("")
                    setTotalFee("")
                    setDpAmount("")
                    setFormError(null)
                    setFormSuccess(null)
                    setActiveModal("booking")
                  }}
                  className={`p-2 border border-slate-50 hover:border-emerald-250 rounded-2xl flex flex-col justify-between items-start transition-all relative overflow-hidden group min-h-[55px] ${
                    dayBookings.length > 0 ? "bg-emerald-50/15" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-650 group-hover:text-emerald-700 transition-colors">
                    {dayNum}
                  </span>
                  
                  {/* Indicators for bookings */}
                  {dayBookings.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 w-full">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          title={`${b.customerName} (${b.type})`}
                          className={`w-1.5 h-1.5 rounded-full ${getBookingTypeDotColor(b.type)}`}
                        />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[8px] font-bold text-emerald-700">+{dayBookings.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Schedule List Section */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Jadwal Booking Terdekat
            </h2>
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {bookings.length > 0 ? (
                bookings.map((booking) => {
                  const bStart = new Date(booking.dateStart)
                  const formattedDate = bStart.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                  const formattedTime = `${String(bStart.getHours()).padStart(2, "0")}:${String(bStart.getMinutes()).padStart(2, "0")}`
                  const unpaid = booking.totalFee - booking.dpAmount

                  return (
                    <div key={booking.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-850 text-xs leading-none">{booking.customerName}</p>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                            {formattedDate} &bull; Jam {formattedTime}
                          </span>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[9px] font-bold ${getBookingTypeColor(booking.type)}`}>
                          {booking.type}
                        </span>
                      </div>
                      
                      <div className="border-t border-slate-100/50 mt-2 pt-2 flex justify-between items-center text-[10px] gap-2">
                        <div>
                          <span className="text-slate-400 block font-semibold leading-none">Total Biaya:</span>
                          <span className="font-bold text-slate-700 mt-1 block">{formatRupiah(booking.totalFee)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-right">
                          {unpaid > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-rose-600 font-bold block">Sisa: {formatRupiah(unpaid)}</span>
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking)
                                  setPayAmount(String(unpaid))
                                  setFormError(null)
                                  setFormSuccess(null)
                                  setActiveModal("payment")
                                }}
                                className="mt-1 text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg shadow-sm active:scale-95 transition-all"
                              >
                                Lunasi
                              </button>
                            </div>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[9px] flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Lunas
                            </span>
                          )}

                          {/* Reprint past booking kuitansi */}
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptData({
                                title: `Sewa Gedung (${booking.type})`,
                                customerName: booking.customerName,
                                customerCode: `Booking ${booking.type}`,
                                date: booking.dateStart,
                                amount: booking.totalFee,
                                details: [
                                  { label: "Penyewa Gedung", value: booking.customerName },
                                  { label: "Keperluan", value: booking.type },
                                  { label: "Tarif Sewa Total", value: booking.totalFee },
                                  { label: "Uang Muka (DP)", value: booking.dpAmount },
                                  { label: "Sisa Pelunasan", value: unpaid },
                                  { label: "Status Sewa", value: booking.status }
                                ],
                                accounts: [
                                  { code: "1-1100", name: "Kas BUMDES", type: "DEBIT" },
                                  { code: "4-1300", name: "Pendapatan Sewa Gedung", type: "CREDIT" }
                                ]
                              })
                              setShowReceipt(true)
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg bg-white transition shadow-sm"
                            title="Cetak Kuitansi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-slate-400 text-xs font-semibold py-8 text-center">Tidak ada jadwal booking aktif.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    )}

      {/* --------------------- MODALS --------------------- */}

      {/* 1. Modal: Create Booking */}
      {activeModal === "booking" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              Pemesanan Gedung Baru
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block">Nama Penyewa</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap instansi / personal"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase block">Jenis Keperluan Sewa</label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="BADMINTON">Badminton (Per Jam / Lapangan)</option>
                  <option value="RAPAT">Rapat / Seminar (Harian)</option>
                  <option value="PESTA">Pesta Pernikahan / Acara Besar (Harian)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Total Tarif (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 1000000"
                    value={totalFee}
                    onChange={(e) => setTotalFee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Bayar DP (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={dpAmount}
                    onChange={(e) => setDpAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formSubmitLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
              >
                {formSubmitLoading ? "Memproses..." : "Simpan Booking"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Payout settlement */}
      {activeModal === "payment" && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Pelunasan Sewa Gedung
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
              Penyewa: {selectedBooking.customerName}
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePayRemaining} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Tarif Sewa:</span>
                  <span className="font-bold text-slate-700">{formatRupiah(selectedBooking.totalFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telah Dibayar (DP):</span>
                  <span className="font-bold text-slate-700">{formatRupiah(selectedBooking.dpAmount)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-rose-705 bg-rose-50/10 rounded">
                  <span>Sisa Kekurangan:</span>
                  <span>{formatRupiah(selectedBooking.totalFee - selectedBooking.dpAmount)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Jumlah Pembayaran Pelunasan (Rp)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs text-slate-800 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
              >
                {formSubmitLoading ? "Memproses..." : "Konfirmasi Pelunasan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POS Thermal Receipt Overlay */}
      <KwitansiModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        bumdesName={settings?.bumdes_name}
        locationText={settings?.village_name ? `Desa ${settings.village_name}, Kec. ${settings.district_name}` : ""}
        {...receiptData}
      />

        </div>
      ) : (
        <div className="print-area bg-white text-slate-800 p-8 min-h-screen font-serif text-[11px] leading-relaxed">
          {/* Kop Surat / Letterhead */}
          <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">{settings?.bumdes_name || "BUMDES"}</h1>
            <p className="text-xs font-semibold text-slate-500">
              {settings?.village_name ? `Desa ${settings.village_name}, Kecamatan ${settings.district_name}, Kabupaten ${settings.regency_name}` : ""}
            </p>
          </div>

          {printType === "laporan_gedung" ? (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-sm font-bold uppercase text-slate-800">
                  LAPORAN REALISASI KEGIATAN & KEUANGAN UNIT SEWA GEDUNG
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Periode: {reportMonth === "all" ? "Semua Bulan" : monthNames[parseInt(reportMonth) - 1]} {reportYear === "all" ? "Semua Tahun" : reportYear}
                </p>
              </div>

              {/* Rincian Pemasukan */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs border-b border-slate-300 pb-1 uppercase">I. PENERIMAAN / PEMASUKAN UNIT</h3>
                <table className="w-full border-collapse border border-slate-350 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold">
                      <th className="border border-slate-350 px-2 py-1.5 text-center w-8">No</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-left">Tanggal</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-left">Penyewa / Acara</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-left">Keterangan Jurnal</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-right">Nominal Masuk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gedungReportData.revenues.length > 0 ? (
                      gedungReportData.revenues.map((r, index) => (
                        <tr key={r.id}>
                          <td className="border border-slate-350 px-2 py-1.5 text-center">{index + 1}</td>
                          <td className="border border-slate-350 px-2 py-1.5">{new Date(r.date).toLocaleDateString("id-ID")}</td>
                          <td className="border border-slate-350 px-2 py-1.5 font-bold">{r.description.replace("Penerimaan Sewa Gedung (", "").replace("Pelunasan Sewa Gedung (", "").replace(")", "")}</td>
                          <td className="border border-slate-350 px-2 py-1.5">{r.description}</td>
                          <td className="border border-slate-350 px-2 py-1.5 text-right">{formatRupiah(r.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="border border-slate-350 px-2 py-8 text-center text-slate-400">Tidak ada pemasukan tercatat.</td>
                      </tr>
                    )}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={4} className="border border-slate-350 px-2 py-1.5 text-right uppercase">Total Pemasukan:</td>
                      <td className="border border-slate-350 px-2 py-1.5 text-right">{formatRupiah(gedungReportData.revenues.reduce((sum, r) => sum + r.amount, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rincian Pengeluaran */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs border-b border-slate-300 pb-1 uppercase">II. PENGELUARAN OPERASIONAL UNIT</h3>
                <table className="w-full border-collapse border border-slate-350 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold">
                      <th className="border border-slate-350 px-2 py-1.5 text-center w-8">No</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-left">Tanggal</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-left">Keterangan</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-left">Kode Akun</th>
                      <th className="border border-slate-350 px-2 py-1.5 text-right font-semibold">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gedungReportData.expenses.length > 0 ? (
                      gedungReportData.expenses.map((e, index) => (
                        <tr key={e.id}>
                          <td className="border border-slate-350 px-2 py-1.5 text-center">{index + 1}</td>
                          <td className="border border-slate-350 px-2 py-1.5">{new Date(e.date).toLocaleDateString("id-ID")}</td>
                          <td className="border border-slate-350 px-2 py-1.5">{e.description}</td>
                          <td className="border border-slate-350 px-2 py-1.5">{e.accountCode}</td>
                          <td className="border border-slate-350 px-2 py-1.5 text-right">{formatRupiah(e.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="border border-slate-350 px-2 py-8 text-center text-slate-400">Tidak ada pengeluaran operasional tercatat.</td>
                      </tr>
                    )}
                    <tr className="font-bold bg-slate-50">
                      <td colSpan={4} className="border border-slate-350 px-2 py-1.5 text-right uppercase">Total Pengeluaran:</td>
                      <td className="border border-slate-350 px-2 py-1.5 text-right">{formatRupiah(gedungReportData.expenses.reduce((sum, e) => sum + e.amount, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Ringkasan Bersih */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg flex justify-between items-center text-[11px] font-bold">
                <span>LABA BERSIH OPERASIONAL UNIT (SURPLUS/DEFISIT):</span>
                <span>
                  {formatRupiah(
                    gedungReportData.revenues.reduce((sum, r) => sum + r.amount, 0) - 
                    gedungReportData.expenses.reduce((sum, e) => sum + e.amount, 0)
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h2 className="text-sm font-bold uppercase text-slate-800">LAPORAN REKAPITULASI PENYEWAAN GEDUNG & LAPANGAN</h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  Tanggal Cetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              <table className="w-full border-collapse border border-slate-350 text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold">
                    <th className="border border-slate-350 px-3 py-2 text-center w-8">No</th>
                    <th className="border border-slate-350 px-3 py-2 text-left">Nama Penyewa</th>
                    <th className="border border-slate-350 px-3 py-2 text-center">Kategori</th>
                    <th className="border border-slate-350 px-3 py-2 text-left">Waktu Sewa (Mulai s.d Selesai)</th>
                    <th className="border border-slate-350 px-3 py-2 text-right">Total Tarif</th>
                    <th className="border border-slate-350 px-3 py-2 text-right">Uang Muka (DP)</th>
                    <th className="border border-slate-350 px-3 py-2 text-right">Sisa Pelunasan</th>
                    <th className="border border-slate-350 px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, index) => {
                    const bStart = new Date(b.dateStart).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    const bEnd = new Date(b.dateEnd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    const unpaid = b.totalFee - b.dpAmount
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="border border-slate-355 px-3 py-2 text-center">{index + 1}</td>
                        <td className="border border-slate-355 px-3 py-2 font-medium">{b.customerName}</td>
                        <td className="border border-slate-355 px-3 py-2 text-center font-semibold">{b.type}</td>
                        <td className="border border-slate-355 px-3 py-2">
                          {bStart} s.d {bEnd}
                        </td>
                        <td className="border border-slate-355 px-3 py-2 text-right">{formatRupiah(b.totalFee)}</td>
                        <td className="border border-slate-355 px-3 py-2 text-right">{formatRupiah(b.dpAmount)}</td>
                        <td className="border border-slate-355 px-3 py-2 text-right font-medium">
                          {unpaid > 0 ? formatRupiah(unpaid) : "Lunas"}
                        </td>
                        <td className="border border-slate-355 px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${b.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="border border-slate-350 px-3 py-2 text-right uppercase">Total Seluruh Transaksi:</td>
                    <td className="border border-slate-350 px-3 py-2 text-right">
                      {formatRupiah(bookings.reduce((sum, b) => sum + b.totalFee, 0))}
                    </td>
                    <td className="border border-slate-350 px-3 py-2 text-right">
                      {formatRupiah(bookings.reduce((sum, b) => sum + b.dpAmount, 0))}
                    </td>
                    <td className="border border-slate-350 px-3 py-2 text-right">
                      {formatRupiah(bookings.reduce((sum, b) => sum + Math.max(b.totalFee - b.dpAmount, 0), 0))}
                    </td>
                    <td className="border border-slate-350 px-3 py-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Tanda Tangan Section */}
          <div className="mt-12 grid grid-cols-2 text-center text-[11px] font-medium leading-relaxed">
            <div>
              <p className="mb-16">Mengetahui,<br /><b>Ketua {settings?.bumdes_name || "BUMDES"}</b></p>
              <p className="underline font-bold">{settings?.village_name ? `Desa ${settings.village_name}` : ""}</p>
            </div>
            <div>
              <p className="mb-16">{settings?.village_name || "Desa"}, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br /><b>Operator Unit Sewa</b></p>
              <p className="underline font-bold">{settings?.bumdes_name || "BUMDES"}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
