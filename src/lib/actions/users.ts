'use server';

import { prisma } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { adminCreateUserSchema, adminUpdateUserSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export type UserActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ===== GET USERS =====

export async function getUsers() {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') return [];

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      is_active: true,
      created_at: true,
      _count: {
        select: {
          tickets: true,
          handled_tickets: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
}

// ===== GET USER BY ID =====

export async function getUserById(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') return null;

  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      is_active: true,
      created_at: true,
    },
  });
}

// ===== CREATE USER =====

export async function createUserAction(
  _prevState: UserActionResult | null,
  formData: FormData
): Promise<UserActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola user' };
  }

  const raw = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    role: formData.get('role') as string,
  };

  const parsed = adminCreateUserSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { success: false, error: 'Email sudah terdaftar' };
  }

  const hashedPassword = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      password_hash: hashedPassword,
      role: parsed.data.role as any,
    },
  });

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

// ===== UPDATE USER =====

export async function updateUserAction(
  _prevState: UserActionResult | null,
  formData: FormData
): Promise<UserActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola user' };
  }

  const raw = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    role: formData.get('role') as string,
  };

  const parsed = adminUpdateUserSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { success: false, error: 'Validasi gagal', fieldErrors };
  }

  // Prevent editing own role
  if (parsed.data.id === session.id) {
    return { success: false, error: 'Anda tidak dapat mengubah role diri sendiri' };
  }

  // Check email uniqueness (exclude current user)
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing && existing.id !== parsed.data.id) {
    return { success: false, error: 'Email sudah digunakan oleh akun lain' };
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      role: parsed.data.role as any,
    },
  });

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}

// ===== TOGGLE USER ACTIVE =====

export async function toggleUserActiveAction(
  _prevState: UserActionResult | null,
  formData: FormData
): Promise<UserActionResult> {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    return { success: false, error: 'Hanya Manager yang dapat mengelola user' };
  }

  const userId = formData.get('user_id') as string;
  if (!userId) {
    return { success: false, error: 'ID user tidak valid' };
  }

  // Prevent deactivating self
  if (userId === session.id) {
    return { success: false, error: 'Anda tidak dapat menonaktifkan diri sendiri' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: 'User tidak ditemukan' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { is_active: !user.is_active },
  });

  // If deactivating, destroy all their sessions
  if (user.is_active) {
    await prisma.session.deleteMany({ where: { user_id: userId } });
  }

  revalidatePath('/dashboard/admin/users');
  return { success: true };
}
