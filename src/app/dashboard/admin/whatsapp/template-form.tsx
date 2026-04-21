'use client';

import { useActionState, useState } from 'react';
import {
  upsertTemplate,
  deleteTemplate,
  type WAActionResult,
} from '@/lib/actions/whatsapp';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Tag,
  FileText,
  Variable,
} from 'lucide-react';

const EVENT_TYPES = [
  { value: 'ticket_created', label: 'Tiket Dibuat' },
  { value: 'ticket_assigned', label: 'Tiket Ditugaskan' },
  { value: 'ticket_in_progress', label: 'Tiket Diproses' },
  { value: 'ticket_pending', label: 'Tiket Pending' },
  { value: 'ticket_resolved', label: 'Tiket Diselesaikan' },
  { value: 'ticket_closed', label: 'Tiket Ditutup' },
];

const SAMPLE_VARS: Record<string, string> = {
  'id-ticket': 'TKT-ABC123',
  'judul-ticket': 'Laptop tidak bisa connect WiFi',
  'nama-user': 'John Doe',
  'nama-staff': 'IT Support',
  'status-akhir': 'RESOLVED',
  'kategori': 'Hardware',
};

interface Template {
  id: string;
  event_type: string;
  template_body: string;
  variables: string;
}

interface TemplateFormProps {
  templates: Template[];
}

function getEventLabel(eventType: string): string {
  const found = EVENT_TYPES.find((e) => e.value === eventType);
  return found ? found.label : eventType;
}

function substitutePreview(template: string): string {
  let result = template;
  for (const [key, value] of Object.entries(SAMPLE_VARS)) {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  }
  return result;
}

function FeedbackMessage({ state }: { state: WAActionResult | null }) {
  if (!state) return null;
  if (state.success) {
    return (
      <div
        className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
        style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'rgb(74, 222, 128)' }} />
        <p className="text-sm" style={{ color: 'rgb(74, 222, 128)' }}>
          Berhasil disimpan
        </p>
      </div>
    );
  }
  if (state.error) {
    return (
      <div
        className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'rgb(248, 113, 113)' }} />
        <p className="text-sm" style={{ color: 'rgb(248, 113, 113)' }}>
          {state.error}
        </p>
      </div>
    );
  }
  return null;
}

export default function TemplateForm({ templates }: TemplateFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewBody, setPreviewBody] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [upsertState, upsertFormAction, upsertPending] = useActionState<WAActionResult | null, FormData>(
    async (prev: WAActionResult | null, formData: FormData) => {
      const result = await upsertTemplate(prev, formData);
      if (result.success) {
        setShowForm(false);
        setEditingTemplate(null);
        setPreviewBody('');
      }
      return result;
    },
    null
  );

  function handleEdit(template: Template) {
    setEditingTemplate(template);
    setPreviewBody(template.template_body);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingTemplate(null);
    setPreviewBody('');
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingTemplate(null);
    setPreviewBody('');
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteTemplate(id);
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Template List */}
      {templates.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            backgroundColor: 'var(--theme-option-bg)',
          }}
        >
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--theme-text-muted)', opacity: 0.5 }} />
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Belum ada template notifikasi. Klik tombol di bawah untuk menambahkan.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const eventLabel = getEventLabel(template.event_type);
            const variables = template.variables
              ? template.variables.split(',').map((v) => v.trim()).filter(Boolean)
              : [];

            return (
              <div
                key={template.id}
                className="rounded-xl p-5 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--theme-option-bg)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Event Type Badge */}
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                      style={{
                        background: 'linear-gradient(to right, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
                        color: 'rgb(165, 180, 252)',
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      {eventLabel}
                    </span>

                    {/* Template Body Preview */}
                    <p
                      className="text-sm leading-relaxed mb-2"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      {template.template_body.length > 150
                        ? template.template_body.substring(0, 150) + '...'
                        : template.template_body}
                    </p>

                    {/* Variables */}
                    {variables.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {variables.map((v) => (
                          <span
                            key={v}
                            className="inline-block px-2 py-0.5 rounded text-[11px] font-mono"
                            style={{
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              color: 'rgb(74, 222, 128)',
                              border: '1px solid rgba(34, 197, 94, 0.2)',
                            }}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(template)}
                      className="p-2 rounded-lg transition-all duration-200"
                      style={{ color: 'var(--theme-text-muted)' }}
                      title="Edit template"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                      className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                      style={{ color: 'rgb(248, 113, 113)' }}
                      title="Hapus template"
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg"
          style={{
            background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241))',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
          }}
        >
          <Plus className="w-4 h-4" />
          Tambah Template Baru
        </button>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--theme-form-card-bg, var(--theme-option-bg))',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-lg font-semibold"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {editingTemplate ? 'Edit Template' : 'Tambah Template Baru'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 rounded-lg transition-all duration-200"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form action={upsertFormAction} className="space-y-5">
            {/* Hidden ID for editing */}
            {editingTemplate && (
              <input type="hidden" name="id" value={editingTemplate.id} />
            )}

            {/* Event Type */}
            <div>
              <label
                htmlFor="event_type"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: 'var(--theme-text-icon)' }} />
                  Tipe Event
                </span>
              </label>
              <select
                id="event_type"
                name="event_type"
                required
                defaultValue={editingTemplate?.event_type || ''}
                className="w-full px-4 py-3 rounded-xl transition-all duration-200 appearance-none theme-input"
              >
                <option value="" disabled>
                  Pilih tipe event...
                </option>
                {EVENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label} ({et.value})
                  </option>
                ))}
              </select>
            </div>

            {/* Template Body */}
            <div>
              <label
                htmlFor="template_body"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: 'var(--theme-text-icon)' }} />
                  Isi Template
                </span>
              </label>
              <textarea
                id="template_body"
                name="template_body"
                required
                rows={5}
                defaultValue={editingTemplate?.template_body || ''}
                onChange={(e) => setPreviewBody(e.target.value)}
                placeholder="Contoh: Halo [nama-user], tiket [id-ticket] telah dibuat dengan kategori [kategori]."
                className="w-full px-4 py-3 rounded-xl transition-all duration-200 resize-none theme-input"
              />
              <p className="mt-1.5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Gunakan variabel dalam kurung siku, contoh: [nama-user], [id-ticket]
              </p>
            </div>

            {/* Variables */}
            <div>
              <label
                htmlFor="variables"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                <span className="flex items-center gap-2">
                  <Variable className="w-4 h-4" style={{ color: 'var(--theme-text-icon)' }} />
                  Variabel (pisahkan dengan koma)
                </span>
              </label>
              <input
                id="variables"
                name="variables"
                type="text"
                defaultValue={editingTemplate?.variables || ''}
                placeholder="[id-ticket],[nama-user],[kategori]"
                className="w-full px-4 py-3 rounded-xl transition-all duration-200 theme-input"
              />
              <p className="mt-1.5 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Variabel tersedia: [id-ticket], [judul-ticket], [nama-user], [nama-staff], [status-akhir], [kategori]
              </p>
            </div>

            {/* Preview */}
            {previewBody && (
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4" style={{ color: 'rgb(74, 222, 128)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(74, 222, 128)' }}>
                    Preview
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--theme-text-primary)' }}
                >
                  {substitutePreview(previewBody)}
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={upsertPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241))',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
                }}
              >
                {upsertPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {editingTemplate ? 'Simpan Perubahan' : 'Simpan Template'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color: 'var(--theme-text-secondary)',
                  backgroundColor: 'var(--theme-option-bg)',
                }}
              >
                Batal
              </button>
            </div>

            <FeedbackMessage state={upsertState} />
          </form>
        </div>
      )}
    </div>
  );
}
