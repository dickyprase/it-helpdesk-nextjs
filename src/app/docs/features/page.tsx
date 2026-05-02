import { Ticket, MessageSquare, Trophy, Users, Shield, UserCog, Bell, Headset } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Fitur Aplikasi</h1>
      <p className="text-white/50 text-sm mb-8">Daftar lengkap fitur per role.</p>

      {/* Role: USER */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">USER</span>
          <span className="text-white/40 text-sm">Pengguna yang membuat tiket</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Ticket, title: 'Buat Tiket', desc: 'Form pembuatan tiket dengan judul, kategori (dropdown dari DB), dan deskripsi. Kode tiket auto-generated.' },
            { icon: Ticket, title: 'Lihat Tiket Antrian', desc: 'Daftar tiket sendiri yang berstatus OPEN, IN_PROGRESS, atau PENDING. Dengan badge status berwarna.' },
            { icon: Ticket, title: 'Lihat Tiket Selesai', desc: 'Daftar tiket sendiri yang berstatus RESOLVED atau CLOSED.' },
            { icon: MessageSquare, title: 'Chat pada Tiket', desc: 'Chat real-time (SSE) dengan staff yang menangani tiket. Pesan sendiri di kanan (biru), pesan lain di kiri.' },
            { icon: UserCog, title: 'Edit Profil', desc: 'Ubah nama, email, nomor WhatsApp. Ganti password dengan verifikasi password lama.' },
          ].map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* Role: STAFF */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">STAFF</span>
          <span className="text-white/40 text-sm">IT Support yang menangani tiket</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Ticket, title: 'Klaim Tiket', desc: 'Lihat daftar tiket OPEN → klik "Klaim" → status otomatis IN_PROGRESS. Atomic locking mencegah double-claim.' },
            { icon: Ticket, title: 'Lepas Tiket (Unclaim)', desc: 'Lepas tiket yang sudah diklaim dengan alasan wajib. Tiket kembali ke OPEN untuk diklaim staff lain.' },
            { icon: Ticket, title: 'Set Pending', desc: 'Ubah tiket ke PENDING jika menunggu vendor/pihak ketiga. Wajib isi alasan.' },
            { icon: Ticket, title: 'Resolve Tiket', desc: 'Selesaikan tiket dengan catatan solusi wajib. Hanya bisa dari status IN_PROGRESS (bukan PENDING).' },
            { icon: MessageSquare, title: 'Chat + Resolve', desc: 'Chat dengan user pembuat tiket. Tombol "Selesai" membuka modal untuk isi catatan penyelesaian.' },
            { icon: Trophy, title: 'Dashboard & Leaderboard', desc: '4 stat cards (tiket baru, antrian, selesai, poin) + tabel ranking staff bulan ini.' },
            { icon: UserCog, title: 'Edit Profil', desc: 'Sama seperti USER — ubah profil dan ganti password.' },
          ].map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* Role: MANAGER */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">MANAGER</span>
          <span className="text-white/40 text-sm">Administrator yang mengelola semua</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Ticket, title: 'Assign Staff', desc: 'Tugaskan tiket ke staff tertentu dari dropdown. Jika tiket OPEN, status otomatis berubah ke IN_PROGRESS.' },
            { icon: Ticket, title: 'Ubah Status Tiket', desc: 'Ubah status tiket sesuai state machine. Termasuk kembalikan PENDING ke IN_PROGRESS.' },
            { icon: Shield, title: 'Set Difficulty', desc: 'Atur tingkat kesulitan tiket (1-3). Hanya Manager yang bisa. Menentukan poin yang diberikan saat close.' },
            { icon: Trophy, title: 'Validasi & Tutup Tiket', desc: 'Pilih difficulty → tutup tiket → poin otomatis diberikan ke staff (10 × difficulty).' },
            { icon: Trophy, title: 'Leaderboard', desc: 'Lihat ranking staff berdasarkan poin. Filter bulanan/tahunan.' },
            { icon: Users, title: 'Kelola User', desc: 'CRUD user: buat akun baru (USER/STAFF), edit profil, toggle aktif/nonaktif. Nonaktif = tidak bisa login.' },
            { icon: Bell, title: 'WhatsApp Gateway', desc: 'Hubungkan WhatsApp via QR code. Kelola template notifikasi. Kirim test message. Toggle notifikasi on/off.' },
            { icon: Headset, title: 'Test Pesan WA', desc: 'Kirim pesan test ke nomor WhatsApp untuk verifikasi koneksi gateway.' },
          ].map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* Shared Features */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold">SEMUA ROLE</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Shield, title: 'Session-based Auth', desc: 'Login dengan email + password (bcrypt). Session 7 hari. Rate limiting pada login (10x/15menit).' },
            { icon: Bell, title: 'Notifikasi WhatsApp Otomatis', desc: 'Notifikasi otomatis ke WhatsApp saat tiket dibuat, diklaim, di-resolve, ditutup, dll.' },
            { icon: MessageSquare, title: 'Real-time Chat (SSE)', desc: 'Chat per tiket menggunakan Server-Sent Events. Pesan muncul langsung tanpa refresh.' },
            { icon: UserCog, title: 'Dark/Light Mode', desc: 'Toggle tema gelap/terang. Preferensi disimpan di localStorage.' },
          ].map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/40" />
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}
