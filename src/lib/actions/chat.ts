'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { chatEmitter } from '@/lib/chat-emitter';
import { revalidatePath } from 'next/cache';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export type ChatActionResult = {
  success: boolean;
  error?: string;
};

async function saveChatFile(
  file: File,
  ticketId: string
): Promise<{ url: string; type: string } | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 50 * 1024 * 1024) return null; // 50MB max

  const allowed =
    file.type.startsWith('image/') ||
    file.type.startsWith('video/') ||
    file.type.startsWith('audio/');
  if (!allowed) return null;

  const uploadDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'chat',
    ticketId
  );
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name) || '.bin';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filepath = path.join(uploadDir, uniqueName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return {
    url: `/api/uploads/chat/${ticketId}/${uniqueName}`,
    type: file.type,
  };
}

async function verifyAccess(ticketId: string, sessionId: string, sessionRole: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) return { error: 'Tiket tidak ditemukan', ticket: null };
  if (ticket.status === 'CLOSED')
    return { error: 'Tidak dapat mengirim pesan pada tiket yang sudah ditutup', ticket: null };

  const isOwner = ticket.user_id === sessionId;
  const isAssignedStaff = ticket.staff_id === sessionId;
  const isManager = sessionRole === 'MANAGER';

  if (!isOwner && !isAssignedStaff && !isManager)
    return { error: 'Anda tidak memiliki akses ke chat tiket ini', ticket: null };

  return { error: null, ticket };
}

function broadcastMessage(
  ticketId: string,
  chat: { id: string; message: string; ticket_id: string; sender_id: string; created_at: Date; attachment_url: string | null; attachment_type: string | null; is_voice_note: boolean },
  senderName: string,
  senderRole: string
) {
  chatEmitter.emit(ticketId, {
    id: chat.id,
    message: chat.message,
    ticket_id: chat.ticket_id,
    sender_id: chat.sender_id,
    sender_name: senderName,
    sender_role: senderRole,
    created_at: chat.created_at.toISOString(),
    attachment_url: chat.attachment_url,
    attachment_type: chat.attachment_type,
    is_voice_note: chat.is_voice_note,
  });
}

// Send text message (optionally with attachment)
export async function sendMessageAction(
  _prevState: ChatActionResult | null,
  formData: FormData
): Promise<ChatActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Anda harus login terlebih dahulu' };

  const ticketId = formData.get('ticket_id') as string;
  const message = (formData.get('message') as string)?.trim() || '';
  const file = formData.get('attachment') as File | null;

  if (!ticketId) return { success: false, error: 'ID tiket tidak valid' };

  const { error, ticket } = await verifyAccess(ticketId, session.id, session.role);
  if (error || !ticket) return { success: false, error: error || 'Error' };

  // Save attachment if present
  let attachmentUrl: string | null = null;
  let attachmentType: string | null = null;

  if (file && file.size > 0) {
    const saved = await saveChatFile(file, ticketId);
    if (saved) {
      attachmentUrl = saved.url;
      attachmentType = saved.type;
    }
  }

  // Must have either message or attachment
  if (!message && !attachmentUrl) {
    return { success: false, error: 'Pesan atau lampiran wajib diisi' };
  }

  const chat = await prisma.chat.create({
    data: {
      message: message || (attachmentType?.startsWith('image/') ? 'Mengirim foto' : attachmentType?.startsWith('video/') ? 'Mengirim video' : 'Lampiran'),
      ticket_id: ticketId,
      sender_id: session.id,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      is_voice_note: false,
    },
  });

  broadcastMessage(ticketId, chat, session.name, session.role);
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { success: true };
}

// Send voice note
export async function sendVoiceNoteAction(
  _prevState: ChatActionResult | null,
  formData: FormData
): Promise<ChatActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Anda harus login terlebih dahulu' };

  const ticketId = formData.get('ticket_id') as string;
  const audioFile = formData.get('voice_note') as File | null;

  if (!ticketId) return { success: false, error: 'ID tiket tidak valid' };
  if (!audioFile || audioFile.size === 0) return { success: false, error: 'Voice note kosong' };

  const { error, ticket } = await verifyAccess(ticketId, session.id, session.role);
  if (error || !ticket) return { success: false, error: error || 'Error' };

  const saved = await saveChatFile(audioFile, ticketId);
  if (!saved) return { success: false, error: 'Gagal menyimpan voice note' };

  const chat = await prisma.chat.create({
    data: {
      message: 'Voice note',
      ticket_id: ticketId,
      sender_id: session.id,
      attachment_url: saved.url,
      attachment_type: saved.type,
      is_voice_note: true,
    },
  });

  broadcastMessage(ticketId, chat, session.name, session.role);
  revalidatePath(`/dashboard/tickets/${ticketId}`);
  return { success: true };
}

export async function getChatMessages(ticketId: string) {
  return prisma.chat.findMany({
    where: { ticket_id: ticketId },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
    orderBy: { created_at: 'asc' },
  });
}
