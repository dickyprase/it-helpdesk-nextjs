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

/**
 * Disconnect WhatsApp but KEEP the session.
 * Next connect will auto-reconnect without QR scan.
 */
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

/**
 * Logout from WhatsApp AND clear the session.
 * Forces a fresh QR scan on next connect.
 */
export async function logoutWAAction(): Promise<WAActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola WhatsApp' };
  }

  try {
    await waService.logout();
    return { success: true };
  } catch {
    return { success: false, error: 'Gagal logout WhatsApp' };
  }
}

export async function getWAStatus() {
  return {
    status: waService.getStatus(),
    qrCode: waService.getQrCode(),
    hasSession: waService.hasSession(),
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

// ===== TEST MESSAGE =====

export async function sendTestMessageAction(
  _prevState: WAActionResult | null,
  formData: FormData
): Promise<WAActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengirim pesan test' };
  }

  const phone = (formData.get('phone') as string)?.trim();
  const message = (formData.get('message') as string)?.trim();

  if (!phone) {
    return { success: false, error: 'Nomor telepon wajib diisi' };
  }
  if (!message) {
    return { success: false, error: 'Isi pesan wajib diisi' };
  }

  if (waService.getStatus() !== 'connected') {
    return { success: false, error: 'WhatsApp belum terhubung. Hubungkan terlebih dahulu.' };
  }

  try {
    const sent = await waService.sendMessage(phone, message);
    if (sent) {
      return { success: true };
    }
    return { success: false, error: 'Gagal mengirim pesan. Pastikan nomor valid dan WA terhubung.' };
  } catch {
    return { success: false, error: 'Terjadi kesalahan saat mengirim pesan' };
  }
}

// ===== NOTIFICATION ENGINE =====

/**
 * Substitute [variable] placeholders in a template string.
 */
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

/**
 * Format a message with header/footer for consistent notification style.
 */
function formatNotificationMessage(body: string): string {
  return [
    '📋 *IT Helpdesk Notification*',
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    body,
    '',
    '━━━━━━━━━━━━━━━━━━━━━',
    '🤖 _Pesan otomatis dari sistem IT Helpdesk_',
  ].join('\n');
}

/**
 * Determine which phone numbers should receive a notification for a given event.
 * Returns an array of { phone, role } objects.
 *
 * Notification routing logic:
 * - ticket_created     → Staff/Manager (no specific staff yet, notify all managers)
 * - ticket_assigned    → User (creator) + assigned Staff
 * - ticket_in_progress → User (creator)
 * - ticket_pending     → User (creator)
 * - ticket_resolved    → User (creator)
 * - ticket_closed      → User (creator) + Staff (handler)
 */
type NotificationRecipient = { phone: string; name: string; role: string };

async function getNotificationRecipients(
  eventType: string,
  ticket: {
    user: { name: string; phone: string | null };
    staff: { name: string; phone: string | null } | null;
  }
): Promise<NotificationRecipient[]> {
  const recipients: NotificationRecipient[] = [];

  const userPhone = ticket.user.phone;
  const staffPhone = ticket.staff?.phone;

  switch (eventType) {
    case 'ticket_created': {
      // Notify the user who created the ticket (confirmation)
      if (userPhone) {
        recipients.push({ phone: userPhone, name: ticket.user.name, role: 'USER' });
      }
      // Also notify all managers about new tickets
      const managers = await prisma.user.findMany({
        where: { role: 'MANAGER', phone: { not: null } },
        select: { name: true, phone: true },
      });
      for (const mgr of managers) {
        if (mgr.phone) {
          recipients.push({ phone: mgr.phone, name: mgr.name, role: 'MANAGER' });
        }
      }
      break;
    }

    case 'ticket_assigned':
      // Notify user and assigned staff
      if (userPhone) {
        recipients.push({ phone: userPhone, name: ticket.user.name, role: 'USER' });
      }
      if (staffPhone) {
        recipients.push({ phone: staffPhone, name: ticket.staff!.name, role: 'STAFF' });
      }
      break;

    case 'ticket_in_progress':
    case 'ticket_pending':
    case 'ticket_resolved':
      // Notify user (ticket creator)
      if (userPhone) {
        recipients.push({ phone: userPhone, name: ticket.user.name, role: 'USER' });
      }
      break;

    case 'ticket_closed':
      // Notify both user and staff
      if (userPhone) {
        recipients.push({ phone: userPhone, name: ticket.user.name, role: 'USER' });
      }
      if (staffPhone) {
        recipients.push({ phone: staffPhone, name: ticket.staff!.name, role: 'STAFF' });
      }
      break;

    default:
      // For unknown events, notify user if available
      if (userPhone) {
        recipients.push({ phone: userPhone, name: ticket.user.name, role: 'USER' });
      }
      break;
  }

  return recipients;
}

/**
 * Send WhatsApp notification for a ticket event.
 * This is the main entry point called from ticket server actions.
 *
 * Flow:
 * 1. Check if WA notifications are enabled in settings
 * 2. Check if WA is connected
 * 3. Find the template for this event type
 * 4. Fetch ticket data with relations
 * 5. Build variable map and substitute into template
 * 6. Determine recipients based on event type
 * 7. Send formatted message to each recipient
 */
export async function sendTicketNotification(
  eventType: string,
  ticketId: string,
  extraVars?: Record<string, string>
) {
  try {
    console.log(`[WA Notification] Processing event: ${eventType}, ticketId: ${ticketId}`);

    // Check if WA notifications are enabled
    const setting = await prisma.wA_Setting.findFirst();
    if (!setting?.is_enabled) {
      console.log('[WA Notification] Skipped: notifications disabled in settings');
      return;
    }

    // Check connection
    const status = waService.getStatus();
    if (status !== 'connected') {
      console.log(`[WA Notification] Skipped: WA not connected (status: ${status})`);
      return;
    }

    // Get template for this event
    const template = await prisma.notification_Template.findUnique({
      where: { event_type: eventType },
    });
    if (!template) {
      console.log(`[WA Notification] Skipped: no template found for event "${eventType}"`);
      return;
    }

    // Get ticket data with all relations
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        staff: { select: { name: true, email: true, phone: true } },
        category: { select: { name: true } },
      },
    });
    if (!ticket) {
      console.log(`[WA Notification] Skipped: ticket not found (id: ${ticketId})`);
      return;
    }

    // Build variable map for template substitution
    const vars: Record<string, string> = {
      'id-ticket': ticket.code,
      'judul-ticket': ticket.title,
      'nama-user': ticket.user.name,
      'nama-staff': ticket.staff?.name || '-',
      'status-akhir': ticket.status,
      'kategori': ticket.category.name,
      ...extraVars,
    };

    // Substitute variables into template body
    const messageBody = substituteVariables(template.template_body, vars);

    // Format with header/footer
    const formattedMessage = formatNotificationMessage(messageBody);

    // Determine recipients based on event type
    const recipients = await getNotificationRecipients(eventType, ticket);

    if (recipients.length === 0) {
      console.log(
        `[WA Notification] No recipients with phone numbers for event: ${eventType}, Ticket: ${ticket.code}`
      );
      return;
    }

    // Send to all recipients
    for (const recipient of recipients) {
      const sent = await waService.sendMessage(recipient.phone, formattedMessage);
      if (sent) {
        console.log(
          `[WA Notification] Sent to ${recipient.name} (${recipient.role}) for ${eventType}, Ticket: ${ticket.code}`
        );
      } else {
        console.error(
          `[WA Notification] Failed to send to ${recipient.name} (${recipient.phone}) for ${eventType}`
        );
      }
    }
  } catch (error) {
    // Never let notification failures break ticket operations
    console.error('[WA Notification] Error:', error);
  }
}
