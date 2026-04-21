import { NextRequest } from 'next/server';
import { chatEmitter } from '@/lib/chat-emitter';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Subscribe to new messages for this ticket
      const unsubscribe = chatEmitter.subscribe(ticketId, (msg) => {
        const data = JSON.stringify(msg);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Keepalive every 30s to prevent timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

      // Cleanup on close
      _request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
