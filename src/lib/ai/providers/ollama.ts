import { AIProvider, GeneratedQuestion, QuestionGenerationParams, ValidationResult } from './base';
import { buildGenerationPrompt } from '../prompts/generation';
import { buildValidationPrompt } from '../prompts/validation';
import { getEnv } from '../../validators/env';

interface OllamaGenerateResponseChunk {
  response?: string;
  done?: boolean;
  // other streaming fields omitted
}

interface OllamaEmbeddingsResponse {
  embedding: number[];
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama request failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

function extractJSONFromStreamed(raw: string): any {
  // Ollama streams response in chunks like {"response":"text","done":false}
  // We need to extract just the response field and combine them
  const lines = raw.split('\n').filter(line => line.trim());
  let fullResponse = '';
  
  for (const line of lines) {
    try {
      const chunk = JSON.parse(line);
      if (chunk.response) {
        fullResponse += chunk.response;
      }
    } catch (e) {
      // Skip invalid JSON lines
      continue;
    }
  }
  
  // Now extract JSON from the accumulated response text
  const start = fullResponse.indexOf('{');
  const end = fullResponse.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    console.error('Raw response:', fullResponse);
    throw new Error('No JSON object found in model output');
  }
  
  const slice = fullResponse.slice(start, end + 1);
  
  try {
    // Clean out line comments the model sometimes adds (e.g. "// Command and Control")
    const cleaned = slice.replace(/\/\/.*$/gm, '');
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse JSON slice:', slice);
    throw new Error(`Invalid JSON in model output: ${e}`);
  }
}

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  private baseUrl: string;
  private generationModel: string;
  private embeddingModel: string;
  private validationModel: string;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.generationModel = process.env.OLLAMA_GENERATION_MODEL || 'llama3.1:8b';
    this.embeddingModel = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
    this.validationModel = process.env.OLLAMA_VALIDATION_MODEL || this.generationModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateQuestion(params: QuestionGenerationParams): Promise<GeneratedQuestion> {
    const prompt = buildGenerationPrompt({
      topic: params.topic,
      difficulty: params.difficulty,
      questionType: params.questionType
    });

    const rawParts: string[] = [];
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.generationModel,
        prompt,
        stream: true,
        options: { temperature: 0.7 }
      })
    });
    if (!res.ok) throw new Error(`Generation failed ${res.status}`);

    // Stream accumulate
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      rawParts.push(decoder.decode(value));
    }
    const combined = rawParts.join('');
    const parsed = extractJSONFromStreamed(combined);

    const question: GeneratedQuestion = {
      questionText: parsed.questionText,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      explanation: parsed.explanation,
      mitreTechniques: parsed.mitreTechniques || [],
      tags: parsed.tags || [],
      estimatedDifficulty: typeof parsed.estimatedDifficulty === 'number' ? parsed.estimatedDifficulty : 0.5
    };
    return question;
  }

  async validateQuestion(question: GeneratedQuestion): Promise<ValidationResult> {
    const prompt = buildValidationPrompt({
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    });

    const res = await postJSON<any>(`${this.baseUrl}/api/generate`, {
      model: this.validationModel,
      prompt,
      stream: false,
      options: { temperature: 0 }
    });

    // Validation model may respond with raw text containing JSON
    const data = typeof res === 'string' ? extractJSONFromStreamed(res) : res;
    return {
      qualityScore: data.qualityScore,
      factualAccuracy: data.factualAccuracy,
      clarityScore: data.clarityScore,
      issues: data.issues || [],
      recommendation: data.recommendation
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const result = await postJSON<OllamaEmbeddingsResponse>(`${this.baseUrl}/api/embeddings`, {
      model: this.embeddingModel,
      prompt: text
    });
    return result.embedding;
  }
}
