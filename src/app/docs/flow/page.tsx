'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

export default function FlowPage() {
  const [lightbox, setLightbox] = useState(false);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Alur Aplikasi</h1>
      <p className="text-white/50 text-sm mb-8">Flowchart sistem dan alur kerja tiket helpdesk.</p>

      {/* Flowchart Image */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-green-500" />
          Flowchart Sistem
        </h2>
        <div
          className="rounded-2xl bg-white/5 border border-white/10 p-3 cursor-zoom-in hover:bg-white/8 transition-all"
          onClick={() => setLightbox(true)}
        >
          <Image
            src="/docs/flowchart.jpg"
            alt="Flowchart IT Helpdesk"
            width={1200}
            height={1400}
            className="rounded-xl w-full h-auto"
            priority
          />
          <p className="text-center text-white/30 text-xs mt-2">Klik untuk memperbesar</p>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20" onClick={() => setLightbox(false)}>
            <X className="w-5 h-5" />
          </button>
          <Image src="/docs/flowchart.jpg" alt="Flowchart" width={2157} height={2560} className="max-w-[95vw] max-h-[92vh] object-contain rounded-xl" />
        </div>
      )}

      {/* Ticket Status Flow */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-blue-500" />
          Alur Status Tiket
        </h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 font-mono text-sm text-white/70 overflow-x-auto">
          <pre>{`OPEN ──> IN_PROGRESS ──> PENDING (opsional)
  │           │              │
  │           │              ▼
  │           │         IN_PROGRESS (kembali)
  │           │              │
  │           ▼              ▼
  │       RESOLVED ◄── IN_PROGRESS
  │           │
  ▼           ▼
CLOSED <── RESOLVED`}</pre>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-white/50 text-sm"><strong className="text-green-400">Alur utama:</strong> OPEN → IN_PROGRESS → RESOLVED → CLOSED</p>
          <p className="text-white/50 text-sm"><strong className="text-amber-400">Dengan pending:</strong> OPEN → IN_PROGRESS → PENDING → IN_PROGRESS → RESOLVED → CLOSED</p>
        </div>
      </section>

      {/* Role Permissions */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-purple-500" />
          Siapa Bisa Apa?
        </h2>
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-white/40 font-semibold text-xs uppercase">Aksi</th>
                <th className="p-3 text-center text-green-400 font-semibold text-xs uppercase">User</th>
                <th className="p-3 text-center text-blue-400 font-semibold text-xs uppercase">Staff</th>
                <th className="p-3 text-center text-purple-400 font-semibold text-xs uppercase">Manager</th>
              </tr>
            </thead>
            <tbody className="text-white/60">
              {[
                ['Buat tiket', true, false, false],
                ['Klaim tiket OPEN', false, true, true],
                ['Lepas tiket (unclaim)', false, true, false],
                ['Set pending', false, true, false],
                ['Resolve tiket', false, true, false],
                ['Assign staff', false, false, true],
                ['Ubah status tiket', false, false, true],
                ['Set difficulty', false, false, true],
                ['Tutup tiket', false, false, true],
                ['Chat pada tiket', true, true, true],
                ['Lihat leaderboard', false, true, true],
                ['Kelola user', false, false, true],
                ['Edit profil', true, true, true],
              ].map(([action, user, staff, manager], i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-3 text-white/70">{action as string}</td>
                  <td className="p-3 text-center">{user ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{staff ? '✅' : '❌'}</td>
                  <td className="p-3 text-center">{manager ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Step by Step */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-amber-500" />
          Alur Kerja Step-by-Step
        </h2>
        <div className="space-y-3">
          {[
            { step: '1', title: 'User membuat tiket', desc: 'User login → isi form (judul, kategori, deskripsi) → tiket berstatus OPEN', color: 'bg-green-500' },
            { step: '2', title: 'Staff mengklaim tiket', desc: 'Staff melihat daftar tiket OPEN → klik "Klaim" → status berubah ke IN_PROGRESS', color: 'bg-blue-500' },
            { step: '3', title: 'Staff & User berkomunikasi via chat', desc: 'Chat real-time pada tiket. Staff bisa set PENDING jika menunggu vendor.', color: 'bg-cyan-500' },
            { step: '4', title: 'Staff menyelesaikan tiket', desc: 'Staff mengisi catatan solusi → status berubah ke RESOLVED', color: 'bg-purple-500' },
            { step: '5', title: 'Manager memvalidasi & menutup tiket', desc: 'Manager set tingkat kesulitan (1-3) → tutup tiket → poin diberikan ke staff', color: 'bg-amber-500' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
              <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {item.step}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{item.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
