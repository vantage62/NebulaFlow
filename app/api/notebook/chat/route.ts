import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { chunkText, getRelevantChunks } from '../../../../lib/rag';

export async function POST(req: Request) {
  try {
    const { messages, documentText } = await req.json();

    let relevantContext = '';

    if (documentText && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1].content;
      const chunks = chunkText(documentText);
      const relevant = getRelevantChunks(lastUserMessage, chunks, 5);
      relevantContext = relevant.join('\n\n---\n\n');
    }

    const systemPrompt = `You are Launchpad Studio Assistant, a dedicated AI study companion embedded inside Launchpad Studio.
Your goal is to help users understand, analyze, and study their uploaded documents and notes.

Guidelines:
1. Answer questions clearly, accurately, and concisely using plain language and markdown formatting (bullet points, bold text, headings).
2. Prioritize accuracy based on the provided document excerpts.
3. If the answer is found in the context, cite relevant details cleanly.
4. If a question is outside the document context, explain what information is present in the document and offer relevant study guidance.

--- DOCUMENT CONTEXT ---
${relevantContext || '(No document context selected)'}
--- END CONTEXT ---`;

    const modelName = 'llama-3.3-70b-versatile';
    const fallbackModel = 'llama-3.1-8b-instant';

    try {
      const result = streamText({
        model: groq(modelName),
        system: systemPrompt,
        messages,
      });
      return result.toTextStreamResponse();
    } catch (modelErr) {
      console.warn('Llama 3.3 70b unavailable, falling back to 8b:', modelErr);
      const fallbackResult = streamText({
        model: groq(fallbackModel),
        system: systemPrompt,
        messages,
      });
      return fallbackResult.toTextStreamResponse();
    }
  } catch (error: any) {
    console.error('Launchpad Chat Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
