"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Camera,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  UploadCloud,
  Layers,
  Calendar,
  User,
  DollarSign,
  Briefcase,
  Lock,
  LogIn,
  LogOut,
  ChevronRight
} from "lucide-react"

// Helper kompresi gambar di browser agar cepat diunggah via 4G/HP
function compressImage(file: File, maxWidth = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxWidth) / height)
            height = maxWidth
          }
        }
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", quality))
      }
      img.onerror = () => reject(new Error("Gagal membaca gambar"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Gagal membuka file"))
    reader.readAsDataURL(file)
  })
}

export default function MobileScanPage() {
  // Auth state
  const [authChecking, setAuthChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Tab mode: 'camera' atau 'text'
  const [inputMode, setInputMode] = useState<"camera" | "text">("camera")

  // Camera mode state
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extraPrompt, setExtraPrompt] = useState("")
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Text mode state
  const [textPrompt, setTextPrompt] = useState("")

  // AI & Form state
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [saving, setSaving] = useState(false)

  // Editable parsed result
  const [parsedData, setParsedData] = useState<{
    proofType: "BKK" | "BKM"
    date: string
    payeeOrPayer: string
    description: string
    amount: string
    contraAccount: string
    unitName: string
  } | null>(null)

  // Chart of Accounts for dropdown
  const [accounts, setAccounts] = useState<any[]>([])
  const [recentEntries, setRecentEntries] = useState<any[]>([])

  // Check login on load
  const checkAuth = async () => {
    try {
      setAuthChecking(true)
      const res = await fetch("/api/auth/me")
      const json = await res.json()
      if (json.authenticated) {
        setIsAuthenticated(true)
        setCurrentUser(json.user)
        loadAccounts()
        loadRecentEntries()
      } else {
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    } finally {
      setAuthChecking(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/keuangan/coa")
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        // Ambil akun beban (5.), pendapatan (4.), atau aset (1.3)
        const relevant = json.data.filter((a: any) =>
          a.code.startsWith("5.") || a.code.startsWith("4.") || a.code.startsWith("1.3.") || a.code.startsWith("2.")
        )
        setAccounts(relevant)
      }
    } catch {}
  }

  const loadRecentEntries = async () => {
    try {
      const now = new Date()
      const res = await fetch(`/api/cash-book?month=${now.getMonth() + 1}&year=${now.getFullYear()}&limit=5`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setRecentEntries(json.data.slice(0, 5))
      }
    } catch {}
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      })
      const json = await res.json()
      if (json.success) {
        setIsAuthenticated(true)
        setCurrentUser(json.user)
        loadAccounts()
        loadRecentEntries()
      } else {
        setLoginError(json.error || "Username atau password salah")
      }
    } catch (err: any) {
      setLoginError("Koneksi gagal: " + err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setIsAuthenticated(false)
    setCurrentUser(null)
  }

  // Handle Image File selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMessage("")
    setSuccessMessage("")
    try {
      const compressed = await compressImage(file)
      setImagePreview(compressed)
      setParsedData(null)
    } catch (err: any) {
      setErrorMessage("Gagal memproses gambar: " + err.message)
    }
  }

  // Submit to Gemini AI for Parsing
  const handleAnalyzeAI = async () => {
    setErrorMessage("")
    setSuccessMessage("")

    if (inputMode === "camera" && !imagePreview) {
      setErrorMessage("Silakan ambil foto nota atau struk terlebih dahulu.")
      return
    }
    if (inputMode === "text" && !textPrompt.trim()) {
      setErrorMessage("Silakan ketik keterangan transaksi terlebih dahulu.")
      return
    }

    setAnalyzing(true)
    try {
      const payload: any = {}
      if (inputMode === "camera" && imagePreview) {
        payload.imageBase64 = imagePreview
        payload.mimeType = "image/jpeg"
        if (extraPrompt.trim()) payload.prompt = extraPrompt.trim()
      } else {
        payload.prompt = textPrompt.trim()
      }

      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error || "AI tidak dapat menganalisis transaksi")
      }

      const d = json.data
      // Cari akun lawan dari baris jurnal yang bukan kas tunai (1.1.01)
      let contra = d.targetAccount || ""
      if (!contra && Array.isArray(d.lines)) {
        const contraLine = d.lines.find((l: any) => !l.accountCode.startsWith("1.1.01"))
        if (contraLine) contra = contraLine.accountCode
      }
      if (!contra) {
        contra = d.proofType === "BKM" ? "4.1.04.01" : "5.1.02.99"
      }

      const todayStr = new Date().toISOString().split("T")[0]

      setParsedData({
        proofType: d.proofType === "BKM" ? "BKM" : "BKK",
        date: d.date || todayStr,
        payeeOrPayer: d.payeeOrPayer || "Pihak Terkait",
        description: d.description || (inputMode === "text" ? textPrompt : "Transaksi via Mobile Scanner"),
        amount: String(d.totalAmount || "0"),
        contraAccount: contra,
        unitName: d.unitName || "Umum"
      })
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memproses dengan AI")
    } finally {
      setAnalyzing(false)
    }
  }

  // Save to Cash Book (Buku Kas Umum)
  const handleSaveToCashBook = async () => {
    if (!parsedData) return
    const amt = parseFloat(parsedData.amount)
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage("Nominal transaksi harus lebih dari 0.")
      return
    }

    setSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const cashCode = "1.1.01.01" // Kas Tunai
      const isOut = parsedData.proofType === "BKK"

      // Double-entry lines
      const lines = isOut
        ? [
            { accountCode: parsedData.contraAccount, type: "DEBIT", amount: amt },
            { accountCode: cashCode, type: "CREDIT", amount: amt }
          ]
        : [
            { accountCode: cashCode, type: "DEBIT", amount: amt },
            { accountCode: parsedData.contraAccount, type: "CREDIT", amount: amt }
          ]

      const res = await fetch("/api/cash-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: parsedData.date,
          proofType: parsedData.proofType,
          description: parsedData.description,
          payeeOrPayer: parsedData.payeeOrPayer,
          unitName: parsedData.unitName,
          note: `Dicatat via Mobile Scanner AI (${inputMode === "camera" ? "Kamera Nota" : "Catatan Teks"})`,
          lines
        })
      })

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || "Gagal menyimpan ke Buku Kas")
      }

      const proof = json.data?.proofNumber || parsedData.proofType
      setSuccessMessage(`Berhasil dicatat ke Jurnal & Buku Kas! No. Bukti: ${proof}`)
      setParsedData(null)
      setImagePreview(null)
      setTextPrompt("")
      setExtraPrompt("")
      loadRecentEntries()
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan transaksi")
    } finally {
      setSaving(false)
    }
  }

  // Quick prompt chips
  const quickChips = [
    { label: "Beli Bensin Dinas", text: "Beli bensin motor dinas operasional 35.000 di warung" },
    { label: "Belanja ATK", text: "Beli kertas HVS dan pulpen kantor 65.000 di toko ATK" },
    { label: "Konsumsi Rapat", text: "Konsumsi rapat pengurus BUMDes 120.000" },
    { label: "Sewa Gedung GSG", text: "Penerimaan sewa gedung serbaguna (GSG) 500.000 dari warga" },
    { label: "Bagi Hasil Sampah", text: "Penerimaan retribusi iuran pengelolaan sampah 250.000" }
  ]

  // Render Loading Check Auth
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-300">Memeriksa sesi login...</p>
      </div>
    )
  }

  // Render Mobile Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 max-w-md mx-auto">
        <div className="pt-8 text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white">
            Mobile AI Scanner
          </h1>
          <p className="text-xs text-slate-400">
            Pencatatan Cepat Kas & Nota BUMDes via HP
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-2xl my-6">
          <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm">
            <Lock className="w-4 h-4" /> Masuk Aplikasi
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username Operator
              </label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Contoh: admin atau operator"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk ke Scanner
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500 pb-4">
          <Link href="/" className="hover:text-emerald-400 underline">
            Kembali ke Dashboard Utama Komputer
          </Link>
        </div>
      </div>
    )
  }

  // Render Main Mobile Scanner
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-md mx-auto pb-12">
      {/* Header Mobile Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Mobile AI Scanner</h1>
            <p className="text-[10px] text-slate-400 leading-none mt-0.5">
              Operator: <span className="text-emerald-400 font-semibold">{currentUser?.name || currentUser?.username}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs font-semibold flex items-center"
            title="Ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 text-xs"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4 flex-1">
        {/* Banner Pesan Sukses */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Banner Pesan Error */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Tab Switcher: Kamera vs Teks */}
        <div className="grid grid-cols-2 p-1 bg-slate-800 rounded-2xl border border-slate-700">
          <button
            onClick={() => {
              setInputMode("camera")
              setErrorMessage("")
            }}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              inputMode === "camera"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4" />
            Foto Nota / Struk
          </button>
          <button
            onClick={() => {
              setInputMode("text")
              setErrorMessage("")
            }}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              inputMode === "text"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            Catatan Tanpa Nota
          </button>
        </div>

        {/* ===================== MODE 1: SCAN KAMERA ===================== */}
        {inputMode === "camera" && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 space-y-3.5 shadow-xl">
            {/* Hidden native camera & gallery inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!imagePreview ? (
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center space-y-3 bg-slate-900/40">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                  <Camera className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ambil Foto Nota Belanja</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kamera HP akan memindai nota & diekstrak oleh Gemini AI
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    Buka Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Pilih Galeri
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black max-h-64 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Pratinjau Nota"
                    className="w-full object-contain max-h-64"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setParsedData(null)
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700"
                  >
                    Ganti Foto
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={extraPrompt}
                    onChange={(e) => setExtraPrompt(e.target.value)}
                    placeholder="Tambahan info (misal: Unit Persewaan GSG)..."
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={analyzing}
                  onClick={handleAnalyzeAI}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gemini AI Sedang Membaca Nota...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Ekstrak Nota dengan AI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===================== MODE 2: INPUT TEKS TANPA NOTA ===================== */}
        {inputMode === "text" && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Catat Transaksi Tanpa Bukti Fisik
              </h3>
            </div>

            <textarea
              rows={3}
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Ketik kegiatan di sini, misal:&#10;Beli bensin motor dinas 35.000 di pom bensin"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />

            <div>
              <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider">
                Pilih Cepat Contoh Kegiatan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTextPrompt(chip.text)}
                    className="text-[10px] px-2.5 py-1 bg-slate-900/90 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-all"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={analyzing || !textPrompt.trim()}
              onClick={handleAnalyzeAI}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyusun Jurnal Otomatis...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analisis & Susun Jurnal Otomatis
                </>
              )}
            </button>
          </div>
        )}

        {/* ===================== HASIL ANALISIS AI (FORM VERIFIKASI) ===================== */}
        {parsedData && (
          <div className="bg-slate-800 border-2 border-emerald-500/60 rounded-3xl p-4 space-y-3.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Hasil Bacaan AI (Verifikasi)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                Siap Simpan
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Jenis Bukti */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setParsedData({ ...parsedData, proofType: "BKK" })}
                  className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    parsedData.proofType === "BKK"
                      ? "bg-rose-600/30 border-rose-500 text-rose-300 font-extrabold"
                      : "bg-slate-900/70 border-slate-700 text-slate-400"
                  }`}
                >
                  BKK (Kas Keluar)
                </button>
                <button
                  type="button"
                  onClick={() => setParsedData({ ...parsedData, proofType: "BKM" })}
                  className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    parsedData.proofType === "BKM"
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 font-extrabold"
                      : "bg-slate-900/70 border-slate-700 text-slate-400"
                  }`}
                >
                  BKM (Kas Masuk)
                </button>
              </div>

              {/* Tanggal & Nominal */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    value={parsedData.date}
                    onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    value={parsedData.amount}
                    onChange={(e) => setParsedData({ ...parsedData, amount: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pihak Terkait (Penyetor / Toko) */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Pihak / Toko / Pembayar
                </label>
                <input
                  type="text"
                  value={parsedData.payeeOrPayer}
                  onChange={(e) => setParsedData({ ...parsedData, payeeOrPayer: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  value={parsedData.description}
                  onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Akun Rekening (CoA) */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Akun Pembukuan (CoA Kepmendes 136)
                </label>
                <select
                  value={parsedData.contraAccount}
                  onChange={(e) => setParsedData({ ...parsedData, contraAccount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  {accounts.map((acc) => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit Usaha */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Unit Usaha Penanggung Jawab
                </label>
                <select
                  value={parsedData.unitName}
                  onChange={(e) => setParsedData({ ...parsedData, unitName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Umum">Kantor Umum / Sekretariat</option>
                  <option value="Unit Simpan Pinjam">Unit Simpan Pinjam (USP)</option>
                  <option value="Unit Persewaan">Unit Persewaan / Gedung GSG</option>
                  <option value="Unit Pengelolaan Sampah">Unit Pengelolaan Sampah</option>
                  <option value="Kemitraan Gapoktan">Kemitraan Pertanian (GAPOKTAN)</option>
                </select>
              </div>
            </div>

            {/* Tombol Simpan Final */}
            <div className="pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveToCashBook}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-emerald-900/60 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan ke Buku Kas Umum...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Simpan ke Buku Kas & Jurnal
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ===================== RIWAYAT 5 TRANSAKSI TERAKHIR ===================== */}
        {recentEntries.length > 0 && (
          <div className="pt-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Transaksi Kas Terakhir Hari Ini
            </h4>
            <div className="space-y-2">
              {recentEntries.map((e: any) => (
                <div
                  key={e.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                          e.proofType === "BKK"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {e.proofType}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{e.proofNumber}</span>
                    </div>
                    <p className="font-semibold text-slate-200 line-clamp-1">{e.description}</p>
                    <p className="text-[10px] text-slate-500">{e.payeeOrPayer}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white text-xs">
                      Rp {Number(e.lines?.[0]?.amount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
