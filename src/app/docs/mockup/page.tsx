'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Download } from 'lucide-react';

const MOCKUPS = [
  { file: '01-login.svg', title: 'Halaman Login', desc: 'Form login dengan email dan password. Redirect berdasarkan role setelah berhasil login.' },
  { file: '02-dashboard.svg', title: 'Dashboard', desc: 'Hub navigasi utama dengan card menu. Card tertentu hanya muncul untuk role MANAGER (dashed border).' },
  { file: '03-ticket-list.svg', title: 'Daftar Tiket', desc: 'List tiket dengan filter status, kategori, dan search. Setiap tiket menampilkan kode, judul, status badge, dan staff.' },
  { file: '04-ticket-detail.svg', title: 'Detail Tiket + Chat', desc: 'Layout 2 kolom: kiri = info tiket + action buttons (role-based), kanan = live chat real-time.' },
  { file: '05-leaderboard.svg', title: 'Leaderboard Staff', desc: 'Ranking staff berdasarkan poin. Filter bulanan/tahunan. Badge emas/perak/perunggu untuk top 3.' },
  { file: '06-admin-users.svg', title: 'Kelola User (Manager)', desc: 'Tabel user dengan avatar, role badge, status aktif/nonaktif, dan tombol edit/toggle.' },
];

export default function MockupPage() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">UI Mockup / Wireframe</h1>
      <p className="text-white/50 text-sm mb-4">Rancangan antarmuka (blueprint) hitam putih untuk setiap halaman utama.</p>

      {/* Download All */}
      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-blue-400 text-sm font-semibold">Download untuk Laporan</p>
          <p className="text-blue-400/60 text-xs">Klik gambar untuk memperbesar. Klik tombol download untuk menyimpan.</p>
        </div>
      </div>

      {/* Mockup Grid */}
      <div className="space-y-6">
        {MOCKUPS.map((m, i) => (
          <div key={i} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div>
                <h2 className="text-white font-semibold text-sm">{m.title}</h2>
                <p className="text-white/40 text-xs">{m.desc}</p>
              </div>
              <a
                href={`/docs/mockup/${m.file}`}
                download={m.file}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 hover:text-white transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </div>
            {/* Image */}
            <div
              className="p-4 bg-white/[0.02] cursor-zoom-in hover:bg-white/[0.04] transition-all"
              onClick={() => setLightbox(m.file)}
            >
              <Image
                src={`/docs/mockup/${m.file}`}
                alt={m.title}
                width={800}
                height={500}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <a
            href={`/docs/mockup/${lightbox}`}
            download={lightbox}
            className="absolute top-4 right-16 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white text-xs hover:bg-white/20 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
          <Image
            src={`/docs/mockup/${lightbox}`}
            alt="Mockup Preview"
            width={1600}
            height={1000}
            className="max-w-[95vw] max-h-[90vh] object-contain bg-white rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
