"use client"

import React, { useState, useEffect } from "react"
import {
  Users,
  Download,
  Upload,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Key,
  Database,
  Lock,
  UserCheck
} from "lucide-react"
import { showAppAlert, showAppConfirm } from "@/components/ui/AppDialog"

interface SystemMaintenanceTabProps {
  currentUser: { id: string; username: string; name: string; role: string } | null
  onRefresh: () => void
}

export default function SystemMaintenanceTab({ currentUser, onRefresh }: SystemMaintenanceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "backup" | "restore" | "reset">("users")

  // State Pengguna
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [userForm, setUserForm] = useState({
    id: "",
    username: "",
    name: "",
    password: "",
    role: "OPERATOR"
  })

  // State Backup & Restore
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)

  // State Reset
  const [resetConfirmInput, setResetConfirmInput] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  // Notification message
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const isAdmin = currentUser?.role === "ADMIN"

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/auth/users")
      const data = await res.json()
      if (data.success) {
        setUsers(data.data || [])
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Handle Save User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm)
      })
      const data = await res.json()
      if (data.success) {
        setStatusMsg({ type: "success", text: data.message })
        setShowAddUserModal(false)
        setUserForm({ id: "", username: "", name: "", password: "", role: "OPERATOR" })
        fetchUsers()
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menyimpan pengguna" })
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Terjadi kesalahan" })
    }
  }

  // Handle Delete User
  const handleDeleteUser = async (user: any) => {
    if (user.id === currentUser?.id) {
      showAppAlert("Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.", {
        title: "Akses Ditolak",
        type: "warning"
      })
      return
    }

    const confirmMsg = `Hapus akun ${user.role === "ADMIN" ? "Administrator" : "Operator"} "${user.name}" (@${user.username})?\n\nTindakan ini permanen dan tidak dapat dibatalkan.`
    const confirmed = await showAppConfirm(confirmMsg, {
      title: "Hapus Akun Pengguna",
      type: "danger",
      confirmText: "Ya, Hapus Akun"
    })
    if (!confirmed) return

    setDeletingUserId(user.id)
    setStatusMsg(null)
    try {
      const res = await fetch(`/api/auth/users?id=${encodeURIComponent(user.id)}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        setStatusMsg({ type: "success", text: data.message })
        fetchUsers()
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menghapus pengguna" })
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Terjadi kesalahan koneksi" })
    } finally {
      setDeletingUserId(null)
    }
  }

  // Handle Backup Download
  const handleDownloadBackup = () => {
    setBackupLoading(true)
    try {
      window.location.href = "/api/system/backup"
      setTimeout(() => {
        setBackupLoading(false)
        setStatusMsg({ type: "success", text: "Proses unduh berkas database cadangan dimulai." })
      }, 1000)
    } catch (e: any) {
      setBackupLoading(false)
      setStatusMsg({ type: "error", text: e.message || "Gagal mengunduh cadangan" })
    }
  }

  // Handle Restore
  const handleExecuteRestore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restoreFile) {
      setStatusMsg({ type: "error", text: "Silakan pilih berkas database (.db) terlebih dahulu." })
      return
    }

    const confirmed = await showAppConfirm(
      `Apakah Anda yakin ingin memulihkan database dari "${restoreFile.name}"? Data aktif saat ini akan digantikan seluruhnya.`,
      {
        title: "Konfirmasi Pemulihan Database",
        type: "danger",
        confirmText: "Ya, Pulihkan Database"
      }
    )
    if (!confirmed) return

    setRestoreLoading(true)
    setStatusMsg(null)
    try {
      const formData = new FormData()
      formData.append("file", restoreFile)

      const res = await fetch("/api/system/restore", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setStatusMsg({ type: "success", text: data.message || "Database berhasil dipulihkan! Memuat ulang aplikasi..." })
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal memulihkan database" })
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Terjadi kesalahan saat memulihkan database" })
    } finally {
      setRestoreLoading(false)
    }
  }

  // Handle Reset / Kosongkan Aplikasi
  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (resetConfirmInput.trim().toUpperCase() !== "KOSONGKAN") {
      setStatusMsg({ type: "error", text: 'Harap ketik kata konfirmasi "KOSONGKAN" dengan tepat.' })
      return
    }

    setResetLoading(true)
    setStatusMsg(null)
    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: resetConfirmInput.trim().toUpperCase() })
      })
      const data = await res.json()
      if (data.success) {
        setStatusMsg({ type: "success", text: data.message })
        setResetConfirmInput("")
        onRefresh()
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal mengosongkan aplikasi" })
      }
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e.message || "Terjadi kesalahan sistem saat mengosongkan aplikasi" })
    } finally {
      setResetLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center font-bold">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Akses Terbatas: Khusus Administrator</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Menu Pengguna, Cadangan (Backup), Pemulihan (Restore), dan Pengosongan Aplikasi hanya dapat diakses oleh akun Administrator (Direktur / Kepala BUMDes).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 text-sm font-medium">{statusMsg.text}</div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white rounded-2xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 text-indigo-800 text-xs font-bold border border-indigo-200/60 mb-3 shadow-2xs">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              Keamanan Data & Pemeliharaan Sistem
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">
              Akses Pengguna, Cadangan & Pemulihan Sistem
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Kelola akun login Admin dan Operator kasir, cadangkan berkas database aktif, pulihkan data, atau kosongkan aplikasi untuk tahun buku baru.
            </p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2.5 mt-6 pt-5 border-t border-indigo-100/90">
          <button
            onClick={() => setActiveSubTab("users")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "users"
                ? "bg-white text-indigo-700 shadow-sm border border-indigo-200 font-bold"
                : "bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80"
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            Kelola Pengguna ({users.length})
          </button>
          <button
            onClick={() => setActiveSubTab("backup")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "backup"
                ? "bg-white text-blue-700 shadow-sm border border-blue-200 font-bold"
                : "bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80"
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            Cadangkan Database (Backup)
          </button>
          <button
            onClick={() => setActiveSubTab("restore")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "restore"
                ? "bg-white text-amber-700 shadow-sm border border-amber-200 font-bold"
                : "bg-white/70 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80"
            }`}
          >
            <Upload className="w-4 h-4 text-amber-600" />
            Pulihkan Database (Restore)
          </button>
          <button
            onClick={() => setActiveSubTab("reset")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === "reset"
                ? "bg-rose-600 text-white shadow-sm border border-rose-600 font-bold"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Kosongkan Aplikasi (Reset)
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: KELOLA PENGGUNA (ADMIN & OPERATOR)                  */}
      {/* ============================================================== */}
      {activeSubTab === "users" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Daftar Akun Pengguna BUMDes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin memiliki otoritas penuh terhadap sistem, sedangkan Operator bertugas mencatat transaksi kas dan kwitansi.
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setUserForm({ id: "", username: "", name: "", password: "", role: "OPERATOR" })
                  setShowAddUserModal(true)
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Pengguna
              </button>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama Lengkap</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Peran / Hak Akses</th>
                  <th className="px-4 py-3">Tanggal Dibuat</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                        {u.name?.charAt(0) || "U"}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">{u.username}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "ADMIN"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {u.role === "ADMIN" ? "ADMINISTRATOR" : "OPERATOR KAS"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isAdmin && (
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setUserForm({
                                id: u.id,
                                username: u.username,
                                name: u.name,
                                password: "",
                                role: u.role
                              })
                              setShowAddUserModal(true)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-all"
                            title="Ubah nama, peran, atau kata sandi"
                          >
                            Ubah Password
                          </button>

                          {u.id !== currentUser?.id ? (
                            <button
                              type="button"
                              disabled={deletingUserId === u.id}
                              onClick={() => handleDeleteUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-all disabled:opacity-50 cursor-pointer"
                              title={`Hapus akun pengguna ${u.name}`}
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>{deletingUserId === u.id ? "..." : "Hapus"}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                              (Akun Anda)
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: CADANGKAN DATABASE (BACKUP)                         */}
      {/* ============================================================== */}
      {activeSubTab === "backup" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Unduh Cadangan Database (.db)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Unduh salinan berkas database aktif BUMDes (<code>dev.db</code>). Berkas ini mencakup seluruh transaksi Buku Kas Umum, Bagan Akun COA, bukti fisik, notula, serta arsip tahunan yang telah terkunci. Kami menyarankan untuk mencadangkan database secara berkala sebelum melakukan tutup buku.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div className="text-xs text-slate-600">
              <span className="font-bold block text-slate-800">Berkas Cadangan Format SQLite</span>
              <span>Kompatibel dengan semua sistem pembukuan BUMDes dan dapat dipulihkan sewaktu-waktu.</span>
            </div>
            <button
              type="button"
              disabled={backupLoading}
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              {backupLoading ? "Menyiapkan Berkas..." : "Unduh Cadangan Database Sekarang"}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: PULIHKAN DATABASE (RESTORE)                        */}
      {/* ============================================================== */}
      {activeSubTab === "restore" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Pulihkan Database dari Berkas (.db)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Unggah berkas database cadangan hasil backup sebelumnya untuk mengembalikan seluruh catatan keuangan BUMDes. Sistem akan memvalidasi integritas berkas secara otomatis sebelum pemulihan dijalankan.
              </p>
            </div>
          </div>

          <form onSubmit={handleExecuteRestore} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Berkas Cadangan (.db)
              </label>
              <input
                type="file"
                accept=".db,.sqlite,.sqlite3"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                required
              />
            </div>

            {restoreFile && (
              <div className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Berkas terpilih: <strong>{restoreFile.name}</strong> ({(restoreFile.size / 1024).toFixed(1)} KB)
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={!restoreFile || restoreLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
              >
                <Upload className="w-4 h-4" />
                {restoreLoading ? "Memulihkan Database..." : "Mulai Pemulihan Database"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 4: KOSONGKAN APLIKASI (RESET PABRIK)                    */}
      {/* ============================================================== */}
      {activeSubTab === "reset" && (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-700">
                Kosongkan Seluruh Data Transaksi Aplikasi (Reset Data)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Fitur ini digunakan saat BUMDes ingin memulai pencatatan baru dari kondisi bersih (misalnya setelah masa simulasi/uji coba selesai, atau saat pergantian periode total).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 text-xs space-y-2">
            <span className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Rincian Tindakan Pengosongan:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
              <li><strong>Data yang Dihapus:</strong> Seluruh transaksi Buku Kas Umum harian, baris jurnal Debit/Kredit, arsip tutup buku tahunan, dan saldo awal.</li>
              <li><strong>Data yang Dipertahankan:</strong> Bagan Akun Standar (COA Kepmendes 136), Template Transaksi, dan Akun Login Admin/Operator tetap aman dan tidak terhapus.</li>
            </ul>
          </div>

          <form onSubmit={handleExecuteReset} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ketik kata <span className="text-rose-600 font-mono">KOSONGKAN</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value.toUpperCase())}
                placeholder="Ketik KOSONGKAN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Ketik secara manual kata <span className="font-semibold text-rose-600">KOSONGKAN</span> untuk mengaktifkan tombol di bawah.
              </p>
            </div>

            <button
              type="submit"
              disabled={resetConfirmInput.trim().toUpperCase() !== "KOSONGKAN" || resetLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              {resetLoading ? "Mengosongkan Data..." : "Kosongkan Seluruh Data Aplikasi Sekarang"}
            </button>
          </form>
        </div>
      )}

      {/* Modal Tambah / Ubah Pengguna */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              {userForm.id ? "Ubah Akun Pengguna" : "Tambah Pengguna Baru"}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Contoh: Siti Fatimah, S.E."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  disabled={Boolean(userForm.id)}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Contoh: operator1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {userForm.id ? "Password Baru (Kosongkan jika tidak diubah)" : "Password"}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Minimal 4 karakter"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                  {...(!userForm.id ? { required: true } : {})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peran / Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="OPERATOR">OPERATOR (Kasir & Jurnal Kas)</option>
                  <option value="ADMIN">ADMIN (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {userForm.id && userForm.id !== currentUser?.id ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(false)
                      handleDeleteUser(userForm)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Akun Ini
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                  >
                    Simpan Pengguna
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
