# SYSTEM_MAP -- Navigasi Arsitektur Proyek

> Dokumen ini adalah peta navigasi utama untuk memahami seluruh arsitektur sistem IT Helpdesk & WhatsApp Gateway. Dirancang sebagai referensi persiapan migrasi (one-shot).

---

## Project Summary

**Tujuan**: Sistem manajemen tiket IT Helpdesk dengan notifikasi WhatsApp otomatis, live chat per tiket, dan leaderboard gamifikasi untuk staff.

**User Roles**:
| Role | Deskripsi |
|------|-----------|
| **USER** | Membuat tiket, melihat tiket sendiri, chat pada tiket sendiri |
| **STAFF** | Klaim/tangani tiket, set pending/resolve, chat pada tiket yang ditangani |
| **MANAGER** | Kelola semua tiket, assign staff, tutup tiket, kelola WhatsApp Gateway & template |

**Tech Stack**:
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js (App Router, monolith) | 16.2.4 |
| Runtime | React (Server + Client Components) | 19.2.4 |
| Bahasa | TypeScript | ^5 |
| Database | PostgreSQL via Prisma ORM + PrismaPg adapter | Prisma 7.7.0 |
| Styling | Tailwind CSS | v4 |
| Icons | Lucide React | ^1.8.0 |
| WhatsApp | @whiskeysockets/baileys (multi-device) | ^7.0.0-rc.9 |
| Real-time | Server-Sent Events (SSE), in-memory pub/sub | - |
| Validasi | Zod | ^4.3.6 |
| Auth | Custom session-based (bcryptjs + httpOnly cookie) | - |

**Pola Arsitektur**: **App Router** (Next.js 16). Tidak menggunakan Pages Router. Semua data mutation melalui **Server Actions** (bukan REST API). Tiga API Route hanya untuk SSE streaming dan file serving.

---

## Core Logic Flow (High-Level)

### Login
```
Form Login (client) -> loginAction -> loginSchema (Zod) -> rateLimiter.check
  -> prisma.user.findUnique(email) -> bcrypt.compare -> createSession(cookie)
  -> redirect('/dashboard')
```

### Registrasi
```
Form Register (client) -> registerAction -> registerSchema (Zod) -> rateLimiter.check
  -> cek email duplikat -> bcrypt.hash -> prisma.user.create(role: USER)
  -> createSession -> redirect('/dashboard')
```

### Buat Tiket (USER)
```
Form Create Ticket (client) -> createTicketAction [USER only]
  -> createTicketSchema (Zod) -> prisma.ticket.create(status: OPEN)
  -> saveAttachments(files → disk + DB) -> sendTicketNotification('ticket_created')
  -> redirect('/dashboard/tickets/{id}')
```

### Klaim Tiket (STAFF)
```
Tombol Klaim (client) -> claimTicketAction [STAFF/MANAGER]
  -> prisma.$transaction(SELECT FOR UPDATE → cek OPEN & belum diklaim)
  -> update(staff_id, status: IN_PROGRESS)
  -> sendTicketNotification('ticket_in_progress')
```

### Assign Staff (MANAGER)
```
Form Assign (client) -> assignTicketAction [MANAGER only]
  -> prisma.ticket.update(staff_id) -> sendTicketNotification('ticket_assigned')
```

### Resolve Tiket (STAFF)
```
Form Resolve (client) -> resolveTicketAction [STAFF only, tiket sendiri]
  -> resolveTicketSchema (Zod, resolution_note wajib)
  -> prisma.ticket.update(status: RESOLVED) -> saveAttachments
  -> sendTicketNotification('ticket_resolved')
```

### Tutup Tiket (MANAGER)
```
Tombol Ditutup (client) -> updateTicketStatusAction [MANAGER only]
  -> state machine check -> prisma.ticket.update(status: CLOSED)
  -> prisma.leaderboardLog.create(points = 10 * difficulty)
  -> sendTicketNotification('ticket_closed')
```

### Kirim Chat
```
Form Chat (client) -> sendMessageAction [login + akses tiket]
  -> simpan pesan + attachment ke DB -> chatEmitter.emit(ticketId, msg)
  -> SSE broadcast ke semua listener tiket tersebut
```

### Notifikasi WhatsApp (Pasif/Otomatis)
```
Ticket Action (server) -> sendTicketNotification(eventType, ticketId)
  -> cek WA enabled & connected -> ambil template dari DB
  -> substituteVariables([nama-user], [id-ticket], dll)
  -> getNotificationRecipients(eventType) -> waService.sendMessage(phone, message)
```

### Alur WhatsApp Connect
```
Tombol Hubungkan (client) -> connectWAAction [MANAGER]
  -> waService.connect() -> fetchLatestBaileysVersion -> useMultiFileAuthState(.wa-auth/)
  -> makeWASocket -> emit QR via SSE -> scan QR -> status: connected
  -> sesi tersimpan di .wa-auth/ (persist across restart)
```

---

## Routing & Module Map

### Halaman Publik

| Path | File | Tipe | Peran |
|------|------|------|-------|
| `/` | `app/page.tsx` | Server | Landing page, redirect ke dashboard jika sudah login |
| `/login` | `app/login/page.tsx` | Client | Form login dengan rate limiting |
| `/register` | `app/register/page.tsx` | Client | Form registrasi user baru (role: USER) |

### Dashboard (Protected)

| Path | File | Tipe | Logic | Peran |
|------|------|------|-------|-------|
| `/dashboard` | `app/dashboard/page.tsx` | Server | `getSession()` | Hub navigasi utama, card menu role-based |
| `/dashboard/tickets` | `app/dashboard/tickets/page.tsx` | Server | `getTickets()`, `getCategories()` | List tiket dengan filter status/kategori/search |
| `/dashboard/tickets/create` | `app/dashboard/tickets/create/page.tsx` + `create-ticket-form.tsx` | Server + Client | `createTicketAction` | Form buat tiket baru + upload attachment (USER only) |
| `/dashboard/tickets/[id]` | `app/dashboard/tickets/[id]/page.tsx` + `ticket-actions.tsx` | Server + Client | `getTicketById()`, `getStaffList()`, semua ticket actions | Detail tiket, action buttons role-based, floating chat |
| `/dashboard/leaderboard` | `app/dashboard/leaderboard/page.tsx` + `period-filter.tsx` | Server + Client | `getLeaderboard()`, `getStaffStats()` | Peringkat staff bulanan/tahunan (STAFF/MANAGER only) |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` + `profile-form.tsx` | Server + Client | `getProfile()`, `updateProfileAction`, `changePasswordAction` | Edit profil & ganti password (semua role) |
| `/dashboard/admin/whatsapp` | `app/dashboard/admin/whatsapp/page.tsx` + 3 client components | Server + Client | WA actions, template CRUD | Konfigurasi WhatsApp Gateway (MANAGER only) |

### API Routes

| Path | Method | Auth | Peran (setara Controller di Laravel) |
|------|--------|------|------|
| `/api/chat/[ticketId]/sse` | GET | Login required | SSE stream pesan chat real-time per tiket |
| `/api/uploads/[...path]` | GET | Login required | File serving attachment (streaming, path-traversal protected) |
| `/api/whatsapp/sse` | GET | MANAGER only | SSE stream status koneksi WA & QR code |

### Shared UI

| Path | Tipe | Peran |
|------|------|-------|
| `app/dashboard/loading.tsx` | Server | Skeleton loader untuk semua route /dashboard/* |
| `app/dashboard/error.tsx` | Client | Error boundary dengan tombol retry |
| `app/not-found.tsx` | Server | Custom halaman 404 |

---

## Server Actions Map (setara Controller Methods di Laravel)

### Auth (`lib/actions/auth.ts`)
| Action | Auth | Setara Laravel |
|--------|------|----------------|
| `loginAction` | Public | `AuthController@login` |
| `registerAction` | Public | `AuthController@register` |
| `logoutAction` | Any | `AuthController@logout` |

### Tickets (`lib/actions/tickets.ts`)
| Action | Auth | Setara Laravel |
|--------|------|----------------|
| `createTicketAction` | USER | `TicketController@store` |
| `claimTicketAction` | STAFF/MANAGER | `TicketController@claim` |
| `updateTicketStatusAction` | MANAGER | `TicketController@updateStatus` |
| `pendingTicketAction` | STAFF (own) | `TicketController@pending` |
| `resolveTicketAction` | STAFF (own) | `TicketController@resolve` |
| `setDifficultyAction` | STAFF (own)/MANAGER | `TicketController@setDifficulty` |
| `assignTicketAction` | MANAGER | `TicketController@assign` |
| `getCategories` | - | `CategoryController@index` |
| `getTickets` | - | `TicketController@index` |
| `getTicketById` | - | `TicketController@show` |
| `getStaffList` | - | `UserController@staffList` |

### Chat (`lib/actions/chat.ts`)
| Action | Auth | Setara Laravel |
|--------|------|----------------|
| `sendMessageAction` | Login + akses tiket | `ChatController@store` |
| `sendVoiceNoteAction` | Login + akses tiket | `ChatController@storeVoice` |
| `getChatMessages` | Login | `ChatController@index` |

### WhatsApp (`lib/actions/whatsapp.ts`)
| Action | Auth | Setara Laravel |
|--------|------|----------------|
| `connectWAAction` | MANAGER | `WhatsAppController@connect` |
| `disconnectWAAction` | MANAGER | `WhatsAppController@disconnect` |
| `logoutWAAction` | MANAGER | `WhatsAppController@logout` |
| `toggleWANotifications` | MANAGER | `WhatsAppController@toggleNotif` |
| `upsertTemplate` | MANAGER | `TemplateController@upsert` |
| `deleteTemplate` | MANAGER | `TemplateController@destroy` |
| `sendTestMessageAction` | MANAGER | `WhatsAppController@testMessage` |
| `sendTicketNotification` | Internal | `NotificationService@send` |

### Leaderboard (`lib/actions/leaderboard.ts`)
| Action | Auth | Setara Laravel |
|--------|------|----------------|
| `getLeaderboard` | - | `LeaderboardController@index` |
| `getStaffStats` | - | `LeaderboardController@show` |
| `getAvailablePeriods` | - | `LeaderboardController@periods` |

### Profile (`lib/actions/profile.ts`)
| Action | Auth | Setara Laravel |
|--------|------|----------------|
| `getProfile` | Login | `ProfileController@show` |
| `updateProfileAction` | Login | `ProfileController@update` |
| `changePasswordAction` | Login | `ProfileController@changePassword` |

---

## Data Schema & State

### Lokasi Schema
- **Prisma Schema**: `prisma/schema.prisma`
- **Migrasi**: `prisma/migrations/`
- **Seed**: `prisma/seed.mjs`
- **Config**: `prisma.config.ts`

### Entity Utama & Relasi
```
User 1──N Ticket (sebagai pembuat, "UserTickets")
User 1──N Ticket (sebagai staff handler, "StaffTickets")
User 1──N Chat (sebagai pengirim)
User 1──N LeaderboardLog (sebagai staff penerima poin)
User 1──N Session (sesi login aktif)
Category 1──N Ticket
Ticket 1──N Chat
Ticket 1──N TicketAttachment (cascade delete)
Ticket 1──N LeaderboardLog
WA_Setting (standalone, 1 row)
Notification_Template (standalone, 1 row per event_type)
```

### Ticket State Machine
```
OPEN ──────> IN_PROGRESS ──────> PENDING
  |               |                  |
  |               v                  v
  |          RESOLVED ──────> IN_PROGRESS
  |               |
  v               v
CLOSED <──── RESOLVED
```
- **STAFF**: IN_PROGRESS → PENDING, IN_PROGRESS/PENDING → RESOLVED
- **MANAGER**: Semua transisi sesuai diagram di atas

### Scoring
```
Poin = 10 × difficulty_level (1/2/3)
Diberikan saat MANAGER menutup tiket (CLOSED)
Disimpan di LeaderboardLog dengan period_month & period_year
```

### Global State
- **Tidak ada Redux/Zustand/global store**
- **React Context**: Hanya `ThemeContext` untuk dark/light mode (`components/ui/theme-provider.tsx`)
- **Form state**: `useActionState` (React 19) terikat ke Server Actions
- **Real-time state**: SSE → `useState` lokal di komponen
- **Singleton di `globalThis`**: `prisma`, `chatEmitter`, `waService` (persist across hot reload)

---

## Lib Layer (setara Service/Helper di Laravel)

| File | Setara Laravel | Fungsi |
|------|----------------|--------|
| `lib/auth.ts` | `AuthService` / Guard | Session CRUD, password hash/verify, cookie management |
| `lib/db.ts` | `DatabaseServiceProvider` | Prisma client singleton dengan connection pooling |
| `lib/validations.ts` | `FormRequest` classes | Semua Zod schema untuk validasi input |
| `lib/rate-limit.ts` | `RateLimiter` middleware | In-memory sliding window rate limiter |
| `lib/chat-emitter.ts` | `BroadcastService` | Pub/sub in-memory untuk SSE chat broadcasting |
| `lib/whatsapp-singleton.ts` | `WhatsAppService` | Baileys client singleton: connect, send, reconnect |
| `lib/constants.ts` | `config/constants.php` | Enum event types untuk notifikasi |

---

## External Integrations

| Service | Lokasi | Fungsi |
|---------|--------|--------|
| **PostgreSQL** | `lib/db.ts` | Database utama via Prisma + PrismaPg adapter |
| **WhatsApp Web** | `lib/whatsapp-singleton.ts` | Notifikasi otomatis via Baileys (multi-device protocol) |
| **api.qrserver.com** | `admin/whatsapp/wa-connection.tsx` | Render QR code WhatsApp sebagai gambar (third-party) |

**Tidak ada**: Payment gateway, email service, external auth (Clerk/NextAuth), analytics, CDN.

**File storage**: Lokal di `public/uploads/`, disajikan via `/api/uploads/[...path]` (authenticated).

---

## Risks / Blind Spots

### Arsitektur
- **Monolith coupling**: WhatsApp singleton berjalan dalam proses Next.js yang sama. Jika proses crash, koneksi WA terputus. Tidak ada worker/queue terpisah.
- **In-memory state**: `chatEmitter` dan `rateLimiter` hilang saat restart. Pada deployment serverless (Vercel), SSE dan rate limiting tidak akan berfungsi. Harus deploy sebagai long-running server (VPS/Docker).
- **Auto-connect side effect**: Import `whatsapp-singleton.ts` langsung trigger koneksi WA jika ada sesi tersimpan. Ini bisa terjadi saat build atau test.

### Keamanan
- **QR code ke third-party**: QR data WhatsApp dikirim ke `api.qrserver.com` untuk rendering. Ini adalah kredensial login WA yang dikirim ke server eksternal.
- **Read-only actions tanpa auth**: `getTickets`, `getCategories`, `getStaffList`, `getLeaderboard` tidak memiliki auth check di level action (hanya di level page). Bisa dipanggil langsung via client jika tahu function reference.
- **Session table bloat**: Expired sessions dibersihkan hanya saat login (piggyback). Tidak ada cron job dedicated.

### UI / Client Components
- **`'use client'` pada form components**: Setiap halaman yang memiliki form interaktif menggunakan client component terpisah. Pola ini benar (server page + client form), tapi ada 10+ client components yang masing-masing menduplikasi pola `useActionState`.
- **Nav bar duplikasi**: Navbar di-copy-paste di 7+ halaman server component (bukan shared layout). Perubahan nav harus dilakukan di semua file.
- **Floating chat (738 baris)**: Komponen terbesar, menangani SSE, voice recording, file upload, animasi. Kandidat untuk dipecah jika migrasi.

### Database
- **Tidak ada soft delete**: Tiket dan chat dihapus permanen. Tidak ada `deleted_at`.
- **File di disk**: Attachment disimpan di filesystem lokal (`public/uploads/`), bukan object storage. Tidak scalable untuk multi-server.
- **Tidak ada pagination**: `getTickets()` dan `getChatMessages()` mengembalikan semua data tanpa limit/offset.

### Migrasi ke Laravel
- **Server Actions → Controllers**: Setiap file di `lib/actions/` menjadi 1 Controller. Mapping sudah didokumentasikan di tabel di atas.
- **Zod → FormRequest**: Setiap schema di `validations.ts` menjadi 1 FormRequest class.
- **SSE → Laravel Broadcasting**: `chatEmitter` dan WA SSE perlu diganti dengan Pusher/Soketi/Laravel Reverb.
- **Baileys → tetap Node.js**: Library Baileys hanya tersedia di Node.js. Opsi: jalankan sebagai microservice terpisah yang berkomunikasi dengan Laravel via API/queue.
- **Prisma → Eloquent**: Schema sudah terdokumentasi, mapping langsung ke Eloquent models + migrations.
