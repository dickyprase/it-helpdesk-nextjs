'use client';

import { useEffect, useRef, useState, useActionState, useCallback } from 'react';
import { sendMessageAction, sendVoiceNoteAction, type ChatActionResult } from '@/lib/actions/chat';
import { Send, MessageSquare, Loader2, X, Headset, Paperclip, Mic, MicOff, Image as ImageIcon } from 'lucide-react';

type ChatMessage = {
  id: string;
  message: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  attachment_url: string | null;
  attachment_type: string | null;
  is_voice_note: boolean;
};

type Props = {
  ticketId: string;
  sessionUser: { id: string; name: string; role: string };
  initialMessages: ChatMessage[];
  isClosed: boolean;
};

const ROLE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  USER: { label: 'User', bg: 'bg-green-500/20', text: 'text-green-400' },
  STAFF: { label: 'IT Staff', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  MANAGER: { label: 'Manager', bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

const PLACEHOLDER_MESSAGES = new Set([
  'Mengirim foto',
  'Mengirim video',
  'Voice note',
  'Lampiran',
]);

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (isToday) {
    return time;
  }

  const day = date.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const month = monthNames[date.getMonth()];

  return `${day} ${month} ${time}`;
}

function formatRecordingDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FloatingChat({ ticketId, sessionUser, initialMessages, isClosed }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [formKey, setFormKey] = useState(0);

  // Attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Separate action states for message and voice note
  const [msgState, msgFormAction, msgPending] = useActionState<ChatActionResult | null, FormData>(
    sendMessageAction,
    null,
  );

  const [vnState, vnFormAction, vnPending] = useActionState<ChatActionResult | null, FormData>(
    sendVoiceNoteAction,
    null,
  );

  // Keep the ref in sync with isOpen state
  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // SSE connection
  useEffect(() => {
    const eventSource = new EventSource(`/api/chat/${ticketId}/sse`);

    eventSource.onmessage = (event) => {
      try {
        const newMsg: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });

        // Increment unread if panel is closed and message is from someone else
        if (!isOpenRef.current && newMsg.sender_id !== sessionUser.id) {
          setUnreadCount((c) => c + 1);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [ticketId, sessionUser.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset form after successful message send
  useEffect(() => {
    if (msgState?.success) {
      setFormKey((k) => k + 1);
      clearAttachment();
    }
  }, [msgState]);

  // Cleanup file preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  // Cleanup recording resources on unmount or panel close
  const stopRecordingCleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, [stopRecordingCleanup]);

  // Stop recording if panel closes
  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
    }
  }, [isOpen, stopRecordingCleanup]);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  // File selection handler
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('Ukuran file melebihi batas maksimal 100MB');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  }

  function clearAttachment() {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Voice recording handlers
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Submit voice note via form action
        const formData = new FormData();
        formData.append('ticket_id', ticketId);
        formData.append('voice_note', audioBlob, 'voice-note.webm');
        vnFormAction(formData);

        // Cleanup stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      // User denied microphone access or not available
    }
  }

  function stopRecording() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setRecordingDuration(0);
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // Custom form submit to include attachment
  function handleFormSubmit(formData: FormData) {
    if (selectedFile) {
      formData.append('attachment', selectedFile);
    }
    msgFormAction(formData);
  }

  // Determine if message text should be shown for a given message
  function shouldShowMessageText(msg: ChatMessage): boolean {
    if (!msg.attachment_url && !msg.is_voice_note) return true;
    return !PLACEHOLDER_MESSAGES.has(msg.message);
  }

  // Render media content for a message
  function renderMedia(msg: ChatMessage, isOwn: boolean) {
    if (msg.is_voice_note && msg.attachment_url) {
      return (
        <div className="mb-1.5">
          <div className="flex items-center gap-2 mb-1">
            <Mic className={`w-3.5 h-3.5 ${isOwn ? 'text-white/70' : ''}`} style={!isOwn ? { color: 'var(--theme-text-muted)' } : undefined} />
            <span className={`text-xs ${isOwn ? 'text-white/70' : ''}`} style={!isOwn ? { color: 'var(--theme-text-muted)' } : undefined}>
              Voice note
            </span>
          </div>
          <audio
            controls
            src={msg.attachment_url}
            className="w-full max-w-[240px]"
            style={{ height: '36px' }}
          />
        </div>
      );
    }

    if (!msg.attachment_url || !msg.attachment_type) return null;

    if (msg.attachment_type.startsWith('image/')) {
      return (
        <div className="mb-1.5">
          <img
            src={msg.attachment_url}
            alt="Attachment"
            className="rounded-lg max-w-full cursor-pointer"
            style={{ maxHeight: '200px' }}
            onClick={() => window.open(msg.attachment_url!, '_blank')}
          />
        </div>
      );
    }

    if (msg.attachment_type.startsWith('video/')) {
      return (
        <div className="mb-1.5">
          <video
            controls
            src={msg.attachment_url}
            className="rounded-lg max-w-full"
            style={{ maxHeight: '200px' }}
          />
        </div>
      );
    }

    return null;
  }

  const actionError = msgState?.error || vnState?.error;

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[400px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            maxHeight: '70vh',
            background: 'var(--theme-bg-gradient-from)',
            border: '1px solid var(--theme-card-border)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background: 'var(--theme-nav-bg)',
              borderBottom: '1px solid var(--theme-nav-border)',
            }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span
                className="font-semibold text-sm"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Live Chat
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                {messages.length}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3">
                  <MessageSquare className="w-7 h-7 text-blue-400" />
                </div>
                <p
                  className="font-medium text-sm"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Belum ada pesan.
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Mulai percakapan!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === sessionUser.id;
                const roleBadge = ROLE_BADGE[msg.sender_role] ?? ROLE_BADGE.USER;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 shadow-sm ${
                        isOwn
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-sm'
                          : 'rounded-2xl rounded-bl-sm'
                      }`}
                      style={
                        !isOwn
                          ? { background: 'var(--theme-card-bg)' }
                          : undefined
                      }
                    >
                      {/* Sender info */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold ${
                            isOwn ? 'text-white/90' : ''
                          }`}
                          style={
                            !isOwn
                              ? { color: 'var(--theme-text-primary)' }
                              : undefined
                          }
                        >
                          {msg.sender_name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            isOwn
                              ? 'bg-white/20 text-white/80'
                              : `${roleBadge.bg} ${roleBadge.text}`
                          }`}
                        >
                          {roleBadge.label}
                        </span>
                      </div>

                      {/* Media content */}
                      {renderMedia(msg, isOwn)}

                      {/* Message text */}
                      {shouldShowMessageText(msg) && (
                        <p
                          className={`text-sm leading-relaxed whitespace-pre-wrap ${
                            isOwn ? 'text-white' : ''
                          }`}
                          style={
                            !isOwn
                              ? { color: 'var(--theme-text-secondary)' }
                              : undefined
                          }
                        >
                          {msg.message}
                        </p>
                      )}

                      {/* Timestamp */}
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? 'text-white/60 text-right' : ''
                        }`}
                        style={
                          !isOwn
                            ? { color: 'var(--theme-text-muted)' }
                            : undefined
                        }
                      >
                        {formatTimestamp(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div
            className="shrink-0 px-4 py-3"
            style={{
              borderTop: '1px solid var(--theme-card-border)',
              background: 'var(--theme-nav-bg)',
            }}
          >
            {isClosed ? (
              <div className="flex items-center justify-center gap-2 py-2">
                <MessageSquare
                  className="w-4 h-4"
                  style={{ color: 'var(--theme-text-muted)' }}
                />
                <p
                  className="text-sm"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  Chat ditutup
                </p>
              </div>
            ) : (
              <>
                {actionError && (
                  <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400">{actionError}</p>
                  </div>
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-400 font-medium">
                      Merekam... {formatRecordingDuration(recordingDuration)}
                    </span>
                  </div>
                )}

                {/* Attachment preview */}
                {selectedFile && (
                  <div
                    className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--theme-card-bg)',
                      border: '1px solid var(--theme-card-border)',
                    }}
                  >
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                        style={{ background: 'var(--theme-input-bg)' }}
                      >
                        <ImageIcon className="w-5 h-5" style={{ color: 'var(--theme-text-muted)' }} />
                      </div>
                    )}
                    <span
                      className="text-xs truncate flex-1"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={clearAttachment}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Input bar */}
                <form key={formKey} action={handleFormSubmit} className="flex items-center gap-2">
                  <input type="hidden" name="ticket_id" value={ticketId} />

                  {/* Attachment button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRecording}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: 'var(--theme-text-icon)' }}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Text input */}
                  <input
                    type="text"
                    name="message"
                    placeholder={isRecording ? 'Merekam...' : 'Ketik pesan...'}
                    autoComplete="off"
                    disabled={isRecording}
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                    style={{
                      background: 'var(--theme-input-bg)',
                      border: '1px solid var(--theme-input-border)',
                      color: 'var(--theme-text-primary)',
                    }}
                  />

                  {/* Voice note button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={msgPending || vnPending}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isRecording
                        ? 'text-red-500 animate-pulse hover:bg-red-500/10'
                        : 'hover:bg-white/10'
                    }`}
                    style={!isRecording ? { color: 'var(--theme-text-icon)' } : undefined}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={msgPending || vnPending || isRecording}
                    className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {msgPending || vnPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Bubble Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse animation ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 animate-ping opacity-20" />
        )}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all duration-200"
        >
          <Headset className="w-6 h-6" />

          {/* Unread badge */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
