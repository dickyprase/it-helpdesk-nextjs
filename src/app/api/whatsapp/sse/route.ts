import { NextRequest } from 'next/server';
import { waService } from '@/lib/whatsapp-singleton';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send current status immediately
      const status = waService.getStatus();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'status', data: status })}\n\n`
        )
      );

      // Send current QR if available
      const qr = waService.getQrCode();
      if (qr) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'qr', data: qr })}\n\n`
          )
        );
      }

      // Subscribe to events
      const unsubscribe = waService.subscribe((event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream closed
        }
      });

      // Keepalive
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

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
