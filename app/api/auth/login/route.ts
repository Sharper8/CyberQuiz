import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    // For demo purposes, check against hardcoded admin
    // In production, you'd have a users table
    const isAdmin = email === 'admin@cyberquiz.local' && password === 'admin123';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    });
    
    return NextResponse.json({ 
      success: true, 
      user: { email, role: 'admin' } 
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
