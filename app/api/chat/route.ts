import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `You are Aegis AI, an advanced, highly intelligent, and versatile AI assistant created for NebulaFlow.
You are built to deliver top-tier, insightful, accurate, and beautifully structured responses—matching the intelligence, depth, and clarity of systems like ChatGPT-4o and Gemini 1.5 Pro.

Key Principles:
1. Intelligent & Comprehensive: Provide deep, well-reasoned answers to questions spanning science, mathematics, coding, literature, philosophy, study techniques, and general knowledge.
2. Versatile & Helpful: NEVER say "I don't have document context" or refuse general questions. You possess vast general knowledge.
3. Context-Aware: If additional text or document context is attached by the user below, incorporate it seamlessly into your response while preserving full broad intelligence.
4. Beautiful Formatting: Use clear Markdown with headings, bold text, bullet points, numbered lists, blockquotes, and code blocks with language identifiers where applicable.
5. Educational & Engaging: Explain complex topics intuitively using clear steps, real-world analogies, and precise logic.

${context ? `--- ATTACHED USER CONTEXT ---\n${context}\n--- END ATTACHED CONTEXT ---` : ''}`;

    const modelName = 'llama-3.3-70b-versatile';
    const fallbackModel = 'llama-3.1-8b-instant';

    try {
      const result = streamText({
        model: groq(modelName),
        system: systemPrompt,
        messages,
      });
      return result.toTextStreamResponse();
    } catch (primaryError) {
      console.warn('Llama 3.3 70B stream failed, falling back to Llama 3.1 8B:', primaryError);
      const resultFallback = streamText({
        model: groq(fallbackModel),
        system: systemPrompt,
        messages,
      });
      return resultFallback.toTextStreamResponse();
    }
  } catch (error: any) {
    console.error('Aegis Chat Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
