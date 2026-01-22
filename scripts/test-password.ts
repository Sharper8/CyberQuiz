import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cyberquiz.fr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  WARNING: ADMIN_EMAIL and ADMIN_PASSWORD should be set in environment variables');
}

async function testPassword() {
  const admin = await prisma.adminUser.findUnique({
    where: { email: ADMIN_EMAIL }
  });

  if (!admin) {
    console.log('❌ Admin user not found');
    return;
  }

  console.log('✅ Admin found:', admin.email);
  console.log('📝 Stored hash:', admin.passwordHash);
  
  const testPassword = ADMIN_PASSWORD;
  const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
  
  console.log(`🔐 Testing password:`, isValid);
  
  // Create a fresh hash for testing
  const freshHash = await bcrypt.hash(testPassword, 10);
  console.log('🆕 Fresh hash:', freshHash);
  const freshValid = await bcrypt.compare(testPassword, freshHash);
  console.log('🔐 Fresh hash valid:', freshValid);
  
  // Update admin with fresh hash
  console.log('🔄 Updating admin with fresh hash...');
  await prisma.adminUser.update({
    where: { email: ADMIN_EMAIL },
    data: { passwordHash: freshHash }
  });
  console.log('✅ Admin password updated');
}

testPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
