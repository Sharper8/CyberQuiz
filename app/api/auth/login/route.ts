import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

// POST /api/auth/login (admin login for now)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    console.log('[Auth/login] Login attempt for:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Lookup admin user
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    console.log('[Auth/login] Admin found:', !!admin);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);
    console.log('[Auth/login] Password valid:', passwordValid);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT token
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { email: admin.email, role: admin.role },
      token,
    });
  } catch (error) {
    console.error('[Auth/login] Error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
