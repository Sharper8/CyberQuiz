/**
 * Background service initializer
 * Industrial-grade buffer maintenance is triggered on-demand,
 * not via polling. This file is kept for future background tasks.
 */
import { ensureBufferFilled } from './buffer-maintenance';

export function initializeBackgroundServices() {
  console.log('[BackgroundServices] Industrial-grade buffer system active');
  console.log('[BackgroundServices] Buffer refills trigger automatically on question review');
  
  // The new buffer-maintenance.ts system is event-driven:
  // - Triggers when questions are accepted/rejected
  // - Queues generation jobs asynchronously
  // - No polling needed
  
  // Initial buffer fill on startup (non-blocking)
  setTimeout(() => {
    ensureBufferFilled().catch(err => {
      console.error('[BackgroundServices] Initial buffer fill failed:', err);
    });
  }, 5000); // Wait 5 seconds after startup
}
