// In-memory event emitter for SSE chat broadcasting
// Each ticket has a set of listeners (SSE connections)

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

type Listener = (msg: ChatMessage) => void;

class ChatEmitter {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(ticketId: string, listener: Listener) {
    if (!this.listeners.has(ticketId)) {
      this.listeners.set(ticketId, new Set());
    }
    this.listeners.get(ticketId)!.add(listener);

    return () => {
      const set = this.listeners.get(ticketId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(ticketId);
        }
      }
    };
  }

  emit(ticketId: string, msg: ChatMessage) {
    const set = this.listeners.get(ticketId);
    if (set) {
      for (const listener of set) {
        listener(msg);
      }
    }
  }
}

// Singleton
const globalForChat = globalThis as unknown as { chatEmitter: ChatEmitter };
export const chatEmitter =
  globalForChat.chatEmitter || new ChatEmitter();
if (process.env.NODE_ENV !== 'production') {
  globalForChat.chatEmitter = chatEmitter;
}
