'use client';

import { useEffect, useState, useActionState } from 'react';
import {
  connectWAAction,
  disconnectWAAction,
  logoutWAAction,
  toggleWANotifications,
  type WAActionResult,
} from '@/lib/actions/whatsapp';
import {
  Wifi,
  WifiOff,
  Loader2,
  Power,
  PowerOff,
  LogOut,
  Bell,
  BellOff,
  AlertCircle,
  CheckCircle2,
  QrCode,
  HardDrive,
} from 'lucide-react';

interface WAConnectionProps {
  initialStatus: string;
  isEnabled: boolean;
  hasSession?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; pulse: boolean }> = {
  disconnected: {
    label: 'Terputus',
    color: 'rgb(239, 68, 68)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    pulse: false,
  },
  connecting: {
    label: 'Menghubungkan...',
    color: 'rgb(234, 179, 8)',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    pulse: true,
  },
  reconnecting: {
    label: 'Menghubungkan Ulang...',
    color: 'rgb(234, 179, 8)',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    pulse: true,
  },
  qr_ready: {
    label: 'QR Code Siap',
    color: 'rgb(59, 130, 246)',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    pulse: false,
  },
  connected: {
    label: 'Terhubung',
    color: 'rgb(34, 197, 94)',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    pulse: false,
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;
}

async function connectAction(): Promise<WAActionResult> {
  return connectWAAction();
}

async function disconnectAction(): Promise<WAActionResult> {
  return disconnectWAAction();
}

async function logoutAction(): Promise<WAActionResult> {
  return logoutWAAction();
}

async function toggleAction(): Promise<WAActionResult> {
  return toggleWANotifications();
}

function FeedbackMessage({ state }: { state: WAActionResult | null }) {
  if (!state) return null;
  if (state.success) {
    return (
      <div
        className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'rgb(74, 222, 128)' }} />
        <p className="text-sm" style={{ color: 'rgb(74, 222, 128)' }}>
          Berhasil
        </p>
      </div>
    );
  }
  if (state.error) {
    return (
      <div
        className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'rgb(248, 113, 113)' }} />
        <p className="text-sm" style={{ color: 'rgb(248, 113, 113)' }}>
          {state.error}
        </p>
      </div>
    );
  }
  return null;
}

export default function WAConnection({ initialStatus, isEnabled, hasSession: initialHasSession }: WAConnectionProps) {
  const [status, setStatus] = useState(initialStatus);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(isEnabled);
  const [hasSession, setHasSession] = useState(initialHasSession ?? false);
  const [message, setMessage] = useState<string | null>(null);

  const [connectState, connectFormAction, connectPending] = useActionState<WAActionResult | null, FormData>(
    async (_prev: WAActionResult | null) => {
      const result = await connectAction();
      return result;
    },
    null
  );

  const [disconnectState, disconnectFormAction, disconnectPending] = useActionState<WAActionResult | null, FormData>(
    async (_prev: WAActionResult | null) => {
      const result = await disconnectAction();
      return result;
    },
    null
  );

  const [logoutState, logoutFormAction, logoutPending] = useActionState<WAActionResult | null, FormData>(
    async (_prev: WAActionResult | null) => {
      const result = await logoutAction();
      if (result.success) {
        setHasSession(false);
      }
      return result;
    },
    null
  );

  const [toggleState, toggleFormAction, togglePending] = useActionState<WAActionResult | null, FormData>(
    async (_prev: WAActionResult | null) => {
      const result = await toggleAction();
      if (result.success) {
        setNotifEnabled((prev) => !prev);
      }
      return result;
    },
    null
  );

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/whatsapp/sse');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'status') {
          setStatus(parsed.data);
          // Clear QR when connected or disconnected
          if (parsed.data === 'connected' || parsed.data === 'disconnected') {
            setQrCode(null);
          }
          // When connected, we know session exists
          if (parsed.data === 'connected') {
            setHasSession(true);
          }
        } else if (parsed.type === 'qr') {
          setQrCode(parsed.data);
        } else if (parsed.type === 'message') {
          setMessage(parsed.data);
          // Auto-clear message after 5 seconds
          setTimeout(() => setMessage(null), 5000);
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const config = getStatusConfig(status);
  const isDisconnected = status === 'disconnected';
  const isConnected = status === 'connected';

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl"
        style={{ backgroundColor: config.bgColor }}
      >
        <div className="relative">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          {config.pulse && (
            <div
              className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: config.color, opacity: 0.5 }}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-5 h-5" style={{ color: config.color }} />
          ) : (
            <WifiOff className="w-5 h-5" style={{ color: config.color }} />
          )}
          <span className="font-semibold" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Session Indicator */}
      {isDisconnected && hasSession && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <HardDrive className="w-4 h-4 shrink-0" style={{ color: 'rgb(96, 165, 250)' }} />
          <p className="text-sm" style={{ color: 'rgb(96, 165, 250)' }}>
            Sesi tersimpan. Klik &quot;Hubungkan&quot; untuk terhubung kembali tanpa scan QR.
          </p>
        </div>
      )}

      {/* System Message */}
      {message && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            border: '1px solid rgba(107, 114, 128, 0.2)',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            {message}
          </p>
        </div>
      )}

      {/* QR Code Display */}
      {status === 'qr_ready' && qrCode && (
        <div
          className="rounded-xl p-6 text-center"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-5 h-5" style={{ color: 'rgb(96, 165, 250)' }} />
            <p className="text-sm font-medium" style={{ color: 'rgb(96, 165, 250)' }}>
              Scan QR code ini dengan WhatsApp Anda
            </p>
          </div>
          <div className="inline-block p-4 rounded-xl" style={{ backgroundColor: 'white' }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`}
              alt="WhatsApp QR Code"
              width={256}
              height={256}
              className="block"
            />
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Buka WhatsApp &gt; Menu &gt; Perangkat Tertaut &gt; Tautkan Perangkat
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Connect Button */}
        {!isConnected && (
          <form action={connectFormAction}>
            <button
              type="submit"
              disabled={connectPending || status === 'connecting' || status === 'reconnecting'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))',
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
              }}
            >
              {connectPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              Hubungkan
            </button>
          </form>
        )}

        {/* Disconnect Button (keeps session) */}
        {isConnected && (
          <form action={disconnectFormAction}>
            <button
              type="submit"
              disabled={disconnectPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: 'linear-gradient(to right, rgb(234, 179, 8), rgb(202, 138, 4))',
                boxShadow: '0 4px 14px rgba(234, 179, 8, 0.25)',
              }}
            >
              {disconnectPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PowerOff className="w-4 h-4" />
              )}
              Putuskan
            </button>
          </form>
        )}

        {/* Logout Button (clears session) */}
        {(isConnected || (isDisconnected && hasSession)) && (
          <form action={logoutFormAction}>
            <button
              type="submit"
              disabled={logoutPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)',
              }}
            >
              {logoutPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Logout WA
            </button>
          </form>
        )}

        {/* Toggle Notifications */}
        <form action={toggleFormAction}>
          <button
            type="submit"
            disabled={togglePending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            style={{
              background: notifEnabled
                ? 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))'
                : 'linear-gradient(to right, rgb(107, 114, 128), rgb(75, 85, 99))',
              boxShadow: notifEnabled
                ? '0 4px 14px rgba(34, 197, 94, 0.25)'
                : '0 4px 14px rgba(107, 114, 128, 0.25)',
            }}
          >
            {togglePending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : notifEnabled ? (
              <Bell className="w-4 h-4" />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
            Notifikasi: {notifEnabled ? 'Aktif' : 'Nonaktif'}
          </button>
        </form>
      </div>

      {/* Disconnect vs Logout explanation */}
      <div className="text-xs space-y-1" style={{ color: 'var(--theme-text-muted)' }}>
        <p><strong>Putuskan</strong>: Memutus koneksi tapi sesi tetap tersimpan. Bisa terhubung kembali tanpa scan QR.</p>
        <p><strong>Logout WA</strong>: Menghapus sesi sepenuhnya. Perlu scan QR baru untuk terhubung kembali.</p>
      </div>

      {/* Action Feedback */}
      <FeedbackMessage state={connectState} />
      <FeedbackMessage state={disconnectState} />
      <FeedbackMessage state={logoutState} />
      <FeedbackMessage state={toggleState} />
    </div>
  );
}
