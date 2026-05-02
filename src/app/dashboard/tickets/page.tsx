import { getSession } from '@/lib/auth';
import { getTickets, getCategories } from '@/lib/actions/tickets';
import { logoutAction } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Filter,
  Ticket,
  User,
  Clock,
  Tag,
  Circle,
  ChevronRight,
  Inbox,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Terbuka',
  IN_PROGRESS: 'Diproses',
  PENDING: 'Tertunda',
  RESOLVED: 'Selesai',
  CLOSED: 'Ditutup',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  IN_PROGRESS: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  PENDING: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  RESOLVED: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  CLOSED: { bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
};

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

function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <Circle
          key={i}
          className={`w-2.5 h-2.5 ${
            i <= level ? 'text-amber-400 fill-amber-400' : 'text-theme-text-muted'
          }`}
        />
      ))}
    </div>
  );
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const params = await searchParams;
  const currentStatus = params.status || 'ALL';
  const currentCategory = params.category || 'ALL';
  const currentSearch = params.search || '';

  const [tickets, categories] = await Promise.all([
    getTickets({
      status: currentStatus !== 'ALL' ? currentStatus : undefined,
      category_id: currentCategory !== 'ALL' ? currentCategory : undefined,
      search: currentSearch || undefined,
      ...(session.role === 'USER' ? { user_id: session.id } : {}),
    }),
    getCategories(),
  ]);

  return (
    <div className="theme-page">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 theme-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-theme-text-primary tracking-tight">IT Helpdesk</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-theme-text-primary">{session.name}</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-theme-text-primary">Tiket</h1>
            <p className="text-theme-text-secondary mt-1">
              {tickets.length} tiket ditemukan
            </p>
          </div>
          {session.role === 'USER' && (
            <Link
              href="/dashboard/tickets/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Buat Tiket Baru
            </Link>
          )}
        </div>

        {/* Filter Bar */}
        <div className="rounded-2xl p-4 sm:p-6 mb-8 theme-card">
          <form method="GET" action="/dashboard/tickets" className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <div className="flex-1 min-w-0">
              <label htmlFor="status" className="sr-only">Status</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon pointer-events-none" />
                <select
                  id="status"
                  name="status"
                  defaultValue={currentStatus}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm appearance-none cursor-pointer theme-input"
                >
                  <option value="ALL" className="bg-theme-option-bg text-theme-text-primary">Semua Status</option>
                  <option value="OPEN" className="bg-theme-option-bg text-theme-text-primary">Terbuka</option>
                  <option value="IN_PROGRESS" className="bg-theme-option-bg text-theme-text-primary">Diproses</option>
                  <option value="PENDING" className="bg-theme-option-bg text-theme-text-primary">Tertunda</option>
                  <option value="RESOLVED" className="bg-theme-option-bg text-theme-text-primary">Selesai</option>
                  <option value="CLOSED" className="bg-theme-option-bg text-theme-text-primary">Ditutup</option>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex-1 min-w-0">
              <label htmlFor="category" className="sr-only">Kategori</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon pointer-events-none" />
                <select
                  id="category"
                  name="category"
                  defaultValue={currentCategory}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm appearance-none cursor-pointer theme-input"
                >
                  <option value="ALL" className="bg-theme-option-bg text-theme-text-primary">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-theme-option-bg text-theme-text-primary">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <label htmlFor="search" className="sr-only">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon pointer-events-none" />
                <input
                  id="search"
                  type="text"
                  name="search"
                  defaultValue={currentSearch}
                  placeholder="Cari tiket..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm theme-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shrink-0"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Ticket List */}
        {tickets.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl p-12 text-center theme-card">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-blue-400/60" />
            </div>
            <h3 className="text-lg font-semibold text-theme-text-primary mb-2">Belum ada tiket</h3>
            <p className="text-theme-text-secondary text-sm mb-6">
              Tidak ada tiket yang sesuai dengan filter Anda.
            </p>
            {session.role === 'USER' && (
              <Link
                href="/dashboard/tickets/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Buat Tiket Baru
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN;
              return (
                <Link
                  key={ticket.id}
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="group block rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:scale-[1.01] theme-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left: Ticket Icon */}
                    <div className="hidden sm:flex w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5 text-blue-400" />
                    </div>

                    {/* Middle: Ticket Info */}
                    <div className="flex-1 min-w-0">
                      {/* Top row: code + status */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-semibold text-theme-text-muted">
                          {ticket.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-theme-text-primary group-hover:text-blue-200 transition-colors truncate">
                        {ticket.title}
                      </h3>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-theme-text-muted">
                        {/* Category */}
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {ticket.category.name}
                        </span>

                        {/* Creator */}
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.user.name}
                        </span>

                        {/* Assigned Staff */}
                        <span className="inline-flex items-center gap-1">
                          <Ticket className="w-3 h-3" />
                          {ticket.staff ? ticket.staff.name : 'Belum ditugaskan'}
                        </span>

                        {/* Created Date */}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Difficulty (manager only) + Arrow */}
                    <div className="flex items-center gap-4 shrink-0 sm:flex-col sm:items-end sm:gap-2">
                      {session.role === 'MANAGER' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-theme-text-muted">Kesulitan</span>
                          <DifficultyDots level={ticket.difficulty_level} />
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-theme-text-muted group-hover:text-theme-text-secondary transition-colors hidden sm:block" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
