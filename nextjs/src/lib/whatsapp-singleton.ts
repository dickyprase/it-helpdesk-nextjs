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

// Silent logger for Baileys internals (suppress noisy output)
const logger = Pino({ level: 'silent' });

class WhatsAppService {
  private socket: WASocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private qrCode: string | null = null;
  private listeners = new Set<WAEventListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private authDir = path.join(process.cwd(), '.wa-auth');
  private isIntentionalDisconnect = false;

  getStatus() {
    return this.status;
  }

  getQrCode() {
    return this.qrCode;
  }

  /**
   * Check if a saved session exists on disk.
   * Used to auto-reconnect on app startup.
   */
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

  /**
   * Clear the auth session directory (forces fresh QR scan on next connect).
   */
  private async clearAuthState() {
    try {
      const fsp = await import('fs/promises');
      await fsp.rm(this.authDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  /**
   * Connect to WhatsApp.
   * If a saved session exists, it will reconnect automatically without QR.
   * If no session, it will generate a QR code for scanning.
   */
  async connect() {
    if (this.status === 'connecting' || this.status === 'connected') {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.status = 'connecting';
    this.emit({ type: 'status', data: 'connecting' });
    await this.updateDbStatus('connecting');

    try {
      // Fetch latest WA Web version for protocol compatibility
      const { version } = await fetchLatestBaileysVersion();

      // Load or create auth state from file system
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

      // Use batched event processing (inspired by simple-whatsapp-bot)
      socket.ev.process(async (events) => {
        // --- Credential updates: persist session to disk ---
        if (events['creds.update']) {
          await saveCreds();
        }

        // --- Connection state changes ---
        if (events['connection.update']) {
          const { connection, lastDisconnect, qr } = events['connection.update'];

          // QR code received - display for scanning
          if (qr) {
            this.qrCode = qr;
            this.status = 'qr_ready';
            this.emit({ type: 'qr', data: qr });
            this.emit({ type: 'status', data: 'qr_ready' });
            await this.updateDbStatus('qr_ready');
          }

          // Connection closed - determine if we should reconnect or clear session
          if (connection === 'close') {
            this.socket = null;
            this.qrCode = null;

            const statusCode = (lastDisconnect?.error as Boom)?.output
              ?.statusCode;

            // These reasons mean the session is invalid - clear auth and stop
            const shouldClearSession =
              statusCode === DisconnectReason.loggedOut ||
              statusCode === DisconnectReason.multideviceMismatch ||
              statusCode === 403;

            if (shouldClearSession) {
              console.log(
                `[WA] Session invalidated (reason: ${statusCode}). Clearing auth state.`
              );
              await this.clearAuthState();
              this.status = 'disconnected';
              this.emit({ type: 'status', data: 'disconnected' });
              this.emit({
                type: 'message',
                data: 'Sesi WhatsApp tidak valid. Silakan scan QR code baru.',
              });
              await this.updateDbStatus('disconnected');
            } else if (this.isIntentionalDisconnect) {
              // User clicked "Putuskan" - don't reconnect, but KEEP session
              this.status = 'disconnected';
              this.emit({ type: 'status', data: 'disconnected' });
              await this.updateDbStatus('disconnected');
            } else {
              // Unexpected disconnect - auto-reconnect after delay
              console.log(
                `[WA] Connection lost (reason: ${statusCode}). Reconnecting in 5s...`
              );
              this.status = 'reconnecting';
              this.emit({ type: 'status', data: 'reconnecting' });
              await this.updateDbStatus('reconnecting');

              if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
              this.reconnectTimer = setTimeout(() => {
                this.status = 'disconnected'; // Reset so connect() proceeds
                this.connect();
              }, 5000);
            }
          }

          // Connection opened successfully
          if (connection === 'open') {
            this.qrCode = null;
            this.status = 'connected';
            console.log('[WA] Connected successfully.');
            this.emit({ type: 'status', data: 'connected' });
            this.emit({
              type: 'message',
              data: 'WhatsApp terhubung.',
            });
            await this.updateDbStatus('connected');
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

  /**
   * Disconnect from WhatsApp but KEEP the session.
   * Next time connect() is called, it will reconnect using the saved session
   * without requiring a new QR scan.
   */
  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isIntentionalDisconnect = true;

    if (this.socket) {
      try {
        // end() closes the WebSocket without logging out
        this.socket.end(undefined);
      } catch {
        // ignore
      }
      this.socket = null;
    }

    this.qrCode = null;
    this.status = 'disconnected';
    this.emit({ type: 'status', data: 'disconnected' });
    await this.updateDbStatus('disconnected');
  }

  /**
   * Logout from WhatsApp AND clear the session.
   * This forces a fresh QR scan on next connect().
   */
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
        try {
          this.socket.end(undefined);
        } catch {
          // ignore
        }
      }
      this.socket = null;
    }

    this.qrCode = null;
    this.status = 'disconnected';
    this.emit({ type: 'status', data: 'disconnected' });
    await this.updateDbStatus('disconnected');

    // Clear auth state - forces fresh QR scan
    await this.clearAuthState();
  }

  /**
   * Send a text message to a phone number.
   * Phone number can be in any format: 08xx, +62xx, 62xx
   */
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.socket || this.status !== 'connected') {
      return false;
    }

    try {
      // Format phone number: strip non-digits, convert leading 0 to 62 (Indonesia)
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

  /**
   * Send a message with a link preview.
   */
  async sendMessageWithPreview(
    phoneNumber: string,
    message: string
  ): Promise<boolean> {
    if (!this.socket || this.status !== 'connected') {
      return false;
    }

    try {
      let jid = phoneNumber.replace(/[^0-9]/g, '');
      if (jid.startsWith('0')) {
        jid = '62' + jid.substring(1);
      }
      jid = jid + '@s.whatsapp.net';

      await this.socket.sendMessage(jid, {
        text: message,
      });
      return true;
    } catch (error) {
      console.error('[WA] Failed to send message with preview:', error);
      return false;
    }
  }
}

// Standalone session check — doesn't depend on the class instance,
// so it works even when globalThis holds a stale object after hot-reload.
const AUTH_DIR = path.join(process.cwd(), '.wa-auth');

function checkSessionExists(): boolean {
  try {
    return (
      fs.existsSync(AUTH_DIR) &&
      fs.existsSync(path.join(AUTH_DIR, 'creds.json'))
    );
  } catch {
    return false;
  }
}

// Singleton pattern - persists across hot reloads in dev
const globalForWA = globalThis as unknown as {
  waService: WhatsAppService;
  waAutoReconnectDone?: boolean;
};

// If the cached instance is from an older version of the class (missing new
// methods after a hot-reload), replace it with a fresh instance.
if (globalForWA.waService && typeof globalForWA.waService.hasSession !== 'function') {
  globalForWA.waService = new WhatsAppService();
  globalForWA.waAutoReconnectDone = false;
}

export const waService = globalForWA.waService || new WhatsAppService();
if (process.env.NODE_ENV !== 'production') {
  globalForWA.waService = waService;
}

// Auto-reconnect on startup if a saved session exists.
// The flag prevents re-running on every hot-reload in dev.
if (!globalForWA.waAutoReconnectDone) {
  globalForWA.waAutoReconnectDone = true;

  if (checkSessionExists() && waService.getStatus() === 'disconnected') {
    console.log('[WA] Found saved session. Auto-reconnecting...');
    waService.connect().catch((err) => {
      console.error('[WA] Auto-reconnect failed:', err);
    });
  }
}
