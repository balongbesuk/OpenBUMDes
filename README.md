# OpenBUMDes

> **Sistem Informasi Akuntansi & Laporan Keuangan BUMDes Terpadu**  
> Standar Resmi **Keputusan Menteri Desa, PDTT No. 136 Tahun 2022** & **SAK EMKM**

[![Lisensi: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Framework: Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015-black)](https://nextjs.org/)
[![UI: React 19](https://img.shields.io/badge/UI-React%2019-61dafb)](https://react.dev/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8)](https://tailwindcss.com/)
[![Database: SQLite WAL](https://img.shields.io/badge/Database-SQLite%20(WAL)-003b57)](https://www.sqlite.org/)
[![ORM: Prisma](https://img.shields.io/badge/ORM-Prisma%205-2d3748)](https://www.prisma.io/)
[![AI: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange)](https://aistudio.google.com/)

---

## 📌 Tentang OpenBUMDes

**OpenBUMDes** adalah aplikasi akuntansi dan pelaporan keuangan berbasis web sumber terbuka (*open source*) yang dibangun khusus untuk memudahkan Badan Usaha Milik Desa (BUMDes / BUMDesa Bersama) di seluruh Indonesia dalam mengelola pembukuan kas harian dan menyusun laporan pertanggungjawaban tahunan.

Aplikasi ini mengadopsi secara ketat dan penuh:
1. **Keputusan Menteri Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi (Kepmendesa PDTT) No. 136 Tahun 2022** tentang Panduan Penyusunan Laporan Keuangan BUM Desa.
2. **Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)** dari Ikatan Akuntan Indonesia (IAI).

Dengan OpenBUMDes, pengurus BUMDes dan pemerintah desa tidak lagi direpotkan oleh rumus Excel yang mudah rusak, ketidakseimbangan debit-kredit, atau kesulitan menyiapkan dokumen audit pemeriksaan (*audit trail*) saat dikunjungi oleh **Inspektorat Daerah**, **BPKP**, maupun **Dinas PMD**.

---

## 🌟 Fitur-Fitur Utama Aplikasi

### 1. 📊 Dashboard Eksekutif & Indeks Kesehatan Keuangan
* **Kalkulasi Indeks Otomatis:** Menilai 4 pilar kesehatan keuangan BUMDes secara real-time dari data pembukuan:
  * **Likuiditas Kas:** Ketersediaan dana kas & bank siap pakai untuk operasional harian.
  * **Margin Keuntungan:** Efisiensi laba bersih usaha terhadap total perputaran pendapatan.
  * **Solvabilitas Utang:** Rasio kemandirian modal terhadap beban kewajiban pihak ketiga.
  * **Akumulasi Ekuitas Desa:** Akumulasi penyertaan modal APBDes ditambah sisa hasil usaha ditahan.
* **Diagnosa Direktur & Kepala Desa:** Memberikan catatan kesimpulan otomatis mengenai kondisi keuangan terkini.
* **Ringkasan Posisi Keuangan:** Kartu indikator Total Kas & Bank, Pendapatan Usaha, Beban Operasional, dan SHU Tahun Berjalan.

---

### 2. 📖 Buku Kas Umum (BKU) & Pencatatan Jurnal
* **Pencatatan Ganda Otomatis (*Double-Entry Ledger*):** Setiap transaksi kas otomatis menjurnal akun lawan yang sesuai.
* **Klasifikasi Bukti Kas:** Mendukung Bukti Kas Masuk (BKM), Bukti Kas Keluar (BKK), dan Mutasi Antar Kas/Bank.
* **Penyaringan Fleksibel:** Filter transaksi berdasarkan Bulan, Tahun Buku, dan Jenis Bukti Kas.
* **Pencarian Cepat:** Pencarian cerdas berdasarkan nomor bukti, deskripsi transaksi, atau pihak rekanan.
* **Cetak Kwitansi Resmi:** Format cetak Kwitansi/Bukti Kas standar dengan nomor otomatis dan tanda tangan lengkap.
* **Edit Rekanan Langsung (*Inline Editing*):** Memperbarui nama penerima/penyetor langsung pada tabel BKU.
* **Ekspor Excel 1 Tahun Penuh (Multi-Sheet):** Sekali klik untuk mengunduh rekapitulasi BKU 1 tahun fiskal lengkap dalam format multi-sheet (Januari s.d. Desember + Rekap Tahunan).

---

### 3. 📑 5 Laporan Keuangan Standar Kepmendes 136/2022
Seluruh laporan dihasilkan secara otomatis tanpa perlu rekapitulasi manual:
1. **Laporan Laba Rugi Komprehensif:** Menyajikan Pendapatan Usaha, Beban Pokok Penjualan/Produksi, Beban Operasional, Pendapatan/Beban Lain-Lain, hingga Laba Bersih (SHU) Tahun Berjalan.
2. **Laporan Posisi Keuangan (Neraca SAK EMKM):** Menyajikan Aset Lancar, Aset Tetap Bersih, Kewajiban Jangka Pendek, serta Ekuitas BUMDes yang selalu seimbang (*balanced*).
3. **Laporan Perubahan Ekuitas (LPE):** Rincian mutasi modal awal APBDes, penyertaan modal tambahan, laba ditahan, dan ekuitas akhir periode.
4. **Laporan Arus Kas (LAK Metode Langsung):** Mengelompokkan arus kas masuk dan keluar ke dalam 3 aktivitas utama: **Operasi**, **Investasi**, dan **Pendanaan**.
5. **Catatan atas Laporan Keuangan (CaLK):** Gambaran umum BUMDes, kebijakan akuntansi, dan rincian penjelasan pos-pos laporan keuangan.
* **Cetak LPJ Terpadu:** Cetak laporan pertanggungjawaban komprehensif ke format dokumen resmi siap ditandatangani.

---

### 4. 🔒 Tutup Buku & Buka Buku Tahunan
* **Otomasi Akhir Tahun:** Menutup akun pendapatan dan beban ke akun Laba Ditahan per 31 Desember.
* **Buka Saldo Awal Otomatis:** Membawa saldo neraca akhir tahun menjadi saldo awal (*Opening Balance*) tahun berikutnya.
* **Buka Kembali Buku (*Reopen Period*):** Administrator dapat membuka kembali pembukuan tahun yang telah ditutup jika terdapat perbaikan data transaksi yang sah.

---

### 5. 🗂️ Bagan Akun Standar (COA Dinamis)
* **Master COA Kepmendes 136:** Dilengkapi lebih dari 130 akun standar resmi (Aset, Kewajiban, Ekuitas, Pendapatan, Beban).
* **Tambah Akun Kustom:** Kemudahan menambah sub-akun bank lokal (misal: *Bank Jatim*, *Bank Jombang*) atau unit usaha spesifik desa.
* **Proteksi Akun:** Akun yang telah memiliki riwayat transaksi tidak dapat terhapus secara tidak sengaja.

---

### 6. 🤖 Asisten Pintar & Audit Kwitansi (Google Gemini AI)
* **AI Kwitansi Reader:** Unggah foto atau scan nota/kuitansi belanja, sistem secara otomatis mengekstrak tanggal, nominal, nama toko/rekanan, dan merekomendasikan akun debit/kredit yang tepat.
* **Koneksi Opsional:** Fitur AI opsional; aplikasi tetap berfungsi 100% secara offline tanpa memerlukan API key.

---

### 7. 🛡️ Keamanan, Pengaturan Instansi & Pemeliharaan
* **Identitas Lembaga:** Input Nama BUMDes, Desa, Kecamatan, Kabupaten, dan unggah Logo Resmi.
* **Legalitas Pejabat Penandatangan:** Konfigurasi Nama dan NIP untuk **Direktur BUMDes**, **Bendahara**, **Penasihat (Kepala Desa)**, dan **Pengawas (Ketua BPD)**.
* **Manajemen Pengguna Multi-Role:** Pembagian hak akses antara Administrator (pengaturan & audit) dan Operator (kasir & pencatatan transaksi).
* **Pencadangan & Pemulihan Sistem:** Fitur Backup basis data lokal, Restore cadangan instan, dan Reset sistem dengan konfirmasi keamanan berlapis.

---

## 💻 Tech Stack & Arsitektur

* **Framework Utama:** [Next.js 15 (App Router)](https://nextjs.org/)
* **UI Library:** [React 19](https://react.dev/)
* **Bahasa Pemrograman:** [TypeScript 5.6](https://www.typescriptlang.org/)
* **Styling & Desain:** [Tailwind CSS 3.4](https://tailwindcss.com/) dengan palet HSL modern dan antarmuka responsif
* **Basis Data:** [SQLite 3](https://www.sqlite.org/) mode *Write-Ahead Logging* (WAL) – tanpa instalasi database server eksternal yang rumit
* **ORM:** [Prisma ORM 5.21](https://www.prisma.io/)
* **Ekspor Excel:** [SheetJS (xlsx)](https://docs.sheetjs.com/)
* **Mesin AI:** [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini Flash)
* **Ikon:** [Lucide React](https://lucide.dev/)

---

## 🚀 Panduan Instalasi & Menjalankan

Ikuti panduan langkah demi langkah berikut untuk memasang OpenBUMDes di komputer lokal atau server Anda.

### Prasyarat Perangkat Lunak
Pastikan perangkat Anda telah terpasang:
* **Node.js** versi **18.18.0** atau **20.x** ke atas ([Unduh Node.js](https://nodejs.org/))
* **Git** ([Unduh Git](https://git-scm.com/))
* Manajer Paket: 
pm (bawaan Node.js)

---

### Langkah 1: Kloning Repositori
Buka terminal (Command Prompt / PowerShell / Git Bash / Terminal Linux):
`ash
git clone https://github.com/balongbesuk/OpenBUMDes.git
cd OpenBUMDes
`

---

### Langkah 2: Pasang Dependensi
Pasang seluruh pustaka yang dibutuhkan:
`ash
npm install
`

---

### Langkah 3: Konfigurasi File Lingkungan (Opsional)
Aplikasi sudah memiliki kunci rahasia default untuk mode pengembangan lokal. Jika Anda ingin mengatur kunci khusus, salin .env.example menjadi .env.local:

* **Di Windows (PowerShell):**
  `powershell
  copy .env.example .env.local
  `
* **Di Linux / macOS:**
  `ash
  cp .env.example .env.local
  `

---

### Langkah 4: Inisialisasi Basis Data & Bagan Akun
Jalankan sinkronisasi skema basis data SQLite:
`ash
npx prisma db push
`

Jalankan proses *seeding* untuk memuat Bagan Akun Standar (COA) Kepmendes 136/2022 serta akun login default:
`ash
npx prisma db seed
`

*(Direkomendasikan)* Muat template transaksi kas harian BUMDes:
`ash
npm run db:seed-templates
`

---

### Langkah 5: Jalankan Server Aplikasi
Jalankan server pengembangan:
`ash
npm run dev
`

Buka peramban (browser) dan akses:
👉 **http://localhost:3000**

---

## 🔑 Akun Pengguna Bawaan (Default Credentials)

Sistem menyediakan 2 akun login bawaan (juga tersedia tombol **Akses Cepat** pada jendela login):

| Peran (Role) | Username | Password | Otoritas & Tanggung Jawab |
|:---|:---:|:---:|:---|
| **Administrator** | dmin | dmin123 | **Akses Penuh:** Pengaturan identitas instansi, pejabat penandatangan, manajemen akun user, kunci periode, integrasi Gemini AI, serta backup, restore, dan reset database. |
| **Operator** | operator | operator123 | **Kasir & BKU:** Mencatat transaksi kas masuk/keluar, saldo awal kas/bank, cetak kwitansi BKM/BKK, dan meninjau laporan keuangan. |

---

## 📋 Langkah Awal Penggunaan (Setup Instansi)

1. Masuk (*login*) sebagai **Administrator** (dmin).
2. Masuk ke tab **Pengaturan & AI** pada bilah menu samping:
   * **Identitas Lembaga:** Masukkan Nama BUMDes, Nama Desa, Kecamatan, Kabupaten, Alamat Kantor, dan unggah Logo Resmi.
   * **Pejabat Penandatangan:** Masukkan Nama dan NIP untuk **Direktur**, **Bendahara**, **Penasihat (Kepala Desa)**, dan **Pengawas (Ketua BPD)**.
   * **Integrasi AI (Opsional):** Masukkan API Key gratis dari [Google AI Studio](https://aistudio.google.com/) agar asisten pembaca kwitansi aktif.
3. Masuk ke tab **Tutup & Buka Buku**:
   * Masukkan **Saldo Awal Kas / Bank** pada awal tahun buku jika BUMDes telah memiliki saldo berjalan sebelumnya.
4. Masuk ke tab **Buku Kas & Jurnal**:
   * Mulai catat transaksi penerimaan (BKM) atau pengeluaran (BKK) secara tertib!

---

## 📦 Panduan Build & Deploy ke Server Produksi

OpenBUMDes sangat ringan dan dapat dijalankan di VPS (Ubuntu/Debian) berbiaya rendah dengan spesifikasi RAM 1 GB:

`ash
# 1. Pastikan dependensi terpasang
npm install

# 2. Build aplikasi untuk produksi
npm run build

# 3. Jalankan aplikasi dalam mode produksi
npm run start
`

### Menjalankan di Background dengan PM2:
`ash
# Pasang PM2 secara global
npm install -g pm2

# Jalankan server OpenBUMDes
pm2 start npm --name  openbumdes -- run start

# Simpan autostart saat server restart
pm2 save
pm2 startup
`

---

## 📁 Struktur Direktori Proyek

`	ext
OpenBUMDes/
├── prisma/
│   ├── coa_kemendes_136.json   # 130+ daftar akun standar Kepmendes 136/2022
│   ├── schema.prisma           # Skema tabel database SQLite
│   ├── seed.ts                 # Skrip seeder akun bawaan & COA
│   └── seed_templates.ts       # Template transaksi kas harian BUMDes
├── public/                     # Aset publik statis
├── src/
│   ├── app/
│   │   ├── api/                # REST API backend (cash-book, coa, closing, auth, ai, settings, system)
│   │   ├── globals.css         # Styling global Tailwind CSS
│   │   ├── layout.tsx          # Root layout & font metadata
│   │   ├── page.tsx            # Antarmuka tunggal terpadu OpenBUMDes
│   │   └── robots.ts           # Konfigurasi crawler robots.txt
│   ├── components/             # Komponen UI modal & tab (BKU, Kwitansi, COA, Closing, Maintenance, dll.)
│   └── lib/                    # Logika bisnis akuntansi (Double-Entry Ledger, Gemini AI, Auth, DB)
├── CHANGELOG.md                # Catatan riwayat versi rilis
├── LICENSE                     # Lisensi GNU General Public License v3.0
├── package.json                # Dependensi dan script npm
├── README.md                   # Dokumentasi resmi proyek
└── SECURITY.md                 # Kebijakan pelaporan keamanan
`

---

## 🤝 Berkontribusi

Kami mengundang para pegiat desa, *software engineer*, akuntan, dan akademisi untuk bersama-sama menyempurnakan OpenBUMDes:

1. **Fork** repositori ini.
2. Buat cabang fitur baru: git checkout -b fitur/nama-fitur-anda.
3. Simpan perubahan Anda: git commit -m 'feat: menambahkan fitur pelaporan baru'.
4. Unggah ke cabang Anda: git push origin fitur/nama-fitur-anda.
5. Buat **Pull Request** melalui antarmuka GitHub.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **[GNU General Public License v3.0 (GPL-3.0)](LICENSE)**.  
Anda bebas menggunakan, memodifikasi, dan mendistribusikan aplikasi ini untuk kemandirian, transparansi, dan kemajuan ekonomi desa di seluruh Indonesia.
