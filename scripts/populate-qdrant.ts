import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');
for (const line of lines) {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
}

import { prisma } from '../src/lib/db/prisma';
import { qdrant, ensureCollection } from '../src/lib/db/qdrant';
import { OllamaProvider } from '../src/lib/ai/providers/ollama';

async function populateQdrant() {
  console.log('🔄 Starting Qdrant population...');

  try {
    // Ensure collection exists
    console.log('📦 Ensuring Qdrant collection exists...');
    await ensureCollection();
    console.log('✅ Collection ready');

    // Get all questions from database
    const questions = await prisma.question.findMany({
      where: {
        isRejected: false,
      },
    });

    console.log(`📚 Found ${questions.length} questions to embed`);

    if (questions.length === 0) {
      console.log('ℹ️  No questions to populate');
      return;
    }

    // Initialize Ollama provider for embeddings
    const provider = new OllamaProvider();
    let embedded = 0;

    // Process questions in batches
    for (const question of questions) {
      try {
        // Generate embedding
        const embedding = await provider.generateEmbedding(question.questionText);

        // Upsert to Qdrant
        await qdrant.upsert('cyberquiz_questions', {
          points: [
            {
              id: question.id,
              vector: embedding,
              payload: {
                question_id: question.id,
                question_text: question.questionText,
                category: question.category,
                difficulty: parseFloat(question.difficulty.toString()),
                tags: question.tags || [],
                created_at: question.createdAt?.toISOString() || new Date().toISOString(),
              } as unknown as Record<string, unknown>
            }
          ]
        });

        embedded++;
        if (embedded % 5 === 0) {
          console.log(`📍 Embedded ${embedded}/${questions.length} questions`);
        }
      } catch (error) {
        console.error(`❌ Failed to embed question ${question.id}:`, error);
      }
    }

    console.log(`\n✅ Successfully embedded ${embedded}/${questions.length} questions in Qdrant`);
  } catch (error) {
    console.error('❌ Error populating Qdrant:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

populateQdrant();
