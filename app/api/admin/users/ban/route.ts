export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

// GET /api/admin/users/ban - List all banned users
export async function GET(request: NextRequest) {
    try {
        const adminId = await verifyAdminToken(request);
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bannedUsers = await prisma.bannedUser.findMany({
            orderBy: { bannedAt: 'desc' },
        });

        return NextResponse.json(bannedUsers);
    } catch (error) {
        console.error('[API/admin/users/ban] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// POST /api/admin/users/ban - Ban a user
export async function POST(request: NextRequest) {
    try {
        const adminId = await verifyAdminToken(request);
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { username, reason } = body;

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Check if already banned
        const existing = await prisma.bannedUser.findUnique({
            where: { username },
        });

        if (existing) {
            return NextResponse.json({ error: 'User already banned' }, { status: 409 });
        }

        // Get admin email for "bannedBy"
        const admin = await prisma.adminUser.findUnique({
            where: { id: adminId },
            select: { email: true },
        });

        const bannedUser = await prisma.bannedUser.create({
            data: {
                username,
                reason,
                bannedBy: admin?.email || 'Unknown',
            },
        });

        return NextResponse.json(bannedUser, { status: 201 });
    } catch (error) {
        console.error('[API/admin/users/ban] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// DELETE /api/admin/users/ban - Unban a user
export async function DELETE(request: NextRequest) {
    try {
        const adminId = await verifyAdminToken(request);
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        await prisma.bannedUser.delete({
            where: { username },
        });

        return NextResponse.json({ message: 'User unbanned successfully' });
    } catch (error) {
        console.error('[API/admin/users/ban] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
