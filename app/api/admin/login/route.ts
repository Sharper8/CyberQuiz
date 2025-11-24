import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, generateAdminToken } from '@/lib/auth/admin-auth';
import { logAuthEvent } from '@/lib/logging/logger';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * POST /api/admin/login
 * Authenticate admin and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid credentials format' },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Verify admin credentials
    const admin = await verifyAdminCredentials(email, password);
    if (!admin) {
      logAuthEvent('failed-login', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateAdminToken(admin.adminId);

    logAuthEvent('login', email);

    return NextResponse.json(
      {
        token,
        adminId: admin.adminId,
        email: admin.email,
        message: 'Logged in successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API/admin/login] Error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
