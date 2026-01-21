/**
 * Database Seed Script
 * Creates admin user and generates initial question pool
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface SeedQuestion {
  question: string;
  answer: boolean;
  category: string;
  explanation: string;
  difficulty: number;
}

// Pre-defined questions for initial seed (following specification categories)
const seedQuestions: SeedQuestion[] = [
  // Network Security - Easy
  {
    question: "Le HTTPS garantit le chiffrement des données entre le navigateur et le serveur",
    answer: true,
    category: "Sécurité Réseau",
    explanation: "HTTPS utilise TLS/SSL pour chiffrer les communications entre le client et le serveur, assurant la confidentialité des données transmises.",
    difficulty: 0.2
  },
  {
    question: "Un firewall peut bloquer tout type d'attaque informatique",
    answer: false,
    category: "Sécurité Réseau",
    explanation: "Un firewall ne peut bloquer que certaines attaques au niveau réseau. Il ne protège pas contre les attaques applicatives, le social engineering, ou les malwares déjà présents.",
    difficulty: 0.3
  },
  {
    question: "WPA3 est plus sécurisé que WPA2 pour les réseaux WiFi",
    answer: true,
    category: "Sécurité Réseau",
    explanation: "WPA3 introduit un chiffrement plus robuste (SAE au lieu de PSK), une protection contre les attaques par force brute, et le forward secrecy.",
    difficulty: 0.4
  },
  
  // Web Application Security - Easy/Medium
  {
    question: "Les injections SQL permettent d'exécuter des commandes arbitraires sur la base de données",
    answer: true,
    category: "Sécurité Web",
    explanation: "Les injections SQL exploitent des vulnérabilités dans les requêtes pour exécuter du code SQL malveillant, permettant de lire, modifier ou supprimer des données.",
    difficulty: 0.3
  },
  {
    question: "Le XSS (Cross-Site Scripting) ne fonctionne que sur les sites en HTTP",
    answer: false,
    category: "Sécurité Web",
    explanation: "Le XSS peut affecter autant les sites en HTTP qu'en HTTPS. HTTPS protège le transport des données mais pas contre l'injection de scripts côté client.",
    difficulty: 0.5
  },
  {
    question: "Les en-têtes Content-Security-Policy aident à prévenir les attaques XSS",
    answer: true,
    category: "Sécurité Web",
    explanation: "CSP permet de définir des règles strictes sur les sources de contenu autorisées, réduisant significativement le risque d'exécution de scripts malveillants.",
    difficulty: 0.6
  },

  // Cryptography - Medium
  {
    question: "Le chiffrement symétrique utilise la même clé pour chiffrer et déchiffrer",
    answer: true,
    category: "Cryptographie",
    explanation: "Dans le chiffrement symétrique (AES, DES, etc.), une seule clé secrète est partagée entre les parties pour les opérations de chiffrement et déchiffrement.",
    difficulty: 0.3
  },
  {
    question: "SHA-256 est un algorithme de chiffrement",
    answer: false,
    category: "Cryptographie",
    explanation: "SHA-256 est une fonction de hachage cryptographique, pas un algorithme de chiffrement. Elle génère une empreinte unique mais le processus n'est pas réversible.",
    difficulty: 0.5
  },
  {
    question: "RSA utilise une paire de clés publique/privée",
    answer: true,
    category: "Cryptographie",
    explanation: "RSA est un algorithme de chiffrement asymétrique utilisant une clé publique pour chiffrer et une clé privée correspondante pour déchiffrer.",
    difficulty: 0.4
  },

  // Red Team Operations - Medium/Hard
  {
    question: "Metasploit est un framework utilisé principalement pour les tests de pénétration",
    answer: true,
    category: "Red Team",
    explanation: "Metasploit est un outil open-source permettant de développer, tester et exécuter des exploits contre des systèmes cibles dans le cadre de tests de sécurité.",
    difficulty: 0.5
  },
  {
    question: "Le port scanning est toujours détectable par les systèmes IDS/IPS",
    answer: false,
    category: "Red Team",
    explanation: "Des techniques de scanning furtif (SYN scan, fragmentation, timing delays) peuvent contourner certaines détections IDS/IPS basiques.",
    difficulty: 0.7
  },

  // Blue Team Operations - Medium
  {
    question: "Un SIEM permet de centraliser et corréler les logs de sécurité",
    answer: true,
    category: "Blue Team",
    explanation: "Les SIEM (Security Information and Event Management) collectent, analysent et corrèlent les événements de sécurité pour détecter des incidents.",
    difficulty: 0.4
  },
  {
    question: "La réponse à incident doit toujours commencer par l'effacement des preuves",
    answer: false,
    category: "Blue Team",
    explanation: "La préservation des preuves (forensics) est cruciale. L'effacement prématuré empêche l'analyse post-incident et peut avoir des implications légales.",
    difficulty: 0.6
  },

  // Incident Response - Medium/Hard
  {
    question: "Les snapshots de mémoire volatile doivent être capturés avant l'extinction du système compromis",
    answer: true,
    category: "Réponse à Incident",
    explanation: "La RAM contient des données volatiles critiques (processus actifs, connexions, clés de chiffrement) qui sont perdues à l'extinction.",
    difficulty: 0.7
  },
  {
    question: "Isoler un système compromis du réseau suffit à stopper toute exfiltration de données",
    answer: false,
    category: "Réponse à Incident",
    explanation: "Un malware peut avoir déjà établi des canaux cachés, des tâches programmées, ou compromettre d'autres systèmes avant l'isolation.",
    difficulty: 0.6
  },

  // Cloud Security - Medium
  {
    question: "Dans le modèle IaaS, le fournisseur cloud est responsable de la sécurité du système d'exploitation",
    answer: false,
    category: "Sécurité Cloud",
    explanation: "En IaaS, le fournisseur gère l'infrastructure physique, mais le client est responsable de l'OS, des applications et des données (modèle de responsabilité partagée).",
    difficulty: 0.5
  },
  {
    question: "Les buckets S3 sont privés par défaut",
    answer: true,
    category: "Sécurité Cloud",
    explanation: "AWS S3 crée les buckets avec des permissions privées par défaut depuis 2018. Les erreurs de configuration publique sont dues à des modifications intentionnelles mal sécurisées.",
    difficulty: 0.4
  },

  // MITRE ATT&CK - Hard
  {
    question: "La technique T1059 (Command and Scripting Interpreter) est utilisée pour l'exécution de code",
    answer: true,
    category: "MITRE ATT&CK",
    explanation: "T1059 décrit l'utilisation d'interpréteurs (PowerShell, Bash, Python) pour exécuter des commandes malveillantes sur un système compromis.",
    difficulty: 0.8
  },
  {
    question: "Le lateral movement fait partie de la phase de reconnaissance selon MITRE ATT&CK",
    answer: false,
    category: "MITRE ATT&CK",
    explanation: "Le lateral movement (déplacement latéral) est une tactique distincte visant à se déplacer dans le réseau après le compromis initial. La reconnaissance est une phase préliminaire.",
    difficulty: 0.7
  },

  // Password Security - Easy/Medium
  {
    question: "Un mot de passe de 8 caractères avec majuscules, minuscules et chiffres est considéré comme fort",
    answer: false,
    category: "Mots de passe",
    explanation: "Bien que conforme à beaucoup de politiques, 8 caractères reste vulnérable aux attaques par force brute modernes. 12+ caractères avec complexité est recommandé.",
    difficulty: 0.4
  },
  {
    question: "Le hashage bcrypt inclut automatiquement un salt aléatoire",
    answer: true,
    category: "Mots de passe",
    explanation: "Bcrypt génère et stocke automatiquement un salt unique pour chaque mot de passe, rendant les rainbow tables inefficaces.",
    difficulty: 0.5
  }
];

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create admin user
  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@cyberquiz.fr' },
    update: {
      passwordHash,
      role: 'admin',
    },
    create: {
      email: 'admin@cyberquiz.fr',
      passwordHash,
      role: 'admin',
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  // 2. Create seed questions
  console.log(`📝 Creating ${seedQuestions.length} seed questions...`);
  
  let createdCount = 0;
  for (const q of seedQuestions) {
    try {
      const question = await prisma.question.create({
        data: {
          questionText: q.question,
          options: ['Vrai', 'Faux'],
          correctAnswer: q.answer ? 'Vrai' : 'Faux',
          explanation: q.explanation,
          difficulty: q.difficulty,
          category: q.category,
          questionType: 'true-false',
          status: 'accepted', // Pre-validated questions
          isRejected: false,
          aiProvider: 'seed',
          mitreTechniques: q.category === 'MITRE ATT&CK' ? ['T1059'] : [],
          tags: [q.category.toLowerCase()],
          qualityScore: 1.0, // Perfect quality for seed questions
        },
      });

      // Create metadata entry
      await prisma.questionMetadata.create({
        data: {
          questionId: question.id,
          embeddingId: `seed-${question.id}`, // Placeholder embedding ID
          validationScore: 1.0,
          validatorModel: 'seed-script',
          generatedPromptHash: `seed-${Date.now()}`,
          conceptTags: JSON.stringify([q.category]),
        },
      });

      createdCount++;
    } catch (error) {
      console.error(`❌ Failed to create question: "${q.question.substring(0, 50)}..."`, error);
    }
  }

  console.log(`✅ Created ${createdCount}/${seedQuestions.length} questions`);

  // 3. Create sample quiz sessions for testing
  console.log('🎮 Creating sample quiz sessions...');
  
  const sampleSession = await prisma.quizSession.create({
    data: {
      username: 'test-user',
      topic: 'Cybersécurité Générale',
      questionCount: 10,
      status: 'completed',
      score: 7,
      warmupComplete: true,
    },
  });

  // Link some questions to the session
  const questions = await prisma.question.findMany({
    take: 10,
    where: { status: 'accepted' },
  });

  for (let i = 0; i < questions.length; i++) {
    await prisma.quizSessionQuestion.create({
      data: {
        sessionId: sampleSession.id,
        questionId: questions[i].id,
        questionOrder: i + 1,
      },
    });
  }

  console.log(`✅ Created sample quiz session with ${questions.length} questions`);

  // 4. Create sample scores for leaderboard
  console.log('🏆 Creating sample leaderboard scores...');
  
  const sampleScores = [
    { username: 'CyberNinja', score: 95, totalQuestions: 100, topic: 'Sécurité Web', sessionId: sampleSession.id },
    { username: 'HackerPro', score: 88, totalQuestions: 100, topic: 'Sécurité Réseau', sessionId: null },
    { username: 'SecOpsGuru', score: 92, totalQuestions: 100, topic: 'Blue Team', sessionId: null },
    { username: 'PentestMaster', score: 85, totalQuestions: 100, topic: 'Red Team', sessionId: null },
    { username: 'CloudSec', score: 90, totalQuestions: 100, topic: 'Sécurité Cloud', sessionId: null },
  ];

  // First score is linked to sample session
  await prisma.score.create({
    data: {
      sessionId: sampleScores[0].sessionId!,
      username: sampleScores[0].username,
      score: sampleScores[0].score,
      totalQuestions: sampleScores[0].totalQuestions,
      accuracyPercentage: (sampleScores[0].score / sampleScores[0].totalQuestions) * 100,
      topic: sampleScores[0].topic,
      timeTaken: Math.floor(Math.random() * 300) + 60,
    },
  });

  // Create additional sessions for other scores
  for (let i = 1; i < sampleScores.length; i++) {
    const scoreData = sampleScores[i];
    const session = await prisma.quizSession.create({
      data: {
        username: scoreData.username,
        topic: scoreData.topic,
        questionCount: scoreData.totalQuestions,
        status: 'completed',
        score: scoreData.score,
        warmupComplete: true,
      },
    });

    await prisma.score.create({
      data: {
        sessionId: session.id,
        username: scoreData.username,
        score: scoreData.score,
        totalQuestions: scoreData.totalQuestions,
        accuracyPercentage: (scoreData.score / scoreData.totalQuestions) * 100,
        topic: scoreData.topic,
        timeTaken: Math.floor(Math.random() * 300) + 60,
      },
    });
  }

  console.log(`✅ Created ${sampleScores.length} sample scores`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 admin user (admin@cyberquiz.fr)`);
  console.log(`   - ${createdCount} validated questions across 9 categories`);
  console.log(`   - 1 sample quiz session`);
  console.log(`   - ${sampleScores.length} leaderboard entries`);
  console.log('\n🚀 You can now:');
  console.log('   - Login to admin panel with admin@cyberquiz.fr:password123');
  console.log('   - Start a quiz from the home page');
  console.log('   - View the leaderboard');
  console.log('   - Generate more questions with AI\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
