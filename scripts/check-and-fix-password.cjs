const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://cyberquiz:changeme@localhost:5432/cyberquiz';

const prisma = new PrismaClient({
  datasources: {
    db: { url: DATABASE_URL }
  }
});

async function checkAndFix() {
  try {
    console.log('📍 Using DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
    
    // Get current admin
    const admin = await prisma.adminUser.findUnique({
      where: { email: 'admin@cyberquiz.fr' }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      await prisma.$disconnect();
      return;
    }
    
    console.log('\n📧 Admin email:', admin.email);
    console.log('🔐 Current hash:', admin.passwordHash);
    console.log('📏 Hash length:', admin.passwordHash.length);
    
    // Test current password
    const testPassword = 'password';
    console.log('\n🔄 Setting password to:', testPassword);
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('🔐 New hash:', newHash);
    
    // Update database
    await prisma.adminUser.update({
      where: { email: 'admin@cyberquiz.fr' },
      data: { passwordHash: newHash }
    });
    
    console.log('✅ Updated admin password hash');
    
    // Verify new hash
    const verification = await bcrypt.compare(testPassword, newHash);
    console.log('✔️  Verification:', verification);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAndFix();
