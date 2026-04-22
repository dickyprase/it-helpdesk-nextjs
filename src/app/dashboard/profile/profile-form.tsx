'use client';

import { useActionState, useState } from 'react';
import {
  updateProfileAction,
  changePasswordAction,
  type ProfileActionResult,
} from '@/lib/actions/profile';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Shield,
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

interface ProfileFormProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    role: string;
    created_at: string;
  };
}

function FeedbackMessage({ state, successText }: { state: ProfileActionResult | null; successText: string }) {
  if (!state) return null;
  if (state.success) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
        <p className="text-sm text-green-400">{successText}</p>
      </div>
    );
  }
  if (state.error && !state.fieldErrors) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
        <p className="text-sm text-red-400">{state.error}</p>
      </div>
    );
  }
  return null;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [profileState, profileAction, profilePending] = useActionState<ProfileActionResult | null, FormData>(
    updateProfileAction,
    null,
  );

  const [passwordState, passwordAction, passwordPending] = useActionState<ProfileActionResult | null, FormData>(
    changePasswordAction,
    null,
  );

  const [passwordFormKey, setPasswordFormKey] = useState(0);

  // Reset password form on success
  if (passwordState?.success && passwordFormKey === 0) {
    setPasswordFormKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      {/* Account Info Card */}
      <div className="rounded-2xl p-5 sm:p-6 theme-card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-theme-text-muted" />
          <h2 className="text-sm font-semibold text-theme-text-muted uppercase tracking-wider">
            Informasi Akun
          </h2>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold text-white bg-gradient-to-r ${roleBadgeColor[profile.role]}`}
            >
              {roleLabel[profile.role]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
            <Calendar className="w-4 h-4 text-theme-text-icon" />
            <span>Bergabung {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-2xl p-5 sm:p-8 theme-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-text-primary">
              Edit Profil
            </h2>
            <p className="text-xs text-theme-text-muted">
              Perbarui nama, email, dan nomor WhatsApp Anda
            </p>
          </div>
        </div>

        <FeedbackMessage state={profileState} successText="Profil berhasil diperbarui!" />

        <form action={profileAction} className="space-y-4 mt-4">
          {/* Name */}
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-theme-text-secondary mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
              <input
                id="profile-name"
                name="name"
                type="text"
                defaultValue={profile.name}
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl theme-input transition-all duration-200"
              />
            </div>
            {profileState?.fieldErrors?.name && (
              <p className="mt-1 text-xs text-red-400">{profileState.fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="profile-email" className="block text-sm font-medium text-theme-text-secondary mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
              <input
                id="profile-email"
                name="email"
                type="email"
                defaultValue={profile.email}
                required
                className="w-full pl-11 pr-4 py-2.5 rounded-xl theme-input transition-all duration-200"
              />
            </div>
            {profileState?.fieldErrors?.email && (
              <p className="mt-1 text-xs text-red-400">{profileState.fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-theme-text-secondary mb-1.5">
              No. WhatsApp <span className="text-theme-text-muted font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
              <input
                id="profile-phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone}
                placeholder="08123456789"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl theme-input transition-all duration-200"
              />
            </div>
            <p className="mt-1 text-xs text-theme-text-muted">
              Untuk menerima notifikasi WhatsApp terkait tiket
            </p>
            {profileState?.fieldErrors?.phone && (
              <p className="mt-1 text-xs text-red-400">{profileState.fieldErrors.phone[0]}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={profilePending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
          >
            {profilePending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {profilePending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="rounded-2xl p-5 sm:p-8 theme-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-theme-text-primary">
              Ganti Password
            </h2>
            <p className="text-xs text-theme-text-muted">
              Pastikan password baru minimal 6 karakter
            </p>
          </div>
        </div>

        <FeedbackMessage state={passwordState} successText="Password berhasil diubah!" />

        <form key={passwordFormKey} action={passwordAction} className="space-y-4 mt-4">
          {/* Current Password */}
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-theme-text-secondary mb-1.5">
              Password Saat Ini
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
              <input
                id="current-password"
                name="currentPassword"
                type="password"
                required
                placeholder="Masukkan password saat ini"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl theme-input transition-all duration-200"
              />
            </div>
            {passwordState?.fieldErrors?.currentPassword && (
              <p className="mt-1 text-xs text-red-400">{passwordState.fieldErrors.currentPassword[0]}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-theme-text-secondary mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
              <input
                id="new-password"
                name="newPassword"
                type="password"
                required
                placeholder="Minimal 6 karakter"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl theme-input transition-all duration-200"
              />
            </div>
            {passwordState?.fieldErrors?.newPassword && (
              <p className="mt-1 text-xs text-red-400">{passwordState.fieldErrors.newPassword[0]}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-theme-text-secondary mb-1.5">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
              <input
                id="confirm-new-password"
                name="confirmNewPassword"
                type="password"
                required
                placeholder="Ulangi password baru"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl theme-input transition-all duration-200"
              />
            </div>
            {passwordState?.fieldErrors?.confirmNewPassword && (
              <p className="mt-1 text-xs text-red-400">{passwordState.fieldErrors.confirmNewPassword[0]}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={passwordPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
          >
            {passwordPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            {passwordPending ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
