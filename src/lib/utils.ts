import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalDateString(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function angkaKeKata(n: number): string {
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
  const num = Math.floor(Math.abs(n))
  if (num < 12) return satuan[num]
  if (num < 20) return angkaKeKata(num - 10) + " Belas"
  if (num < 100) return angkaKeKata(Math.floor(num / 10)) + " Puluh " + satuan[num % 10]
  if (num < 200) return "Seratus " + angkaKeKata(num - 100)
  if (num < 1000) return angkaKeKata(Math.floor(num / 100)) + " Ratus " + angkaKeKata(num % 100)
  if (num < 2000) return "Seribu " + angkaKeKata(num - 1000)
  if (num < 1000000) return angkaKeKata(Math.floor(num / 1000)) + " Ribu " + angkaKeKata(num % 1000)
  if (num < 1000000000) return angkaKeKata(Math.floor(num / 1000000)) + " Juta " + angkaKeKata(num % 1000000)
  if (num < 1000000000000) return angkaKeKata(Math.floor(num / 1000000000)) + " Miliar " + angkaKeKata(num % 1000000000)
  return angkaKeKata(Math.floor(num / 1000000000000)) + " Triliun " + angkaKeKata(num % 1000000000000)
}

export function terbilang(amount: number): string {
  if (amount === 0) return "Nol Rupiah"
  const hasil = angkaKeKata(amount).replace(/\s+/g, " ").trim()
  return `${hasil} Rupiah`
}

/**
 * Safely prints a DOM element in a separate window using native DOM cloneNode
 * without using document.write or raw innerHTML interpolation (eliminates CodeQL js/xss-through-dom).
 */
export function safePrintElement(
  elementOrId: HTMLElement | string | null,
  documentTitle: string = "Dokumen Cetak BUMDes",
  options?: {
    customPageMargin?: string
    includeTailwindScript?: boolean
    baseHref?: string
    orientation?: "portrait" | "landscape"
  }
) {
  if (!elementOrId) return

  let element: HTMLElement | null = null
  if (typeof elementOrId === "string") {
    element = document.getElementById(elementOrId) || (document.querySelector(elementOrId) as HTMLElement | null)
  } else {
    element = elementOrId
  }

  if (!element) return

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    window.print()
    return
  }

  const printDoc = printWindow.document
  printDoc.title = documentTitle

  // Safely clone document head stylesheets
  const head = printDoc.head
  const metaCharset = printDoc.createElement("meta")
  metaCharset.setAttribute("charset", "utf-8")
  head.appendChild(metaCharset)

  const baseHref = options?.baseHref || (typeof window !== "undefined" && window.location?.origin ? `${window.location.origin}/` : "/")
  const baseTag = printDoc.createElement("base")
  baseTag.setAttribute("href", baseHref)
  head.appendChild(baseTag)

  const metaViewport = printDoc.createElement("meta")
  metaViewport.setAttribute("name", "viewport")
  metaViewport.setAttribute("content", "width=device-width, initial-scale=1.0")
  head.appendChild(metaViewport)

  // Copy existing document styles directly into print window head
  try {
    const inlineStyles = printDoc.createElement("style")
    let aggregatedCss = ""
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach((rule) => {
            aggregatedCss += rule.cssText + "\n"
          })
        }
      } catch {
        // Cross-origin stylesheet access might fail silently
      }
    })
    if (aggregatedCss) {
      inlineStyles.textContent = aggregatedCss
      head.appendChild(inlineStyles)
    }
  } catch {}

  if (options?.includeTailwindScript) {
    const tailwindScript = printDoc.createElement("script")
    tailwindScript.src = "https://cdn.tailwindcss.com"
    head.appendChild(tailwindScript)
  } else {
    const tailwindLink = printDoc.createElement("link")
    tailwindLink.rel = "stylesheet"
    tailwindLink.href = "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
    head.appendChild(tailwindLink)
  }

  document.querySelectorAll("link[rel='stylesheet'], style").forEach((node) => {
    head.appendChild(node.cloneNode(true))
  })

  const pageMargin = options?.customPageMargin || "12mm"
  const orientation = options?.orientation || "portrait"
  const customStyle = printDoc.createElement("style")
  customStyle.textContent = `
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: #fff !important; margin: 0; padding: 0; }
      @page { size: A4 ${orientation}; margin: ${pageMargin}; }
      .no-print, .print\\:hidden { display: none !important; }
      table { width: 100% !important; border-collapse: collapse !important; }
      table.report-kop-table, .report-kop-table { width: 100% !important; border-collapse: collapse !important; border: none !important; margin-bottom: 16px !important; }
      table.report-kop-table td, .report-kop-table td { border: none !important; }
      th, td { word-break: normal; }
      thead { display: table-header-group; }
      tfoot { display: table-row-group !important; }
      tr { page-break-inside: avoid; break-inside: avoid; }
      .signature-block, .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
      img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #fff; color: #1e293b; padding: 20px; }
    table.report-kop-table, .report-kop-table { width: 100% !important; border-collapse: collapse !important; border: none !important; margin-bottom: 16px !important; }
    table.report-kop-table td, .report-kop-table td { border: none !important; }
  `
  head.appendChild(customStyle)

  // Safely clone element node without parsing strings into innerHTML or document.write
  const body = printDoc.body
  body.innerHTML = ""
  body.appendChild(element.cloneNode(true))

  // Trigger print cleanly after images are loaded
  let printed = false
  const triggerPrint = () => {
    if (!printed) {
      printed = true
      try {
        printWindow.focus()
        printWindow.print()
      } catch {}
    }
  }

  // Check if all images inside print document are complete
  const images = Array.from(printDoc.images)
  if (images.length === 0) {
    setTimeout(triggerPrint, 350)
  } else {
    const imagePromises = images.map((img) => {
      if (img.complete) return Promise.resolve(true)
      return new Promise((resolve) => {
        img.onload = () => resolve(true)
        img.onerror = () => resolve(true)
      })
    })
    Promise.all(imagePromises).then(() => {
      setTimeout(triggerPrint, 350)
    })
  }

  printWindow.onload = () => {
    setTimeout(triggerPrint, 500)
  }

  // Failsafe timeout
  setTimeout(triggerPrint, 1500)
}
