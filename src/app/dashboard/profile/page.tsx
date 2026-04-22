import { getSession } from '@/lib/auth';
import { getProfile } from '@/lib/actions/profile';
import { logoutAction } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/theme-toggle';
import ProfileForm from './profile-form';
import {
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  UserCog,
} from 'lucide-react';

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

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const profile = await getProfile();
  if (!profile) {
    redirect('/login');
  }

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
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-theme-text-primary">
                {session.name}
              </p>
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r ${roleBadgeColor[session.role]}`}
              >
                {roleLabel[session.role]}
              </span>
            </div>
            <ThemeToggle />
            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-card-bg transition-all duration-200"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <UserCog className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-theme-text-primary">
                Profil Saya
              </h1>
              <p className="text-sm text-theme-text-secondary mt-0.5">
                Kelola informasi akun dan keamanan Anda
              </p>
            </div>
          </div>
        </div>

        <ProfileForm
          profile={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone || '',
            role: profile.role,
            created_at: profile.created_at.toISOString(),
          }}
        />
      </main>
    </div>
  );
}
