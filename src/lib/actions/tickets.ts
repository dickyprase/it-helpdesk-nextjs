'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  resolveTicketSchema,
  pendingTicketSchema,
  setDifficultySchema,
} from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export type TicketActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function generateTicketCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

// Helper: save uploaded files and create DB records
async function saveAttachments(
  files: File[],
  ticketId: string,
  uploadedBy: string
) {
  const validFiles = files.filter(
    (f) =>
      f.size > 0 &&
      f.size <= 50 * 1024 * 1024 &&
      (f.type.startsWith('image/') || f.type.startsWith('video/'))
  );

  if (validFiles.length === 0) return;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', ticketId);
  await mkdir(uploadDir, { recursive: true });

  for (const file of validFiles) {
    const ext = path.extname(file.name) || '.bin';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filepath = path.join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    await prisma.ticketAttachment.create({
      data: {
        filename: file.name,
        filepath: `/api/uploads/${ticketId}/${uniqueName}`,
        filetype: file.type,
        filesize: file.size,
        ticket_id: ticketId,
        uploaded_by: uploadedBy,
      },
    });
  }
}

// MANAGER transitions
const MANAGER_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['PENDING', 'RESOLVED', 'OPEN'],
  PENDING: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

// ===== CREATE TICKET (USER only) =====
export async function createTicketAction(
  _prevState: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }
  if (session.role !== 'USER') {
    return { success: false, error: 'Hanya user biasa yang dapat membuat tiket' };
  }

  const raw = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category_id: formData.get('category_id') as string,
  };

  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.category_id },
  });
  if (!category) {
    return { success: false, error: 'Kategori tidak ditemukan' };
  }

  const ticket = await prisma.ticket.create({
    data: {
      code: generateTicketCode(),
      title: parsed.data.title,
      description: parsed.data.description,
      category_id: parsed.data.category_id,
      difficulty_level: 1, // default, staff will set later
      user_id: session.id,
      status: 'OPEN',
    },
  });

  // Save attachments
  const files = formData.getAll('attachments') as File[];
  await saveAttachments(files, ticket.id, session.id);

  revalidatePath('/dashboard/tickets');
  redirect(`/dashboard/tickets/${ticket.id}`);
}

// ===== CLAIM TICKET (STAFF, atomic with SELECT FOR UPDATE) =====
export async function claimTicketAction(
  _prevState: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }
  if (session.role !== 'STAFF' && session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya staff yang dapat mengklaim tiket' };
  }

  const ticketId = formData.get('ticket_id') as string;
  if (!ticketId) {
    return { success: false, error: 'ID tiket tidak valid' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const tickets = await tx.$queryRaw<
        Array<{ id: string; status: string; staff_id: string | null }>
      >`
        SELECT id, status, staff_id FROM "Ticket"
        WHERE id = ${ticketId}
        FOR UPDATE
      `;

      if (tickets.length === 0) {
        throw new Error('Tiket tidak ditemukan');
      }

      const ticket = tickets[0];

      if (ticket.staff_id !== null) {
        throw new Error('Tiket sudah diklaim oleh staff lain');
      }

      if (ticket.status !== 'OPEN') {
        throw new Error('Hanya tiket dengan status OPEN yang dapat diklaim');
      }

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          staff_id: session.id,
          status: 'IN_PROGRESS',
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Gagal mengklaim tiket';
    return { success: false, error: message };
  }

  revalidatePath('/dashboard/tickets');
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { success: true };
}

// ===== UPDATE STATUS (MANAGER only for general transitions) =====
export async function updateTicketStatusAction(
  _prevState: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }
  if (session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengubah status tiket' };
  }

  const raw = {
    ticket_id: formData.get('ticket_id') as string,
    status: formData.get('status') as string,
  };

  const parsed = updateTicketStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Validasi gagal' };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticket_id },
  });
  if (!ticket) {
    return { success: false, error: 'Tiket tidak ditemukan' };
  }

  const allowed = MANAGER_TRANSITIONS[ticket.status] || [];
  if (!allowed.includes(parsed.data.status)) {
    return {
      success: false,
      error: `Tidak dapat mengubah status dari ${ticket.status} ke ${parsed.data.status}`,
    };
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticket_id },
    data: { status: parsed.data.status as any },
  });

  // Auto-create LeaderboardLog when Manager closes a ticket
  if (parsed.data.status === 'CLOSED' && ticket.staff_id) {
    const now = new Date();
    const points = 10 * ticket.difficulty_level; // Score = 10 * Difficulty (1/2/3)

    // Prevent duplicate: check if log already exists for this ticket
    const existing = await prisma.leaderboardLog.findFirst({
      where: { ticket_id: ticket.id },
    });

    if (!existing) {
      await prisma.leaderboardLog.create({
        data: {
          staff_id: ticket.staff_id,
          ticket_id: ticket.id,
          points,
          period_month: now.getMonth() + 1,
          period_year: now.getFullYear(),
        },
      });
    }
  }

  revalidatePath('/dashboard/tickets');
  revalidatePath(`/dashboard/tickets/${parsed.data.ticket_id}`);
  revalidatePath('/dashboard/leaderboard');
  return { success: true };
}

// ===== PENDING TICKET (STAFF only, requires pending_reason) =====
export async function pendingTicketAction(
  _prevState: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }
  if (session.role !== 'STAFF') {
    return { success: false, error: 'Hanya staff yang dapat mengubah status ke pending' };
  }

  const raw = {
    ticket_id: formData.get('ticket_id') as string,
    pending_reason: formData.get('pending_reason') as string,
  };

  const parsed = pendingTicketSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticket_id },
  });
  if (!ticket) {
    return { success: false, error: 'Tiket tidak ditemukan' };
  }
  if (ticket.staff_id !== session.id) {
    return { success: false, error: 'Anda bukan staff yang ditugaskan untuk tiket ini' };
  }
  if (ticket.status !== 'IN_PROGRESS') {
    return { success: false, error: 'Hanya tiket In Progress yang dapat di-pending' };
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticket_id },
    data: {
      status: 'PENDING',
      pending_reason: parsed.data.pending_reason,
    },
  });

  revalidatePath('/dashboard/tickets');
  revalidatePath(`/dashboard/tickets/${parsed.data.ticket_id}`);
  return { success: true };
}

// ===== RESOLVE TICKET (STAFF only, requires resolution_note, optional attachments) =====
export async function resolveTicketAction(
  _prevState: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }
  if (session.role !== 'STAFF') {
    return { success: false, error: 'Hanya staff yang dapat menyelesaikan tiket' };
  }

  const raw = {
    ticket_id: formData.get('ticket_id') as string,
    resolution_note: formData.get('resolution_note') as string,
  };

  const parsed = resolveTicketSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticket_id },
  });
  if (!ticket) {
    return { success: false, error: 'Tiket tidak ditemukan' };
  }
  if (ticket.staff_id !== session.id) {
    return { success: false, error: 'Anda bukan staff yang ditugaskan untuk tiket ini' };
  }
  // Allow resolve from IN_PROGRESS or PENDING
  if (ticket.status !== 'IN_PROGRESS' && ticket.status !== 'PENDING') {
    return { success: false, error: 'Hanya tiket In Progress atau Pending yang dapat diselesaikan' };
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticket_id },
    data: {
      status: 'RESOLVED',
      resolution_note: parsed.data.resolution_note,
    },
  });

  // Save staff attachments
  const files = formData.getAll('attachments') as File[];
  await saveAttachments(files, parsed.data.ticket_id, session.id);

  revalidatePath('/dashboard/tickets');
  revalidatePath(`/dashboard/tickets/${parsed.data.ticket_id}`);
  return { success: true };
}

// ===== SET DIFFICULTY (STAFF, when assigned/claiming) =====
export async function setDifficultyAction(
  _prevState: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }
  if (session.role !== 'STAFF' && session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya staff/manager yang dapat mengatur level kesulitan' };
  }

  const raw = {
    ticket_id: formData.get('ticket_id') as string,
    difficulty_level: parseInt(formData.get('difficulty_level') as string) || 1,
  };

  const parsed = setDifficultySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Validasi gagal' };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticket_id },
  });
  if (!ticket) {
    return { success: false, error: 'Tiket tidak ditemukan' };
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticket_id },
    data: { difficulty_level: parsed.data.difficulty_level },
  });

  revalidatePath(`/dashboard/tickets/${parsed.data.ticket_id}`);
  return { success: true };
}

// ===== ASSIGN TICKET (MANAGER only) =====
export async function assignTicketAction(
  _prevState: TicketActionResult | null,
  formData: FormData
): Promise<TicketActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }
  if (session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat assign tiket' };
  }

  const raw = {
    ticket_id: formData.get('ticket_id') as string,
    staff_id: formData.get('staff_id') as string,
  };

  const parsed = assignTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: 'Validasi gagal' };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticket_id },
  });
  if (!ticket) {
    return { success: false, error: 'Tiket tidak ditemukan' };
  }

  const staff = await prisma.user.findUnique({
    where: { id: parsed.data.staff_id },
  });
  if (!staff || (staff.role !== 'STAFF' && staff.role !== 'MANAGER')) {
    return { success: false, error: 'Staff tidak ditemukan atau tidak valid' };
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticket_id },
    data: {
      staff_id: parsed.data.staff_id,
      status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
    },
  });

  revalidatePath('/dashboard/tickets');
  revalidatePath(`/dashboard/tickets/${parsed.data.ticket_id}`);
  return { success: true };
}

// ===== HELPERS =====

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function getTickets(filters?: {
  status?: string;
  category_id?: string;
  user_id?: string;
  staff_id?: string;
  search?: string;
}) {
  const where: any = {};
  if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
  if (filters?.category_id && filters.category_id !== 'ALL') where.category_id = filters.category_id;
  if (filters?.user_id) where.user_id = filters.user_id;
  if (filters?.staff_id) where.staff_id = filters.staff_id;
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.ticket.findMany({
    where,
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      staff: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { attachments: true } },
    },
    orderBy: { created_at: 'desc' },
  });
}

export async function getTicketById(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      category: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      staff: { select: { id: true, name: true, email: true, role: true } },
      attachments: { orderBy: { created_at: 'asc' } },
    },
  });
}

export async function getStaffList() {
  return prisma.user.findMany({
    where: { role: { in: ['STAFF', 'MANAGER'] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}
