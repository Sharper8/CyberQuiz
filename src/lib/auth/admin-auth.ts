import { NextRequest } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRY = '8h';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn('[Admin Auth] JWT_SECRET not set or too short (min 32 chars)');
}

/**
 * Verify admin JWT token from request
 * Checks Authorization header for "Bearer <token>"
 */
export async function verifyAdminToken(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId: number;
      exp: number;
    };

    // Verify admin still exists
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId },
    });

    if (!admin) {
      return null;
    }

    return decoded.adminId;
  } catch (error) {
    console.error('[Admin Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Generate JWT token for admin login
 */
export function generateAdminToken(adminId: number): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRY,
  };
  
  return jwt.sign(
    {
      adminId,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    options
  );
}

/**
 * Verify admin password
 * In production, use bcryptjs
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ adminId: number; email: string } | null> {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return null;
    }

    // TODO: Use bcryptjs.compare(password, admin.passwordHash)
    // For now, simple comparison
    if (password !== admin.passwordHash) {
      return null;
    }

    return {
      adminId: admin.id,
      email: admin.email,
    };
  } catch (error) {
    console.error('[Admin Auth] Credential verification failed:', error);
    return null;
  }
}
