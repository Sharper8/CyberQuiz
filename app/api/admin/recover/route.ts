export const dynamic = 'force-dynamic';


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RecoverSchema = z.object({
    email: z.string().email(),
    recoveryCode: z.string().min(1),
    newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = RecoverSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Données invalides' },
                { status: 400 }
            );
        }

        const { email, recoveryCode, newPassword } = validation.data;

        // 1. Verify Recovery Code
        const configuredCode = process.env.ADMIN_RECOVERY_CODE;
        if (!configuredCode || recoveryCode !== configuredCode) {
            return NextResponse.json(
                { error: 'Code de récupération invalide' },
                { status: 403 }
            );
        }

        // 2. Find Admin User
        const admin = await prisma.adminUser.findUnique({
            where: { email },
        });

        if (!admin) {
            return NextResponse.json(
                { error: 'Administrateur non trouvé' },
                { status: 404 }
            );
        }

        // 3. Update Password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.adminUser.update({
            where: { email },
            data: { passwordHash },
        });

        return NextResponse.json(
            { message: 'Mot de passe mis à jour avec succès' },
            { status: 200 }
        );

    } catch (error) {
        console.error('[API/admin/recover] Error:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
