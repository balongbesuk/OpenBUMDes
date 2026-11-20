"use client"

import React, { useRef } from "react"
import {
  Sparkles,
  Building2,
  Upload,
  CheckCircle2,
  Trash2,
  Users,
  ShieldCheck,
  Wallet
} from "lucide-react"
import { showAppAlert, showAppToast } from "@/components/ui/AppDialog"

interface SettingsTabProps {
  settings: Record<string, string>
  aiStatus: any
  currentUser: any
  isAiConfigured: boolean
  logoPreview: string
  setLogoPreview: (val: string) => void
  onSaveSuccess: () => void
}

export default function SettingsTab({
  settings,
  aiStatus,
  currentUser,
  isAiConfigured,
  logoPreview,
  setLogoPreview,
  onSaveSuccess
}: SettingsTabProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <p className="text-sm font-semibold text-slate-700">Hanya Administrator yang memiliki akses ke Pengaturan.</p>
      </div>
    )
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      showAppAlert("Mohon pilih file gambar yang valid (PNG, JPG, WEBP, atau SVG).", {
        title: "Format Berkas Tidak Sesuai",
        type: "warning"
      })
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      showAppAlert("Ukuran file gambar maksimal 3MB.", {
        title: "Ukuran Berkas Terlalu Besar",
        type: "warning"
      })
      return
    }

    if (file.type === "image/svg+xml") {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const MAX_SIZE = 360
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL("image/webp", 0.85)
          setLogoPreview(compressed)
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const updates = Object.fromEntries(formData.entries())
    updates.bumdes_logo = logoPreview
    if (updates.leader_name) {
      updates.village_head = updates.leader_name
    }
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })
      const json = await res.json()
      if (json.success) {
        showAppToast("Pengaturan BUMDes berhasil disimpan!", "success")
        onSaveSuccess()
      } else {
        showAppAlert("Gagal menyimpan: " + (json.error || "Terjadi kesalahan."), { type: "error" })
      }
    } catch (err: any) {
      showAppAlert("Error: " + err.message, { type: "error" })
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 shadow-xs space-y-8">
      <div>
        <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#6777ef]" />
          {isAiConfigured ? "Pengaturan BUMDes & Gemini AI" : "Pengaturan Profil & Sistem BUMDes"}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Konfigurasi logo resmi, identitas lembaga, pejabat penandatangan dokumen (Kepmendes 136/2022), serta integrasi Gemini AI opsional.
        </p>
      </div>

      {/* KARTU STATUS KUNCI & KUOTA KREDIT GEMINI AI (Hanya jika API key diisi) */}
      {isAiConfigured && aiStatus && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white text-slate-800 shadow-sm border border-indigo-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-indigo-100/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-[#6777ef] flex items-center justify-center shrink-0 shadow-2xs border border-indigo-200/50">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 flex-wrap">
                  <span>Status & Kuota Kredit Gemini AI</span>
                  {aiStatus.keyValid ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Kunci Aktif
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                      ⚠ Kunci Tidak Valid / Belum Dikonfigurasi
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {aiStatus.quotaInfo?.tierName || "Google AI Studio Free Tier"} &bull; Kuota di-reset otomatis setiap hari oleh Google.
                </p>
              </div>
            </div>

            <a
              href={aiStatus.quotaInfo?.quotaDashboardUrl || "https://aistudio.google.com/app/plan_information"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-2xs transition-all hover:shadow-xs self-start sm:self-auto shrink-0"
            >
              <span>Cek Kuota di Google Studio ↗</span>
            </a>
          </div>

          {/* 3 Metrik Kuota */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5 pt-1">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Model AI Terpilih
              </span>
              <div className="text-sm font-mono font-bold text-indigo-600 mt-0.5 truncate">
                {settings.gemini_model || "gemini-3.5-flash"}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {settings.gemini_model === "gemini-3.8-flash"
                  ? "Advanced Thinking"
                  : settings.gemini_model === "gemini-3.5-flash-lite"
                  ? "Super Ringan & Hemat Kuota"
                  : "Paling Stabil & Cepat (~1 dtk)"}
              </span>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Sisa Kuota Hari Ini
              </span>
              <div className="text-sm font-bold text-emerald-600 mt-0.5">
                {aiStatus.quotaInfo?.remainingRequestsToday ?? 1500} Request
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                dari batas {aiStatus.quotaInfo?.freeDailyQuota ?? 1500} req/hari (Gratis)
              </span>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Batas Kecepatan (Rate Limit)
              </span>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {aiStatus.quotaInfo?.rateLimitRpm || "15 RPM (Request Per Menit)"}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Biaya: {aiStatus.quotaInfo?.costPerRequest || "Rp 0 (100% Gratis)"}
              </span>
            </div>
          </div>

          {/* Progress Bar Kuota Harian */}
          <div className="mt-3.5 pt-3.5 border-t border-indigo-100/80">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-slate-500 font-medium">Penggunaan Kuota Hari Ini:</span>
              <span className="font-bold text-slate-800">
                {aiStatus.quotaInfo?.todayUsage ?? 0} / {aiStatus.quotaInfo?.freeDailyQuota ?? 1500} request ({((aiStatus.quotaInfo?.todayUsage ?? 0) / (aiStatus.quotaInfo?.freeDailyQuota ?? 1500) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 border border-slate-200/70 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-[#6777ef] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(1, ((aiStatus.quotaInfo?.todayUsage ?? 0) / (aiStatus.quotaInfo?.freeDailyQuota ?? 1500) * 100)))}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* ================= BAGIAN 1: LOGO & IDENTITAS LEMBAGA ================= */}
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#6777ef]" />
            <span>1. Logo Resmi & Identitas Lembaga BUMDes</span>
          </div>

          {/* UPLOAD LOGO BUMDES */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Logo Resmi BUMDes
            </label>
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />
            {logoPreview ? (
              <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  <img
                    src={logoPreview}
                    alt="Pratinjau Logo BUMDes"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Logo BUMDes Siap Digunakan</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Logo akan otomatis dicetak pada lembar Kwitansi, Kop Laporan Keuangan, dan Sampul LPJ.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#6777ef] font-bold text-[11px] transition-colors"
                    >
                      Ganti Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoPreview("")}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#6777ef] hover:bg-indigo-50/30 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-colors bg-white group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6777ef] group-hover:scale-105 transition-transform flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-800 text-xs">
                  Klik di sini untuk mengunggah Logo BUMDes
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format didukung: PNG, JPG, WEBP, atau SVG (Maks. 3MB, otomatis dioptimasi)
                </p>
              </div>
            )}
          </div>

          {/* NAMA BUMDES */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Resmi BUMDes
            </label>
            <input
              type="text"
              name="bumdes_name"
              defaultValue={settings.bumdes_name || ""}
              placeholder="Contoh: BUM Desa Sukamaju Mandiri"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef] font-semibold text-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nama entitas hukum BUMDes yang tercantum pada sertifikat Kemenkumham RI.
            </p>
          </div>

          {/* GRID WILAYAH */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Desa</label>
              <input
                type="text"
                name="village_name"
                defaultValue={settings.village_name || ""}
                placeholder="Contoh: Sukamaju"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                name="subdistrict_name"
                defaultValue={settings.subdistrict_name || ""}
                placeholder="Contoh: Sukasari"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                name="regency_name"
                defaultValue={settings.regency_name || ""}
                placeholder="Contoh: Banyumas"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
              />
            </div>
          </div>

          {/* ALAMAT */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Kantor BUMDes</label>
            <input
              type="text"
              name="bumdes_address"
              defaultValue={settings.bumdes_address || ""}
              placeholder="Contoh: Jl. Raya Balongbesuk No. 12, Kec. Diwek, Kab. Jombang"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef]"
            />
          </div>

          {/* DAFTAR UNIT USAHA BUMDES (GLOBAL & DINAMIS UNTUK SELURUH DESA) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Daftar Unit Usaha Aktif BUMDes (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              name="business_units"
              defaultValue={
                settings.business_units ||
                "Unit Simpan Pinjam (USP), Unit Persewaan & Properti, Unit Perdagangan & Toko Desa, Unit Jasa & Pariwisata Desa, Unit Pengelolaan Air Bersih (PAMDes)"
              }
              placeholder="Contoh: Unit Simpan Pinjam (USP), Unit Wisata Bahari, Unit Pengolahan Kopi, Unit PAMDes"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6777ef] text-slate-900 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Daftar unit usaha yang dijalankan BUMDes di desa Anda. AI Gemini & sistem transaksi akan otomatis memetakan transaksi ke unit-unit ini.
            </p>
          </div>
        </div>

        {/* ================= BAGIAN 2: DATA PEJABAT PENANDATANGAN ================= */}
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#6777ef]" />
            <span>2. Data Pejabat Penandatangan Dokumen (Kepmendes 136/2022)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PENASIHAT (KEPALA DESA) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Penasihat (Kepala Desa)</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Kepala Desa
                </label>
                <input
                  type="text"
                  name="leader_name"
                  defaultValue={settings.leader_name || settings.village_head || ""}
                  placeholder="Contoh: Mochamad Saifur"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP / NIK Kepala Desa
                </label>
                <input
                  type="text"
                  name="leader_nip"
                  defaultValue={settings.leader_nip || ""}
                  placeholder="Contoh: 19800812 201001 1 003"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                />
              </div>
            </div>

            {/* KETUA BADAN PENGAWAS */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ketua Badan Pengawas</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Ketua Pengawas
                </label>
                <input
                  type="text"
                  name="supervisor_name"
                  defaultValue={settings.supervisor_name || ""}
                  placeholder="Contoh: Sadji Abdullah"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP / NIK Pengawas
                </label>
                <input
                  type="text"
                  name="supervisor_nip"
                  defaultValue={settings.supervisor_nip || ""}
                  placeholder="Contoh: 3517112233440003"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                />
              </div>
            </div>

            {/* DIREKTUR BUMDES */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                <Building2 className="w-4 h-4 text-[#6777ef]" />
                <span>Pelaksana Operasional (Direktur)</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Direktur BUMDes
                </label>
                <input
                  type="text"
                  name="director_name"
                  defaultValue={settings.director_name || ""}
                  placeholder="Contoh: Nama Direktur BUMDes"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP / NIK Direktur
                </label>
                <input
                  type="text"
                  name="director_nip"
                  defaultValue={settings.director_nip || ""}
                  placeholder="Contoh: 3517123456780001"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                />
              </div>
            </div>

            {/* BENDAHARA / KASIR */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Bendahara / Kasir</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Bendahara
                </label>
                <input
                  type="text"
                  name="treasurer_name"
                  defaultValue={settings.treasurer_name || ""}
                  placeholder="Contoh: Nama Bendahara BUMDes"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP / NIK Bendahara
                </label>
                <input
                  type="text"
                  name="treasurer_nip"
                  defaultValue={settings.treasurer_nip || ""}
                  placeholder="Contoh: 3517098765430002"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#6777ef]"
                />
              </div>
            </div>
          </div>

          {/* PETUGAS PEMBUKUAN (OPERATOR) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Nama Petugas Pembukuan (Operator Input Akuntansi)
            </label>
            <input
              type="text"
              name="operator_name"
              defaultValue={settings.operator_name || ""}
              placeholder="Contoh: Nama Petugas Pembukuan"
              className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#6777ef]"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Pejabat yang menandatangani kolom &ldquo;Pembukuan&rdquo; pada form Bukti Kas Masuk (BKM) dan Bukti Kas Keluar (BKK).
            </p>
          </div>
        </div>

        {/* ================= BAGIAN 3: INTEGRASI GOOGLE GEMINI AI ================= */}
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>3. Integrasi Google Gemini AI (Opsional)</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Google Gemini API Key</label>
            <input
              type="password"
              name="gemini_api_key"
              defaultValue={settings.gemini_api_key || ""}
              placeholder="AIzaSy..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:border-[#6777ef]"
            />
            {!isAiConfigured ? (
              <p className="text-[11px] text-amber-700 mt-1.5 bg-amber-50 border border-amber-200/80 p-2.5 rounded-lg leading-relaxed">
                💡 <strong>Catatan:</strong> Fitur input transaksi otomatis Chat Gemini AI saat ini <strong>disembunyikan</strong>. Dapatkan kunci API secara gratis dari <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#6777ef] underline font-bold">Google AI Studio</a> lalu simpan di atas untuk mengaktifkannya.
              </p>
            ) : (
              <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                ✓ Fitur Gemini AI aktif. Hapus isi kolom di atas dan simpan jika ingin menonaktifkan & menyembunyikan seluruh fitur AI.
              </p>
            )}
          </div>

          {/* PILIHAN MODEL GEMINI AI */}
          {isAiConfigured && (
            <div className="animate-in fade-in">
              <label className="block font-bold text-slate-700 mb-1">
                Pilihan Model Gemini AI
              </label>
              <select
                name="gemini_model"
                defaultValue={settings.gemini_model || "gemini-3.5-flash"}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-[#6777ef]"
              >
                <option value="gemini-3.5-flash">
                  ⚡ Gemini 3.5 Flash (Super Cepat ~1 dtk, Paling Direkomendasikan & Stabil)
                </option>
                <option value="gemini-3.8-flash">
                  🧠 Gemini 3.8 Flash (High Intelligence - Cerdas)
                </option>
                <option value="gemini-flash-latest">
                  🔄 Gemini Flash Latest (Versi Otomatis Terbaru)
                </option>
                <option value="gemini-3.5-flash-lite">
                  🍃 Gemini 3.5 Flash-Lite (Super Ringan & Hemat Kuota)
                </option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Model Gemini 3.5 Flash sangat disarankan karena memiliki respons instan (~1 detik) dan terbukti paling stabil membaca foto nota/struk.
              </p>
            </div>
          )}
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto bg-[#6777ef] hover:bg-[#5868e4] text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-indigo-200 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan Seluruh Pengaturan BUMDes</span>
          </button>
        </div>
      </form>
    </div>
  )
}
