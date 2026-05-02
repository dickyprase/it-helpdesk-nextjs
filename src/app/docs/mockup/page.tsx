'use client';

import { useState } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';

const MOCKUP_SECTIONS = [
  {
    title: 'Halaman Login',
    desc: 'Form login dengan email dan password. Glassmorphism design dengan animated background orbs.',
    screens: [
      { label: 'Login', url: '/login', color: 'from-blue-600 to-indigo-600' },
      { label: 'Register', url: '/register', color: 'from-indigo-600 to-purple-600' },
    ],
  },
  {
    title: 'Dashboard',
    desc: 'Hub navigasi utama dengan card menu berdasarkan role. Manager melihat lebih banyak menu.',
    screens: [
      { label: 'Dashboard (User)', url: '/dashboard', color: 'from-blue-500 to-cyan-500' },
    ],
  },
  {
    title: 'Manajemen Tiket',
    desc: 'List tiket dengan filter status/kategori/search. Detail tiket dengan info lengkap dan action buttons.',
    screens: [
      { label: 'List Tiket', url: '/dashboard/tickets', color: 'from-green-500 to-emerald-500' },
      { label: 'Buat Tiket', url: '/dashboard/tickets/create', color: 'from-teal-500 to-green-500' },
    ],
  },
  {
    title: 'Live Chat',
    desc: 'Floating chat widget dengan real-time messaging. Fullscreen di mobile, floating di desktop.',
    screens: [
      { label: 'Chat (dalam tiket)', url: '/dashboard/tickets', color: 'from-purple-500 to-pink-500' },
    ],
  },
  {
    title: 'Leaderboard',
    desc: 'Ranking staff berdasarkan poin. Filter bulanan/tahunan. Detail statistik per staff.',
    screens: [
      { label: 'Leaderboard', url: '/dashboard/leaderboard', color: 'from-amber-500 to-orange-500' },
    ],
  },
  {
    title: 'Admin: Kelola User',
    desc: 'CRUD user dengan form tambah, tabel list, edit modal, dan toggle aktif/nonaktif.',
    screens: [
      { label: 'Kelola User', url: '/dashboard/admin/users', color: 'from-teal-500 to-cyan-500' },
    ],
  },
  {
    title: 'Admin: WhatsApp Gateway',
    desc: 'Koneksi WhatsApp via QR code, kelola template notifikasi, test pesan.',
    screens: [
      { label: 'WhatsApp Gateway', url: '/dashboard/admin/whatsapp', color: 'from-green-500 to-emerald-500' },
    ],
  },
  {
    title: 'Profil',
    desc: 'Edit nama, email, nomor WhatsApp. Ganti password dengan verifikasi password lama.',
    screens: [
      { label: 'Profil Saya', url: '/dashboard/profile', color: 'from-blue-500 to-indigo-500' },
    ],
  },
];

export default function MockupPage() {
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">UI Mockup</h1>
      <p className="text-white/50 text-sm mb-8">Preview tampilan antarmuka web design. Klik untuk melihat live preview.</p>

      {/* Info */}
      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-8">
        <p className="text-blue-400 text-sm">
          <strong>Catatan:</strong> Preview menggunakan iframe ke halaman asli aplikasi. Anda harus login terlebih dahulu untuk melihat halaman dashboard.
        </p>
      </div>

      {/* Mockup Grid */}
      <div className="space-y-6">
        {MOCKUP_SECTIONS.map((section, si) => (
          <div key={si} className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <h2 className="text-white font-bold mb-1">{section.title}</h2>
            <p className="text-white/40 text-xs mb-4">{section.desc}</p>
            <div className="flex flex-wrap gap-2">
              {section.screens.map((screen, sci) => (
                <button
                  key={sci}
                  onClick={() => setPreview(screen)}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r ${screen.color} text-white text-sm font-semibold hover:scale-105 transition-all shadow-lg`}
                >
                  {screen.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-sm">{preview.label}</span>
              <span className="text-white/30 text-xs font-mono">{preview.url}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-2 rounded-lg transition-colors ${device === 'desktop' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-2 rounded-lg transition-colors ${device === 'mobile' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button onClick={() => setPreview(null)} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* iframe */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div
              className={`bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
                device === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-5xl h-full'
              }`}
            >
              <iframe
                src={preview.url}
                className="w-full h-full border-0"
                title={preview.label}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
