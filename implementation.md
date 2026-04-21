# Rencana Implementasi: Sistem IT Helpdesk & WA Gateway Terintegrasi

## Konteks Proyek
Proyek ini bertujuan membangun sistem IT Helpdesk komprehensif dengan fungsionalitas WhatsApp Gateway terintegrasi. Sistem akan menangani manajemen tiket dengan leaderboard gamifikasi, chat real-time, dan notifikasi WhatsApp otomatis. Tantangan utama adalah mengimplementasikan aplikasi Next.js monolitik dimana WhatsApp Gateway (Baileys) berjalan sebagai singleton service dalam proses yang sama, memastikan operasi tiket atomik dan penanganan data yang aman.

**Nama Proyek**: Sistem Manajemen IT Helpdesk & Integrated WA Gateway  
**Nilai Proyek**: Rp 7.000.000,-  
**Durasi Estimasi**: 10-14 hari kerja

## Arsitektur Teknis

### Stack Teknologi Utama
- **Frontend/Backend**: Next.js 14+ (App Router, Monolith)
- **Styling**: Tailwind CSS dengan tema Glassmorphism
- **Icons**: Lucide React
- **Database**: PostgreSQL dengan Prisma ORM
- **WhatsApp**: Baileys (sebagai singleton service)
- **Real-time**: Server-Sent Events (SSE)
- **Validasi**: Zod schemas
- **Autentikasi**: Custom session-based auth

### Keputusan Arsitektur Kunci
1. **Singleton WhatsApp Service**: Koneksi Baileys dikelola sebagai singleton untuk mencegah multiple connections
2. **Operasi Atomik**: Database-level locking untuk klaim tiket mencegah race conditions
3. **SSE untuk Real-time**: Server-Sent Events untuk live chat dan streaming QR code
4. **Security-First**: Parameterized queries, sanitasi input, proteksi kredensial

## Desain Schema Database

### Entitas Utama
```sql
-- Tabel Users dengan RBAC
Users: id, name, email, password_hash, role (User/Staff/Manager), created_at, updated_at

-- Tickets dengan manajemen state atomik
Tickets: id, code, title, description, status, category_id, user_id, staff_id, difficulty_level, created_at, updated_at

-- Categories untuk klasifikasi tiket
Categories: id, name, description

-- Sistem chat real-time
Chats: id, ticket_id, sender_id, message, created_at

-- Tracking leaderboard gamifikasi
LeaderboardLogs: id, staff_id, ticket_id, points, period_month, period_year, created_at

-- Konfigurasi WhatsApp Gateway
WA_Settings: id, is_enabled, session_data, connection_status, updated_at

-- Template notifikasi dinamis
Notification_Templates: id, event_type, template_body, variables, created_at, updated_at
```

## Fase Implementasi

### Fase 1: Fondasi Proyek & Setup Database
**Durasi**: 1-2 hari

#### 1.1 Inisialisasi Proyek
- ✅ Inisialisasi proyek Next.js 14 dengan TypeScript
- ✅ Konfigurasi Tailwind CSS dengan utilitas glassmorphism custom
- ✅ Setup ESLint, Prettier, dan struktur proyek
- ✅ Install dependencies inti (Prisma, Zod, Lucide, Baileys)

#### 1.2 Setup Database & ORM
- ✅ Konfigurasi koneksi PostgreSQL
- ✅ Buat schema Prisma dengan semua entitas
- ✅ Implementasi migrasi database
- ✅ Setup seed data untuk categories dan admin user awal

#### 1.3 Sistem Autentikasi
- ✅ Buat autentikasi berbasis session yang aman
- ✅ Implementasi password hashing dengan bcrypt
- ✅ Setup middleware untuk proteksi route
- ✅ Buat halaman login/register dengan validasi Zod

### Fase 2: Sistem Ticketing Inti
**Durasi**: 2-3 hari

#### 2.1 Backend Manajemen Tiket
- ✅ Buat Server Actions untuk operasi CRUD tiket
- ✅ Implementasi klaim tiket atomik dengan database locks
- ✅ Setup workflow status tiket (Open → In-Progress → Pending → Resolved → Closed)
- ✅ Buat sistem manajemen kategori
- ✅ Hanya USER yang dapat membuat tiket (STAFF/MANAGER tidak bisa)
- ✅ Hanya MANAGER yang dapat mengubah semua status tiket
- ✅ STAFF hanya bisa set Pending (menunggu vendor) atau Resolved (dengan arahan wajib)
- ✅ Implementasi resolveTicketAction dengan resolution_note wajib
- ✅ Implementasi upload multiple attachment (gambar/video) saat buat tiket

#### 2.2 Komponen UI Tiket
- ✅ Bangun form pembuatan tiket dengan validasi + upload attachment
- ✅ Buat tampilan list/grid tiket dengan filtering (role-based visibility)
- ✅ Implementasi halaman detail tiket dengan update status + tampilan attachment
- ✅ Tambah interface assignment tiket untuk staff (Manager only)
- ✅ Form resolve tiket dengan textarea arahan/nasehat wajib untuk Staff
- ✅ Tampilan resolution_note pada detail tiket

#### 2.3 Pencegahan Race Condition
- ✅ Implementasi database-level locking untuk klaim tiket
- ✅ Buat operasi update atomik menggunakan Prisma transactions
- ✅ Tambah optimistic locking untuk concurrent updates
- ✅ Test skenario race condition

### Fase 3: Sistem Leaderboard Gamifikasi
**Durasi**: 1-2 hari

#### 3.1 Logic Scoring
- ✅ Implementasi kalkulasi poin: `Score = 10 * Difficulty (1/2/3)`
- ✅ Buat sistem logging leaderboard
- ✅ Setup agregasi analytics bulanan/tahunan
- ✅ Implementasi release score saat tiket ditutup oleh Manager

#### 3.2 UI Leaderboard
- ✅ Bangun dashboard leaderboard staff
- ✅ Buat toggle view bulanan/tahunan
- ✅ Tambah metrik performa staff individual
- ✅ Implementasi detail log per staff dengan link ke tiket

### Fase 4: Sistem Chat Real-time
**Durasi**: 2-3 hari

#### 4.1 Infrastruktur Backend Chat
- ✅ Setup endpoint Server-Sent Events (SSE)
- ✅ Buat penyimpanan dan pengambilan pesan chat
- ✅ Implementasi broadcasting pesan real-time
- ✅ Tambah validasi dan sanitasi pesan

#### 4.2 Komponen UI Chat
- ✅ Bangun interface chat dengan update real-time
- ✅ Implementasi loading riwayat chat
- ✅ Link chat dari halaman detail tiket
- ✅ Chat ditutup otomatis saat tiket CLOSED

### Fase 5: Integrasi WhatsApp Gateway
**Durasi**: 3-4 hari

#### 5.1 Baileys Singleton Service
- Buat WhatsApp service dengan singleton pattern
- Implementasi generasi QR code dan pairing
- Setup persistensi dan recovery session
- Buat monitoring status koneksi

#### 5.2 Dashboard Manager untuk Konfigurasi WA
- Bangun interface scanner QR code dengan SSE
- Buat kontrol manajemen koneksi
- Implementasi toggle notifikasi global
- Tambah indikator status koneksi

#### 5.3 Sistem Manajemen Template
- Buat editor template dinamis
- Implementasi sistem substitusi variabel
- Dukungan untuk `[id-ticket]`, `[judul-ticket]`, `[nama-user]`, `[nama-staff]`, `[status-akhir]`
- Tambah fungsi preview template

#### 5.4 Otomasi Notifikasi
- Implementasi sistem notifikasi event-driven
- Buat trigger notifikasi untuk event tiket
- Tambah queue notifikasi dan retry logic
- Setup logging dan analytics notifikasi

### Fase 6: Optimasi Keamanan & Performa
**Durasi**: 1-2 hari

#### 6.1 Penguatan Keamanan
- Implementasi sanitasi input komprehensif
- Tambah rate limiting untuk API endpoints
- Setup proteksi CSRF
- Audit dan perbaiki potensi kerentanan XSS

#### 6.2 Optimasi Performa
- Implementasi optimasi query database
- Tambah caching untuk data yang sering diakses
- Optimasi koneksi SSE dan penggunaan memori
- Setup monitoring dan logging

### Fase 7: Polish UI/UX & Testing
**Durasi**: 1-2 hari

#### 7.1 Refinement UI/UX
- Terapkan tema glassmorphism konsisten
- Optimasi desain responsif
- Tambah loading states dan error handling
- Implementasi fitur aksesibilitas

#### 7.2 Testing & Quality Assurance
- Buat skenario test komprehensif
- Test penanganan race condition
- Validasi integrasi WhatsApp
- Performance testing under load

## File Kritis yang Akan Dibuat

### Struktur Aplikasi Inti
```
/src
  /app
    /api
      /auth/[...nextauth]/route.ts
      /tickets/route.ts
      /chat/sse/route.ts
      /whatsapp/route.ts
    /dashboard
      /page.tsx (Dashboard utama)
      /tickets/page.tsx
      /leaderboard/page.tsx
      /chat/[ticketId]/page.tsx
    /admin
      /whatsapp/page.tsx (Konfigurasi WA Gateway)
      /users/page.tsx
    /login/page.tsx
    /register/page.tsx
    layout.tsx
    page.tsx
  /components
    /ui (Komponen UI reusable)
    /tickets (Komponen khusus tiket)
    /chat (Komponen chat)
    /whatsapp (Komponen WA Gateway)
  /lib
    /auth.ts (Logic autentikasi)
    /db.ts (Koneksi database)
    /whatsapp-singleton.ts (Baileys singleton)
    /validations.ts (Zod schemas)
  /services
    /ticket-service.ts
    /chat-service.ts
    /whatsapp-service.ts
    /notification-service.ts
```

### Database & Konfigurasi
```
/prisma
  schema.prisma
  /migrations
/public
  /assets
package.json
next.config.js
tailwind.config.js
.env.local
```

## Strategi Verifikasi & Testing

### Skenario Testing End-to-End
1. **Registrasi & Login User**: Test alur auth lengkap
2. **Pembuatan & Assignment Tiket**: Verifikasi operasi atomik
3. **Testing Race Condition**: Multiple staff klaim tiket sama
4. **Real-time Chat**: Pengiriman pesan dan fungsionalitas SSE
5. **Integrasi WhatsApp**: QR scanning, koneksi, dan notifikasi
6. **Akurasi Leaderboard**: Kalkulasi poin dan agregasi bulanan
7. **Sistem Template**: Substitusi variabel dan pengiriman notifikasi
8. **Testing Keamanan**: SQL injection, XSS, dan proteksi kredensial

### Benchmark Performa
- Waktu load halaman < 2 detik
- Stabilitas koneksi SSE untuk 100+ concurrent users
- Optimasi query database (< 100ms untuk operasi tiket)
- Pengiriman pesan WhatsApp < 5 detik

### Validasi Keamanan
- Semua query database menggunakan parameterized statements
- Tidak ada data kredensial dalam response client
- Sanitasi input pada semua user inputs
- Proteksi CSRF pada semua forms
- Rate limiting pada authentication endpoints

## Mitigasi Risiko

### Risiko Teknis
1. **Stabilitas Koneksi Baileys**: Implementasi logic reconnection yang robust
2. **Race Conditions**: Strategi database locking komprehensif
3. **Memory Leaks**: Cleanup koneksi SSE yang proper
4. **Perubahan WhatsApp API**: Version pinning dan strategi fallback

### Risiko Bisnis
1. **Adopsi User**: Desain UI/UX yang intuitif
2. **Performa Under Load**: Desain arsitektur yang scalable
3. **Keamanan Data**: Implementasi keamanan multi-layer

## Checklist Progress

### ✅ Completed
- [x] Inisialisasi proyek Node.js dengan package.json
- [x] Setup Next.js 14 dengan TypeScript
- [x] Konfigurasi Tailwind CSS dengan glassmorphism
- [x] Install dependencies inti
- [x] Setup ESLint dan Prettier
- [x] Setup database schema Prisma (Tahap 1.2)
- [x] Implementasi sistem autentikasi (Tahap 1.3)
- [x] Bangun sistem ticketing inti (Tahap 2)
- [x] Gamified leaderboard system (Tahap 3)
- [x] Sistem chat real-time dengan SSE (Tahap 4)

### 🔄 In Progress
- [ ] Integrasi Baileys WhatsApp Gateway (Tahap 5)

### ⏳ Pending
- [ ] WA Gateway configuration dashboard
- [ ] Custom template engine dengan dynamic variables
- [ ] Security hardening measures

Rencana implementasi ini menyediakan pendekatan terstruktur untuk membangun sistem IT Helpdesk & WhatsApp Gateway terintegrasi sambil mengatasi semua requirement teknis, concern keamanan, dan objektif bisnis yang diuraikan dalam PRD.