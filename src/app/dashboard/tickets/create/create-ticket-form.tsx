'use client';

import { useActionState } from 'react';
import { createTicketAction, type TicketActionResult } from '@/lib/actions/tickets';
import { useState } from 'react';
import {
  Type,
  FolderOpen,
  FileText,
  AlertCircle,
  Loader2,
  Send,
  Paperclip,
} from 'lucide-react';

type Category = { id: string; name: string; description: string | null };

interface CreateTicketFormProps {
  categories: Category[];
}

export default function CreateTicketForm({ categories }: CreateTicketFormProps) {
  const [state, formAction, isPending] = useActionState<TicketActionResult | null, FormData>(
    createTicketAction,
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  return (
    <div className="rounded-2xl p-8 theme-form-card">
      {/* General Error Alert */}
      {state?.error && !state.fieldErrors && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Judul */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-theme-text-secondary mb-2">
            Judul
          </label>
          <div className="relative">
            <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Contoh: Laptop tidak bisa connect WiFi"
              className="w-full pl-11 pr-4 py-3 rounded-xl theme-input transition-all duration-200"
            />
          </div>
          {state?.fieldErrors?.title && (
            <p className="mt-1.5 text-xs text-red-400">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Kategori */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-theme-text-secondary mb-2">
            Kategori
          </label>
          <div className="relative">
            <FolderOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon" />
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue=""
              className="w-full pl-11 pr-4 py-3 rounded-xl theme-input transition-all duration-200 appearance-none"
            >
              <option value="" disabled className="bg-theme-option-bg text-theme-text-muted">
                Pilih kategori...
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-theme-option-bg text-theme-text-primary">
                  {cat.name}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-theme-text-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {state?.fieldErrors?.category_id && (
            <p className="mt-1.5 text-xs text-red-400">{state.fieldErrors.category_id[0]}</p>
          )}
        </div>

        {/* Deskripsi */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-theme-text-secondary mb-2">
            Deskripsi
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-theme-text-icon" />
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="Jelaskan masalah Anda secara detail..."
              className="w-full pl-11 pr-4 py-3 rounded-xl theme-input transition-all duration-200 resize-none"
            />
          </div>
          {state?.fieldErrors?.description && (
            <p className="mt-1.5 text-xs text-red-400">{state.fieldErrors.description[0]}</p>
          )}
        </div>

        {/* Lampiran */}
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-1">
            <span className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-theme-text-icon" />
              Lampiran (Opsional)
            </span>
          </label>
          <p className="text-xs text-theme-text-muted mb-2">Upload gambar atau video (maks. 50MB per file)</p>
          <input
            type="file"
            name="attachments"
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              setSelectedFiles(e.target.files ? Array.from(e.target.files) : []);
            }}
            className="w-full px-4 py-3 rounded-xl theme-input transition-all duration-200 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
          />
          {selectedFiles.length > 0 && (
            <p className="mt-1.5 text-xs text-theme-text-muted">
              {selectedFiles.length} file dipilih: {selectedFiles.map((f) => f.name).join(', ')}
            </p>
          )}
        </div>

        {/* Submit Button */}
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
              <Send className="w-4 h-4" />
              Buat Tiket
            </>
          )}
        </button>
      </form>
    </div>
  );
}
