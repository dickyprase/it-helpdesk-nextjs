import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid')
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid')
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .max(20, 'Nomor HP maksimal 20 karakter')
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  confirmPassword: z
    .string()
    .min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// Ticket Validations
export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Judul minimal 5 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(5000, 'Deskripsi maksimal 5000 karakter'),
  category_id: z
    .string()
    .min(1, 'Kategori wajib dipilih'),
});

export const updateTicketStatusSchema = z.object({
  ticket_id: z.string().min(1, 'ID tiket wajib diisi'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'], {
    error: 'Status tidak valid',
  }),
});

export const claimTicketSchema = z.object({
  ticket_id: z.string().min(1, 'ID tiket wajib diisi'),
});

export const assignTicketSchema = z.object({
  ticket_id: z.string().min(1, 'ID tiket wajib diisi'),
  staff_id: z.string().min(1, 'Staff wajib dipilih'),
});

export const resolveTicketSchema = z.object({
  ticket_id: z.string().min(1, 'ID tiket wajib diisi'),
  resolution_note: z
    .string()
    .min(10, 'Arahan/nasehat minimal 10 karakter')
    .max(5000, 'Arahan/nasehat maksimal 5000 karakter'),
});

export const pendingTicketSchema = z.object({
  ticket_id: z.string().min(1, 'ID tiket wajib diisi'),
  pending_reason: z
    .string()
    .min(5, 'Alasan pending minimal 5 karakter')
    .max(2000, 'Alasan pending maksimal 2000 karakter'),
});

export const setDifficultySchema = z.object({
  ticket_id: z.string().min(1, 'ID tiket wajib diisi'),
  difficulty_level: z
    .number()
    .int()
    .min(1, 'Level kesulitan minimal 1')
    .max(3, 'Level kesulitan maksimal 3'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type ClaimTicketInput = z.infer<typeof claimTicketSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type ResolveTicketInput = z.infer<typeof resolveTicketSchema>;
export type PendingTicketInput = z.infer<typeof pendingTicketSchema>;
export type SetDifficultyInput = z.infer<typeof setDifficultySchema>;

// Chat Validations
export const sendMessageSchema = z.object({
  ticket_id: z.string().min(1, 'ID tiket wajib diisi'),
  message: z
    .string()
    .min(1, 'Pesan tidak boleh kosong')
    .max(2000, 'Pesan maksimal 2000 karakter'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
