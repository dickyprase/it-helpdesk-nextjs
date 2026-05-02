'use client';

import { useActionState } from 'react';
import { loginAction, type AuthActionResult } from '@/lib/actions/auth';
import Link from 'next/link';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';

export default function LoginPage() {
  const [state, formAction, isPending] =
    useActionState<AuthActionResult | null, FormData>(loginAction, null);

  return (
    <div className="theme-page flex items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-theme-orb-1 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-theme-orb-2 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-theme-orb-3 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '2s' }}
      />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-theme-text-primary tracking-tight">
            IT Helpdesk
          </h1>
          <p className="text-theme-text-secondary mt-2">Masuk ke akun Anda</p>
        </div>

        {/* Login Card */}
        <div className="theme-form-card rounded-2xl p-8">
          {/* Error Alert */}
          {state?.error && !state.fieldErrors && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{state.error}</p>
            </div>
          )}

          <form action={formAction} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-theme-text-secondary mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nama@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl theme-input transition-all duration-200"
                />
              </div>
              {state?.fieldErrors?.email && (
                <p className="mt-1.5 text-xs text-red-400">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-theme-text-secondary mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl theme-input transition-all duration-200"
                />
              </div>
              {state?.fieldErrors?.password && (
                <p className="mt-1.5 text-xs text-red-400">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        {/* Register Link */}
        <p className="text-center mt-6 text-sm text-theme-text-muted">
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="text-blue-500 hover:text-blue-400 font-medium transition-colors duration-200"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
