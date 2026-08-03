/**
 * RAG utilities — lightweight, zero-dependency approach.
 * 
 * Instead of using a heavy ML embedding model (@xenova/transformers) that
 * requires a ~20 MB model download and frequently fails/times-out, we use
 * a simple TF-IDF-inspired keyword scoring approach. This is fast, robust,
 * works instantly, and is more than good enough for matching document chunks
 * to a user's question.
 */

/* ------------------------------------------------------------------ */
/*  Chunking                                                           */
/* ------------------------------------------------------------------ */

export function chunkText(text: string, maxChunkLength: number = 1000, overlap: number = 200): string[] {
  if (!text || text.length < 20) return text ? [text] : [];
  
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxChunkLength, text.length);

    // Try to break at a paragraph boundary first, then sentence, then any space
    if (end < text.length) {
      const slice = text.substring(start, end);
      const paraBreak = slice.lastIndexOf('\n\n');
      if (paraBreak > maxChunkLength * 0.4) {
        end = start + paraBreak + 2;
      } else {
        const sentBreak = slice.lastIndexOf('. ');
        if (sentBreak > maxChunkLength * 0.4) {
          end = start + sentBreak + 2;
        }
      }
    }

    const chunk = text.substring(start, end).trim();
    if (chunk.length > 10) {
      chunks.push(chunk);
    }

    if (end >= text.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
    // Safety: if we didn't advance, force advance
    if (start <= (chunks.length > 1 ? end - maxChunkLength : -1)) {
      start = end;
    }
  }

  return chunks;
}

/* ------------------------------------------------------------------ */
/*  Keyword-based relevance scoring (TF-IDF inspired)                  */
/* ------------------------------------------------------------------ */

// Common English stop words to ignore
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall','can',
  'this','that','these','those','it','its','i','me','my','we','our','you',
  'your','he','him','his','she','her','they','them','their','what','which',
  'who','whom','how','when','where','why','not','no','so','if','then','than',
  'too','very','just','about','up','out','into','over','after','before','between',
  'under','above','such','each','every','all','any','some','most','other','also',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function scoreChunk(queryTokens: string[], chunkText: string): number {
  const chunkTokens = tokenize(chunkText);
  if (chunkTokens.length === 0) return 0;

  const chunkTokenSet = new Set(chunkTokens);
  // Count how many query terms appear in this chunk, weighted by rarity in the chunk
  let score = 0;
  for (const qt of queryTokens) {
    if (chunkTokenSet.has(qt)) {
      // Exact match
      score += 2;
      // Bonus for each additional occurrence (up to 3)
      const count = chunkTokens.filter(t => t === qt).length;
      score += Math.min(count - 1, 3) * 0.5;
    } else {
      // Partial / substring match
      for (const ct of chunkTokenSet) {
        if (ct.includes(qt) || qt.includes(ct)) {
          score += 0.5;
          break;
        }
      }
    }
  }

  // Normalize by query length so longer queries don't inflate scores
  return queryTokens.length > 0 ? score / queryTokens.length : 0;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function getRelevantChunks(query: string, chunks: string[], topK: number = 5): string[] {
  if (chunks.length === 0) return [];
  if (chunks.length <= topK) return chunks;

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    // If the query has no useful tokens, return the first few chunks
    return chunks.slice(0, topK);
  }

  const scored = chunks.map((chunk, idx) => ({
    chunk,
    idx,
    score: scoreChunk(queryTokens, chunk),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.chunk);
}
