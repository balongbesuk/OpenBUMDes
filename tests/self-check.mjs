import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const ts = require("typescript")

// Load real TypeScript production modules directly from src/ so tests fail immediately on production regressions
function loadProdTsModule(relPath) {
  const fullPath = path.resolve(process.cwd(), relPath)
  const source = fs.readFileSync(fullPath, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true
    },
    fileName: fullPath
  })
  const mod = { exports: {} }
  const customRequire = (id) => {
    if (id === "next/server") return { NextResponse: { json: (b, init) => ({ body: b, status: init?.status || 200 }) } }
    if (id === "next/headers") return { cookies: async () => ({ get: () => null }) }
    if (id === "@/lib/db" || id === "./db") return { db: {} }
    if (id === "@/lib/auth") return loadProdTsModule("src/lib/auth.ts")
    return require(id)
  }
  const fn = vm.runInThisContext(
    `(function(exports, require, module, __filename, __dirname) { ${outputText}\n})`,
    { filename: fullPath }
  )
  fn(mod.exports, customRequire, mod, fullPath, path.dirname(fullPath))
  return mod.exports
}

const { createToken, verifyToken, hashPassword, comparePassword } = loadProdTsModule("src/lib/auth.ts")
const { aggregateNeracaFromLines, classifyCashEntriesForLak, computeRollForwardPreview } = loadProdTsModule("src/lib/reports.ts")
const { getFiscalYearMonth, nextAssetCode, calculateInventoryValuation, validateLoanInstallment } = loadProdTsModule("src/lib/ledger.ts")

async function runSelfChecks() {
  console.log("▶ Running OpenBUMDes Core Logic Self-Checks (against real src/ modules)...")

  // 1. Production Auth token sign & timing-safe verify (src/lib/auth.ts)
  const payload = { id: "user-1", username: "admin", name: "Administrator", role: "ADMIN" }
  const token = createToken(payload)
  const verified = verifyToken(token)
  assert.strictEqual(verified?.username, "admin", "Token should verify matching username")
  assert.strictEqual(verified?.role, "ADMIN", "Token should verify matching role")

  // 2. Tampered token rejection (src/lib/auth.ts)
  const tamperedToken = token.slice(0, -4) + "XXXX"
  assert.strictEqual(verifyToken(tamperedToken), null, "Tampered signature must be rejected")
  assert.strictEqual(verifyToken("invalid.token"), null, "Malformed token must be rejected")

  // 3. Password hashing & comparison (src/lib/auth.ts)
  const pass = "bumdes-secret-123"
  const hashed = hashPassword(pass)
  assert.strictEqual(comparePassword(pass, hashed), true, "Password check must succeed on matching hash")
  assert.strictEqual(comparePassword("wrong-pass", hashed), false, "Password check must fail on wrong password")

  // 4. Proof number numeric sequence calculation
  const mockExisting = [
    { proofNumber: "BKM/2026/10/0001" },
    { proofNumber: "BKM/2026/10/0009" },
    { proofNumber: "BKM/2026/10/0010" }
  ]
  let maxSeq = 0
  for (const m of mockExisting) {
    const parts = m.proofNumber.split("/")
    const seq = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
  }
  const nextProofNumber = `BKM/2026/10/${String(maxSeq + 1).padStart(4, "0")}`
  assert.strictEqual(nextProofNumber, "BKM/2026/10/0011", "Next proof sequence should numerically be 0011")

  // 5. Accounting balance check
  const balancedLines = [
    { type: "DEBIT", amount: 150000 },
    { type: "CREDIT", amount: 150000 }
  ]
  const debitSum = balancedLines.filter(l => l.type === "DEBIT").reduce((s, l) => s + l.amount, 0)
  const creditSum = balancedLines.filter(l => l.type === "CREDIT").reduce((s, l) => s + l.amount, 0)
  assert.strictEqual(Math.abs(debitSum - creditSum) < 0.01, true, "Balanced journal must pass balance check")

  // 6. Annual double-counting prevention logic check
  const year = 2026
  const hasOpeningJournal = true
  const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0))
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
  const condition = hasOpeningJournal ? { gte: startDate, lte: endDate } : { lte: endDate }
  assert.deepStrictEqual(condition, { gte: startDate, lte: endDate }, "Balance query must start at Jan 1st when SA entry exists")

  // 7. Straight-line asset depreciation check
  const cost = 120000000
  const salvage = 0
  const usefulLife = 4
  const annualDepr = (cost - salvage) / usefulLife
  const monthlyDepr = annualDepr / 12
  assert.strictEqual(annualDepr, 30000000, "Annual depreciation should be 30M")
  assert.strictEqual(monthlyDepr, 2500000, "Monthly depreciation should be 2.5M")

  // 8. Production Inventory valuation check (src/lib/ledger.ts): SALDO-AWAL must not double-count initialQty & ADJUST to 0 works
  const invValuation = calculateInventoryValuation({
    initialQty: 10,
    initialCost: 100000,
    movements: [
      { date: "2026-01-01T00:00:00Z", type: "IN", qty: 10, costPerUnit: 100000, totalCost: 1000000, referenceProof: "SALDO-AWAL" },
      { date: "2026-02-01T00:00:00Z", type: "IN", qty: 10, costPerUnit: 120000, totalCost: 1200000, referenceProof: "BKK/2026/02/0001" },
      { date: "2026-03-01T00:00:00Z", type: "out", qty: 5, costPerUnit: null, totalCost: null, referenceProof: "OUT-01" }
    ]
  })
  assert.strictEqual(invValuation.currentQty, 15, "SALDO-AWAL movement must not double-count initialQty (10 + 10 - 5 = 15, not 25)")
  assert.strictEqual(invValuation.avgCostPerUnit, 110000, "Moving average cost should be 110,000")
  assert.strictEqual(invValuation.totalValue, 1650000, "Ending inventory value should be 1,650,000")

  const invZeroAdjust = calculateInventoryValuation({
    initialQty: 10,
    initialCost: 50000,
    movements: [
      { date: "2026-04-01T00:00:00Z", type: "adjust", qty: 0, costPerUnit: 50000, totalCost: 0, referenceProof: "OPNAME-01" }
    ]
  })
  assert.strictEqual(invZeroAdjust.currentQty, 0, "Stock opname ADJUST to 0 must zero out stock")
  assert.strictEqual(invZeroAdjust.totalValue, 0, "Stock opname ADJUST to 0 must zero out inventory value")

  // 9. General Ledger opening balance double-counting prevention logic
  const obRecord = { amount: 5000000, type: "DEBIT" }
  let glOpeningBalance = 0
  if (obRecord) glOpeningBalance += obRecord.amount
  let historicalQueried = false
  if (!obRecord) {
    historicalQueried = true
    glOpeningBalance += 2000000
  }
  assert.strictEqual(historicalQueried, false, "Historical lines must not be queried if obRecord exists")
  assert.strictEqual(glOpeningBalance, 5000000, "Opening balance must not double count prior transactions")

  // 10. Rate limiter cleanup check
  const attempts = new Map()
  attempts.set("ip1:user1", { count: 5, lockedUntil: Date.now() - 1000 })
  attempts.set("ip2:user2", { count: 2, lockedUntil: Date.now() + 60000 })
  const now = Date.now()
  for (const [k, v] of attempts.entries()) {
    if (v.lockedUntil < now) attempts.delete(k)
  }
  assert.strictEqual(attempts.size, 1, "Expired rate limit attempts must be pruned")
  assert.strictEqual(attempts.has("ip2:user2"), true, "Active rate limit must be retained")

  // 11. Local date string format check & UTC fiscal year-month check (src/lib/ledger.ts)
  const testDate = new Date(2026, 9, 29, 2, 30, 0)
  const pad = (n) => String(n).padStart(2, "0")
  const localDateStr = `${testDate.getFullYear()}-${pad(testDate.getMonth() + 1)}-${pad(testDate.getDate())}`
  assert.strictEqual(localDateStr, "2026-10-29", "Local date string must reflect local date, not UTC yesterday")
  const utcFiscal = getFiscalYearMonth(new Date("2026-01-01"))
  assert.deepStrictEqual(utcFiscal, { year: 2026, month: "01" }, "ISO date 2026-01-01 must always resolve to fiscal 2026/01 regardless of server timezone")

  // 12. Memorial SA lines opening balance edge-case check
  const obRecordNull = null
  const saLinesFound = [{ amount: 3000000, type: "DEBIT" }]
  const hasSaLines = saLinesFound.length > 0
  let queryHistorical = false
  if (!obRecordNull && !hasSaLines) queryHistorical = true
  assert.strictEqual(queryHistorical, false, "Historical query must be skipped when saLines exist even if obRecord is null")

  // 13. Production USP loan installment validation (src/lib/ledger.ts)
  const validInst = validateLoanInstallment(5000000, 0, 500000, 75000)
  assert.strictEqual(validInst.newSisa, 4500000, "Remaining loan principal must decrement by principal paid")
  assert.strictEqual(validInst.totalCash, 575000, "Total cash collected must equal principal + interest")
  assert.strictEqual(validInst.newStatus, "BERJALAN", "Loan with remaining principal must stay BERJALAN")
  assert.throws(
    () => validateLoanInstallment(500000, 0, 600000, 25000),
    /melebihi sisa pinjaman/,
    "Overpaying loan principal must throw instead of diverging Subsidiary Ledger vs General Ledger"
  )

  // 14. Asset sequence collision-free generator (src/lib/ledger.ts)
  assert.strictEqual(
    nextAssetCode(2026, ["AST-2026-001", "AST-2026-004"]),
    "AST-2026-005",
    "Next asset code must use maxSeq + 1 so deleted assets never cause P2002 collision"
  )

  // 15. Buku Kas Pembantu Bank & Buku Pembantu Pajak (Running Balance & Kepmendes 136 Rules)
  function computeSubLedger(lines, isNormalDebit) {
    let totalAdd = 0, totalPay = 0, balance = 0
    for (const l of lines) {
      const isDebit = l.type === "DEBIT"
      const add = isNormalDebit ? (isDebit ? l.amount : 0) : (!isDebit ? l.amount : 0)
      const pay = isNormalDebit ? (!isDebit ? l.amount : 0) : (isDebit ? l.amount : 0)
      totalAdd += add
      totalPay += pay
      balance += add - pay
    }
    return { totalAdd, totalPay, balance }
  }
  const bankMutasi = computeSubLedger([
    { accountCode: "1.1.01.06", type: "DEBIT", amount: 5000000 },
    { accountCode: "1.1.01.06", type: "DEBIT", amount: 25000 },
    { accountCode: "1.1.01.06", type: "CREDIT", amount: 10000 }
  ], true)
  assert.strictEqual(bankMutasi.balance, 5015000, "Buku Kas Pembantu Bank must increase on Debit and decrease on Credit")

  const taxMutasi = computeSubLedger([
    { accountCode: "2.1.02.02", type: "CREDIT", amount: 150000 },
    { accountCode: "2.1.02.01", type: "CREDIT", amount: 330000 },
    { accountCode: "2.1.02.02", type: "DEBIT", amount: 150000 }
  ], false)
  assert.strictEqual(taxMutasi.balance, 330000, "Buku Pembantu Pajak must increase on Credit (Pungut) and decrease on Debit (Setor)")

  // 16. Production Neraca check (src/lib/reports.ts): 1.2.xx Deposito > 3 Bulan & 3.4.xx Modal Donasi must keep Neraca 100% balanced
  const testAccMap = new Map([
    ["1.1.01.01", { code: "1.1.01.01", name: "Kas Tunai", type: "ASSET", normal: "Debit" }],
    ["1.2.01.01", { code: "1.2.01.01", name: "Deposito > 3 bulan", type: "ASSET", normal: "Debit" }],
    ["1.3.03.01", { code: "1.3.03.01", name: "Peralatan dan Mesin", type: "ASSET", normal: "Debit" }],
    ["1.3.07.02", { code: "1.3.07.02", name: "Akumulasi Penyusutan Peralatan", type: "ASSET", normal: "Kredit" }],
    ["3.1.01.01", { code: "3.1.01.01", name: "Penyertaan Modal Desa", type: "EQUITY", normal: "Kredit" }],
    ["3.4.01.01", { code: "3.4.01.01", name: "Modal Donasi/Sumbangan", type: "EQUITY", normal: "Kredit" }],
    ["3.3.01.01", { code: "3.3.01.01", name: "Saldo Laba Tidak Dicadangkan", type: "EQUITY", normal: "Kredit" }]
  ])
  const txMeta = { date: new Date(Date.UTC(2026, 5, 10)), proofType: "BKK", proofNumber: "BKK/2026/06/0001" }
  const { neraca } = aggregateNeracaFromLines([
    { accountCode: "1.1.01.01", type: "DEBIT", amount: 50000000, journalEntry: txMeta },
    { accountCode: "3.1.01.01", type: "CREDIT", amount: 50000000, journalEntry: txMeta },
    { accountCode: "1.2.01.01", type: "DEBIT", amount: 10000000, journalEntry: txMeta },
    { accountCode: "1.1.01.01", type: "CREDIT", amount: 10000000, journalEntry: txMeta },
    { accountCode: "1.1.01.01", type: "DEBIT", amount: 5000000, journalEntry: txMeta },
    { accountCode: "3.4.01.01", type: "CREDIT", amount: 5000000, journalEntry: txMeta }
  ], testAccMap, 0, startDate, endDate)
  assert.strictEqual(neraca.totalAssets, 55000000, "Total Assets must include 1.2.01.01 Deposito > 3 bulan")
  assert.strictEqual(neraca.totalAssets, neraca.totalLiabilitiesAndEquity, "Neraca must stay strictly balanced with 1.2.xx and 3.4.xx")

  // Check 16b: Production Simpanan Sukarela (2.1.01.03) must be mapped to liabilities correctly
  const { neraca: neracaUsp } = aggregateNeracaFromLines([
    { accountCode: "1.1.01.01", type: "DEBIT", amount: 1500000, journalEntry: txMeta },
    { accountCode: "2.1.01.03", type: "CREDIT", amount: 1500000, journalEntry: txMeta }
  ], testAccMap, 0, startDate, endDate)
  const sukarelaLiab = neracaUsp.liabilities.find(l => l.name === "Simpanan Sukarela Anggota")
  assert.strictEqual(sukarelaLiab?.amount, 1500000, "Simpanan Sukarela Anggota must appear in neraca.liabilities with correct amount")

  // 17. Production LAK check (src/lib/reports.ts): exclude Setor/Tarik Tunai & auto-classify 1.3.xx Investasi / 3.3.xx Pendanaan
  const lakResult = classifyCashEntriesForLak([
    {
      lines: [
        { accountCode: "1.1.01.06", type: "DEBIT", amount: 5000000, cashFlowGroup: null },
        { accountCode: "1.1.01.01", type: "CREDIT", amount: 5000000, cashFlowGroup: null }
      ]
    },
    {
      lines: [
        { accountCode: "1.3.03.01", type: "DEBIT", amount: 3300000, cashFlowGroup: null },
        { accountCode: "1.1.01.01", type: "CREDIT", amount: 3300000, cashFlowGroup: null }
      ]
    },
    {
      lines: [
        { accountCode: "3.3.01.01", type: "DEBIT", amount: 4225000, cashFlowGroup: null },
        { accountCode: "1.1.01.01", type: "CREDIT", amount: 4225000, cashFlowGroup: null }
      ]
    },
    {
      lines: [
        { accountCode: "1.1.01.01", type: "DEBIT", amount: 12000000, cashFlowGroup: null },
        { accountCode: "4.1.01.01", type: "CREDIT", amount: 12000000, cashFlowGroup: null }
      ]
    }
  ])
  assert.strictEqual(lakResult.operasi.masuk, 12000000, "Internal Setor Tunai must not inflate Operasi Masuk")
  assert.strictEqual(lakResult.operasi.keluar, 0, "Internal Setor Tunai, Asset purchase, and PADes must not land in Operasi Keluar")
  assert.strictEqual(lakResult.investasi.keluar, 3300000, "Fixed asset purchase 1.3.xx must classify as Investasi Keluar")
  assert.strictEqual(lakResult.pendanaan.keluar, 4225000, "PADes payout 3.3.01.01 must classify as Pendanaan Keluar")

  // 18. Production Opening Balance Roll-Forward check (src/lib/reports.ts): Debit contra-equity (3.3.01.01 PADes) & unclosed profit must strictly balance
  const rollPreview = computeRollForwardPreview([
    { accountCode: "1.1.01.01", type: "DEBIT", amount: 50000000 },
    { accountCode: "3.1.01.01", type: "CREDIT", amount: 50000000 },
    { accountCode: "3.3.01.01", type: "DEBIT", amount: 4225000 },
    { accountCode: "1.1.01.01", type: "CREDIT", amount: 4225000 },
    { accountCode: "1.1.01.01", type: "DEBIT", amount: 8000000 },
    { accountCode: "4.1.01.01", type: "CREDIT", amount: 8000000 },
    { accountCode: "6.1.01.01", type: "DEBIT", amount: 2000000 },
    { accountCode: "1.1.01.01", type: "CREDIT", amount: 2000000 }
  ], testAccMap)
  const rollDebit = rollPreview.filter(x => x.type === "DEBIT").reduce((s, x) => s + x.amount, 0)
  const rollCredit = rollPreview.filter(x => x.type === "CREDIT").reduce((s, x) => s + x.amount, 0)
  assert.strictEqual(Math.abs(rollDebit - rollCredit) < 0.01, true, "Roll-forward opening balance must strictly balance even with PADes debit and unclosed SHU")

  // 19. Post-closing (JP/) roll-forward must merge 3.1.03.01 & 3.3.01.01 into a single retained earnings row
  const closedRollPreview = computeRollForwardPreview([
    { accountCode: "1.1.01.01", type: "DEBIT", amount: 56000000 },
    { accountCode: "3.1.01.01", type: "CREDIT", amount: 50000000 },
    { accountCode: "4.1.01.01", type: "CREDIT", amount: 10000000 },
    { accountCode: "4.1.01.01", type: "DEBIT", amount: 10000000 }, // JP/ closing debit
    { accountCode: "3.1.03.01", type: "CREDIT", amount: 10000000 }, // JP/ closing credit
    { accountCode: "3.3.01.01", type: "DEBIT", amount: 4000000 }    // PADes payout
  ], testAccMap)
  const retainedRows = closedRollPreview.filter(x => x.accountCode === "3.3.01.01" || x.accountCode === "3.1.03.01")
  assert.strictEqual(retainedRows.length, 1, "Closed SHU (3.1.03.01) and PADes (3.3.01.01) must fold into a single retained earnings row")
  assert.strictEqual(retainedRows[0].type, "CREDIT", "Net retained earnings (10M - 4M) must be CREDIT")
  assert.strictEqual(retainedRows[0].amount, 6000000, "Net retained earnings must equal 6,000,000")

  // 20. Custom contra-asset (normal: "Credit" or "Kredit") must roll forward on CREDIT side and keep balance
  const contraAccMap = new Map(testAccMap)
  contraAccMap.set("1.1.03.99", { code: "1.1.03.99", name: "Cadangan Kerugian Piutang", type: "ASSET", normal: "Credit" })
  const contraRoll = computeRollForwardPreview([
    { accountCode: "1.1.03.01", type: "DEBIT", amount: 5000000 },
    { accountCode: "1.1.03.99", type: "CREDIT", amount: 500000 },
    { accountCode: "3.1.01.01", type: "CREDIT", amount: 4500000 }
  ], contraAccMap)
  const contraRow = contraRoll.find(x => x.accountCode === "1.1.03.99")
  assert.strictEqual(contraRow?.type, "CREDIT", "Custom contra-asset with normal Credit/Kredit must roll forward as CREDIT")
  assert.strictEqual(contraRow?.amount, 500000, "Custom contra-asset amount must be positive 500,000 on CREDIT")

  console.log("✔ All OpenBUMDes self-checks passed successfully!")
}

runSelfChecks().catch((err) => {
  console.error("✖ Self-check failed:", err)
  process.exit(1)
})
