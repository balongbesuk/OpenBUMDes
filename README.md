# OpenBUMDes

<p align="center">
  <strong>Sistem Informasi Akuntansi & Laporan Keuangan BUMDes Terpadu</strong><br>
  Standar Resmi <strong>Keputusan Menteri Desa, PDTT No. 136 Tahun 2022</strong> & <strong>SAK EMKM</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square" alt="Lisensi GPL v3"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Framework-Next.js%2015-black?style=flat-square" alt="Next.js 15"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/UI-React%2019-61dafb?style=flat-square" alt="React 19"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=flat-square" alt="Tailwind CSS"></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/Database-SQLite%20(WAL)-003b57?style=flat-square" alt="SQLite WAL"></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/ORM-Prisma%205-2d3748?style=flat-square" alt="Prisma 5"></a>
  <a href="https://aistudio.google.com/"><img src="https://img.shields.io/badge/AI-Google%20Gemini-orange?style=flat-square" alt="Google Gemini"></a>
</p>

<img width="1464" height="817" alt="image" src="https://github.com/user-attachments/assets/cd2b4de9-1dd6-45c8-aed8-e805cc5ed1c7" />

---

## 📌 Daftar Isi
- [Tentang OpenBUMDes](#-tentang-openbumdes)
- [Perbandingan dengan Excel Konvensional](#-keunggulan-dibandingkan-excel-manual)
- [Fitur Utama](#-fitur-fitur-utama)
  - [1. Dashboard Eksekutif & Indeks Kesehatan](#1--dashboard-eksekutif--indeks-kesehatan-keuangan)
  - [2. Buku Kas Umum & Jurnal Otomatis (Full Grid Audit)](#2--buku-kas-umum-bku--pencatatan-jurnal-otomatis-full-grid-audit)
  - [3. 5 Laporan Keuangan Standar SAK EMKM & Kepmendes 136/2022](#3--5-laporan-keuangan-standar-sak-emkm--kepmendes-1362022)
  - [4. Tutup & Buka Buku & Cetak Dokumen Resmi LPJ Musdes (8 Halaman A4 Presisi)](#4--tutup--buka-buku--cetak-dokumen-resmi-lpj-musdes-8-halaman-a4-presisi)
  - [5. Modul Audit Pemeriksaan Inspektorat](#5--modul-audit-pemeriksaan-inspektorat)
  - [6. EIS (Executive Information System) Tingkat Kesehatan Keuangan](#6--eis-executive-information-system-tingkat-kesehatan-keuangan)
  - [7. Master Bagan Akun Standar (COA Dinamis & Paginasi)](#7--master-bagan-akun-standar-coa-dinamis--paginasi)
  - [8. Asisten Pintar Pencatatan Transaksi (Gemini AI & NLP)](#8--asisten-pintar-pencatatan-transaksi-google-gemini-ai--nlp)
  - [9. Administrasi, Pejabat & Pemeliharaan](#9--keamanan-pengaturan-instansi--pemeliharaan)
- [Tech Stack & Arsitektur](#-tech-stack--arsitektur)
- [Panduan Instalasi (Lokal PC & VPS)](#-panduan-instalasi)
  - [1. Instalasi di Komputer Lokal (PC / Laptop)](#1--instalasi-di-komputer-lokal-pc--laptop)
  - [2. Instalasi di VPS / Server Produksi](#2--instalasi-di-vps--server-produksi-ubuntudebian)
- [Akun Pengguna Bawaan](#-akun-pengguna-bawaan-default-credentials)
- [Panduan Setup Awal Instansi](#-langkah-awal-penggunaan-setup-instansi)
- [Struktur Direktori](#-struktur-direktori-proyek)
- [Kontribusi & Lisensi](#-lisensi)

---

## 📌 Tentang OpenBUMDes

**OpenBUMDes** adalah aplikasi akuntansi dan pelaporan keuangan berbasis web sumber terbuka (*open source*) yang dibangun khusus untuk memudahkan Badan Usaha Milik Desa (**BUMDes** maupun **BUMDesa Bersama**) di seluruh Indonesia dalam mengelola pembukuan kas harian dan menyusun laporan pertanggungjawaban tahunan.

Aplikasi ini dirancang dengan kepatuhan penuh terhadap dua regulasi akuntansi utama:
1. **Keputusan Menteri Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi (Kepmendesa PDTT) No. 136 Tahun 2022** tentang Panduan Penyusunan Laporan Keuangan BUM Desa (PPAK BUMDesa).
2. **Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)** yang diterbitkan oleh Ikatan Akuntan Indonesia (IAI).

Dengan OpenBUMDes, pengurus BUMDes, bendahara, dan pemerintah desa tidak lagi direpotkan oleh rumus spreadsheet yang rentan rusak, selisih debit-kredit, atau kesulitan menyiapkan dokumen audit pemeriksaan (*audit trail*) saat dikunjungi oleh **Inspektorat Daerah**, **BPKP**, maupun **Dinas PMD**.

---

## ⚖️ Keunggulan Dibandingkan Excel Manual

| Aspek | Excel / Spreadsheet Manual | OpenBUMDes (Kepmendes 136/2022) |
| :--- | :--- | :--- |
| **Pencatatan Transaksi** | Input manual debit & kredit terpisah di baris spreadsheet | **Otomatis Berpasangan (*Double-Entry*)**: 1 input kas langsung menjurnal akun lawan |
| **Keseimbangan Laporan** | Rumus sering terhapus/bergeser sehingga Neraca tidak seimbang | **Dijamin Seimbang 100%**: Neraca, Laba Rugi, dan Arus Kas dihitung dari basis data |
| **Audit & Bukti Fisik** | Kwitansi tersimpan terpisah di binder, sulit diverifikasi | **Digital Audit Trail**: Status tanda tangan & foto bukti fisik tercatat langsung di BKU |
| **Tutup Buku Akhir Tahun** | Saldo harus dipindahkan manual satu per satu ke file Excel baru | **Otomatis 1 Klik**: Menutup laba berjalan ke Laba Ditahan & membuka saldo awal tahun baru |
| **Multi-Pengguna** | Rawan bentrok file (*file lock / conflicted copy*) | **Multi-Role**: Pemisahan hak akses antara Administrator dan Kasir/Operator |
| **Ekspor Data** | Sulit diekspor secara terstruktur | **Ekspor Excel 1 Tahun Multi-Sheet**: Seluruh bulan Januari s.d. Desember dalam 1 file |

---

## 🌟 Fitur-Fitur Utama

### 1. 📊 Dashboard Eksekutif & Indeks Kesehatan Keuangan
* **Kalkulasi Indeks Otomatis:** Menilai 4 pilar kesehatan keuangan BUMDes secara real-time dari data pembukuan:
  * **Likuiditas Kas:** Ketersediaan dana kas & bank siap pakai untuk operasional harian.
  * **Margin Keuntungan:** Efisiensi laba bersih usaha terhadap total perputaran pendapatan.
  * **Solvabilitas Utang:** Rasio kemandirian modal terhadap beban kewajiban pihak ketiga.
  * **Akumulasi Ekuitas Desa:** Akumulasi penyertaan modal APBDes ditambah sisa hasil usaha (SHU) ditahan.
* **Diagnosa Direktur & Kepala Desa:** Memberikan catatan kesimpulan otomatis mengenai kondisi likuiditas dan solvabilitas terkini.
* **Ringkasan Posisi Keuangan:** Kartu metrik Total Kas & Bank, Pendapatan Usaha, Beban Operasional, dan SHU Tahun Berjalan.

---

### 2. 📖 Buku Kas Umum (BKU) & Pencatatan Jurnal Otomatis (Full Grid Audit)
* **Pencatatan Ganda Otomatis (*Double-Entry Ledger*):** Setiap pencatatan kas otomatis menjurnal akun lawan yang sesuai standar akuntansi.
* **Klasifikasi Bukti Kas:** Mendukung Bukti Kas Masuk (BKM), Bukti Kas Keluar (BKK), dan Bukti Memorial (BM/SA).
* **Tampilan Tabel Full Grid Audit:** Format tabel bergaris formal standar akuntansi audit dengan baris ringkasan total mutasi seimbang.
* **Penyaringan Fleksibel:** Filter transaksi berdasarkan Bulan, Tahun Buku, Jenis Bukti Kas, dan Status Bukti Fisik (Sudah TTD / Belum TTD).
* **Pencarian Cepat:** Pencarian cerdas berdasarkan nomor bukti, uraian transaksi, akun, atau pihak rekanan.
* **Cetak Kwitansi Resmi:** Format cetak Kwitansi/Bukti Kas standar dengan nomor otomatis, terbilang rupiah, dan tanda tangan 4 pihak.
* **Edit Rekanan Langsung (*Inline Editing*):** Memperbarui nama rekanan langsung pada tabel BKU tanpa membuka modal.
* **Ekspor Excel 1 Tahun Penuh (Multi-Sheet):** Sekali klik untuk mengunduh rekapitulasi BKU 1 tahun fiskal lengkap dalam format multi-sheet (Januari s.d. Desember + Rekapitulasi Tahunan).

---

### 3. 📑 5 Laporan Keuangan Standar SAK EMKM & Kepmendes 136/2022
Seluruh laporan dihasilkan secara otomatis dan *real-time*:
1. **Laporan Laba Rugi Komprehensif:** Tabel formal Full Grid menyajikan Pendapatan Usaha, Beban Pokok Penjualan/Produksi, Beban Operasional, Pendapatan/Beban Non-Usaha, hingga SHU Bersih Tahun Berjalan.
2. **Laporan Posisi Keuangan (Neraca SAK EMKM):** Tabel 2 kolom berdampingan menyajikan Aset Lancar vs Kewajiban & Ekuitas yang selalu seimbang 100% (*balanced*).
3. **Laporan Perubahan Ekuitas (LPE):** Rincian mutasi modal awal APBDes, cadangan modal, saldo laba ditahan, penyetoran PADes, dan ekuitas akhir periode.
4. **Laporan Arus Kas (LAK Metode Langsung):** Mengelompokkan arus kas masuk dan keluar ke dalam 3 aktivitas utama (**Operasi**, **Investasi**, **Pendanaan**), dengan saldo kas awal 1 Jan terhubung otomatis ke tutup buku/saldo buka buku awal tahun.
5. **Catatan atas Laporan Keuangan (CaLK):** Pengungkapan lengkap gambaran umum, kebijakan akuntansi, rincian aset lancar, aset tetap & akumulasi penyusutan, kewajiban, ekuitas, dan kinerja usaha.

---

### 4. 🔒 Tutup & Buka Buku & Cetak Dokumen Resmi LPJ Musdes (8 Halaman A4 Presisi)
* **Otomasi Akhir Tahun:** Menutup akun pendapatan dan beban ke akun Ekuitas Saldo Laba Ditahan (3.1.03.01) per 31 Desember.
* **Buka Saldo Awal Otomatis (Rollover 1 Januari):** Membawa saldo neraca akhir tahun menjadi saldo awal (*Opening Balance*) tahun berikutnya secara presisi dan otomatis terkoneksi ke Buku Kas, Buku Besar, dan Laporan Arus Kas.
* **Dokumen Resmi LPJ Musdes 8 Halaman A4 Siap Cetak & Ekspor PDF**:
  * **Halaman 1 (Cover A4 Presisi)**: Bingkai ganda formal (*double border*) berukuran pas A4 (`272mm`) dengan logo BUMDes, identitas instansi desa/kecamatan/kabupaten, dan banner pengesahan Musdes.
  * **Halaman 2**: Laporan Laba Rugi Komprehensif Standar Kepmendes 136/2022.
  * **Halaman 3**: Rencana & Realisasi Alokasi SHU Musdes (PADes, Cadangan Modal, Pengurus, Sosial, Pendidikan).
  * **Halaman 4**: Laporan Posisi Keuangan (Neraca SAK EMKM) tabel berdampingan dengan badge status 100% Seimbang.
  * **Halaman 5**: Laporan Perubahan Ekuitas (LPE).
  * **Halaman 6**: Laporan Arus Kas (LAK Metode Langsung) dengan saldo kas awal dan saldo kas akhir terverifikasi.
  * **Halaman 7**: Catatan atas Laporan Keuangan (CaLK) komprehensif.
  * **Halaman 8**: Lembar Pengesahan Resmi Keputusan Musdes lengkap dengan Kop Surat BUMDes resmi, Logo, dan 4 Pilar Tanda Tangan SPJ (Bendahara, Direktur Utama, Ketua Badan Pengawas, Kepala Desa selaku Penasihat).
* **Kop Surat Tahan-Banting**: Tata letak kop surat dan badge `Kepmendes PDTT 136/2022` terkunci dengan rapi pada hasil cetak PDF agar 100% identik dengan tampilan pratinjau.

---

### 5. 🔍 Modul Audit Pemeriksaan Inspektorat
* **Buku Besar Umum (General Ledger)**: Filter akun COA, rekonsiliasi otomatis saldo awal periode dari tabel `OpeningBalance`, rincian mutasi debit/kredit operasional, lawan akun, saldo berjalan, dan tombol Cetak Dokumen Pemeriksaan A4.
* **Neraca Saldo (Trial Balance)**: Kertas kerja verifikasi akuntansi dengan badge status *100% Seimbang (Total Debit = Total Kredit)* dan fitur Cetak Resmi.
* **Buku Pembantu Piutang & Utang (Subsidiary Ledger)**: Kartu kontrol transaksi per pelanggan/debitur dan kreditur/vendor desa dengan fitur Cetak Kartu Pengawasan.

---

### 6. 🩺 EIS (Executive Information System) Tingkat Kesehatan Keuangan
* **8 Indikator Keuangan Resmi:** Menilai rasio keuangan standar PPAK BUMDes Ver 4.5 & Kemendesa: ROE, ROI, Cash Ratio, Current Ratio, Collection Period, Perputaran Persediaan, Total Asset Turnover (TATO), dan Rasio Modal Sendiri terhadap Total Aset.
* **Transparansi Perhitungan:** Menampilkan formula akuntansi, angka dasar pembilang/penyebut, perolehan skor (Total 100 Poin), dan predikat tingkat kesehatan (**SEHAT**, **KURANG SEHAT**, atau **TIDAK SEHAT**).
* **Cetak Lembar Evaluasi Eksekutif A4:** Dilengkapi tanda tangan Direktur Utama dan Penasihat (Kepala Desa).

---

### 7. 🗂️ Master Bagan Akun Standar (COA Dinamis & Paginasi)
* **Master COA Kepmendes 136:** Dilengkapi lebih dari 220 akun standar resmi 5 level kodefikasi (Aset, Kewajiban, Ekuitas, Pendapatan, Beban).
* **Paginasi Interaktif:** Pengaturan tampilan 15, 25, 50, dan 100 baris per halaman untuk kenyamanan penelusuran.
* **Tambah Akun Kustom:** Kemudahan menambah sub-akun bank lokal (misal: *Bank Jatim*, *Bank Jombang*, *Bank Jateng*) atau unit usaha spesifik desa.
* **Proteksi Integritas Akun:** Akun yang telah memiliki riwayat transaksi diproteksi dan tidak dapat terhapus.

---

### 8. 🤖 Asisten Pintar Pencatatan Transaksi (Google Gemini AI & NLP)
* **Natural Language Transaction Parser:** Operator cukup mengetik catatan transaksi dalam bahasa santai sehari-hari (misal: *"Terima sewa lapak rest area 500rb tunai"* atau *"Beli bensin motor dinas 50rb"*), sistem secara otomatis mengonversinya menjadi pasangan jurnal debit-kredit standar Kepmendes 136/2022, klasifikasi BKM/BKK, dan pos Arus Kas.
* **Mode Offline Cerdas:** Fitur AI opsional; jika tanpa internet atau API Key, aplikasi tetap berjalan 100% penuh secara offline dengan mesin aturan NLP bawaan (0ms latency, hemat kuota).

---

### 9. 🛡️ Keamanan, Pengaturan Instansi & Pemeliharaan
* **Identitas Lembaga:** Konfigurasi Nama BUMDes, Nama Desa, Kecamatan, Kabupaten, Alamat Kantor, dan unggah Logo Resmi.
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
* **Ekspor Excel:** [SheetJS (xlsx 0.20.3)](https://docs.sheetjs.com/)
* **Mesin AI:** [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini 2.5 Flash)
* **Ikon:** [Lucide React](https://lucide.dev/)

---

## 🚀 Panduan Instalasi

OpenBUMDes menggunakan basis data bawaan **SQLite (WAL mode)**, sehingga **tidak memerlukan instalasi server database eksternal (MySQL/PostgreSQL)**.

### Prasyarat Dasar
* **Node.js** versi **18.18.0** atau **20.x ke atas** ([Unduh Node.js](https://nodejs.org/))
* **Git** ([Unduh Git](https://git-scm.com/))

---

### 💻 1. Instalasi di Komputer Lokal (PC / Laptop)

Jalankan perintah berikut di terminal (PowerShell, Command Prompt, atau Terminal Linux/macOS):

```bash
# 1. Kloning repositori & masuk ke folder
git clone https://github.com/balongbesuk/OpenBUMDes.git
cd OpenBUMDes

# 2. Pasang dependensi
npm install

# 3. Setup database & muat data awal (COA Standar Kepmendes 136 & akun default)
npm run db:setup

# 4. Jalankan aplikasi
npm run dev
```

Buka peramban (browser) dan akses: 👉 **http://localhost:3000**

> [!NOTE]
> Perintah `npm run db:setup` otomatis menjalankan migrasi skema database SQLite, seeder Bagan Akun Standar (COA), dan template transaksi kas.

---

### 🌐 2. Instalasi di VPS / Server Produksi (Ubuntu/Debian)

OpenBUMDes sangat ringan dan hemat sumber daya (dapat berjalan lancar di VPS RAM 1 GB):

```bash
# 1. Kloning repositori & masuk ke folder
git clone https://github.com/balongbesuk/OpenBUMDes.git /var/www/openbumdes
cd /var/www/openbumdes

# 2. Pasang dependensi & atur environment
npm install
cp .env.example .env.local
# (Opsional: edit .env.local untuk mengganti JWT_SECRET)

# 3. Inisialisasi basis data (hanya untuk instalasi pertama)
npm run db:setup

# 4. Build aplikasi untuk mode produksi
npm run build

# 5. Jalankan di background dengan PM2 (Auto-restart)
npm install -g pm2
pm2 start npm --name "openbumdes" -- run start
pm2 save
pm2 startup
```

Aplikasi siap diakses di port `3000` (atau sambungkan ke domain desa via reverse proxy Nginx).

> [!TIP]
> **Cara Update Versi di VPS (di kemudian hari):**  
> Anda **tidak perlu** menjalankan `db:setup` lagi agar data pembukuan yang ada tidak terganggu. Cukup jalankan:
> ```bash
> git pull && npm install && npm run build && pm2 restart openbumdes
> ```

---

## 🔑 Akun Pengguna Bawaan (Default Credentials)

Sistem menyediakan 2 akun login bawaan (juga tersedia tombol **Akses Cepat** pada jendela login):

| Peran (Role) | Username | Password | Otoritas & Tanggung Jawab |
|:---|:---:|:---:|:---|
| **Administrator** | `admin` | `admin123` | **Akses Penuh:** Pengaturan identitas instansi, pejabat penandatangan, manajemen akun user, kunci periode, integrasi Gemini AI, serta backup, restore, dan reset database. |
| **Operator** | `operator` | `operator123` | **Kasir & BKU:** Mencatat transaksi kas masuk/keluar, saldo awal kas/bank, cetak kwitansi BKM/BKK, dan meninjau laporan keuangan. |

---

## 📋 Langkah Awal Penggunaan (Setup Instansi)

1. Masuk (*login*) sebagai **Administrator** (`admin` / `admin123`).
2. Masuk ke tab **Pengaturan & AI** pada bilah menu samping:
   * **Identitas Lembaga:** Masukkan Nama BUMDes, Nama Desa, Kecamatan, Kabupaten, Alamat Kantor, dan unggah Logo Resmi.
   * **Pejabat Penandatangan:** Masukkan Nama dan NIP untuk **Direktur**, **Bendahara**, **Penasihat (Kepala Desa)**, dan **Pengawas (Ketua BPD)**.
   * **Integrasi AI (Opsional):** Masukkan API Key gratis dari [Google AI Studio](https://aistudio.google.com/) agar asisten pembaca kwitansi aktif.
3. Masuk ke tab **Tutup & Buka Buku**:
   * Masukkan **Saldo Awal Kas / Bank** pada awal tahun buku jika BUMDes telah memiliki saldo berjalan sebelumnya.
4. Masuk ke tab **Buku Kas & Jurnal**:
   * Mulai catat transaksi penerimaan (BKM) atau pengeluaran (BKK) secara tertib!

---

## 📁 Struktur Direktori Proyek

```text
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
```

---

## 🤝 Berkontribusi

Kami mengundang para pegiat desa, *software engineer*, akuntan, dan akademisi untuk bersama-sama menyempurnakan OpenBUMDes:

1. **Fork** repositori ini.
2. Buat cabang fitur baru: `git checkout -b fitur/nama-fitur-anda`.
3. Simpan perubahan Anda: `git commit -m 'feat: menambahkan fitur pelaporan baru'`.
4. Unggah ke cabang Anda: `git push origin fitur/nama-fitur-anda`.
5. Buat **Pull Request** melalui antarmuka GitHub.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **[GNU General Public License v3.0 (GPL-3.0)](LICENSE)**.  
Anda bebas menggunakan, memodifikasi, dan mendistribusikan aplikasi ini untuk kemandirian, transparansi, dan kemajuan ekonomi desa di seluruh Indonesia.
