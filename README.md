# 🏛️ OpenBUMDes

> **Sistem Informasi Manajemen & Akuntansi Keuangan BUMDes Terstandar Keputusan Menteri Desa, PDTT No. 136 Tahun 2022 & SAK EMKM**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.21-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Assisted-8E75B2?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square)](LICENSE)

**OpenBUMDes** adalah platform aplikasi web akuntansi dan manajemen operasional open-source yang dirancang khusus untuk Badan Usaha Milik Desa (BUMDes / BUMDes Bersama) di seluruh Indonesia. Dikembangkan mengacu penuh pada format pelaporan keuangan dan bagan akun standar **Kepmendesa PDTT No. 136 Tahun 2022** serta **Standar Akuntansi Keuangan Entitas Mikro, Kecil, dan Menengah (SAK EMKM)**.

---

## 🌟 Fitur Unggulan

### 1. 📊 Dashboard Kesehatan Usaha & EIS (Executive Information System)
* **Indikator Rasio Keuangan Otomatis:**
  * Rasio Likuiditas (*Current Ratio*, *Cash Ratio*).
  * Rasio Solvabilitas (*Debt to Asset Ratio*, *Debt to Equity Ratio*).
  * Rasio Rentabilitas (*Return on Assets / ROA*, *Return on Equity / ROE*, *Net Profit Margin*).
* **Visualisasi Finansial Interaktif:** Grafik tren arus kas masuk/keluar bulanan, komposisi pendapatan unit usaha, serta saldo riil kas dan bank.
* **Informasi Sistem & Audit:** Pemantauan status server, basis data, dan integritas pencatatan.

### 2. 📑 Standar Laporan Keuangan Kepmendes 136/2022 (SAK EMKM)
* **Laporan Posisi Keuangan (Neraca):** Mengelompokkan Aset Lancar, Aset Tidak Lancar, Kewajiban Jangka Pendek, serta Ekuitas (Penyertaan Modal Desa & Masyarakat).
* **Laporan Laba Rugi:** Rekapitulasi Pendapatan Operasional, Beban Pokok Usaha, Beban Operasional/Administrasi, dan Pendapatan/Beban Lain-Lain.
* **Laporan Perubahan Ekuitas / Modal:** Pemantauan modal awal, akumulasi laba ditahan, dan pembagian SHU berjalan.
* **Laporan Arus Kas (LAK - Metode Langsung):** 
  * Arus Kas dari Aktivitas Operasi Usaha.
  * Arus Kas dari Aktivitas Investasi.
  * Arus Kas dari Aktivitas Pendanaan (Penyertaan Modal & Penarikan).
* **Catatan atas Laporan Keuangan (CaLK):** Template naratif resmi yang terisi otomatis berdasarkan data mutasi pembukuan tahun berjalan.
* **Perhitungan Sisa Hasil Usaha (SHU):** Kalkulasi pembagian SHU proporsional sesuai AD/ART (PADes, Dana Cadangan, Pengurus, Pengawas, Dana Sosial/Pendidikan).

### 3. 📖 Buku Kas Umum (BKU) & Jurnal Akuntansi Cerdas
* **Pencatatan Berpasangan Otomatis (*Double-Entry*):** Setiap transaksi keuangan otomatis memposting debit-kredit seimbang ke bagan akun (*Chart of Accounts*).
* **Filter Bulan Fleksibel:** Filter tampilan mutasi per bulan dengan penyesuaian otomatis ke bulan berjalan.
* **Ekspor Excel 1 Tahun Penuh (Multi-Sheet):**
  * *Sheet 1:* Jurnal Umum lengkap dengan tanggal, nomor bukti, keterangan, akun, ref, debit, dan kredit.
  * *Sheet 2:* Rekapitulasi Kas & Saldo Bulanan (Saldo Awal, Penerimaan, Pengeluaran, Saldo Akhir).
* **Edit Cepat Nama Pihak Terkait (*Party Editor*):** Ubah nama rekanan, penyetor, atau penerima dana langsung di baris tabel (*in-line editing*) tanpa perlu input ulang.
* **Cetak Bukti Transaksi Resmi:** Pop-up siap cetak untuk Kwitansi Pembayaran, Bukti Kas Masuk (BKM), dan Bukti Kas Keluar (BKK) lengkap dengan tanda tangan pejabat BUMDes.

### 4. 🤖 Asisten Pencatatan Transaksi (AI-Powered & Offline NLP)
* **Google Gemini AI Assistant:** Cukup ketik kalimat sehari-hari (contoh: *"Beli 2 kaleng cat dan kuas untuk perbaikan gedung serbaguna 175rb tunai"*), AI akan otomatis mendeteksi akun kas, akun beban/lawan COA Kepmendes 136, pihak terkait, dan kelompok arus kas.
* **Offline Rule-Based NLP:** Sistem tetap dapat mengidentifikasi kata kunci transaksi secara akurat tanpa internet atau saat API key belum dipasang.

### 5. 🔒 Penutupan Buku, Penyusutan Aset & Keamanan Data
* **Tutup Buku Akhir Tahun Otomatis:** Menutup saldo akun nominal (pendapatan dan beban) ke akun Laba Ditahan/Ikhtisar Laba Rugi pada akhir periode pembukuan.
* **Penyusutan Aset Tetap Terintegrasi:** Depresiasi berkala metode garis lurus yang terhitung otomatis saat penutupan buku.
* **Kunci Periode Akuntansi (*Period Locking*):** Mengunci buku kas tanggal lampau agar tidak dapat disunting atau dihapus tanpa izin otoritas.
* **Jejak Audit (*Audit Trail*):** Mencatat setiap aktivitas penambahan, penyuntingan, dan penghapusan data untuk keperluan audit inspektorat.

### 6. 🏢 Modul Unit Usaha Terpadu
* **Sewa Gedung Serbaguna (GSG):** Kalender reservasi fasilitas, uang muka (DP), pelunasan sewa, dan cetak bukti transaksi.
* **Sewa Lahan & Lapak PKL:** Manajemen kontrak penyewa lahan, penagihan retribusi bulanan/tahunan, dan monitoring tunggakan.
* **Simpan Pinjam & PPOB:** Perekaman simpanan pokok/wajib, pemantauan saldo pinjaman, dan integrasi komisi loket pembayaran digital desa.

---

## 🛠️ Arsitektur & Teknologi

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Frontend Framework** | [Next.js 15 (App Router)](https://nextjs.org/) | Arsitektur modern React Server Components & Client Modals |
| **UI Library** | [React 19](https://react.dev/) | Rendering performa tinggi tanpa re-render berlebih |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS | Desain bersih, elegan, profesional, dan responsif ponsel/tablet/PC |
| **Database & ORM** | [Prisma ORM](https://www.prisma.io/) & SQLite | File-based database lokal tanpa instalasi server SQL rumit terpisah |
| **Spreadsheet Engine** | [SheetJS (xlsx)](https://docs.sheetjs.com/) | Generator ekspor workbook Microsoft Excel standar multi-sheet |
| **Artificial Intelligence** | [@google/genai](https://www.npmjs.com/package/@google/genai) | Google Gemini 2.5 Flash untuk pemrosesan bahasa alami |
| **Icons & Graphs** | Lucide React & Recharts | Visualisasi data analitis dan ikon antarmuka intuitif |

---

## 📦 Panduan Instalasi & Menjalankan

### Prasyarat
Sebelum memulai, pastikan perangkat komputer atau server Anda telah terpasang:
* **Node.js** versi `18.18.0` atau `20.x` ke atas ([Unduh Node.js](https://nodejs.org/))
* **Git** ([Unduh Git](https://git-scm.com/))
* Web browser modern (Google Chrome, Microsoft Edge, Mozilla Firefox)

---

### Langkah 1: Kloning Repositori
Buka terminal / PowerShell / Git Bash, lalu jalankan:
```bash
git clone https://github.com/balongbesuk/OpenBUMDes.git
cd OpenBUMDes
```

---

### Langkah 2: Pasang Dependensi
Jalankan perintah instalasi paket:
```bash
npm install
```

---

### Langkah 3: Konfigurasi Lingkungan (`.env.local`)
Salin berkas template lingkungan:
```bash
cp .env.example .env.local
```
*(Di Windows PowerShell, gunakan `copy .env.example .env.local`)*

Buka berkas `.env.local` lalu isi konfigurasi rahasia:
```env
# Kunci acak untuk keamanan sesi autentikasi pengguna
JWT_SECRET=rahasia_keamanan_token_sesi_bumdes_anda_yang_sangat_panjang_12345
```

---

### Langkah 4: Inisialisasi Database & Bagan Akun
Jalankan sinkronisasi skema database SQLite lokal:
```bash
npx prisma db push
```

Lalu jalankan *database seeder* untuk mengisi bagan akun standar Kepmendes 136/2022 serta akun pengguna default:
```bash
npx prisma db seed
```

*(Opsional) Jika Anda ingin memuat template transaksi cepat untuk mempercepat input BKU:*
```bash
npm run db:seed-templates
```

---

### Langkah 5: Jalankan Aplikasi
Jalankan server pengembangan:
```bash
npm run dev
```

Aplikasi siap diakses di peramban Anda melalui alamat:
👉 **`http://localhost:3000`**

---

## 🔑 Akun Pengguna Bawaan (Default Login)

Setelah proses seeding selesai, Anda dapat masuk menggunakan salah satu kredensial berikut:

| Peran (Role) | Username | Password | Hak Akses Utama |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Akses penuh, konfigurasi profil, pengaturan pejabat, user management, audit log |
| **Bendahara** | `bendahara` | `bendahara123` | Buku Kas Umum, Jurnal, Laporan Keuangan (Neraca, Laba Rugi, LAK, CaLK), Tutup Buku |
| **Sekretaris** | `sekretaris` | `sekretaris123` | Administrasi persuratan, notulensi rapat, arsip dokumen |
| **Operator Simpan Pinjam** | `operator_sp` | `sp123` | Manajemen simpanan anggota dan pinjaman usaha |
| **Operator Sewa** | `operator_sewa` | `sewa123` | Penjadwalan sewa gedung serbaguna dan penataan sewa lahan/kios |

> 💡 **Rekomendasi Keamanan:** Segera ubah password akun bawaan setelah Anda berhasil masuk melalui menu **Profil Saya** di bilah navigasi.

---

## ⚙️ Langkah Awal Penggunaan (Setup Instansi)

1. Masuk sebagai **Administrator** (`admin`).
2. Masuk ke halaman **Pengaturan**:
   * **Identitas Lembaga:** Masukkan Nama BUMDes, Nama Desa, Kecamatan, Kabupaten, Alamat Lengkap, dan unggah Logo BUMDes resmi.
   * **Pejabat Penandatangan:** Masukkan Nama Lengkap dan NIP/Jabatan untuk **Direktur BUMDes**, **Bendahara**, **Penasihat (Kepala Desa)**, dan **Pengawas (Ketua BPD)** agar tanda tangan pada Kwitansi, BKM, BKK, dan Laporan LPJ tercetak otomatis.
   * **Integrasi AI (Opsional):** Masukkan *Google Gemini API Key* gratis Anda dari [Google AI Studio](https://aistudio.google.com/) untuk mengaktifkan asisten cerdas otomatisasi jurnal.
3. Masuk ke modul **Keuangan**:
   * Masukkan Saldo Awal Kas / Bank Anda pada awal tahun buku.
   * Mulai catat transaksi harian secara praktis dan transparan!

---

## 🚀 Panduan Build Produksi (Deployment)

Untuk menjalankan OpenBUMDes pada server produksi (Ubuntu / Debian VPS / Windows Server):

```bash
# 1. Build aplikasi Next.js
npm run build

# 2. Jalankan aplikasi dalam mode produksi
npm run start
```

Untuk menjaga aplikasi tetap berjalan terus-menerus di background, disarankan menggunakan process manager seperti **PM2**:
```bash
npm install -g pm2
pm2 start npm --name "openbumdes" -- run start
pm2 save
pm2 startup
```

---

## 🤝 Berkontribusi

Kontribusi dari seluruh pengembang, pegiat desa, dan akademisi sangat kami sambut! 
1. *Fork* repositori ini
2. Buat *feature branch* baru (`git checkout -b fitur/fitur-baru`)
3. Lakukan *commit* perubahan Anda (`git commit -m 'Menambahkan fitur baru'`)
4. *Push* ke *branch* Anda (`git push origin fitur/fitur-baru`)
5. Buka **Pull Request**

---

## 📄 Lisensi
 
Proyek ini dilisensikan di bawah lisensi **GNU General Public License v3.0 (GPL-3.0)**. Silakan gunakan, kembangkan, dan manfaatkan secara bebas demi transparansi dan kemajuan ekonomi desa di seluruh nusantara.

---
Dikembangkan bersama untuk kemandirian ekonomi desa di Indonesia 🇮🇩
