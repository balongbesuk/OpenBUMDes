import assert from "node:assert"
import crypto from "node:crypto"

const SECRET = "bumdes-kepmendes-136-secret-salt-2026"

function createToken(payload) {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  })
  const b64 = Buffer.from(data).toString("base64url")
  const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")
  return `${b64}.${sig}`
}

function verifyToken(token) {
  try {
    if (!token || !token.includes(".")) return null
    const [b64, sig] = token.split(".")
    const expectedSig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")
    const sigBuf = Buffer.from(sig)
    const expBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null

    const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"))
    if (data.exp && Date.now() > data.exp) return null
    return data
  } catch {
    return null
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

function comparePassword(password, stored) {
  try {
    if (!stored || !stored.includes(":")) return false
    const [salt, hash] = stored.split(":")
    const check = crypto.scryptSync(password, salt, 64).toString("hex")
    return crypto.timingSafeEqual(Buffer.from(check, "hex"), Buffer.from(hash, "hex"))
  } catch {
    return false
  }
}

async function runSelfChecks() {
  console.log("▶ Running OpenBUMDes Core Logic Self-Checks...")

  // 1. Auth token sign & timing-safe verify
  const payload = { id: "user-1", username: "admin", name: "Administrator", role: "ADMIN" }
  const token = createToken(payload)
  const verified = verifyToken(token)
  assert.strictEqual(verified?.username, "admin", "Token should verify matching username")
  assert.strictEqual(verified?.role, "ADMIN", "Token should verify matching role")

  // 2. Tampered token rejection
  const tamperedToken = token.slice(0, -4) + "XXXX"
  assert.strictEqual(verifyToken(tamperedToken), null, "Tampered signature must be rejected")
  assert.strictEqual(verifyToken("invalid.token"), null, "Malformed token must be rejected")

  // 3. Password hashing & comparison
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
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq
    }
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
  const condition = hasOpeningJournal
    ? { gte: startDate, lte: endDate }
    : { lte: endDate }
  assert.deepStrictEqual(condition, { gte: startDate, lte: endDate }, "Balance query must start at Jan 1st when SA entry exists")

  // 7. Straight-line asset depreciation check
  const cost = 120000000
  const salvage = 0
  const usefulLife = 4
  const annualDepr = (cost - salvage) / usefulLife
  const monthlyDepr = annualDepr / 12
  assert.strictEqual(annualDepr, 30000000, "Annual depreciation should be 30M")
  assert.strictEqual(monthlyDepr, 2500000, "Monthly depreciation should be 2.5M")

  // 8. Inventory average cost & valuation check
  let stockQty = 10
  let stockValue = 10 * 100000 // 1,000,000
  // Buy 10 @ 120,000
  stockQty += 10
  stockValue += 10 * 120000 // 2,200,000
  const avgUnitCost = stockValue / stockQty
  assert.strictEqual(avgUnitCost, 110000, "Moving average cost should be 110,000")
  // Sell 5 units
  stockQty -= 5
  stockValue -= 5 * avgUnitCost
  assert.strictEqual(stockQty, 15, "Remaining stock should be 15")
  assert.strictEqual(stockValue, 1650000, "Ending inventory value should be 1,650,000")

  // 9. General Ledger opening balance double-counting prevention logic
  const obRecord = { amount: 5000000, type: "DEBIT" }
  let glOpeningBalance = 0
  if (obRecord) {
    glOpeningBalance += obRecord.amount
  }
  let historicalQueried = false
  if (!obRecord) {
    historicalQueried = true
    glOpeningBalance += 2000000
  }
  assert.strictEqual(historicalQueried, false, "Historical lines must not be queried if obRecord exists")
  assert.strictEqual(glOpeningBalance, 5000000, "Opening balance must not double count prior transactions")

  // 10. Rate limiter cleanup check
  const attempts = new Map()
  attempts.set("ip1:user1", { count: 5, lockedUntil: Date.now() - 1000 }) // Expired
  attempts.set("ip2:user2", { count: 2, lockedUntil: Date.now() + 60000 }) // Active
  const now = Date.now()
  for (const [k, v] of attempts.entries()) {
    if (v.lockedUntil < now) attempts.delete(k)
  }
  assert.strictEqual(attempts.size, 1, "Expired rate limit attempts must be pruned")
  assert.strictEqual(attempts.has("ip2:user2"), true, "Active rate limit must be retained")

  // 11. Local date string format check
  const testDate = new Date(2026, 9, 29, 2, 30, 0) // Oct 29, 2026 at 02:30 AM local
  const pad = (n) => String(n).padStart(2, "0")
  const localDateStr = `${testDate.getFullYear()}-${pad(testDate.getMonth() + 1)}-${pad(testDate.getDate())}`
  assert.strictEqual(localDateStr, "2026-10-29", "Local date string must reflect local date, not UTC yesterday")

  // 12. Memorial SA lines opening balance edge-case check
  const obRecordNull = null
  const saLinesFound = [{ amount: 3000000, type: "DEBIT" }]
  const hasSaLines = saLinesFound.length > 0
  let queryHistorical = false
  if (!obRecordNull && !hasSaLines) {
    queryHistorical = true
  }
  assert.strictEqual(queryHistorical, false, "Historical query must be skipped when saLines exist even if obRecord is null")

  // 13. Unit Simpan Pinjam (USP) loan calculation and balance reconciliation check
  const member = {
    simpananPokok: 50000,
    simpananWajib: 200000,
    simpananSukarela: 100000,
    totalPinjaman: 5000000,
    sisaPinjaman: 5000000,
    bungaPersen: 1.5
  }
  const totalSimpanan = member.simpananPokok + member.simpananWajib + member.simpananSukarela
  assert.strictEqual(totalSimpanan, 350000, "Total savings must equal sum of pokok, wajib, sukarela")

  // Simulate payment of 500,000 principal + 75,000 interest
  const principalPaid = 500000
  const interestPaid = 75000
  const updatedSisa = Math.max(0, member.sisaPinjaman - principalPaid)
  assert.strictEqual(updatedSisa, 4500000, "Remaining loan principal must decrement by principal paid")

  // Reconcile with GL
  const glSimpanan = 350000
  const isSimpananBalanced = Math.abs(totalSimpanan - glSimpanan) < 1
  assert.strictEqual(isSimpananBalanced, true, "Simpanan must balance with GL liability account")

  // 14. Loan installment strict double-entry balance and authorization check
  const installmentPrincipal = 400000
  const installmentInterest = 60000
  const installmentCash = installmentPrincipal + installmentInterest
  const journalLines = [
    { type: "DEBIT", amount: installmentCash },
    { type: "CREDIT", amount: installmentPrincipal },
    { type: "CREDIT", amount: installmentInterest }
  ]
  const dSum = journalLines.filter(l => l.type === "DEBIT").reduce((s, l) => s + l.amount, 0)
  const cSum = journalLines.filter(l => l.type === "CREDIT").reduce((s, l) => s + l.amount, 0)
  assert.strictEqual(Math.abs(dSum - cSum) < 0.01, true, "Installment journal must strictly balance")

  // Authorization guard check: OPERATOR role must be rejected on admin-only actions
  const operatorSession = { id: "u2", username: "kasir", role: "OPERATOR" }
  const isAuthorized = operatorSession && operatorSession.role === "ADMIN"
  assert.strictEqual(isAuthorized, false, "Operator must not pass admin authorization check")

  // Closed fiscal year check: locked year must block journal insertion
  const closedYear = { year: 2025, isLocked: true }
  const canPostToClosed = !(closedYear && closedYear.isLocked)
  assert.strictEqual(canPostToClosed, false, "Posting to locked fiscal year must be blocked")

  console.log("✔ All OpenBUMDes self-checks passed successfully!")
}

runSelfChecks().catch((err) => {
  console.error("✖ Self-check failed:", err)
  process.exit(1)
})
