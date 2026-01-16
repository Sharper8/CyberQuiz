/**
 * Background service initializer
 * Starts the question pool maintenance service
 */
import { startPoolMaintenance } from '@/lib/services/pool-maintenance';

// Start the background maintenance service
// Runs every 2 minutes to check and maintain pool
export function initializeBackgroundServices() {
  console.log('[BackgroundServices] Initializing...');
  
  // Start pool maintenance (check every 2 minutes)
  startPoolMaintenance(120000); // 2 minutes
  
  console.log('[BackgroundServices] Started pool maintenance service');
}
