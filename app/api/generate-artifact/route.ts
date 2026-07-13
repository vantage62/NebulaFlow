import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';

const PROMPTS: Record<string, string> = {
  summary: 'You are an expert summarizer. Provide a comprehensive summary of the provided text. Use markdown with clear headings.',
  notes: 'You are a master at taking study notes. Create detailed, well-structured, hierarchical notes from the provided text. Use bullet points and bold text for key terms. Use markdown.',
  flashcards: 'You are a study assistant. Create 10 flashcards based on the provided text. Return ONLY a valid JSON array of objects, where each object has "front" (question/term) and "back" (answer/definition) properties. Do not wrap in markdown code blocks.',
  quiz: 'You are a quiz master. Create a 5-question multiple choice quiz based on the provided text. Return ONLY a valid JSON array of objects, where each object has "question", "options" (array of 4 strings), and "answer" (index of correct option 0-3). Do not wrap in markdown code blocks.',
  mindmap: 'You are an expert at creating mind maps. Create a mermaid.js mindmap summarizing the text. Return ONLY the raw mermaid syntax. Do not include markdown codeblocks (```mermaid) or any other text. Start the text directly with "mindmap". Use appropriate mermaid syntax for mindmaps (e.g. root((Root)) ).'
};

export async function POST(req: Request) {
  try {
    const { type, text } = await req.json();

    if (!PROMPTS[type]) {
      return new Response('Invalid artifact type', { status: 400 });
    }

    // Determine model based on complexity. For JSON/Mermaid, 70b is better.
    // Llama 3.1 70b has 131k context and excellent reasoning.
    const modelName = ['flashcards', 'quiz', 'mindmap'].includes(type) 
      ? 'llama-3.1-70b-versatile' 
      : 'llama-3.1-8b-instant';

    const systemPrompt = PROMPTS[type];

    const MAX_CHARS = 14000; // Leaves ~2000 tokens for output within the 6000 TPM limit
    let safeText = text;
    if (safeText.length > MAX_CHARS) {
      safeText = safeText.substring(0, MAX_CHARS) + '\n\n...[TEXT TRUNCATED DUE TO FREE TIER API LIMITS]';
    }

    const prompt = `Here is the document text:\n\n${safeText}\n\nBased on this text, fulfill the system instructions.`;

    const result = streamText({
      model: groq(modelName),
      system: systemPrompt,
      prompt: prompt,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Generation Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
