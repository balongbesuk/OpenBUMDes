import { db } from "@/lib/db"

export interface BumdesSettings {
  bumdes_name: string
  village_name: string
  district_name: string
  regency_name: string
  shu_pengurus_pct: string
  shu_pengawas_pct: string
  shu_sosial_pct: string
  shu_modal_pct: string
  shu_desa_pct: string
  director_name?: string
  treasurer_name?: string
  secretary_name?: string
  [key: string]: string | undefined
}

const defaults: BumdesSettings = {
  bumdes_name: "",
  village_name: "",
  district_name: "",
  regency_name: "",
  director_name: "H. Suryono, S.Sos",
  treasurer_name: "Siti Rahmawati, S.E.",
  secretary_name: "Budi Santoso, S.Kom",
  shu_pengurus_pct: "30",
  shu_pengawas_pct: "10",
  shu_sosial_pct: "10",
  shu_modal_pct: "25",
  shu_desa_pct: "25",
  sewa_lahan_whatsapp: "6281234567890",
  sewa_lahan_description: "Unit Sewa Lahan BUMDes menyediakan kavling usaha berupa lapak tenda dan bangunan warung permanen di lokasi-lokasi strategis desa. Kami bertujuan mendukung akselerasi usaha mikro warga lokal dan penataan PKL agar lebih tertib, bersih, serta ramai dikunjungi pembeli.",
  sewa_lahan_rates: "Tarif Lapak Tenda: Rp 150.000 / bulan\nTarif Warung Permanen: Rp 1.500.000 / tahun",
  sewa_lahan_requirements: "Fotokopi KTP & KK warga desa setempat\nMengisi formulir pengajuan sewa\nMembayar uang jaminan kebersihan",
  sewa_gedung_whatsapp: "6281234567890",
  sewa_gedung_description: "BUMDes mengelola dan menyewakan Gedung Serbaguna Desa sebagai pusat fasilitas olahraga kemasyarakatan, resepsi pernikahan, pertemuan/rapat warga, serta acara hiburan seni budaya. Kami berkomitmen memberikan tempat yang bersih, nyaman, dan bertarif terjangkau demi menunjang kegiatan sosial-ekonomi warga desa setempat.",
  sewa_gedung_facilities: "Area Hall utama luas dengan kapasitas hingga 800 orang tamu berdiri.\nLapangan Bulutangkis (Badminton) indoor aktif sebanyak 2 line lapangan.\nPanggung permanen, toilet bersih, ruang ganti pakaian, dan area parkir memadai.",
  sewa_gedung_rates: "Olahraga Bulutangkis: Rp 20.000 / jam per lapangan\nAcara Resepsi / Pesta Pernikahan: Mulai dari Rp 1.500.000 / hari\nRapat / Seminar / Sosialisasi: Rp 500.000 / hari",
  simpan_pinjam_whatsapp: "6281234567890",
  simpan_pinjam_description: "Unit Simpan Pinjam didirikan khusus untuk memberikan akses permodalan yang mudah, cepat, dan aman bagi masyarakat desa serta kelompok tani (Poktan). Kami berfokus untuk menunjang produktivitas ekonomi pedesaan dan memberantas ketergantungan warga pada pinjaman liar dengan suku bunga yang menjerat.",
  simpan_pinjam_benefits: "Suku bunga flat kompetitif yang ditentukan oleh hasil Musyawarah Desa (Musdes).\nProses pengajuan transparan, kekeluargaan, dan bebas biaya administrasi siluman.\nDana simpanan diputar kembali untuk membiayai usaha produktif warga lokal.",
  simpan_pinjam_rates: "Plafon Usaha: Maksimal pinjaman Rp 10.000.000 (disesuaikan dengan skala usaha).\nTenor Waktu: Fleksibel mulai dari 3 bulan s/d 12 bulan.\nPeminjam wajib terdaftar sebagai anggota aktif BUMDes.",
  simpan_pinjam_requirements: "Fotokopi KTP suami/istri (bagi yang sudah menikah) dan Kartu Keluarga (KK).\nSurat Keterangan Usaha (SKU) dari RT/RW atau Kantor Desa.\nPas foto ukuran 3x4 sebanyak 2 lembar.\nSimpanan Pokok & Wajib sebagai anggota aktif.",
  ppob_whatsapp: "6281234567890",
  ppob_description: "Unit PPOB (Payment Point Online Bank) BUMDes adalah pusat layanan pembayaran digital warga desa yang dekat dan terpercaya. Kini warga tidak perlu menempuh perjalanan jauh ke kota kecamatan hanya untuk mengantre membayar tagihan. Cukup kunjungi loket BUMDes atau agen pos desa kami untuk melunasi tagihan bulanan Anda secara cepat.",
  ppob_billings: "Listrik PLN: Pembelian token prabayar dan pelunasan tagihan listrik pascabayar.\nPDAM: Pembayaran tagihan air bersih bulanan PDAM kabupaten setempat.\nBPJS Kesehatan: Pembayaran iuran jaminan kesehatan mandiri untuk keluarga.",
  ppob_services: "Isi ulang pulsa reguler, paket data internet seluruh operator seluler (Telkomsel, Indosat, XL, Smartfren, dll).\nTop-up saldo e-wallet (DANA, OVO, ShopeePay, GoPay, LinkAja) untuk kebutuhan belanja digital.\nPembayaran cicilan pembiayaan (motor/mobil) dan transfer antar bank nasional.",
  ppob_reasons: "Aman & Terbuka: Setiap pembayaran menghasilkan struk bukti fisik resmi berstempel BUMDes.\nDekat & Hemat Waktu: Loket berlokasi di Kantor BUMDes atau agen pos desa.\nMembangun Desa: Sebagian biaya admin disalurkan kembali sebagai Pendapatan Asli Desa (PADes).",
  umkm_list: JSON.stringify([
    {
      id: 1,
      name: "Kripik Singkong Renyah Desa",
      category: "Makanan Ringan",
      description: "Diproduksi langsung oleh Ibu-Ibu kelompok tani desa. Renyah, gurih, dan dibuat tanpa bahan pengawet.",
      phone: "6281234567890",
      imageUrl: "/umkm/kripik_singkong.png"
    },
    {
      id: 2,
      name: "Madu Hutan Asli Desa",
      category: "Kesehatan",
      description: "Madu murni hasil budidaya lebah hutan lokal. Terbukti menjaga imun tubuh, dipanen secara higienis dan berkala.",
      phone: "6281234567890",
      imageUrl: "/umkm/madu_desa.png"
    },
    {
      id: 3,
      name: "Batik Tulis Khas Desa",
      category: "Kerajinan",
      description: "Karya seni batik tulis buatan perajin lokal desa dengan motif khas alam pedesaan. Premium dan bernilai seni tinggi.",
      phone: "6281234567890",
      imageUrl: "/umkm/batik_desa.png"
    },
    {
      id: 4,
      name: "Kopi Robusta Lereng Desa",
      category: "Minuman",
      description: "Biji kopi robusta pilihan hasil kebun warga lereng bukit desa. Dipanggang dengan tingkat kematangan medium-dark.",
      phone: "6281234567890",
      imageUrl: "/umkm/kopi_desa.png"
    },
    {
      id: 5,
      name: "Keripik Tempe Gurih Sagu",
      category: "Makanan Ringan",
      description: "Keripik tempe sagu khas desa yang tipis, renyah, dan digoreng dengan minyak kelapa berkualitas tinggi.",
      phone: "6281234567890",
      imageUrl: "/umkm/keripik_tempe.png"
    },
    {
      id: 6,
      name: "Minyak Kelapa Asli (VCO)",
      category: "Kesehatan",
      description: "Minyak kelapa murni yang diproses dingin tanpa pemanasan suhu tinggi. Sangat baik untuk suplemen kesehatan dan kecantikan.",
      phone: "6281234567890",
      imageUrl: "/umkm/vco_desa.png"
    },
    {
      id: 7,
      name: "Gula Aren Cetak Murni",
      category: "Bahan Dapur",
      description: "Gula aren asli dari sadapan nira pohon enau di hutan desa. Manis alami tanpa campuran gula pasir.",
      phone: "6281234567890",
      imageUrl: "/umkm/gula_aren.png"
    },
    {
      id: 8,
      name: "Tas Anyaman Bambu Cantik",
      category: "Kerajinan",
      description: "Kerajinan tangan tas anyaman bambu multifungsi yang ramah lingkungan, awet, dan bernilai seni.",
      phone: "6281234567890",
      imageUrl: "/umkm/tas_bambu.png"
    },
    {
      id: 9,
      name: "Sambal Kemasan Khas Desa",
      category: "Makanan Ringan",
      description: "Sambal ulek tradisional dengan bahan cabai segar dari ladang desa. Dikemas higienis dan praktis.",
      phone: "6281234567890",
      imageUrl: "/umkm/sambal_desa.png"
    },
    {
      id: 10,
      name: "Susu Kambing Etawa Segar",
      category: "Kesehatan",
      description: "Susu kambing etawa segar hasil perahan peternakan desa. Kaya nutrisi dan higienis tanpa bau prengus.",
      phone: "6281234567890",
      imageUrl: "/umkm/susu_etawa.png"
    }
  ])
}

/**
 * Reads all settings from the database and returns them as a typed object.
 * Falls back to defaults if keys are missing.
 */
export async function getSettings(): Promise<BumdesSettings> {
  const rows = await db.setting.findMany()
  const map: Record<string, string> = {}
  rows.forEach((r) => {
    map[r.key] = r.value
  })
  return { ...defaults, ...map }
}

/**
 * Check whether initial setup has been completed.
 * Returns true if bumdes_name is non-empty.
 */
export async function isSetupComplete(): Promise<boolean> {
  const setting = await db.setting.findUnique({ where: { key: "bumdes_name" } })
  return !!setting && setting.value.trim().length > 0
}
