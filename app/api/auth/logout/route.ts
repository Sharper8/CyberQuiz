export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/auth/logout
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
