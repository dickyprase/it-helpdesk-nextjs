import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="theme-page flex items-center justify-center">
      <div className="max-w-md w-full px-4 text-center">
        <div className="rounded-2xl p-8 theme-card">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-theme-text-primary mb-2">
            404
          </h1>
          <h2 className="text-lg font-semibold text-theme-text-primary mb-2">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-sm text-theme-text-secondary mb-6">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
