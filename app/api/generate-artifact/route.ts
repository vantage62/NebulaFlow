import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { chunkText } from '../../../lib/rag';

const PROMPTS: Record<string, string> = {
  summary: 'You are an expert summarizer. Provide a comprehensive summary based on the provided text excerpts from the document. Use markdown with clear headings.',
  notes: 'You are a master at taking study notes. Create detailed, well-structured, hierarchical notes from the provided text excerpts. Use bullet points and bold text for key terms. Use markdown.',
  flashcards: 'You are a study assistant. Create 10 flashcards based on the provided text excerpts. Return ONLY a valid JSON array of objects, where each object has "front" (question/term) and "back" (answer/definition) properties. Do not wrap in markdown code blocks.',
  quiz: 'You are a quiz master. Create a 5-question multiple choice quiz based on the provided text excerpts. Return ONLY a valid JSON array of objects, where each object has "question", "options" (array of 4 strings), and "answer" (index of correct option 0-3). Do not wrap in markdown code blocks.',
  mindmap: `You are an expert at structuring knowledge into mind maps.
Create a mind map summarizing the key concepts from the text excerpts.

CRITICAL: Return ONLY a valid JSON object. No markdown fences, no explanation, no extra text.

The JSON must follow this exact structure:
{
  "topic": "Main Topic Name",
  "branches": [
    {
      "label": "Subtopic 1",
      "children": [
        { "label": "Detail A" },
        { "label": "Detail B" }
      ]
    },
    {
      "label": "Subtopic 2",
      "children": [
        { "label": "Detail C" },
        { "label": "Detail D" }
      ]
    }
  ]
}

RULES:
- The "topic" is the central/root concept of the document.
- Create 4-7 branches (subtopics).
- Each branch should have 2-4 children (details/facts).
- Keep all labels SHORT (1-6 words max).
- Do NOT nest more than 2 levels deep (topic → branch → child).
- Return ONLY the JSON object. No markdown, no code blocks, no explanation.`
};

export async function POST(req: Request) {
  try {
    const { type, text } = await req.json();

    if (!PROMPTS[type]) {
      return new Response('Invalid artifact type', { status: 400 });
    }

    // Fallback to 8b for everything because Groq free tier 70b fails silently or rate limits
    const modelName = 'llama-3.1-8b-instant';

    const systemPrompt = PROMPTS[type];

    // Instead of simply truncating the beginning of the text, we will use an extractive RAG approach
    // We chunk the text and sample evenly from beginning, middle, and end to fit the token budget.
    const chunks = chunkText(text, 2000, 200);
    const MAX_CHUNKS = 7; // Approx 14,000 characters total
    
    let sampledChunks: string[] = [];
    if (chunks.length <= MAX_CHUNKS) {
      sampledChunks = chunks;
    } else {
      // Sample evenly
      const step = chunks.length / MAX_CHUNKS;
      for (let i = 0; i < MAX_CHUNKS; i++) {
        const index = Math.floor(i * step);
        sampledChunks.push(chunks[index]);
      }
    }

    const safeText = sampledChunks.join('\n\n[...]\n\n');

    const prompt = `Here are representative excerpts from the document text:\n\n${safeText}\n\nBased on these excerpts, fulfill the system instructions.`;

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
