'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="theme-page flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="rounded-2xl p-8 theme-card text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-theme-text-primary mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-sm text-theme-text-secondary mb-6">
            {error.message || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.'}
          </p>
          <button
            onClick={unstable_retry}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
