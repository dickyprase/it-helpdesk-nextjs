'use server';

import { prisma } from '@/lib/db';
import { getSession, hashPassword, verifyPassword } from '@/lib/auth';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export type ProfileActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ===== GET PROFILE =====

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      created_at: true,
    },
  });
}

// ===== UPDATE PROFILE =====

export async function updateProfileAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  // Check if email is taken by another user
  if (parsed.data.email !== session.email) {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing && existing.id !== session.id) {
      return { success: false, error: 'Email sudah digunakan oleh akun lain' };
    }
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
    },
  });

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard');
  return { success: true };
}

// ===== CHANGE PASSWORD =====

export async function changePasswordAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Anda harus login terlebih dahulu' };
  }

  const raw = {
    currentPassword: formData.get('currentPassword') as string,
    newPassword: formData.get('newPassword') as string,
    confirmNewPassword: formData.get('confirmNewPassword') as string,
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  // Verify current password
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { password_hash: true },
  });

  if (!user) {
    return { success: false, error: 'User tidak ditemukan' };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.password_hash);
  if (!valid) {
    return { success: false, error: 'Password saat ini salah', fieldErrors: { currentPassword: ['Password saat ini salah'] } };
  }

  // Hash and save new password
  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: session.id },
    data: { password_hash: newHash },
  });

  return { success: true };
}
