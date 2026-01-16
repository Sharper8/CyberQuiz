import { NextResponse } from 'next/server';
import { startPoolMaintenance } from '@/lib/services/pool-maintenance';

/**
 * Initialize background services
 * Called once during app startup
 */
export async function POST(request: Request) {
  try {
    console.log('[BackgroundServices] Starting pool maintenance...');
    startPoolMaintenance(120000); // Check pool every 2 minutes
    console.log('[BackgroundServices] ✓ Pool maintenance service started (interval: 2 minutes)');

    return NextResponse.json({ 
      success: true, 
      message: 'Background services started' 
    });
  } catch (error: any) {
    console.error('[BackgroundServices] Failed to start:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
