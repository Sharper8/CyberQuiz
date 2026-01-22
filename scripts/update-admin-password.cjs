const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

process.env.DATABASE_URL = 'postgresql://cyberquiz:changeme@localhost:5432/cyberquiz';

const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📍 Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    const newHash = await bcrypt.hash('password123', 10);
    console.log('🔐 Generated hash:', newHash.substring(0, 29) + '...');
    
    const updated = await prisma.adminUser.update({
      where: { email: 'admin@cyberquiz.fr' },
      data: { passwordHash: newHash }
    });
    
    console.log('✅ Updated admin user:', updated.email);
    
    // Verify immediately
    const admin = await prisma.adminUser.findUnique({
      where: { email: 'admin@cyberquiz.fr' }
    });
    
    const isValid = await bcrypt.compare('password123', admin.passwordHash);
    console.log('✔️  Password verification:', isValid);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
