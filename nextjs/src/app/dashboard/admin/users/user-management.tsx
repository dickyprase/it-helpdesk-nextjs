'use client';

import { useState, useActionState } from 'react';
import {
  createUserAction,
  updateUserAction,
  toggleUserActiveAction,
  type UserActionResult,
} from '@/lib/actions/users';
import {
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Save,
} from 'lucide-react';

type SerializedUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  _count: { tickets: number; handled_tickets: number };
};

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

function FeedbackMessage({ state }: { state: UserActionResult | null }) {
  if (!state) return null;
  if (state.success) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
        <p className="text-sm text-green-400">Berhasil!</p>
      </div>
    );
  }
  if (state.error && !state.fieldErrors) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
        <p className="text-sm text-red-400">{state.error}</p>
      </div>
    );
  }
  return null;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

interface Props {
  users: SerializedUser[];
  currentUserId: string;
}

export default function UserManagement({ users, currentUserId }: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SerializedUser | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);

  const [createState, createAction, createPending] = useActionState<UserActionResult | null, FormData>(
    async (_prev: UserActionResult | null, formData: FormData) => {
      const result = await createUserAction(null, formData);
      if (result.success) {
        setCreateFormKey((k) => k + 1);
      }
      return result;
    },
    null,
  );

  const [updateState, updateAction, updatePending] = useActionState<UserActionResult | null, FormData>(
    async (_prev: UserActionResult | null, formData: FormData) => {
      const result = await updateUserAction(null, formData);
      if (result.success) {
        setEditingUser(null);
      }
      return result;
    },
    null,
  );

  const [toggleState, toggleAction, togglePending] = useActionState<UserActionResult | null, FormData>(
    toggleUserActiveAction,
    null,
  );

  return (
    <div className="space-y-6">
      {/* Toggle feedback */}
      <FeedbackMessage state={toggleState} />

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-muted">{users.length} user terdaftar</p>
        <button
          type="button"
          onClick={() => { setShowCreateForm(true); setEditingUser(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 transition-all duration-200 shadow-lg shadow-teal-500/25"
        >
          <Plus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="rounded-2xl p-5 sm:p-6 theme-card border border-teal-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme-text-primary">Tambah User Baru</h3>
            <button type="button" onClick={() => setShowCreateForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-theme-text-muted" aria-label="Tutup form">
              <X className="w-4 h-4" />
            </button>
          </div>

          <FeedbackMessage state={createState} />

          <form key={createFormKey} action={createAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label htmlFor="create-name" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="create-name" name="name" type="text" required placeholder="Nama lengkap" className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
                {createState?.fieldErrors?.name && <p className="mt-1 text-xs text-red-400">{createState.fieldErrors.name[0]}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="create-email" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="create-email" name="email" type="email" required placeholder="email@contoh.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
                {createState?.fieldErrors?.email && <p className="mt-1 text-xs text-red-400">{createState.fieldErrors.email[0]}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="create-phone" className="block text-sm font-medium text-theme-text-secondary mb-1.5">No. WhatsApp <span className="text-theme-text-muted font-normal">(opsional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="create-phone" name="phone" type="tel" placeholder="08123456789" className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="create-role" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <select id="create-role" name="role" required className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input appearance-none cursor-pointer">
                    <option value="USER">User</option>
                    <option value="STAFF">IT Staff</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="create-password" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="create-password" name="password" type="password" required placeholder="Minimal 6 karakter" className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
                {createState?.fieldErrors?.password && <p className="mt-1 text-xs text-red-400">{createState.fieldErrors.password[0]}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="create-confirm" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="create-confirm" name="confirmPassword" type="password" required placeholder="Ulangi password" className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
                {createState?.fieldErrors?.confirmPassword && <p className="mt-1 text-xs text-red-400">{createState.fieldErrors.confirmPassword[0]}</p>}
              </div>
            </div>

            <button type="submit" disabled={createPending} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/25">
              {createPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {createPending ? 'Membuat...' : 'Buat User'}
            </button>
          </form>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingUser && (
        <div className="rounded-2xl p-5 sm:p-6 theme-card border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme-text-primary">Edit User: {editingUser.name}</h3>
            <button type="button" onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-theme-text-muted" aria-label="Tutup form">
              <X className="w-4 h-4" />
            </button>
          </div>

          <FeedbackMessage state={updateState} />

          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="id" value={editingUser.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="edit-name" name="name" type="text" required defaultValue={editingUser.name} className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
                {updateState?.fieldErrors?.name && <p className="mt-1 text-xs text-red-400">{updateState.fieldErrors.name[0]}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="edit-email" name="email" type="email" required defaultValue={editingUser.email} className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
                {updateState?.fieldErrors?.email && <p className="mt-1 text-xs text-red-400">{updateState.fieldErrors.email[0]}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-theme-text-secondary mb-1.5">No. WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <input id="edit-phone" name="phone" type="tel" defaultValue={editingUser.phone || ''} placeholder="08123456789" className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-theme-text-secondary mb-1.5">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
                  <select id="edit-role" name="role" required defaultValue={editingUser.role} className="w-full pl-10 pr-4 py-2.5 rounded-xl theme-input appearance-none cursor-pointer" disabled={editingUser.id === currentUserId}>
                    <option value="USER">User</option>
                    <option value="STAFF">IT Staff</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                {editingUser.id === currentUserId && <p className="mt-1 text-xs text-theme-text-muted">Tidak dapat mengubah role diri sendiri</p>}
              </div>
            </div>

            <button type="submit" disabled={updatePending} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25">
              {updatePending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {updatePending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      )}

      {/* User List */}
      <div className="space-y-2">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <div key={u.id} className={`rounded-xl p-4 sm:p-5 theme-card ${!u.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm bg-gradient-to-br ${roleBadgeColor[u.role]}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-theme-text-primary truncate">{u.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold text-white bg-gradient-to-r ${roleBadgeColor[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                    {!u.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-400">Nonaktif</span>
                    )}
                    {isSelf && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/20 text-blue-400">Anda</span>
                    )}
                  </div>
                  <p className="text-xs text-theme-text-muted truncate">{u.email}{u.phone ? ` | ${u.phone}` : ''}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-theme-text-muted">
                    <span>{u._count.tickets} tiket dibuat</span>
                    <span>{u._count.handled_tickets} tiket ditangani</span>
                    <span>Sejak {formatDate(u.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditingUser(u); setShowCreateForm(false); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-theme-text-muted hover:text-blue-400"
                    title="Edit user"
                    aria-label={`Edit ${u.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {!isSelf && (
                    <form action={toggleAction}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <button
                        type="submit"
                        disabled={togglePending}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
                          u.is_active
                            ? 'hover:bg-red-500/10 text-theme-text-muted hover:text-red-400'
                            : 'hover:bg-green-500/10 text-theme-text-muted hover:text-green-400'
                        }`}
                        title={u.is_active ? 'Nonaktifkan user' : 'Aktifkan user'}
                        aria-label={u.is_active ? `Nonaktifkan ${u.name}` : `Aktifkan ${u.name}`}
                      >
                        {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
