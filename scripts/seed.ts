import { prisma } from '../src/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Pre-seed database with themed cybersecurity questions
 * Runs on first deployment or manual invocation
 * All questions use "Vrai"/"Faux" (French) for standardized options and answers
 *
 * Usage: npx ts-node scripts/seed.ts
 */

const SEED_QUESTIONS = [
  // Easy - Authentication
  {
    questionText: 'Un mot de passe fort doit contenir au moins 12 caractères.',
    correctAnswer: 'Vrai',
    difficulty: new Decimal(0.2),
    category: 'Authentification',
    explanation: 'Les meilleures pratiques recommandent des mots de passe de 12+ caractères pour résister aux attaques par force brute.',
    mitreTechniques: ['T1110'],
    tags: ['password', 'authentication', 'security-basics'],
  },
  {
    questionText: 'Les réseaux WiFi publics offrent la même sécurité que les réseaux privés.',
    correctAnswer: 'Faux',
    difficulty: new Decimal(0.15),
    category: 'Sécurité Réseau',
    explanation: 'Le WiFi public est vulnérable aux attaques man-in-the-middle. Utilisez toujours un VPN sur les réseaux publics.',
    mitreTechniques: ['T1557'],
    tags: ['wifi', 'network', 'security-basics'],
  },

  // Medium - Malware & Attacks
  {
    questionText: 'Les rançongiciels chiffrent toujours les fichiers immédiatement après l\'infection.',
    correctAnswer: 'Faux',
    difficulty: new Decimal(0.5),
    category: 'Maliciels',
    explanation: 'Certaines familles de rançongiciels restent dormantes pour éviter la détection avant le chiffrement.',
    mitreTechniques: ['T1486'],
    tags: ['ransomware', 'malware', 'tactics'],
  },
  {
    questionText: 'Les attaques par injection SQL ne peuvent cibler que les bases de données SQL.',
    correctAnswer: 'Faux',
    difficulty: new Decimal(0.55),
    category: 'Sécurité Web',
    explanation: 'Bien que l\'injection SQL cible les bases de données, des attaques d\'injection similaires fonctionnent sur divers systèmes.',
    mitreTechniques: ['T1190'],
    tags: ['injection', 'web-security', 'vulnerabilities'],
  },

  // Hard - Advanced Topics
  {
    questionText: 'Dans une architecture sans confiance (zero-trust), tout le trafic réseau est considéré comme non fiable par défaut.',
    correctAnswer: 'Vrai',
    difficulty: new Decimal(0.8),
    category: 'Architecture Réseau',
    explanation: 'Zero-trust suppose une violation et vérifie chaque demande d\'accès, quel que soit l\'emplacement du réseau.',
    mitreTechniques: ['T1134'],
    tags: ['zero-trust', 'architecture', 'advanced'],
  },
  {
    questionText: 'Une attaque par canal auxiliaire exploite les faiblesses dans la mise en œuvre d\'un algorithme cryptographique plutôt que des faiblesses dans l\'algorithme lui-même.',
    correctAnswer: 'Vrai',
    difficulty: new Decimal(0.85),
    category: 'Cryptographie',
    explanation: 'Les attaques par canal auxiliaire utilisent le timing, la consommation d\'énergie ou d\'autres propriétés physiques pour casser le chiffrement.',
    mitreTechniques: ['T1040'],
    tags: ['cryptography', 'attacks', 'advanced'],
  },
];

async function seed() {
  console.log('Starting database seed...');

  try {
    // Clear existing questions (optional - only in dev)
    if (process.env.NODE_ENV === 'development') {
      await prisma.question.deleteMany({});
      console.log('Cleared existing questions');
    }

    // Insert seed questions
    let created = 0;
    for (const q of SEED_QUESTIONS) {
      const question = await prisma.question.create({
        data: {
          questionText: q.questionText,
          options: ['Vrai', 'Faux'], // Standardized French options
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          qualityScore: new Decimal(0.95), // Pre-validated
          category: q.category,
          explanation: q.explanation,
          questionType: 'true-false',
          status: 'accepted', // Pre-approved for seeded questions
          aiProvider: 'seed',
          mitreTechniques: q.mitreTechniques,
          tags: q.tags,
          metadata: {
            create: {
              embeddingId: `seed_${created}`,
              validationScore: new Decimal(0.95),
              validatorModel: 'seed',
            },
          },
        },
      });
      created++;
      console.log(`Created: ${q.category} - ${q.questionText.substring(0, 50)}...`);
    }

    console.log(`\n✅ Seeded ${created} questions successfully`);

    // Create admin user (if not exists)
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'admin@cyberquiz.local' },
    });

    if (!existingAdmin) {
      const admin = await prisma.adminUser.create({
        data: {
          email: 'admin@cyberquiz.local',
          passwordHash: '$2a$10$8K1p/a0dL3.ynGmI.sMmUe3VC7xEPdN8ZCIR5Jm3ZK2kR6K7Y8nze', // bcrypt hash of 'admin123'
          role: 'admin',
        },
      });
      console.log(`Created admin user: ${admin.email}`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
