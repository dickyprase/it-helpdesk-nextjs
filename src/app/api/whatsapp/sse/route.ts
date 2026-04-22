import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { waService } from '@/lib/whatsapp-singleton';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Auth: only MANAGER can access WA SSE
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const status = waService.getStatus();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'status', data: status })}\n\n`
        )
      );

      const qr = waService.getQrCode();
      if (qr) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'qr', data: qr })}\n\n`
          )
        );
      }

      const unsubscribe = waService.subscribe((event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // stream closed
        }
      });

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 30000);

      request.signal.addEventListener('abort', () => {
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
