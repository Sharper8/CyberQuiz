import { prisma } from '../src/lib/db/prisma';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cyberquiz.fr';

async function verify() {
  const admin = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  console.log('Admin lookup result:', admin);
  await prisma.$disconnect();
}

verify().catch(e => { console.error(e); process.exit(1); });
