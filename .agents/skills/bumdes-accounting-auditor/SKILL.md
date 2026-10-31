---
name: bumdes-accounting-auditor
description: >
  Verifikasi dan audit kepatuhan akuntansi BUMDes Standar Kepmendes PDTT No. 136/2022:
  keseimbangan debit-kredit jurnal (BKM/BKK/Memorial), konsistensi 4 laporan keuangan
  (Laba Rugi, Neraca, LPE, LAK), rekonsiliasi buku pembantu (Simpan Pinjam USP, Aset Tetap,
  Persediaan, Kas Bank, Pajak), alokasi laba bersih (PADes & Cadangan), dan integritas arsip tutup buku.
  Gunakan untuk "audit keuangan", "verifikasi akuntansi", "cek laporan BUMDes", "cek kepmendes", /bumdes-audit.
---

# BUMDes Accounting Auditor (Standar Kepmendes PDTT No. 136/2022)

Gunakan skill ini sebagai auditor independen akuntansi BUMDes untuk memverifikasi kebenaran pencatatan, keseimbangan pembukuan, rekonsiliasi subledger, dan integritas laporan keuangan sebelum dilaporkan ke Musyawarah Desa (Musdes) atau Inspektorat.

---

## 1. Prinsip Utama Audit Akuntansi BUMDes

1. **Keseimbangan Mutlak**:
   - Setiap transaksi jurnal (`BKM`, `BKK`, `MEMORIAL`) wajib berimbang: $\sum \text{Debit} = \sum \text{Kredit}$.
   - Neraca Saldo (*Trial Balance*) kumulatif per tahun anggaran wajib berimbang dengan selisih Rp 0.
2. **Keterkaitan 4 Laporan Pokok (Kepmendes 136/2022)**:
   - **Laba Rugi**: $\text{Laba Bersih} = \text{Pendapatan (4.x)} - \text{Beban (5.x, 6.x, 7.x)}$.
   - **Neraca**: $\text{Total Aset (1.x)} = \text{Total Kewajiban (2.x)} + \text{Total Ekuitas (3.x)}$.
   - **LPE**: $\text{Ekuitas Akhir LPE} = \text{Total Ekuitas di Neraca}$.
   - **LAK**: $\text{Saldo Kas Akhir LAK} = \text{Kas \& Setara Kas di Neraca Lancar (1.1.01.x)}$.
3. **Integritas Periode Tutup Buku**:
   - Tahun buku yang berstatus terkunci (`isLocked === true`) adalah arsip LPJ resmi: tidak boleh dimutasi, ditambah, diedit, atau dihapus.
   - Pembacaan laporan tahun terkunci wajib mengambil dari `snapshotData`.
   - Saldo Awal tahun baru (`SA/`) hanya mengambil data riil neraca penutup tahun sebelumnya tanpa menduplikasi transaksi masa lalu.

---

## 2. Prosedur Verifikasi Bertahap

Lakukan pengecekan secara berurutan sesuai 5 pilar berikut:

### Pilar A: Audit Jurnal & Neraca Saldo
1. Periksa tabel `JournalEntry` dan `JournalLine`:
   - Pastikan tidak ada jurnal yang selisih antara total baris `DEBIT` dan `CREDIT`.
   - Pastikan tidak ada jurnal tanpa baris (*orphan entry*).
   - Pastikan seluruh `accountCode` terdaftar di tabel `LedgerAccount`.
2. Periksa saldo normal akun kontra:
   - Akumulasi Penyusutan (`1.3.07.xx` & `1.3.08.xx`) bersaldo normal **Kredit**.
   - Penyisihan/Cadangan Kerugian Piutang (`1.1.04.xx`) bersaldo normal **Kredit**.

### Pilar B: Audit Rekonsiliasi 4 Laporan Keuangan
1. **Laba Rugi ke Neraca**:
   - Pastikan Laba Bersih tahun berjalan terhubung persis ke baris laba periode berjalan pada ekuitas Neraca.
2. **Laporan Perubahan Ekuitas (LPE)**:
   - $\text{Saldo Laba Akhir} = \text{Saldo Laba Awal} + \text{Laba Berjalan} - \text{Alokasi PADes/Bagi Hasil}$.
   - $\text{Ekuitas Akhir} = \text{Modal Desa APBDes} + \text{Modal Masyarakat} + \text{Saldo Laba Akhir}$.
   - Cocokkan langsung dengan baris Total Ekuitas Neraca.
3. **Laporan Arus Kas (LAK)**:
   - Mutasi internal antar kas (misal Setor Tunai dari Kas `1.1.01.01` ke Bank Jatim `1.1.01.06`) wajib **dieliminasi** dari Arus Kas Operasi agar tidak terjadi penggelembungan semu.
   - Pembelian aset tetap (`1.3.xx`) wajib masuk ke **Arus Kas Investasi**.
   - Pembayaran bagi hasil PADes (`3.3.01.01`) wajib masuk ke **Arus Kas Pendanaan**.
   - $\text{Saldo Kas Awal} + \text{Kenaikan Kas Bersih} = \text{Saldo Kas Akhir} = \text{Kas \& Bank di Neraca}$.

### Pilar C: Audit Buku Pembantu (Subsidiary Ledger)
1. **Simpan Pinjam USP**:
   - Total Simpanan Pokok + Wajib + Sukarela seluruh anggota di `LoanMember` = Saldo Buku Besar Akun `2.1.01.xx` / `2.1.05.xx`.
   - Total Sisa Pokok Pinjaman seluruh anggota di `LoanMember` = Saldo Buku Besar Akun `1.1.02.xx` / `1.1.03.xx`.
   - Pembayaran angsuran pokok tidak boleh melebihi sisa pinjaman debitur.
2. **Register Aset Tetap**:
   - Total harga perolehan seluruh item di `FixedAsset` dengan tanggal perolehan $\le 31$ Desember tahun target = Saldo Akun Peralatan/Aset Tetap (`1.3.xx` non-akumulasi).
   - Akumulasi penyusutan garis lurus di register = Saldo Akun Akumulasi Penyusutan (`1.3.07.xx`).
3. **Kartu Stok Persediaan**:
   - Kuantitas akhir $\times$ moving average unit cost = Saldo Akun Persediaan Barang Dagangan/ATK (`1.1.05.xx`).
   - Rekaman mutasi bertanda `SALDO-AWAL` tidak boleh ditambahkan dua kali ke kuantitas awal.
4. **Buku Kas Pembantu Bank & Buku Pembantu Pajak**:
   - Saldo per rekening bank (`1.1.01.02` - `1.1.01.06`) mencocokkan rekening koran.
   - Pungut dan setor pajak (`2.1.02.xx`) tervalidasi dengan nomor NTPN / ID Billing.

### Pilar D: Audit Alokasi SHU & Dana Desa (AD/ART)
Sesuai standar umum AD/ART BUMDes & Kepmendes 136:
- PADes (Pendapatan Asli Desa): 40% dari Laba Bersih
- Cadangan Penambahan Modal: 20%
- Pengurus dan Pengawas: 20%
- Dana Sosial / Pemberdayaan: 10%
- Dana Pendidikan: 10%

---

## 3. Langkah Eksekusi Audit Cepat

Saat pengguna meminta audit keuangan, jalankan verifikasi data dengan perintah:

1. **Jalankan Self-Check Otomatis**:
   ```powershell
   node tests/self-check.mjs
   ```
2. **Jalankan Integrity Type Check**:
   ```powershell
   node ./node_modules/typescript/bin/tsc --noEmit
   ```
3. **Analisis Database Riil (Jika data localhost terpasang)**:
   Panggil endpoint `/api/reports?year={targetYear}` atau periksa query `prisma/dev.db` untuk mencocokkan matriks rekonsiliasi.

---

## 4. Format Laporan Hasil Audit Akuntansi

Sajikan hasil audit secara padat, jelas, dan profesional dengan format berikut:

```markdown
# Laporan Hasil Audit Akuntansi BUMDes (Tahun Anggaran {TA})
Standar: Kepmendes PDTT No. 136/2022

### 1. Ringkasan Eksekutif
- **Status Keseimbangan**: [SINKRON 100% / ADA SELISIH]
- **Laba Bersih Tahun Berjalan**: Rp xxx
- **Total Aset**: Rp xxx
- **Skor Kesehatan Keuangan (EIS)**: {Skor} ({Predikat: SEHAT / KURANG SEHAT / TIDAK SEHAT})

### 2. Matriks Rekonsiliasi Antar Laporan Pokok
| Indikator Relasi | Nilai Sisi A | Nilai Sisi B | Selisih | Kesimpulan |
| :--- | :--- | :--- | :---: | :---: |
| Keseimbangan Neraca | Total Aset: Rp ... | Pasiva: Rp ... | Rp 0 | Sesuai |
| Laba Rugi ➔ Neraca | Laba Bersih: Rp ... | Ekuitas Berjalan: Rp ... | Rp 0 | Sesuai |
| LPE ➔ Neraca | Ekuitas LPE: Rp ... | Ekuitas Neraca: Rp ... | Rp 0 | Sesuai |
| LAK ➔ Neraca | Kas Akhir LAK: Rp ... | Kas & Bank: Rp ... | Rp 0 | Sesuai |

### 3. Rekonsiliasi Subledger (Buku Pembantu) vs Buku Besar
| Unit / Buku Pembantu | Total Subledger | Saldo Buku Besar | Selisih | Catatan |
| :--- | :--- | :--- | :---: | :--- |
| Simpanan USP (Pokok+Wajib) | Rp ... | Rp ... (2.1.01/2.1.05) | Rp 0 | Klop |
| Piutang Pinjaman USP | Rp ... | Rp ... (1.1.02/1.1.03) | Rp 0 | Klop |
| Register Aset Tetap | Rp ... | Rp ... (1.3.03/04) | Rp 0 | Klop |
| Kartu Stok Persediaan | Rp ... | Rp ... (1.1.05) | Rp 0 | Klop |

### 4. Temuan Kritis & Rekomendasi (Bila Ada)
- [Sebutkan nomor bukti atau akun jika ada yang tidak balance]

Done — Audit kepatuhan akuntansi Kepmendes 136/2022 selesai.
```

