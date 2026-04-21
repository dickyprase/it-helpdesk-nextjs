'use client';

import { useActionState } from 'react';
import { useState } from 'react';
import {
  updateTicketStatusAction,
  assignTicketAction,
  resolveTicketAction,
  pendingTicketAction,
  setDifficultyAction,
  claimTicketAction,
  type TicketActionResult,
} from '@/lib/actions/tickets';
import type { SessionUser } from '@/lib/auth';
import {
  ArrowRightLeft,
  Hand,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Paperclip,
  Gauge,
} from 'lucide-react';

// Manager transitions
const MANAGER_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
  PENDING: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'Dalam Proses',
  PENDING: 'Tertunda',
  RESOLVED: 'Selesai',
  CLOSED: 'Ditutup',
};

const STATUS_BUTTON_COLORS: Record<string, string> = {
  OPEN: 'from-green-500 to-emerald-600 shadow-green-500/20',
  IN_PROGRESS: 'from-blue-500 to-cyan-600 shadow-blue-500/20',
  PENDING: 'from-amber-500 to-orange-600 shadow-amber-500/20',
  RESOLVED: 'from-purple-500 to-violet-600 shadow-purple-500/20',
  CLOSED: 'from-gray-500 to-gray-600 shadow-gray-500/20',
};

type TicketData = {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  difficulty_level: number;
  category_id: string;
  user_id: string;
  staff_id: string | null;
  created_at: string;
  updated_at: string;
  resolution_note?: string | null;
  pending_reason?: string | null;
  attachments?: {
    id: string;
    filename: string;
    filepath: string;
    filetype: string;
    filesize: number;
  }[];
  category: { id: string; name: string; description: string | null };
  user: { id: string; name: string; email: string; role: string };
  staff: { id: string; name: string; email: string; role: string } | null;
};

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function FeedbackMessage({ state }: { state: TicketActionResult | null }) {
  if (!state) return null;
  if (state.success) {
    return (
      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
        <p className="text-sm text-green-400">Berhasil diperbarui</p>
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-sm text-red-400">{state.error}</p>
      </div>
    );
  }
  return null;
}

function SubmitButton({
  pending,
  children,
  className,
}: {
  pending: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${className ?? ''}`}
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

// --- Status Update (Manager only) ---
function StatusUpdateForm({
  ticketId,
  transitions,
}: {
  ticketId: string;
  transitions: string[];
}) {
  const [state, formAction, pending] = useActionState(
    updateTicketStatusAction,
    null
  );
  if (transitions.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wider mb-3">
        <ArrowRightLeft className="w-4 h-4 inline mr-2" />
        Ubah Status
      </h3>
      <div className="flex flex-wrap gap-2">
        {transitions.map((status) => (
          <form action={formAction} key={status}>
            <input type="hidden" name="ticket_id" value={ticketId} />
            <input type="hidden" name="status" value={status} />
            <SubmitButton
              pending={pending}
              className={`bg-gradient-to-r ${STATUS_BUTTON_COLORS[status]}`}
            >
              {STATUS_LABELS[status]}
            </SubmitButton>
          </form>
        ))}
      </div>
      <FeedbackMessage state={state} />
    </div>
  );
}

// --- Pending Ticket (Staff, requires reason) ---
function PendingTicketForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(
    pendingTicketAction,
    null
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wider mb-3">
        <Clock className="w-4 h-4 inline mr-2" />
        Pending Tiket
      </h3>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="ticket_id" value={ticketId} />
        <div>
          <label
            htmlFor="pending_reason"
            className="block text-sm font-medium text-theme-text-secondary mb-1.5"
          >
            Alasan Pending
          </label>
          <textarea
            id="pending_reason"
            name="pending_reason"
            required
            minLength={5}
            rows={3}
            placeholder="Contoh: Menunggu sparepart keyboard dari vendor..."
            className="w-full px-4 py-3 rounded-xl theme-input transition-all duration-200 resize-none text-sm"
          />
          {state?.fieldErrors?.pending_reason && (
            <p className="mt-1 text-xs text-red-400">
              {state.fieldErrors.pending_reason[0]}
            </p>
          )}
        </div>
        <SubmitButton
          pending={pending}
          className={`bg-gradient-to-r ${STATUS_BUTTON_COLORS['PENDING']}`}
        >
          <Clock className="w-4 h-4" />
          Pending Tiket
        </SubmitButton>
      </form>
      <FeedbackMessage state={state} />
    </div>
  );
}

// --- Resolve Ticket (Staff, requires resolution_note + optional attachments) ---
function ResolveTicketForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(
    resolveTicketAction,
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wider mb-3">
        <FileText className="w-4 h-4 inline mr-2" />
        Selesaikan Tiket
      </h3>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="ticket_id" value={ticketId} />
        <div>
          <label
            htmlFor="resolution_note"
            className="block text-sm font-medium text-theme-text-secondary mb-1.5"
          >
            Arahan & Nasehat untuk User
          </label>
          <textarea
            id="resolution_note"
            name="resolution_note"
            required
            minLength={10}
            rows={4}
            placeholder="Berikan arahan atau nasehat untuk pengguna..."
            className="w-full px-4 py-3 rounded-xl theme-input transition-all duration-200 resize-none text-sm"
          />
          {state?.fieldErrors?.resolution_note && (
            <p className="mt-1 text-xs text-red-400">
              {state.fieldErrors.resolution_note[0]}
            </p>
          )}
        </div>
        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-1.5">
            <span className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-theme-text-icon" />
              Lampiran (Opsional)
            </span>
          </label>
          <input
            type="file"
            name="attachments"
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              const maxSize = 100 * 1024 * 1024;
              const oversized = files.filter((f) => f.size > maxSize);
              if (oversized.length > 0) {
                alert(`File berikut melebihi batas 100MB: ${oversized.map((f) => f.name).join(', ')}`);
                e.target.value = '';
                setSelectedFiles([]);
                return;
              }
              setSelectedFiles(files);
            }}
            className="w-full px-4 py-2.5 rounded-xl theme-input transition-all duration-200 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
          />
          {selectedFiles.length > 0 && (
            <p className="mt-1 text-xs text-theme-text-muted">
              {selectedFiles.length} file dipilih
            </p>
          )}
        </div>
        <SubmitButton
          pending={pending}
          className={`bg-gradient-to-r ${STATUS_BUTTON_COLORS['RESOLVED']}`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Selesaikan Tiket
        </SubmitButton>
      </form>
      <FeedbackMessage state={state} />
    </div>
  );
}

// --- Set Difficulty (Staff) ---
function SetDifficultyForm({
  ticketId,
  currentLevel,
}: {
  ticketId: string;
  currentLevel: number;
}) {
  const [state, formAction, pending] = useActionState(
    setDifficultyAction,
    null
  );

  const levels = [
    { value: 1, label: 'Mudah', color: 'from-green-500 to-emerald-600' },
    { value: 2, label: 'Sedang', color: 'from-yellow-500 to-amber-600' },
    { value: 3, label: 'Sulit', color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wider mb-3">
        <Gauge className="w-4 h-4 inline mr-2" />
        Atur Level Kesulitan
      </h3>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <form action={formAction} key={level.value}>
            <input type="hidden" name="ticket_id" value={ticketId} />
            <input
              type="hidden"
              name="difficulty_level"
              value={level.value}
            />
            <SubmitButton
              pending={pending}
              className={`bg-gradient-to-r ${level.color} ${currentLevel === level.value ? 'ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'}`}
            >
              {level.label}
              {currentLevel === level.value && ' (aktif)'}
            </SubmitButton>
          </form>
        ))}
      </div>
      <FeedbackMessage state={state} />
    </div>
  );
}

// --- Claim Ticket (Staff, for OPEN tickets) ---
function ClaimTicketForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, pending] = useActionState(
    claimTicketAction,
    null
  );

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="ticket_id" value={ticketId} />
        <SubmitButton
          pending={pending}
          className={`bg-gradient-to-r ${STATUS_BUTTON_COLORS['IN_PROGRESS']}`}
        >
          <Hand className="w-4 h-4" />
          Klaim Tiket Ini
        </SubmitButton>
      </form>
      <FeedbackMessage state={state} />
    </div>
  );
}

// --- Assign Staff (Manager only) ---
function AssignStaffForm({
  ticketId,
  staffList,
  currentStaffId,
}: {
  ticketId: string;
  staffList: StaffMember[];
  currentStaffId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    assignTicketAction,
    null
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-theme-text-secondary uppercase tracking-wider mb-3">
        <UserPlus className="w-4 h-4 inline mr-2" />
        Tugaskan Staff
      </h3>
      <form
        action={formAction}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input type="hidden" name="ticket_id" value={ticketId} />
        <select
          name="staff_id"
          defaultValue={currentStaffId ?? ''}
          required
          className="flex-1 px-4 py-2.5 rounded-xl text-sm theme-input"
        >
          <option value="" disabled className="bg-theme-option-bg">
            Pilih staff...
          </option>
          {staffList.map((staff) => (
            <option
              key={staff.id}
              value={staff.id}
              className="bg-theme-option-bg"
            >
              {staff.name} ({staff.role === 'MANAGER' ? 'Manager' : 'Staff'})
            </option>
          ))}
        </select>
        <SubmitButton
          pending={pending}
          className="bg-gradient-to-r from-purple-500 to-pink-600 shadow-purple-500/20"
        >
          <UserPlus className="w-4 h-4" />
          Tugaskan
        </SubmitButton>
      </form>
      <FeedbackMessage state={state} />
    </div>
  );
}

// ===== Main Component =====
export default function TicketActions({
  ticket,
  session,
  staffList,
}: {
  ticket: TicketData;
  session: SessionUser;
  staffList: StaffMember[];
}) {
  const isManager = session.role === 'MANAGER';
  const isStaff = session.role === 'STAFF';
  const isOwner = ticket.user_id === session.id;
  const isAssignedStaff = ticket.staff_id === session.id;
  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';

  // Closed tickets: no actions
  if (isClosed) {
    return (
      <div className="rounded-2xl p-6 theme-card">
        <h2 className="text-lg font-semibold text-theme-text-primary mb-3">
          Aksi
        </h2>
        <p className="text-sm text-theme-text-muted">
          Tiket ini sudah ditutup. Tidak ada aksi yang tersedia.
        </p>
      </div>
    );
  }

  // USER: show status-appropriate message
  if (isOwner && !isStaff && !isManager) {
    let message = '';
    switch (ticket.status) {
      case 'OPEN':
        message =
          'Tiket Anda telah dibuat dan menunggu diklaim oleh staff IT.';
        break;
      case 'IN_PROGRESS':
        message = 'Tiket Anda sedang ditangani oleh staff IT.';
        break;
      case 'PENDING':
        message =
          'Tiket Anda sedang menunggu (pending). Staff sedang menunggu vendor/sparepart.';
        break;
      case 'RESOLVED':
        message =
          'Tiket Anda telah diselesaikan. Silakan lihat arahan & nasehat dari staff di atas.';
        break;
      default:
        message = 'Tiket Anda sedang diproses.';
    }
    return (
      <div className="rounded-2xl p-6 theme-card">
        <h2 className="text-lg font-semibold text-theme-text-primary mb-3">
          Status Tiket
        </h2>
        <p className="text-sm text-theme-text-secondary">{message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 space-y-6 theme-card">
      <h2 className="text-lg font-semibold text-theme-text-primary">Aksi</h2>

      {/* MANAGER: Assign + Status + Difficulty */}
      {isManager && (
        <>
          <AssignStaffForm
            ticketId={ticket.id}
            staffList={staffList}
            currentStaffId={ticket.staff_id}
          />
          <SetDifficultyForm
            ticketId={ticket.id}
            currentLevel={ticket.difficulty_level}
          />
          <StatusUpdateForm
            ticketId={ticket.id}
            transitions={MANAGER_TRANSITIONS[ticket.status] || []}
          />
        </>
      )}

      {/* STAFF: Claim OPEN ticket */}
      {isStaff && !ticket.staff_id && ticket.status === 'OPEN' && (
        <ClaimTicketForm ticketId={ticket.id} />
      )}

      {/* STAFF (assigned): actions based on current status */}
      {isStaff && isAssignedStaff && (
        <>
          {/* Set difficulty */}
          <SetDifficultyForm
            ticketId={ticket.id}
            currentLevel={ticket.difficulty_level}
          />

          {/* IN_PROGRESS: can Pending or Resolve */}
          {ticket.status === 'IN_PROGRESS' && (
            <>
              <PendingTicketForm ticketId={ticket.id} />
              <ResolveTicketForm ticketId={ticket.id} />
            </>
          )}

          {/* PENDING: can Resolve (after vendor/sparepart ready) */}
          {ticket.status === 'PENDING' && (
            <ResolveTicketForm ticketId={ticket.id} />
          )}

          {/* RESOLVED: waiting for manager to close */}
          {isResolved && (
            <p className="text-sm text-theme-text-muted">
              Tiket sudah diselesaikan. Menunggu Manager untuk menutup tiket.
            </p>
          )}
        </>
      )}

      {/* STAFF not assigned, ticket already taken by someone else */}
      {isStaff && !isAssignedStaff && ticket.staff_id !== null && (
        <p className="text-sm text-theme-text-muted">
          Tiket ini sudah ditangani oleh staff lain.
        </p>
      )}
    </div>
  );
}
