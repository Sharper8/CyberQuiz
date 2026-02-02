import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/validators/env';

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  modified_at: string;
  details: {
    parameter_size: string;
    quantization_level: string;
  };
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

/**
 * GET /api/models/available
 * Fetch available AI models from configured providers
 */
export async function GET() {
  try {
    const env = getEnv();
    const ollamaUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const allowExternal = env.ALLOW_EXTERNAL_AI === 'true';

    const models: Array<{ value: string; label: string; provider: string }> = [];

    // Fetch Ollama models
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data: OllamaTagsResponse = await response.json();
        
        // Add Ollama models
        data.models.forEach((model) => {
          // Extract model name (remove :latest suffix if present for display)
          const modelName = model.name;
          const displayName = modelName.replace(':latest', '');
          const paramSize = model.details?.parameter_size || 'unknown size';
          
          models.push({
            value: modelName,
            label: `Ollama - ${displayName} (${paramSize})`,
            provider: 'ollama',
          });
        });
      }
    } catch (error) {
      console.error('[API/models] Failed to fetch Ollama models:', error);
      // Don't fail completely if Ollama is unreachable
    }

    // Add OpenAI models if external AI is allowed
    if (allowExternal) {
      models.push(
        {
          value: 'openai:gpt-4o',
          label: 'OpenAI - GPT-4o (Requires API key)',
          provider: 'openai',
        },
        {
          value: 'openai:gpt-4o-mini',
          label: 'OpenAI - GPT-4o Mini (Requires API key)',
          provider: 'openai',
        }
      );
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error('[API/models] Error fetching available models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available models', models: [] },
      { status: 500 }
    );
  }
}
