"use client"

import React, { useState, useEffect } from "react"
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Sparkles,
  Building2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  FileText,
  BarChart3,
  Landmark,
  BadgeCheck,
  HelpCircle,
  RefreshCw
} from "lucide-react"

interface LoginModalProps {
  onSuccess: (user: { id: string; username: string; name: string; role: string }) => void
  settings?: any
}

export default function LoginModal({ onSuccess, settings: initialSettings }: LoginModalProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(initialSettings || null)

  // Fetch settings if not passed as prop
  useEffect(() => {
    if (!settings) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) setSettings(d.data)
        })
        .catch(() => {})
    }
  }, [settings])

  const handleLogin = async (u = username, p = password) => {
    if (!u.trim() || !p.trim()) {
      setError("Silakan masukkan username dan password terlebih dahulu.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u.trim(), password: p.trim() })
      })
      const data = await res.json()
      if (data.success && data.user) {
        onSuccess(data.user)
      } else {
        setError(data.error || "Username atau kata sandi tidak valid.")
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan jaringan.")
    } finally {
      setLoading(false)
    }
  }

  const fillQuick = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    handleLogin(u, p)
  }

  const bumdesName = settings?.bumdes_name || 'BUMDesa "BAROKAH"'
  const villageName = settings?.village_name || "Balongbesuk"
  const subdistrictName = settings?.subdistrict_name || "Diwek"
  const regencyName = settings?.regency_name || "Jombang"
  const logoUrl = settings?.bumdes_logo

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex min-h-screen">
      {/* 2-SCREEN / SPLIT-SCREEN CONTAINER */}
      <div className="w-full min-h-screen flex flex-col lg:flex-row">
        
        {/* ========================================================================= */}
        {/* LAYAR KIRI (LEFT PANEL): BRANDING, PRESTISE & FITUR UNGGULAN BUMDES */}
        {/* ========================================================================= */}
        <div className="relative w-full lg:w-[52%] xl:w-[55%] bg-gradient-to-br from-slate-950 via-[#0b1120] to-[#1e1b4b] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {/* Subtle Ambient Decorative Glowing Accents */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

          {/* Top Header of Left Panel */}
          <div className="relative z-10 space-y-4">
            {/* Regulatory Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Standar Kepmendesa PDTT No. 136/2022</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Logo & BUMDes Identity */}
            <div className="flex items-center gap-4 pt-2">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/10 p-2.5 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl shadow-indigo-950/50 shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={bumdesName}
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-2xl text-white">
                    P
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{bumdesName}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Pemerintah Desa {villageName}, Kec. {subdistrictName}, Kab. {regencyName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    Sistem EMKM Terpadu
                  </span>
                  <span className="text-[11px] text-slate-400">
                    OpenBUMDes Enterprise
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Content: Headline & 3 Key Value Cards */}
          <div className="relative z-10 my-8 lg:my-auto space-y-6 max-w-xl">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white leading-tight">
                Tata Kelola Keuangan Desa yang{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                  Transparan & Akuntabel
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Platform digital pembukuan kas harian, otomatisasi 5 laporan keuangan resmi, dan pelaporan pertanggungjawaban Musyawarah Desa (Musdes).
              </p>
            </div>

            {/* 3 Pillar Features Cards */}
            <div className="space-y-3 pt-2">
              {/* Feature 1 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all flex items-start gap-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    5 Laporan Keuangan Standar Resmi Kemendesa
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Neraca SAK EMKM, Laba Rugi Komprehensif, Perubahan Ekuitas, Arus Kas Langsung (LAK), dan CaLK otomatis siap cetak.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all flex items-start gap-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    Laporan Pertanggungjawaban (LPJ Musdes) 8 Halaman A4
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Cetak dokumen LPJ format A4 presisi lengkap dengan kop surat resmi dan lembar pengesahan terpusat 4 pilar pengesahan.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all flex items-start gap-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    Asisten AI & Diagnosa Kesehatan BUMDes (EIS)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Rekomendasi kodefikasi COA otomatis dan indikator kesehatan keuangan (Likuiditas, Solvabilitas, Rentabilitas) real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quote & Trust Indicator */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Kepatuhan Standar Akuntansi EMKM & Kepmendesa 136</span>
            </div>
            <div className="font-mono text-slate-500">
              Versi 1.1.0 • Edisi Desa 2026
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAYAR KANAN (RIGHT PANEL): FORMULIR LOGIN BERSIH & MODERN */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[48%] xl:w-[45%] bg-white flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 min-h-[550px] relative">
          
          <div className="max-w-md w-full space-y-6">
            
            {/* Top Header of Right Panel */}
            <div className="space-y-1.5 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Portal Autentikasi Pengguna</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Selamat Datang Kembali
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Silakan masukkan kredensial akun Anda untuk mengakses sistem pembukuan & laporan keuangan BUMDes.
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {/* Main Login Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLogin()
              }}
              className="space-y-4"
            >
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username (contoh: admin)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6777ef] focus:ring-3 focus:ring-[#6777ef]/15 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6777ef] focus:ring-3 focus:ring-[#6777ef]/15 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#6777ef] focus:ring-[#6777ef]"
                  />
                  <span className="font-medium">Ingat sesi masuk saya</span>
                </label>
                <span className="text-slate-400 hover:text-slate-600 cursor-help flex items-center gap-1 font-medium" title="Hubungi Administrator BUMDes atau Kepala Desa untuk reset sandi.">
                  <HelpCircle className="w-3.5 h-3.5" /> Bantuan
                </span>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6777ef] to-indigo-600 hover:from-[#5868e4] hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard Sistem</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins Section */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  PILIHAN AKSES CEPAT (AKUN RESMI)
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                  1-Klik Masuk
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Admin Card */}
                <button
                  type="button"
                  onClick={() => fillQuick("admin", "admin123")}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/60 hover:border-indigo-200 border border-slate-200 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                      Administrator
                    </span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                      Akses Penuh
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    Direktur / Kepala BUMDes
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                    <span>admin / admin123</span>
                    <ArrowRight className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                {/* Operator Card */}
                <button
                  type="button"
                  onClick={() => fillQuick("operator", "operator123")}
                  className="p-3 rounded-2xl bg-slate-50/80 hover:bg-sky-50/60 hover:border-sky-200 border border-slate-200 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-sky-700">
                      Operator Kasir
                    </span>
                    <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">
                      Kasir / BKU
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    Bendahara / Staf Pembukuan
                  </p>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                    <span>operator / operator123</span>
                    <ArrowRight className="w-3 h-3 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="pt-2 text-center text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-medium text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Koneksi Aman Terenkripsi SSL & Sesi Dilindungi</span>
              </div>
              <p className="text-[10px] text-slate-400">
                © 2026 OpenBUMDes • Kementerian Desa PDTT No. 136/2022
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
