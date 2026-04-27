# API Endpoints

Semua endpoint menggunakan prefix `/api/v1`.

---

## 1. Auth

### POST `/api/v1/auth/login`

Login ke sistem.

**Request Body:**
```json
{
  "email": "admin@helpdesk.local",
  "password": "admin123"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `email` | string | Ya | Email terdaftar |
| `password` | string | Ya | Password akun |

**Success (200):**
```json
{
  "error": false,
  "data": {
    "id": "a4f54394-bd7d-44e6-a9fd-749fb9928204",
    "name": "Super Admin",
    "email": "admin@helpdesk.local",
    "phone": null,
    "role": "MANAGER",
    "is_active": true,
    "created_at": "2026-04-21T15:07:10.123Z"
  }
}
```

> **Simpan `id` dan `role`** dari response ini untuk digunakan di endpoint lain.

**Error (401):** `{ "error": true, "message": "Email atau password salah" }`

**Error (403):** `{ "error": true, "message": "Akun Anda telah dinonaktifkan. Hubungi administrator." }`

---

### POST `/api/v1/auth/register`

Daftar akun baru (otomatis role `USER`).

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@perusahaan.com",
  "phone": "08123456789",
  "password": "password123"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `name` | string | Ya | 2-100 karakter |
| `email` | string | Ya | Email valid, harus unik |
| `phone` | string | Tidak | Nomor WhatsApp |
| `password` | string | Ya | 6-100 karakter |

**Success (201):** Data user yang baru dibuat.

**Error (409):** `{ "error": true, "message": "Email sudah terdaftar" }`

---

## 2. Categories

### GET `/api/v1/categories`

List semua kategori. **Panggil ini dulu** sebelum membuat tiket.

**Success (200):**
```json
{
  "error": false,
  "data": [
    { "id": "0fa69525-...", "name": "Account", "description": "Support for Account issues" },
    { "id": "0e405668-...", "name": "Hardware", "description": "Support for Hardware issues" },
    { "id": "d90bc26c-...", "name": "Network", "description": "Support for Network issues" },
    { "id": "1f2c57cd-...", "name": "Other", "description": "Support for Other issues" },
    { "id": "d55ed9fd-...", "name": "Software", "description": "Support for Software issues" }
  ]
}
```

> Gunakan `id` dari sini sebagai `category_id` saat membuat tiket.

---

## 3. Tickets

### GET `/api/v1/tickets`

List tiket dengan filter opsional.

**Query Parameters:**

| Param | Tipe | Contoh | Keterangan |
|-------|------|--------|------------|
| `status` | string | `OPEN` | `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED` |
| `category_id` | UUID | `0e405668-...` | Dari `GET /categories` |
| `user_id` | UUID | | Tiket milik user tertentu |
| `staff_id` | UUID | | Tiket yang ditangani staff tertentu |
| `search` | string | `printer` | Cari di judul, kode, deskripsi |
| `limit` | number | `10` | Pagination: jumlah per halaman |
| `offset` | number | `0` | Pagination: mulai dari data ke-berapa |

**Contoh:**
```
GET /api/v1/tickets?status=OPEN&limit=10&offset=0
GET /api/v1/tickets?search=printer
```

**Pagination:**
```
Halaman 1: ?limit=10&offset=0
Halaman 2: ?limit=10&offset=10
Halaman 3: ?limit=10&offset=20
```

**Success (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "753b236a-...",
      "code": "TKT-MO9FSJTF-EUYE",
      "title": "Printer lantai 2 error",
      "status": "OPEN",
      "difficulty_level": 1,
      "category": { "id": "...", "name": "Hardware" },
      "user": { "id": "...", "name": "dicky", "role": "USER" },
      "staff": null
    }
  ]
}
```

---

### GET `/api/v1/tickets/:id`

Detail tiket + attachments.

**Success (200):** Sama seperti list, ditambah field `attachments` (array) dan `resolution_note`, `pending_reason`.

**Error (404):** `{ "error": true, "message": "Tiket tidak ditemukan" }`

---

### POST `/api/v1/tickets`

Buat tiket baru.

**Request Body:**
```json
{
  "title": "Printer lantai 2 error",
  "description": "Printer HP LaserJet error code E-05. Sudah coba restart tapi tetap error.",
  "category_id": "0e405668-b47e-4fcc-aa1a-373892dcd6ef",
  "user_id": "728db994-ee5e-4792-a735-e263ae019e36"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `title` | string | Ya | 5-200 karakter |
| `description` | string | Ya | 10-5000 karakter |
| `category_id` | UUID | Ya | Dari `GET /api/v1/categories` |
| `user_id` | UUID | Ya | Dari response login |

**Success (201):** Data tiket baru (status: `OPEN`).

---

### POST `/api/v1/tickets/:id/claim`

Staff klaim tiket OPEN. Status → `IN_PROGRESS`.

**Request Body:**
```json
{ "staff_id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2" }
```

**Error (409):** `{ "error": true, "message": "Tiket sudah diklaim oleh staff lain" }`

**Error (400):** `{ "error": true, "message": "Hanya tiket OPEN yang dapat diklaim" }`

---

### POST `/api/v1/tickets/:id/unclaim`

Staff lepas tiket. Status → `OPEN`.

**Request Body:**
```json
{
  "staff_id": "a82f29aa-...",
  "unclaim_reason": "Saya tidak memiliki keahlian untuk masalah ini"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `staff_id` | UUID | Ya | Harus staff yang sedang menangani |
| `unclaim_reason` | string | Ya | 5-2000 karakter |

---

### POST `/api/v1/tickets/:id/assign`

Manager assign staff ke tiket.

**Request Body:**
```json
{ "staff_id": "a82f29aa-..." }
```

> Ambil `staff_id` dari `GET /api/v1/tickets/staff-list`.

---

### PATCH `/api/v1/tickets/:id/status`

Manager ubah status tiket.

**Request Body:**
```json
{ "status": "CLOSED" }
```

| Field | Tipe | Wajib | Nilai yang Diizinkan |
|-------|------|-------|---------------------|
| `status` | string | Ya | Tergantung status saat ini (lihat halaman Flow) |

> Saat status → `CLOSED`, poin otomatis diberikan ke staff.

---

### PATCH `/api/v1/tickets/:id/pending`

Staff set tiket ke PENDING. Hanya dari `IN_PROGRESS`.

**Request Body:**
```json
{
  "staff_id": "a82f29aa-...",
  "pending_reason": "Menunggu sparepart dari vendor, estimasi 3 hari"
}
```

> **Setelah pending:** Tiket harus dikembalikan ke `IN_PROGRESS` oleh Manager sebelum bisa di-resolve.

---

### PATCH `/api/v1/tickets/:id/resolve`

Staff resolve tiket. **Hanya dari `IN_PROGRESS`** (bukan dari PENDING).

**Request Body:**
```json
{
  "staff_id": "a82f29aa-...",
  "resolution_note": "Printer sudah diganti cartridge baru. Gunakan kertas A4 70gsm."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `staff_id` | UUID | Ya | Harus staff yang ditugaskan |
| `resolution_note` | string | Ya | 10-5000 karakter |

---

### PATCH `/api/v1/tickets/:id/difficulty`

**Manager only.** Set tingkat kesulitan tiket.

**Request Body:**
```json
{ "difficulty_level": 2 }
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `difficulty_level` | number | Ya | `1` (Mudah/10poin), `2` (Sedang/20poin), `3` (Sulit/30poin) |

---

### GET `/api/v1/tickets/staff-list`

List staff aktif untuk dropdown assign.

**Success (200):**
```json
{
  "error": false,
  "data": [
    { "id": "a82f29aa-...", "name": "IT Support Staff", "email": "staff@helpdesk.local", "role": "STAFF" },
    { "id": "a4f54394-...", "name": "Super Admin", "email": "admin@helpdesk.local", "role": "MANAGER" }
  ]
}
```

---

## 4. Chat

### GET `/api/v1/chat/:ticketId`

Ambil semua pesan chat pada tiket.

**Success (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "uuid-msg",
      "message": "Halo, printer saya error",
      "sender_id": "728db994-...",
      "sender_name": "dicky",
      "sender_role": "USER",
      "created_at": "2026-04-22T08:35:00.000Z"
    }
  ]
}
```

---

### POST `/api/v1/chat/:ticketId`

Kirim pesan chat.

**Request Body:**
```json
{
  "sender_id": "a82f29aa-...",
  "message": "Baik, saya akan cek printer tersebut."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `sender_id` | UUID | Ya | Dari response login |
| `message` | string | Ya | 1-2000 karakter |

---

## 5. Users (Manager)

### GET `/api/v1/users`

List semua user + statistik.

**Success (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "728db994-...",
      "name": "dicky",
      "email": "dicky@local.com",
      "role": "USER",
      "is_active": true,
      "tickets_created": 3,
      "tickets_handled": 0
    }
  ]
}
```

---

### GET `/api/v1/users/:id`

Detail satu user.

---

### POST `/api/v1/users`

Manager buat user baru.

**Request Body:**
```json
{
  "name": "Staff IT Baru",
  "email": "staff.baru@perusahaan.com",
  "phone": "08999888777",
  "password": "password123",
  "role": "STAFF"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `name` | string | Ya | 2-100 karakter |
| `email` | string | Ya | Harus unik |
| `phone` | string | Tidak | Nomor WhatsApp |
| `password` | string | Ya | 6-100 karakter |
| `role` | string | Ya | `USER` atau `STAFF` |

---

### PUT `/api/v1/users/:id`

Update user.

**Request Body:**
```json
{
  "name": "Nama Baru",
  "email": "email.baru@perusahaan.com",
  "phone": "08111222333",
  "role": "STAFF"
}
```

---

### PATCH `/api/v1/users/:id/toggle-active`

Toggle aktif/nonaktif. Tidak perlu request body.

**Success (200):**
```json
{
  "error": false,
  "data": { "id": "...", "name": "dicky", "is_active": false }
}
```

> Saat dinonaktifkan, semua sesi login user otomatis dihapus.

---

## 6. Leaderboard

### GET `/api/v1/leaderboard`

Ranking staff berdasarkan poin.

**Query Parameters:**

| Param | Default | Keterangan |
|-------|---------|------------|
| `view` | `monthly` | `monthly` atau `yearly` |
| `month` | bulan ini | 1-12 (hanya untuk monthly) |
| `year` | tahun ini | e.g. 2026 |

**Contoh:** `GET /api/v1/leaderboard?view=monthly&month=4&year=2026`

**Success (200):**
```json
{
  "error": false,
  "data": [
    { "staff_id": "...", "staff_name": "IT Support Staff", "total_points": 50, "tickets_closed": 3 }
  ]
}
```

---

### GET `/api/v1/leaderboard/periods`

Periode yang memiliki data.

**Success (200):**
```json
{
  "error": false,
  "data": [
    { "period_month": 4, "period_year": 2026 }
  ]
}
```

---

### GET `/api/v1/leaderboard/:staffId`

Detail stats staff + riwayat poin.

**Query Parameters:** Sama seperti ranking.

**Success (200):**
```json
{
  "error": false,
  "data": {
    "name": "IT Support Staff",
    "total_points": 50,
    "tickets_closed": 3,
    "avg_difficulty": "1.7",
    "logs": [
      { "points": 20, "ticket": { "code": "TKT-XXX", "title": "...", "difficulty_level": 2 } }
    ]
  }
}
```

---

## 7. Profile

### GET `/api/v1/profile/:userId`

Ambil profil user.

---

### PUT `/api/v1/profile/:userId`

Update profil.

**Request Body:**
```json
{
  "name": "Dicky Updated",
  "email": "dicky.new@local.com",
  "phone": "08999888777"
}
```

---

### PUT `/api/v1/profile/:userId/password`

Ganti password.

**Request Body:**
```json
{
  "current_password": "password123",
  "new_password": "passwordbaru456"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `current_password` | string | Ya | Password saat ini |
| `new_password` | string | Ya | 6-100 karakter |

**Success (200):** `{ "error": false, "message": "Password berhasil diubah" }`

**Error (400):** `{ "error": true, "message": "Password saat ini salah" }`
