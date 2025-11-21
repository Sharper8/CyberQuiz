import { QdrantClient } from '@qdrant/js-client-rest';
import { getEnv } from '../validators/env';

const env = getEnv();

export const qdrant = new QdrantClient({
  url: env.QDRANT_URL,
  apiKey: env.QDRANT_API_KEY
});

const COLLECTION = 'cyberquiz_questions';

export async function ensureCollection(): Promise<void> {
  const exists = await qdrant.getCollections().then(r => r.collections.some(c => c.name === COLLECTION));
  if (!exists) {
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: 768, distance: 'Cosine' }
    });
  }
}

export interface EmbeddingPayload {
  question_id: number;
  question_text: string;
  category: string;
  difficulty: number;
  tags: string[];
  created_at: string;
}

export async function upsertEmbedding(id: number, vector: number[], payload: EmbeddingPayload) {
  await qdrant.upsert(COLLECTION, {
    points: [
      {
        id,
        vector,
        payload
      }
    ]
  });
}

export async function deleteEmbedding(id: number) {
  await qdrant.delete(COLLECTION, { points: [id] });
}

export interface SimilarResult {
  id: number;
  score: number;
  payload?: EmbeddingPayload;
}

export async function searchSimilar(vector: number[], limit = 10): Promise<SimilarResult[]> {
  const results = await qdrant.search(COLLECTION, {
    vector,
    limit
  });
  return results.map(r => ({ id: Number(r.id), score: r.score, payload: r.payload as EmbeddingPayload }));
}
