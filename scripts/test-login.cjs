const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  const email = 'admin@cyberquiz.fr';
  const password = 'uh1gM*PZ^h^cNg';
  
  console.log('Testing login for:', email);
  
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    console.log('❌ Admin not found');
    process.exit(1);
  }
  
  const valid = await bcrypt.compare(password, admin.passwordHash);
  console.log('✅ Admin found:', admin.email);
  console.log('✅ Password valid:', valid);
  console.log('✅ Admin role:', admin.role);
  
  await prisma.$disconnect();
}

testLogin().catch(console.error);
