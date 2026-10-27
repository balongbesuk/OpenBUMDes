"use client"

import React, { useState, useMemo } from "react"
import { Sparkles, X, Zap, CheckCircle2, AlertCircle, RefreshCw, Plus } from "lucide-react"
import { showAppAlert } from "@/components/ui/AppDialog"

interface AddCoaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  coaList: Array<{ code: string; name: string; type: string; normal?: string }>
  standardGroups: Array<{ prefix: string; name: string; type: string; normal: string }>
}

export default function AddCoaModal({
  isOpen,
  onClose,
  onSuccess,
  coaList,
  standardGroups
}: AddCoaModalProps) {
  // Local state - isolated so typing NEVER re-renders parent page/table!
  const [query, setQuery] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<{
    recommendedCode: string
    reason: string
  } | null>(null)

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "REVENUE",
    normal: "Credit"
  })
  const [saving, setSaving] = useState(false)

  // In-memory instant lookup map (0ms latency, zero network lag)
  const coaMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string; type: string }>()
    for (const a of coaList) {
      if (a.code) map.set(a.code.trim(), a)
    }
    return map
  }, [coaList])

  if (!isOpen) return null

  // Validasi format angka & titik standar Kepmendes 136 (contoh: 1.1.01.07 atau 4.1.04.05)
  const trimmedCode = form.code.trim()
  const duplicateAccount = trimmedCode ? coaMap.get(trimmedCode) : null
  const isDuplicate = !!duplicateAccount

  // Cek apakah ada huruf atau karakter terlarang
  const hasLetters = /[a-zA-Z]/.test(trimmedCode)
  // Format standar Kepmendes: diawali 1-7, dipisahkan titik, minimal 3 segmen (misal 1.1.01 atau 1.1.01.07)
  const isValidFormat = /^[1-7](\.[0-9]{1,2}){2,4}$/.test(trimmedCode)

  // Fast in-memory calculation of next available suffix for a parent group
  const handleSelectGroup = (prefix: string) => {
    if (!prefix) return
    const usedSuffixes = new Set<number>()
    for (const a of coaList) {
      if (a.code.startsWith(prefix)) {
        const parts = a.code.split(".")
        const num = parseInt(parts[parts.length - 1], 10)
        if (!isNaN(num) && num < 90) usedSuffixes.add(num)
      }
    }

    let nextNum = 1
    while (usedSuffixes.has(nextNum)) nextNum++
    const nextCode = `${prefix}.${String(nextNum).padStart(2, "0")}`

    const grp = standardGroups.find((g) => g.prefix === prefix)
    setForm((prev) => ({
      ...prev,
      code: nextCode,
      type: grp?.type || prev.type,
      normal: grp?.normal || prev.normal
    }))
    setRecommendation({
      recommendedCode: nextCode,
      reason: `Nomor urut berikutnya yang tersedia di kelompok ${grp?.name || prefix} adalah ${nextCode}.`
    })
  }

  // Handle AI Recommendation Request
  const handleAiRecommend = async () => {
    if (!query.trim()) {
      showAppAlert("Ketik usulan nama akun atau tujuan pembukuan terlebih dahulu.", {
        title: "Perlu Masukan Akun",
        type: "warning"
      })
      return
    }
    setAiLoading(true)
    setRecommendation(null)
    try {
      const res = await fetch("/api/coa/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      })
      const text = await res.text()
      let json: any
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error("Server mengembalikan respons non-JSON. Pastikan endpoint aktif.")
      }
      if (json.success) {
        const rec = json.data
        setRecommendation({
          recommendedCode: rec.recommendedCode,
          reason: rec.reason
        })
        setForm({
          code: rec.recommendedCode,
          name: rec.suggestedName,
          type: rec.type,
          normal: rec.normal
        })
      } else {
        showAppAlert(json.error || "Gagal mendapatkan rekomendasi.", { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Error: " + e.message, { type: "error" })
    } finally {
      setAiLoading(false)
    }
  }

  // Handle Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hasLetters || !isValidFormat) {
      showAppAlert("Kode akun wajib berupa angka dan titik sesuai format Kepmendes 136 (contoh: 1.1.01.07). Tidak boleh menggunakan huruf.", {
        title: "Format Kode Tidak Sesuai",
        type: "warning"
      })
      return
    }

    if (isDuplicate) {
      showAppAlert(`Kode akun ${form.code} sudah digunakan oleh "${duplicateAccount?.name}".`, {
        title: "Kode Akun Duplikat",
        type: "warning"
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/keuangan/coa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const text = await res.text()
      let json: any
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error("Server mengembalikan respons non-JSON saat menyimpan akun.")
      }
      if (json.success) {
        setForm({ code: "", name: "", type: "REVENUE", normal: "Credit" })
        setQuery("")
        setRecommendation(null)
        onSuccess()
        onClose()
      } else {
        showAppAlert("Gagal menyimpan akun: " + json.error, { type: "error" })
      }
    } catch (e: any) {
      showAppAlert("Error: " + e.message, { type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#6777ef] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tambah Akun Baru (COA Dinamis)</h3>
              <p className="text-[11px] text-slate-400">Rekomendasi AI & Validasi Angka Kepmendes 136</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Assistant Section */}
        <div className="mt-4 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-slate-50 p-3.5 rounded-xl border border-indigo-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6777ef]" /> Asisten Rekomendasi Akun Pintar
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded">
              Kepmendes 136
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Ketik usulan akun (misal: <em>Rekening Bank Jombang</em> atau <em>Sewa Lapak PKL</em>), AI akan mencarikan kelompok & nomor kosong:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAiRecommend())}
              placeholder="Contoh: Rekening Bank Jombang..."
              className="flex-1 bg-white text-slate-800 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#6777ef] transition-colors"
            />
            <button
              type="button"
              onClick={handleAiRecommend}
              disabled={aiLoading}
              className="bg-[#6777ef] hover:bg-[#5868e4] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50 transition-all"
            >
              {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Rekomendasikan</span>
            </button>
          </div>

          {recommendation && (
            <div className="mt-2.5 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-emerald-800 mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Rekomendasi Kode:{" "}
                  <span className="font-mono text-emerald-950 font-black">{recommendation.recommendedCode}</span>
                </span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                  Tersedia
                </span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">{recommendation.reason}</p>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Quick Select Parent Group */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Atau Pilih Cepat Kelompok Induk:</span>
              <span className="text-[10px] text-slate-400 font-normal">Cari nomor kosong</span>
            </label>
            <select
              onChange={(e) => handleSelectGroup(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-[#6777ef] transition-colors"
            >
              <option value="">-- Pilih Kelompok Induk Akun --</option>
              {standardGroups.map((g) => (
                <option key={g.prefix} value={g.prefix}>
                  [{g.prefix}] {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Code Input with Number-only Filter & Format Validation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Kode Akun (Hanya Angka & Titik)</label>
              {trimmedCode && (
                hasLetters ? (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" /> Dilarang Huruf!
                  </span>
                ) : isDuplicate ? (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" /> Sudah Terpakai!
                  </span>
                ) : !isValidFormat ? (
                  <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5" /> Format: X.X.XX.XX
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kode Tersedia
                  </span>
                )
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Contoh: 1.1.01.07 atau 4.1.04.06"
              value={form.code}
              onChange={(e) => {
                // Filter otomatis: Hanya mengizinkan angka dan tanda titik
                const filtered = e.target.value.replace(/[^0-9.]/g, "").replace(/\.{2,}/g, ".")
                setForm((prev) => ({ ...prev, code: filtered }))
              }}
              className={`w-full p-2.5 rounded-xl border font-mono font-bold focus:outline-none transition-colors ${
                hasLetters || isDuplicate
                  ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500"
                  : trimmedCode && !isValidFormat
                  ? "border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500"
                  : "border-slate-200 text-slate-900 focus:border-[#6777ef]"
              }`}
            />

            {/* Peringatan jika pengguna mencoba mengetik huruf */}
            {hasLetters && (
              <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Kode akun tidak boleh berisi huruf.</strong> Standar akuntansi Kepmendes 136 hanya menggunakan angka dan pemisah titik, contoh: <span className="font-mono font-bold">1.1.01.07</span>.
                </div>
              </div>
            )}

            {/* Peringatan Duplikasi */}
            {isDuplicate && !hasLetters && (
              <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Kode {form.code} tidak dapat digunakan.</strong> Kode ini sudah terdaftar sebagai akun{" "}
                  <span className="font-bold underline">"{duplicateAccount?.name}"</span>.
                </div>
              </div>
            )}

            {/* Hint format jika belum lengkap */}
            {trimmedCode && !hasLetters && !isDuplicate && !isValidFormat && (
              <p className="mt-1 text-[11px] text-amber-600">
                Format kode akun harus lengkap dengan nomor kelompok dan sub-akun, contoh: <strong>1.1.01.07</strong> (Kas di Bank) atau <strong>4.1.04.06</strong> (Pendapatan Sewa).
              </p>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Akun</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kas di Bank Jombang atau Sewa Lapak PKL"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef] transition-colors"
            />
          </div>

          {/* Type & Normal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Akuntansi</label>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef]"
              >
                <option value="ASSET">ASSET (Aset Lancar / Tetap)</option>
                <option value="LIABILITY">LIABILITY (Kewajiban / Utang)</option>
                <option value="EQUITY">EQUITY (Modal & Cadangan)</option>
                <option value="REVENUE">REVENUE (Pendapatan Usaha)</option>
                <option value="EXPENSE">EXPENSE (Beban Operasional)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Saldo Normal</label>
              <select
                value={form.normal}
                onChange={(e) => setForm((prev) => ({ ...prev, normal: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef]"
              >
                <option value="Debit">Debit (Aset & Beban)</option>
                <option value="Credit">Credit (Pendapatan & Modal)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isDuplicate || hasLetters || !isValidFormat || !form.name.trim() || saving}
              className="px-5 py-2 rounded-xl bg-[#6777ef] text-white font-bold hover:bg-[#5868e4] shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Simpan Akun Baru</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
