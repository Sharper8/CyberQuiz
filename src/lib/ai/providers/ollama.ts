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

  // Extract the first valid JSON object from the accumulated response text
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < fullResponse.length; i++) {
    const char = fullResponse[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const slice = fullResponse.slice(start, i + 1);
        try {
          // Clean out line comments the model sometimes adds (e.g. "// Command and Control")
          const cleaned = slice.replace(/\/\/.*$/gm, '');
          return JSON.parse(cleaned);
        } catch (e) {
          console.error('Failed to parse JSON slice:', slice);
          continue;
        }
      }
    }
  }

  console.error('Raw response:', fullResponse);
  throw new Error('No JSON object found in model output');
}

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  model: string;  // e.g., 'mistral:7b'
  private baseUrl: string;
  private generationModel: string;
  private embeddingModel: string;
  private validationModel: string;
  private lastAvailabilityCheck: { available: boolean; timestamp: number } | null = null;
  private availabilityCacheDuration = 5000; // Cache for 5 seconds

  constructor() {
    const env = getEnv();
    this.baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    // Get model from env or use default
    // ⚠️  IMPORTANT: Only use memory-safe models
    // - mistral:7b: ~3.8 GB (recommended for production VMs with 7.6 GB RAM)
    // - llama3.1:8b: 4.8 GB (will cause OOM - do not use without VM upgrade)
    // - llama2:13b: 7+ GB (exceeds typical VM memory)
    this.generationModel = process.env.OLLAMA_GENERATION_MODEL || 'mistral:7b';
    this.model = this.generationModel;  // Set model property
    this.embeddingModel = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
    this.validationModel = process.env.OLLAMA_VALIDATION_MODEL || this.generationModel;
    
    // Validate that we're not using memory-intensive models in constrained environments
    const unsafeModels = ['llama3.1:8b', 'llama2:13b', 'neural-chat:13b'];
    if (unsafeModels.some(m => this.generationModel.startsWith(m))) {
      console.warn(
        `⚠️  WARNING: Model "${this.generationModel}" may require excessive memory. ` +
        `Ensure your system has adequate RAM before using this model.`
      );
    }
  }

  /**
   * Update the generation model at runtime
   * @param modelName - Model name (e.g., 'tinyllama:latest', 'mistral:7b')
   */
  setModel(modelName: string): void {
    this.generationModel = modelName;
    this.model = modelName;
    this.validationModel = modelName; // Use same model for validation
  }

  /**
   * Ensure a model is pulled and available
   * @param modelName - Model name to pull if not available
   */
  private async ensureModelPulled(modelName: string): Promise<boolean> {
    try {
      // Check if model is already available
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        console.warn(`[Ollama] Cannot check model availability: ${res.status}`);
        return false;
      }
      
      const data = await res.json();
      const models = data.models || [];
      const modelExists = models.some((m: any) => 
        m.name === modelName || m.name.startsWith(modelName.split(':')[0])
      );
      
      if (modelExists) {
        console.log(`[Ollama] Model ${modelName} already available`);
        return true;
      }
      
      // Model not found, pull it
      console.log(`[Ollama] Pulling model ${modelName}...`);
      const pullRes = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: false })
      });
      
      if (!pullRes.ok) {
        console.error(`[Ollama] Failed to pull model ${modelName}: ${pullRes.status}`);
        return false;
      }
      
      console.log(`[Ollama] Successfully pulled model ${modelName}`);
      return true;
    } catch (error) {
      console.error(`[Ollama] Error pulling model ${modelName}:`, error);
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Return cached result if still valid
      if (this.lastAvailabilityCheck && 
          (Date.now() - this.lastAvailabilityCheck.timestamp) < this.availabilityCacheDuration) {
        return this.lastAvailabilityCheck.available;
      }

      // Auto-pull generation model if not available
      await this.ensureModelPulled(this.generationModel);
      
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        console.warn(`[Ollama] Tags endpoint returned ${res.status}`);
        this.lastAvailabilityCheck = { available: false, timestamp: Date.now() };
        return false;
      }
      
      // Check if required models are loaded
      const data = await res.json();
      const models = data.models || [];
      
      console.log(`[Ollama] Available models: ${models.map((m: any) => m.name).join(', ')}`);
      console.log(`[Ollama] Looking for: ${this.generationModel}, ${this.embeddingModel}`);
      
      const hasGenerationModel = models.some((m: any) => m.name.includes(this.generationModel.split(':')[0]));
      const hasEmbeddingModel = models.some((m: any) => m.name.includes(this.embeddingModel.split(':')[0]));
      
      const available = hasGenerationModel && hasEmbeddingModel;
      console.log(`[Ollama] Provider availability: ${available} (generation: ${hasGenerationModel}, embedding: ${hasEmbeddingModel})`);
      
      // Cache the result
      this.lastAvailabilityCheck = { available, timestamp: Date.now() };
      
      return available;
    } catch (error) {
      console.error(`[Ollama] isAvailable check failed:`, error);
      this.lastAvailabilityCheck = { available: false, timestamp: Date.now() };
      return false;
    }
  }

  async generateQuestion(params: QuestionGenerationParams): Promise<GeneratedQuestion> {
    const prompt = buildGenerationPrompt({
      topic: params.topic,
      difficulty: params.difficulty,
      questionType: params.questionType,
      additionalContext: params.additionalContext,
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
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Model ${this.generationModel} not loaded yet. Please wait for Ollama to finish downloading models.`);
      }
      throw new Error(`Generation failed ${res.status}`);
    }

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
    
    // Ensure all scoring fields have safe numeric defaults (0-1 range)
    return {
      qualityScore: typeof data?.qualityScore === 'number' ? data.qualityScore : 0.7,
      factualAccuracy: typeof data?.factualAccuracy === 'number' ? data.factualAccuracy : 0.7,
      clarityScore: typeof data?.clarityScore === 'number' ? data.clarityScore : 0.7,
      issues: Array.isArray(data?.issues) ? data.issues : [],
      recommendation: data?.recommendation || 'approve'
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
