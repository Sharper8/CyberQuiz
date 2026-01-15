
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

const prisma = new PrismaClient();

const CreateAdminSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

// GET /api/admin/users - List all admins
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const adminId = await verifyAdminToken(request);
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admins = await prisma.adminUser.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(admins);
    } catch (error) {
        console.error('[API/admin/users] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST /api/admin/users - Create new admin
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const adminId = await verifyAdminToken(request);
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validation = CreateAdminSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const { email, password } = validation.data;

        // Check if exists
        const existing = await prisma.adminUser.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newAdmin = await prisma.adminUser.create({
            data: {
                email,
                passwordHash,
                role: 'admin',
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(newAdmin, { status: 201 });
    } catch (error) {
        console.error('[API/admin/users] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
// PUT /api/admin/users - Update admin password
export async function PUT(request: NextRequest) {
    try {
        // Verify authentication
        const adminId = await verifyAdminToken(request);
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { targetAdminId, newPassword } = body;

        if (!targetAdminId || !newPassword || newPassword.length < 8) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Optional: Check if the requester is allowed to update this user
        // For now, any admin can update any admin (simple model)

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.adminUser.update({
            where: { id: targetAdminId },
            data: { passwordHash },
        });

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('[API/admin/users] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
