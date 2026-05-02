# SYSTEM_MAP — Navigasi Migrasi ke PHP Native Procedural

> Dokumen ini adalah peta navigasi utama untuk migrasi sistem IT Helpdesk dari Next.js ke PHP Native Procedural. Dirancang sebagai referensi one-shot.

---

## 1. Project Summary

**Tujuan**: Sistem manajemen tiket IT Helpdesk dengan notifikasi WhatsApp otomatis, live chat per tiket, dan leaderboard gamifikasi untuk staff.

**User Roles**:
| Role | Deskripsi |
|------|-----------|
| **USER** | Membuat tiket, melihat tiket sendiri, chat pada tiket sendiri |
| **STAFF** | Klaim/tangani tiket, set pending/resolve, chat pada tiket yang ditangani |
| **MANAGER** | Kelola semua tiket, assign staff, tutup tiket, set difficulty, kelola user, validasi poin |

**Tech Stack Asal (Next.js)**:
| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 16.2.4 (App Router) |
| Database | PostgreSQL via Prisma ORM |
| Auth | Custom session-based (bcryptjs + httpOnly cookie) |
| Real-time | Server-Sent Events (SSE) |
| WhatsApp | @whiskeysockets/baileys (Node.js) |
| Validasi | Zod |
| UI | Tailwind CSS v4 + Lucide React |

**Tech Stack Target (PHP Native)**:
| Komponen | Teknologi |
|----------|-----------|
| Bahasa | PHP 8.x (Procedural, tanpa framework) |
| Database | MySQL via `mysqli` procedural |
| Auth | `$_SESSION` + `password_hash()`/`password_verify()` |
| Real-time | AJAX polling setiap 3 detik |
| WhatsApp | REST API Node.js (folder `rest-api/`) dipanggil via cURL |
| Validasi | Manual `if/else` + `mysqli_real_escape_string()` |
| UI | SB Admin template (Bootstrap 5 + DataTables + Chart.js + SweetAlert2) |

**Pola Arsitektur**:
- Asal: App Router (folder-based routing, Server Components + Client Components)
- Target: File-based PHP (1 file = 1 halaman, include header/footer)

---

## 2. Core Logic Flow (High-Level)

### Login
```
Form login (POST) → function.php::login($email, $password)
  → mysqli: SELECT * FROM User WHERE email = ?
  → password_verify() → $_SESSION['user_id'], $_SESSION['role']
  → redirect berdasarkan role
```

### User Buat Tiket
```
Form buat tiket (POST) → function.php::createTicket($title, $desc, $cat_id, $user_id)
  → mysqli: INSERT INTO Ticket (id, code, title, description, category_id, user_id, status='OPEN')
  → redirect ke halaman antrian
```

### Staff Klaim Tiket
```
Tombol "Ambil Tiket" (POST) → function.php::claimTicket($ticket_id, $staff_id)
  → mysqli: UPDATE Ticket SET staff_id=?, status='IN_PROGRESS' WHERE id=? AND status='OPEN' AND staff_id IS NULL
  → redirect ke halaman antrian support
```

### Staff Resolve Tiket
```
Form resolve (POST) → function.php::resolveTicket($ticket_id, $staff_id, $note)
  → cek: ticket.staff_id === $staff_id AND status === 'IN_PROGRESS'
  → mysqli: UPDATE Ticket SET status='RESOLVED', resolution_note=? WHERE id=?
  → redirect ke halaman selesai
```

### Manager Validasi & Tutup Tiket
```
Form validasi (POST) → function.php::setDifficulty($ticket_id, $level) + closeTicket($ticket_id)
  → mysqli: UPDATE Ticket SET difficulty_level=? WHERE id=?
  → mysqli: UPDATE Ticket SET status='CLOSED' WHERE id=?
  → mysqli: INSERT INTO LeaderboardLog (staff_id, ticket_id, points, period_month, period_year)
  → redirect
```

### Chat (AJAX Polling 3 detik)
```
Halaman chat → load messages via PHP (initial)
  → setInterval(3000): fetch ajax_messages.php?ticket_id=xxx
  → return JSON messages → render di DOM
  → Form kirim pesan (POST) → function.php::sendMessage($ticket_id, $sender_id, $message)
  → mysqli: INSERT INTO Chat (ticket_id, sender_id, message)
```

### WhatsApp Notification
```
Setelah aksi tiket (create/claim/resolve/close) → function.php::sendWANotification($event, $ticket_id)
  → cURL POST ke REST API Node.js: https://api.zorroserver.net/api/v1/... (atau endpoint WA terpisah)
  → REST API handle pengiriman WA via Baileys
```

---

## 3. Routing & Module Map

| Path (Next.js) | File Next.js | Logic / Action | Deskripsi | File PHP Target |
|---|---|---|---|---|
| `/` | `app/page.tsx` | redirect jika login | Landing page | `/php-native/index.php` |
| `/login` | `app/login/page.tsx` | `loginAction` → bcrypt → session | Login form | `/php-native/login/index.php` |
| `/register` | `app/register/page.tsx` | `registerAction` → create user | Register (opsional) | `/php-native/login/register.php` |
| `/dashboard` | `app/dashboard/page.tsx` | `getSession()` → role cards | Dashboard hub | `/php-native/page/dashboard/index.php` |
| `/dashboard/tickets` | `app/dashboard/tickets/page.tsx` | `getTickets(filters)` | List tiket | `/php-native/page/tiket/antrian.php` (USER) atau `baru.php` (STAFF) |
| `/dashboard/tickets/create` | `app/dashboard/tickets/create/page.tsx` | `getCategories()` + `createTicketAction` | Buat tiket | `/php-native/page/tiket/buat.php` |
| `/dashboard/tickets/[id]` | `app/dashboard/tickets/[id]/page.tsx` | `getTicketById()` + chat + actions | Detail tiket + chat | `/php-native/page/chat/index.php` (STAFF) atau `user.php` (USER) |
| `/dashboard/leaderboard` | `app/dashboard/leaderboard/page.tsx` | `getLeaderboard()` | Ranking staff | `/php-native/page/dashboard/index.php` (embedded) |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` | `getProfile()` + update + password | Edit profil | `/php-native/page/profil/index.php` |
| `/dashboard/admin/users` | `app/dashboard/admin/users/page.tsx` | `getUsers()` + CRUD | Kelola user | `/php-native/page/akun/index.php` |
| `/dashboard/admin/whatsapp` | `app/dashboard/admin/whatsapp/page.tsx` | WA connect/disconnect/template | WA Gateway | ⚠️ Tetap di REST API Node.js |
| `/api/chat/[ticketId]/sse` | `app/api/chat/[ticketId]/sse/route.ts` | SSE stream chat | Real-time chat | `/php-native/page/chat/ajax_messages.php` (AJAX polling) |
| `/api/uploads/[...path]` | `app/api/uploads/[...path]/route.ts` | File serving | Serve attachment | `/php-native/uploads/` (direct serve via Apache) |
| `/api/whatsapp/sse` | `app/api/whatsapp/sse/route.ts` | SSE WA status | WA status stream | ⚠️ Tetap di REST API Node.js |

---

## 4. Data Schema & State

### Lokasi Schema
- **MySQL Schema**: `/rest-api/docs/downloads/schema.sql` (sudah MySQL-compatible)
- **Prisma Schema (referensi)**: `/nextjs/prisma/schema.prisma`
- **Target**: Copy `schema.sql` ke `/php-native/schema/helpdesk.sql`

### Entity Utama & Relasi

```
User 1──N Ticket     (user_id = pembuat)
User 1──N Ticket     (staff_id = handler)
User 1──N Chat       (sender_id)
User 1──N LeaderboardLog (staff_id)
User 1──N Session    (user_id, CASCADE)
Category 1──N Ticket (category_id)
Ticket 1──N Chat     (ticket_id)
Ticket 1──N TicketAttachment (ticket_id, CASCADE)
Ticket 1──N LeaderboardLog (ticket_id)
```

### Tabel MySQL (10 tabel)

| Tabel | Keterangan | FK |
|-------|------------|-----|
| `User` | Semua user (3 role) | - |
| `Session` | Token login (7 hari) | `user_id` → User |
| `Category` | Kategori tiket (5 default) | - |
| `Ticket` | Tiket helpdesk | `category_id` → Category, `user_id` → User, `staff_id` → User |
| `TicketAttachment` | File lampiran tiket | `ticket_id` → Ticket (CASCADE) |
| `Chat` | Pesan chat per tiket | `ticket_id` → Ticket, `sender_id` → User |
| `LeaderboardLog` | Poin staff per tiket | `staff_id` → User, `ticket_id` → Ticket |
| `WA_Setting` | Pengaturan WA (1 row) | - |
| `Notification_Template` | Template pesan WA | - |

### State Management

| Asal (Next.js) | Target (PHP) |
|---|---|
| React Context (theme) | Tidak perlu (CSS class toggle via JS) |
| `useActionState` (form) | `$_POST` + redirect |
| SSE (chat real-time) | AJAX polling 3 detik |
| `$_SESSION` (cookie-based) | `$_SESSION` (PHP native session) |
| URL search params (filter) | `$_GET` parameters |
| Dynamic route `[id]` | `$_GET['id']` |

---

## 5. External Integrations

| Service | Asal (Next.js) | Target (PHP) | Pendekatan |
|---------|---------------|-------------|------------|
| **WhatsApp Gateway** | Baileys singleton di proses Next.js | REST API Node.js (folder `rest-api/`) | PHP panggil via cURL ke endpoint WA |
| **File Upload** | `writeFile()` ke disk + serve via API route | `move_uploaded_file()` + serve langsung via Apache | Folder `/php-native/uploads/` |
| **Password Hashing** | `bcryptjs` | `password_hash()` / `password_verify()` | PHP native (compatible hash format) |
| **Rate Limiting** | In-memory sliding window (`rate-limit.ts`) | Counter di `$_SESSION` + timestamp | Cek di `function.php` sebelum login |
| **Email** | Tidak ada | Tidak ada | - |
| **Third-party Auth** | Tidak ada (custom session) | Tidak ada (custom session) | - |

### WhatsApp Integration Detail

PHP akan memanggil REST API Node.js untuk fitur WA:
```php
// Di function.php
function sendWANotification($event_type, $ticket_id) {
    $url = "https://api.zorroserver.net/api/v1/whatsapp/notify";
    // cURL POST dengan token manager
}
```

> ⚠️ Halaman admin WA (QR scan, connect/disconnect) tetap diakses via Next.js app atau REST API docs. Tidak perlu direplikasi di PHP.

---

## 6. Assets & Frontend (folder `tikett/`)

### Halaman HTML yang Tersedia

| File di `tikett/` | Deskripsi | File PHP Target |
|---|---|---|
| `login.php` | Form login | `/php-native/login/index.php` |
| `logout.php` | Destroy session | `/php-native/logout/index.php` |
| `header.php` | Navbar + sidebar (role-based) | `/php-native/includes/header.php` |
| `footer.php` | JS includes + closing tags | `/php-native/includes/footer.php` |
| `index.php` | STAFF dashboard (stats + ranking) | `/php-native/page/dashboard/index.php` |
| `index-manager.php` | MANAGER dashboard (ranking) | `/php-native/page/dashboard/manager.php` |
| `tiket-baru-user.php` | USER: form buat tiket | `/php-native/page/tiket/buat.php` |
| `tiket-antri-user.php` | USER: list tiket antrian | `/php-native/page/tiket/antrian.php` |
| `tiket-selesai-user.php` | USER: list tiket selesai | `/php-native/page/tiket/selesai.php` |
| `tiket-baru-support.php` | STAFF: list OPEN + claim | `/php-native/page/tiket/baru.php` |
| `tiket-antri-support.php` | STAFF: list IN_PROGRESS | `/php-native/page/tiket/proses.php` |
| `tiket-selesai-support.php` | STAFF: list RESOLVED/CLOSED | `/php-native/page/tiket/riwayat.php` |
| `chat.php` | STAFF: chat + resolve | `/php-native/page/chat/index.php` |
| `chat-user.php` | USER: chat (send only) | `/php-native/page/chat/user.php` |
| `akun.php` | MANAGER: CRUD user | `/php-native/page/akun/index.php` |
| `validasi-poin.php` | MANAGER: validasi + close | `/php-native/page/validasi/index.php` |

### Komponen UI → Include Partial

| Komponen | Sumber | Target Partial |
|----------|--------|----------------|
| Navbar (top bar) | `tikett/header.php` baris 31-43 | `/php-native/includes/header.php` |
| Sidebar (role-based) | `tikett/header.php` baris 45-142 | `/php-native/includes/header.php` (if/endif per role) |
| Footer + JS | `tikett/footer.php` | `/php-native/includes/footer.php` |
| DataTables init | `tikett/js/datatables-simple-demo.js` | Copy as-is |
| Chart.js config | `tikett/assets/demo/chart-*.js` | Copy as-is |
| CSS | `tikett/css/styles.css` | Copy as-is (SB Admin) |

### CDN Dependencies (dari header/footer)
- Bootstrap 5.2.3
- Font Awesome 6.3.0
- Simple DataTables 7.1.2
- Chart.js 2.8.0
- SweetAlert2 v11
- Google Fonts (Inter)

---

## 7. Migration Blueprint (Prioritas Pekerjaan)

### Fase 1: Fondasi

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 1 | `/php-native/schema/helpdesk.sql` | `rest-api/docs/downloads/schema.sql` | Import ke MySQL | Copy langsung, sudah MySQL-compatible |
| 2 | `/php-native/config/config.php` | `inventaris-php-native/conf/config.php` | `new mysqli(...)` | Define: `$url`, `$host`, `$username`, `$password`, `$database`, `$conn` |
| 3 | `/php-native/config/function.php` | `nextjs/src/lib/actions/*.ts` + `inventaris-php-native/conf/function.php` | Semua query | `require "config.php"` + semua fungsi CRUD (login, tiket, chat, user, leaderboard) |

### Fase 2: Autentikasi

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 4 | `/php-native/login/index.php` | `nextjs/src/app/login/page.tsx` + `tikett/login.php` | `SELECT FROM User WHERE email=?` | `password_verify()`, `$_SESSION`, redirect by role |
| 5 | `/php-native/logout/index.php` | `tikett/logout.php` | `DELETE FROM Session WHERE id=?` | `session_destroy()` + redirect |
| 6 | `/php-native/includes/header.php` | `tikett/header.php` | None (session data) | Sidebar filter: `if ($_SESSION['role'] === 'USER')` |
| 7 | `/php-native/includes/footer.php` | `tikett/footer.php` | None | Copy as-is |
| 8 | `/php-native/index.php` | - | None | `header('Location: login/');` |

### Fase 3: Fitur USER (CRUD Tiket)

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 9 | `/php-native/page/tiket/buat.php` | `nextjs/src/lib/actions/tickets.ts::createTicketAction` + `tikett/tiket-baru-user.php` | `SELECT FROM Category` + `INSERT INTO Ticket` | Generate code: `TKT-{timestamp}-{random}` |
| 10 | `/php-native/page/tiket/antrian.php` | `tikett/tiket-antri-user.php` | `SELECT FROM Ticket WHERE user_id=? AND status IN ('OPEN','IN_PROGRESS','PENDING')` | Badge status, link ke chat |
| 11 | `/php-native/page/tiket/selesai.php` | `tikett/tiket-selesai-user.php` | `SELECT FROM Ticket WHERE user_id=? AND status IN ('RESOLVED','CLOSED')` | Badge status |

### Fase 4: Fitur STAFF (Klaim + Proses)

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 12 | `/php-native/page/tiket/baru.php` | `nextjs/src/lib/actions/tickets.ts::claimTicketAction` + `tikett/tiket-baru-support.php` | `SELECT WHERE status='OPEN'` + `UPDATE SET staff_id=?, status='IN_PROGRESS'` | Atomic: cek `staff_id IS NULL` sebelum update |
| 13 | `/php-native/page/tiket/proses.php` | `tikett/tiket-antri-support.php` | `SELECT WHERE staff_id=? AND status IN ('IN_PROGRESS','PENDING')` | Link ke chat |
| 14 | `/php-native/page/tiket/riwayat.php` | `tikett/tiket-selesai-support.php` | `SELECT WHERE staff_id=? AND status IN ('RESOLVED','CLOSED')` | Badge + link riwayat chat |

### Fase 5: Chat (AJAX Polling)

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 15 | `/php-native/page/chat/index.php` | `nextjs/src/components/chat/floating-chat.tsx` + `tikett/chat.php` | `SELECT FROM Ticket`, `SELECT FROM Chat`, `INSERT INTO Chat`, `UPDATE Ticket SET status='RESOLVED'` | STAFF view: kirim + resolve modal |
| 16 | `/php-native/page/chat/user.php` | `tikett/chat-user.php` | `SELECT FROM Ticket`, `SELECT FROM Chat`, `INSERT INTO Chat` | USER view: kirim saja |
| 17 | `/php-native/page/chat/ajax_messages.php` | `nextjs/src/app/api/chat/[ticketId]/sse/route.ts` | `SELECT FROM Chat WHERE ticket_id=? ORDER BY created_at` | Return JSON, dipanggil setiap 3 detik via `setInterval` |

### Fase 6: Dashboard + Leaderboard

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 18 | `/php-native/page/dashboard/index.php` | `nextjs/src/lib/actions/leaderboard.ts` + `tikett/index.php` | `SELECT COUNT(*) FROM Ticket WHERE status=?` + `SELECT SUM(points) FROM LeaderboardLog GROUP BY staff_id` | 4 stat cards + ranking table |
| 19 | `/php-native/page/dashboard/manager.php` | `tikett/index-manager.php` | `SELECT ... FROM LeaderboardLog GROUP BY staff_id ORDER BY total DESC` | Ranking table only |

### Fase 7: Manager Features

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 20 | `/php-native/page/akun/index.php` | `nextjs/src/lib/actions/users.ts` + `tikett/akun.php` | `SELECT FROM User` + INSERT/UPDATE + `UPDATE SET is_active=NOT is_active` | Form create + edit modal + toggle active |
| 21 | `/php-native/page/validasi/index.php` | `nextjs/src/lib/actions/tickets.ts::updateTicketStatusAction` + `tikett/validasi-poin.php` | `SELECT WHERE status='RESOLVED'` + `UPDATE difficulty_level` + `UPDATE status='CLOSED'` + `INSERT INTO LeaderboardLog` | Modal: pilih difficulty → hitung poin → close |

### Fase 8: Profil + Extras

| # | Target | Sumber | Aksi DB | Catatan |
|---|--------|--------|---------|---------|
| 22 | `/php-native/page/profil/index.php` | `nextjs/src/lib/actions/profile.ts` + (baru) | `SELECT FROM User WHERE id=?` + `UPDATE User SET name=?, email=?, phone=?` + `UPDATE SET password_hash=?` | `password_verify()` untuk cek password lama |

---

## 8. Risks / Blind Spots

### ⚠️ Real-time Chat (SSE → AJAX Polling)
- **Asal**: Server-Sent Events via `chat-emitter.ts` (instant push)
- **Target**: AJAX polling setiap 3 detik via `ajax_messages.php`
- **Risiko**: Delay 0-3 detik, load DB lebih tinggi
- **Mitigasi**: Index pada `(ticket_id, created_at)`, query ringan, cache timestamp pesan terakhir

### ⚠️ WhatsApp Gateway
- **Asal**: Baileys singleton di proses Next.js (Node.js only)
- **Target**: Tetap di REST API Node.js (folder `rest-api/`)
- **Risiko**: PHP tidak bisa menjalankan Baileys langsung
- **Mitigasi**: PHP panggil endpoint WA via cURL. Admin WA (QR scan) tetap via REST API web docs atau Next.js app.

### ⚠️ Dynamic Routes `[id]`
- **Asal**: `/dashboard/tickets/[id]` → `params.id`
- **Target**: `/page/chat/index.php?id=xxx` → `$_GET['id']`
- **Mitigasi**: Validasi `$_GET['id']` di awal file, redirect jika kosong/invalid

### ⚠️ File Upload
- **Asal**: `writeFile()` ke `public/uploads/` + serve via authenticated API route
- **Target**: `move_uploaded_file()` ke `/php-native/uploads/` + serve langsung
- **Risiko**: File bisa diakses tanpa auth jika folder public
- **Mitigasi**: `.htaccess` deny direct access, serve via PHP script dengan auth check

### ⚠️ Rate Limiting
- **Asal**: In-memory sliding window (`rate-limit.ts`)
- **Target**: Counter di `$_SESSION` + timestamp
- **Implementasi**:
```php
function checkRateLimit($key, $max = 10, $window = 900) {
    if (!isset($_SESSION['rate_limit'][$key])) {
        $_SESSION['rate_limit'][$key] = ['count' => 0, 'reset' => time() + $window];
    }
    if (time() > $_SESSION['rate_limit'][$key]['reset']) {
        $_SESSION['rate_limit'][$key] = ['count' => 0, 'reset' => time() + $window];
    }
    $_SESSION['rate_limit'][$key]['count']++;
    return $_SESSION['rate_limit'][$key]['count'] <= $max;
}
```

### ⚠️ UUID Generation
- **Asal**: Prisma `@default(uuid())` / PostgreSQL `gen_random_uuid()`
- **Target**: MySQL `UUID()` function atau PHP `uniqid()` + `bin2hex(random_bytes(16))`
- **Rekomendasi**: Gunakan MySQL `UUID()` di INSERT query:
```sql
INSERT INTO Ticket (id, ...) VALUES (UUID(), ...)
```

### ⚠️ Password Compatibility
- **Asal**: `bcryptjs` (Node.js) → hash format `$2b$12$...`
- **Target**: PHP `password_hash(PASSWORD_BCRYPT)` → format `$2y$12$...`
- **Risiko**: Hash `$2b$` dari Node.js **kompatibel** dengan PHP `password_verify()` (PHP auto-detect)
- **Mitigasi**: Tidak perlu migrasi password. User yang sudah ada bisa login langsung.

### ⚠️ Ticket Code Generation
- **Asal**: `Date.now().toString(36) + Math.random().toString(36)` di JavaScript
- **Target PHP**:
```php
function generateTicketCode() {
    $ts = strtoupper(base_convert(time(), 10, 36));
    $rand = strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
    return "TKT-{$ts}-{$rand}";
}
```

### ⚠️ Concurrent Ticket Claim (Race Condition)
- **Asal**: `SELECT FOR UPDATE` dalam Prisma transaction
- **Target PHP**:
```php
function claimTicket($ticket_id, $staff_id) {
    global $conn;
    mysqli_begin_transaction($conn);
    // SELECT ... FOR UPDATE
    $q = "SELECT id, status, staff_id FROM Ticket WHERE id='$ticket_id' FOR UPDATE";
    $r = mysqli_query($conn, $q);
    $ticket = mysqli_fetch_assoc($r);
    if (!$ticket || $ticket['staff_id'] || $ticket['status'] !== 'OPEN') {
        mysqli_rollback($conn);
        return ['status' => false, 'message' => 'Tiket sudah diklaim'];
    }
    mysqli_query($conn, "UPDATE Ticket SET staff_id='$staff_id', status='IN_PROGRESS' WHERE id='$ticket_id'");
    mysqli_commit($conn);
    return ['status' => true, 'message' => 'Berhasil'];
}
```

---

## Struktur Folder Target (Final)

```
/php-native/
├── index.php                          ← redirect ke login
├── /config/
│   ├── config.php                     ← mysqli connection + define URL
│   └── function.php                   ← require config + semua fungsi CRUD
├── /login/
│   ├── index.php                      ← form login + proses
│   └── register.php                   ← form register (opsional)
├── /logout/
│   └── index.php                      ← destroy session + redirect
├── /includes/
│   ├── header.php                     ← navbar + sidebar (role-based)
│   └── footer.php                     ← JS includes + closing tags
├── /uploads/                          ← file attachment tiket
├── /css/
│   └── styles.css                     ← SB Admin template
├── /js/
│   ├── scripts.js                     ← sidebar toggle
│   └── datatables-simple-demo.js      ← DataTables init
├── /assets/
│   └── /demo/                         ← Chart.js configs
├── /page/
│   ├── /dashboard/
│   │   ├── index.php                  ← STAFF: stats + ranking
│   │   └── manager.php                ← MANAGER: ranking
│   ├── /tiket/
│   │   ├── buat.php                   ← USER: form buat tiket (CREATE)
│   │   ├── antrian.php                ← USER: list tiket dalam antrian (READ)
│   │   ├── selesai.php                ← USER: list tiket selesai (READ)
│   │   ├── baru.php                   ← STAFF: list OPEN + claim (READ + UPDATE)
│   │   ├── proses.php                 ← STAFF: list IN_PROGRESS/PENDING (READ)
│   │   └── riwayat.php                ← STAFF: list RESOLVED/CLOSED (READ)
│   ├── /chat/
│   │   ├── index.php                  ← STAFF: chat + resolve
│   │   ├── user.php                   ← USER: chat (send only)
│   │   └── ajax_messages.php          ← AJAX endpoint: return JSON messages (polling 3s)
│   ├── /akun/
│   │   └── index.php                  ← MANAGER: CRUD user
│   ├── /validasi/
│   │   └── index.php                  ← MANAGER: validasi poin + close
│   └── /profil/
│       └── index.php                  ← ALL: edit profil + ganti password
└── /schema/
    └── helpdesk.sql                   ← MySQL schema (import ke phpMyAdmin)
```

---

## Gaya Kode PHP Target (Referensi: inventaris-php-native)

### config/config.php
```php
<?php
$url = "http://localhost/helpdesk/";
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'helpdesk';
$conn = new mysqli($host, $username, $password, $database);
if ($conn->connect_error) {
    die('Koneksi gagal: ' . $conn->connect_error);
}
```

### config/function.php
```php
<?php
session_start();
require "config.php";

function login($email, $password) {
    global $conn;
    $email = mysqli_real_escape_string($conn, $email);
    $query = "SELECT * FROM User WHERE email = '$email' AND is_active = 1";
    $result = mysqli_query($conn, $query);
    if ($result && mysqli_num_rows($result) > 0) {
        $user = mysqli_fetch_assoc($result);
        if (password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            return ['status' => true, 'message' => 'Login berhasil'];
        }
        return ['status' => false, 'message' => 'Password salah'];
    }
    return ['status' => false, 'message' => 'Email tidak ditemukan atau akun nonaktif'];
}

function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        header('Location: ' . getBaseUrl() . 'login/');
        exit;
    }
}

function requireRole(...$roles) {
    requireLogin();
    if (!in_array($_SESSION['role'], $roles)) {
        header('Location: ' . getBaseUrl() . 'login/');
        exit;
    }
}

function getBaseUrl() {
    global $url;
    return $url;
}
// ... fungsi CRUD lainnya ...
```

### Pola Halaman PHP
```php
<?php
require_once '../../config/function.php';
requireRole('USER');

// Handle POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $result = createTicket($_POST['title'], $_POST['description'], $_POST['category_id']);
    if ($result['status']) {
        $success = $result['message'];
    } else {
        $error = $result['message'];
    }
}

// GET data
$categories = getCategories();

// Include template
include '../../includes/header.php';
?>
<!-- HTML content here -->
<?php include '../../includes/footer.php'; ?>
```
