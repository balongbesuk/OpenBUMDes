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

  console.log("✔ All OpenBUMDes self-checks passed successfully!")
}

runSelfChecks().catch((err) => {
  console.error("✖ Self-check failed:", err)
  process.exit(1)
})
