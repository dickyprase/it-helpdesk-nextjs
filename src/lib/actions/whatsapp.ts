'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { waService } from '@/lib/whatsapp-singleton';
import { revalidatePath } from 'next/cache';

export type WAActionResult = {
  success: boolean;
  error?: string;
};

// ===== CONNECTION MANAGEMENT =====

export async function connectWAAction(): Promise<WAActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola WhatsApp' };
  }

  try {
    await waService.connect();
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal menghubungkan WhatsApp' };
  }
}

export async function disconnectWAAction(): Promise<WAActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola WhatsApp' };
  }

  try {
    await waService.disconnect();
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal memutuskan WhatsApp' };
  }
}

export async function getWAStatus() {
  return {
    status: waService.getStatus(),
    qrCode: waService.getQrCode(),
  };
}

// ===== WA SETTINGS =====

export async function getWASettings() {
  let setting = await prisma.wA_Setting.findFirst();
  if (!setting) {
    setting = await prisma.wA_Setting.create({
      data: { is_enabled: false, connection_status: 'disconnected' },
    });
  }
  return setting;
}

export async function toggleWANotifications(): Promise<WAActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola WhatsApp' };
  }

  const setting = await getWASettings();
  await prisma.wA_Setting.update({
    where: { id: setting.id },
    data: { is_enabled: !setting.is_enabled },
  });

  revalidatePath('/dashboard/admin/whatsapp');
  return { success: true };
}

// ===== TEMPLATE MANAGEMENT =====

export async function getTemplates() {
  return prisma.notification_Template.findMany({
    orderBy: { event_type: 'asc' },
  });
}

export async function getTemplateById(id: string) {
  return prisma.notification_Template.findUnique({ where: { id } });
}

export async function upsertTemplate(
  _prevState: WAActionResult | null,
  formData: FormData
): Promise<WAActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola template' };
  }

  const id = formData.get('id') as string | null;
  const eventType = (formData.get('event_type') as string)?.trim();
  const templateBody = (formData.get('template_body') as string)?.trim();
  const variables = (formData.get('variables') as string)?.trim();

  if (!eventType || !templateBody) {
    return { success: false, error: 'Event type dan template body wajib diisi' };
  }

  if (id) {
    await prisma.notification_Template.update({
      where: { id },
      data: { event_type: eventType, template_body: templateBody, variables: variables || '' },
    });
  } else {
    // Check duplicate event_type
    const existing = await prisma.notification_Template.findUnique({
      where: { event_type: eventType },
    });
    if (existing) {
      return { success: false, error: `Template untuk event "${eventType}" sudah ada` };
    }
    await prisma.notification_Template.create({
      data: { event_type: eventType, template_body: templateBody, variables: variables || '' },
    });
  }

  revalidatePath('/dashboard/admin/whatsapp');
  return { success: true };
}

export async function deleteTemplate(id: string): Promise<WAActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola template' };
  }

  await prisma.notification_Template.delete({ where: { id } });
  revalidatePath('/dashboard/admin/whatsapp');
  return { success: true };
}

// ===== NOTIFICATION ENGINE =====

// Variable substitution
function substituteVariables(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  }
  return result;
}

// Send notification for a ticket event
export async function sendTicketNotification(
  eventType: string,
  ticketId: string,
  extraVars?: Record<string, string>
) {
  // Check if WA notifications are enabled
  const setting = await prisma.wA_Setting.findFirst();
  if (!setting?.is_enabled) return;

  // Check connection
  if (waService.getStatus() !== 'connected') return;

  // Get template
  const template = await prisma.notification_Template.findUnique({
    where: { event_type: eventType },
  });
  if (!template) return;

  // Get ticket data
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { name: true, email: true } },
      staff: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
  });
  if (!ticket) return;

  // Build variables
  const vars: Record<string, string> = {
    'id-ticket': ticket.code,
    'judul-ticket': ticket.title,
    'nama-user': ticket.user.name,
    'nama-staff': ticket.staff?.name || '-',
    'status-akhir': ticket.status,
    'kategori': ticket.category.name,
    ...extraVars,
  };

  const message = substituteVariables(template.template_body, vars);

  // For now, we log the notification. In production, you'd send to the user's phone.
  // The user model doesn't have a phone field yet, so we just log it.
  console.log(`[WA Notification] Event: ${eventType}, Ticket: ${ticket.code}, Message: ${message}`);

  // If user had a phone number, we'd do:
  // await waService.sendMessage(ticket.user.phone, message);
}


