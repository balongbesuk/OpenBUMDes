import { GoogleGenAI, Type } from "@google/genai"
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

  let targetAccount = proofType === "BKM" ? "4.1.04.01" : "6.1.02.99"
  let cashFlowGroup = "Aktivitas Operasi"
  let unitName = "Operasional Kantor"

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
  } else if (lower.includes("konsumsi") || lower.includes("makan") || lower.includes("snack") || lower.includes("rapat") || lower.includes("bakso") || lower.includes("nasi") || lower.includes("kue")) {
    targetAccount = "6.1.02.03" // Beban Konsumsi Rapat (Standar Kepmendes 136)
    unitName = "Operasional Kantor"
  } else if (lower.includes("atk") || lower.includes("kertas") || lower.includes("alat tulis") || lower.includes("cetak") || lower.includes("fotocopy")) {
    targetAccount = "6.1.02.01" // Beban Alat Tulis Kantor
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
 * Filter Otomatis Bagan Akun (COA):
 * 1. Menyingkirkan akun penyesuaian non-kas akhir tahun (akumulasi penyusutan, ikhtisar laba rugi, utang obligasi, dsb).
 * 2. Mengurutkan akun yang terbukti aktif/sering digunakan di database desa ke posisi paling atas dengan label [Akun Favorit Desa].
 */
export function getSmartFilteredCOA(accounts: any[], activeAccountCodes: Set<string> = new Set()) {
  return accounts
    .filter(a => {
      const name = a.name.toLowerCase()
      // Saring keluar akun penyesuaian non-kas & kontra aset
      if (
        name.includes("akumulasi penyusutan") ||
        name.includes("akumulasi amortisasi") ||
        name.includes("ikhtisar laba rugi") ||
        a.code.startsWith("1.3.02") ||
        a.code.startsWith("1.4") ||
        a.code.startsWith("1.9") ||
        a.code.startsWith("2.2") ||
        a.code.startsWith("3.4") ||
        a.code.startsWith("3.8") ||
        a.code.startsWith("3.9") ||
        a.code.startsWith("6.2") ||
        a.code.startsWith("6.3")
      ) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const aActive = activeAccountCodes.has(a.code) ? 1 : 0
      const bActive = activeAccountCodes.has(b.code) ? 1 : 0
      if (bActive !== aActive) return bActive - aActive
      return a.code.localeCompare(b.code)
    })
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

  // 1. Ambil statistik akun yang pernah dipakai di database secara otomatis
  let activeAccountCodes = new Set<string>()
  try {
    const usage = await db.journalLine.groupBy({
      by: ["accountCode"],
      _count: { accountCode: true },
      orderBy: { _count: { accountCode: "desc" } },
      take: 30
    })
    activeAccountCodes = new Set(usage.map(u => u.accountCode))
  } catch (err) {
    console.warn("Gagal mengambil statistik pemakaian akun:", err)
  }

  // 2. Ambil hingga 5 riwayat transaksi yang pernah dibuat di database sebagai pembelajaran (Few-Shot Dinamis)
  let exampleContext = ""
  try {
    const recentEntries = await db.journalEntry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { lines: true }
    })

    if (recentEntries.length > 0) {
      const formattedRecent = recentEntries
        .filter(e => e.lines && e.lines.length > 0)
        .map((e, idx) => {
          const lineSummary = e.lines
            .map(l => `${l.type} ${l.accountCode} (${l.amount})`)
            .join(", ")
          return `Contoh Riil ${idx + 1}: "${e.description}" -> Jenis: ${e.proofType}, Pihak: ${e.payeeOrPayer}, Jurnal: [${lineSummary}]`
        })
        .join("\n")
      if (formattedRecent) {
        exampleContext = `\n\nCONTOH RIIL JURNAL YANG PERNAH DIBUAT DI BUM DESA INI (PELAJARI POLA AKUN DAN GAYA INI):\n${formattedRecent}`
      }
    }
  } catch (err) {
    console.warn("Gagal mengambil riwayat transaksi untuk few-shot:", err)
  }

  // Jika belum ada riwayat transaksi di database, gunakan contoh standar Kepmendes 136
  if (!exampleContext) {
    exampleContext = `\n\nCONTOH STANDAR TRANSAKSI KEPMENDES 136:
Contoh 1: "Beli kertas HVS dan spidol kantor 65rb bayar tunai" -> Jenis: BKK, Pihak: Toko ATK, DEBIT 6.1.02.01 (Beban ATK), KREDIT 1.1.01.01 (Kas Tunai)
Contoh 2: "Terima sewa kios pasar dari Pak Budi 500rb tunai" -> Jenis: BKM, Pihak: Pak Budi, DEBIT 1.1.01.01 (Kas Tunai), KREDIT 4.1.04.02 (Pendapatan Sewa Kios)
Contoh 3: "Bayar wifi dan listrik kantor 250rb transfer bank" -> Jenis: BKK, Pihak: Telkom/PLN, DEBIT 6.1.04.01 (Beban Listrik & Air), KREDIT 1.1.01.02 (Kas Bank)
Contoh 4: "Setor PADes bagi hasil SHU ke kas desa 5jt" -> Jenis: BKK, Pihak: Pemerintah Desa, DEBIT 3.3.01.01 (Alokasi PADes), KREDIT 1.1.01.02 (Kas Bank)`
  }

  // 3. Filter otomatis COA: buang akun penyesuaian non-kas & prioritaskan akun aktif desa
  const filteredAccounts = getSmartFilteredCOA(accounts, activeAccountCodes)
  const coaContext = filteredAccounts
    .map(a => {
      const tag = activeAccountCodes.has(a.code) ? " [Akun Favorit Desa]" : ""
      return `[${a.code}] ${a.name} (${a.type})${tag}`
    })
    .join("\n")

  const systemInstruction = `Anda adalah akuntan ahli BUM Desa yang mengonversi catatan transaksi harian bahasa santai operator desa menjadi jurnal akuntansi standar Kepmendesa PDTT No. 136 Tahun 2022 (PPAK BUMDesa).

DAFTAR BAGAN AKUN (COA) BUM DESA:
${coaContext}
${exampleContext}

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
8. Tentukan kelompok LAK (Laporan Arus Kas) yang sesuai (Aktivitas Operasi, Aktivitas Investasi, Aktivitas Pendanaan).`

  const modelSetting = await db.setting.findUnique({ where: { key: "gemini_model" } })
  const chosenModel = modelSetting?.value?.trim() || "gemini-3.5-flash-lite"

  const ai = new GoogleGenAI({ apiKey })
  const candidateModels = [chosenModel, "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"].filter(
    (v, i, a) => a.indexOf(v) === i
  )

  // Skema JSON terstruktur (Structured Output) untuk akurasi 100% tanpa halusinasi format
  const transactionResponseSchema = {
    type: Type.OBJECT,
    properties: {
      proofType: {
        type: Type.STRING,
        enum: ["BKM", "BKK"],
        description: "BKM untuk Kas Masuk, BKK untuk Kas Keluar"
      },
      description: {
        type: Type.STRING,
        description: "Keterangan transaksi ringkas dan formal"
      },
      payeeOrPayer: {
        type: Type.STRING,
        description: "Nama pihak ketiga, penyetor, penerima, atau toko"
      },
      unitName: {
        type: Type.STRING,
        description: "Unit usaha yang bersangkutan"
      },
      totalAmount: {
        type: Type.NUMBER,
        description: "Total nominal transaksi dalam Rupiah"
      },
      cashAccount: {
        type: Type.STRING,
        description: "Kode akun kas/bank, default 1.1.01.01 (Kas Tunai)"
      },
      targetAccount: {
        type: Type.STRING,
        description: "Kode akun lawan transaksi sesuai COA"
      },
      cashFlowGroup: {
        type: Type.STRING,
        enum: ["Aktivitas Operasi", "Aktivitas Investasi", "Aktivitas Pendanaan"],
        description: "Kelompok arus kas"
      },
      lines: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            accountCode: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["DEBIT", "CREDIT"] },
            amount: { type: Type.NUMBER }
          },
          required: ["accountCode", "type", "amount"]
        }
      }
    },
    required: [
      "proofType",
      "description",
      "payeeOrPayer",
      "unitName",
      "totalAmount",
      "cashAccount",
      "targetAccount",
      "cashFlowGroup",
      "lines"
    ]
  }

  for (const model of candidateModels) {
    try {
      const config: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: transactionResponseSchema
      }

      // Model Gemini 3.8 memiliki fitur 'Thinking/Reasoning'. Batasi ke level 'low' agar tidak berpikir berlarut-larut (1-2 detik)
      if (model.includes("3.8")) {
        config.thinkingConfig = {
          thinkingLevel: "low"
        }
      }

      const response = await ai.models.generateContent({
        model,
        contents: userText,
        config
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
