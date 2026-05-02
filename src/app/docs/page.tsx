import Link from 'next/link';
import { GitBranch, Database, Layers, Monitor, ArrowRight } from 'lucide-react';

const CARDS = [
  {
    href: '/docs/flow',
    icon: GitBranch,
    title: 'Alur Aplikasi',
    desc: 'Flowchart sistem, alur tiket, dan role permissions',
    gradient: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/20',
  },
  {
    href: '/docs/database',
    icon: Database,
    title: 'Database & ERD',
    desc: 'Entity Relationship Diagram dan detail tabel',
    gradient: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/20',
  },
  {
    href: '/docs/features',
    icon: Layers,
    title: 'Fitur Aplikasi',
    desc: 'Daftar fitur lengkap per role (User, Staff, Manager)',
    gradient: 'from-purple-500 to-pink-600',
    shadow: 'shadow-purple-500/20',
  },
  {
    href: '/docs/mockup',
    icon: Monitor,
    title: 'UI Mockup',
    desc: 'Preview tampilan antarmuka web design',
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
  },
];

export default function DocsOverview() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          Dokumentasi IT Helpdesk
        </h1>
        <p className="text-white/50 text-sm sm:text-base">
          Sistem manajemen tiket IT dengan WhatsApp Gateway, live chat, dan leaderboard gamifikasi.
        </p>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: '3 Role', sub: 'User · Staff · Manager' },
          { label: '10 Tabel', sub: 'MySQL / PostgreSQL' },
          { label: '5 Status', sub: 'Open → Closed' },
          { label: 'Real-time', sub: 'SSE Chat' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-white font-bold text-lg">{item.label}</p>
            <p className="text-white/40 text-xs">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/8 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">{card.title}</h3>
              <p className="text-white/40 text-sm">{card.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Tech Stack */}
      <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-5">
        <h2 className="text-white font-semibold mb-3">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {['Next.js 16', 'TypeScript', 'PostgreSQL', 'Prisma ORM', 'Tailwind CSS v4', 'Baileys (WhatsApp)', 'SSE Real-time', 'Zod Validation', 'bcrypt Auth'].map((tech) => (
            <span key={tech} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
