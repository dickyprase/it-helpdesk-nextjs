import { getSession } from '@/lib/auth';
import { getCategories } from '@/lib/actions/tickets';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/lib/actions/auth';
import { ArrowLeft, LayoutDashboard, LogOut, TicketPlus } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/theme-toggle';
import CreateTicketForm from './create-ticket-form';

export default async function CreateTicketPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const categories = await getCategories();

  return (
    <div className="theme-page">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 theme-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-theme-text-primary tracking-tight">IT Helpdesk</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-theme-text-primary">{session.name}</p>
            </div>
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-card-bg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Link */}
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 text-sm text-theme-text-muted hover:text-theme-text-secondary transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Tiket
        </Link>

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TicketPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-theme-text-primary">Buat Tiket Baru</h1>
            <p className="text-sm text-theme-text-muted mt-1">
              Isi formulir di bawah untuk membuat tiket bantuan IT
            </p>
          </div>
        </div>

        {/* Form Card */}
        <CreateTicketForm categories={categories} />
      </main>
    </div>
  );
}
