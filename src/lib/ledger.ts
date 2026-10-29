import { db } from "./db"


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

  let attempt = 0
  while (attempt < 3) {
    try {
      return await db.$transaction(async (tx) => {
        let proofNumber = customProofNumber
        if (!proofNumber) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, "0")
          const prefix = `${proofType}/${year}/${month}/`

          const matching = await tx.journalEntry.findMany({
            where: { proofNumber: { startsWith: prefix } },
            select: { proofNumber: true }
          })

          let maxSeq = 0
          for (const m of matching) {
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
  throw new Error("Gagal menyimpan transaksi jurnal.");
}