# IT Helpdesk REST API -- Dokumentasi Endpoint

**Base URL:** `http://localhost:3001/api/v1`

**Format Response:**
- Sukses: `{ "error": false, "data": ... }`
- Error: `{ "error": true, "message": "..." }`

---

## Health Check

```
GET /api/v1
```

**Response:**
```json
{ "error": false, "message": "IT Helpdesk REST API v1 is running" }
```

---

## Auth

### Login

```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "admin@helpdesk.local",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "uuid-xxx",
    "name": "Super Admin",
    "email": "admin@helpdesk.local",
    "phone": null,
    "role": "MANAGER",
    "is_active": true,
    "created_at": "2026-04-21T..."
  }
}
```

**Error Response (401):**
```json
{ "error": true, "message": "Email atau password salah" }
```

**Error Response (403):**
```json
{ "error": true, "message": "Akun Anda telah dinonaktifkan" }
```

---

### Register

```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "error": false,
  "data": {
    "id": "uuid-xxx",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "role": "USER",
    "is_active": true,
    "created_at": "2026-04-22T..."
  }
}
```

**Error Response (409):**
```json
{ "error": true, "message": "Email sudah terdaftar" }
```

---

## Users (Manager)

### List Semua User

```
GET /api/v1/users
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "uuid-xxx",
      "name": "Super Admin",
      "email": "admin@helpdesk.local",
      "phone": null,
      "role": "MANAGER",
      "is_active": true,
      "created_at": "2026-04-21T...",
      "tickets_created": 0,
      "tickets_handled": 5
    }
  ]
}
```

### Detail User

```
GET /api/v1/users/:id
```

### Buat User Baru

```
POST /api/v1/users
```

**Request Body:**
```json
{
  "name": "Staff Baru",
  "email": "staff.baru@helpdesk.local",
  "phone": "08111222333",
  "password": "password123",
  "role": "STAFF"
}
```

**Success Response (201):** sama seperti register.

### Update User

```
PUT /api/v1/users/:id
```

**Request Body:**
```json
{
  "name": "Nama Baru",
  "email": "email.baru@helpdesk.local",
  "phone": "08999888777",
  "role": "STAFF"
}
```

### Toggle Aktif/Nonaktif

```
PATCH /api/v1/users/:id/toggle-active
```

**Success Response (200):**
```json
{
  "error": false,
  "data": { "id": "uuid-xxx", "name": "Staff Baru", "email": "...", "is_active": false }
}
```

---

## Categories

### List Kategori

```
GET /api/v1/categories
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    { "id": "uuid-xxx", "name": "Hardware", "description": "Support for Hardware issues" },
    { "id": "uuid-yyy", "name": "Software", "description": "Support for Software issues" }
  ]
}
```

---

## Tickets

### List Tiket

```
GET /api/v1/tickets
```

**Query Parameters (semua opsional):**
| Param | Contoh | Keterangan |
|-------|--------|------------|
| `status` | `OPEN` | Filter status: OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED |
| `category_id` | `uuid-xxx` | Filter kategori |
| `user_id` | `uuid-xxx` | Filter pembuat tiket |
| `staff_id` | `uuid-xxx` | Filter staff yang menangani |
| `search` | `printer` | Cari di judul, kode, deskripsi |
| `limit` | `10` | Batas jumlah data |
| `offset` | `0` | Offset untuk pagination |

**Contoh:** `GET /api/v1/tickets?status=OPEN&limit=10&offset=0`

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "uuid-xxx",
      "code": "TKT-MO9G0B44-LVE6",
      "title": "Printer tidak bisa print",
      "description": "...",
      "status": "OPEN",
      "difficulty_level": 1,
      "resolution_note": null,
      "pending_reason": null,
      "category_id": "uuid-cat",
      "user_id": "uuid-user",
      "staff_id": null,
      "created_at": "2026-04-22T...",
      "updated_at": "2026-04-22T...",
      "category": { "id": "uuid-cat", "name": "Hardware", "description": "..." },
      "user": { "id": "uuid-user", "name": "John", "email": "john@...", "role": "USER" },
      "staff": null
    }
  ]
}
```

### Detail Tiket

```
GET /api/v1/tickets/:id
```

Response sama seperti list, ditambah `attachments` array.

### Buat Tiket

```
POST /api/v1/tickets
```

**Request Body:**
```json
{
  "title": "Printer tidak bisa print",
  "description": "Printer di lantai 2 error code E-05, sudah coba restart tapi tetap tidak bisa.",
  "category_id": "uuid-kategori",
  "user_id": "uuid-user-pembuat"
}
```

### Klaim Tiket (Staff)

```
POST /api/v1/tickets/:id/claim
```

**Request Body:**
```json
{ "staff_id": "uuid-staff" }
```

**Error (409):**
```json
{ "error": true, "message": "Tiket sudah diklaim oleh staff lain" }
```

### Lepas Tiket (Unclaim)

```
POST /api/v1/tickets/:id/unclaim
```

**Request Body:**
```json
{
  "staff_id": "uuid-staff",
  "unclaim_reason": "Saya tidak memiliki keahlian untuk menangani masalah ini"
}
```

### Assign Staff (Manager)

```
POST /api/v1/tickets/:id/assign
```

**Request Body:**
```json
{ "staff_id": "uuid-staff-tujuan" }
```

### Ubah Status (Manager)

```
PATCH /api/v1/tickets/:id/status
```

**Request Body:**
```json
{ "status": "CLOSED" }
```

**State Machine:**
```
OPEN → IN_PROGRESS, CLOSED
IN_PROGRESS → PENDING, RESOLVED, OPEN
PENDING → IN_PROGRESS, RESOLVED
RESOLVED → CLOSED, IN_PROGRESS
CLOSED → (tidak bisa diubah)
```

### Set Pending (Staff)

```
PATCH /api/v1/tickets/:id/pending
```

**Request Body:**
```json
{
  "staff_id": "uuid-staff",
  "pending_reason": "Menunggu sparepart dari vendor"
}
```

### Resolve Tiket (Staff)

```
PATCH /api/v1/tickets/:id/resolve
```

**Request Body:**
```json
{
  "staff_id": "uuid-staff",
  "resolution_note": "Printer sudah diganti cartridge baru dan berfungsi normal. Pastikan gunakan kertas A4 70gsm."
}
```

### Set Difficulty

```
PATCH /api/v1/tickets/:id/difficulty
```

**Request Body:**
```json
{ "difficulty_level": 2 }
```

Level: `1` (Mudah), `2` (Sedang), `3` (Sulit). Poin = 10 × level.

### List Staff (untuk Assign)

```
GET /api/v1/tickets/staff-list
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    { "id": "uuid-xxx", "name": "IT Support Staff", "email": "staff@...", "role": "STAFF" }
  ]
}
```

---

## Chat

### Get Pesan Chat

```
GET /api/v1/chat/:ticketId
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "uuid-msg",
      "message": "Halo, printer saya error",
      "attachment_url": null,
      "attachment_type": null,
      "is_voice_note": false,
      "ticket_id": "uuid-ticket",
      "sender_id": "uuid-user",
      "created_at": "2026-04-22T...",
      "sender_name": "John Doe",
      "sender_role": "USER"
    }
  ]
}
```

### Kirim Pesan

```
POST /api/v1/chat/:ticketId
```

**Request Body:**
```json
{
  "sender_id": "uuid-pengirim",
  "message": "Baik, saya akan cek printer tersebut."
}
```

---

## Leaderboard

### Ranking Staff

```
GET /api/v1/leaderboard
```

**Query Parameters:**
| Param | Default | Keterangan |
|-------|---------|------------|
| `view` | `monthly` | `monthly` atau `yearly` |
| `month` | bulan ini | 1-12 |
| `year` | tahun ini | e.g. 2026 |

**Contoh:** `GET /api/v1/leaderboard?view=monthly&month=4&year=2026`

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "staff_id": "uuid-staff",
      "staff_name": "IT Support Staff",
      "staff_email": "staff@...",
      "total_points": 50,
      "tickets_closed": 3
    }
  ]
}
```

### Detail Stats Staff

```
GET /api/v1/leaderboard/:staffId?view=monthly&month=4&year=2026
```

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "uuid-staff",
    "name": "IT Support Staff",
    "email": "staff@...",
    "total_points": 50,
    "tickets_closed": 3,
    "avg_difficulty": "1.7",
    "logs": [
      {
        "id": "uuid-log",
        "points": 20,
        "created_at": "2026-04-22T...",
        "ticket": { "id": "uuid-ticket", "code": "TKT-XXX", "title": "...", "difficulty_level": 2 }
      }
    ]
  }
}
```

### Periode Tersedia

```
GET /api/v1/leaderboard/periods
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    { "period_month": 4, "period_year": 2026 },
    { "period_month": 3, "period_year": 2026 }
  ]
}
```

---

## Profile

### Get Profil

```
GET /api/v1/profile/:userId
```

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "uuid-xxx",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "role": "USER",
    "is_active": true,
    "created_at": "2026-04-22T..."
  }
}
```

### Update Profil

```
PUT /api/v1/profile/:userId
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.new@example.com",
  "phone": "08999888777"
}
```

### Ganti Password

```
PUT /api/v1/profile/:userId/password
```

**Request Body:**
```json
{
  "current_password": "password123",
  "new_password": "newpassword456"
}
```

**Success Response (200):**
```json
{ "error": false, "message": "Password berhasil diubah" }
```

**Error Response (400):**
```json
{ "error": true, "message": "Password saat ini salah" }
```

---

## Error Codes

| Status | Arti |
|--------|------|
| `200` | Sukses |
| `201` | Data berhasil dibuat |
| `400` | Validasi gagal / request tidak valid |
| `401` | Login gagal (email/password salah) |
| `403` | Akun dinonaktifkan |
| `404` | Data tidak ditemukan |
| `409` | Konflik (email duplikat, tiket sudah diklaim) |
| `500` | Server error |
