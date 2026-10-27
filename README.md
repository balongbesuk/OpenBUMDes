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

## 📌 Tentang OpenBUMDes

**OpenBUMDes** adalah aplikasi akuntansi dan pelaporan keuangan berbasis web sumber terbuka (*open source*) yang dibangun khusus untuk memudahkan Badan Usaha Milik Desa (**BUMDes** maupun **BUMDesa Bersama**) di seluruh Indonesia dalam mengelola pembukuan kas harian dan menyusun laporan pertanggungjawaban tahunan.

Aplikasi ini patuh penuh terhadap dua regulasi akuntansi utama:
1. **Keputusan Menteri Desa, PDTT No. 136 Tahun 2022** tentang Panduan Penyusunan Laporan Keuangan BUM Desa (PPAK BUMDesa).
2. **Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)** dari Ikatan Akuntan Indonesia (IAI).

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

### 1. 📊 Dashboard Eksekutif & EIS Kesehatan Keuangan
* **Kalkulasi Indeks Otomatis:** Menilai 4 pilar kesehatan keuangan (Likuiditas, Margin Laba, Solvabilitas Utang, dan Akumulasi Ekuitas) secara *real-time*.
* **Evaluasi 8 Rasio PPAK 4.5 Kemendesa:** Menilai ROE, ROI, Cash Ratio, Current Ratio, Collection Period, Perputaran Persediaan, TATO, dan Rasio Modal Sendiri dengan predikat **SEHAT**, **KURANG SEHAT**, atau **TIDAK SEHAT**.

### 2. 📖 Buku Kas Umum (BKU) & Pencatatan Jurnal Otomatis
* **Double-Entry Otomatis:** Mengklasifikasikan bukti kas masuk (BKM), kas keluar (BKK), dan bukti memorial (BM/SA) lengkap dengan cetak kuitansi resmi bertanda tangan.
* **Tabel Full Grid Audit:** Format tabel bergaris formal standar akuntansi audit dengan baris ringkasan mutasi seimbang.
* **Ekspor Excel 1 Tahun Penuh (Multi-Sheet):** Sekali klik untuk mengunduh rekapitulasi BKU 1 tahun fiskal lengkap (Januari s.d. Desember + Rekap Tahunan).
* **Responsif Mobile & Fast Inline Edit:** Nyaman digunakan di smartphone dengan gesture geser tabel horizontal dan edit nama rekanan langsung.

### 3. 📑 5 Laporan Keuangan Standar & Dokumen Resmi LPJ Musdes
* **5 Laporan Keuangan EMKM:** Laporan Laba Rugi Komprehensif, Neraca SAK EMKM (100% Seimbang), Perubahan Ekuitas (LPE), Arus Kas Langsung (LAK 3 aktivitas), dan Catatan atas Laporan Keuangan (CaLK).
* **Cetak LPJ Musdes 8 Halaman A4 Presisi:** Dokumen pertanggungjawaban lengkap siap cetak & ekspor PDF:
  * Halaman 1 (Cover formal berbingkai presisi A4 dengan logo desa).
  * Halaman 2–7 (5 Laporan Keuangan resmi & Rencana Alokasi SHU Musdes).
  * Halaman 8 (Lembar Pengesahan Resmi bertanda tangan 4 Pilar: Bendahara, Direktur Utama, Ketua Badan Pengawas/BPD, dan Kepala Desa).

### 4. 🔍 Modul Audit Pemeriksaan & Buku Pembantu
* **Buku Besar Umum (General Ledger) & Neraca Saldo (Trial Balance):** Rincian mutasi akun, saldo berjalan, rekonsiliasi saldo awal, dan cetak lembar kerja audit.
* **Buku Pembantu Piutang & Utang (Subsidiary Ledger):** Pengawasan transaksi dan sisa tagihan per pelanggan/debitur dan kreditur/vendor desa.
* **Buku Pembantu Persediaan & Kartu Stok:** Master SKU barang dagang, mutasi stok (Masuk/Keluar/Opname), kalkulasi biaya rata-rata bergerak (*Moving Average*), dan cetak Berita Acara Rekapitulasi Stok.
* **Daftar Register & Jadwal Penyusutan Aset Tetap:** Pencatatan barang modal BUMDes, amortisasi otomatis metode garis lurus (*Straight-Line*), beban depresiasi berjalan, dan nilai buku bersih.
* **Indikator Kontrol Rekonsiliasi Neraca Otomatis:** Banner audit visual *real-time* yang membandingkan fisik buku pembantu dengan saldo pembukuan di Neraca (Akun `1.1.04` Persediaan, Akun `1.2.01` Aset Tetap, dan Akun `1.2.02` Akumulasi Penyusutan).

### 5. 🔒 Tutup & Buka Buku Otomatis (Rollover 1 Januari)
* **Otomasi Akhir Tahun:** Menutup laba/rugi berjalan ke Saldo Laba Ditahan per 31 Desember dengan 1 klik.
* **Rollover Saldo Awal Otomatis:** Mentransfer saldo neraca penutupan menjadi saldo awal (*Opening Balance*) tahun baru yang otomatis terkoneksi ke BKU, Buku Besar, dan Laporan Arus Kas.

### 6. 🤖 Asisten Pintar Pencatatan Transaksi (Gemini AI & NLP)
* **Natural Language Parser:** Ketik transaksi dengan bahasa santai sehari-hari (contoh: *"Beli bensin motor dinas 50rb"*), sistem otomatis menentukan akun debit-kredit, jenis BKM/BKK, dan pos Arus Kas.
* **Mode Cerdas Offline:** Tetap dapat mencatat otomatis tanpa koneksi internet atau API key menggunakan mesin aturan NLP bawaan (0ms latency, hemat kuota).

### 7. 🛡️ Bagan Akun (COA Dinamis), Multi-User & Pemeliharaan
* **Bagan Akun Resmi Kepmendes 136:** 220+ akun standar 5 level kodefikasi dengan paginasi dinamis dan fitur tambah akun bank/unit usaha kustom.
* **Pemisahan Peran (Multi-Role):** Hak akses Administrator (pengaturan, pejabat, audit, backup/restore) dan Operator (kasir & BKU).
* **Pencadangan Mandiri:** Backup basis data lokal SQLite WAL, restore instan, dan reset sistem berkeamanan tinggi.

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
> Anda **tidak perlu** menjalankan `db:setup` lagi agar data pembukuan yang ada tidak terganggu.
> 
> * **Opsi Standar (Jika VPS RAM $\ge$ 2 GB):**
>   ```bash
>   git pull && npm install && npx prisma db push && npm run build && pm2 restart openbumdes
>   ```
> * **Opsi Cepat & Aman (Untuk VPS Hemat RAM 512 MB – 1 GB):**  
>   Kompilasi di PC lokal agar VPS tidak kehabisan memori (*out of memory / killed*):
>   1. Di PC: `npm run build` lalu kompres: `tar -czf next-build.tar.gz .next`
>   2. Kirim ke VPS: `scp next-build.tar.gz user@IP_VPS:/var/www/openbumdes/`
>   3. Di VPS: `git pull && npm install && npx prisma db push && tar -xzf next-build.tar.gz && rm next-build.tar.gz && pm2 restart openbumdes`

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
├── tests/
│   └── self-check.mjs          # Pengujian otomatis rumus akuntansi & keamanan token
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
