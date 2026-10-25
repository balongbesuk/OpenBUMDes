# Changelog

All notable changes to OpenBUMDes are documented in this file.

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

