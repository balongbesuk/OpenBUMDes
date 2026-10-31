"use client"

import React, { useRef, useEffect } from "react"
import { Printer, X, FileText, CheckCircle2, Lock, CalendarCheck } from "lucide-react"
import { formatRupiah } from "@/lib/utils"

export interface LpjPrintModalProps {
  closing: any | null
  settings?: Record<string, string>
  onClose: () => void
}

export default function LpjPrintModal({
  closing,
  settings = {},
  onClose
}: LpjPrintModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Tangani shortcut Ctrl+P / Cmd+P agar membuka cetak bersih tanpa web
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault()
        handleOpenPrintTab()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closing, settings])

  if (!closing) return null

  // Parse snapshotData
  let snapshot: any = {}
  try {
    if (typeof closing.snapshotData === "string") {
      snapshot = JSON.parse(closing.snapshotData)
    } else if (closing.snapshotData) {
      snapshot = closing.snapshotData
    }
  } catch (e) {
    console.error("Failed to parse snapshotData in LpjPrintModal:", e)
  }

  const year = closing.year || 2025
  const bumdesName = settings.bumdes_name || "BUMDesa \"BAROKAH\""
  const bumdesAddress = settings.bumdes_address || "Desa Balongbesuk, Kecamatan Diwek, Kabupaten Jombang"
  const villageName = settings.village_name || "Balongbesuk"
  const subdistrictName = settings.subdistrict_name || "Diwek"
  const regencyName = settings.regency_name || "Jombang"
  const directorName = settings.director_name || "DODIK SUSANTO, S.Fil.I"
  const treasurerName = settings.treasurer_name || "MAMIK KURNIAWATI"
  const villageHead = settings.village_head || "MOCHAMAD SAIFUR"
  const supervisorName = settings.supervisor_name || "SADJI ABDULLAH"

  const labaRugi = snapshot.labaRugi || {
    revenues: [],
    expenses: [],
    totalRevenue: closing.totalRevenue || 0,
    totalExpense: closing.totalExpense || 0,
    netProfit: closing.netProfit || 0
  }

  const neraca = snapshot.neraca || {
    currentAssets: [],
    totalCurrentAssets: 0,
    fixedAssets: { peralatan: 0, akumulasiPenyusutan: 0, net: 0 },
    totalAssets: 0,
    liabilities: [],
    totalLiabilities: 0,
    equity: [],
    totalEquity: 0,
    totalLiabilitiesAndEquity: 0
  }

  const lpe = snapshot.lpe || {
    modalAwalDesa: 0,
    modalAwalMasyarakat: 0,
    penambahanModalDesa: 0,
    penambahanModalMasyarakat: 0,
    totalPenyertaanModalAkhir: 0,
    saldoLabaAwal: 0,
    labaPeriodeBerjalan: closing.netProfit || 0,
    bagiHasilDesa: closing.padesAmount || 0,
    bagiHasilMasyarakat: 0,
    saldoLabaAkhir: closing.netProfit || 0,
    ekuitasAkhir: 0
  }

  const lak = snapshot.lak || {
    operasi: { masuk: 0, keluar: 0, bersih: 0 },
    investasi: { masuk: 0, keluar: 0, bersih: 0 },
    pendanaan: { masuk: 0, keluar: 0, bersih: 0 },
    kenaikanKasBersih: 0,
    saldoKasAwal: 0,
    saldoKasAkhir: 0
  }

  // Alokasi SHU
  const profitBase = Math.max(0, Number(closing.netProfit || labaRugi.netProfit || 0))
  const shu = {
    padesPercent: closing.padesPercent ?? 20,
    padesAmount: closing.padesAmount ?? Math.round(profitBase * 0.2),
    cadanganPercent: closing.cadanganPercent ?? 30,
    cadanganAmount: closing.cadanganAmount ?? Math.round(profitBase * 0.3),
    pengurusPercent: closing.pengurusPercent ?? 25,
    pengurusAmount: closing.pengurusAmount ?? Math.round(profitBase * 0.25),
    sosialPercent: closing.sosialPercent ?? 15,
    sosialAmount: closing.sosialAmount ?? Math.round(profitBase * 0.15),
    pendidikanPercent: closing.pendidikanPercent ?? 10,
    pendidikanAmount: closing.pendidikanAmount ?? Math.round(profitBase * 0.1)
  }

  // Pos-pos aman untuk Neraca & CaLK
  const currentAssetsList = (neraca.currentAssets && neraca.currentAssets.length > 0)
    ? neraca.currentAssets
    : [
        { name: "Kas & Setara Kas (Kas Tunai & Rekening Bank)", amount: lak.saldoKasAkhir || 0 },
        { name: "Piutang Usaha & Tagihan Mitra", amount: 0 },
        { name: "Persediaan Barang & ATK Operasional", amount: 0 }
      ]

  const liabilitiesList = (neraca.liabilities && neraca.liabilities.length > 0)
    ? neraca.liabilities
    : [
        { name: "Kewajiban Jangka Pendek & Titipan Pihak Ketiga", amount: neraca.totalLiabilities || 0 }
      ]

  const equityList = (neraca.equity && neraca.equity.length > 0)
    ? neraca.equity
    : [
        { name: "Penyertaan Modal Desa (APBDes)", amount: lpe.totalPenyertaanModalAkhir || lpe.modalAwalDesa || 0 },
        { name: "Cadangan Modal & Laba Ditahan", amount: lpe.saldoLabaAwal || 0 },
        { name: "Sisa Hasil Usaha / Laba Bersih Tahun Berjalan", amount: labaRugi.netProfit || 0 }
      ]

  // Helper KOP Dokumen Resmi Standar Menu Laporan Keuangan
  const renderReportKop = (reportTitle: string, subtitle?: string) => (
    <div className="kop-container border-b-2 border-slate-900 pb-3 mb-4" style={{ borderBottom: "2px solid #0f172a", paddingBottom: "10px", marginBottom: "14px" }}>
      <div className="kop-header-container flex items-center justify-between gap-4" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", width: "100%" }}>
        <div className="kop-brand-box flex items-center gap-3.5" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {settings.bumdes_logo ? (
            <img
              src={settings.bumdes_logo}
              alt="Logo BUMDes"
              className="w-14 h-14 object-contain rounded-lg border border-slate-200 p-1 shrink-0 bg-white"
              style={{ width: "56px", height: "56px", objectFit: "contain", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "4px", flexShrink: 0, backgroundColor: "#ffffff" }}
            />
          ) : (
            <div 
              className="w-14 h-14 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shrink-0"
              style={{ width: "56px", height: "56px", borderRadius: "10px", background: "#0f172a", color: "#ffffff", fontWeight: 900, fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              {(bumdesName || "B").charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-black text-base sm:text-lg text-slate-900 uppercase tracking-tight leading-tight" style={{ fontWeight: 900, fontSize: "16px", color: "#0f172a", textTransform: "uppercase", lineHeight: 1.2, margin: 0 }}>
              {bumdesName}
            </h1>
            <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5" style={{ fontSize: "11px", color: "#475569", fontWeight: 500, lineHeight: 1.25, margin: "2px 0 0 0" }}>
              Desa {villageName}, Kecamatan {subdistrictName}, Kabupaten {regencyName}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5" style={{ fontSize: "10px", color: "#64748b", lineHeight: 1.25, margin: "2px 0 0 0" }}>
              {bumdesAddress}
            </p>
          </div>
        </div>

        <div className="kop-badge-box text-right shrink-0" style={{ textAlign: "right", flexShrink: 0 }}>
          <span 
            className="kop-badge text-[9.5px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider inline-block"
            style={{ fontSize: "9.5px", fontWeight: 700, padding: "2.5px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-block", whiteSpace: "nowrap" }}
          >
            Kepmendes PDTT 136/2022
          </span>
          <p className="text-[10.5px] text-slate-600 mt-1 font-mono font-bold" style={{ fontSize: "10.5px", color: "#475569", marginTop: "3px", fontFamily: "ui-monospace, monospace", fontWeight: 700, margin: "3px 0 0 0" }}>
            TA: {year}
          </p>
        </div>
      </div>

      <div className="kop-title-box text-center mt-3 pt-2 border-t border-slate-200/80" style={{ textAlign: "center", marginTop: "10px", paddingTop: "6px", borderTop: "1px solid #e2e8f0" }}>
        <h2 className="text-base font-black text-slate-900 uppercase tracking-wide" style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.025em", margin: 0 }}>
          {reportTitle}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-slate-600 font-bold mt-0.5" style={{ fontSize: "11px", color: "#475569", fontWeight: 700, margin: "2px 0 0 0" }}>
            {subtitle}
          </p>
        )}
        <p className="text-[10px] text-slate-500 mt-0.5 italic" style={{ fontSize: "10px", color: "#64748b", fontStyle: "italic", margin: "2px 0 0 0" }}>
          Periode Tahun Buku: 1 Januari s/d 31 Desember {year}
        </p>
      </div>
    </div>
  )

  // Helper Tanda Tangan Resmi Menu Laporan Keuangan
  const renderReportSignatures = (includePenasihat = false) => (
    <div className={`mt-6 pt-4 border-t border-slate-200 text-xs ${includePenasihat ? "grid grid-cols-3 gap-4 text-center" : "grid grid-cols-2 text-center"}`}>
      {includePenasihat && (
        <div>
          <p className="text-slate-500 mb-0.5 text-[10px]">Menyetujui & Mengesahkan,</p>
          <p className="font-bold text-slate-800 uppercase text-[10.5px]">PENASIHAT (KEPALA DESA)</p>
          <div className="h-16"></div>
          <p className="font-bold text-slate-900 underline uppercase text-[11px]">{villageHead}</p>
          <p className="text-[10px] text-slate-500">Pemerintah Desa {villageName}</p>
        </div>
      )}

      <div>
        <p className="text-slate-500 mb-0.5 text-[10px]">{includePenasihat ? "Mengetahui," : "Mengetahui & Melaporkan,"}</p>
        <p className="font-bold text-slate-800 uppercase text-[10.5px]">DIREKTUR BUMDES</p>
        <div className="h-16"></div>
        <p className="font-bold text-slate-900 underline uppercase text-[11px]">{directorName}</p>
        <p className="text-[10px] text-slate-500">Direktur Utama</p>
      </div>

      <div>
        <p className="text-slate-500 mb-0.5 text-[10px]">
          {villageName}, 31 Desember {year}
        </p>
        <p className="font-bold text-slate-800 uppercase text-[10.5px]">BENDAHARA / AKUNTANSI</p>
        <div className="h-16"></div>
        <p className="font-bold text-slate-900 underline uppercase text-[11px]">{treasurerName}</p>
        <p className="text-[10px] text-slate-500">Bendahara BUMDes</p>
      </div>
    </div>
  )

  // Helper Footer Halaman Cetak Resmi
  const renderPageFooter = (pageNumber: number) => (
    <div className="pt-2 border-t border-slate-300 mt-4 flex justify-between items-center text-[9.5px] text-slate-500 font-sans print:pt-2 print:mt-4">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-800 uppercase tracking-wider">{bumdesName.replace(/["\\]/g, "")}</span>
        <span>&bull;</span>
        <span>LPJ Keuangan TA {year}</span>
      </div>
      <div className="text-slate-400 italic">
        Kepmendesa PDTT No. 136/2022 &bull; SAK EMKM
      </div>
      <div className="font-mono font-bold text-slate-800">
        Halaman {pageNumber} dari 8
      </div>
    </div>
  )

  // --- FITUR BUKA TAB CETAK BERSIH (PRINT TAB) ---
  const handleOpenPrintTab = () => {
    const element = document.getElementById("lpj-print-document")
    if (!element) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      window.print()
      return
    }

    const printDoc = printWindow.document
    printDoc.title = `Cetak LPJ BUMDesa ${bumdesName.replace(/["\\]/g, "")} - TA ${year}`

    const head = printDoc.head
    const metaCharset = printDoc.createElement("meta")
    metaCharset.setAttribute("charset", "utf-8")
    head.appendChild(metaCharset)

    const baseTag = printDoc.createElement("base")
    baseTag.setAttribute("href", `${window.location.origin}/`)
    head.appendChild(baseTag)

    const metaViewport = printDoc.createElement("meta")
    metaViewport.setAttribute("name", "viewport")
    metaViewport.setAttribute("content", "width=device-width, initial-scale=1.0")
    head.appendChild(metaViewport)

    const tailwindScript = printDoc.createElement("script")
    tailwindScript.src = "https://cdn.tailwindcss.com"
    head.appendChild(tailwindScript)

    document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
      head.appendChild(node.cloneNode(true))
    })

    const customStyle = printDoc.createElement("style")
    customStyle.textContent = `
    @page { 
      size: A4 portrait; 
      margin: 10mm 12mm; 
    }
    *, *::before, *::after { 
      box-sizing: border-box !important; 
    }
    html, body {
      background: #ffffff !important;
      color: #0f172a;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-break {
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .cover-a4-page {
      box-sizing: border-box !important;
      width: 100% !important;
      height: 272mm !important;
      min-height: 272mm !important;
      max-height: 272mm !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      border: 5px double #0f172a !important;
      border-radius: 18px !important;
      padding: 12mm 10mm !important;
      margin: 0 auto !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      background: #ffffff !important;
      position: relative !important;
    }
    .report-a4-page {
      box-sizing: border-box !important;
      width: 100% !important;
      min-height: 272mm !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      padding: 2mm 0 !important;
      margin: 0 auto !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .kop-container {
      border-bottom: 2px solid #0f172a !important;
      padding-bottom: 10px !important;
      margin-bottom: 14px !important;
    }
    .kop-header-container {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 16px !important;
      width: 100% !important;
    }
    .kop-brand-box {
      display: flex !important;
      align-items: center !important;
      gap: 14px !important;
    }
    .kop-badge-box {
      text-align: right !important;
      flex-shrink: 0 !important;
    }
    .kop-badge {
      display: inline-block !important;
      width: auto !important;
      max-width: max-content !important;
      font-size: 9.5px !important;
      font-weight: 700 !important;
      padding: 2.5px 10px !important;
      border-radius: 6px !important;
      background: #f1f5f9 !important;
      color: #334155 !important;
      border: 1px solid #cbd5e1 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      white-space: nowrap !important;
    }
    .kop-title-box {
      text-align: center !important;
      margin-top: 10px !important;
      padding-top: 6px !important;
      border-top: 1px solid #e2e8f0 !important;
    }
    @media screen {
      body {
        background: #f1f5f9 !important;
        padding-bottom: 40px !important;
      }
      .print-container {
        max-width: 860px;
        margin: 20px auto;
        padding: 0;
      }
      .cover-a4-page {
        height: auto !important;
        min-height: 1020px !important;
        margin-bottom: 24px !important;
        background: #ffffff !important;
        box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
        padding: 36px 28px !important;
      }
      .report-a4-page {
        min-height: 1020px !important;
        margin-bottom: 24px !important;
        background: #ffffff !important;
        padding: 30px 24px !important;
        border-radius: 16px !important;
        box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
      }
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0 !important;
        margin: 0 !important;
        background: #ffffff !important;
      }
      .print-container {
        max-width: none !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .cover-a4-page {
        width: 100% !important;
        height: 272mm !important;
        min-height: 272mm !important;
        max-height: 272mm !important;
        padding: 12mm 10mm !important;
        margin: 0 !important;
        border: 5px double #0f172a !important;
        border-radius: 16px !important;
      }
      .report-a4-page {
        width: 100% !important;
        min-height: 272mm !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .kop-header-container {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
      .kop-brand-box {
        display: flex !important;
        align-items: center !important;
      }
      .kop-badge {
        display: inline-block !important;
        white-space: nowrap !important;
      }
    }
    `
    head.appendChild(customStyle)

    // Sticky toolbar
    const toolbar = printDoc.createElement("div")
    toolbar.className = "no-print"
    toolbar.style.cssText = "padding: 12px 24px; background: #1e1b4b; color: white; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 50; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"

    const toolbarInfo = printDoc.createElement("div")
    const titleSpan = printDoc.createElement("span")
    titleSpan.style.cssText = "font-weight: bold; font-size: 13px;"
    titleSpan.textContent = `Pratinjau Cetak LPJ Resmi BUMDesa TA ${year}`
    const subSpan = printDoc.createElement("span")
    subSpan.style.cssText = "font-size: 11px; opacity: 0.8; margin-left: 8px;"
    subSpan.textContent = "(Format Kertas A4 • Standar Kepmendes 136/2022)"
    toolbarInfo.appendChild(titleSpan)
    toolbarInfo.appendChild(subSpan)

    const toolbarBtnBox = printDoc.createElement("div")
    const printBtn = printDoc.createElement("button")
    printBtn.style.cssText = "background: #4f46e5; color: white; border: none; padding: 7px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 12px;"
    printBtn.textContent = "🖨️ Cetak / Simpan PDF (A4)"
    printBtn.onclick = () => {
      try { printWindow.print() } catch {}
    }
    toolbarBtnBox.appendChild(printBtn)

    toolbar.appendChild(toolbarInfo)
    toolbar.appendChild(toolbarBtnBox)

    const printContainer = printDoc.createElement("div")
    printContainer.className = "print-container"
    printContainer.appendChild(element.cloneNode(true))

    const body = printDoc.body
    body.innerHTML = ""
    body.appendChild(toolbar)
    body.appendChild(printContainer)

    let printed = false
    printWindow.onload = () => {
      setTimeout(() => {
        try { if (!printed) { printed = true; printWindow.print() } } catch {}
      }, 600)
    }

    setTimeout(() => {
      try { if (!printed) { printed = true; printWindow.print() } } catch {}
    }, 1200)
  }

  const handlePrint = () => {
    handleOpenPrintTab()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible print:block print:inset-auto">
      {/* CSS Injeksi Cetak A4 Langsung */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm 12mm; }
          body { background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .cover-a4-page {
            box-sizing: border-box !important;
            width: 100% !important;
            height: 272mm !important;
            min-height: 272mm !important;
            max-height: 272mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            border: 5px double #0f172a !important;
            border-radius: 16px !important;
            padding: 12mm 10mm !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: #ffffff !important;
          }
          .report-a4-page {
            box-sizing: border-box !important;
            width: 100% !important;
            min-height: 272mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 0 !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .kop-container {
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 10px !important;
            margin-bottom: 14px !important;
          }
          .kop-header-container {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 16px !important;
            width: 100% !important;
          }
          .kop-brand-box {
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
          }
          .kop-badge-box {
            text-align: right !important;
            flex-shrink: 0 !important;
          }
          .kop-badge {
            display: inline-block !important;
            width: auto !important;
            max-width: max-content !important;
            font-size: 9.5px !important;
            font-weight: 700 !important;
            padding: 2.5px 10px !important;
            border-radius: 6px !important;
            background: #f1f5f9 !important;
            color: #334155 !important;
            border: 1px solid #cbd5e1 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            white-space: nowrap !important;
          }
          .kop-title-box {
            text-align: center !important;
            margin-top: 10px !important;
            padding-top: 6px !important;
            border-top: 1px solid #e2e8f0 !important;
          }
        }
        @media screen {
          .cover-a4-page {
            box-sizing: border-box;
            width: 100%;
            min-height: 1020px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 5px double #0f172a;
            border-radius: 24px;
            padding: 36px 28px;
            background: #ffffff;
          }
          .report-a4-page {
            box-sizing: border-box;
            width: 100%;
            min-height: 1020px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #ffffff;
          }
          .kop-container {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .kop-header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            width: 100%;
          }
          .kop-brand-box {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .kop-badge-box {
            text-align: right;
            flex-shrink: 0;
          }
          .kop-badge {
            display: inline-block;
            font-size: 9.5px;
            font-weight: 700;
            padding: 2.5px 10px;
            border-radius: 6px;
            background: #f1f5f9;
            color: #334155;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
          }
          .kop-title-box {
            text-align: center;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
          }
        }
      `}} />

      {/* Container Dialog */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-4 overflow-hidden print:border-none print:shadow-none print:my-0 print:max-w-none print:overflow-visible">
        
        {/* Floating Action Bar */}
        <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Cetak Dokumen Resmi LPJ Tahunan BUMDes {year}
              </h3>
              <p className="text-[11px] text-slate-300">
                Format Standar Resmi Selaras Menu Laporan Keuangan (Kepmendes 136/2022 & SAK EMKM)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6777ef] hover:bg-[#5868e4] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Buka Tab Cetak (Print View A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================= */}
        {/* DOKUMEN CETAK UTAMA (8 HALAMAN RESMI LPJ MUSDES)              */}
        {/* ============================================================= */}
        <div
          id="lpj-print-document"
          ref={contentRef}
          className="p-6 sm:p-10 space-y-12 bg-white text-slate-900 font-sans print:p-0 print:space-y-0"
        >

          {/* ========================================================= */}
          {/* HALAMAN 1: SAMPUL / COVER RESMI LPJ MUSDES (SEUKURAN A4)  */}
          {/* ========================================================= */}
          <div className="cover-a4-page text-center page-break">
            {/* Header Instansi */}
            <div className="space-y-1.5 pb-3 border-b-2 border-slate-800">
              <span className="text-xs font-black uppercase tracking-widest text-[#6777ef] block">
                PEMERINTAH KABUPATEN {regencyName.toUpperCase()} &bull; KECAMATAN {subdistrictName.toUpperCase()}
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                PEMERINTAH DESA {villageName.toUpperCase()}
              </h2>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold">
                <span>Badan Usaha Milik Desa (BUM Desa)</span>
                <span>&bull;</span>
                <span>Badan Hukum Resmi Kemendesa PDTT</span>
              </div>
            </div>

            {/* Logo & Judul Utama LPJ */}
            <div className="space-y-4 my-auto py-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-slate-900 text-white flex items-center justify-center font-black text-4xl shadow-md border-2 border-slate-700">
                {settings.bumdes_logo ? (
                  <img
                    src={settings.bumdes_logo}
                    alt="Logo"
                    className="w-full h-full object-contain p-2 rounded-3xl"
                  />
                ) : (
                  (bumdesName || "B").charAt(0)
                )}
              </div>

              <div className="space-y-2">
                <span className="inline-block px-4 py-1 rounded-full text-[10.5px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase tracking-widest">
                  DOKUMEN RESMI PERTANGGUNGJAWABAN TAHUNAN
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                  LAPORAN PERTANGGUNGJAWABAN (LPJ)
                </h1>
                <h2 className="text-xl sm:text-2xl font-black text-[#6777ef] uppercase tracking-wide">
                  {bumdesName}
                </h2>
                <div className="inline-block px-5 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-black text-sm tracking-wider mt-1 shadow-xs">
                  TAHUN ANGGARAN {year}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg mx-auto text-[11px] text-slate-600 leading-relaxed text-justify sm:text-center">
                Disusun dan disajikan berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) serta Keputusan Menteri Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi RI Nomor 136 Tahun 2022 tentang Panduan Penyusunan Pelaporan Keuangan Badan Usaha Milik Desa.
              </div>

              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Unit Usaha: Gedung Serbaguna (GSG) &bull; Persewaan Kios Pasar &bull; Jasa PPOB &bull; Simpan Pinjam
              </div>
            </div>

            {/* Footer Cover: Pengesahan Musdes & 3 Pihak */}
            <div className="space-y-2.5 pt-3 border-t-2 border-slate-800 text-xs">
              <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[10.5px] font-bold text-indigo-950">
                Disampaikan & Disahkan Dalam Forum Musyawarah Desa (Musdes) Pertanggungjawaban Tahunan
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1 text-slate-700">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Pelaksana Operasional</span>
                  <span className="font-bold text-slate-900">{directorName}</span>
                  <span className="text-[9px] text-slate-400 block">Direktur Utama</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Badan Pengawas</span>
                  <span className="font-bold text-slate-900">{supervisorName}</span>
                  <span className="text-[9px] text-slate-400 block">Ketua Pengawas / BPD</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Penasihat</span>
                  <span className="font-bold text-slate-900">{villageHead}</span>
                  <span className="text-[9px] text-slate-400 block">Kepala Desa {villageName}</span>
                </div>
              </div>
              <div className="text-[9.5px] text-slate-500 font-medium pt-1 border-t border-slate-200">
                {bumdesAddress}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* HALAMAN 2: 1. LAPORAN LABA RUGI KOMPREHENSIF               */}
          {/* (PERSIS DENGAN AREA CETAK MENU LABA RUGI)                 */}
          {/* ========================================================= */}
          <div className="report-a4-page page-break">
            <div className="space-y-3">
              {renderReportKop("LAPORAN LABA RUGI KOMPREHENSIF", "Standar Kepmendesa PDTT No. 136 Tahun 2022")}

              {/* TABEL FORMAL GRID: LABA RUGI (SAMA PERSIS DENGAN MENU LABA RUGI) */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center">Kode Akun</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Nama & Rincian Pos Akuntansi</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-36 text-center">Golongan Akun</th>
                      <th className="py-2.5 px-3 text-right w-44">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* SECTION I: PENDAPATAN */}
                    <tr className="bg-slate-50/80 font-bold text-slate-800">
                      <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-[#6777ef]">
                        I. PENDAPATAN USAHA (REVENUE)
                      </td>
                    </tr>
                    {labaRugi.revenues.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-center text-slate-400 italic">
                          Belum ada akun pendapatan yang tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      labaRugi.revenues.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center text-slate-700">
                            {r.code}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                            {r.name}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Pendapatan Usaha
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(r.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-emerald-50/60 font-bold border-t border-b border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                        TOTAL PENDAPATAN USAHA (A)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-black">
                        {formatRupiah(labaRugi.totalRevenue)}
                      </td>
                    </tr>

                    {/* SECTION II: BEBAN */}
                    <tr className="bg-slate-50/80 font-bold text-slate-800">
                      <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-rose-600">
                        II. BEBAN OPERASIONAL & USAHA (EXPENSES)
                      </td>
                    </tr>
                    {labaRugi.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-center text-slate-400 italic">
                          Belum ada akun beban operasional yang tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      labaRugi.expenses.map((e: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-center text-slate-700">
                            {e.code}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                            {e.name}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Beban Operasional
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(e.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-rose-50/60 font-bold border-t border-b border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                        TOTAL BEBAN OPERASIONAL & USAHA (B)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-black">
                        {formatRupiah(labaRugi.totalExpense)}
                      </td>
                    </tr>

                    {/* GRAND TOTAL: SISA HASIL USAHA (SHU) */}
                    <tr className="bg-indigo-50/80 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                      <td colSpan={3} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-xs sm:text-sm text-[#6777ef]">
                        SISA HASIL USAHA (SHU) / LABA BERSIH TAHUN BERJALAN (A - B)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-[#6777ef]">
                        {formatRupiah(labaRugi.netProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {renderPageFooter(2)}
          </div>

          {/* ========================================================= */}
          {/* HALAMAN 3: 2. RENCANA & REALISASI PEMBAGIAN SHU           */}
          {/* ========================================================= */}
          <div className="report-a4-page page-break">
            <div className="space-y-4">
              {renderReportKop("RENCANA & REALISASI PEMBAGIAN SISA HASIL USAHA (SHU)", "Ketetapan AD/ART BUM Desa & Hasil Musyawarah Desa (Musdes)")}

              {/* Rangkuman Nilai SHU */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10.5px] font-bold text-indigo-900 uppercase tracking-wider block">
                    TOTAL SISA HASIL USAHA (SHU) BERSIH TAHUN {year}
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    Dasar Alokasi Pembagian Sesuai Ketetapan Musyawarah Desa
                  </span>
                </div>
                <div className="text-base font-black font-mono text-[#6777ef]">
                  {formatRupiah(labaRugi.netProfit)}
                </div>
              </div>

              {/* Tabel Distribusi SHU */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Pos Alokasi Pembagian SHU</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center">Persentase</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Keterangan / Rekening Tujuan</th>
                      <th className="py-2.5 px-3 text-right w-44">Jumlah Alokasi (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">1</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        Pendapatan Asli Desa (PADes)
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-amber-700">
                        {shu.padesPercent}%
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                        Disetor ke Rekening Kas Desa (Rekening Kas Umum Desa - APBDes)
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(shu.padesAmount)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">2</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        Cadangan Modal BUM Desa
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-emerald-700">
                        {shu.cadanganPercent}%
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                        Ditanamkan kembali untuk penguatan modal kerja unit usaha BUMDes
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(shu.cadanganAmount)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">3</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        Jasa Pengurus & Pegawai
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-indigo-700">
                        {shu.pengurusPercent}%
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                        Insentif kinerja Pelaksana Operasional, Bendahara, dan staf
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(shu.pengurusAmount)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">4</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        Dana Sosial & Kelembagaan
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-purple-700">
                        {shu.sosialPercent}%
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                        Santunan warga kurang mampu dan bantuan sosial kemasyarakatan
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(shu.sosialAmount)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">5</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        Dana Pendidikan & Pelatihan SDM
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-bold text-cyan-700">
                        {shu.pendidikanPercent}%
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                        Peningkatan kompetensi pengurus, pelatihan vokasi pemuda desa
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(shu.pendidikanAmount)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50 font-black border-t-2 border-slate-400 text-slate-900">
                      <td colSpan={2} className="py-2.5 px-3 border-r border-slate-300 text-right uppercase tracking-wider pr-4">
                        TOTAL ALOKASI BAGI HASIL USAHA (SHU)
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-black text-indigo-700">
                        100%
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-[10.5px] text-slate-500 italic">
                        Ketetapan Berita Acara Musdes Pertanggungjawaban
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-[#6777ef] bg-indigo-100/50">
                        {formatRupiah(
                          shu.padesAmount +
                            shu.cadanganAmount +
                            shu.pengurusAmount +
                            shu.sosialAmount +
                            shu.pendidikanAmount
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {renderPageFooter(3)}
          </div>

          {/* ========================================================= */}
          {/* HALAMAN 4: 3. LAPORAN POSISI KEUANGAN (NERACA SAK EMKM)   */}
          {/* (PERSIS DENGAN AREA CETAK MENU NERACA)                    */}
          {/* ========================================================= */}
          <div className="report-a4-page page-break">
            <div className="space-y-3">
              {renderReportKop("LAPORAN POSISI KEUANGAN (NERACA)", "Standar SAK EMKM & Kepmendesa PDTT No. 136 Tahun 2022")}

              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>STATUS NERACA: 100% BALANCE (SEIMBANG) &bull; SELISIH RP 0</span>
                </div>
              </div>

              {/* TABEL BERDAMPINGAN: AKTIVA VS PASIVA (SAMA PERSIS DENGAN MENU NERACA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                
                {/* KOLOM KIRI: ASET (AKTIVA) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                        <th colSpan={2} className="py-2 px-3 border-r border-slate-300 text-xs uppercase tracking-wider text-[#6777ef]">
                          ASET (AKTIVA)
                        </th>
                        <th className="py-2 px-3 text-right w-32">Nilai (Rp)</th>
                      </tr>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10.5px]">
                        <th className="py-1 px-3 border-r border-slate-200">Komponen Aset</th>
                        <th className="py-1 px-2 border-r border-slate-200 text-center w-20">Golongan</th>
                        <th className="py-1 px-3 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* A. Aset Lancar */}
                      <tr className="bg-slate-50/80 font-bold text-slate-800">
                        <td colSpan={3} className="py-1 px-3 border-r border-slate-300 text-[10.5px]">
                          A. ASET LANCAR
                        </td>
                      </tr>
                      {currentAssetsList.map((a: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700 pl-4">{a.name}</td>
                          <td className="py-1.5 px-2 border-r border-slate-200 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Lancar
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(a.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                        <td colSpan={2} className="py-1.5 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                          Subtotal Aset Lancar
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-700 font-bold">
                          {formatRupiah(neraca.totalCurrentAssets || currentAssetsList.reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0))}
                        </td>
                      </tr>

                      {/* B. Aset Tetap */}
                      <tr className="bg-slate-50/80 font-bold text-slate-800">
                        <td colSpan={3} className="py-1 px-3 border-r border-slate-300 text-[10.5px]">
                          B. ASET TETAP
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700 pl-4">Nilai Perolehan Aset Tetap</td>
                        <td className="py-1.5 px-2 border-r border-slate-200 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Tetap
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">
                          {formatRupiah(neraca.fixedAssets?.peralatan || 0)}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700 pl-4">Akumulasi Penyusutan</td>
                        <td className="py-1.5 px-2 border-r border-slate-200 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Kontra
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-500">
                          ({formatRupiah(neraca.fixedAssets?.akumulasiPenyusutan || 0)})
                        </td>
                      </tr>
                      <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                        <td colSpan={2} className="py-1.5 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                          Subtotal Aset Tetap Bersih
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-700 font-bold">
                          {formatRupiah(neraca.fixedAssets?.net || 0)}
                        </td>
                      </tr>

                      {/* TOTAL AKTIVA */}
                      <tr className="bg-indigo-50 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                        <td colSpan={2} className="py-2.5 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-3 text-xs text-[#6777ef]">
                          TOTAL ASET (AKTIVA)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs font-black text-[#6777ef]">
                          {formatRupiah(neraca.totalAssets || (neraca.totalCurrentAssets + (neraca.fixedAssets?.net || 0)))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* KOLOM KANAN: KEWAJIBAN & EKUITAS (PASIVA) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                        <th colSpan={2} className="py-2 px-3 border-r border-slate-300 text-xs uppercase tracking-wider text-emerald-700">
                          KEWAJIBAN & EKUITAS (PASIVA)
                        </th>
                        <th className="py-2 px-3 text-right w-32">Nilai (Rp)</th>
                      </tr>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10.5px]">
                        <th className="py-1 px-3 border-r border-slate-200">Komponen Pasiva</th>
                        <th className="py-1 px-2 border-r border-slate-200 text-center w-20">Golongan</th>
                        <th className="py-1 px-3 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* A. Kewajiban */}
                      <tr className="bg-slate-50/80 font-bold text-slate-800">
                        <td colSpan={3} className="py-1 px-3 border-r border-slate-300 text-[10.5px]">
                          A. KEWAJIBAN (UTANG)
                        </td>
                      </tr>
                      {liabilitiesList.map((l: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700 pl-4">{l.name}</td>
                          <td className="py-1.5 px-2 border-r border-slate-200 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Utang
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(l.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                        <td colSpan={2} className="py-1.5 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                          Subtotal Kewajiban
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-amber-700 font-bold">
                          {formatRupiah(neraca.totalLiabilities || liabilitiesList.reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0))}
                        </td>
                      </tr>

                      {/* B. Ekuitas */}
                      <tr className="bg-slate-50/80 font-bold text-slate-800">
                        <td colSpan={3} className="py-1 px-3 border-r border-slate-300 text-[10.5px]">
                          B. EKUITAS (MODAL)
                        </td>
                      </tr>
                      {equityList.map((e: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700 pl-4">{e.name}</td>
                          <td className="py-1.5 px-2 border-r border-slate-200 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ekuitas
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(e.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                        <td colSpan={2} className="py-1.5 px-3 border-r border-slate-300 text-slate-800 text-right pr-3">
                          Subtotal Ekuitas
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-700 font-bold">
                          {formatRupiah(neraca.totalEquity || equityList.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0))}
                        </td>
                      </tr>

                      {/* TOTAL PASIVA */}
                      <tr className="bg-emerald-50 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                        <td colSpan={2} className="py-2.5 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-3 text-xs text-emerald-800">
                          TOTAL PASIVA (MODAL + UTANG)
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs font-black text-emerald-700">
                          {formatRupiah(neraca.totalLiabilitiesAndEquity || ((neraca.totalLiabilities || 0) + (neraca.totalEquity || 0)))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {renderPageFooter(4)}
          </div>

          {/* ========================================================= */}
          {/* HALAMAN 5: 4. LAPORAN PERUBAHAN EKUITAS (LPE)             */}
          {/* (PERSIS DENGAN AREA CETAK MENU LPE)                       */}
          {/* ========================================================= */}
          <div className="report-a4-page page-break">
            <div className="space-y-3">
              {renderReportKop("LAPORAN PERUBAHAN EKUITAS (LPE)", "Standar Kepmendesa PDTT No. 136 Tahun 2022")}

              {/* TABEL FORMAL GRID: LPE (SAMA PERSIS DENGAN MENU LPE) */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border-r border-slate-300 w-14 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Komponen Perubahan Ekuitas BUMDes</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-36 text-center">Kategori Akun</th>
                      <th className="py-2.5 px-3 text-right w-44">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">1</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penyertaan Modal Desa Awal (APBDes)</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Modal Disetor</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(lpe.modalAwalDesa || 0)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">2</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penyertaan Modal Masyarakat Awal</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Modal Disetor</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(lpe.modalAwalMasyarakat || 0)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">3</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penambahan / (Pengurangan) Modal Tahun Berjalan</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Mutasi Modal</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {formatRupiah((lpe.penambahanModalDesa || 0) + (lpe.penambahanModalMasyarakat || 0))}
                      </td>
                    </tr>
                    <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                        Jumlah Penyertaan Modal Akhir (I)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-black">
                        {formatRupiah(lpe.totalPenyertaanModalAkhir || ((lpe.modalAwalDesa || 0) + (lpe.modalAwalMasyarakat || 0)))}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">4</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Saldo Laba Awal Tahun (Cadangan & Laba Ditahan)</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Saldo Laba</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(lpe.saldoLabaAwal || 0)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">5</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Penyetoran PADes / Bagi Hasil ke Kas Desa</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Distribusi SHU</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">({formatRupiah(lpe.bagiHasilDesa || 0)})</td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">6</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">Sisa Hasil Usaha / Laba Bersih Tahun Berjalan</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">SHU Berjalan</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">+{formatRupiah(lpe.labaPeriodeBerjalan || labaRugi.netProfit || 0)}</td>
                    </tr>
                    <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                        Jumlah Saldo Laba Akhir Tahun (II)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-black">
                        {formatRupiah(lpe.saldoLabaAkhir || 0)}
                      </td>
                    </tr>

                    {/* GRAND TOTAL: EKUITAS AKHIR */}
                    <tr className="bg-indigo-50/80 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                      <td colSpan={3} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-xs sm:text-sm text-[#6777ef]">
                        TOTAL EKUITAS AKHIR BUMDES PER 31 DESEMBER (I + II)
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-[#6777ef]">
                        {formatRupiah(lpe.ekuitasAkhir || (lpe.totalPenyertaanModalAkhir + lpe.saldoLabaAkhir))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {renderPageFooter(5)}
          </div>

          {/* ========================================================= */}
          {/* HALAMAN 6: 5. LAPORAN ARUS KAS (LAK METODE LANGSUNG)      */}
          {/* (PERSIS DENGAN AREA CETAK MENU ARUS KAS)                  */}
          {/* ========================================================= */}
          <div className="report-a4-page page-break">
            <div className="space-y-3">
              {renderReportKop("LAPORAN ARUS KAS (LAK)", "Metode Langsung (Direct Cash Flow) - Standar Kepmendes 136/2022")}

              {/* TABEL FORMAL GRID: ARUS KAS (SAMA PERSIS DENGAN MENU ARUS KAS) */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 border-r border-slate-300 w-14 text-center">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Uraian Arus Kas Entitas BUMDes</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-36 text-center">Klasifikasi Aktivitas</th>
                      <th className="py-2.5 px-3 text-right w-44">Jumlah Kas (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* I. AKTIVITAS OPERASIONAL */}
                    <tr className="bg-slate-50/80 font-bold text-slate-800">
                      <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-[#6777ef]">
                        I. ARUS KAS DARI AKTIVITAS OPERASIONAL
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">1.1</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                        Penerimaan Kas dari Pelanggan & Pendapatan Operasional Usaha
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Arus Kas Masuk</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        +{formatRupiah(lak.operasi?.masuk || 0)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">1.2</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                        Pengeluaran Kas untuk Pembayaran Beban Operasional, Gaji & Pemeliharaan
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Arus Kas Keluar</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-500">
                        -{formatRupiah(lak.operasi?.keluar || 0)}
                      </td>
                    </tr>
                    <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                        Arus Kas Bersih yang Diperoleh dari Aktivitas Operasi (A)
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${(lak.operasi?.bersih || 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {formatRupiah(lak.operasi?.bersih || 0)}
                      </td>
                    </tr>

                    {/* II. AKTIVITAS INVESTASI */}
                    <tr className="bg-slate-50/80 font-bold text-slate-800">
                      <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-[#6777ef]">
                        II. ARUS KAS DARI AKTIVITAS INVESTASI
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">2.1</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                        Penerimaan dari Penjualan / Pelepasan Aset Tetap
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Arus Kas Masuk</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        +{formatRupiah(lak.investasi?.masuk || 0)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">2.2</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                        Pengeluaran Kas untuk Pembelian / Pengadaan Aset Tetap & Peralatan
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Arus Kas Keluar</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-500">
                        -{formatRupiah(lak.investasi?.keluar || 0)}
                      </td>
                    </tr>
                    <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                        Arus Kas Bersih yang Digunakan untuk Aktivitas Investasi (B)
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${(lak.investasi?.bersih || 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {formatRupiah(lak.investasi?.bersih || 0)}
                      </td>
                    </tr>

                    {/* III. AKTIVITAS PENDANAAN */}
                    <tr className="bg-slate-50/80 font-bold text-slate-800">
                      <td colSpan={4} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wide text-[11px] text-[#6777ef]">
                        III. ARUS KAS DARI AKTIVITAS PENDANAAN
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">3.1</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                        Penerimaan dari Tambahan Penyertaan Modal Desa / Masyarakat
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Arus Kas Masuk</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                        +{formatRupiah(lak.pendanaan?.masuk || 0)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">3.2</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium pl-6">
                        Pengeluaran Kas untuk Penyetoran PADes / Pembagian SHU
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Arus Kas Keluar</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-500">
                        -{formatRupiah(lak.pendanaan?.keluar || 0)}
                      </td>
                    </tr>
                    <tr className="bg-slate-100/70 font-bold border-t border-b border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 border-r border-slate-300 text-slate-800 uppercase tracking-wider text-right pr-4">
                        Arus Kas Bersih yang Digunakan untuk Aktivitas Pendanaan (C)
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black ${(lak.pendanaan?.bersih || 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {formatRupiah(lak.pendanaan?.bersih || 0)}
                      </td>
                    </tr>

                    {/* REKONSILIASI KAS */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td colSpan={3} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-[11px] text-slate-800">
                        KENAIKAN / (PENURUNAN) BERSIH KAS & SETARA KAS (A + B + C)
                      </td>
                      <td className={`py-2 px-3 text-right font-mono text-xs font-black ${(lak.kenaikanKasBersih || 0) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {(lak.kenaikanKasBersih || 0) >= 0 ? "+" : ""}{formatRupiah(lak.kenaikanKasBersih || 0)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={3} className="py-2 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-[11px] text-slate-600">
                        SALDO AWAL KAS & SETARA KAS (PER 1 JANUARI {year})
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-xs font-black text-slate-800">
                        {formatRupiah(lak.saldoKasAwal || 0)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/80 font-black border-t-2 border-b-2 border-slate-800 text-slate-900">
                      <td colSpan={3} className="py-3 px-3 border-r border-slate-300 uppercase tracking-wider text-right pr-4 text-xs sm:text-sm text-emerald-800">
                        SALDO AKHIR KAS & SETARA KAS PER 31 DESEMBER {year}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm sm:text-base font-black text-emerald-700">
                        {formatRupiah(lak.saldoKasAkhir || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {renderPageFooter(6)}
          </div>

          {/* ========================================================= */}
          {/* HALAMAN 7: 6. CATATAN ATAS LAPORAN KEUANGAN (CaLK)        */}
          {/* (PERSIS DENGAN AREA CETAK MENU CaLK TERBARU)              */}
          {/* ========================================================= */}
          <div className="report-a4-page page-break">
            <div className="space-y-4">
              {renderReportKop("CATATAN ATAS LAPORAN KEUANGAN (CaLK)", "Standar Kepmendesa PDTT No. 136 Tahun 2022 & SAK EMKM")}

              <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-1">1. INFORMASI UMUM ENTITAS</h3>
                  <p className="text-justify text-[11px] leading-relaxed text-slate-600">
                    {bumdesName} didirikan berdasarkan Peraturan Desa Nomor 02 Tahun 2021 sesuai amanat Undang-Undang No. 6 Tahun 2014 tentang Desa serta Peraturan Pemerintah No. 11 Tahun 2021 tentang Badan Usaha Milik Desa. BUM Desa ini beralamat di {bumdesAddress}.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-1">2. KEBIJAKAN AKUNTANSI PENTING</h3>
                  <p className="text-[11px] text-slate-600 mb-1.5 leading-relaxed">
                    Laporan keuangan disusun berdasarkan Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM) dan Keputusan Menteri Desa, PDT, dan Transmigrasi No. 136 Tahun 2022.
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-[10.5px] text-slate-600">
                    <li><strong>Dasar Penyusunan:</strong> Berdasarkan konsep biaya historis dan asas akrual untuk laba rugi serta asas kas untuk laporan arus kas.</li>
                    <li><strong>Kas dan Setara Kas:</strong> Mencakup uang tunai di bendahara dan simpanan pada rekening perbankan resmi yang likuid tanpa batasan penarikan.</li>
                    <li><strong>Piutang Usaha:</strong> Dinyatakan sebesar nilai tagihan bruto yang belum diterima dari mitra/pelanggan per akhir periode pelaporan.</li>
                    <li><strong>Aset Tetap & Penyusutan:</strong> Dinyatakan sebesar harga perolehan dikurangi akumulasi penyusutan menggunakan metode garis lurus (*straight-line method*).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-2">3. RINCIAN POS-POS LAPORAN POSISI KEUANGAN (NERACA)</h3>
                  
                  {/* A. ASET LANCAR */}
                  <div className="mb-3">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      A. Aset Lancar (Kas, Piutang, Persediaan)
                    </h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-1.5 px-3 text-left">Komponen Aset Lancar</th>
                            <th className="py-1.5 px-3 text-right">Nilai Tercatat (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentAssetsList.map((a: any, i: number) => (
                            <tr key={i}>
                              <td className="py-1.5 px-3 text-slate-700">{a.name}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(a.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50/70 font-bold">
                            <td className="py-1.5 px-3 text-slate-900">Total Aset Lancar</td>
                            <td className="py-1.5 px-3 text-right font-mono text-emerald-600 font-black">
                              {formatRupiah(neraca.totalCurrentAssets || currentAssetsList.reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* B. ASET TETAP */}
                  <div className="mb-3">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      B. Aset Tetap & Akumulasi Penyusutan
                    </h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="py-1.5 px-3 text-slate-700">Nilai Perolehan Aset Tetap (Peralatan, Mesin, Gedung, Meubelair)</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(neraca.fixedAssets?.peralatan || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 px-3 text-slate-700">Akumulasi Penyusutan Aset Tetap</td>
                            <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-600">({formatRupiah(neraca.fixedAssets?.akumulasiPenyusutan || 0)})</td>
                          </tr>
                          <tr className="bg-slate-50/70 font-bold">
                            <td className="py-1.5 px-3 text-slate-900">Nilai Buku Bersih Aset Tetap</td>
                            <td className="py-1.5 px-3 text-right font-mono text-emerald-600 font-black">{formatRupiah(neraca.fixedAssets?.net || 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* C. KEWAJIBAN & EKUITAS */}
                  <div className="mb-3">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wide mb-1.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                      C. Kewajiban & Ekuitas Pemilik
                    </h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-100">
                          {liabilitiesList.map((l: any, i: number) => (
                            <tr key={`l-${i}`}>
                              <td className="py-1.5 px-3 text-slate-700">{l.name}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(l.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50/50 font-semibold text-slate-800">
                            <td className="py-1.5 px-3">Total Kewajiban</td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              {formatRupiah(neraca.totalLiabilities || liabilitiesList.reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0))}
                            </td>
                          </tr>
                          {equityList.map((e: any, i: number) => (
                            <tr key={`e-${i}`}>
                              <td className="py-1.5 px-3 text-slate-700">{e.name}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">{formatRupiah(e.amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-bold">
                            <td className="py-1.5 px-3 text-slate-900">Total Ekuitas</td>
                            <td className="py-1.5 px-3 text-right font-mono text-emerald-600 font-black">
                              {formatRupiah(neraca.totalEquity || equityList.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0))}
                            </td>
                          </tr>
                          <tr className="bg-emerald-50 text-emerald-800 font-black">
                            <td className="py-2 px-3">TOTAL KEWAJIBAN & EKUITAS (SEIMBANG DENGAN TOTAL ASET)</td>
                            <td className="py-2 px-3 text-right font-mono text-xs font-black">
                              {formatRupiah(neraca.totalLiabilitiesAndEquity || ((neraca.totalLiabilities || 0) + (neraca.totalEquity || 0)))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-1">4. KINERJA OPERASIONAL LABA RUGI</h3>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-slate-200">
                      <span>Total Pendapatan Usaha (Omzet)</span>
                      <span className="font-mono font-bold text-emerald-600">{formatRupiah(labaRugi.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-slate-200">
                      <span>Total Beban Operasional & Usaha</span>
                      <span className="font-mono font-bold text-rose-600">{formatRupiah(labaRugi.totalExpense)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-slate-900">
                      <span>Sisa Hasil Usaha / Laba Bersih Tahun Berjalan (SHU)</span>
                      <span className="font-mono text-[#6777ef] text-xs font-black">{formatRupiah(labaRugi.netProfit)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-1">5. RINGKASAN EKSEKUTIF KINERJA & EVALUASI USAHA (MUSDES)</h3>
                  <p className="text-justify text-[11px] leading-relaxed text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    Berdasarkan hasil pembukuan standar Kepmendesa No. 136 Tahun 2022, pada Tahun Anggaran {year} BUM Desa membukukan realisasi pendapatan sebesar {formatRupiah(labaRugi.totalRevenue)} dan realisasi beban sebesar {formatRupiah(labaRugi.totalExpense)}, sehingga menghasilkan {labaRugi.netProfit >= 0 ? "Sisa Hasil Usaha (SHU) positif" : "defisit operasional"} sebesar {formatRupiah(Math.abs(labaRugi.netProfit))}. Kinerja keuangan ini menjadi dasar alokasi Pendapatan Asli Desa (PADes) serta rencana kerja penguatan unit usaha tahun anggaran berikutnya.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 mb-1">6. PERTANGGUNGJAWABAN & PENGESAHAN</h3>
                  <p className="text-justify text-[11px] leading-relaxed text-slate-600">
                    Laporan Keuangan ini telah disusun secara tertib, akuntabel, dan transparan berdasarkan bukti pembukuan yang sah, serta dipertanggungjawabkan dalam Musyawarah Desa (Musdes) Laporan Pertanggungjawaban (LPJ) BUM Desa Tahun Anggaran {year}.
                  </p>
                </div>
              </div>
            </div>

            {renderPageFooter(7)}
          </div>

          {/* ========================================================= */}
          {/* HALAMAN 8: LEMBAR PENGESAHAN RESMI MUSYAWARAH DESA (MUSDES)*/}
          {/* (4 PIHAK RESMI KEMENDES: BENDAHARA, DIREKTUR, BPD, KADES) */}
          {/* ========================================================= */}
          <div className="report-a4-page page-break">
            <div className="space-y-4">
              {renderReportKop(
                "LEMBAR PENGESAHAN LAPORAN PERTANGGUNGJAWABAN (LPJ)",
                "Dokumen Resmi Keputusan Musyawarah Desa (Musdes) Pertanggungjawaban Tahunan"
              )}

              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-center text-xs font-bold text-indigo-950">
                Disahkan dalam Forum Musyawarah Desa (Musdes) &bull; Balai Desa {villageName}, 15 Januari {year + 1}
              </div>

              <div className="text-justify text-xs text-slate-700 leading-relaxed px-4">
                Pada hari ini, <strong>Kamis tanggal Lima Belas bulan Januari tahun {year + 1}</strong>, bertempat di Balai Desa {villageName}, Kecamatan {subdistrictName}, Kabupaten {regencyName}, telah diselenggarakan <strong>Musyawarah Desa (Musdes) Pertanggungjawaban Tahunan BUM Desa {bumdesName}</strong> untuk Tahun Anggaran {year}. Seluruh berkas Laporan Keuangan (Laba Rugi, Posisi Keuangan/Neraca, Perubahan Ekuitas, Arus Kas, dan CaLK) serta Rencana Distribusi SHU telah dibahas bersama Pemerintah Desa, Badan Permusyawaratan Desa (BPD), Badan Pengawas, Pelaksana Operasional, dan tokoh masyarakat, dengan hasil: <strong>DITERIMA DAN DISAHKAN MENJADI DOKUMEN RESMI DESA</strong>.
              </div>

              {/* Tanda Tangan Baris 1: Pelaksana Operasional BUMDes */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Dibuat & Disusun oleh:</span>
                    <span className="font-bold text-slate-800 text-xs">Bendahara BUM Desa</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide text-xs">
                      {treasurerName}
                    </p>
                    <p className="text-[10px] text-slate-500">Bendahara BUMDes</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Dilaporkan & Dipertanggungjawabkan oleh:</span>
                    <span className="font-bold text-slate-800 text-xs">Direktur BUM Desa</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide text-xs">
                      {directorName}
                    </p>
                    <p className="text-[10px] text-slate-500">Direktur Utama BUMDes</p>
                  </div>
                </div>
              </div>

              {/* Tanda Tangan Baris 2: Pengawas & Pemerintah Desa */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs pt-6 border-t border-dashed border-slate-300">
                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Telah Diperiksa & Mengetahui:</span>
                    <span className="font-bold text-slate-800 text-xs">Badan Pengawas BUM Desa</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide text-xs">
                      {supervisorName}
                    </p>
                    <p className="text-[10px] text-slate-500">Ketua Badan Pengawas</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mengesahkan & Menyetujui:</span>
                    <span className="font-bold text-slate-800 text-xs">Kepala Desa {villageName}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline uppercase tracking-wide text-xs">
                      {villageHead}
                    </p>
                    <p className="text-[10px] text-slate-500">Kepala Desa selaku Penasihat</p>
                  </div>
                </div>
              </div>

              {/* Keterangan Stempel & Arsip */}
              <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-[10.5px] text-slate-500 italic">
                Dokumen ini merupakan lampiran wajib Laporan Penyelenggaraan Pemerintahan Desa (LPPD) dan arsip resmi Badan Permusyawaratan Desa (BPD) {villageName}.
              </div>
            </div>

            {renderPageFooter(8)}
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="no-print p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs flex-wrap gap-3">
          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Dokumen 8 halaman resmi siap dicetak ke printer atau disimpan sebagai PDF (Ctrl+P / Command+P)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#6777ef] hover:bg-[#5868e4] text-white font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer transition-all"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
