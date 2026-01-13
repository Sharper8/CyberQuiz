import { prisma } from './src/lib/db/prisma';

async function checkDb() {
  try {
    const adminCount = await prisma.adminUser.count();
    const sessionCount = await prisma.quizSession.count();
    const questionCount = await prisma.question.count();
    const scoreCount = await prisma.score.count();
    
    console.log('📊 Statistiques de la Base de Données:');
    console.log('=====================================');
    console.log('✅ Utilisateurs admin:', adminCount);
    console.log('✅ Sessions de quiz:', sessionCount);
    console.log('✅ Questions:', questionCount);
    console.log('✅ Scores:', scoreCount);
    console.log('');
    
    const admins = await prisma.adminUser.findMany();
    console.log('👤 Utilisateurs Admin enregistrés:');
    admins.forEach(admin => {
      console.log(`   - Email: ${admin.email}`);
    });
    console.log('');
    
    const sessions = await prisma.quizSession.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log('🎮 Dernières Sessions de Quiz:');
    sessions.forEach(session => {
      console.log(`   - ID: ${session.id} | Username: ${session.username} | Status: ${session.status}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkDb();
