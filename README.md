# Sistem IT Helpdesk & WhatsApp Gateway

Sistem manajemen IT Helpdesk terintegrasi dengan WhatsApp Gateway untuk notifikasi otomatis. Dibangun dengan Next.js (App Router), PostgreSQL, Prisma ORM, dan Baileys.

## Fitur Utama

- **Manajemen Tiket** -- Buat, klaim, assign, resolve, dan tutup tiket dengan workflow status lengkap
- **Role-Based Access** -- 3 role: User (buat tiket), Staff (tangani tiket), Manager (kelola semua)
- **Live Chat** -- Chat real-time per tiket menggunakan Server-Sent Events (SSE)
- **Leaderboard Gamifikasi** -- Peringkat staff berdasarkan poin penyelesaian tiket (bulanan/tahunan)
- **WhatsApp Gateway** -- Notifikasi otomatis ke WhatsApp untuk setiap perubahan status tiket
- **Template Notifikasi** -- Template pesan dinamis dengan variabel substitusi
- **Upload Attachment** -- Gambar dan video pada tiket dan chat
- **Profil & Keamanan** -- Edit profil, ganti password
- **Tema Glassmorphism** -- UI modern dengan dark/light mode

## Prasyarat

Pastikan sudah terinstall:

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** database (bisa pakai [Supabase](https://supabase.com), [Neon](https://neon.tech), atau lokal)

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/dickyprase/it-helpdesk-nextjs.git
cd it-helpdesk-nextjs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Buat file `.env` di root project:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Ganti `USER`, `PASSWORD`, `HOST`, `PORT`, dan `DATABASE` sesuai konfigurasi PostgreSQL Anda.

### 4. Setup database

Jalankan migrasi dan generate Prisma client:

```bash
npx prisma db push
npx prisma generate
```

### 5. Seed data awal

Seed akan membuat kategori, user admin/staff, template notifikasi WA, dan pengaturan WA:

```bash
node --env-file=.env prisma/seed.mjs
```

Akun default yang dibuat:

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Manager | admin@helpdesk.local   | admin123   |
| Staff   | staff@helpdesk.local   | staff123   |

### 6. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Menjalankan di Production

```bash
npm run build
npm start
```

## Konfigurasi WhatsApp Gateway

1. Login sebagai **Manager**
2. Buka menu **WhatsApp Gateway** di dashboard
3. Klik **Hubungkan** -- QR code akan muncul
4. Scan QR code dengan WhatsApp di HP (Menu > Perangkat Tertaut > Tautkan Perangkat)
5. Setelah terhubung, aktifkan toggle **Notifikasi**
6. Kelola template pesan di bagian **Template Notifikasi**
7. Gunakan **Test Pesan WhatsApp** untuk memverifikasi koneksi

Sesi WhatsApp tersimpan di folder `.wa-auth/`. Saat aplikasi di-restart, koneksi otomatis terhubung kembali tanpa perlu scan QR ulang.

- **Putuskan** -- Memutus koneksi tapi sesi tetap tersimpan
- **Logout WA** -- Menghapus sesi, perlu scan QR baru

---

## ERD (Entity Relationship Diagram)

### Diagram Mermaid

```mermaid
erDiagram
    User ||--o{ Ticket : "creates"
    User ||--o{ Ticket : "handles"
    User ||--o{ Chat : "sends"
    User ||--o{ LeaderboardLog : "earns"
    User ||--o{ Session : "has"
    Category ||--o{ Ticket : "classifies"
    Ticket ||--o{ Chat : "has"
    Ticket ||--o{ TicketAttachment : "has"
    Ticket ||--o{ LeaderboardLog : "generates"

    User {
        uuid id PK
        string name
        string email UK
        string phone
        string password_hash
        enum role "USER | STAFF | MANAGER"
        datetime created_at
        datetime updated_at
    }

    Session {
        string id PK
        uuid user_id FK
        datetime expires_at
    }

    Category {
        uuid id PK
        string name UK
        string description
    }

    Ticket {
        uuid id PK
        string code UK
        string title
        string description
        enum status "OPEN | IN_PROGRESS | PENDING | RESOLVED | CLOSED"
        int difficulty_level "1-3"
        text resolution_note
        text pending_reason
        uuid category_id FK
        uuid user_id FK
        uuid staff_id FK
        datetime created_at
        datetime updated_at
    }

    TicketAttachment {
        uuid id PK
        string filename
        string filepath
        string filetype
        int filesize
        uuid ticket_id FK
        string uploaded_by
        datetime created_at
    }

    Chat {
        uuid id PK
        string message
        string attachment_url
        string attachment_type
        boolean is_voice_note
        uuid ticket_id FK
        uuid sender_id FK
        datetime created_at
    }

    LeaderboardLog {
        uuid id PK
        int points
        int period_month
        int period_year
        uuid staff_id FK
        uuid ticket_id FK
        datetime created_at
    }

    WA_Setting {
        uuid id PK
        boolean is_enabled
        text session_data
        string connection_status
        datetime updated_at
    }

    Notification_Template {
        uuid id PK
        string event_type UK
        text template_body
        string variables
        datetime created_at
        datetime updated_at
    }
```

### Tabel Database

#### User

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| name | String | NOT NULL | |
| email | String | UNIQUE, NOT NULL | |
| phone | String | nullable | Nomor WhatsApp |
| password_hash | String | NOT NULL | bcrypt hash |
| role | Enum | NOT NULL, default USER | USER, STAFF, MANAGER |
| created_at | DateTime | default now() | |
| updated_at | DateTime | auto | |

#### Session

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | String | PK | crypto.randomBytes(32) |
| user_id | UUID | FK → User.id, CASCADE | |
| expires_at | DateTime | NOT NULL | Index |

#### Category

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| name | String | UNIQUE, NOT NULL | |
| description | String | nullable | |

#### Ticket

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| code | String | UNIQUE, NOT NULL | e.g. TKT-MO9G0B44-LVE6 |
| title | String | NOT NULL | |
| description | String | NOT NULL | |
| status | Enum | NOT NULL, default OPEN | OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED |
| difficulty_level | Int | NOT NULL, default 1 | 1 (Mudah), 2 (Sedang), 3 (Sulit) |
| resolution_note | Text | nullable | Arahan/solusi dari staff |
| pending_reason | Text | nullable | Alasan pending |
| category_id | UUID | FK → Category.id | Index |
| user_id | UUID | FK → User.id | Index (pembuat tiket) |
| staff_id | UUID | FK → User.id, nullable | Index (staff yang menangani) |
| created_at | DateTime | default now() | Index |
| updated_at | DateTime | auto | |

#### TicketAttachment

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| filename | String | NOT NULL | Nama file asli |
| filepath | String | NOT NULL | Path relatif untuk serving |
| filetype | String | NOT NULL | MIME type |
| filesize | Int | NOT NULL | Bytes |
| ticket_id | UUID | FK → Ticket.id, CASCADE | Index |
| uploaded_by | String | NOT NULL | User ID uploader |
| created_at | DateTime | default now() | |

#### Chat

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| message | String | NOT NULL | |
| attachment_url | String | nullable | Path file attachment |
| attachment_type | String | nullable | MIME type |
| is_voice_note | Boolean | default false | |
| ticket_id | UUID | FK → Ticket.id | Composite index (ticket_id, created_at) |
| sender_id | UUID | FK → User.id | Index |
| created_at | DateTime | default now() | |

#### LeaderboardLog

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| points | Int | NOT NULL | 10 * difficulty_level |
| period_month | Int | NOT NULL | 1-12 |
| period_year | Int | NOT NULL | e.g. 2026 |
| staff_id | UUID | FK → User.id | Index |
| ticket_id | UUID | FK → Ticket.id | Index |
| created_at | DateTime | default now() | |

#### WA_Setting

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| is_enabled | Boolean | default false | Toggle notifikasi global |
| session_data | Text | nullable | (reserved) |
| connection_status | String | default "disconnected" | |
| updated_at | DateTime | auto | |

#### Notification_Template

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| id | UUID | PK, default uuid | |
| event_type | String | UNIQUE, NOT NULL | e.g. ticket_created |
| template_body | Text | NOT NULL | Mendukung variabel [nama-user] dll |
| variables | String | NOT NULL | Comma-separated list |
| created_at | DateTime | default now() | |
| updated_at | DateTime | auto | |

---

## API Documentation

> Aplikasi ini menggunakan **Next.js Server Actions** untuk semua operasi data (bukan REST API). Endpoint HTTP di bawah ini adalah satu-satunya route yang dapat di-consume secara langsung.

### Autentikasi

Semua endpoint menggunakan **cookie-based session**. Kirim cookie `helpdesk_session` yang didapat setelah login melalui UI.

### Endpoints

#### `GET /api/uploads/{...path}`

Mengambil file attachment (gambar/video) yang diupload pada tiket atau chat.

| Parameter | Lokasi | Deskripsi |
|-----------|--------|-----------|
| `path` | URL path | Path relatif file, e.g. `/api/uploads/{ticketId}/{filename}` |

**Auth**: Login required (cookie session)

**Response**:
- `200` -- File binary dengan `Content-Type` sesuai ekstensi
- `401` -- Unauthorized
- `404` -- File tidak ditemukan

**Headers Response**:
```
Content-Type: image/png | image/jpeg | video/mp4 | ...
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'
Cache-Control: private, max-age=31536000, immutable
```

---

#### `GET /api/chat/{ticketId}/sse`

Server-Sent Events stream untuk menerima pesan chat real-time pada tiket tertentu.

| Parameter | Lokasi | Deskripsi |
|-----------|--------|-----------|
| `ticketId` | URL path | UUID tiket |

**Auth**: Login required (cookie session)

**Response**: `text/event-stream`

**Format Event**:
```
data: {"id":"uuid","message":"teks","ticket_id":"uuid","sender_id":"uuid","sender_name":"Nama","sender_role":"USER","created_at":"ISO8601","attachment_url":null,"attachment_type":null,"is_voice_note":false}
```

**Keepalive**: Server mengirim `: keepalive\n\n` setiap 30 detik.

---

#### `GET /api/whatsapp/sse`

Server-Sent Events stream untuk memonitor status koneksi WhatsApp dan menerima QR code.

**Auth**: MANAGER only (cookie session)

**Response**: `text/event-stream`

**Format Event**:
```
data: {"type":"status","data":"connected"}
data: {"type":"qr","data":"qr-code-string"}
data: {"type":"message","data":"Pesan sistem"}
```

**Status values**: `disconnected`, `connecting`, `reconnecting`, `qr_ready`, `connected`

---

## Struktur Proyek

```
src/
  app/
    api/
      chat/[ticketId]/sse/   # SSE endpoint untuk live chat
      uploads/[...path]/      # File serving untuk attachment
      whatsapp/sse/           # SSE endpoint untuk status WA
    dashboard/
      admin/whatsapp/         # Halaman konfigurasi WA (Manager)
      leaderboard/            # Halaman leaderboard staff
      profile/                # Halaman profil & ganti password
      tickets/                # Halaman tiket (list, detail, create)
    login/                    # Halaman login
    register/                 # Halaman registrasi
  components/
    chat/                     # Komponen floating chat
    ui/                       # Komponen UI reusable
  lib/
    actions/                  # Server actions (auth, tickets, chat, whatsapp, leaderboard, profile)
    auth.ts                   # Session management
    db.ts                     # Prisma client singleton
    rate-limit.ts             # In-memory rate limiter
    whatsapp-singleton.ts     # Baileys WhatsApp service
    chat-emitter.ts           # SSE event emitter untuk chat
    validations.ts            # Zod validation schemas
    constants.ts              # Konstanta event tiket
prisma/
  schema.prisma               # Database schema
  seed.mjs                    # Seed data
```

## Tech Stack

| Komponen       | Teknologi                          |
|----------------|------------------------------------|
| Framework      | Next.js 16 (App Router)            |
| Bahasa         | TypeScript                         |
| Database       | PostgreSQL + Prisma ORM            |
| Styling        | Tailwind CSS v4                    |
| Icons          | Lucide React                       |
| WhatsApp       | @whiskeysockets/baileys            |
| Real-time      | Server-Sent Events (SSE)           |
| Validasi       | Zod                                |
| Auth           | Custom session-based (bcrypt + cookie) |

## Scripts

| Perintah            | Keterangan                        |
|---------------------|-----------------------------------|
| `npm run dev`       | Jalankan development server       |
| `npm run build`     | Build untuk production            |
| `npm start`         | Jalankan production server        |
| `npm run lint`      | Jalankan ESLint                   |
| `npm run lint:fix`  | Fix ESLint errors otomatis        |
| `npm run format`    | Format kode dengan Prettier       |
