# Overview

Selamat datang di dokumentasi **IT Helpdesk REST API**. API ini menyediakan akses ke seluruh fitur sistem IT Helpdesk.

## Base URL

```
http://localhost:3001/api/v1
```

## Format Response

Semua response menggunakan format JSON yang konsisten:

**Sukses:**
```json
{
  "error": false,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": true,
  "message": "Penjelasan error di sini"
}
```

## HTTP Status Codes

| Code | Arti | Kapan Muncul |
|------|------|--------------|
| `200` | OK | Request berhasil |
| `201` | Created | Data baru berhasil dibuat |
| `400` | Bad Request | Validasi gagal, input tidak valid |
| `401` | Unauthorized | Email/password salah saat login |
| `403` | Forbidden | Akun dinonaktifkan / tidak punya akses |
| `404` | Not Found | Data tidak ditemukan |
| `409` | Conflict | Data duplikat (email sudah terdaftar, tiket sudah diklaim) |
| `500` | Server Error | Kesalahan internal server |

## Autentikasi

API ini **tidak menggunakan JWT atau Bearer Token**. Semua endpoint bisa diakses langsung. Untuk operasi yang membutuhkan identitas user, kirim `user_id` atau `staff_id` di request body.

> **Tips:** Setelah login, simpan `id` dan `role` dari response. Gunakan `id` tersebut sebagai `user_id` / `staff_id` di endpoint lain.

## Referensi Nilai (Enum)

### User Roles

| Nilai | Deskripsi |
|-------|-----------|
| `USER` | User biasa. Bisa membuat tiket dan chat pada tiket sendiri |
| `STAFF` | IT Staff. Bisa klaim tiket, set pending, resolve tiket |
| `MANAGER` | Manager. Bisa kelola semua tiket, assign staff, tutup tiket, kelola user, set difficulty |

### Ticket Status

| Nilai | Label | Deskripsi |
|-------|-------|-----------|
| `OPEN` | Terbuka | Tiket baru, belum ada staff yang menangani |
| `IN_PROGRESS` | Diproses | Sedang ditangani oleh staff |
| `PENDING` | Tertunda | Menunggu vendor/pihak ketiga |
| `RESOLVED` | Selesai | Staff sudah memberikan solusi |
| `CLOSED` | Ditutup | Tiket selesai dan ditutup oleh manager |

### Difficulty Level

| Nilai | Label | Poin |
|-------|-------|------|
| `1` | Mudah | 10 poin |
| `2` | Sedang | 20 poin |
| `3` | Sulit | 30 poin |

> Hanya **Manager** yang bisa mengatur difficulty. Poin diberikan otomatis ke staff saat tiket ditutup.

### Kategori Tiket

| Nama | Deskripsi |
|------|-----------|
| `Account` | Masalah terkait akun, login, hak akses |
| `Hardware` | Masalah perangkat keras (printer, PC, monitor, dll) |
| `Network` | Masalah jaringan, internet, WiFi, VPN |
| `Software` | Masalah aplikasi, sistem operasi, update |
| `Other` | Masalah lain yang tidak termasuk kategori di atas |

> Untuk mendapatkan `category_id`, panggil `GET /api/v1/categories` terlebih dahulu.

## Health Check

```
GET /api/v1
```

**Response:**
```json
{
  "error": false,
  "message": "IT Helpdesk REST API v1 is running"
}
```
