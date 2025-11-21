import { prisma } from '../src/lib/db/prisma';

async function verify() {
  const admin = await prisma.adminUser.findUnique({ where: { email: 'admin@cyberquiz.fr' } });
  console.log('Admin lookup result:', admin);
  await prisma.$disconnect();
}

verify().catch(e => { console.error(e); process.exit(1); });
