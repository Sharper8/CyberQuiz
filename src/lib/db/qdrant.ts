import { QdrantClient } from '@qdrant/js-client-rest';
import { getEnv } from '../validators/env';

// Lazy initialization to avoid build-time env validation
let qdrantClient: QdrantClient | null = null;

function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    const env = getEnv();
    qdrantClient = new QdrantClient({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY
    });
  }
  return qdrantClient;
}

export const qdrant = new Proxy({} as QdrantClient, {
  get: (target, prop) => {
    const client = getQdrantClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
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
        payload: payload as unknown as Record<string, unknown>
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
  return results.map(r => ({ id: Number(r.id), score: r.score, payload: r.payload as unknown as EmbeddingPayload }));
}
