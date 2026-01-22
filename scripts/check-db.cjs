const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://cyberquiz:changeme@localhost:5432/cyberquiz'
    }
  }
});

async function check() {
  try {
    const count = await prisma.question.count();
    console.log('Total questions:', count);
    
    const corrupted = await prisma.question.findMany({
      where: {
        questionText: {
          contains: 'Mots de passe'
        }
      },
      select: { id: true, questionText: true }
    });
    
    if (corrupted.length > 0) {
      console.log('\n❌ Found corrupted questions:');
      corrupted.forEach(q => {
        console.log(`\nID ${q.id}:\n${q.questionText.substring(0, 200)}`);
      });
    } else {
      console.log('✅ No corrupted questions found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

check();
