"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
  X
} from "lucide-react"

type DialogType = "info" | "success" | "warning" | "error" | "danger"

interface DialogState {
  isOpen: boolean
  title?: string
  message: string
  type: DialogType
  isConfirm: boolean
  confirmText?: string
  cancelText?: string
  resolve?: (value: boolean) => void
}

interface ToastItem {
  id: string
  message: string
  type: DialogType
}

// Global emitter for headless triggers
type DialogHandler = (config: DialogState) => void
type ToastHandler = (item: ToastItem) => void

let activeDialogHandler: DialogHandler | null = null
let activeToastHandler: ToastHandler | null = null

export function showAppAlert(
  message: string,
  options?: {
    title?: string
    type?: DialogType
    buttonText?: string
  }
): Promise<void> {
  return new Promise((resolve) => {
    if (activeDialogHandler) {
      activeDialogHandler({
        isOpen: true,
        title: options?.title || (options?.type === "error" ? "Terjadi Kesalahan" : "Pemberitahuan Sistem"),
        message,
        type: options?.type || "info",
        isConfirm: false,
        confirmText: options?.buttonText || "Mengerti",
        resolve: () => resolve()
      })
    } else {
      // Fallback if provider not yet mounted
      window.alert(message)
      resolve()
    }
  })
}

export function showAppConfirm(
  message: string,
  options?: {
    title?: string
    type?: "warning" | "danger" | "info"
    confirmText?: string
    cancelText?: string
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    if (activeDialogHandler) {
      activeDialogHandler({
        isOpen: true,
        title: options?.title || "Konfirmasi Tindakan",
        message,
        type: options?.type || "warning",
        isConfirm: true,
        confirmText: options?.confirmText || "Lanjutkan",
        cancelText: options?.cancelText || "Batal",
        resolve: (val) => resolve(val)
      })
    } else {
      // Fallback if provider not mounted
      const ok = window.confirm(message)
      resolve(ok)
    }
  })
}

export function showAppToast(message: string, type: DialogType = "info") {
  if (activeToastHandler) {
    activeToastHandler({
      id: Math.random().toString(36).substring(2, 9),
      message,
      type
    })
  }
}

export default function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    message: "",
    type: "info",
    isConfirm: false
  })
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    activeDialogHandler = (config) => {
      setDialog(config)
    }

    activeToastHandler = (item) => {
      setToasts((prev) => [...prev, item])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id))
      }, 4000)
    }

    // Intercept native browser alert so ANY unhandled alert() uses this dialog
    const originalAlert = window.alert
    window.alert = (msg?: any) => {
      const message = String(msg ?? "")
      const isError = message.toLowerCase().includes("error") || message.toLowerCase().includes("gagal")
      const isSuccess = message.toLowerCase().includes("berhasil")
      showAppAlert(message, {
        type: isError ? "error" : isSuccess ? "success" : "info"
      })
    }

    return () => {
      activeDialogHandler = null
      activeToastHandler = null
      window.alert = originalAlert
    }
  }, [])

  const handleClose = useCallback(
    (confirmed: boolean) => {
      if (dialog.resolve) {
        dialog.resolve(confirmed)
      }
      setDialog((prev) => ({ ...prev, isOpen: false }))
    },
    [dialog]
  )

  const getIcon = (type: DialogType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-500" />
      case "error":
      case "danger":
        return <AlertCircle className="w-6 h-6 text-rose-500" />
      default:
        return <Info className="w-6 h-6 text-[#6777ef]" />
    }
  }

  const getBadgeBg = (type: DialogType) => {
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-100"
      case "warning":
        return "bg-amber-50 border-amber-100"
      case "error":
      case "danger":
        return "bg-rose-50 border-rose-100"
      default:
        return "bg-indigo-50 border-indigo-100"
    }
  }

  return (
    <>
      {children}

      {/* Modern Modal Dialog */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Close button top-right */}
            <button
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl border flex-shrink-0 ${getBadgeBg(
                  dialog.type
                )}`}
              >
                {getIcon(dialog.type)}
              </div>
              <div className="flex-1 pr-6">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {dialog.title || "Pemberitahuan"}
                </h3>
                <div className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {dialog.message}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {dialog.isConfirm && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all cursor-pointer"
                >
                  {dialog.cancelText || "Batal"}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-all cursor-pointer ${
                  dialog.type === "danger" || dialog.type === "error"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                    : dialog.type === "warning"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                    : "bg-[#6777ef] hover:bg-[#5868e4] shadow-indigo-600/25"
                }`}
              >
                {dialog.confirmText || (dialog.isConfirm ? "Lanjutkan" : "Mengerti")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[99998] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl bg-slate-900/95 text-white shadow-xl backdrop-blur-md border border-slate-800 text-sm animate-in slide-in-from-bottom-5 duration-200"
            >
              {getIcon(toast.type)}
              <span className="flex-1 font-medium">{toast.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
