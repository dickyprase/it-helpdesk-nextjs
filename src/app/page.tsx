import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="theme-page flex items-center justify-center">
      <main className="container mx-auto px-4 py-16">
        <div className="theme-form-card rounded-2xl p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-theme-text-primary">
            IT Helpdesk System
          </h1>
          <p className="text-lg text-theme-text-secondary mb-8">
            Sistem manajemen tiket IT dengan WhatsApp Gateway terintegrasi
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-theme-text-primary theme-card rounded-xl transition-all duration-200 hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              Daftar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
