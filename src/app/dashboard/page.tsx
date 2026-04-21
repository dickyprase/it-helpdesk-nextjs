import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  LayoutDashboard,
  Ticket,
  Trophy,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { logoutAction } from '@/lib/actions/auth';
import ThemeToggle from '@/components/ui/theme-toggle';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  const roleBadgeColor: Record<string, string> = {
    USER: 'from-green-500 to-emerald-600',
    STAFF: 'from-blue-500 to-cyan-600',
    MANAGER: 'from-purple-500 to-pink-600',
  };

  const roleLabel: Record<string, string> = {
    USER: 'User',
    STAFF: 'IT Staff',
    MANAGER: 'Manager',
  };

  return (
    <div className="theme-page">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 theme-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-theme-text-primary tracking-tight">
              IT Helpdesk
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-theme-text-primary">
                {user.name}
              </p>
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r ${roleBadgeColor[user.role]}`}
              >
                {roleLabel[user.role]}
              </span>
            </div>
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-card-bg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-theme-text-primary">
            Selamat Datang, {user.name}
          </h1>
          <p className="text-theme-text-secondary mt-2">
            Kelola tiket dan pantau aktivitas helpdesk Anda di sini.
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tiket */}
          <Link
            href="/dashboard/tickets"
            className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] block theme-card"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-theme-text-primary mb-1">
                Tiket
              </h3>
              <p className="text-sm text-theme-text-muted">
                Buat dan kelola tiket IT support
              </p>
            </div>
          </Link>

          {/* Leaderboard */}
          <Link href="/dashboard/leaderboard" className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] block theme-card">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-theme-text-primary mb-1">
                Leaderboard
              </h3>
              <p className="text-sm text-theme-text-muted">
                Lihat peringkat performa staff IT
              </p>
            </div>
          </Link>

          {/* Chat */}
          <Link href="/dashboard/tickets" className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] block theme-card">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-theme-text-primary mb-1">
                Chat
              </h3>
              <p className="text-sm text-theme-text-muted">
                Komunikasi real-time terkait tiket
              </p>
            </div>
          </Link>

          {/* Manager-only: WA Gateway */}
          {user.role === 'MANAGER' && (
            <div className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] theme-card">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-theme-text-primary mb-1">
                  WhatsApp Gateway
                </h3>
                <p className="text-sm text-theme-text-muted">
                  Konfigurasi notifikasi WhatsApp
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-10 rounded-2xl p-6 theme-card">
          <h2 className="text-sm font-semibold text-theme-text-muted uppercase tracking-wider mb-4">
            Progress Pembangunan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400/60 mb-1">Tahap 1.1</p>
              <p className="text-sm font-medium text-green-500">Fondasi</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400/60 mb-1">Tahap 1.2</p>
              <p className="text-sm font-medium text-green-500">Database</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400/60 mb-1">Tahap 1.3</p>
              <p className="text-sm font-medium text-green-500">Auth</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400/60 mb-1">Tahap 2</p>
              <p className="text-sm font-medium text-green-500">Ticketing</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
