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
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        questionText: true,
        generationDomain: true,
        generationSkillType: true,
        generationDifficulty: true,
        generationGranularity: true,
        status: true
      },
      take: 10
    });
    
    console.log('\n📝 First 10 questions with metadata:');
    questions.forEach((q, i) => {
      const hasMetadata = q.generationDomain || q.generationSkillType || q.generationDifficulty || q.generationGranularity;
      console.log(`\n${i+1}. ID ${q.id} (Status: ${q.status}) - Has Metadata: ${hasMetadata ? '✅' : '❌'}`);
      if (hasMetadata) {
        console.log(`   Domain: ${q.generationDomain}`);
        console.log(`   Skill: ${q.generationSkillType}`);
        console.log(`   Difficulty: ${q.generationDifficulty}`);
        console.log(`   Granularity: ${q.generationGranularity}`);
      }
    });
    
    const withMetadata = await prisma.question.count({
      where: {
        OR: [
          { generationDomain: { not: null } },
          { generationSkillType: { not: null } },
          { generationDifficulty: { not: null } },
          { generationGranularity: { not: null } }
        ]
      }
    });
    
    console.log(`\n\n📊 Total questions with metadata: ${withMetadata}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

check();
