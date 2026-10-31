export function getFiscalYearMonth(date: Date): { year: number; month: string } {
  return {
    year: date.getUTCFullYear(),
    month: String(date.getUTCMonth() + 1).padStart(2, "0")
  }
}

export function nextAssetCode(year: number, existingCodes: string[]): string {
  const prefix = `AST-${year}-`
  let maxSeq = 0
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const seq = parseInt(code.slice(prefix.length), 10)
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`
}

export function calculateInventoryValuation(item: {
  initialQty: number
  initialCost: number
  movements: {
    date: Date | string
    createdAt?: Date | string
    type: string
    qty: number
    costPerUnit?: number | null
    totalCost?: number | null
    referenceProof?: string | null
  }[]
}) {
  let qty = item.initialQty
  let totalCost = item.initialQty * item.initialCost

  const sortedMovements = [...item.movements].sort((a, b) => {
    const dDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dDiff !== 0) return dDiff
    return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0)
  })

  for (const m of sortedMovements) {
    // Lewati mutasi pencatatan saldo awal agar initialQty tidak terhitung ganda (2x)
    if (m.referenceProof === "SALDO-AWAL") continue
    const mType = String(m.type || "").toUpperCase()
    if (mType === "IN") {
      qty += m.qty
      totalCost += m.totalCost || m.qty * (m.costPerUnit || item.initialCost)
    } else if (mType === "OUT") {
      const avgCost = qty > 0 ? totalCost / qty : item.initialCost
      qty -= m.qty
      totalCost -= m.qty * avgCost
    } else if (mType === "ADJUST") {
      qty = m.qty
      totalCost = m.qty * (m.costPerUnit || item.initialCost)
    }
  }

  const finalQty = Math.max(0, qty)
  const avgCostPerUnit = finalQty > 0 ? Math.max(0, totalCost / finalQty) : item.initialCost
  return {
    currentQty: finalQty,
    avgCostPerUnit,
    totalValue: finalQty * avgCostPerUnit
  }
}

export function validateLoanInstallment(
  sisaPinjaman: number,
  amount: number,
  principalAmount: number,
  interestAmount: number
) {
  const numAmount = Math.max(0, Number(amount) || 0)
  const numPrincipal = Math.max(0, Number(principalAmount) || 0)
  const numInterest = Math.max(0, Number(interestAmount) || 0)
  const hasSplit = numPrincipal > 0 || numInterest > 0
  const actualPrincipal = hasSplit ? numPrincipal : numAmount
  const totalCash = hasSplit ? numPrincipal + numInterest : numAmount

  if (totalCash <= 0) {
    throw new Error("Nominal angsuran harus lebih dari 0.")
  }
  if (actualPrincipal > sisaPinjaman + 0.01) {
    throw new Error(
      `Pokok angsuran (Rp ${actualPrincipal.toLocaleString("id-ID")}) melebihi sisa pinjaman anggota (Rp ${sisaPinjaman.toLocaleString("id-ID")}).`
    )
  }

  const newSisa = Math.max(0, sisaPinjaman - actualPrincipal)
  return {
    actualPrincipal,
    numInterest,
    totalCash,
    newSisa,
    newStatus: newSisa <= 0.01 ? "LUNAS" : "BERJALAN"
  }
}

export async function postJournalEntry(
  date: Date,
  proofType: "BKM" | "BKK" | "MEMORIAL",
  description: string,
  payeeOrPayer: string,
  lines: { accountCode: string; type: "DEBIT" | "CREDIT"; amount: number; cashFlowGroup?: string | null }[],
  unitName?: string | null,
  note?: string | null,
  attachmentUrl?: string | null,
  customProofNumber?: string | null
) {
  let debitTotal = 0
  let creditTotal = 0

  for (const line of lines) {
    if (line.type === "DEBIT") debitTotal += line.amount
    else creditTotal += line.amount
  }

  if (Math.abs(debitTotal - creditTotal) > 0.01) {
    throw new Error(`Jurnal tidak balance (Debit: ${debitTotal}, Kredit: ${creditTotal})`)
  }

  const { db } = await import("./db")

  let attempt = 0
  while (attempt < 3) {
    try {
      return await db.$transaction(async (tx) => {
        let proofNumber = customProofNumber
        if (!proofNumber) {
          const { year, month } = getFiscalYearMonth(date)
          const prefix = `${proofType}/${year}/${month}/`

          const [matching, matchingLoans] = await Promise.all([
            tx.journalEntry.findMany({
              where: { proofNumber: { startsWith: prefix } },
              select: { proofNumber: true }
            }),
            tx.loanTransaction.findMany({
              where: { proofNumber: { startsWith: prefix } },
              select: { proofNumber: true }
            })
          ])

          let maxSeq = 0
          for (const m of [...matching, ...matchingLoans]) {
            if (!m.proofNumber) continue
            const parts = m.proofNumber.split("/")
            const seq = parseInt(parts[parts.length - 1], 10)
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq
            }
          }
          proofNumber = `${prefix}${String(maxSeq + 1).padStart(4, "0")}`
        }

        const entry = await tx.journalEntry.create({
          data: {
            proofNumber: proofNumber!,
            proofType,
            date,
            description,
            payeeOrPayer,
            unitName: unitName || "Umum",
            note: note || null,
            attachmentUrl: attachmentUrl || null,
            verificationStatus: attachmentUrl ? "SIGNED_UPLOADED" : "DRAFT"
          }
        })

        await tx.journalLine.createMany({
          data: lines.map((line) => ({
            journalEntryId: entry.id,
            accountCode: line.accountCode,
            type: line.type,
            amount: line.amount,
            cashFlowGroup: line.cashFlowGroup || null
          }))
        })

        const createdLines = await tx.journalLine.findMany({
          where: { journalEntryId: entry.id }
        })

        return { entry, lines: createdLines }
      })
    } catch (err: any) {
      if (!customProofNumber && err?.code === "P2002" && attempt < 2) {
        attempt++
        await new Promise((r) => setTimeout(r, 50 * attempt))
        continue
      }
      throw err
    }
  }
  throw new Error("Gagal menyimpan transaksi jurnal.")
}
