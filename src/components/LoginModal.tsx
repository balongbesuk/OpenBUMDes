"use client"

import React, { useState } from "react"
import { ShieldCheck, User, Lock, ArrowRight, Sparkles, Building2, AlertCircle } from "lucide-react"

interface LoginModalProps {
  onSuccess: (user: { id: string; username: string; name: string; role: string }) => void
}

export default function LoginModal({ onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (u = username, p = password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p })
      })
      const data = await res.json()
      if (data.success && data.user) {
        onSuccess(data.user)
      } else {
        setError(data.error || "Gagal masuk ke sistem.")
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

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-indigo-200 mb-3">
            P
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Kepmendesa PDTT No. 136/2022
          </div>
          <h2 className="text-xl font-bold text-slate-900">Masuk Aplikasi BUMDes</h2>
          <p className="text-xs text-slate-500 mt-1">
            Silakan masuk dengan akun Administrator atau Operator BUMDes.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke Sistem"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-2.5">
            Akses Cepat (Akun Bawaan)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuick("admin", "admin123")}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                  Admin
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                  Akses Penuh
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">admin / admin123</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuick("operator", "operator123")}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                  Operator
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                  Kasir / BKU
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">operator / operator123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
