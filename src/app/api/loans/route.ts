import { NextResponse } from "next/server"
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

    // Calculate aggregated stats from entire database
    const allMembers = await db.loanMember.findMany()
    const summary = {
      totalMembers: allMembers.length,
      totalActiveBorrowers: allMembers.filter((m) => m.sisaPinjaman > 0).length,
      totalSimpananPokok: allMembers.reduce((acc, m) => acc + (m.simpananPokok || 0), 0),
      totalSimpananWajib: allMembers.reduce((acc, m) => acc + (m.simpananWajib || 0), 0),
      totalSimpananSukarela: allMembers.reduce((acc, m) => acc + (m.simpananSukarela || 0), 0),
      totalSimpanan: 0,
      totalPinjamanDisalurkan: allMembers.reduce((acc, m) => acc + (m.totalPinjaman || 0), 0),
      totalSisaPinjaman: allMembers.reduce((acc, m) => acc + (m.sisaPinjaman || 0), 0)
    }
    summary.totalSimpanan = summary.totalSimpananPokok + summary.totalSimpananWajib + summary.totalSimpananSukarela

    // Reconcile with General Ledger (Kepmendes 136/2022 Accounts)
    // 2.1.01.01 / 2.1.01.02 / 2.1.01.03 for Simpanan Anggota
    // 1.1.02 for Piutang Pinjaman USP
    const glLines = await db.journalLine.findMany({
      where: {
        OR: [
          { accountCode: { startsWith: "2.1.01" } },
          { accountCode: { startsWith: "1.1.02" } }
        ]
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
            date: new Date(date),
            type,
            amount: numAmount,
            principalAmount: numPrincipal,
            interestAmount: numInterest,
            proofNumber: proofNumber || null,
            description: description || `Transaksi ${type} anggota ${member.name}`
          }
        })

        // Optional: Auto post to General Journal Entry if requested
        if (autoPostJournal) {
          const autoProofNumber = proofNumber || `USP-${Date.now().toString().slice(-6)}`
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
          } else if (type === "ANGSURAN") {
            // Can be multi-line: Kas (D), Piutang (C), Pendapatan Jasa Pinjaman (C: 4.1.01.02)
          }

          // Simple single/double posting
          if (type !== "ANGSURAN") {
            const entry = await tx.journalEntry.create({
              data: {
                proofNumber: autoProofNumber,
                proofType: type === "TARIK_SIMPANAN" || type === "PENCAIRAN_PINJAMAN" ? "BKK" : "BKM",
                date: new Date(date),
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
            // ANGSURAN: Debits Kas, Credits Piutang (principal), Credits Pendapatan Bunga (interest)
            const lines: any[] = [
              { accountCode: "1.1.01.01", type: "DEBIT", amount: numAmount }
            ]
            const piutangCode = member.memberType === "KELOMPOK" ? "1.1.02.02" : "1.1.02.01"
            if (numPrincipal > 0) {
              lines.push({ accountCode: piutangCode, type: "CREDIT", amount: numPrincipal })
            }
            if (numInterest > 0) {
              lines.push({ accountCode: "4.1.01.02", type: "CREDIT", amount: numInterest })
            }
            // fallback if amounts not split
            if (lines.length === 1) {
              lines.push({ accountCode: piutangCode, type: "CREDIT", amount: numAmount })
            }

            const entry = await tx.journalEntry.create({
              data: {
                proofNumber: autoProofNumber,
                proofType: "BKM",
                date: new Date(date),
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

      // Representative sample from SPJ 2025 Balongbesuk
      // Total Simpanan: Rp 14.820.000 (Pokok: 3.000.000, Wajib: 11.820.000)
      // Total Piutang Pinjaman: Rp 89.000.000 (Masyarakat: 61.000.000, Gapoktan: 28.000.000)
      const sampleMembers = [
        {
          memberNo: "ANG-001",
          name: "Sukoco",
          nik: "3517031201780001",
          phone: "081234567891",
          address: "Dusun Besuk RT 01 RW 01",
          groupName: "RT 01",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 250000,
          simpananSukarela: 0,
          totalPinjaman: 5000000,
          sisaPinjaman: 5000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Usaha Toko Kelontong"
        },
        {
          memberNo: "ANG-002",
          name: "Tri Widodo",
          nik: "3517031505820002",
          phone: "081234567892",
          address: "Dusun Balong RT 02 RW 02",
          groupName: "RT 02",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 220000,
          simpananSukarela: 0,
          totalPinjaman: 4000000,
          sisaPinjaman: 4000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 10,
          statusPinjaman: "BERJALAN",
          notes: "Usaha Bengkel Las"
        },
        {
          memberNo: "ANG-003",
          name: "Joko Santoso",
          nik: "3517032008750003",
          phone: "081234567893",
          address: "Dusun Cangkring RT 01 RW 03",
          groupName: "RT 01",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 300000,
          simpananSukarela: 0,
          totalPinjaman: 6000000,
          sisaPinjaman: 6000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Usaha Penggilingan Padi"
        },
        {
          memberNo: "ANG-004",
          name: "Purnomo",
          nik: "3517030503790004",
          phone: "081234567894",
          address: "Dusun Besuk RT 03 RW 01",
          groupName: "RT 03",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 200000,
          simpananSukarela: 0,
          totalPinjaman: 3000000,
          sisaPinjaman: 3000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 10,
          statusPinjaman: "BERJALAN",
          notes: "Usaha Konveksi"
        },
        {
          memberNo: "ANG-005",
          name: "Kuswanto",
          nik: "3517031109840005",
          phone: "081234567895",
          address: "Dusun Balong RT 01 RW 02",
          groupName: "RT 01",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 200000,
          simpananSukarela: 0,
          totalPinjaman: 5000000,
          sisaPinjaman: 5000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Usaha Ternak Ayam"
        },
        {
          memberNo: "ANG-006",
          name: "Bambang Irawan",
          nik: "3517031406800006",
          phone: "081234567896",
          address: "Dusun Besuk RT 02 RW 01",
          groupName: "RT 02",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 200000,
          simpananSukarela: 0,
          totalPinjaman: 5000000,
          sisaPinjaman: 5000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Pedagang Sayur Pasar"
        },
        {
          memberNo: "ANG-007",
          name: "Wahyudi",
          nik: "3517032207860007",
          phone: "081234567897",
          address: "Dusun Cangkring RT 02 RW 03",
          groupName: "RT 02",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 200000,
          simpananSukarela: 0,
          totalPinjaman: 5000000,
          sisaPinjaman: 5000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Usaha Mebel"
        },
        {
          memberNo: "ANG-008",
          name: "Sumari",
          nik: "3517031908770008",
          phone: "081234567898",
          address: "Dusun Balong RT 03 RW 02",
          groupName: "RT 03",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 200000,
          simpananSukarela: 0,
          totalPinjaman: 5000000,
          sisaPinjaman: 5000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Petani Jagung"
        },
        {
          memberNo: "ANG-009",
          name: "Nanang Supriadi",
          nik: "3517032511850009",
          phone: "081234567899",
          address: "Dusun Besuk RT 04 RW 01",
          groupName: "RT 04",
          memberType: "INDIVIDU",
          simpananPokok: 50000,
          simpananWajib: 200000,
          simpananSukarela: 0,
          totalPinjaman: 5000000,
          sisaPinjaman: 5000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Usaha Percetakan"
        },
        {
          memberNo: "ANG-010",
          name: "Budi Utomo & 50 Anggota Lainnya (Gabungan)",
          nik: "3517030000000010",
          phone: "081234567800",
          address: "Desa Balongbesuk",
          groupName: "Kolektif Anggota",
          memberType: "INDIVIDU",
          simpananPokok: 2500000, // 50 anggota x Rp 50.000 = Rp 2.500.000 (Total Simpanan Pokok Rp 3.000.000)
          simpananWajib: 9650000, // Menjadikan Total Simpanan Wajib Tepat Rp 11.820.000
          simpananSukarela: 0,
          totalPinjaman: 18000000, // Menjadikan Total Pinjaman Masyarakat Tepat Rp 61.000.000
          sisaPinjaman: 18000000,
          bungaPersen: 1.5,
          jangkaWaktuBulan: 12,
          statusPinjaman: "BERJALAN",
          notes: "Representasi rekonsiliasi anggota aktif simpan pinjam desa"
        },
        {
          memberNo: "PKT-001",
          name: "GAPOKTAN Tani Mulyo (Kelompok Tani)",
          nik: "3517039900010001",
          phone: "081399887766",
          address: "Dusun Besuk Barat",
          groupName: "Gapoktan Tani Mulyo",
          memberType: "KELOMPOK",
          simpananPokok: 50000,
          simpananWajib: 200000,
          simpananSukarela: 0,
          totalPinjaman: 28000000, // Sesuai Piutang Gapoktan SPJ 2025
          sisaPinjaman: 28000000,
          bungaPersen: 1.0,
          jangkaWaktuBulan: 24,
          statusPinjaman: "BERJALAN",
          notes: "Pembiayaan Sarana Produksi Padi Organik Musim Tanam 2025"
        }
      ]

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

        // Reconciled Opening Journal Entry for USP matching SPJ 2025
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
                { accountCode: "2.1.01.01", type: "CREDIT", amount: 3000000 },
                { accountCode: "2.1.01.02", type: "CREDIT", amount: 11820000 },
                { accountCode: "3.1.01.01", type: "CREDIT", amount: 74180000 }
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
    if (!session) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 401 })
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
