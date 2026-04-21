import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import { prisma } from './db';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'qr_ready';

type WAEventListener = (event: {
  type: 'qr' | 'status' | 'message';
  data: string;
}) => void;

class WhatsAppService {
  private socket: WASocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private qrCode: string | null = null;
  private listeners = new Set<WAEventListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private authDir = path.join(process.cwd(), '.wa-auth');

  getStatus() {
    return this.status;
  }

  getQrCode() {
    return this.qrCode;
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

  async connect() {
    if (this.status === 'connecting' || this.status === 'connected') {
      return;
    }

    this.status = 'connecting';
    this.emit({ type: 'status', data: 'connecting' });
    await this.updateDbStatus('connecting');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      const socket = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, undefined as any),
        },
        printQRInTerminal: false,
        browser: ['IT Helpdesk', 'Chrome', '1.0.0'],
      });

      this.socket = socket;

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.status = 'qr_ready';
          this.emit({ type: 'qr', data: qr });
          this.emit({ type: 'status', data: 'qr_ready' });
          await this.updateDbStatus('qr_ready');
        }

        if (connection === 'close') {
          this.qrCode = null;
          const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

          if (reason === DisconnectReason.loggedOut) {
            this.status = 'disconnected';
            this.emit({ type: 'status', data: 'disconnected' });
            await this.updateDbStatus('disconnected');
            // Clear auth to allow fresh QR scan
            const fs = await import('fs/promises');
            await fs.rm(this.authDir, { recursive: true, force: true });
          } else {
            // Auto-reconnect after 5 seconds
            this.status = 'disconnected';
            this.emit({ type: 'status', data: 'reconnecting' });
            await this.updateDbStatus('reconnecting');

            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.connect();
            }, 5000);
          }
        }

        if (connection === 'open') {
          this.qrCode = null;
          this.status = 'connected';
          this.emit({ type: 'status', data: 'connected' });
          await this.updateDbStatus('connected');
        }
      });
    } catch (error) {
      this.status = 'disconnected';
      this.emit({ type: 'status', data: 'disconnected' });
      await this.updateDbStatus('disconnected');
    }
  }

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        await this.socket.logout();
      } catch {
        this.socket.end(undefined);
      }
      this.socket = null;
    }

    this.qrCode = null;
    this.status = 'disconnected';
    this.emit({ type: 'status', data: 'disconnected' });
    await this.updateDbStatus('disconnected');

    // Clear auth
    try {
      const fs = await import('fs/promises');
      await fs.rm(this.authDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.socket || this.status !== 'connected') {
      return false;
    }

    try {
      // Format phone number: ensure it starts with country code and ends with @s.whatsapp.net
      let jid = phoneNumber.replace(/[^0-9]/g, '');
      if (jid.startsWith('0')) {
        jid = '62' + jid.substring(1); // Indonesian default
      }
      jid = jid + '@s.whatsapp.net';

      await this.socket.sendMessage(jid, { text: message });
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton
const globalForWA = globalThis as unknown as { waService: WhatsAppService };
export const waService = globalForWA.waService || new WhatsAppService();
if (process.env.NODE_ENV !== 'production') {
  globalForWA.waService = waService;
}
