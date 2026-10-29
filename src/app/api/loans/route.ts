import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { getUserSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak. Silakan masuk terlebih dahulu." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase().trim() || ""
    const memberType = searchParams.get("type") || "ALL"
    const statusPinjaman = searchParams.get("loanStatus") || "ALL"
    const memberId = searchParams.get("memberId")

    // If specific member requested
    if (memberId) {
      const member = await db.loanMember.findUnique({
        where: { id: memberId },
        include: {
          transactions: {
            orderBy: [{ date: "desc" }, { createdAt: "desc" }]
          }
        }
      })
      if (!member) {
        return NextResponse.json({ success: false, error: "Anggota tidak ditemukan" }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: member })
    }

    // Build filter
    const where: any = {}
    if (memberType !== "ALL") {
      where.memberType = memberType
    }
    if (statusPinjaman !== "ALL") {
      where.statusPinjaman = statusPinjaman
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { memberNo: { contains: search } },
        { nik: { contains: search } },
        { groupName: { contains: search } },
        { address: { contains: search } }
      ]
    }

    const members = await db.loanMember.findMany({
      where,
      include: {
        transactions: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 5
        }
      },
      orderBy: [{ statusPinjaman: "asc" }, { memberNo: "asc" }]
    })

    // Calculate aggregated stats using native database aggregation
    const [totalMembers, totalActiveBorrowers, sums] = await Promise.all([
      db.loanMember.count(),
      db.loanMember.count({ where: { sisaPinjaman: { gt: 0 } } }),
      db.loanMember.aggregate({
        _sum: {
          simpananPokok: true,
          simpananWajib: true,
          simpananSukarela: true,
          totalPinjaman: true,
          sisaPinjaman: true
        }
      })
    ])

    const summary = {
      totalMembers,
      totalActiveBorrowers,
      totalSimpananPokok: sums._sum.simpananPokok || 0,
      totalSimpananWajib: sums._sum.simpananWajib || 0,
      totalSimpananSukarela: sums._sum.simpananSukarela || 0,
      totalSimpanan: 0,
      totalPinjamanDisalurkan: sums._sum.totalPinjaman || 0,
      totalSisaPinjaman: sums._sum.sisaPinjaman || 0
    }
    summary.totalSimpanan = summary.totalSimpananPokok + summary.totalSimpananWajib + summary.totalSimpananSukarela

    // Reconcile with General Ledger (Kepmendes 136/2022 Accounts)
    // 2.1.01 for Simpanan Anggota, 1.1.02 for Piutang Pinjaman USP
    const yearParam = searchParams.get("year")
    const targetYear = yearParam ? parseInt(yearParam, 10) : null

    // Cek apakah ada jurnal saldo awal (SA) di tahun target untuk mencegah saldo ganda lintas tahun
    let dateCondition: any = undefined
    if (targetYear) {
      const saEntry = await db.journalEntry.findFirst({
        where: {
          proofType: "MEMORIAL",
          date: {
            gte: new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0)),
            lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999))
          },
          OR: [
            { proofNumber: { startsWith: `SA/${targetYear}` } },
            { proofNumber: { startsWith: "SA-USP" } }
          ]
        }
      })
      if (saEntry) {
        dateCondition = {
          gte: new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0)),
          lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999))
        }
      } else {
        dateCondition = {
          lte: new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999))
        }
      }
    }

    const glLines = await db.journalLine.findMany({
      where: {
        OR: [
          { accountCode: { startsWith: "2.1.01" } },
          { accountCode: { startsWith: "1.1.02" } }
        ],
        ...(dateCondition ? { journalEntry: { date: dateCondition } } : {})
      }
    })

    let glSimpananTotal = 0
    let glPiutangTotal = 0

    glLines.forEach((l) => {
      if (l.accountCode.startsWith("2.1.01")) {
        // Liability normal Credit
        glSimpananTotal += (l.type === "CREDIT" ? l.amount : -l.amount)
      } else if (l.accountCode.startsWith("1.1.02")) {
        // Asset normal Debit
        glPiutangTotal += (l.type === "DEBIT" ? l.amount : -l.amount)
      }
    })

    const reconciliation = {
      subsidiarySimpanan: summary.totalSimpanan,
      glSimpanan: glSimpananTotal,
      diffSimpanan: summary.totalSimpanan - glSimpananTotal,
      isSimpananBalanced: Math.abs(summary.totalSimpanan - glSimpananTotal) < 1,

      subsidiaryPiutang: summary.totalSisaPinjaman,
      glPiutang: glPiutangTotal,
      diffPiutang: summary.totalSisaPinjaman - glPiutangTotal,
      isPiutangBalanced: Math.abs(summary.totalSisaPinjaman - glPiutangTotal) < 1
    }

    return NextResponse.json({
      success: true,
      data: members,
      summary,
      reconciliation
    })
  } catch (error: any) {
    console.error("GET /api/loans error:", error)
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat data simpan pinjam" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // 1. CREATE_MEMBER
    if (action === "CREATE_MEMBER") {
      const {
        memberNo,
        name,
        nik,
        phone,
        address,
        groupName,
        memberType = "INDIVIDU",
        simpananPokok = 0,
        simpananWajib = 0,
        simpananSukarela = 0,
        initialLoan = 0,
        bungaPersen = 1.5,
        jangkaWaktuBulan = 12,
        notes
      } = body

      if (!memberNo || !name) {
        return NextResponse.json({ success: false, error: "Nomor anggota dan nama wajib diisi" }, { status: 400 })
      }

      const existing = await db.loanMember.findUnique({ where: { memberNo } })
      if (existing) {
        return NextResponse.json({ success: false, error: `Nomor anggota ${memberNo} sudah terdaftar` }, { status: 400 })
      }

      const member = await db.$transaction(async (tx) => {
        const created = await tx.loanMember.create({
          data: {
            memberNo,
            name,
            nik: nik || null,
            phone: phone || null,
            address: address || null,
            groupName: groupName || null,
            memberType,
            simpananPokok: Number(simpananPokok) || 0,
            simpananWajib: Number(simpananWajib) || 0,
            simpananSukarela: Number(simpananSukarela) || 0,
            totalPinjaman: Number(initialLoan) || 0,
            sisaPinjaman: Number(initialLoan) || 0,
            bungaPersen: Number(bungaPersen) || 1.5,
            jangkaWaktuBulan: Number(jangkaWaktuBulan) || 12,
            statusPinjaman: Number(initialLoan) > 0 ? "BERJALAN" : "LUNAS",
            notes: notes || null
          }
        })

        // Initial transactions if provided
        if (Number(simpananPokok) > 0) {
          await tx.loanTransaction.create({
            data: {
              memberId: created.id,
              type: "SIMPANAN_POKOK",
              amount: Number(simpananPokok),
              description: "Setoran Saldo Awal Simpanan Pokok"
            }
          })
        }
        if (Number(simpananWajib) > 0) {
          await tx.loanTransaction.create({
            data: {
              memberId: created.id,
              type: "SIMPANAN_WAJIB",
              amount: Number(simpananWajib),
              description: "Setoran Saldo Awal Simpanan Wajib"
            }
          })
        }
        if (Number(initialLoan) > 0) {
          await tx.loanTransaction.create({
            data: {
              memberId: created.id,
              type: "PENCAIRAN_PINJAMAN",
              amount: Number(initialLoan),
              principalAmount: Number(initialLoan),
              description: "Penyaluran Pinjaman Saldo Awal"
            }
          })
        }

        return created
      })

      return NextResponse.json({ success: true, data: member })
    }

    // 2. ADD_TRANSACTION
    if (action === "ADD_TRANSACTION") {
      const {
        memberId,
        type, // SIMPANAN_POKOK, SIMPANAN_WAJIB, SIMPANAN_SUKARELA, TARIK_SIMPANAN, PENCAIRAN_PINJAMAN, ANGSURAN
        date = new Date().toISOString(),
        amount,
        principalAmount = 0,
        interestAmount = 0,
        description,
        proofNumber,
        autoPostJournal = false
      } = body

      if (!memberId || !type || !amount) {
        return NextResponse.json({ success: false, error: "Data transaksi tidak lengkap" }, { status: 400 })
      }

      const member = await db.loanMember.findUnique({ where: { id: memberId } })
      if (!member) {
        return NextResponse.json({ success: false, error: "Anggota tidak ditemukan" }, { status: 404 })
      }

      const numAmount = Math.max(0, Number(amount))
      const numPrincipal = Math.max(0, Number(principalAmount))
      const numInterest = Math.max(0, Number(interestAmount))

      const result = await db.$transaction(async (tx) => {
        // Check if fiscal year is closed before recording journal
        const txDate = new Date(date)
        const txYear = txDate.getFullYear()
        if (autoPostJournal) {
          const closed = await tx.annualClosing.findUnique({ where: { year: txYear } })
          if (closed && closed.isLocked) {
            throw new Error(`Tahun pembukuan ${txYear} telah ditutup buku dan dikunci secara permanen.`)
          }
        }

        let updatedMemberData: any = {}

        if (type === "SIMPANAN_POKOK") {
          updatedMemberData = {
            simpananPokok: { increment: numAmount }
          }
        } else if (type === "SIMPANAN_WAJIB") {
          updatedMemberData = {
            simpananWajib: { increment: numAmount }
          }
        } else if (type === "SIMPANAN_SUKARELA") {
          updatedMemberData = {
            simpananSukarela: { increment: numAmount }
          }
        } else if (type === "TARIK_SIMPANAN") {
          if (member.simpananSukarela < numAmount) {
            throw new Error(`Saldo simpanan sukarela tidak mencukupi (Tersedia: Rp ${member.simpananSukarela.toLocaleString("id-ID")})`)
          }
          updatedMemberData = {
            simpananSukarela: { decrement: numAmount }
          }
        } else if (type === "PENCAIRAN_PINJAMAN") {
          updatedMemberData = {
            totalPinjaman: { increment: numAmount },
            sisaPinjaman: { increment: numAmount },
            statusPinjaman: "BERJALAN"
          }
        } else if (type === "ANGSURAN") {
          const actualPrincipalPaid = numPrincipal > 0 ? numPrincipal : Math.min(member.sisaPinjaman, numAmount)
          const newSisa = Math.max(0, member.sisaPinjaman - actualPrincipalPaid)

          updatedMemberData = {
            sisaPinjaman: newSisa,
            statusPinjaman: newSisa <= 0 ? "LUNAS" : "BERJALAN"
          }
        }

        const updatedMember = await tx.loanMember.update({
          where: { id: memberId },
          data: updatedMemberData
        })

        // Create transaction record
        const txRecord = await tx.loanTransaction.create({
          data: {
            memberId,
            date: txDate,
            type,
            amount: type === "ANGSURAN" && (numPrincipal > 0 || numInterest > 0) ? (numPrincipal + numInterest) : numAmount,
            principalAmount: numPrincipal,
            interestAmount: numInterest,
            proofNumber: proofNumber || null,
            description: description || `Transaksi ${type} anggota ${member.name}`
          }
        })

        // Optional: Auto post to General Journal Entry if requested
        if (autoPostJournal) {
          const autoProofNumber = proofNumber || `USP/${txYear}/${crypto.randomBytes(3).toString("hex").toUpperCase()}`
          let debitCode = "1.1.01.01" // Kas Tunai
          let creditCode = "1.1.01.01"
          let entryDesc = description || `Transaksi Simpan Pinjam: ${member.name}`

          if (type === "SIMPANAN_POKOK") {
            debitCode = "1.1.01.01" // Kas Tunai
            creditCode = "2.1.01.01" // Simpanan Pokok Anggota
          } else if (type === "SIMPANAN_WAJIB") {
            debitCode = "1.1.01.01"
            creditCode = "2.1.01.02" // Simpanan Wajib Anggota
          } else if (type === "SIMPANAN_SUKARELA") {
            debitCode = "1.1.01.01"
            creditCode = "2.1.01.03" // Simpanan Sukarela
          } else if (type === "TARIK_SIMPANAN") {
            debitCode = "2.1.01.03"
            creditCode = "1.1.01.01"
          } else if (type === "PENCAIRAN_PINJAMAN") {
            debitCode = member.memberType === "KELOMPOK" ? "1.1.02.02" : "1.1.02.01" // Piutang Pinjaman
            creditCode = "1.1.01.01" // Kas Keluar
          }

          // Simple single/double posting
          if (type !== "ANGSURAN") {
            const entry = await tx.journalEntry.create({
              data: {
                proofNumber: autoProofNumber,
                proofType: type === "TARIK_SIMPANAN" || type === "PENCAIRAN_PINJAMAN" ? "BKK" : "BKM",
                date: txDate,
                description: entryDesc,
                payeeOrPayer: member.name,
                unitName: "Unit Simpan Pinjam",
                verificationStatus: "VERIFIED",
                lines: {
                  create: [
                    { accountCode: debitCode, type: "DEBIT", amount: numAmount },
                    { accountCode: creditCode, type: "CREDIT", amount: numAmount }
                  ]
                }
              }
            })
            await tx.loanTransaction.update({
              where: { id: txRecord.id },
              data: { journalEntryId: entry.id }
            })
          } else {
            // ANGSURAN: Enforce exact double-entry balance between Cash debit and (Principal + Interest) credits
            const totalCash = (numPrincipal > 0 || numInterest > 0) ? (numPrincipal + numInterest) : numAmount
            const piutangCode = member.memberType === "KELOMPOK" ? "1.1.02.02" : "1.1.02.01"

            const lines: any[] = [
              { accountCode: "1.1.01.01", type: "DEBIT", amount: totalCash }
            ]
            if (numPrincipal > 0) {
              lines.push({ accountCode: piutangCode, type: "CREDIT", amount: numPrincipal })
            }
            if (numInterest > 0) {
              lines.push({ accountCode: "4.1.01.02", type: "CREDIT", amount: numInterest })
            }
            // fallback if neither principal nor interest was split
            if (lines.length === 1) {
              lines.push({ accountCode: piutangCode, type: "CREDIT", amount: totalCash })
            }

            // Verify strict double-entry equality
            const debits = lines.filter(l => l.type === "DEBIT").reduce((s, l) => s + l.amount, 0)
            const credits = lines.filter(l => l.type === "CREDIT").reduce((s, l) => s + l.amount, 0)
            if (Math.abs(debits - credits) >= 0.01) {
              throw new Error(`Jurnal tidak seimbang: Total Debit (Rp ${debits}) != Total Kredit (Rp ${credits})`)
            }

            const entry = await tx.journalEntry.create({
              data: {
                proofNumber: autoProofNumber,
                proofType: "BKM",
                date: txDate,
                description: entryDesc,
                payeeOrPayer: member.name,
                unitName: "Unit Simpan Pinjam",
                verificationStatus: "VERIFIED",
                lines: { create: lines }
              }
            })
            await tx.loanTransaction.update({
              where: { id: txRecord.id },
              data: { journalEntryId: entry.id }
            })
          }
        }

        return { member: updatedMember, transaction: txRecord }
      })

      return NextResponse.json({ success: true, data: result })
    }

    // 3. SEED_SAMPLE_DATA: Balongbesuk 2025 SPJ Data (Generalized & Balanced)
    if (action === "SEED_SAMPLE_DATA") {
      // Check if data already exists
      const count = await db.loanMember.count()
      if (count > 0 && !body.force) {
        return NextResponse.json({
          success: false,
          error: "Data anggota simpan pinjam sudah ada. Gunakan force=true jika ingin menimpa data awal."
        }, { status: 400 })
      }

      // If force, clear existing
      if (body.force) {
        await db.loanTransaction.deleteMany()
        await db.loanMember.deleteMany()
      }

      // Load all 66 real detailed members from SPJ 2025 Balongbesuk (no collective placeholders)
      const path = await import("path")
      const fs = await import("fs")
      const membersFilePath = path.join(process.cwd(), "prisma", "spj_2025_members.json")
      let sampleMembers: any[] = []
      if (fs.existsSync(membersFilePath)) {
        sampleMembers = JSON.parse(fs.readFileSync(membersFilePath, "utf-8"))
      }

      await db.$transaction(async (tx) => {
        // Ensure Ledger Accounts exist for Kepmendes 136 standard
        const accountsToEnsure = [
          { code: "1.1.02.01", name: "Piutang Pinjaman Masyarakat", type: "ASSET", normal: "Debit" },
          { code: "1.1.02.02", name: "Piutang Pinjaman Poktan/Kelompok", type: "ASSET", normal: "Debit" },
          { code: "2.1.01.01", name: "Simpanan Pokok Anggota", type: "LIABILITY", normal: "Credit" },
          { code: "2.1.01.02", name: "Simpanan Wajib Anggota", type: "LIABILITY", normal: "Credit" },
          { code: "2.1.01.03", name: "Simpanan Sukarela Anggota", type: "LIABILITY", normal: "Credit" },
          { code: "3.1.01.01", name: "Penyertaan Modal Desa", type: "EQUITY", normal: "Credit" },
          { code: "4.1.01.02", name: "Pendapatan Jasa Pinjaman USP", type: "REVENUE", normal: "Credit" }
        ]

        for (const acc of accountsToEnsure) {
          const accExist = await tx.ledgerAccount.findUnique({ where: { code: acc.code } })
          if (!accExist) {
            await tx.ledgerAccount.create({ data: acc })
          }
        }

        // Reconciled Opening Journal Entry for USP matching SPJ 2025 Neraca exactly
        // Total Simpanan: Rp 17.840.000 (Pokok: 2.750.000, Wajib: 15.090.000)
        // Total Piutang: Rp 89.000.000 (Masyarakat: 61.000.000, Gapoktan: 28.000.000)
        const saProofNumber = "SA-USP-2025"
        await tx.journalEntry.deleteMany({ where: { proofNumber: saProofNumber } })
        await tx.journalEntry.create({
          data: {
            proofNumber: saProofNumber,
            proofType: "MEMORIAL",
            date: new Date("2025-01-01T00:00:00Z"),
            description: "Saldo Awal Unit Simpan Pinjam (SPJ BUMDes 2025 Balongbesuk)",
            payeeOrPayer: "Unit Simpan Pinjam BUMDes",
            unitName: "Unit Simpan Pinjam",
            verificationStatus: "VERIFIED",
            lines: {
              create: [
                { accountCode: "1.1.02.01", type: "DEBIT", amount: 61000000 },
                { accountCode: "1.1.02.02", type: "DEBIT", amount: 28000000 },
                { accountCode: "2.1.01.01", type: "CREDIT", amount: 2750000 },
                { accountCode: "2.1.01.02", type: "CREDIT", amount: 15090000 },
                { accountCode: "3.1.01.01", type: "CREDIT", amount: 71160000 }
              ]
            }
          }
        })

        for (const m of sampleMembers) {
          const created = await tx.loanMember.create({ data: m })

          // Create transactions for history
          if (m.simpananPokok > 0) {
            await tx.loanTransaction.create({
              data: {
                memberId: created.id,
                date: new Date("2025-01-10T08:00:00Z"),
                type: "SIMPANAN_POKOK",
                amount: m.simpananPokok,
                description: `Setoran Simpanan Pokok Anggota ${m.name}`
              }
            })
          }
          if (m.simpananWajib > 0) {
            await tx.loanTransaction.create({
              data: {
                memberId: created.id,
                date: new Date("2025-06-15T09:30:00Z"),
                type: "SIMPANAN_WAJIB",
                amount: m.simpananWajib,
                description: `Akumulasi Setoran Simpanan Wajib Anggota ${m.name}`
              }
            })
          }
          if (m.totalPinjaman > 0) {
            await tx.loanTransaction.create({
              data: {
                memberId: created.id,
                date: new Date("2025-02-01T10:00:00Z"),
                type: "PENCAIRAN_PINJAMAN",
                amount: m.totalPinjaman,
                principalAmount: m.totalPinjaman,
                description: `Penyaluran Pinjaman Modal Usaha ${m.name}`
              }
            })
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: "Data contoh standar Simpan Pinjam BUMDes Balongbesuk 2025 berhasil dimuat."
      })
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali" }, { status: 400 })
  } catch (error: any) {
    console.error("POST /api/loans error:", error)
    return NextResponse.json({ success: false, error: error.message || "Gagal memproses permintaan" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Akses ditolak. Hanya Administrator yang memiliki hak akses untuk menghapus data anggota."
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID anggota wajib disertakan" }, { status: 400 })
    }

    const member = await db.loanMember.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json({ success: false, error: "Anggota tidak ditemukan" }, { status: 404 })
    }

    if (member.sisaPinjaman > 0) {
      return NextResponse.json({
        success: false,
        error: `Anggota tidak dapat dihapus karena masih memiliki pinjaman aktif sebesar Rp ${member.sisaPinjaman.toLocaleString("id-ID")}`
      }, { status: 400 })
    }

    await db.loanMember.delete({ where: { id } })

    return NextResponse.json({ success: true, message: `Anggota ${member.name} berhasil dihapus.` })
  } catch (error: any) {
    console.error("DELETE /api/loans error:", error)
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus anggota" }, { status: 500 })
  }
}
