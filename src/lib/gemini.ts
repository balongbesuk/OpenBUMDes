import { GoogleGenAI } from "@google/genai"
import { db } from "./db"

/**
 * Smart Rule-Based NLP Parser untuk Transaksi BUMDes (Kepmendes 136/2022)
 * Bekerja 100% Offline, hemat kuota token, 0ms latency, tanpa butuh API Key.
 */
export function parseTransactionOffline(userText: string, accounts: any[] = []) {
  const text = userText.trim()
  const lower = text.toLowerCase()

  // 1. Ekstraksi Nominal Uang secara aman (Linear O(N) regex tanpa backtracking)
  let totalAmount = 0
  const m1 = lower.match(/\b(\d+(?:[.,]\d+)?)\s*(miliar|milyar|jt|juta|rb|ribu|k)\b/)
  if (m1) {
    let val = parseFloat(m1[1].replace(",", "."))
    const unit = m1[2].toLowerCase()
    if (unit.startsWith("m")) val *= 1000000000
    else if (unit === "jt" || unit === "juta") val *= 1000000
    else if (unit === "rb" || unit === "ribu" || unit === "k") val *= 1000
    totalAmount = Math.round(val)
  } else {
    const m2 = lower.match(/\b\d{1,3}(?:\.\d{3})+(?:,\d+)?\b/)
    if (m2) {
      totalAmount = parseInt(m2[0].replace(/\./g, ""), 10)
    } else {
      const m3 = lower.match(/\b\d{4,12}\b/)
      if (m3) totalAmount = parseInt(m3[0], 10)
    }
  }

  // 2. Deteksi Jenis Bukti (BKM: Kas Masuk vs BKK: Kas Keluar)
  const isBKMKeywords = [
    "terima", "penerimaan", "pemasukan", "dapat", "masuk", "setoran",
    "modal", "penjualan", "hasil", "retribusi", "bagi hasil", "laba"
  ]
  const isBKKKeywords = [
    "beli", "pembelian", "bayar", "pembayaran", "keluar", "pengeluaran",
    "ongkos", "biaya", "beban", "honor", "gaji", "servis", "perbaikan",
    "listrik", "wifi", "internet", "air", "pdam", "atk", "konsumsi",
    "snack", "pajak", "sewa perlengkapan"
  ]

  let bkmScore = isBKMKeywords.filter(k => lower.includes(k)).length
  let bkkScore = isBKKKeywords.filter(k => lower.includes(k)).length
  let proofType = bkmScore >= bkkScore ? "BKM" : "BKK"

  // Kasus Khusus: Setor PADes / Bagi Hasil SHU ke Desa adalah KAS KELUAR (BKK) bagi BUMDes
  const isPADesPayout = lower.includes("pad") || lower.includes("pades") || lower.includes("bagi shu") || lower.includes("pembagian shu")

  if (isPADesPayout || lower.includes("beli") || lower.includes("bayar") || lower.includes("beban")) {
    proofType = "BKK"
  } else if (lower.includes("terima") || lower.includes("pemasukan") || lower.includes("setoran")) {
    proofType = "BKM"
  }

  // 3. Ekstraksi Pihak (Penyetor / Penerima / Toko / Warga) tanpa ReDoS (Linear token scan)
  let payeeOrPayer = proofType === "BKM" ? "Masyarakat / Pelanggan" : "Pihak Ketiga"
  if (isPADesPayout) {
    payeeOrPayer = "Pemerintah Desa"
  } else {
    const partyKeywords = ["dari ", "kepada ", "ke ", "oleh ", "pihak "]
    for (const kw of partyKeywords) {
      const idx = lower.indexOf(kw)
      if (idx !== -1) {
        const afterKeyword = text.slice(idx + kw.length).trim()
        const stopKeywords = [" sebesar", " sejumlah", " rp", " tunai", " melalui", " untuk", " per ", " bulan"]
        let cutIndex = afterKeyword.length
        for (const sk of stopKeywords) {
          const sIdx = afterKeyword.toLowerCase().indexOf(sk)
          if (sIdx !== -1 && sIdx < cutIndex) {
            cutIndex = sIdx
          }
        }
        const candidate = afterKeyword.slice(0, cutIndex).replace(/^[^\w]+|[^\w]+$/g, "").trim()
        if (candidate.length > 1 && candidate.length <= 50) {
          payeeOrPayer = candidate
          break
        }
      }
    }
  }

  // 4. Deteksi Akun Kas & Akun Lawan Standar Kepmendes 136
  let cashAccount = "1.1.01.01" // Kas Tunai BUMDes
  if (lower.includes("bank") && (lower.includes("transfer") || lower.includes("rekening"))) {
    // Cari akun bank di daftar akun jika ada
    const bankAcc = accounts.find(a => a.code.startsWith("1.1.01") && a.code !== "1.1.01.01")
    cashAccount = bankAcc ? bankAcc.code : "1.1.01.02"
  }

  let targetAccount = proofType === "BKM" ? "4.1.04.01" : "5.1.02.01"
  let cashFlowGroup = "Aktivitas Operasi"
  let unitName = "Umum"

  if (isPADesPayout) {
    // Penyerahan bagian laba / PADes ke Kas Desa (Akun Ekuitas / Saldo Laba Ditahan)
    const padesAcc = accounts.find(a => a.code === "3.3.01.01" || a.code.startsWith("3.3") || a.name.toLowerCase().includes("laba"))
    targetAccount = padesAcc ? padesAcc.code : "3.3.01.01"
    cashFlowGroup = "Aktivitas Pendanaan"
    unitName = "Pemerintah Desa"
  } else if (lower.includes("rest area") || lower.includes("lapak") || lower.includes("kios") || lower.includes("sewa")) {
    targetAccount = lower.includes("gedung") ? "4.1.04.01" : "4.1.04.02"
    unitName = lower.includes("rest area") ? "Rest Area" : "Sewa & Properti"
  } else if (lower.includes("modal") || lower.includes("apbdes")) {
    targetAccount = "3.1.01.01" // Penyertaan Modal Desa
    cashFlowGroup = "Aktivitas Pendanaan"
    unitName = "Pemerintah Desa"
  } else if (lower.includes("jual") || lower.includes("dagang") || lower.includes("toko") || lower.includes("sembako")) {
    targetAccount = proofType === "BKM" ? "4.1.01.01" : "5.1.01.01"
    unitName = "Unit Perdagangan"
  } else if (lower.includes("jasa") || lower.includes("wisata") || lower.includes("sampah") || lower.includes("parkir")) {
    targetAccount = "4.1.03.01"
    unitName = "Jasa & Layanan"
  } else if (lower.includes("atk") || lower.includes("kertas") || lower.includes("kantor") || lower.includes("konsumsi")) {
    targetAccount = "5.1.02.01"
    unitName = "Operasional Kantor"
  } else if (lower.includes("listrik") || lower.includes("wifi") || lower.includes("internet") || lower.includes("air") || lower.includes("pln")) {
    targetAccount = "6.1.04.01"
    unitName = "Operasional Kantor"
  } else if (lower.includes("gaji") || lower.includes("honor") || lower.includes("upah") || lower.includes("insentif")) {
    targetAccount = "6.1.01.01"
    unitName = "SDM Pengelola"
  } else if (lower.includes("servis") || lower.includes("perbaikan") || lower.includes("pemeliharaan")) {
    targetAccount = "6.1.03.01"
    unitName = "Operasional Kantor"
  } else if (lower.includes("laptop") || lower.includes("komputer") || lower.includes("mesin") || lower.includes("kendaraan") || lower.includes("peralatan")) {
    targetAccount = "1.3.01.03"
    cashFlowGroup = "Aktivitas Investasi"
    unitName = "Inventaris & Aset"
  }

  // Verifikasi apakah targetAccount ada di database
  if (accounts.length > 0) {
    const exists = accounts.find(a => a.code === targetAccount)
    if (!exists) {
      // Cari fallback akun sejenis
      const prefix = targetAccount.slice(0, 4)
      const fallback = accounts.find(a => a.code.startsWith(prefix))
      if (fallback) targetAccount = fallback.code
    }
  }

  // Uraian transaksi ringkas (Safe linear replace)
  let description = text
    .replace(/\b(?:sebesar|sejumlah|rp\.?)\b\s*[\d.,]+/gi, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:miliar|milyar|jt|juta|rb|ribu|k)\b/gi, "")
    .replace(/\b\d{4,12}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
  if (description) {
    description = description.charAt(0).toUpperCase() + description.slice(1)
  } else {
    description = proofType === "BKM" ? "Penerimaan kas BUMDes" : "Pengeluaran operasional BUMDes"
  }

  // Baris Jurnal Berpasangan (Double Entry)
  let lines: any[] = []
  if (proofType === "BKM") {
    lines = [
      { accountCode: cashAccount, type: "DEBIT", amount: totalAmount },
      { accountCode: targetAccount, type: "CREDIT", amount: totalAmount }
    ]
  } else {
    lines = [
      { accountCode: targetAccount, type: "DEBIT", amount: totalAmount },
      { accountCode: cashAccount, type: "CREDIT", amount: totalAmount }
    ]
  }

  return {
    proofType,
    description,
    payeeOrPayer,
    unitName,
    totalAmount,
    cashAccount,
    targetAccount,
    cashFlowGroup,
    lines,
    engine: "OFFLINE_RULES"
  }
}

/**
 * Parser Hybrid:
 * 1. Jika API Key ada -> Gunakan Gemini AI (Online).
 * 2. Jika API Key tidak ada atau error/kuota habis -> Otomatis beralih ke Rule-Based NLP (Offline).
 */
export async function parseTransactionWithGemini(userText: string) {
  const accounts = await db.ledgerAccount.findMany({
    select: { code: true, name: true, type: true }
  })

  const keySetting = await db.setting.findUnique({ where: { key: "gemini_api_key" } })
  const apiKey = keySetting?.value?.trim() || process.env.GEMINI_API_KEY

  // Jika operator belum mengisi API Key, gunakan parser offline aturan Kepmendes 136 langsung
  if (!apiKey) {
    return parseTransactionOffline(userText, accounts)
  }

  // Jika API Key tersedia, gunakan Google Gemini Generative AI
  const coaContext = accounts
    .map(a => `[${a.code}] ${a.name} (${a.type})`)
    .join("\n")

  const systemInstruction = `Anda adalah akuntan ahli BUM Desa yang mengonversi catatan transaksi harian bahasa santai operator desa menjadi jurnal akuntansi standar Kepmendesa PDTT No. 136 Tahun 2022 (PPAK BUMDesa).

DAFTAR BAGAN AKUN (COA) BUM DESA:
${coaContext}

ATURAN WAJIB:
1. Tentukan jenis transaksi: Kas Masuk (BKM) atau Kas Keluar (BKK).
2. Jika BKM: Akun kas (1.1.01.xx) di posisi DEBIT, akun lawan di posisi KREDIT.
3. Jika BKK: Akun beban/perlengkapan/aset/pengurang ekuitas di posisi DEBIT, akun kas (1.1.01.xx) di posisi KREDIT.
4. ATURAN KHUSUS SETOR PADES / BAGI HASIL SHU KE DESA:
   - Jika ada transaksi "Setor PAD", "Setor PADes", "Bagi hasil ke desa", atau "Pembagian SHU ke Pemdes", ini adalah KAS KELUAR (BKK) bagi BUMDes (karena uang kas BUMDes keluar disetor ke rekening kas desa).
   - Akun DEBIT: Saldo Laba Ditahan / Alokasi PADes (misal 3.3.01.01 atau akun ekuitas laba sejenis).
   - Akun KREDIT: Kas Tunai / Bank (1.1.01.xx).
   - Penerima (payeeOrPayer): "Pemerintah Desa". Kelompok LAK: "Aktivitas Pendanaan".
5. ATURAN KHUSUS DANA DARI DESA KE BUMDES:
   - Jika Pemerintah Desa memberikan/menyetor dana ke BUMDes, itu adalah KAS MASUK (BKM) untuk "Penyertaan Modal Desa" (3.1.01.01), BUKAN PAD.
6. Total nominal Debit dan Kredit harus selalu tepat dan seimbang.
7. Ekstrak nama Penyetor (untuk BKM) atau Penerima (untuk BKK).
8. Tentukan kelompok LAK (Laporan Arus Kas) yang sesuai (Operasi, Investasi, Pendanaan).

KEMBALIKAN OUTPUT HANYA BERUPA JSON VALID DENGAN FORMAT BERIKUT:
{
  "proofType": "BKM" atau "BKK",
  "description": "Keterangan transaksi ringkas dan jelas",
  "payeeOrPayer": "Nama orang atau toko atau masyarakat",
  "unitName": "Umum" atau nama pos (e.g. Sewa Gedung, Lapak, dll),
  "totalAmount": 150000,
  "cashAccount": "1.1.01.01",
  "targetAccount": "kode_akun_lawan",
  "cashFlowGroup": "Kelompok LAK",
  "lines": [
    { "accountCode": "kode_akun", "type": "DEBIT", "amount": 150000 },
    { "accountCode": "kode_akun", "type": "CREDIT", "amount": 150000 }
  ]
}`

  const modelSetting = await db.setting.findUnique({ where: { key: "gemini_model" } })
  const chosenModel = modelSetting?.value?.trim() || "gemini-3.5-flash-lite"

  const ai = new GoogleGenAI({ apiKey })
  const candidateModels = [chosenModel, "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"].filter(
    (v, i, a) => a.indexOf(v) === i
  )

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userText,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      })

      const text = response.text
      if (text) {
        const parsed = JSON.parse(text)
        return {
          ...parsed,
          engine: "GEMINI_AI",
          modelUsed: model
        }
      }
    } catch (err: any) {
      console.warn(`Model ${model} gagal, mencoba cadangan atau offline rule:`, err?.message || err)
    }
  }

  // Jika seluruh model Gemini gagal (misal kuota habis / offline), otomatis fallback ke offline rule
  console.log("Semua model AI gagal/offline, beralih ke Offline Rule-Based Engine.")
  const offlineResult = parseTransactionOffline(userText, accounts)
  return {
    ...offlineResult,
    engine: "OFFLINE_RULES"
  }
}
