"use client"

import React, { useState, useEffect } from "react"
import { Edit3, X, CheckCircle2, AlertCircle, RefreshCw, Save } from "lucide-react"

interface EditCoaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  account: {
    code: string
    name: string
    type: string
    normal?: string
  } | null
  isStandard?: boolean
}

export default function EditCoaModal({
  isOpen,
  onClose,
  onSuccess,
  account,
  isStandard = false
}: EditCoaModalProps) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "ASSET",
    normal: "Debit"
  })
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (account) {
      setForm({
        code: account.code || "",
        name: account.name || "",
        type: account.type || "ASSET",
        normal:
          account.normal === "Credit"
            ? "Kredit"
            : account.normal || (account.type === "ASSET" || account.type === "EXPENSE" ? "Debit" : "Kredit")
      })
      setErrorMsg("")
    }
  }, [account, isOpen])

  if (!isOpen || !account) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrorMsg("Nama akun tidak boleh kosong.")
      return
    }

    setSaving(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/keuangan/coa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name.trim(),
          type: form.type,
          normal: form.normal
        })
      })

      const json = await res.json()
      if (json.success) {
        onSuccess()
        onClose()
      } else {
        setErrorMsg(json.error || "Gagal memperbarui akun.")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi.")
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
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Sesuaikan Akun COA</h3>
              <p className="text-[11px] text-slate-400">
                {isStandard ? "Kustomisasi Nama Akun Standar Bawaan" : "Edit Akun Tambahan Pengguna"}
              </p>
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

        {/* Info Banner */}
        <div className="mt-4 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900">
          <p className="font-semibold flex items-center gap-1.5 text-amber-950 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Kustomisasi Fleksibel Akun BUMDes
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Anda dapat menyesuaikan nama akun (contoh: mengganti nama bank lokal atau nama unit usaha). Perubahan nama akun akan otomatis diterapkan ke seluruh jurnal, buku besar, dan template formulir transaksi.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Account Code (Read Only) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Kode Akun</label>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                Kode Permanen (Acuan Standar)
              </span>
            </div>
            <input
              type="text"
              readOnly
              disabled
              value={form.code}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100/80 font-mono font-bold text-slate-700 cursor-not-allowed"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Akun <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Masukkan nama akun baru..."
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef] text-slate-900 font-medium transition-colors"
            />
          </div>

          {/* Type & Normal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kelompok Akun</label>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef] text-slate-800 bg-white"
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
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#6777ef] text-slate-800 bg-white"
              >
                <option value="Debit">Debit (Aset & Beban)</option>
                <option value="Kredit">Kredit (Pendapatan & Modal)</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
              disabled={!form.name.trim() || saving}
              className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
