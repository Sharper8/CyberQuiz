import { AIProvider, GeneratedQuestion, QuestionGenerationParams, ValidationResult } from './base';
import { buildGenerationPrompt } from '../prompts/generation';
import { buildValidationPrompt } from '../prompts/validation';
import { getEnv } from '../../validators/env';
import OpenAI from 'openai';

function parseJSON(raw: string): any {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in model output');
  return JSON.parse(raw.slice(start, end + 1));
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private generationModel: string;
  private validationModel: string;
  private embeddingModel: string;
  private enabled: boolean;

  constructor() {
    const env = getEnv();
    this.enabled = env.ALLOW_EXTERNAL_AI === 'true' && !!env.OPENAI_API_KEY;
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.generationModel = process.env.OPENAI_GENERATION_MODEL || 'gpt-4o-mini';
    this.validationModel = process.env.OPENAI_VALIDATION_MODEL || this.generationModel;
    this.embeddingModel = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-large';
  }

  get model(): string {
    return this.generationModel;
  }

  async isAvailable(): Promise<boolean> {
    return this.enabled;
  }

  async generateQuestion(params: QuestionGenerationParams): Promise<GeneratedQuestion> {
    if (!this.enabled) throw new Error('OpenAI provider disabled');
    const prompt = buildGenerationPrompt({
      topic: params.topic,
      difficulty: params.difficulty,
      questionType: params.questionType
    });
    const completion = await this.client.chat.completions.create({
      model: this.generationModel,
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });
    const raw = completion.choices[0].message?.content || '';
    const data = parseJSON(raw);
    return {
      questionText: data.questionText,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      mitreTechniques: data.mitreTechniques || [],
      tags: data.tags || [],
      estimatedDifficulty: typeof data.estimatedDifficulty === 'number' ? data.estimatedDifficulty : 0.5
    };
  }

  async validateQuestion(question: GeneratedQuestion): Promise<ValidationResult> {
    if (!this.enabled) throw new Error('OpenAI provider disabled');
    const prompt = buildValidationPrompt({
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    });
    const completion = await this.client.chat.completions.create({
      model: this.validationModel,
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0
    });
    const raw = completion.choices[0].message?.content || '';
    const data = parseJSON(raw);
    return {
      qualityScore: data.qualityScore,
      factualAccuracy: data.factualAccuracy,
      clarityScore: data.clarityScore,
      issues: data.issues || [],
      recommendation: data.recommendation
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.enabled) throw new Error('OpenAI provider disabled');
    const embedding = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text
    });
    return embedding.data[0].embedding as number[];
  }
}
