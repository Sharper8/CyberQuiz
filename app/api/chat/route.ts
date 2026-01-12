import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    // For now, return a simple mock response
    // In production, this would integrate with an AI service (OpenAI, Claude, etc.)
    const mockResponse = generateMockExplanation(messages);
    
    return new NextResponse(mockResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

function generateMockExplanation(messages: any[]): string {
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage?.content || '';
  
  // Extract if this is about cybersecurity
  let response = '';
  
  if (content.includes('Question:')) {
    response = `Je comprends que tu souhaites une explication sur cette question de cybersécurité.

Les questions de cybersécurité sont souvent basées sur des concepts de sécurité fondamentaux :
- **Confidentialité** : protéger les données contre l'accès non autorisé
- **Intégrité** : garantir que les données ne sont pas modifiées
- **Disponibilité** : assurer l'accès aux ressources quand nécessaire

N'hésite pas à me poser des questions plus spécifiques sur cette réponse !`;
  } else {
    response = `Excellente question ! En cybersécurité, il est important de comprendre les principes de base.

Pour cette question spécifique :
- Analyse le contexte de sécurité
- Identifie les risques potentiels
- Évalue les mesures de protection

Tu veux que je détaille un aspect particulier ?`;
  }
  
  // Simulate streaming by splitting into chunks
  const words = response.split(' ');
  let streamData = '';
  
  for (let i = 0; i < words.length; i++) {
    const chunk = words[i] + ' ';
    const data = {
      choices: [{
        delta: {
          content: chunk
        }
      }]
    };
    streamData += `data: ${JSON.stringify(data)}\n\n`;
  }
  
  streamData += 'data: [DONE]\n\n';
  return streamData;
}
