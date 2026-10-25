"use client"

import React, { useState, useEffect, useRef } from "react"
import { Pencil, Check, X, Loader2 } from "lucide-react"

interface InlinePartyEditorProps {
  entry: {
    id: string
    payeeOrPayer?: string | null
  }
  onSave: (id: string, newName: string) => Promise<boolean | void>
}

export default function InlinePartyEditor({ entry, onSave }: InlinePartyEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(entry.payeeOrPayer || "")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sinkronisasi jika nilai prop berubah dari luar
  useEffect(() => {
    setValue(entry.payeeOrPayer || "")
  }, [entry.payeeOrPayer])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleCommit = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setValue(entry.payeeOrPayer || "")
      setIsEditing(false)
      return
    }

    if (trimmed === (entry.payeeOrPayer || "").trim()) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    try {
      await onSave(entry.id, trimmed)
      setIsEditing(false)
    } catch {
      // Error ditangani di onSave
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(entry.payeeOrPayer || "")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 mt-1 bg-white p-1 rounded-lg border border-indigo-300 shadow-xs max-w-[280px]">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleCommit()
            } else if (e.key === "Escape") {
              e.preventDefault()
              handleCancel()
            }
          }}
          placeholder="Nama penyetor / penerima..."
          className="w-full text-xs font-semibold text-slate-800 px-1.5 py-0.5 focus:outline-none"
        />
        <button
          type="button"
          disabled={loading}
          onClick={handleCommit}
          className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-all shrink-0 disabled:opacity-50"
          title="Simpan nama pihak (Enter)"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Check className="w-3 h-3" />
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleCancel}
          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all shrink-0"
          title="Batal (Esc)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span>
        Pihak: <span className="font-semibold text-slate-700">{entry.payeeOrPayer || "-"}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          setValue(entry.payeeOrPayer || "")
          setIsEditing(true)
        }}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-200 text-[10px] font-semibold transition-all shadow-2xs"
        title="Ubah nama penyetor / penerima"
      >
        <Pencil className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600" />
        <span>Edit</span>
      </button>
    </div>
  )
}
