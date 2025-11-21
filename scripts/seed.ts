import { prisma } from '../src/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Pre-seed database with themed cybersecurity questions
 * Runs on first deployment or manual invocation
 *
 * Usage: npx ts-node scripts/seed.ts
 */

const SEED_QUESTIONS = [
  // Easy - Authentication
  {
    questionText: 'A strong password should be at least 12 characters long.',
    correctAnswer: 'true',
    difficulty: new Decimal(0.2),
    category: 'Authentication',
    explanation: 'Industry best practices recommend passwords of 12+ characters to resist brute force attacks.',
    mitreTechniques: ['T1110'],
    tags: ['password', 'authentication', 'security-basics'],
  },
  {
    questionText: 'Public WiFi networks provide the same security as private networks.',
    correctAnswer: 'false',
    difficulty: new Decimal(0.15),
    category: 'Network Security',
    explanation: 'Public WiFi is vulnerable to man-in-the-middle attacks. Always use a VPN on public networks.',
    mitreTechniques: ['T1557'],
    tags: ['wifi', 'network', 'security-basics'],
  },

  // Medium - Malware & Attacks
  {
    questionText: 'Ransomware always encrypts files immediately upon infection.',
    correctAnswer: 'false',
    difficulty: new Decimal(0.5),
    category: 'Malware',
    explanation: 'Some ransomware families remain dormant to avoid detection before encryption.',
    mitreTechniques: ['T1486'],
    tags: ['ransomware', 'malware', 'tactics'],
  },
  {
    questionText: 'SQL injection attacks can only target SQL databases.',
    correctAnswer: 'false',
    difficulty: new Decimal(0.55),
    category: 'Web Security',
    explanation: 'While SQL injection targets databases, similar injection attacks work on various systems.',
    mitreTechniques: ['T1190'],
    tags: ['injection', 'web-security', 'vulnerabilities'],
  },

  // Hard - Advanced Topics
  {
    questionText: 'In a zero-trust architecture, all network traffic is considered untrusted by default.',
    correctAnswer: 'true',
    difficulty: new Decimal(0.8),
    category: 'Network Architecture',
    explanation: 'Zero-trust assumes breach and verifies every access request, regardless of network location.',
    mitreTechniques: ['T1134'],
    tags: ['zero-trust', 'architecture', 'advanced'],
  },
  {
    questionText: 'A side-channel attack exploits weaknesses in the implementation of a cryptographic algorithm rather than weaknesses in the algorithm itself.',
    correctAnswer: 'true',
    difficulty: new Decimal(0.85),
    category: 'Cryptography',
    explanation: 'Side-channel attacks use timing, power consumption, or other physical properties to break encryption.',
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
          options: ['true', 'false'], // True/false options
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
