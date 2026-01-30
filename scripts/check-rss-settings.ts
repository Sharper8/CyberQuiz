import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.generationSettings.findFirst();
  
  if (!settings) {
    console.log('❌ No generation settings found');
    return;
  }
  
  console.log('\n📊 Current RSS Settings:');
  console.log('  rssEnabled:', settings.rssEnabled);
  console.log('  useRssAsContext:', settings.useRssAsContext);
  
  // If rssEnabled is false, set it to true
  if (!settings.rssEnabled) {
    console.log('\n🔧 Enabling RSS...');
    await prisma.generationSettings.update({
      where: { id: settings.id },
      data: {
        rssEnabled: true,
        useRssAsContext: true,
      },
    });
    console.log('✅ RSS settings updated to enabled');
  } else {
    console.log('✅ RSS is already enabled');
  }
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
