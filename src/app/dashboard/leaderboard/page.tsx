import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Crown,
  ChevronRight,
  Star,
  Target,
  TrendingUp,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { logoutAction } from '@/lib/actions/auth';
import ThemeToggle from '@/components/ui/theme-toggle';
import PeriodFilter from './period-filter';
import {
  getLeaderboard,
  getStaffStats,
  getAvailablePeriods,
} from '@/lib/actions/leaderboard';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(new Date(date));
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-400/30 shrink-0">
        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg shadow-gray-300/30 shrink-0">
        <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/30 shrink-0">
        <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-theme-option-bg flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-theme-text-secondary">{rank}</span>
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; year?: string; staff?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  if (session.role === 'USER') {
    redirect('/dashboard');
  }

  const params = await searchParams;

  const now = new Date();
  const view: 'monthly' | 'yearly' =
    params.view === 'yearly' ? 'yearly' : 'monthly';
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const staffId = params.staff || null;

  const [leaderboard, availablePeriods, staffStats] = await Promise.all([
    getLeaderboard(view, month, year),
    getAvailablePeriods(),
    staffId ? getStaffStats(staffId, view, month, year) : Promise.resolve(null),
  ]);

  // Build available years from periods + current year
  const availableYears = Array.from(
    new Set([
      now.getFullYear(),
      ...availablePeriods.map((p) => p.period_year),
    ])
  ).sort((a, b) => b - a);

  // Build the period label
  const periodLabel =
    view === 'monthly'
      ? `${MONTH_NAMES[month - 1]} ${year}`
      : `Tahun ${year}`;

  // Helper to build query string preserving current params
  function buildStaffUrl(sid: string) {
    const qp = new URLSearchParams();
    qp.set('view', view);
    if (view === 'monthly') qp.set('month', String(month));
    qp.set('year', String(year));
    qp.set('staff', sid);
    return `/dashboard/leaderboard?${qp.toString()}`;
  }

  return (
    <div className="theme-page">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 theme-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-theme-text-primary tracking-tight">
                IT Helpdesk
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-theme-text-primary">
                {session.name}
              </p>
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r ${roleBadgeColor[session.role]}`}
              >
                {roleLabel[session.role]}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-theme-text-muted hover:text-theme-text-primary transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-theme-text-primary">
                Leaderboard
              </h1>
              <p className="text-xs sm:text-base text-theme-text-secondary mt-0.5 truncate">
                Periode {periodLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Period Controls (interactive client component) */}
        <PeriodFilter
          initialView={view}
          initialMonth={month}
          initialYear={year}
          availableYears={availableYears}
          staffId={staffId}
        />

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl p-8 sm:p-12 text-center theme-card">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400/60" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-theme-text-primary mb-2">
              Belum ada data leaderboard
            </h3>
            <p className="text-theme-text-secondary text-sm">
              Data akan muncul setelah staff menyelesaikan tiket pada periode{' '}
              {periodLabel}.
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const pointsPerTicket =
                entry.tickets_closed > 0
                  ? Math.round(
                      (entry.total_points / entry.tickets_closed) * 10
                    ) / 10
                  : 0;

              const isSelected = staffId === entry.staff_id;

              // Rank-specific border highlight
              const rankBorder =
                rank === 1
                  ? 'ring-2 ring-amber-400/40'
                  : rank === 2
                    ? 'ring-2 ring-gray-300/30'
                    : rank === 3
                      ? 'ring-2 ring-amber-600/30'
                      : '';

              const selectedBorder = isSelected ? 'ring-2 ring-blue-500/50' : '';

              return (
                <Link
                  key={entry.staff_id}
                  href={buildStaffUrl(entry.staff_id)}
                  className={`group block rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.01] theme-card ${rankBorder} ${selectedBorder}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Rank Badge */}
                    <RankBadge rank={rank} />

                    {/* Staff Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-theme-text-primary group-hover:text-blue-400 transition-colors truncate">
                        {entry.staff_name}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-theme-text-muted truncate">
                        {entry.staff_email}
                      </p>
                    </div>

                    {/* Desktop Stats */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-theme-text-muted mb-0.5">
                          <Target className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Tiket</span>
                        </div>
                        <p className="text-sm font-bold text-theme-text-primary">
                          {entry.tickets_closed}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-theme-text-muted mb-0.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Rata-rata</span>
                        </div>
                        <p className="text-sm font-bold text-theme-text-primary">
                          {pointsPerTicket}
                        </p>
                      </div>
                    </div>

                    {/* Total Points */}
                    <div className="text-right shrink-0">
                      <div className="hidden sm:flex items-center gap-1 justify-end text-theme-text-muted mb-0.5">
                        <Star className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Poin</span>
                      </div>
                      <p
                        className={`text-lg sm:text-xl font-extrabold ${
                          rank === 1
                            ? 'text-amber-400'
                            : rank === 2
                              ? 'text-gray-300'
                              : rank === 3
                                ? 'text-amber-600'
                                : 'text-theme-text-primary'
                        }`}
                      >
                        {entry.total_points}
                      </p>
                      <p className="text-[10px] text-theme-text-muted sm:hidden">poin</p>
                    </div>

                    {/* Arrow - desktop only */}
                    <ChevronRight className="w-5 h-5 text-theme-text-muted group-hover:text-theme-text-secondary transition-colors hidden sm:block shrink-0" />
                  </div>

                  {/* Mobile stats row */}
                  <div className="flex sm:hidden items-center gap-4 mt-2.5 pt-2.5 border-t border-theme-text-muted/10">
                    <div className="flex items-center gap-1 text-xs text-theme-text-muted">
                      <Target className="w-3 h-3" />
                      <span>{entry.tickets_closed} tiket</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-theme-text-muted">
                      <TrendingUp className="w-3 h-3" />
                      <span>{pointsPerTicket} rata-rata</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-theme-text-muted ml-auto" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Staff Detail Panel */}
        {staffId && staffStats && (
          <div className="mt-6 sm:mt-8">
            <div className="rounded-2xl p-4 sm:p-8 theme-card">
              {/* Detail Header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-theme-text-muted/10">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <Star className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-theme-text-primary truncate">
                    {staffStats.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-theme-text-muted truncate">
                    {staffStats.email}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
                <div className="rounded-xl bg-theme-option-bg p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-theme-text-muted mb-1">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs">Total Poin</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-amber-400">
                    {staffStats.total_points}
                  </p>
                </div>
                <div className="rounded-xl bg-theme-option-bg p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-theme-text-muted mb-1">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs">Tiket Selesai</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-blue-400">
                    {staffStats.tickets_closed}
                  </p>
                </div>
                <div className="rounded-xl bg-theme-option-bg p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-theme-text-muted mb-1">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs">Rata-rata</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-green-400">
                    {staffStats.tickets_closed > 0
                      ? Math.round(
                          (staffStats.total_points / staffStats.tickets_closed) *
                            10
                        ) / 10
                      : 0}
                  </p>
                </div>
                <div className="rounded-xl bg-theme-option-bg p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-theme-text-muted mb-1">
                    <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs">Kesulitan</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-extrabold text-purple-400">
                    {staffStats.avg_difficulty}
                  </p>
                </div>
              </div>

              {/* Ticket Logs */}
              <h3 className="text-xs sm:text-sm font-semibold text-theme-text-muted uppercase tracking-wider mb-3">
                Riwayat Poin Tiket
              </h3>

              {staffStats.logs.length === 0 ? (
                <div className="rounded-xl bg-theme-option-bg p-6 text-center">
                  <p className="text-sm text-theme-text-muted">
                    Belum ada riwayat poin untuk periode ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-theme-text-muted/10">
                          <th className="text-left py-3 px-3 text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
                            Kode Tiket
                          </th>
                          <th className="text-left py-3 px-3 text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
                            Judul
                          </th>
                          <th className="text-center py-3 px-3 text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
                            Kesulitan
                          </th>
                          <th className="text-center py-3 px-3 text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
                            Poin
                          </th>
                          <th className="text-right py-3 px-3 text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
                            Tanggal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffStats.logs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-theme-text-muted/5 hover:bg-theme-option-bg/50 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <Link
                                href={`/dashboard/tickets/${log.ticket.id}`}
                                className="font-mono text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                              >
                                {log.ticket.code}
                              </Link>
                            </td>
                            <td className="py-3 px-3 text-theme-text-primary max-w-[200px] truncate">
                              {log.ticket.title}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  log.ticket.difficulty_level === 3
                                    ? 'bg-red-500/15 text-red-400'
                                    : log.ticket.difficulty_level === 2
                                      ? 'bg-amber-500/15 text-amber-400'
                                      : 'bg-green-500/15 text-green-400'
                                }`}
                              >
                                {log.ticket.difficulty_level === 3
                                  ? 'Sulit'
                                  : log.ticket.difficulty_level === 2
                                    ? 'Sedang'
                                    : 'Mudah'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-amber-400">
                                +{log.points}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-xs text-theme-text-muted">
                              {formatDate(log.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List */}
                  <div className="sm:hidden space-y-2">
                    {staffStats.logs.map((log) => (
                      <Link
                        key={log.id}
                        href={`/dashboard/tickets/${log.ticket.id}`}
                        className="block rounded-xl bg-theme-option-bg/50 p-3 active:bg-theme-option-bg transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-[11px] font-semibold text-blue-400 mb-0.5">
                              {log.ticket.code}
                            </p>
                            <p className="text-sm text-theme-text-primary truncate">
                              {log.ticket.title}
                            </p>
                          </div>
                          <span className="text-lg font-extrabold text-amber-400 shrink-0">
                            +{log.points}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.ticket.difficulty_level === 3
                                ? 'bg-red-500/15 text-red-400'
                                : log.ticket.difficulty_level === 2
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-green-500/15 text-green-400'
                            }`}
                          >
                            {log.ticket.difficulty_level === 3
                              ? 'Sulit'
                              : log.ticket.difficulty_level === 2
                                ? 'Sedang'
                                : 'Mudah'}
                          </span>
                          <span className="text-[10px] text-theme-text-muted ml-auto">
                            {formatDateShort(log.created_at)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Staff not found */}
        {staffId && !staffStats && (
          <div className="mt-6 sm:mt-8 rounded-2xl p-6 sm:p-8 text-center theme-card">
            <p className="text-theme-text-muted">
              Data staff tidak ditemukan untuk periode ini.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
