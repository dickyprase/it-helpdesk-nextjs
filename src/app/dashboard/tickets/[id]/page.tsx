import { getSession } from '@/lib/auth';
import { getTicketById, getStaffList } from '@/lib/actions/tickets';
import { getChatMessages } from '@/lib/actions/chat';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { logoutAction } from '@/lib/actions/auth';
import ThemeToggle from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Tag,
  User,
  UserCog,
  Gauge,
  CalendarDays,
  CalendarClock,
  FileText,
  Paperclip,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import TicketActions from './ticket-actions';
import FloatingChat from '@/components/chat/floating-chat';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN: { label: 'Open', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  IN_PROGRESS: { label: 'Dalam Proses', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  PENDING: { label: 'Tertunda', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  RESOLVED: { label: 'Selesai', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  CLOSED: { label: 'Ditutup', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
};

const DIFFICULTY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Mudah', color: 'text-green-400' },
  2: { label: 'Sedang', color: 'text-amber-400' },
  3: { label: 'Sulit', color: 'text-red-400' },
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
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const ticket = await getTicketById(id);
  if (!ticket) {
    notFound();
  }

  const staffList = session.role === 'MANAGER' ? await getStaffList() : [];

  // Fetch chat messages for floating chat (only if ticket is not OPEN)
  const chatMessages = ticket.status !== 'OPEN'
    ? await getChatMessages(ticket.id)
    : [];

  const initialChatMessages = chatMessages.map((m) => ({
    id: m.id,
    message: m.message,
    ticket_id: m.ticket_id,
    sender_id: m.sender_id,
    sender_name: m.sender.name,
    sender_role: m.sender.role,
    created_at: m.created_at.toISOString(),
    attachment_url: m.attachment_url,
    attachment_type: m.attachment_type,
    is_voice_note: m.is_voice_note,
  }));

  // Check if current user has access to chat
  const canChat =
    ticket.status !== 'OPEN' &&
    (ticket.user_id === session.id ||
      ticket.staff_id === session.id ||
      session.role === 'MANAGER');

  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
  const difficultyCfg = DIFFICULTY_LABELS[ticket.difficulty_level] ?? DIFFICULTY_LABELS[1];

  // Serialize dates for the client component
  const ticketForClient = {
    ...ticket,
    created_at: ticket.created_at.toISOString(),
    updated_at: ticket.updated_at.toISOString(),
    resolution_note: ticket.resolution_note ?? null,
    pending_reason: ticket.pending_reason ?? null,
    attachments: ticket.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      filepath: a.filepath,
      filetype: a.filetype,
      filesize: a.filesize,
      uploaded_by: a.uploaded_by,
    })),
  };

  return (
    <div className="theme-page">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 theme-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
        {/* Back Link */}
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 text-sm text-theme-text-muted hover:text-theme-text-primary transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Tiket
        </Link>

        {/* Ticket Header */}
        <div className="rounded-2xl p-6 mb-6 theme-card">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-mono text-theme-text-muted">{ticket.code}</p>
              <h1 className="text-2xl font-bold text-theme-text-primary">{ticket.title}</h1>
            </div>
            <span
              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-semibold ${statusCfg.color} ${statusCfg.bg} border ${statusCfg.border} shrink-0`}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Info Grid + Description */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Info Grid */}
          <div className="lg:col-span-2 rounded-2xl p-6 theme-card">
            <h2 className="text-lg font-semibold text-theme-text-primary mb-5">Informasi Tiket</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Kategori */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-theme-text-muted uppercase tracking-wider font-semibold">Kategori</p>
                  <p className="text-sm text-theme-text-primary mt-0.5">{ticket.category.name}</p>
                </div>
              </div>

              {/* Pembuat */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-theme-text-muted uppercase tracking-wider font-semibold">Pembuat</p>
                  <p className="text-sm text-theme-text-primary mt-0.5">{ticket.user.name}</p>
                </div>
              </div>

              {/* Staff Ditugaskan */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <UserCog className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-theme-text-muted uppercase tracking-wider font-semibold">Staff Ditugaskan</p>
                  <p className="text-sm text-theme-text-primary mt-0.5">
                    {ticket.staff ? ticket.staff.name : (
                      <span className="text-theme-text-muted italic">Belum ditugaskan</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Level Kesulitan (hanya untuk Staff & Manager) */}
              {session.role !== 'USER' && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Gauge className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-theme-text-muted uppercase tracking-wider font-semibold">Level Kesulitan</p>
                    <p className={`text-sm mt-0.5 font-medium ${difficultyCfg.color}`}>
                      {ticket.difficulty_level}/3 &mdash; {difficultyCfg.label}
                    </p>
                  </div>
                </div>
              )}

              {/* Dibuat */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-theme-text-muted uppercase tracking-wider font-semibold">Dibuat</p>
                  <p className="text-sm text-theme-text-primary mt-0.5">{formatDate(ticket.created_at)}</p>
                </div>
              </div>

              {/* Diperbarui */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-theme-text-muted uppercase tracking-wider font-semibold">Diperbarui</p>
                  <p className="text-sm text-theme-text-primary mt-0.5">{formatDate(ticket.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="rounded-2xl p-6 theme-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-theme-text-primary">Deskripsi</h2>
            </div>
            <p className="text-sm text-theme-text-secondary leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Lampiran User */}
        {(() => {
          const userAttachments = ticket.attachments.filter(a => a.uploaded_by === ticket.user_id);
          if (userAttachments.length === 0) return null;
          return (
            <div className="rounded-2xl p-6 mb-6 theme-card">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-theme-text-primary">Lampiran dari User</h2>
                <span className="text-xs text-theme-text-muted">({userAttachments.length} file)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAttachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-card-border)' }}>
                    {attachment.filetype.startsWith('image/') ? (
                      <img src={attachment.filepath} alt={attachment.filename} className="w-full h-48 object-cover" />
                    ) : attachment.filetype.startsWith('video/') ? (
                      <video src={attachment.filepath} controls className="w-full h-48 object-cover" />
                    ) : null}
                    <div className="px-3 py-2">
                      <p className="text-xs text-theme-text-secondary truncate">{attachment.filename}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Lampiran Staff IT (dari resolve) */}
        {(() => {
          const staffAttachments = ticket.attachments.filter(a => a.uploaded_by !== ticket.user_id);
          if (staffAttachments.length === 0) return null;
          return (
            <div className="rounded-2xl p-6 mb-6 theme-card">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-theme-text-primary">Lampiran dari Staff IT</h2>
                <span className="text-xs text-theme-text-muted">({staffAttachments.length} file)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffAttachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-card-border)' }}>
                    {attachment.filetype.startsWith('image/') ? (
                      <img src={attachment.filepath} alt={attachment.filename} className="w-full h-48 object-cover" />
                    ) : attachment.filetype.startsWith('video/') ? (
                      <video src={attachment.filepath} controls className="w-full h-48 object-cover" />
                    ) : null}
                    <div className="px-3 py-2">
                      <p className="text-xs text-theme-text-secondary truncate">{attachment.filename}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Pending Reason Section */}
        {ticket.pending_reason && (
          <div className="rounded-2xl p-6 mb-6 theme-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-theme-text-primary">Alasan Pending</h2>
            </div>
            <p className="text-sm text-theme-text-secondary leading-relaxed whitespace-pre-wrap">
              {ticket.pending_reason}
            </p>
          </div>
        )}

        {/* Resolution Note Section */}
        {ticket.resolution_note && (
          <div className="rounded-2xl p-6 mb-6 theme-card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-theme-text-primary">Arahan & Nasehat</h2>
            </div>
            <p className="text-sm text-theme-text-secondary leading-relaxed whitespace-pre-wrap">
              {ticket.resolution_note}
            </p>
          </div>
        )}

        {/* Actions Section */}
        <TicketActions
          ticket={ticketForClient}
          session={session}
          staffList={staffList}
        />
      </main>

      {/* Floating Chat Bubble */}
      {canChat && (
        <FloatingChat
          ticketId={ticket.id}
          sessionUser={{ id: session.id, name: session.name, role: session.role }}
          initialMessages={initialChatMessages}
          isClosed={ticket.status === 'CLOSED'}
        />
      )}
    </div>
  );
}
