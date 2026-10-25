import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding Kemendes 136 COA and Transaction Templates...")

  // 1. Seed COA Kemendes 136
  const coaPath = path.join(__dirname, "coa_kemendes_136.json")
  if (fs.existsSync(coaPath)) {
    const raw = fs.readFileSync(coaPath, "utf-8")
    const coaList: { code: string; name: string; type: string; normal: string }[] = JSON.parse(raw)
    
    console.log(`Upserting ${coaList.length} Kemendes 136 accounts...`)
    for (const item of coaList) {
      await prisma.ledgerAccount.upsert({
        where: { code: item.code },
        update: { name: item.name, type: item.type, normal: item.normal },
        create: {
          code: item.code,
          name: item.name,
          type: item.type,
          normal: item.normal
        }
      })
    }
  }

  // 2. Default Transaction Templates (Ramah Operator, terhubung ke Kepmendes 136 & Arus Kas)
  const defaultTemplates = [
    // === BKM (Kas Masuk) ===
    {
      category: "BKM",
      name: "Penerimaan Sewa Gedung Serbaguna",
      unitUsaha: "GEDUNG",
      targetAccount: "4.1.04.01", // Pendapatan Sewa Gedung
      cashAccount: "1.1.01.01",   // Kas Tunai
      cashFlowGroup: "Penerimaan kas dari penjualan jasa",
      description: "Setoran penerimaan sewa gedung serbaguna dari penyewa"
    },
    {
      category: "BKM",
      name: "Penerimaan Sewa Lahan / Kios / Lapak",
      unitUsaha: "LAHAN",
      targetAccount: "4.1.04.02", // Pendapatan Sewa Tanah/Bangunan/Kios
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Penerimaan kas dari penjualan jasa",
      description: "Setoran sewa tanah/kios/lapak usaha desa"
    },
    {
      category: "BKM",
      name: "Penerimaan Angsuran Pinjaman (Pokok & Jasa)",
      unitUsaha: "SP",
      targetAccount: "1.1.03.01", // Piutang Usaha
      cashAccount: "1.1.01.01",
      cashFlowGroup: "penerimaan kas dari angsuran pinjaman",
      description: "Penerimaan setoran angsuran pinjaman nasabah/anggota"
    },
    {
      category: "BKM",
      name: "Penerimaan Pendapatan Jasa Simpan Pinjam (Bunga)",
      unitUsaha: "SP",
      targetAccount: "4.1.05.01", // Pendapatan Jasa Pelayanan
      cashAccount: "1.1.01.01",
      cashFlowGroup: "penerimaan kas dari bagi hasil, bunga dan dividen",
      description: "Penerimaan jasa/bunga pinjaman simpan pinjam"
    },
    {
      category: "BKM",
      name: "Penerimaan Komisi PPOB / Agen Pos / Loket",
      unitUsaha: "PPOB",
      targetAccount: "4.1.05.99", // Pendapatan Jasa Lainnya
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Penerimaan kas dari penjualan jasa",
      description: "Penerimaan komisi/fee transaksi PPOB loket desa"
    },
    {
      category: "BKM",
      name: "Penyertaan Modal Desa (APBDes)",
      unitUsaha: "UMUM",
      targetAccount: "3.1.01.01", // Penyertaan Modal Desa Awal / Berjalan
      cashAccount: "1.1.01.04",   // Kas di Bank BRI (biasanya via rekening)
      cashFlowGroup: "Penerimaan Kas dari Penyertaan Modal Desa",
      description: "Penerimaan transfer penyertaan modal dari Pemerintah Desa"
    },
    {
      category: "BKM",
      name: "Penerimaan Pendapatan Bunga Bank",
      unitUsaha: "UMUM",
      targetAccount: "4.2.01.01", // Pendapatan Bunga Bank
      cashAccount: "1.1.01.04",
      cashFlowGroup: "penerimaan kas dari bunga bank",
      description: "Pendapatan bagi hasil / bunga dari rekening bank"
    },

    // === BKK (Kas Keluar) ===
    {
      category: "BKK",
      name: "Pembayaran Honorarium / Gaji Pengurus & Staf",
      unitUsaha: "UMUM",
      targetAccount: "5.1.01.01", // Beban Gaji dan Upah
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Pengeluaran kas untuk pembayaran gaji/upah pegawai/karyawan",
      description: "Pembayaran gaji/honorarium pengurus BUM Desa"
    },
    {
      category: "BKK",
      name: "Pembelian ATK dan Perlengkapan Kantor",
      unitUsaha: "UMUM",
      targetAccount: "1.1.06.01", // Perlengkapan / ATK
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Pengeluaran kas untuk pembayaran beban-beban yang lain",
      description: "Pembelian alat tulis kantor (ATK), kertas, toner, dll."
    },
    {
      category: "BKK",
      name: "Biaya Listrik, Air, dan Internet Kantor",
      unitUsaha: "UMUM",
      targetAccount: "5.1.02.01", // Beban Listrik, Air, Telepon
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Pengeluaran kas untuk pembayaran beban-beban yang lain",
      description: "Pembayaran tagihan listrik, air, atau WiFi kantor BUMDes"
    },
    {
      category: "BKK",
      name: "Biaya Kebersihan & Pemeliharaan Gedung",
      unitUsaha: "GEDUNG",
      targetAccount: "5.1.03.01", // Beban Pemeliharaan Bangunan
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Pengeluaran kas untuk pembayaran beban-beban yang lain",
      description: "Biaya servis, perbaikan fasilitas gedung, dan kebersihan"
    },
    {
      category: "BKK",
      name: "Pencairan Pinjaman Nasabah (Simpan Pinjam)",
      unitUsaha: "SP",
      targetAccount: "1.1.03.01", // Piutang Usaha
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Pengeluaran kas untuk pinjaman",
      description: "Pencairan dana kredit pinjaman masyarakat/anggota"
    },
    {
      category: "BKK",
      name: "Pembelian Peralatan / Mesin / Aset Tetap",
      unitUsaha: "UMUM",
      targetAccount: "1.3.01.01", // Peralatan dan Mesin
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Pengeluaran Kas untuk Pembelian Aset Tetap",
      description: "Pengeluaran belanja inventaris / aset tetap BUM Desa"
    },
    {
      category: "BKK",
      name: "Penyetoran Pajak (PPh / PPN)",
      unitUsaha: "UMUM",
      targetAccount: "2.1.04.01", // Utang Pajak
      cashAccount: "1.1.01.01",
      cashFlowGroup: "Pengeluaran kas untku pembayaran pajak",
      description: "Penyetoran kewajiban pajak ke kas negara"
    },
    {
      category: "BKK",
      name: "Beban Administrasi Bank",
      unitUsaha: "UMUM",
      targetAccount: "5.2.01.01", // Beban Administrasi Bank
      cashAccount: "1.1.01.04",
      cashFlowGroup: "Pengeluaran kas untuk pembayaran beban-beban yang lain",
      description: "Potongan biaya administrasi bulanan rekening bank"
    }
  ]

  console.log(`Seeding ${defaultTemplates.length} Transaction Templates...`)
  for (const t of defaultTemplates) {
    const existing = await prisma.transactionTemplate.findFirst({
      where: { name: t.name, category: t.category }
    })
    if (!existing) {
      await prisma.transactionTemplate.create({ data: t })
    }
  }

  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
