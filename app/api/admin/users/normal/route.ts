export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyAdminToken } from '@/lib/auth/admin-auth';

// GET /api/admin/users/normal - List all normal users (players)
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const adminId = await verifyAdminToken(request);
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch unique usernames from QuizSession
        // We group by username to get unique users and their stats
        const users = await prisma.quizSession.groupBy({
            by: ['username'],
            _count: {
                id: true, // Total sessions
            },
            _max: {
                createdAt: true, // Last played
                score: true, // Best score
            },
            orderBy: {
                _max: {
                    createdAt: 'desc',
                },
            },
        });

        // Format the response
        const formattedUsers = users.map(user => ({
            username: user.username,
            totalGames: user._count.id,
            lastPlayed: user._max.createdAt,
            bestScore: user._max.score,
        }));

        return NextResponse.json(formattedUsers);
    } catch (error) {
        console.error('[API/admin/users/normal] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
