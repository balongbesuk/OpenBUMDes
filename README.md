# 🏛️ OpenBUMDes

> **Sistem Informasi Manajemen, Operasional & Akuntansi Keuangan BUMDes Terstandar Keputusan Menteri Desa, PDTT No. 136 Tahun 2022 & SAK EMKM**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.21-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Assisted-8E75B2?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square)](LICENSE)

---

## 📌 Tentang OpenBUMDes

**OpenBUMDes** adalah sistem informasi manajemen dan akuntansi keuangan berbasis web modern, tangguh, dan *open-source* yang dikembangkan secara spesifik untuk menjawab kebutuhan **Badan Usaha Milik Desa (BUMDes / BUMDes Bersama)** di seluruh Indonesia.

Sistem ini memadukan **operasional multi-unit usaha desa** dengan sistem pembukuan berstandar ganda (*double-entry bookkeeping*) yang sepenuhnya patuh terhadap:
1. **Keputusan Menteri Desa, Pembangunan Daerah Tertinggal, dan Transmigrasi (Kepmendesa PDTT) No. 136 Tahun 2022** tentang Panduan Penyusunan Laporan Keuangan BUM Desa.
2. **Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)** yang diterbitkan oleh Ikatan Akuntan Indonesia (IAI).

Dengan OpenBUMDes, pengurus desa dan pengelola BUMDes tidak lagi dipusingkan oleh kerumitan rumus Excel, ketidakseimbangan debit-kredit, atau kesulitan menyiapkan dokumen pemeriksaan (Audit Trail) saat dikunjungi oleh **Inspektorat Daerah**, **BPKP**, maupun **DPMD**.

---

## ✨ Fitur-Fitur Utama Aplikasi

### 1. 📊 Dashboard Utama & EIS (Executive Information System)
* **Analisis Kesehatan Finansial Otomatis:**
  * **Rasio Likuiditas:** *Current Ratio* dan *Cash Ratio* untuk mengukur kemampuan memenuhi kewajiban jangka pendek.
  * **Rasio Solvabilitas:** *Debt to Asset Ratio* (DAR) dan *Debt to Equity Ratio* (DER) untuk mengevaluasi struktur modal dan utang.
  * **Rasio Rentabilitas:** *Return on Assets* (ROA), *Return on Equity* (ROE), dan *Net Profit Margin* (NPM) untuk mengukur efektivitas menghasilkan laba.
* **Visualisasi Finansial Interaktif:** Grafik tren arus kas penerimaan vs. pengeluaran bulanan, diagram komposisi pendapatan per unit usaha, serta rekapitulasi saldo riil kas dan rekening bank.
* **Informasi Diagnostik Server:** Monitoring uptime, beban memori, status integritas basis data SQLite mode WAL, dan log audit pengguna.

---

### 2. 💰 Modul Akuntansi Keuangan Lengkap (10 Tab Standar Kepmendes 136)

Modul Keuangan (`/keuangan`) dirancang komprehensif dengan 10 tab fungsional:

| No | Tab Keuangan | Fungsi & Penjabaran |
|:--:|---|---|
| 1 | **Buku Kas Umum (BKU) & Jurnal** | Pencatatan mutasi kas/bank harian berpasangan (*double-entry*), filter bulan berjalan dinamis, edit nama pihak terkait langsung (*in-line editing*), cetak Kwitansi, Bukti Kas Masuk (BKM), Bukti Kas Keluar (BKK), serta tombol **Ekspor Excel 1 Tahun (Multi-Sheet)**. |
| 2 | **Bagan Akun (COA Kepmendes)** | Daftar Chart of Accounts resmi 4-level kode akun (1-Aset, 2-Kewajiban, 3-Ekuitas, 4-Pendapatan, 5-Beban) dengan fitur tambah akun kustom dan filter tipe akun. |
| 3 | **Laporan Laba Rugi** | Menyajikan Pendapatan Operasional, Beban Pokok Usaha, Beban Administrasi & Umum, Pendapatan/Beban Non-Operasional, hingga Laba/Rugi Bersih periode berjalan. |
| 4 | **Laporan Posisi Keuangan (Neraca)** | Menyajikan saldo Aset Lancar, Aset Tidak Lancar, Kewajiban Jangka Pendek/Panjang, serta Ekuitas (Penyertaan Modal Desa & Saldo Laba) yang selalu seimbang (*balance*). |
| 5 | **Arus Kas & Perubahan Ekuitas** | Laporan Arus Kas (LAK) metode langsung yang memisahkan Aktivitas Operasi, Investasi, dan Pendanaan, serta tabel ringkasan pergerakan modal awal ke modal akhir. |
| 6 | **Rekapitulasi Pajak** | Perekaman dan rekapitulasi kewajiban perpajakan BUMDes (PPN, PPh 21, PPh 23, PPh Final) beserta status setor kas negara. |
| 7 | **Aset Tetap & Depresiasi** | Daftar inventaris aset tetap BUMDes, nilai perolehan, masa manfaat, kalkulasi tarif depresiasi garis lurus, dan riwayat akumulasi penyusutan tahunan. |
| 8 | **Perhitungan SHU** | Kalkulasi pembagian Sisa Hasil Usaha otomatis berdasarkan persentase AD/ART: PADes (Kas Desa), Dana Cadangan Umum, Pengurus, Pengawas, serta Dana Pendidikan/Sosial. |
| 9 | **Tutup Buku Akhir Tahun** | Modul otomatis untuk menutup akun nominal pendapatan & beban ke Laba Ditahan, menghitung depresiasi aset akhir tahun, serta fitur **Buka Kembali Buku (*Reopen Period*)** jika diperlukan perbaikan data oleh administrator. |
| 10 | **Laporan Pertanggungjawaban (LPJ)** | Kompilasi seluruh laporan keuangan beserta **Catatan atas Laporan Keuangan (CaLK)** terpadu berformat resmi Kepmendes 136/2022, siap cetak ke PDF dengan tanda tangan pejabat lengkap. |

---

### 3. 🤖 Asisten Pencatatan Transaksi Cerdas (Google Gemini AI & Offline NLP)
* **AI NLP Natural Language Input:** Cukup ketik narasi transaksi sehari-hari, misalnya:  
  > *"Beli 2 rim kertas HVS dan tinta printer senilai Rp 140.000,- dibayar dari Kas Tunai"*
* **Pemetaan Otomatis:** Sistem secara cerdas mendeteksi:
  * Akun Kas/Bank asal (misal: Kas Tunai BUMDes).
  * Akun Lawan / Beban Kepmendes 136 (misal: `5-1102` Beban Alat Tulis Kantor & Cetak).
  * Klasifikasi Kelompok Arus Kas (Operasional Usaha).
  * Pihak Terkait / Rekanan Penjual.
* **Offline Fallback:** Tetap berjalan optimal memetakan akun akuntansi secara *rule-based* meskipun koneksi internet terputus atau saat API Key Gemini belum diatur.

---

### 4. 🏢 Modul Multi-Unit Usaha Terintegrasi
* **Unit Sewa Gedung Serbaguna (GSG):**
  * Kalender ketersediaan jadwal sewa lapangan olahraga, gedung resepsi pernikahan, dan rapat.
  * Pencatatan uang muka (DP), status pelunasan sewa, dan penerbitan nota/kwitansi pemesan.
* **Unit Sewa Lahan, Kios & Lapak PKL:**
  * Manajemen kontrak sewa lapak (tenda/kios/warung permanen) dengan skema bulanan atau tahunan.
  * Pemantauan masa aktif kontrak, jatuh tempo tagihan, dan rekapitulasi iuran retribusi pedagang.
* **Unit Simpan Pinjam Desa:**
  * Manajemen data keanggotaan warga, buku tabungan simpanan Pokok, Wajib, dan Sukarela.
  * Pengajuan pinjaman modal usaha kelompok tani/masyarakat dan riwayat angsuran pokok + jasa.
* **Unit PPOB / Agen Pos Desa:**
  * Rekapitulasi transaksi loket pembayaran tagihan listrik PLN, PDAM, pulsa, dan BPJS.
  * Pencatatan komisi bersih otomatis sebagai Pendapatan Jasa BUMDes.

---

### 5. ✉️ Administrasi Persuratan & Notulensi Rapat
* **Buku Agenda Surat:** Pencatatan Surat Masuk, Surat Keluar, dan Surat Keputusan (SK) Direktur BUMDes lengkap dengan nomor agenda dan tanggal arsip.
* **Notulensi Musyawarah:** Notulen digital untuk Rapat Anggota Tahunan (RAT), Musyawarah Desa (Musdes), dan rapat internal pengurus BUMDes.

---

### 6. 🌐 Portal Publik & Promosi Produk UMKM Desa
* **Beranda Publik Dinamis (`/`):** Tampilan pendar modern (*mesh gradient & glassmorphism*) untuk mempromosikan profil, transparansi, dan layanan unit usaha BUMDes kepada masyarakat umum.
* **Pojok UMKM Binaan (`/umkm`):** Katalog showcase produk-produk unggulan karya pengrajin dan pelaku UMKM desa binaan BUMDes.
* **Kanal Warta & Berita (`/berita`):** Media publikasi kegiatan, transparansi pembagian SHU, dan pengumuman resmi bagi warga desa.

---

### 7. 🔒 Keamanan, Pengaturan Lembaga & Audit Trail
* **Pengaturan Lembaga Terpusat:** Input Nama BUMDes, Nama Desa, Kecamatan, Kabupaten, Alamat Kantor, dan unggah Logo Resmi.
* **Pejabat Penandatangan Resmi:** Konfigurasi Nama dan NIP untuk **Direktur**, **Bendahara**, **Penasihat (Kepala Desa)**, dan **Pengawas (Ketua BPD)** agar dokumen cetak memiliki legalitas yang sah.
* **Kunci Periode Akuntansi (*Period Locking*):** Mengunci transaksi pada rentang tanggal tertentu agar data pembukuan masa lalu tidak dapat disunting atau disalahgunakan.
* **Jejak Audit (*Audit Trail Log*):** Seluruh aksi masuk sistem (*login*), tambah data, ubah, dan hapus dicatat lengkap beserta *timestamp* dan identitas pengguna.
* **Pencadangan & Pemulihan Sistem:** Fitur ekspor basis data ke cadangan file JSON dan impor pemulihan kapan saja.

---

## 🛠️ Tech Stack & Arsitektur

* **Framework Utama:** [Next.js 15 (App Router)](https://nextjs.org/)
* **UI Library:** [React 19](https://react.dev/)
* **Bahasa Pemrograman:** [TypeScript 5.6](https://www.typescriptlang.org/)
* **Styling & Desain:** [Tailwind CSS 3.4](https://tailwindcss.com/) dengan palet HSL modern, glassmorphism, dan transisi mikro responsif
* **Basis Data:** [SQLite 3](https://www.sqlite.org/) terintegrasi mode *Write-Ahead Logging* (WAL) untuk performa baca-tulis tinggi tanpa instalasi server basis data eksternal yang rumit
* **ORM:** [Prisma ORM 5.21](https://www.prisma.io/)
* **Excel Engine:** [SheetJS (xlsx)](https://docs.sheetjs.com/) untuk ekspor multi-sheet instan
* **Mesin AI:** [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini 2.5 Flash)
* **Ikon & Grafik:** Lucide React & Recharts

---

## 📦 Panduan Instalasi & Menjalankan

Ikuti panduan langkah demi langkah berikut untuk memasang OpenBUMDes di komputer lokal atau server Anda.

### Prasyarat Perangkat Lunak
Pastikan perangkat Anda telah terpasang:
* **Node.js** versi **18.18.0** atau **20.x** ke atas ([Unduh Node.js](https://nodejs.org/))
* **Git** ([Unduh Git](https://git-scm.com/))
* Manajer Paket: `npm` (bawaan Node.js)

---

### Langkah 1: Kloning Repositori
Buka terminal (Command Prompt / PowerShell / Git Bash / Terminal Linux), lalu kloning repositori ini:
```bash
git clone https://github.com/balongbesuk/OpenBUMDes.git
cd OpenBUMDes
```

---

### Langkah 2: Pasang Dependensi Node.js
Pasang seluruh paket pustaka yang dibutuhkan aplikasi:
```bash
npm install
```

---

### Langkah 3: Konfigurasi File Lingkungan (`.env.local`)
Salin file template `.env.example` menjadi `.env.local`:

* **Di Linux / macOS:**
  ```bash
  cp .env.example .env.local
  ```
* **Di Windows (PowerShell):**
  ```powershell
  copy .env.example .env.local
  ```

Buka file `.env.local` dengan text editor (VS Code, Notepad, dll.), lalu isi kunci rahasia token JWT Anda:
```env
# Kunci acak untuk enkripsi sesi pengguna (wajib diisi dengan teks acak yang panjang)
JWT_SECRET=kunci_rahasia_keamanan_sesi_openbumdes_123456789
```

---

### Langkah 4: Inisialisasi Database SQLite & Bagan Akun
Jalankan sinkronisasi skema basis data SQLite lokal:
```bash
npx prisma db push
```

Selanjutnya, jalankan proses *seeding* untuk membuat Bagan Akun Standar (COA) Kepmendes 136/2022 serta akun-akun pengguna default:
```bash
npx prisma db seed
```

*(Opsional) Muat template transaksi harian cepat:*
```bash
npm run db:seed-templates
```

*(Opsional untuk Uji Coba / Demo) Jika Anda ingin mencoba aplikasi dengan simulasi data lengkap (data anggota, pinjaman, sewa gedung, sewa kios, dan transaksi buku kas):*
```bash
npm run db:seed-demo
```

---

### Langkah 5: Jalankan Server Pengembangan
Jalankan server aplikasi:
```bash
npm run dev
```

Buka peramban (browser) Anda dan kunjungi tautan:
👉 **`http://localhost:3000`**

---

## 🔑 Akun Pengguna Bawaan (Default Credentials)

Setelah menjalankan `npx prisma db seed`, Anda dapat login menggunakan akun berikut:

| No | Peran (Role) | Username | Password | Otoritas / Hak Akses |
|:--:|---|---|---|---|
| 1 | **Administrator** | `admin` | `admin123` | Akses penuh seluruh modul, manajemen pengguna, konfigurasi instansi, pejabat penandatangan, audit log, dan backup/restore database. |
| 2 | **Bendahara** | `bendahara` | `bendahara123` | Akses penuh modul Keuangan: Buku Kas Umum (BKU), Jurnal, Rekap Pajak, Aset Tetap, Neraca, Laba Rugi, LAK, SHU, dan Tutup Buku. |
| 3 | **Sekretaris** | `sekretaris` | `sekretaris123` | Akses modul Persuratan (Surat Masuk, Surat Keluar, SK) dan Notulensi Rapat. |
| 4 | **Operator Simpan Pinjam** | `operator_sp` | `sp123` | Manajemen anggota simpan pinjam, tabungan pokok/wajib/sukarela, pencairan pinjaman, dan angsuran. |
| 5 | **Operator Sewa** | `operator_sewa` | `sewa123` | Manajemen jadwal sewa gedung serbaguna, kontrak sewa lahan & lapak pedagang. |

> 🔒 **Tips Keamanan:** Setelah login untuk pertama kali, sangat disarankan segera mengganti kata sandi bawaan melalui menu **Profil Saya** di bilah navigasi kanan atas.

---

## 🧭 Langkah Awal Penggunaan (Setup Instansi)

1. Masuk (*login*) sebagai **Administrator** (`admin`).
2. Masuk ke menu **Pengaturan** di bilah samping (*sidebar*):
   * **Identitas Lembaga:** Masukkan Nama BUMDes, Nama Desa, Kecamatan, Kabupaten, Alamat Lengkap, dan unggah Logo BUMDes resmi Anda.
   * **Data Pejabat Penandatangan:** Masukkan Nama Lengkap dan NIP (jika ada) untuk **Direktur**, **Bendahara**, **Kepala Desa (Penasihat)**, dan **Ketua BPD (Pengawas)**.
   * **Integrasi AI (Opsional):** Masukkan API Key gratis dari [Google AI Studio](https://aistudio.google.com/) pada kolom Gemini API Key agar fitur asisten jurnal AI aktif.
3. Masuk ke menu **Keuangan** > **Buku Kas Umum (BKU)**:
   * Masukkan **Saldo Awal Kas / Bank** pada awal periode tahun buku.
   * Mulai catat transaksi penerimaan atau pengeluaran secara teratur!

---

## 🚀 Panduan Build & Deploy ke Server Produksi

Aplikasi OpenBUMDes sangat ringan dan dapat di-deploy pada VPS (Ubuntu/Debian) berbiaya rendah dengan spesifikasi RAM 1 GB sekalipun.

```bash
# 1. Pastikan dependensi terpasang
npm install

# 2. Build aplikasi untuk produksi
npm run build

# 3. Jalankan aplikasi dalam mode produksi
npm run start
```

### Rekomendasi Menjalankan dengan PM2 (Background Daemon):
```bash
# Pasang PM2 secara global
npm install -g pm2

# Jalankan server OpenBUMDes di background
pm2 start npm --name "openbumdes" -- run start

# Simpan konfigurasi autostart saat server reboot
pm2 save
pm2 startup
```

---

## 📂 Struktur Direktori Proyek

```text
OpenBUMDes/
├── prisma/
│   ├── coa_kemendes_136.json   # Definisi standar bagan akun Kepmendes 136/2022
│   ├── schema.prisma           # Skema tabel database relasional
│   ├── seed.ts                 # Skrip seeder akun default & bagan akun
│   └── seed_templates.ts       # Template transaksi harian BUMDes
├── public/
│   ├── favicon.ico             # Ikon aplikasi web
│   └── uploads/                # Direktori penyimpanan bukti transaksi & logo
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # Halaman dashboard terproteksi (Keuangan, Sewa, SP, dsb.)
│   │   ├── (public)/           # Halaman publik (Beranda, UMKM, Berita Desa, Profil Layanan)
│   │   ├── api/                # REST API backend Route Handlers
│   │   ├── login/              # Halaman login otentikasi
│   │   └── globals.css         # Styling global Tailwind CSS
│   ├── components/             # Komponen UI modal (Kwitansi, ManualTransaction, PartyEditor, dsb.)
│   ├── context/                # Context provider konfigurasi lembaga
│   └── lib/                    # Logika bisnis akuntansi (Double-Entry Ledger, Gemini AI, Auth)
├── package.json                # Daftar dependensi dan script npm
└── README.md                   # Dokumentasi resmi proyek
```

---

## 🤝 Berkontribusi

Kami mengundang seluruh pegiat desa, *software engineer*, akuntan, dan akademisi untuk bersama-sama menyempurnakan OpenBUMDes:

1. Lakukan **Fork** pada repositori ini.
2. Buat cabang fitur baru: `git checkout -b fitur/nama-fitur-anda`.
3. Simpan perubahan Anda: `git commit -m 'feat: menambahkan fitur pelaporan baru'`.
4. Unggah ke cabang Anda: `git push origin fitur/nama-fitur-anda`.
5. Buat **Pull Request** melalui antarmuka GitHub.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **[GNU General Public License v3.0 (GPL-3.0)](LICENSE)**.  
Anda bebas menggunakan, memodifikasi, dan mendistribusikan aplikasi ini untuk kemandirian, transparansi, dan kemajuan ekonomi desa di seluruh Indonesia. 🇮🇩
