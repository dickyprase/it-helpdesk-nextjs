import { getSession } from '@/lib/auth';
import { logoutAction } from '@/lib/actions/auth';
import { getWASettings, getTemplates, getWAStatus } from '@/lib/actions/whatsapp';
import ThemeToggle from '@/components/ui/theme-toggle';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Settings,
  Wifi,
  FileText,
  SendHorizonal,
} from 'lucide-react';
import WAConnection from './wa-connection';
import WATestMessage from './wa-test-message';
import TemplateForm from './template-form';

const roleBadgeColor: Record<string, string> = {
  USER: 'from-green-500 to-emerald-600',
  STAFF: 'from-blue-500 to-cyan-600',
  MANAGER: 'from-purple-500 to-pink-600',
};

const roleLabel: Record<string, string> = {
  USER: 'User',
  STAFF: 'IT Staff',
  MANAGER: 'Manager',
};

export default async function WhatsAppAdminPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'MANAGER') {
    redirect('/dashboard');
  }

  const [settings, templates, waStatus] = await Promise.all([
    getWASettings(),
    getTemplates(),
    getWAStatus(),
  ]);

  const serializedTemplates = templates.map((t) => ({
    id: t.id,
    event_type: t.event_type,
    template_body: t.template_body,
    variables: t.variables,
  }));

  return (
    <div className="theme-page">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 theme-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-theme-text-primary tracking-tight">
                IT Helpdesk
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-theme-text-primary">
                {user.name}
              </p>
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r ${roleBadgeColor[user.role]}`}
              >
                {roleLabel[user.role]}
              </span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-theme-text-muted hover:text-theme-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-theme-text-primary">
                WhatsApp Gateway
              </h1>
              <p className="text-theme-text-secondary mt-0.5">
                Kelola koneksi WhatsApp dan template notifikasi
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Koneksi WhatsApp */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 theme-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-theme-text-primary">
                Koneksi WhatsApp
              </h2>
              <p className="text-sm text-theme-text-muted">
                Status koneksi saat ini:{' '}
                <span className="font-medium">{settings.connection_status}</span>
              </p>
            </div>
          </div>

          <WAConnection
            initialStatus={settings.connection_status}
            isEnabled={settings.is_enabled}
            hasSession={waStatus.hasSession}
          />
        </div>

        {/* Section 2: Test Pesan */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 theme-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <SendHorizonal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-theme-text-primary">
                Test Pesan WhatsApp
              </h2>
              <p className="text-sm text-theme-text-muted">
                Kirim pesan test untuk memastikan koneksi berfungsi
              </p>
            </div>
          </div>

          <WATestMessage />
        </div>

        {/* Section 3: Template Notifikasi */}
        <div className="rounded-2xl p-6 sm:p-8 theme-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-theme-text-primary">
                Template Notifikasi
              </h2>
              <p className="text-sm text-theme-text-muted">
                Kelola template pesan untuk setiap event tiket
              </p>
            </div>
          </div>

          <TemplateForm templates={serializedTemplates} />
        </div>
      </main>
    </div>
  );
}
