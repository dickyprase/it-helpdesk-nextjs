export default function DatabasePage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Database & ERD</h1>
      <p className="text-white/50 text-sm mb-8">Entity Relationship Diagram dan detail semua tabel.</p>

      {/* ERD Mermaid */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-500" />
          Entity Relationship Diagram
        </h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 overflow-x-auto">
          <pre className="text-white/60 text-xs sm:text-sm font-mono leading-relaxed">{`
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │1────N│    Ticket    │N────1│   Category   │
│──────────────│       │──────────────│       │──────────────│
│ id (UUID)    │       │ id (UUID)    │       │ id (UUID)    │
│ name         │       │ code (UNIQUE)│       │ name (UNIQUE)│
│ email (UNQ)  │       │ title        │       │ description  │
│ phone        │       │ description  │       └──────────────┘
│ password_hash│       │ status       │
│ role (ENUM)  │       │ difficulty   │       ┌──────────────┐
│ is_active    │       │ staff_id ────────────>│     Chat     │
└──────┬───────┘       │ user_id      │       │──────────────│
       │               └──────┬───────┘       │ id (UUID)    │
       │                      │               │ message      │
       │1────N          1────N│               │ ticket_id FK │
       │                      │               │ sender_id FK │
┌──────┴───────┐  ┌───────────┴──┐            └──────────────┘
│   Session    │  │ LeaderboardLog│
│──────────────│  │──────────────│            ┌──────────────┐
│ id (token)   │  │ id (UUID)    │            │TicketAttach  │
│ user_id FK   │  │ points       │            │──────────────│
│ expires_at   │  │ staff_id FK  │            │ id, filename │
└──────────────┘  │ ticket_id FK │            │ ticket_id FK │
                  │ period_month │            └──────────────┘
                  │ period_year  │
                  └──────────────┘

┌──────────────┐  ┌────────────────────┐
│  WA_Setting  │  │Notification_Template│
│ (standalone) │  │   (standalone)     │
└──────────────┘  └────────────────────┘`}</pre>
        </div>
      </section>

      {/* Relasi */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-green-500" />
          Relasi Antar Tabel
        </h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-1 text-sm text-white/60 font-mono">
          <p>User <span className="text-blue-400">1──N</span> Ticket <span className="text-white/30">(user_id = pembuat)</span></p>
          <p>User <span className="text-blue-400">1──N</span> Ticket <span className="text-white/30">(staff_id = handler)</span></p>
          <p>User <span className="text-blue-400">1──N</span> Chat <span className="text-white/30">(sender_id)</span></p>
          <p>User <span className="text-blue-400">1──N</span> LeaderboardLog <span className="text-white/30">(staff_id)</span></p>
          <p>User <span className="text-blue-400">1──N</span> Session <span className="text-white/30">(CASCADE delete)</span></p>
          <p>Category <span className="text-blue-400">1──N</span> Ticket</p>
          <p>Ticket <span className="text-blue-400">1──N</span> Chat</p>
          <p>Ticket <span className="text-blue-400">1──N</span> TicketAttachment <span className="text-white/30">(CASCADE delete)</span></p>
          <p>Ticket <span className="text-blue-400">1──N</span> LeaderboardLog</p>
        </div>
      </section>

      {/* Tables Detail */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-purple-500" />
          Detail Tabel (10 tabel)
        </h2>
        <div className="space-y-6">
          {TABLES.map((table) => (
            <div key={table.name} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                <h3 className="text-white font-bold text-sm">{table.name}</h3>
                <p className="text-white/40 text-xs">{table.desc}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-2.5 text-white/40 font-semibold">Kolom</th>
                      <th className="text-left p-2.5 text-white/40 font-semibold">Tipe</th>
                      <th className="text-left p-2.5 text-white/40 font-semibold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="p-2.5 text-blue-400 font-mono">{col.name}</td>
                        <td className="p-2.5 text-white/50 font-mono">{col.type}</td>
                        <td className="p-2.5 text-white/40">{col.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-amber-500" />
          Scoring System
        </h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <p className="text-white/60 text-sm mb-3">Poin diberikan ke staff saat Manager menutup tiket (CLOSED):</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { level: 1, label: 'Mudah', points: 10, color: 'text-green-400' },
              { level: 2, label: 'Sedang', points: 20, color: 'text-amber-400' },
              { level: 3, label: 'Sulit', points: 30, color: 'text-red-400' },
            ].map((d) => (
              <div key={d.level} className="text-center p-3 rounded-xl bg-white/5">
                <p className={`text-2xl font-extrabold ${d.color}`}>{d.points}</p>
                <p className="text-white/40 text-xs">poin — {d.label}</p>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-3">Formula: Poin = 10 × difficulty_level. Hanya Manager yang bisa set difficulty.</p>
        </div>
      </section>
    </div>
  );
}

const TABLES = [
  { name: 'User', desc: 'Semua pengguna (3 role)', columns: [
    { name: 'id', type: 'UUID', note: 'Primary Key' },
    { name: 'name', type: 'VARCHAR(100)', note: 'Nama lengkap' },
    { name: 'email', type: 'VARCHAR(255)', note: 'UNIQUE — untuk login' },
    { name: 'phone', type: 'VARCHAR(20)', note: 'Nullable — nomor WhatsApp' },
    { name: 'password_hash', type: 'VARCHAR(255)', note: 'bcrypt hash' },
    { name: 'role', type: 'ENUM', note: 'USER | STAFF | MANAGER' },
    { name: 'is_active', type: 'BOOLEAN', note: 'Default true — nonaktif = tidak bisa login' },
    { name: 'created_at', type: 'TIMESTAMP', note: 'Auto' },
  ]},
  { name: 'Session', desc: 'Token login (7 hari)', columns: [
    { name: 'id', type: 'VARCHAR(64)', note: 'PK — random hex token' },
    { name: 'user_id', type: 'UUID FK', note: '→ User (CASCADE delete)' },
    { name: 'expires_at', type: 'TIMESTAMP', note: '7 hari dari pembuatan' },
  ]},
  { name: 'Category', desc: 'Kategori tiket (5 default)', columns: [
    { name: 'id', type: 'UUID', note: 'PK' },
    { name: 'name', type: 'VARCHAR(100)', note: 'UNIQUE — Account, Hardware, Network, Software, Other' },
    { name: 'description', type: 'TEXT', note: 'Nullable' },
  ]},
  { name: 'Ticket', desc: 'Tiket helpdesk', columns: [
    { name: 'id', type: 'UUID', note: 'PK' },
    { name: 'code', type: 'VARCHAR(50)', note: 'UNIQUE — format TKT-XXXXX-XXXX' },
    { name: 'title', type: 'VARCHAR(200)', note: '5-200 karakter' },
    { name: 'description', type: 'TEXT', note: '10-5000 karakter' },
    { name: 'status', type: 'ENUM', note: 'OPEN | IN_PROGRESS | PENDING | RESOLVED | CLOSED' },
    { name: 'difficulty_level', type: 'INT', note: '1-3 (Mudah/Sedang/Sulit) — hanya Manager' },
    { name: 'resolution_note', type: 'TEXT', note: 'Nullable — catatan solusi dari staff' },
    { name: 'pending_reason', type: 'TEXT', note: 'Nullable — alasan pending' },
    { name: 'category_id', type: 'UUID FK', note: '→ Category' },
    { name: 'user_id', type: 'UUID FK', note: '→ User (pembuat tiket)' },
    { name: 'staff_id', type: 'UUID FK', note: '→ User (staff handler) — nullable' },
  ]},
  { name: 'TicketAttachment', desc: 'File lampiran tiket', columns: [
    { name: 'id', type: 'UUID', note: 'PK' },
    { name: 'filename', type: 'VARCHAR(255)', note: 'Nama file asli' },
    { name: 'filepath', type: 'VARCHAR(500)', note: 'Path serving' },
    { name: 'filetype', type: 'VARCHAR(100)', note: 'MIME type' },
    { name: 'filesize', type: 'INT', note: 'Bytes' },
    { name: 'ticket_id', type: 'UUID FK', note: '→ Ticket (CASCADE delete)' },
  ]},
  { name: 'Chat', desc: 'Pesan chat per tiket', columns: [
    { name: 'id', type: 'UUID', note: 'PK' },
    { name: 'message', type: 'TEXT', note: '1-2000 karakter' },
    { name: 'attachment_url', type: 'VARCHAR(500)', note: 'Nullable — path file' },
    { name: 'is_voice_note', type: 'BOOLEAN', note: 'Default false' },
    { name: 'ticket_id', type: 'UUID FK', note: '→ Ticket' },
    { name: 'sender_id', type: 'UUID FK', note: '→ User' },
    { name: 'created_at', type: 'TIMESTAMP', note: 'Auto' },
  ]},
  { name: 'LeaderboardLog', desc: 'Poin staff per tiket', columns: [
    { name: 'id', type: 'UUID', note: 'PK' },
    { name: 'points', type: 'INT', note: '10 × difficulty_level' },
    { name: 'period_month', type: 'INT', note: '1-12' },
    { name: 'period_year', type: 'INT', note: 'e.g. 2026' },
    { name: 'staff_id', type: 'UUID FK', note: '→ User' },
    { name: 'ticket_id', type: 'UUID FK', note: '→ Ticket' },
  ]},
  { name: 'WA_Setting', desc: 'Pengaturan WhatsApp (1 row)', columns: [
    { name: 'id', type: 'UUID', note: 'PK' },
    { name: 'is_enabled', type: 'BOOLEAN', note: 'Toggle notifikasi global' },
    { name: 'connection_status', type: 'VARCHAR(50)', note: 'disconnected | connected | ...' },
  ]},
  { name: 'Notification_Template', desc: 'Template pesan WA', columns: [
    { name: 'id', type: 'UUID', note: 'PK' },
    { name: 'event_type', type: 'VARCHAR(50)', note: 'UNIQUE — e.g. ticket_created' },
    { name: 'template_body', type: 'TEXT', note: 'Mendukung variabel [nama-user] dll' },
    { name: 'variables', type: 'VARCHAR(500)', note: 'Comma-separated list' },
  ]},
];
