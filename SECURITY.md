# Kebijakan Keamanan (Security Policy)

Halaman ini menjelaskan kebijakan keamanan untuk proyek **Sistem Informasi Manajemen BUMDES Balongbesuk** serta tata cara pelaporan jika ditemukan kerentanan keamanan.

## Versi yang Didukung (Supported Versions)

Pembaruan keamanan dan perbaikan bug hanya dirilis untuk versi mayor terbaru pada cabang `main`:

| Versi | Didukung secara Aktif |
| ----- | --------------------- |
| 1.x   | :white_check_mark: Ya |

---

## Melaporkan Celah Keamanan (Reporting a Vulnerability)

Jika Anda menemukan celah keamanan (*vulnerability*), mohon tidak melaporkannya melalui GitHub Issues publik demi mencegah penyalahgunaan sebelum perbaikan dirilis.

Silakan laporkan celah keamanan secara privat melalui salah satu metode berikut:
1. **GitHub Security Advisories**: Laporkan langsung melalui tab **Security** di repositori GitHub kami ([balongbesuk/OpenBUMDes/security](https://github.com/balongbesuk/OpenBUMDes/security)) dengan memilih opsi *Report a vulnerability*.
2. **Kontak Pengelola**: Hubungi kontributor/pemelihara repositori ini secara privat melalui profil pengelola organisasi GitHub **balongbesuk**.

Laporan Anda akan dianalisis secara tertutup, dan perbaikan akan segera dirilis pada rilis versi berikutnya.

---

## Pengamanan Lingkungan Produksi (Production Security Guidelines)

Aplikasi ini menggunakan Next.js dengan basis data SQLite lokal. Saat mendeploy aplikasi ini untuk penggunaan riil, harap perhatikan poin-poin keamanan berikut:

### 1. Rahasia JWT (`JWT_SECRET`)
Aplikasi mengamankan sesi pengguna menggunakan token JWT yang disimpan dalam cookie HttpOnly bernama `bumdes_token`. Pastikan Anda menyetel kunci rahasia yang kuat di berkas `.env.local`:
```env
JWT_SECRET=gunakan_kunci_acak_yang_panjang_dan_rumit
```
*Jangan gunakan kunci bawaan (default fallback) di lingkungan produksi.*

### 2. Enkripsi Password (Bcrypt)
Password pengguna disimpan dalam database setelah disandi (*hashed*) menggunakan pustaka `bcryptjs`. Pengelola sistem wajib mengedukasi pengguna untuk menggunakan password yang kuat dan unik melalui menu pengaturan profil masing-masing.

### 3. Keamanan File SQLite (`dev.db`)
Karena SQLite menyimpan seluruh data dalam satu file di direktori `prisma/dev.db`, pastikan permission akses file ini di server dibatasi hanya untuk user sistem yang menjalankan aplikasi Node.js. Jangan membiarkan direktori `prisma` terekspos ke publik.

### 4. Protokol HTTPS
Selalu jalankan aplikasi di balik reverse proxy (seperti Nginx atau Caddy) yang dikonfigurasi dengan sertifikat SSL (HTTPS). Hal ini penting agar cookie sesi `bumdes_token` dikirimkan secara aman (*secure cookie*) dan terhindar dari serangan penyadapan (*man-in-the-middle*).
