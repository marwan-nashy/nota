import { Page } from '../types';

export interface BM25SearchResult {
  page: Page;
  score: number;
  matchedTerms: string[];
  snippet: string;
}

export interface RelatedPageResult {
  page: Page;
  similarity: number; // 0 to 1
  sharedKeywords: string[];
}

// Unicode-aware word tokenization (Arabic, Latin, digits)
export function tokenize(text: string): string[] {
  if (!text) return [];
  // Strip HTML tags if any
  const clean = text.replace(/<[^>]*>/g, ' ').toLowerCase();
  // Match word characters across all alphabets
  const matches = clean.match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.filter((w) => w.length > 1) : [];
}

// Simple stop words for English and Arabic to refine semantic ranking
const STOP_WORDS = new Set([
  // English
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'as', 'by',
  'that', 'this', 'it', 'from', 'or', 'be', 'are', 'was', 'were', 'not', 'can', 'will', 'my', 'all',
  // Arabic
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'هو', 'هي', 'أن', 'إن', 'كان', 'ما', 'لا', 'كل', 'أو', 'ثم'
]);

export class BM25Engine {
  private k1: number = 1.2;
  private b: number = 0.75;

  /**
   * Search pages using Okapi BM25 ranking algorithm
   */
  public search(pages: Record<string, Page>, query: string, limit: number = 10): BM25SearchResult[] {
    const queryTokens = tokenize(query).filter((t) => !STOP_WORDS.has(t) || query.trim().length <= 3);
    if (queryTokens.length === 0) {
      // Fallback: if single short word, tokenize directly
      const raw = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (raw.length === 0) return [];
      queryTokens.push(...raw);
    }

    const docList = Object.values(pages).filter((p) => !p.isArchived);
    const N = docList.length;
    if (N === 0) return [];

    // Document token representations
    const docTokensMap: Map<string, string[]> = new Map();
    let totalDocLen = 0;

    for (const page of docList) {
      const titleTokens = tokenize(page.title);
      // Boost title terms 3x
      const boostedTitle = [...titleTokens, ...titleTokens, ...titleTokens];
      const tagTokens = (page.tags || []).flatMap((t) => tokenize(t));
      const blockTokens = page.blocks.flatMap((b) => tokenize(b.content));

      const allTokens = [...boostedTitle, ...tagTokens, ...blockTokens];
      docTokensMap.set(page.id, allTokens);
      totalDocLen += allTokens.length;
    }

    const avgdl = totalDocLen / (N || 1);

    // Compute Document Frequency DF(q) for each query token
    const dfMap: Map<string, number> = new Map();
    for (const q of queryTokens) {
      let count = 0;
      for (const page of docList) {
        const tokens = docTokensMap.get(page.id) || [];
        if (tokens.includes(q)) {
          count++;
        }
      }
      dfMap.set(q, count);
    }

    // Compute BM25 scores
    const results: BM25SearchResult[] = [];

    for (const page of docList) {
      const tokens = docTokensMap.get(page.id) || [];
      const docLen = tokens.length;
      let score = 0;
      const matchedTerms: string[] = [];

      // Calculate term frequencies in this document
      const tfMap: Map<string, number> = new Map();
      for (const t of tokens) {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      }

      for (const q of queryTokens) {
        const tf = tfMap.get(q) || 0;
        if (tf > 0) {
          matchedTerms.push(q);
          const df = dfMap.get(q) || 0;
          // Standard Okapi BM25 IDF
          const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
          // Term score component
          const numerator = tf * (this.k1 + 1);
          const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / (avgdl || 1)));
          score += idf * (numerator / (denominator || 1));
        }
      }

      // Title exact match bonus
      if (page.title.toLowerCase().includes(query.toLowerCase().trim())) {
        score += 3.5;
      }

      if (score > 0) {
        // Extract a preview snippet containing the matched query
        const snippet = this.extractSnippet(page, queryTokens);
        results.push({ page, score, matchedTerms, snippet });
      }
    }

    // Sort descending by BM25 score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  private extractSnippet(page: Page, queryTokens: string[]): string {
    for (const block of page.blocks) {
      const lower = block.content.toLowerCase();
      if (queryTokens.some((q) => lower.includes(q))) {
        // Clean HTML
        const text = block.content.replace(/<[^>]*>/g, '').trim();
        if (text.length <= 120) return text;
        const firstMatchIndex = Math.min(
          ...queryTokens.map((q) => lower.indexOf(q)).filter((i) => i >= 0)
        );
        const start = Math.max(0, firstMatchIndex - 30);
        const end = Math.min(text.length, firstMatchIndex + 90);
        return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
      }
    }
    return page.blocks[0]?.content.replace(/<[^>]*>/g, '').slice(0, 100) || '';
  }
}

/**
 * Compute "Related Notes by Meaning" using TF-IDF Cosine Similarity
 */
export function findRelatedPages(
  currentPageId: string,
  pages: Record<string, Page>,
  limit: number = 3
): RelatedPageResult[] {
  const currentPage = pages[currentPageId];
  if (!currentPage || currentPage.isArchived) return [];

  const candidates = Object.values(pages).filter(
    (p) => !p.isArchived && p.id !== currentPageId
  );
  if (candidates.length === 0) return [];

  const allPages = [currentPage, ...candidates];
  const N = allPages.length;

  // Extract filtered tokens per document
  const docTokens: Map<string, string[]> = new Map();
  const docFrequencies: Map<string, number> = new Map();

  for (const p of allPages) {
    const rawTokens = [
      ...tokenize(p.title),
      ...(p.tags || []).flatMap((t) => tokenize(t)),
      ...p.blocks.flatMap((b) => tokenize(b.content)),
    ].filter((w) => !STOP_WORDS.has(w) && w.length >= 3);

    docTokens.set(p.id, rawTokens);

    const uniqueInDoc = new Set(rawTokens);
    for (const term of uniqueInDoc) {
      docFrequencies.set(term, (docFrequencies.get(term) || 0) + 1);
    }
  }

  // Helper to compute TF-IDF vector
  function getTfidfVector(tokens: string[]): Map<string, number> {
    const tf: Map<string, number> = new Map();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }

    const vector: Map<string, number> = new Map();
    for (const [term, count] of tf.entries()) {
      const df = docFrequencies.get(term) || 1;
      const idf = Math.log(N / df);
      vector.set(term, (count / tokens.length) * idf);
    }
    return vector;
  }

  const currentVector = getTfidfVector(docTokens.get(currentPageId) || []);
  if (currentVector.size === 0) return [];

  // Current vector norm
  let currentNorm = 0;
  for (const val of currentVector.values()) {
    currentNorm += val * val;
  }
  currentNorm = Math.sqrt(currentNorm);
  if (currentNorm === 0) return [];

  const results: RelatedPageResult[] = [];

  for (const candidate of candidates) {
    const candidateVector = getTfidfVector(docTokens.get(candidate.id) || []);
    let dotProduct = 0;
    let candidateNorm = 0;
    const sharedKeywords: string[] = [];

    for (const [term, val] of candidateVector.entries()) {
      candidateNorm += val * val;
      if (currentVector.has(term)) {
        dotProduct += (currentVector.get(term) || 0) * val;
        sharedKeywords.push(term);
      }
    }

    candidateNorm = Math.sqrt(candidateNorm);
    if (candidateNorm > 0 && dotProduct > 0) {
      const similarity = dotProduct / (currentNorm * candidateNorm);
      if (similarity >= 0.12) {
        results.push({
          page: candidate,
          similarity: Math.min(1, similarity),
          sharedKeywords: sharedKeywords.slice(0, 4),
        });
      }
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, limit);
}

export const bm25 = new BM25Engine();
