import React from "react"

export interface ReportHeaderProps {
  bumdesName: string
  villageName?: string
  subdistrictName?: string
  regencyName?: string
  address?: string
  logo?: string | null
  badgeText?: string
  year?: number | string
  title?: string
  subtitle?: string
  periodText?: string
  className?: string
}

/**
 * ReportHeader - Kop Resmi Dokumen Cetak Standar Kepmendes PDTT 136/2022
 * Menggunakan format <table> murni dengan inline-style anti-collapse untuk menjamin
 * posisi Logo di kiri, Teks Identitas di tengah/kiri, dan Badge Dokumen di kanan
 * TETAP sejajar horizontal secara konsisten saat diprint/PDF preview di semua browser.
 */
export default function ReportHeader({
  bumdesName,
  villageName = "Balongbesuk",
  subdistrictName = "Diwek",
  regencyName = "Jombang",
  address,
  logo,
  badgeText = "Kepmendes PDTT 136/2022",
  year,
  title,
  subtitle,
  periodText,
  className = ""
}: ReportHeaderProps) {
  const displayAddress = address || `Desa ${villageName}, Kecamatan ${subdistrictName}, Kabupaten ${regencyName}`
  const initial = bumdesName ? bumdesName.replace(/^BUMDES(A)?\s+/i, "").charAt(0).toUpperCase() : "B"

  return (
    <div className={`report-kop-container pb-4 mb-6 border-b-2 border-slate-800 ${className}`}>
      {/* 
        KOP TABLE: Struktur tabel dengan layout fixed menjamin Logo dan Identitas 
        tidak akan pernah melorot/stack ke bawah logo saat diprint ke PDF.
      */}
      <table
        className="report-kop-table w-full mb-1"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "none",
          tableLayout: "fixed"
        }}
      >
        <tbody>
          <tr style={{ border: "none" }}>
            {/* KOLOM LOGO */}
            <td
              style={{
                width: "74px",
                verticalAlign: "middle",
                textAlign: "left",
                padding: "0 12px 0 0",
                border: "none"
              }}
            >
              {logo ? (
                <img
                  src={logo}
                  alt="Logo BUMDes"
                  className="w-16 h-16 object-contain rounded-lg border border-slate-200 p-1"
                  style={{
                    width: "64px",
                    height: "64px",
                    objectFit: "contain",
                    display: "block",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    padding: "4px",
                    backgroundColor: "#ffffff"
                  }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center"
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "12px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    lineHeight: "64px"
                  }}
                >
                  {initial}
                </div>
              )}
            </td>

            {/* KOLOM IDENTITAS BUMDES */}
            <td
              style={{
                verticalAlign: "middle",
                textAlign: "left",
                padding: 0,
                border: "none"
              }}
            >
              <h1
                className="font-black text-xl text-slate-900 uppercase tracking-tight"
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 900,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.2
                }}
              >
                {bumdesName}
              </h1>
              <p
                className="text-xs text-slate-600 font-medium"
                style={{
                  margin: "3px 0 0 0",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#475569",
                  lineHeight: 1.3
                }}
              >
                Desa {villageName}, Kecamatan {subdistrictName}, Kabupaten {regencyName}
              </p>
              <p
                className="text-[11px] text-slate-500"
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "11px",
                  color: "#64748b",
                  lineHeight: 1.3
                }}
              >
                {displayAddress}
              </p>
            </td>

            {/* KOLOM BADGE DOKUMEN & TAHUN ANGGARAN */}
            <td
              style={{
                width: "190px",
                verticalAlign: "middle",
                textAlign: "right",
                padding: "0 0 0 12px",
                border: "none",
                whiteSpace: "nowrap"
              }}
            >
              {badgeText && (
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider inline-block"
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "4px",
                    backgroundColor: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "inline-block"
                  }}
                >
                  {badgeText}
                </span>
              )}
              {year && (
                <p
                  className="text-[11px] text-slate-500 mt-1 font-mono"
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "11px",
                    color: "#64748b",
                    fontFamily: "monospace"
                  }}
                >
                  TA: {year}
                </p>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* JUDUL DOKUMEN & SUBJUDUL */}
      {(title || subtitle || periodText) && (
        <div
          className="text-center mt-5"
          style={{
            textAlign: "center",
            marginTop: "18px"
          }}
        >
          {title && (
            <h2
              className="text-lg font-black text-slate-900 uppercase tracking-wide"
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 900,
                color: "#0f172a",
                textTransform: "uppercase",
                letterSpacing: "0.025em"
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className="text-sm font-bold text-slate-700 mt-1"
              style={{
                margin: "4px 0 0 0",
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155"
              }}
            >
              {subtitle}
            </p>
          )}
          {periodText && (
            <p
              className="text-xs text-slate-500 mt-0.5 italic"
              style={{
                margin: "4px 0 0 0",
                fontSize: "11px",
                color: "#64748b",
                fontStyle: "italic"
              }}
            >
              {periodText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
