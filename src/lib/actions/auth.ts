'use server';

import { prisma } from '@/lib/db';
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
  cleanupExpiredSessions,
} from '@/lib/auth';
import { loginSchema, registerSchema } from '@/lib/validations';
import { loginLimiter, registerLimiter } from '@/lib/rate-limit';
import { redirect } from 'next/navigation';

export type AuthActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  // Rate limit by email
  const rl = loginLimiter.check(parsed.data.email.toLowerCase());
  if (!rl.allowed) {
    return { success: false, error: 'Terlalu banyak percobaan login. Coba lagi nanti.' };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return { success: false, error: 'Email atau password salah' };
  }

  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) {
    return { success: false, error: 'Email atau password salah' };
  }

  await createSession(user.id);

  // Periodically clean up expired sessions (piggyback on login)
  cleanupExpiredSessions().catch(() => {});

  redirect('/dashboard');
}

export async function registerAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  // Rate limit registration
  const rl = registerLimiter.check(parsed.data.email.toLowerCase());
  if (!rl.allowed) {
    return { success: false, error: 'Terlalu banyak percobaan registrasi. Coba lagi nanti.' };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { success: false, error: 'Email sudah terdaftar' };
  }

  const hashedPassword = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      password_hash: hashedPassword,
      role: 'USER',
    },
  });

  await createSession(user.id);
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}
