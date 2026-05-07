import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import Pino from 'pino';
import path from 'path';
import fs from 'fs';
import { prisma } from './db';

// gifted-btns loaded dynamically to avoid build issues
let giftedSendButtons: any = null;

type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'qr_ready'
  | 'reconnecting';

type WAEventListener = (event: {
  type: 'qr' | 'status' | 'message';
  data: string;
}) => void;

// Conversation state for bot interactions
type ConversationState = {
  step: 'idle' | 'waiting_title' | 'waiting_category' | 'waiting_description' | 'waiting_ticket_code';
  data: {
    title?: string;
    category_id?: string;
    category_name?: string;
  };
  userId: string;
  userName: string;
  timeout?: ReturnType<typeof setTimeout>;
};

// Silent logger for Baileys internals
const logger = Pino({ level: 'silent' });

// Ticket code generator
function generateTicketCode(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${ts}-${rand}`;
}

class WhatsAppService {
  private socket: WASocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private qrCode: string | null = null;
  private listeners = new Set<WAEventListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private authDir = path.join(process.cwd(), '.wa-auth');
  private isIntentionalDisconnect = false;

  // Bot conversation states (per JID)
  private conversations = new Map<string, ConversationState>();

  // Conversation timeout (5 minutes)
  private readonly CONV_TIMEOUT_MS = 5 * 60 * 1000;

  getStatus() {
    return this.status;
  }

  getQrCode() {
    return this.qrCode;
  }

  hasSession(): boolean {
    try {
      return (
        fs.existsSync(this.authDir) &&
        fs.existsSync(path.join(this.authDir, 'creds.json'))
      );
    } catch {
      return false;
    }
  }

  subscribe(listener: WAEventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: { type: 'qr' | 'status' | 'message'; data: string }) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
  }

  private async updateDbStatus(status: string) {
    try {
      const setting = await prisma.wA_Setting.findFirst();
      if (setting) {
        await prisma.wA_Setting.update({
          where: { id: setting.id },
          data: { connection_status: status },
        });
      }
    } catch {
      // ignore DB errors during status update
    }
  }

  private async clearAuthState() {
    try {
      const fsp = await import('fs/promises');
      await fsp.rm(this.authDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  // ============================================================
  // BOT: Send buttons via gifted-btns with fallback
  // ============================================================

  private async sendBotButtons(
    jid: string,
    payload: { text: string; footer?: string; buttons: Array<{ id: string; text: string }> }
  ) {
    if (!this.socket) return;

    try {
      // Lazy-load gifted-btns at runtime (not during build)
      if (!giftedSendButtons) {
        const mod = await import('gifted-btns');
        giftedSendButtons = mod.default?.sendButtons || mod.sendButtons;
      }

      if (giftedSendButtons) {
        await giftedSendButtons(this.socket, jid, { ...payload, aimode: true });
      } else {
        throw new Error('gifted-btns not loaded');
      }
    } catch (err) {
      // Fallback: send as numbered text if buttons fail
      console.error('[WA Bot] Buttons failed, using text fallback:', (err as Error).message);
      let fallback = payload.text + '\n\n';
      payload.buttons.forEach((btn, i) => {
        fallback += `${i + 1}. ${btn.text}\n`;
      });
      fallback += '\n_Balas dengan angka pilihan._';
      await this.socket.sendMessage(jid, { text: fallback });
    }
  }

  // ============================================================
  // BOT: Verify user by phone number
  // ============================================================

  /**
   * Resolve a JID (could be @lid or @s.whatsapp.net) to a phone number.
   * Uses Baileys auth state lid-mapping files.
   * Returns the phone number without any suffix.
   */
  private resolveJidToPhone(jid: string): string | null {
    // Already a phone JID
    if (jid.endsWith('@s.whatsapp.net')) {
      return jid.replace('@s.whatsapp.net', '');
    }

    // LID format — resolve via auth state mapping files
    if (jid.endsWith('@lid')) {
      const lidNumber = jid.replace('@lid', '');
      console.log(`[WA Bot] Resolving LID: ${lidNumber}`);

      try {
        if (!fs.existsSync(this.authDir)) {
          console.log(`[WA Bot] Auth dir not found: ${this.authDir}`);
          return null;
        }

        // Strategy 1: Direct reverse mapping file
        const reverseFile = path.join(this.authDir, `lid-mapping-${lidNumber}_reverse.json`);
        if (fs.existsSync(reverseFile)) {
          const content = fs.readFileSync(reverseFile, 'utf-8').trim();
          const phone = content.replace(/"/g, '').trim();
          if (phone && /^\d+$/.test(phone)) {
            console.log(`[WA Bot] LID resolved (reverse file): ${lidNumber} → ${phone}`);
            return phone;
          }
        }

        // Strategy 2: Scan ALL non-reverse mapping files (phone → lid)
        // File format: lid-mapping-{phone}.json contains "{lid}"
        const allFiles = fs.readdirSync(this.authDir);
        const mappingFiles = allFiles.filter(f => 
          f.startsWith('lid-mapping-') && 
          !f.endsWith('_reverse.json') && 
          f.endsWith('.json')
        );

        console.log(`[WA Bot] Scanning ${mappingFiles.length} mapping files for LID ${lidNumber}...`);

        for (const file of mappingFiles) {
          try {
            const content = fs.readFileSync(path.join(this.authDir, file), 'utf-8').trim();
            const mappedLid = content.replace(/"/g, '').trim();
            if (mappedLid === lidNumber) {
              // Extract phone from filename: lid-mapping-{phone}.json
              const phone = file.replace('lid-mapping-', '').replace('.json', '');
              if (/^\d+$/.test(phone)) {
                console.log(`[WA Bot] LID resolved (forward scan): ${lidNumber} → ${phone} (from ${file})`);
                return phone;
              }
            }
          } catch { /* skip unreadable files */ }
        }

        // Strategy 3: Check device-list files (device-list-{phone}.json)
        const deviceFiles = allFiles.filter(f => f.startsWith('device-list-') && f.endsWith('.json'));
        console.log(`[WA Bot] Checking ${deviceFiles.length} device-list files...`);
        for (const file of deviceFiles) {
          const phone = file.replace('device-list-', '').replace('.json', '');
          if (/^\d+$/.test(phone) && phone.length > 8) {
            // Check if this phone has a lid-mapping that matches
            const fwdFile = path.join(this.authDir, `lid-mapping-${phone}.json`);
            if (fs.existsSync(fwdFile)) {
              const content = fs.readFileSync(fwdFile, 'utf-8').trim().replace(/"/g, '');
              if (content === lidNumber) {
                console.log(`[WA Bot] LID resolved (device+forward): ${lidNumber} → ${phone}`);
                return phone;
              }
            }
          }
        }

        console.log(`[WA Bot] LID NOT resolved: ${lidNumber}`);
        console.log(`[WA Bot] Auth files: ${allFiles.filter(f => f.includes('lid') || f.includes('device')).join(', ')}`);
      } catch (err) {
        console.error(`[WA Bot] LID resolution error:`, err);
      }
      return null;
    }

    // Unknown format — try to extract digits
    const digits = jid.replace(/@.*$/, '');
    return /^\d+$/.test(digits) ? digits : null;
  }

  private async verifyUser(jid: string): Promise<{ id: string; name: string } | null> {
    // Resolve JID to phone number first
    const phone = this.resolveJidToPhone(jid);
    if (!phone) {
      console.log(`[WA Bot] Cannot resolve JID to phone: ${jid}`);
      return null;
    }

    // Build all possible phone formats
    const phoneVariants: string[] = [phone];
    if (phone.startsWith('62')) {
      phoneVariants.push('0' + phone.substring(2));   // 628xx → 08xx
      phoneVariants.push('+' + phone);                 // 628xx → +628xx
    } else if (phone.startsWith('0')) {
      phoneVariants.push('62' + phone.substring(1));   // 08xx → 628xx
      phoneVariants.push('+62' + phone.substring(1));  // 08xx → +628xx
    }

    console.log(`[WA Bot] Verifying phone: ${phone}, variants:`, phoneVariants);

    try {
      const user = await prisma.user.findFirst({
        where: {
          phone: { in: phoneVariants },
          is_active: true,
          role: 'USER',
        },
        select: { id: true, name: true },
      });
      console.log(`[WA Bot] User found:`, user ? `${user.name} (${user.id})` : 'null');
      return user;
    } catch (err) {
      console.error('[WA Bot] verifyUser error:', err);
      return null;
    }
  }

  // ============================================================
  // BOT: Extract message body from various message types
  // ============================================================

  private extractMessageBody(msg: any): string {
    const message = msg.message;
    if (!message) return '';

    const type = Object.keys(message)[0];

    if (type === 'conversation') return message.conversation || '';
    if (type === 'extendedTextMessage') return message.extendedTextMessage?.text || '';
    if (type === 'buttonsResponseMessage') return message.buttonsResponseMessage?.selectedButtonId || '';
    if (type === 'templateButtonReplyMessage') return message.templateButtonReplyMessage?.selectedId || '';
    if (type === 'listResponseMessage') return message.listResponseMessage?.singleSelectReply?.selectedRowId || '';
    if (type === 'interactiveResponseMessage') {
      try {
        const json = message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if (json) return JSON.parse(json).id || '';
      } catch { /* ignore */ }
    }

    return '';
  }

  // ============================================================
  // BOT: Set conversation timeout (auto-reset after 5 min)
  // ============================================================

  private setConvTimeout(jid: string) {
    const conv = this.conversations.get(jid);
    if (!conv) return;

    if (conv.timeout) clearTimeout(conv.timeout);
    conv.timeout = setTimeout(() => {
      this.conversations.delete(jid);
    }, this.CONV_TIMEOUT_MS);
  }

  // ============================================================
  // BOT: Send main menu
  // ============================================================

  private async sendMainMenu(jid: string, userName: string) {
    await this.sendBotButtons(jid, {
      text: `🎫 *IT Helpdesk Bot*\n━━━━━━━━━━━━━━━━━━━━━\n\nHalo *${userName}*! 👋\nAda yang bisa saya bantu?\n\nSilakan pilih menu di bawah:`,
      footer: '🤖 Bot IT Helpdesk — Ketik "menu" kapan saja untuk kembali',
      buttons: [
        { id: 'create_ticket', text: '📝 Buat Tiket Baru' },
        { id: 'check_status', text: '📋 Cek Status Tiket' },
      ],
    });
  }

  // ============================================================
  // BOT: Handle incoming message
  // ============================================================

  private async handleIncomingMessage(msg: any) {
    if (!this.socket) return;

    // replyJid = raw JID from WhatsApp (could be @lid or @s.whatsapp.net)
    // This is what we use to SEND replies back
    const replyJid = msg.key.remoteJid;
    if (!replyJid) return;

    const body = this.extractMessageBody(msg).trim();
    if (!body) return;

    console.log(`[WA Bot] Message: "${body.substring(0, 80)}" from: ${replyJid}`);

    // 1. Verify user (resolves LID → phone internally)
    const user = await this.verifyUser(replyJid);
    if (!user) {
      await this.socket.sendMessage(replyJid, {
        text: '❌ *Nomor Tidak Terdaftar*\n\nMaaf, nomor WhatsApp Anda belum terdaftar di sistem IT Helpdesk.\n\nSilakan masukkan nomor WA Anda di halaman *Profil* pada aplikasi IT Helpdesk terlebih dahulu.',
      });
      return;
    }

    const cmd = body.toLowerCase();

    // 2. Global commands (always work regardless of state)
    if (cmd === 'menu' || cmd === 'start' || cmd === 'hi' || cmd === 'halo' || cmd === 'help' || cmd === 'batal') {
      this.conversations.delete(replyJid);
      await this.sendMainMenu(replyJid, user.name);
      return;
    }

    // 3. Handle button responses
    if (body === 'create_ticket') {
      this.conversations.set(replyJid, {
        step: 'waiting_title',
        data: {},
        userId: user.id,
        userName: user.name,
      });
      this.setConvTimeout(replyJid);
      await this.socket.sendMessage(replyJid, {
        text: '📝 *Buat Tiket Baru*\n━━━━━━━━━━━━━━━━━━━━━\n\nSilakan tulis *judul kendala* Anda:\n\n_(Contoh: Printer lantai 2 error)_',
      });
      return;
    }

    if (body === 'check_status') {
      this.conversations.set(replyJid, {
        step: 'waiting_ticket_code',
        data: {},
        userId: user.id,
        userName: user.name,
      });
      this.setConvTimeout(replyJid);
      await this.socket.sendMessage(replyJid, {
        text: '📋 *Cek Status Tiket*\n━━━━━━━━━━━━━━━━━━━━━\n\nMasukkan *kode tiket* Anda:\n\n_(Contoh: TKT-MO9G0B44-LVE6)_\n\nKetik *menu* untuk kembali.',
      });
      return;
    }

    // 4. Handle category button click (cat_UUID)
    if (body.startsWith('cat_')) {
      const state = this.conversations.get(replyJid);
      if (state?.step === 'waiting_category') {
        const categoryId = body.replace('cat_', '');

        // Verify category exists
        try {
          const category = await prisma.category.findUnique({ where: { id: categoryId } });
          if (category) {
            state.data.category_id = categoryId;
            state.data.category_name = category.name;
            state.step = 'waiting_description';
            this.setConvTimeout(replyJid);

            await this.socket.sendMessage(replyJid, {
              text: `✅ Kategori: *${category.name}*\n\nSekarang tulis *deskripsi lengkap* kendala Anda:\n\n_(Minimal 10 karakter. Jelaskan masalah secara detail agar staff bisa membantu dengan cepat.)_`,
            });
            return;
          }
        } catch { /* ignore */ }
      }
    }

    // 5. Handle numbered fallback (1 = Buat Tiket, 2 = Cek Status)
    if (body === '1' && !this.conversations.has(replyJid)) {
      // Same as create_ticket
      this.conversations.set(replyJid, {
        step: 'waiting_title',
        data: {},
        userId: user.id,
        userName: user.name,
      });
      this.setConvTimeout(replyJid);
      await this.socket.sendMessage(replyJid, {
        text: '📝 *Buat Tiket Baru*\n━━━━━━━━━━━━━━━━━━━━━\n\nSilakan tulis *judul kendala* Anda:\n\n_(Contoh: Printer lantai 2 error)_',
      });
      return;
    }

    if (body === '2' && !this.conversations.has(replyJid)) {
      // Same as check_status
      this.conversations.set(replyJid, {
        step: 'waiting_ticket_code',
        data: {},
        userId: user.id,
        userName: user.name,
      });
      this.setConvTimeout(replyJid);
      await this.socket.sendMessage(replyJid, {
        text: '📋 *Cek Status Tiket*\n━━━━━━━━━━━━━━━━━━━━━\n\nMasukkan *kode tiket* Anda:\n\n_(Contoh: TKT-MO9G0B44-LVE6)_',
      });
      return;
    }

    // 6. Handle conversation steps
    const state = this.conversations.get(replyJid);
    if (state) {
      switch (state.step) {
        case 'waiting_title': {
          if (body.length < 5) {
            await this.socket.sendMessage(replyJid, {
              text: '⚠️ Judul terlalu pendek. Minimal 5 karakter.\n\nSilakan tulis ulang judul kendala:',
            });
            return;
          }
          if (body.length > 200) {
            await this.socket.sendMessage(replyJid, {
              text: '⚠️ Judul terlalu panjang. Maksimal 200 karakter.\n\nSilakan tulis ulang judul kendala:',
            });
            return;
          }

          state.data.title = body;
          state.step = 'waiting_category';
          this.setConvTimeout(replyJid);

          // Fetch categories and send as buttons
          try {
            const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
            const catButtons = categories.map((cat) => ({
              id: `cat_${cat.id}`,
              text: cat.name,
            }));

            await this.sendBotButtons(replyJid, {
              text: `✅ Judul: *${body}*\n\nSekarang pilih *kategori* tiket:`,
              footer: 'Pilih kategori yang sesuai dengan kendala Anda',
              buttons: catButtons,
            });
          } catch {
            await this.socket.sendMessage(replyJid, {
              text: '❌ Gagal memuat kategori. Silakan coba lagi nanti.\n\nKetik *menu* untuk kembali.',
            });
            this.conversations.delete(replyJid);
          }
          return;
        }

        case 'waiting_category': {
          // User typed category name manually (fallback if buttons don't work)
          try {
            const categories = await prisma.category.findMany();
            const match = categories.find(
              (c) => c.name.toLowerCase() === cmd || categories.indexOf(c) + 1 === parseInt(body)
            );
            if (match) {
              state.data.category_id = match.id;
              state.data.category_name = match.name;
              state.step = 'waiting_description';
              this.setConvTimeout(replyJid);

              await this.socket.sendMessage(replyJid, {
                text: `✅ Kategori: *${match.name}*\n\nSekarang tulis *deskripsi lengkap* kendala Anda:\n\n_(Minimal 10 karakter)_`,
              });
            } else {
              await this.socket.sendMessage(replyJid, {
                text: '⚠️ Kategori tidak valid. Silakan pilih dari tombol di atas, atau ketik nama kategori:\n\n• Account\n• Hardware\n• Network\n• Software\n• Other',
              });
            }
          } catch {
            await this.socket.sendMessage(replyJid, { text: '❌ Error. Ketik *menu* untuk kembali.' });
            this.conversations.delete(replyJid);
          }
          return;
        }

        case 'waiting_description': {
          if (body.length < 10) {
            await this.socket.sendMessage(replyJid, {
              text: '⚠️ Deskripsi terlalu pendek. Minimal 10 karakter.\n\nSilakan tulis ulang deskripsi kendala:',
            });
            return;
          }

          // Create ticket!
          try {
            const code = generateTicketCode();
            const ticket = await prisma.ticket.create({
              data: {
                code,
                title: state.data.title!,
                description: body,
                status: 'OPEN',
                difficulty_level: 1,
                category_id: state.data.category_id!,
                user_id: state.userId,
              },
            });

            this.conversations.delete(replyJid);

            await this.sendBotButtons(replyJid, {
              text: `✅ *Tiket Berhasil Dibuat!*\n━━━━━━━━━━━━━━━━━━━━━\n\n📋 Kode: *${ticket.code}*\n📝 Judul: ${state.data.title}\n📂 Kategori: ${state.data.category_name}\n📊 Status: *OPEN*\n\nStaff IT akan segera menangani tiket Anda. Anda akan mendapat notifikasi WhatsApp saat ada update.\n━━━━━━━━━━━━━━━━━━━━━`,
              footer: '🤖 IT Helpdesk Bot',
              buttons: [
                { id: 'create_ticket', text: '📝 Buat Tiket Lagi' },
                { id: 'check_status', text: '📋 Cek Status Tiket' },
              ],
            });

            console.log(`[WA Bot] Ticket created: ${ticket.code} by ${state.userName}`);

            // Trigger notification to managers (fire-and-forget)
            try {
              const { sendTicketNotification } = await import('./actions/whatsapp');
              sendTicketNotification('ticket_created', ticket.id).catch(() => {});
            } catch { /* ignore */ }
          } catch (err) {
            console.error('[WA Bot] Create ticket error:', err);
            await this.socket.sendMessage(replyJid, {
              text: '❌ Gagal membuat tiket. Silakan coba lagi nanti.\n\nKetik *menu* untuk kembali.',
            });
            this.conversations.delete(replyJid);
          }
          return;
        }

        case 'waiting_ticket_code': {
          // Search ticket by code
          try {
            const ticket = await prisma.ticket.findFirst({
              where: {
                code: { equals: body.toUpperCase(), mode: 'insensitive' },
                user_id: state.userId,
              },
              include: {
                category: { select: { name: true } },
                staff: { select: { name: true } },
              },
            });

            this.conversations.delete(replyJid);

            if (!ticket) {
              await this.sendBotButtons(replyJid, {
                text: '❌ *Tiket Tidak Ditemukan*\n\nPastikan kode tiket benar dan tiket tersebut milik Anda.\n\n_(Kode tiket contoh: TKT-MO9G0B44-LVE6)_',
                footer: '🤖 IT Helpdesk Bot',
                buttons: [
                  { id: 'check_status', text: '📋 Coba Lagi' },
                  { id: 'create_ticket', text: '📝 Buat Tiket Baru' },
                ],
              });
              return;
            }

            // Format status
            const statusMap: Record<string, string> = {
              OPEN: '🟢 Terbuka',
              IN_PROGRESS: '🔵 Diproses',
              PENDING: '🟡 Tertunda',
              RESOLVED: '🟣 Selesai',
              CLOSED: '⚫ Ditutup',
            };
            const statusLabel = statusMap[ticket.status] || ticket.status;
            const staffName = ticket.staff?.name || 'Belum ditugaskan';
            const createdAt = new Date(ticket.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });

            let detail = `📋 *Detail Tiket*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
            detail += `🔖 Kode: *${ticket.code}*\n`;
            detail += `📝 Judul: ${ticket.title}\n`;
            detail += `📂 Kategori: ${ticket.category.name}\n`;
            detail += `📊 Status: ${statusLabel}\n`;
            detail += `👨‍💻 Staff: ${staffName}\n`;
            detail += `📅 Dibuat: ${createdAt}\n`;

            if (ticket.resolution_note) {
              detail += `\n💡 *Solusi:*\n${ticket.resolution_note}\n`;
            }
            if (ticket.pending_reason) {
              detail += `\n⏳ *Alasan Pending:*\n${ticket.pending_reason}\n`;
            }

            detail += `\n━━━━━━━━━━━━━━━━━━━━━`;

            await this.sendBotButtons(replyJid, {
              text: detail,
              footer: '🤖 IT Helpdesk Bot',
              buttons: [
                { id: 'check_status', text: '📋 Cek Tiket Lain' },
                { id: 'create_ticket', text: '📝 Buat Tiket Baru' },
              ],
            });
          } catch (err) {
            console.error('[WA Bot] Check status error:', err);
            await this.socket.sendMessage(replyJid, {
              text: '❌ Gagal mengecek status. Silakan coba lagi.\n\nKetik *menu* untuk kembali.',
            });
            this.conversations.delete(replyJid);
          }
          return;
        }
      }
    }

    // 7. Default: show main menu
    await this.sendMainMenu(replyJid, user.name);
  }

  // ============================================================
  // CONNECT
  // ============================================================

  async connect() {
    if (this.status === 'connecting' || this.status === 'connected') {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.status = 'connecting';
    this.emit({ type: 'status', data: 'connecting' });
    await this.updateDbStatus('connecting');

    try {
      const { version } = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      const socket = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        version,
        printQRInTerminal: false,
        browser: Browsers.macOS('Chrome'),
        logger,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        retryRequestDelayMs: 300,
        maxMsgRetryCount: 5,
      });

      this.socket = socket;

      // Batched event processing
      socket.ev.process(async (events) => {
        if (events['creds.update']) {
          await saveCreds();
        }

        // Connection state changes
        if (events['connection.update']) {
          const { connection, lastDisconnect, qr } = events['connection.update'];

          if (qr) {
            this.qrCode = qr;
            this.status = 'qr_ready';
            this.emit({ type: 'qr', data: qr });
            this.emit({ type: 'status', data: 'qr_ready' });
            await this.updateDbStatus('qr_ready');
          }

          if (connection === 'close') {
            this.socket = null;
            this.qrCode = null;

            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldClearSession =
              statusCode === DisconnectReason.loggedOut ||
              statusCode === DisconnectReason.multideviceMismatch ||
              statusCode === 403;

            if (shouldClearSession) {
              console.log(`[WA] Session invalidated (reason: ${statusCode}). Clearing auth state.`);
              await this.clearAuthState();
              this.status = 'disconnected';
              this.emit({ type: 'status', data: 'disconnected' });
              this.emit({ type: 'message', data: 'Sesi WhatsApp tidak valid. Silakan scan QR code baru.' });
              await this.updateDbStatus('disconnected');
            } else if (this.isIntentionalDisconnect) {
              this.status = 'disconnected';
              this.emit({ type: 'status', data: 'disconnected' });
              await this.updateDbStatus('disconnected');
            } else {
              console.log(`[WA] Connection lost (reason: ${statusCode}). Reconnecting in 5s...`);
              this.status = 'reconnecting';
              this.emit({ type: 'status', data: 'reconnecting' });
              await this.updateDbStatus('reconnecting');

              if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
              this.reconnectTimer = setTimeout(() => {
                this.status = 'disconnected';
                this.connect();
              }, 5000);
            }
          }

          if (connection === 'open') {
            this.qrCode = null;
            this.status = 'connected';
            console.log('[WA] Connected successfully.');
            this.emit({ type: 'status', data: 'connected' });
            this.emit({ type: 'message', data: 'WhatsApp terhubung.' });
            await this.updateDbStatus('connected');
          }
        }

        // ===== MESSAGE HANDLER (BOT) =====
        if (events['messages.upsert']) {
          const upsert = events['messages.upsert'] as any;
          const messages = upsert.messages || upsert;
          const type = upsert.type || 'notify';

          console.log(`[WA Bot] messages.upsert received: type=${type}, count=${Array.isArray(messages) ? messages.length : 'N/A'}`);

          if (type === 'notify' && Array.isArray(messages)) {
            for (const msg of messages) {
              // LOG FULL RAW MESSAGE
              console.log(`[WA Bot] ========== RAW MESSAGE ==========`);
              console.log(JSON.stringify(msg, null, 2));
              console.log(`[WA Bot] ================================`);

              // Skip invalid messages
              if (!msg.message) continue;
              if (msg.key.fromMe) continue;
              if (msg.key.remoteJid === 'status@broadcast') continue;
              if (msg.key.remoteJid?.endsWith('@g.us')) continue;

              try {
                await this.handleIncomingMessage(msg);
              } catch (err) {
                console.error('[WA Bot] Message handler error:', err);
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('[WA] Connection error:', error);
      this.status = 'disconnected';
      this.emit({ type: 'status', data: 'disconnected' });
      await this.updateDbStatus('disconnected');
    }
  }

  // ============================================================
  // DISCONNECT / LOGOUT
  // ============================================================

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isIntentionalDisconnect = true;

    if (this.socket) {
      try {
        this.socket.end(undefined);
      } catch { /* ignore */ }
      this.socket = null;
    }

    this.qrCode = null;
    this.status = 'disconnected';
    this.emit({ type: 'status', data: 'disconnected' });
    await this.updateDbStatus('disconnected');
  }

  async logout() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isIntentionalDisconnect = true;

    if (this.socket) {
      try {
        await this.socket.logout();
      } catch {
        try { this.socket.end(undefined); } catch { /* ignore */ }
      }
      this.socket = null;
    }

    this.qrCode = null;
    this.status = 'disconnected';
    this.emit({ type: 'status', data: 'disconnected' });
    await this.updateDbStatus('disconnected');
    await this.clearAuthState();
  }

  // ============================================================
  // SEND MESSAGE (for notifications)
  // ============================================================

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.socket || this.status !== 'connected') {
      return false;
    }

    try {
      let jid = phoneNumber.replace(/[^0-9]/g, '');
      if (jid.startsWith('0')) {
        jid = '62' + jid.substring(1);
      }
      jid = jid + '@s.whatsapp.net';

      await this.socket.sendMessage(jid, { text: message });
      return true;
    } catch (error) {
      console.error('[WA] Failed to send message:', error);
      return false;
    }
  }
}

// ============================================================
// SINGLETON + AUTO-RECONNECT
// ============================================================

const AUTH_DIR = path.join(process.cwd(), '.wa-auth');

function checkSessionExists(): boolean {
  try {
    return fs.existsSync(AUTH_DIR) && fs.existsSync(path.join(AUTH_DIR, 'creds.json'));
  } catch {
    return false;
  }
}

const globalForWA = globalThis as unknown as {
  waService: WhatsAppService;
  waAutoReconnectDone?: boolean;
};

if (globalForWA.waService && typeof globalForWA.waService.hasSession !== 'function') {
  globalForWA.waService = new WhatsAppService();
  globalForWA.waAutoReconnectDone = false;
}

export const waService = globalForWA.waService || new WhatsAppService();
if (process.env.NODE_ENV !== 'production') {
  globalForWA.waService = waService;
}

if (typeof globalForWA.waAutoReconnectDone === 'undefined') {
  globalForWA.waAutoReconnectDone = false;
}

if (!globalForWA.waAutoReconnectDone && typeof process !== 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  globalForWA.waAutoReconnectDone = true;

  try {
    if (checkSessionExists() && waService.getStatus() === 'disconnected') {
      console.log('[WA] Found saved session. Auto-reconnecting...');
      waService.connect().catch((err) => {
        console.error('[WA] Auto-reconnect failed:', err);
      });
    }
  } catch {
    // Ignore errors during build/static generation
  }
}
