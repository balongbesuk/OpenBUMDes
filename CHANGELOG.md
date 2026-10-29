# Changelog

All notable changes to OpenBUMDes are documented in this file.

## [1.5.0] - 2026-10-29

### Added - Buku Pembantu Simpan Pinjam (USP) Universal Berstandar Kepmendes 136/2022

* **Arsitektur Model & Database Universal (`prisma/schema.prisma`)**:
  * Menambahkan model universal `LoanMember` (nomor anggota, nama, NIK, alamat, kelompok/dusun, jenis individu/kelompok, simpanan pokok, simpanan wajib, simpanan sukarela, plafon pinjaman, sisa pinjaman, bunga/jasa %, tenor, status pinjaman).
  * Menambahkan model `LoanTransaction` (mutasi setoran simpanan pokok/wajib/sukarela, penarikan simpanan, pencairan pinjaman, angsuran pokok dan bunga/jasa) dengan relasi cascading dan index performa kueri.

* **API Simpan Pinjam & Rekonsiliasi Otomatis (`/api/loans`)**:
  * **Pencatatan Anggota & Mutasi Transaksi**: Mendukung pendaftaran anggota, mutasi simpanan, pencairan pembiayaan, pembayaran angsuran berbasis transaksi atomik `db.$transaction`.
  * **Otomasi Jurnal Kas Ganda**: Fitur opsional *auto-post journal* untuk menyinkronkan transaksi USP langsung ke Buku Kas dan Jurnal Umum BUMDes.
  * **Audit Rekonsiliasi Otomatis Real-Time**: Otomatis membandingkan saldo buku pembantu simpanan terhadap akun kewajiban `2.1.01` dan saldo buku pembantu pinjaman terhadap akun aset `1.1.02` di Buku Besar.
  * **Preset Data Contoh Awal SPJ 2025 Balongbesuk**: Menyediakan fitur satu klik untuk memuat data awal riil dari SPJ BUMDes Balongbesuk 2025 (Simpanan Pokok & Wajib Rp 14.820.000, Piutang Pinjaman USP Rp 89.000.000) yang terbukti **100% BALANCE (Selisih Rp 0)** dengan laporan neraca.

* **Antarmuka Pengguna & Cetak Laporan (`SimpanPinjamTab.tsx`, `page.tsx`)**:
  * Tab interaktif: "Daftar Anggota & Simpanan", "Kartu Pinjaman & Piutang", serta "Lembar Rekapitulasi USP".
  * Banner status rekonsiliasi audit (Simpanan & Piutang) dengan indikator status hijau saat seimbang.
  * Modal input cepat: Tambah Anggota, Setor/Tarik Simpanan, Penyaluran & Angsuran Pinjaman, serta Kartu Riwayat Mutasi Anggota.
  * Fitur cetak ramah printer (*print-ready*) dengan kop resmi BUMDes, tanda tangan Direktur, Pengawas, dan Pengelola USP.

* **Uji Mandiri Otomatis (`tests/self-check.mjs`)**:
  * Menambahkan skenario uji mandiri ke-13 untuk verifikasi formula simpanan, amortisasi angsuran pokok/bunga pinjaman, dan rekonsiliasi saldo buku besar.

## [1.4.2] - 2026-10-29

### Fixed & Hardened - Hasil Audit Kualitas Pembukuan, Saldo Ganda, Integritas Relasi & Keamanan

* **Perbaikan Saldo Ganda & Konsistensi Akuntansi Lintas Tahun (`general-ledger`, `trial-balance`, `eis`, `assets`)**:
  * **Pencegahan Duplikasi Saldo Awal Buku Besar (`/api/audit/general-ledger`)**: Menambahkan pengecekan `hasSaLines` dan `obRecord`; jika jurnal saldo awal (`SA/...`) atau catatan saldo awal resmi telah tercatat, kueri mutasi sebelum 1 Januari dilewati sehingga saldo awal tidak terhitung dua kali saat melihat buku besar setahun penuh.
  * **Sinkronisasi Neraca Saldo & Dashboard Eksekutif (`/api/audit/trial-balance` & `/api/eis`)**: Memeriksa keberadaan jurnal buka buku (`SA/${year}/`); jika ada, akumulasi mutasi dibatasi dari 1 Januari tahun berjalan (`date >= Jan 1`) agar tidak menumpuk mutasi transaksi tahun-tahun lampau yang sudah dipindahkan ke saldo awal.
  * **Rekonsiliasi Register Aset Tetap Pasca Buka Buku (`/api/assets`)**: Memeriksa keberadaan jurnal `SA/${targetYear}/` pada buku besar aset tetap dan akumulasi penyusutan, mencegah munculnya selisih palsu (*false reconciliation difference*) antara fisik register dan buku besar.
  * **Filter Tahun Buku Pembantu Piutang & Utang (`/api/audit/subsidiary-ledger`)**: Memfilter kueri mutasi sesuai parameter `year` yang dipilih (`date <= Dec 31` tahun target) sehingga buku pembantu tidak lagi menampilkan total akumulasi sepanjang masa.

* **Penyelarasan Zona Waktu & Penanganan Tanggal Lokal (`utils.ts`, `cash-book`, komponen modal)**:
  * **Utilitas Tanggal Lokal (`getLocalDateString`)**: Menyediakan fungsi pemformatan tanggal berbasis waktu lokal pengguna (`YYYY-MM-DD`), menggantikan `toISOString().split('T')[0]` yang sebelumnya memundurkan tanggal ke kemarin jika diakses pada dini hari (00:00–07:00 WIB, UTC+7).
  * **Penyelarasan Batas Tanggal Buku Kas (`/api/cash-book`)**: Menggunakan `Date.UTC` untuk batas awal dan akhir bulan/tahun agar selaras 100% dengan mesin laporan keuangan (`reports.ts`).
  * **Integrasi Modal (`ManualTransactionModal`, `InventoryTab`, `FixedAssetsTab`, `page.tsx`)**: Seluruh form input transaksi, barang inventaris, dan aset tetap kini otomatis menggunakan tanggal lokal yang akurat.

* **Penguatan Keamanan, Integritas Relasi & Transaksi Atomik (`inventory`, `coa`, `settings`, `system/reset`, `ledger`)**:
  * **Proteksi Transaksi Atomik Mutasi Stok (`/api/inventory`)**: Membungkus pencatatan kartu stok dan pembaruan `currentQty` dalam `db.$transaction` menggunakan operator atomik `increment`/`decrement` untuk mencegah inkonsistensi saat kasir mencatat penjualan secara bersamaan.
  * **Restriksi Hak Akses Hapus Inventaris (Admin Only)**: Menambahkan verifikasi `session.role === "ADMIN"` pada method `DELETE /api/inventory` agar operator kasir tidak dapat menghapus data barang dan riwayat mutasi stok.
  * **Autentikasi Saldo Awal**: Menambahkan validasi sesi pada `GET /api/opening-balance` untuk mengamankan data posisi keuangan desa dari akses tanpa login.
  * **Validasi Relasi Bagan Akun (COA)**: Menolak penghapusan kode akun di `DELETE /api/keuangan/coa` jika akun tersebut masih ditautkan pada barang inventaris (`InventoryItem`) atau aset tetap (`FixedAsset`).
  * **Standarisasi Akun Persediaan Kemendes 136**: Menstandarkan kode akun default persediaan ke `1.1.05.01` di `schema.prisma` dan modul inventaris (bukan `1.1.04` yang merupakan Penyisihan Piutang).
  * **Pembersihan Bersih Saat Reset Sistem (`/api/system/reset`)**: Menghapus `InventoryItem`, `InventoryMovement`, dan `FixedAsset` saat aksi `"KOSONGKAN"` dijalankan agar tidak menyisakan data register yatim (*orphaned records*).
  * **Penanganan Tabrakan Nomor Bukti (`/api/ledger`)**: Menambahkan loop *retry* otomatis hingga 3 kali saat terjadi benturan nomor bukti unik (`P2002`) pada transaksi kas serentak.
  * **Batch Transaksi Pengaturan (`/api/settings`)**: Membungkus penyimpanan pengaturan sistem dalam satu transaksi database tunggal.
  * **Pencegahan Kebocoran Memori Rate Limiter (`/api/auth/login`)**: Otomatis membersihkan entri pembatasan percobaan login yang telah kedaluwarsa.

* **Perampingan Repositori & Penghapusan Kode Mati (*Lean*)**:
  * **Hapus Kode Mati**: Menghapus fungsi `_legacySnapshot` di `closing/route.ts` (-325 baris), fungsi `getAccountBalance` di `ledger.ts` (-60 baris), dan berkas tidak terpakai `src/lib/settings.ts` (-155 baris).
  * **Hapus Dependensi Tak Terpakai**: Menghapus paket redundan `date-fns` dari `package.json`.
  * **Peningkatan Uji Mandiri (`tests/self-check.mjs`)**: Memperluas skenario pengujian mandiri menjadi 12 tes otomatis yang mencakup verifikasi saldo awal, pembersihan rate limiter, dan fungsi tanggal lokal.

## [1.4.1] - 2026-10-29

### Fixed & Improved - Cetak Register Aset Landscape, Hak Akses Hapus Admin, & Kop Kwitansi Dua Kolom

* **Penyempurnaan Cetak Register & Amortisasi Aset Tetap (`FixedAssetsTab.tsx`, `utils.ts`, `globals.css`)**:
  * **Orientasi Otomatis A4 Landscape**: Memperbarui fungsi `safePrintElement` dengan opsi orientasi dan menerapkan ukuran `A4 landscape` (margin 8mm) sehingga seluruh 10 kolom tabel inventaris termuat utuh tanpa terpotong di sisi kanan.
  * **Perbaikan Total Nilai Halaman Ganda (`tfoot`)**: Mengubah aturan cetak footer tabel menjadi `display: table-row-group !important;` agar baris Total Nilai Bersih hanya dicetak 1 kali di halaman paling akhir (penutup tabel), tidak terulang di setiap potongan lembar.
  * **Pencegahan Tanda Tangan Terpisah (*Orphaned Signatures*)**: Menetapkan `break-inside: avoid` dan merapatkan margin blok pengesahan agar tanda tangan Direktur & Bendahara tetap menyatu dengan baris tabel dan tidak terdorong sendiri ke halaman kosong.
  * **Pembersihan Elemen Mobile**: Menyembunyikan petunjuk mobile (*"Geser tabel untuk melihat rincian aset"*) dan kolom tombol aksi saat mencetak dokumen.

* **Pembaruan Kondisi Fisik Aset & Keamanan Hak Akses (`/api/assets` & `FixedAssetsTab.tsx`)**:
  * **Dropdown Interaktif Kondisi Fisik**: Menambahkan menu dropdown instan langsung pada baris tabel untuk mengubah status fisik barang (`BAIK`, `RUSAK RINGAN`, `RUSAK BERAT`) secara langsung ke database SQLite via endpoint baru `PATCH /api/assets`.
  * **Tampilan Khusus Cetak**: Menyediakan badge formal bergaris tepi tanpa ikon panah dropdown saat dokumen dicetak atau diekspor ke PDF.
  * **Restriksi Hak Akses Hapus Aset (Admin Only)**: Membatasi hak akses hapus aset inventaris secara ketat hanya untuk pengguna dengan peran **Admin** (`session.role === "ADMIN"`). Backend menolak upaya hapus dari non-admin dengan status `403 Forbidden`, dan UI otomatis menyembunyikan kolom dan tombol hapus untuk Operator.

* **Desain Ulang Kop Cetak Kwitansi BKK & BKM Dua Kolom (`KwitansiModal.tsx`)**:
  * **Format Dua Kolom Sejajar**: Menata ulang kop surat bukti kas menjadi format horizontal profesional: Logo BUMDes berdampingan horizontal dengan nama dan alamat instansi di sisi kiri, serta Box Nomor Bukti dan Tanggal berbingkai tegas di sisi kanan.
  * **Kerapian & Ketajaman Cetak**: Menambahkan `-webkit-print-color-adjust: exact !important` dan garis pembatas kop utuh (`border-b-2 border-slate-900 pb-4 mb-4`) agar hasil cetak fisik maupun PDF tetap tajam pada printer warna maupun monokrom.

* **Sinkronisasi Saldo Awal & Pengadaan Aset Berjalan (`ClosingTab.tsx`, `ManualTransactionModal.tsx`, `/api/cash-book`)**:
  * **Input Interaktif Buka Buku**: Mendukung pemilihan akun neraca dinamis dan toggle Debit/Kredit untuk pencatatan Saldo Awal (Buka Buku) berbasis data riil SPJ konsolidasi tahun sebelumnya.
  * **Auto-Link Belanja Modal ke Aset**: Otomatis mendeteksi transaksi belanja modal (BKK) dan mendaftarkannya ke Register Aset Tetap sehingga saldo buku besar dan register aset selalu seimbang (*costDiff: 0*).

## [1.4.0] - 2026-10-28

### Added & Optimized - Gemini AI Vision, Pra-Audit LPJ, Executive Summary Musdes & Structured Output

* **Pemindaian Foto Nota / Kuitansi Fisik (Multimodal Vision)**:
  * **Tombol Kamera & Unggah Nota (`[ 📸 Scan Nota ]`)**: Ditempatkan strategis pada kartu Asisten Buku Kas dengan dukungan otomatis kamera belakang HP (`capture="environment"`) maupun unggah berkas gambar dari laptop.
  * **Ekstraksi Otomatis Gambar Nota (`/api/ai/parse`)**: Mengirim foto berkas via `inlineData` base64 ke Google Gemini Vision untuk mendeteksi tanggal transaksi, nama toko/rekanan, daftar item belanja, dan total nominal, serta menyusun jurnal berpasangan otomatis standar Kepmendesa 136/2022.
  * **Panduan Edukatif Aktivasi (Opsi B)**: Jika fitur diklik saat API Key belum diisi, sistem menampilkan dialog konfirmasi yang menjelaskan bahwa kuota harian Gemini tersedia 100% gratis dari Google AI Studio dan menyediakan tombol navigasi instan langsung ke menu Pengaturan.

* **Optimasi Akurasi AI & Pembelajaran Cerdas Dinamis**:
  * **Structured Outputs (`responseSchema`)**: Memanfaatkan parameter skema ketat `@google/genai` `Type.OBJECT` untuk menjamin output JSON selalu 100% valid dan bertipe data tepat tanpa risiko kegagalan parsing.
  * **Pembelajaran Riil dari Jurnal Desa (*Dynamic Few-Shot Learning*)**: Sistem backend otomatis mengambil 5 transaksi riil terakhir yang tersimpan di database desa (`db.journalEntry`) untuk disuntikkan ke instruksi AI, sehingga Gemini otomatis menyesuaikan diri dengan kebiasaan dan pos akun khas desa setempat.
  * **Penyaringan Otomatis Bagan Akun (*Smart Filtered COA*)**: Otomatis menyaring keluar akun-akun penyesuaian non-kas akhir tahun (akumulasi penyusutan, amortisasi, ikhtisar laba rugi, utang jangka panjang) dan memprioritaskan akun-akun favorit desa di urutan teratas, memangkas konsumsi token hingga 50% dan mempercepat waktu tunggu respons AI.

* **Generator Narasi & Analisis LPJ Musyawarah Desa (Executive Summary)**:
  * **Endpoint Khusus & Widget UI (`/api/ai/lpj-narrative` & `ClosingTab.tsx`)**: Menghasilkan naskah narasi formal 2 paragraf yang santun, profesional, dan mudah dipahami warga/BPD mengenai capaian omset, efisiensi beban, laba bersih/SHU, dan rekomendasi tahun depan.
  * **Integrasi Lembar Cetak LPJ 8 Halaman (`LpjPrintModal.tsx`)**: Narasi resmi disematkan langsung pada Halaman 7 (CaLK) sub-bab *5. Ringkasan Eksekutif Kinerja & Evaluasi Usaha (Musdes)*.
  * **Tombol Salin Narasi Cepat**: Memudahkan Direktur BUMDes menyalin naskah pidato/sambutan Musdes ke clipboard hanya dalam 1 klik.
  * **Generator Cadangan Offline**: Tetap dapat menghasilkan narasi terstruktur berbasis data riil pembukuan meskipun tanpa koneksi internet atau tanpa API Key.

* **Pemeriksa Kesehatan Keuangan & Deteksi Anomali Pembukuan (Pra-Audit LPJ)**:
  * **Mesin Pra-Audit Akuntansi Mandiri (`/api/ai/health-audit` & `ClosingTab.tsx`)**: Berjalan 100% lokal di database desa untuk mendeteksi potensi temuan sebelum pembukuan resmi ditutup dan dikunci.
  * **Indikator Kesehatan Finansial (Skor 0-100)**: Menampilkan badge status visual (🟢 *SEHAT*, 🟡 *PERHATIAN*, 🔴 *WASPADA*) dengan 3 metrik kunci: Rasio BOPO (%), Margin Laba Bersih (%), dan Posisi Kas & Bank Akhir.
  * **Deteksi Masalah Otomatis**: Memeriksa saldo kas negatif, transaksi dengan uraian terlalu ambigu, dan memvalidasi integritas 100% keseimbangan Debit vs Kredit di seluruh jurnal.

* **Penyederhanaan Dokumentasi & Perampingan Repositori**:
  * **Perampingan `README.md`**: Memangkas 114 baris dokumentasi redundan (daftar isi manual yang sudah digantikan tombol outline bawaan GitHub dan rincian bab berulang) tanpa mengurangi informasi teknis, regulasi, maupun panduan instalasi VPS.

## [1.3.0] - 2026-10-27

### Added - Buku Pembantu Persediaan, Register Aset Tetap & Indikator Rekonsiliasi Otomatis

* **Buku Pembantu Persediaan & Kartu Stok (`InventoryTab.tsx` & `/api/inventory`)**:
  * **Master SKU & Valuasi Persediaan**: Model data `InventoryItem` dan `InventoryMovement` mendukung pencatatan saldo awal, batas minimum stok (*reorder warning*), dan kode akun neraca (Akun `1.1.04.01`).
  * **Metode Biaya Rata-Rata Bergerak (*Moving Average*)**: Perhitungan otomatis nilai perolehan rata-rata per unit dan total nilai persediaan akhir setiap terjadi mutasi masuk (*IN*), keluar (*OUT*), atau penyesuaian (*ADJUST*).
  * **Kartu Stok & Riwayat Mutasi Lengkap**: Pratinjau riwayat pergerakan stok per SKU dengan format kartu stok resmi dan verifikasi sisa kuantiti.
  * **Cetak Lembar Rekapitulasi Persediaan Standar**: Lembar cetak formal bertaraf audit lengkap dengan Kop BUMDes resmi, tabel bergaris (*full grid*), dan kolom pengesahan bertanda tangan Direktur & Pengelola Barang/Bendahara.
  * **Indikator Kontrol Rekonsiliasi Otomatis**: Banner visual otomatis yang membandingkan total fisik gudang di Buku Pembantu terhadap saldo pembukuan Akun `1.1.04` di Buku Besar/Neraca untuk mendeteksi selisih *stock opname*.

* **Daftar Register & Jadwal Penyusutan Aset Tetap (`FixedAssetsTab.tsx` & `/api/assets`)**:
  * **Inventarisasi & Registrasi Barang Modal**: Model data `FixedAsset` mencatat nomor registrasi, nama unit aset, kategori (Peralatan & Mesin, Kendaraan, Gedung, Mebel, dll.), tanggal perolehan, harga beli, nilai residu/sisa, lokasi, dan kondisi fisik (Baik / Rusak Ringan / Rusak Berat).
  * **Penyusutan Metode Garis Lurus (*Straight-Line Depreciation*)**: Perhitungan amortisasi otomatis berbasis umur ekonomis (tahun), beban depresiasi per bulan/tahun, akumulasi penyusutan hingga tanggal pelaporan, dan sisa nilai buku bersih.
  * **Cetak Register Aset & Jadwal Amortisasi**: Format dokumen cetak resmi ber-Kop BUMDes untuk lampiran LPJ Musdes dengan tanda tangan pengesahan Direktur dan Pengurus Barang/Bendahara.
  * **Indikator Kontrol Rekonsiliasi Neraca Ganda**: Banner visual otomatis yang memverifikasi keselarasan dua akun neraca sekaligus:
    * Harga Perolehan Register vs Saldo Buku Besar Akun `1.2.01` (Aset Tetap).
    * Akumulasi Penyusutan Register vs Saldo Buku Besar Akun `1.2.02` (Akumulasi Penyusutan Aset Tetap).

* **Penyempurnaan Antarmuka, Dialog Sistem & Ekspor Excel**:
  * **Komponen Dialog Kustom (`AppDialog`)**: Menggantikan seluruh popup bawaan browser (`window.alert`, `window.confirm`) menjadi modal modern terpadu bernuansa premium.
  * **Opsi Durasi Sesi ("Ingat Sesi Masuk")**: Menambahkan opsi perpanjangan sesi masuk hingga 30 hari pada portal login vs sesi reguler 1 hari.
  * **Pencetakan Dokumen Lintas Elemen (`safePrintElement`)**: Optimalisasi fungsi cetak dokumen yang polymorfik mendukung elemen DOM langsung maupun selektor ID elemen cetak.
  * **Tombol Cepat Ekspor Excel 1 Tahun Penuh**: Menambahkan tombol langsung unduh seluruh transaksi kas & jurnal 1 tahun penuh ke format `.xlsx` pada panel Buku Kas.

## [1.2.0] - 2026-10-27

### Security, Financial Audit & Lean Engine Optimization

* **Pengamanan Autentikasi & Proteksi Endpoint API**:
  * **Wajib Sesi pada Endpoint Data**: Menambahkan validasi sesi pengguna (`getUserSession`) pada endpoint Buku Kas (`/api/cash-book`), Ekspor Excel (`/api/cash-book/export-excel`), Laporan Keuangan (`/api/reports`), EIS (`/api/eis`), Arsip Tutup Buku (`/api/closing`), AI Parser (`/api/ai/parse`), dan Buku Besar Audit (`general-ledger`, `subsidiary-ledger`, `trial-balance`).
  * **Proteksi Kunci Rahasia AI**: Menyensor nilai `gemini_api_key` (`"********"`) pada respon `GET /api/settings` untuk pengunjung atau non-admin guna mencegah kebocoran kuota token.
  * **Perlindungan Serangan Timing & Sesi**: Memperbarui verifikasi token di `src/lib/auth.ts` dengan `crypto.timingSafeEqual` dan mewajibkan env secret di mode produksi.
  * **Perlindungan Administrator Terakhir**: Mencegah penurunan peran (*demotion*) satu-satunya akun Administrator menjadi Operator pada endpoint pembaruan pengguna.

* **Integritas Akuntansi & Perbaikan Kalkulasi Multi-Tahun**:
  * **Mesin Laporan Terpadu (`src/lib/reports.ts`)**: Mengonsolidasikan logika kalkulasi 4 laporan keuangan standar Kepmendes 136/2022 menjadi satu sumber kebenaran (*single source of truth*) yang dipakai bersama oleh modul laporan dinamis dan arsip penutupan tahun.
  * **Pencegahan Double Counting Saldo Awal**: Menyelaraskan rentang waktu agregasi Neraca. Jika jurnal Buka Buku (`SA/{year}/01/0001`) tercatat, neraca menghitung mutasi dari 1 Januari tahun berjalan sehingga saldo tahun lalu tidak terhitung dua kali.
  * **Penghapusan Nilai Hardcode**: Menghapus nilai konstan `2750000` pada kalkulasi liabilitas simpanan anggota dan menghitungnya riil dari akun pembukuan.
  * **Transparansi Kas Defisit**: Menghapus pembungkus `Math.max(0, ...)` agar defisit kas tetap terlihat jujur dan persamaan akuntansi (Aset = Kewajiban + Ekuitas) terbukti seimbang.
  * **Penyempurnaan Penomoran Bukti Transaksi**: Menghitung nomor urut bukti harian berbasis nilai numerik maksimum secara atomik di `src/lib/ledger.ts` guna mencegah benturan (*unique constraint collision*) pada transaksi bersamaan.
  * **Validasi Transaksi Ketat**: Menolak baris jurnal bernilai $\le 0$ atau kode akun yang tidak terdaftar di master Bagan Akun (COA).
  * **Keamanan SQLite Backup & Restore**: Menjalankan checkpoint WAL (`PRAGMA wal_checkpoint(TRUNCATE)`) sebelum backup dan membersihkan file sisa `-wal`/`-shm` saat pemulihan basis data.

* **Optimalisasi Ramping (*Lean*) & Uji Otomatis**:
  * **Pembersihan Kode Mati**: Menghapus komponen tidak terpakai (`CalkTab.tsx`, `ArusKasModalTab.tsx`, `api/keuangan/reports/route.ts`, dan `validation.ts`) menghemat lebih dari 1.000 baris kode redundan.
  * **Pembersihan Dependensi**: Menghapus paket npm yang tidak terpakai (`jsonwebtoken`, `jose`, `zod`).
  * **Suite Uji Mandiri (`tests/self-check.mjs`)**: Menambahkan skrip verifikasi otomatis terintegrasi ke `npm test` untuk memverifikasi keamanan token, hashing kata sandi, penomoran urut bukti, dan keseimbangan debit-kredit.

## [1.1.0] - 2026-10-25

### Added & Improved - LPJ Musdes A4, Rollover Saldo Awal, & Audit Grid

* **Penyempurnaan Cetak Dokumen Resmi LPJ BUMDes (8 Halaman A4 Standar Kemendesa)**:
  * **Halaman 1 (Cover A4 Presisi)**: Bingkai ganda formal (*double border*) dikalibrasi presisi dengan tinggi lembar A4 portrait (`272mm`) dan tata letak vertikal seimbang (`justify-content: space-between`), memastikan cover membingkai penuh dari atas ke bawah tanpa celah kosong dan tanpa memicu lembaran kosong tambahan (*orphan page*).
  * **Kop Surat Cetak Standar & Tahan-Banting**: Memperbaiki tata letak Kop Surat pada mode cetak/ekspor PDF dengan *inline styles* dan kelas CSS khusus (`.kop-header-container`, `.kop-brand-box`, `.kop-badge`, dll.), mencegah badge `Kepmendes PDTT 136/2022` meregang ke samping secara horizontal sehingga hasil cetak PDF 100% identik dengan tampilan pratinjau (*preview*).
  * **Kop Surat & Logo Resmi di Halaman 8**: Halaman 8 (Lembar Pengesahan LPJ Musdes) kini dilengkapi dengan Kop Surat resmi BUMDes dan logo instansi.
  * **Konsolidasi Tanda Tangan SPJ Terpusat**: Menghilangkan kolom tanda tangan pada Halaman 2 sampai Halaman 7 agar tabel keuangan lebih leluasa dan proporsional, serta mengonsolidasikan tanda tangan pengesahan resmi secara terpusat di Halaman 8 untuk 4 pilar pengesahan (Bendahara BUMDes, Direktur Utama BUMDes, Ketua Badan Pengawas, dan Kepala Desa selaku Penasihat).
* **Konektivitas Saldo Awal Otomatis (Rollover Awal Tahun 1 Januari)**:
  * **Laporan Arus Kas (LAK Metode Langsung)**: Saldo kas awal 1 Januari kini otomatis terkoneksi dan terisi dari saldo kas akhir penutupan buku tahun sebelumnya / saldo awal buka buku, menjamin saldo akhir sinkron 100% dengan Neraca.
  * **Buku Besar Umum (General Ledger)**: Saldo awal periode kini terisi otomatis dari entri saldo awal pembukuan (`OpeningBalance`), memisahkan saldo awal dengan mutasi berjalan operasional secara akurat.
* **Paginasi Dinamis Bagan Akun (COA Dinamis)**:
  * Menambahkan fitur paginasi interaktif pada Master Bagan Akun dengan pilihan 15, 25, 50, dan 100 baris per halaman untuk navigasi cepat dan tampilan yang lebih rapi.
* **Tampilan Tabel Audit Full Grid pada Buku Kas & Jurnal**:
  * Pembaruan tampilan tabel transaksi Buku Kas Umum dan Jurnal Transaksi dengan gaya bergaris formal (*Full Grid*) dan baris total mutasi seimbang untuk memudahkan verifikasi dan pemeriksaan audit.
* **Rombak Total Widget Profil Pengguna di Header (Top Navigation)**:
  * Menghilangkan batas pemotongan teks (`max-w-[130px]`) yang sebelumnya memotong nama menjadi "Kepala / Direktur BU...". Nama pengguna kini tampil utuh dan proporsional.
  * Memperbarui visual avatar dengan gradien modern (`indigo-purple`) dan indikator status aktif (*green online dot*).
  * Menambahkan kartu menu dropdown interaktif: menampilkan kartu identitas profil lengkap, username (@admin), hak akses sesi, pintasan navigasi cepat (Pengaturan Instansi & AI, Kelola Akun & Database, Buku Kas), serta tombol Keluar (Logout) yang aman dan elegan dengan deteksi klik luar (*click outside*).
* **Pelindung Bagan Akun (COA) Permanen & Kustomisasi Fleksibel Akun Pengguna**:
  * **Jaminan Akun COA Tidak Terhapus saat Mengosongkan Database**: Proses pengosongan aplikasi di `/api/system/reset` secara sengaja mempertahankan seluruh Master Bagan Akun (`ledgerAccount`) dan akun kustom pengguna. Dilengkapi safeguard otomatis: jika tabel akun pernah kosong, sistem akan otomatis melakukan *auto-seed* dari master resmi `coa_kemendes_136.json`.
  * **Fitur Sesuaikan / Kustomisasi Akun (Edit Akun COA)**: Pengguna kini dapat menyesuaikan nama akun standar (misalnya: mengganti "Kas di Bank BNI" menjadi "Kas di Bank BNI Unit Balongbesuk" atau bank lokal lainnya) melalui tombol Aksi Edit (`✏️`). Perubahan nama akun secara otomatis tersinkronisasi ke seluruh buku jurnal dan template formulir transaksi.
  * **Indikator Status Akun Transparan**: Tabel COA dilengkapi kolom Status dengan badge visual:
    * `Standar`: Akun resmi bawaan sistem Kepmendesa No. 136/2022.
    * `Disesuaikan`: Akun standar yang telah disesuaikan namanya oleh pengguna, dilengkapi informasi nama bawaan aslinya di bawah nama akun.
    * `Kustom`: Akun dinamis tambahan baru buatan pengguna (dapat dihapus dengan aman jika belum memiliki riwayat jurnal).
  * **Fitur Pulihkan COA Bawaan Sistem**: Menambahkan tombol `Pulihkan COA Bawaan Sistem` (`/api/keuangan/coa/reset-default`) untuk mengembalikan seluruh nama akun standar ke nama resmi Kepmendes 136/2022 kapan saja tanpa menghapus akun-akun kustom pengguna.
* **Rombak Total Halaman Masuk (Split-Screen 2-Panel Modern Login Page & Optimalisasi Mobile)**:
  * Mengganti modal popup login lama dengan tata letak layar ganda (*Split Screen / Dua Layar*) beresolusi penuh (*full viewport*).
  * **Layar Kiri (Identitas & Prestise BUMDes)**: Latar gradien gelap elegan dengan ambient glow, menampilkan logo resmi dan identitas Pemdes BUMDes, lencana kepatuhan Kepmendesa 136/2022, 3 kartu pilar keunggulan (5 Laporan Keuangan EMKM, LPJ Musdes 8 Halaman A4, Asisten AI & EIS). Pada layar perangkat bergerak (*mobile*), header otomatis menjadi ringkas dan proporsional untuk navigasi masuk yang instan.
  * **Layar Kanan (Portal Autentikasi Pengguna Bersih & Aman)**: Antarmuka formulir yang bersih dan berfokus tinggi tanpa elemen demo (*akses cepat dihapus*), dilengkapi kolom username & password dengan fitur lihat/sembunyikan sandi (*Eye/EyeOff toggle*), kotak centang "Ingat sesi masuk", tombol submit bergradasi dinamis, dan jaminan keamanan koneksi SSL terenkripsi.
* **Penanganan Status Database Kosong pada Modul EIS (Kesehatan Keuangan)**:
  * Memperbaiki kalkulasi API `/api/eis` agar memverifikasi keberadaan data transaksi dan saldo awal pembukuan sebelum menghitung rasio.
* **Keamanan Aplikasi (Penyelesaian GitHub CodeQL Alert - DOM XSS Prevention)**:
  * Mengeliminasi seluruh kerentanan *DOM text reinterpreted as HTML* (`js/xss-through-dom`, CWE-79, CWE-116) pada seluruh fitur cetak dokumen laporan keuangan dan LPJ.
  * Menghapus pemanggilan rawan `document.write(...)` dan menggantikannya dengan fungsi utilitas aman `safePrintElement` di `src/lib/utils.ts` yang mengkloning elemen DOM langsung via `element.cloneNode(true)`, mengisolasi stylesheet via `<style>`, dan menetapkan judul via properti `document.title` tanpa parsing string HTML mentah.
  * Menerapkan perbaikan keamanan cetak pada seluruh modul: Dokumen Laporan (Halaman Utama), Neraca Saldo, Buku Besar Pembantu, Buku Besar Umum, Analisis Kesehatan EIS, dan Modal Cetak LPJ Musdes.

## [1.0.0] - 2026-10-25

### Released - OpenBUMDes (Standar Kepmendes PDTT No. 136/2022)

* **Arsitektur Tunggal \& Modern**: Antarmuka terpadu berbasis Next.js 15, React 19, dan Tailwind CSS.
* **Bagan Akun Standar (COA Dinamis)**: Integrasi penuh 220+ akun standar Kepmendesa PDTT No. 136/2022 dengan kodefikasi 5 level, dilengkapi kartu ringkasan kategori (Aset, Kewajiban, Ekuitas, Pendapatan, Beban), pencarian real-time kode/nama akun, filter kategori cepat, opsi baris per halaman (15/25/50/100 baris), serta paginasi dinamis yang rapi dan responsif.
* **Buku Kas Umum \& Jurnal (Standar Grid Audit & Kartu Metrik)**: Pencatatan kas masuk (BKM), kas keluar (BKK), memorial (BM/SA), integrasi Gemini AI, dilengkapi 5 kartu ringkasan eksekutif (Total Transaksi, Kas Masuk, Kas Keluar, Keseimbangan 100% Klir, Kelengkapan TTD Kwitansi), pencarian real-time (no. bukti, uraian, rekanan, akun), filter multi-dimensi, opsi baris per halaman, serta tabel bergaris formal (Full Grid) dengan baris total mutasi seimbang.
* **Laporan Keuangan Otomatis (Standar Grid Audit & Kartu Metrik Eksekutif)**:
  * Laporan Posisi Keuangan (Neraca SAK EMKM): Tampilan tabel formal berdampingan (Aktiva vs Pasiva) dengan badge status keseimbangan (100% Klir).
  * Laporan Laba Rugi Komprehensif: Tabel bergaris formal (Full Grid) dengan rincian pendapatan, beban, dan margin laba bersih.
  * Laporan Perubahan Ekuitas (LPE): Pelacakan mutasi modal desa, cadangan modal, penyetoran PADes, dan saldo ekuitas akhir.
  * Laporan Arus Kas (LAK) Metode Langsung: Klasifikasi arus kas Operasi, Investasi, Pendanaan, rekonsiliasi otomatis Saldo Kas Awal 1 Jan dari Buka Buku/Tutup Buku tahun lalu, dan rekonsiliasi kas akhir sinkron 100% dengan Neraca.
  * Catatan atas Laporan Keuangan (CaLK): Pengungkapan lengkap aset lancar, aset tetap & akumulasi penyusutan, kewajiban, ekuitas, dan kinerja usaha.
  * Ringkasan Kartu Metrik Eksekutif di bagian atas tiap laporan untuk analisis visual cepat.
* **Tutup & Buka Buku & Cetak Dokumen Resmi LPJ (8 Halaman Penuh)**:
  * Otomasi penutupan buku tahunan, pemindahan SHU ke laba ditahan, dan pembentukan saldo awal tahun berikutnya.
  * **Rombak Total Cetak LPJ 100% Selaras dengan Menu Laporan Keuangan**: Seluruh 8 halaman cetak LPJ kini mengacu langsung pada tata letak, KOP resmi BUMDes (lengkap dengan logo, identitas desa, kecamatan, kabupaten, nomor standar Kepmendes 136/2022), kolom tabel, dan tanda tangan resmi dari masing-masing menu:
    * **Halaman 1**: Cover resmi Musdes BUMDes dengan ornamen formal bingkai ganda dan pengesahan desa.
    * **Halaman 2**: Laporan Laba Rugi Komprehensif Full Grid persis menu Laba Rugi (Pendapatan Usaha, Beban Operasional, dan SHU Bersih).
    * **Halaman 3**: Rencana & Realisasi Alokasi SHU Musdes sesuai ketetapan AD/ART (PADes, Cadangan Modal, Pengurus, Sosial, Pendidikan).
    * **Halaman 4**: Laporan Posisi Keuangan (Neraca SAK EMKM) dengan tabel 2 kolom berdampingan persis menu Neraca (Aktiva vs Pasiva) dan badge status balance 100% Klir.
    * **Halaman 5**: Laporan Perubahan Ekuitas (LPE) persis menu LPE (Penyertaan modal awal, mutasi, saldo laba, penyetoran PADes, dan total ekuitas akhir).
    * **Halaman 6**: Laporan Arus Kas (LAK) Metode Langsung persis menu LAK (Aktivitas Operasi, Investasi, Pendanaan, kenaikan kas bersih, saldo awal, dan saldo akhir kas).
    * **Halaman 7**: Catatan atas Laporan Keuangan (CaLK) terbaru persis menu CaLK (Informasi Umum, Kebijakan Akuntansi, Sub-tabel A. Aset Lancar, Sub-tabel B. Aset Tetap & Akumulasi Penyusutan, Sub-tabel C. Kewajiban & Ekuitas, Ringkasan Kinerja Operasional Laba Rugi, dan Pengesahan Musdes).
    * **Halaman 8**: Lembar Pengesahan Resmi Keputusan Musdes 4 Pihak (Bendahara BUMDes, Direktur Utama BUMDes, Ketua Badan Pengawas, dan Kepala Desa selaku Penasihat).
  * Pratinjau LPJ Draft langsung sebelum penutupan buku serta pencetakan arsip resmi LPJ terkunci.
* **EIS (Executive Information System) Tingkat Kesehatan Keuangan**:
  * Perhitungan 8 Indikator Keuangan standar PPAK BUMDes Ver 4.5 & Kemendesa (ROE, ROI, Cash Ratio, Current Ratio, Collection Period, Perputaran Persediaan, TATO, Rasio Modal).
  * Transparansi rincian formula, data dasar pembilang-penyebut, perolehan skor (Total 100 Poin), dan predikat (SEHAT / KURANG SEHAT / TIDAK SEHAT).
  * Format Cetak Dokumen Eksekutif A4 resmi lengkap dengan tanda tangan Penasihat (Kepala Desa) dan Direktur BUMDes.
* **Modul Terpisah: Buku & Audit Inspektorat**:
  * **Buku Besar Umum (General Ledger)**: Filter akun COA, rekonsiliasi otomatis saldo awal periode dari tabel OpeningBalance/Buka Buku, mutasi debit/kredit murni operasional, lawan akun, dan fitur Cetak Dokumen Pemeriksaan A4.
  * **Neraca Saldo (Trial Balance)**: Kertas kerja verifikasi keseimbangan akuntansi dengan badge status *100% Seimbang (Selisih Rp 0)* dan fitur Cetak Resmi.
  * **Buku Pembantu Piutang & Utang (Subsidiary Ledger)**: Kartu kontrol per pelanggan/debitur dan kreditur/vendor dengan fitur Cetak Kartu Pengawasan.
  * **100% Single-Entry & Otomatis**: Terhubung langsung dari transaksi BKU tanpa perlu input ganda.
* **Pemeliharaan & Keamanan**: Backup database SQLite, restore instan, reset sistem, dan sanitasi kredensial bawaan.

