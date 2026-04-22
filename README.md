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
      tickets/                # Halaman tiket (list, detail, create)
    login/                    # Halaman login
    register/                 # Halaman registrasi
  components/
    chat/                     # Komponen floating chat
    ui/                       # Komponen UI reusable
  lib/
    actions/                  # Server actions (auth, tickets, chat, whatsapp)
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
