import { db } from "./db"

export async function getAccountBalance(
  accountCodeOrPrefix: string | string[],
  endDate?: Date,
  startDate?: Date
): Promise<number> {
  const codes = Array.isArray(accountCodeOrPrefix) ? accountCodeOrPrefix : [accountCodeOrPrefix]

  const isPrefix = typeof accountCodeOrPrefix === "string" && (accountCodeOrPrefix.endsWith("%") || accountCodeOrPrefix.endsWith("*"))
  const cleanPrefix = typeof accountCodeOrPrefix === "string" ? accountCodeOrPrefix.replace(/[%*]$/, "") : ""

  const whereCondition: any = isPrefix
    ? { accountCode: { startsWith: cleanPrefix } }
    : { accountCode: { in: codes } }

  if (endDate || startDate) {
    whereCondition.journalEntry = {}
    if (startDate) whereCondition.journalEntry.date = { ...whereCondition.journalEntry.date, gte: startDate }
    if (endDate) whereCondition.journalEntry.date = { ...whereCondition.journalEntry.date, lte: endDate }
  }

  const sums = await db.journalLine.groupBy({
    by: ['type'],
    where: whereCondition,
    _sum: { amount: true }
  })

  let accountType = "ASSET"
  if (isPrefix) {
    const firstChar = cleanPrefix.charAt(0)
    if (firstChar === "1") accountType = "ASSET"
    else if (firstChar === "2") accountType = "LIABILITY"
    else if (firstChar === "3") accountType = "EQUITY"
    else if (firstChar === "4") accountType = "REVENUE"
    else if (["5", "6", "7"].includes(firstChar)) accountType = "EXPENSE"
  } else {
    const account = await db.ledgerAccount.findFirst({
      where: { code: { in: codes } }
    })
    if (account) {
      accountType = account.type
    } else {
      const firstChar = (codes[0] || "").charAt(0)
      if (firstChar === "1") accountType = "ASSET"
      else if (firstChar === "2") accountType = "LIABILITY"
      else if (firstChar === "3") accountType = "EQUITY"
      else if (firstChar === "4") accountType = "REVENUE"
      else if (["5", "6", "7"].includes(firstChar)) accountType = "EXPENSE"
    }
  }

  const debitSum = sums.find((s: any) => s.type === "DEBIT")?._sum.amount || 0
  const creditSum = sums.find((s: any) => s.type === "CREDIT")?._sum.amount || 0

  if (accountType === "ASSET" || accountType === "EXPENSE") {
    return debitSum - creditSum
  } else {
    return creditSum - debitSum
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

  return await db.$transaction(async (tx) => {
    let proofNumber = customProofNumber
    if (!proofNumber) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const prefix = `${proofType}/${year}/${month}/`

      const latest = await tx.journalEntry.findFirst({
        where: { proofNumber: { startsWith: prefix } },
        orderBy: { proofNumber: "desc" },
        select: { proofNumber: true }
      })

      let nextSeq = 1
      if (latest?.proofNumber) {
        const parts = latest.proofNumber.split("/")
        const lastSeq = parseInt(parts[parts.length - 1], 10)
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1
        }
      }
      proofNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`
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

    const createdLines = []
    for (const line of lines) {
      const l = await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountCode: line.accountCode,
          type: line.type,
          amount: line.amount,
          cashFlowGroup: line.cashFlowGroup || null
        }
      })
      createdLines.push(l)
    }

    return { entry, lines: createdLines }
  })
}
