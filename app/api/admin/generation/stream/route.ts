/**
 * Real-time generation status streaming via Server-Sent Events
 * Connected admin clients receive live updates about:
 * - Current pool size
 * - Generation progress
 * - Questions being added/reviewed
 */

import { NextResponse } from 'next/server';
import { getGenerationStatus } from '@/lib/services/pool-maintenance';

// Force dynamic rendering - this endpoint requires admin auth at request time
export const dynamic = 'force-dynamic';

// Store connected clients for broadcasting
const connectedClients = new Set<ReadableStreamDefaultController>();

export async function GET(request: Request) {
  // Check admin auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      connectedClients.add(controller);

      // Send initial status
      const initialStatus = getGenerationStatus();
      controller.enqueue(
        `data: ${JSON.stringify({
          type: 'status',
          payload: initialStatus,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      // Send heartbeat every 5 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(`:heartbeat\n\n`);
        } catch (error) {
          clearInterval(heartbeatInterval);
          connectedClients.delete(controller);
        }
      }, 5000);

      // Cleanup on disconnect
      const originalClose = controller.close.bind(controller);
      controller.close = () => {
        clearInterval(heartbeatInterval);
        connectedClients.delete(controller);
        originalClose();
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Broadcast generation update to all connected admin clients
 */
export function broadcastGenerationUpdate(update: {
  type: 'progress' | 'question-added' | 'status-change' | 'error';
  payload: any;
}) {
  const message = `data: ${JSON.stringify({
    ...update,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  connectedClients.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      // Client disconnected, remove from set
      connectedClients.delete(controller);
    }
  });
}
