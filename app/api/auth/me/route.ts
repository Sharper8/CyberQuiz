import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/auth/me - Check if user is authenticated
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    const decoded = jwt.verify(token.value, JWT_SECRET) as any;
    
    return NextResponse.json({ 
      authenticated: true, 
      user: { email: decoded.email, role: decoded.role } 
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
