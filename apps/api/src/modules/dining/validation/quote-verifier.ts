import { normalizeInspectionText } from './multilingual-lexicon';

export interface QuoteVerificationResult {
  allQuotesVerified: boolean;
  verifiedCount: number;
  totalQuotes: number;
  unverifiedQuotes: string[];
}

/**
 * Stage 2: Verbatim NFKC Quote Verification
 * Every quote cited by the AI model must exist as a verbatim substring
 * in the raw source evidence text, normalized using Unicode NFKC.
 */
export function verifyVerbatimQuotes(
  sourceText: string,
  candidateQuotes: string[]
): QuoteVerificationResult {
  const normalizedSource = normalizeInspectionText(sourceText).toLowerCase();
  const unverified: string[] = [];
  let verifiedCount = 0;

  for (const quote of candidateQuotes) {
    const normalizedQuote = normalizeInspectionText(quote).toLowerCase();

    // Ignore empty or whitespace-only quotes
    if (!normalizedQuote || normalizedQuote.length < 3) {
      continue;
    }

    if (normalizedSource.includes(normalizedQuote)) {
      verifiedCount++;
    } else {
      unverified.push(quote);
    }
  }

  const total = candidateQuotes.filter((q) => q && q.trim().length >= 3).length;

  return {
    allQuotesVerified: unverified.length === 0,
    verifiedCount,
    totalQuotes: total,
    unverifiedQuotes: unverified,
  };
}
