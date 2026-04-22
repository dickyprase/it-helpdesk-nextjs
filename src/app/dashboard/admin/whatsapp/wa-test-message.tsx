'use client';

import { useActionState, useState } from 'react';
import {
  sendTestMessageAction,
  type WAActionResult,
} from '@/lib/actions/whatsapp';
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
} from 'lucide-react';

export default function WATestMessage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    'Halo! Ini adalah pesan test dari sistem IT Helpdesk. Jika Anda menerima pesan ini, koneksi WhatsApp Gateway berfungsi dengan baik.'
  );

  const [state, formAction, isPending] = useActionState<WAActionResult | null, FormData>(
    async (_prev: WAActionResult | null, formData: FormData) => {
      const result = await sendTestMessageAction(null, formData);
      return result;
    },
    null
  );

  return (
    <div className="space-y-5">
      {/* Feedback */}
      {state?.success && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'rgb(74, 222, 128)' }} />
          <p className="text-sm" style={{ color: 'rgb(74, 222, 128)' }}>
            Pesan berhasil dikirim!
          </p>
        </div>
      )}
      {state?.error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
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
      )}

      <form action={formAction} className="space-y-4">
        {/* Phone Number */}
        <div>
          <label
            htmlFor="test-phone"
            className="block text-sm font-medium text-theme-text-secondary mb-2"
          >
            Nomor WhatsApp Tujuan
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
            <input
              id="test-phone"
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              className="w-full pl-11 pr-4 py-3 rounded-xl theme-input transition-all duration-200"
            />
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Format: 08xx, 628xx, atau +628xx
          </p>
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="test-message"
            className="block text-sm font-medium text-theme-text-secondary mb-2"
          >
            Isi Pesan
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-theme-text-icon" />
            <textarea
              id="test-message"
              name="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan test..."
              className="w-full pl-11 pr-4 py-3 rounded-xl theme-input transition-all duration-200 resize-none"
            />
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            Gunakan *teks* untuk bold, _teks_ untuk italic
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{
            background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241))',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
          }}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isPending ? 'Mengirim...' : 'Kirim Pesan Test'}
        </button>
      </form>
    </div>
  );
}
