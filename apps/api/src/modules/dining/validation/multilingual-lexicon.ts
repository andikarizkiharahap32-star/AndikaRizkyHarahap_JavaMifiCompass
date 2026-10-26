/**
 * 12-Language Deterministic Lexicon for Pork & Alcohol Detection
 * Languages: Japanese, Chinese, Korean, Indonesian/Malay, Arabic, Turkish,
 * French, German, Italian, Thai, English, Spanish.
 */

export interface LexiconMatch {
  term: string;
  category: 'PORK' | 'ALCOHOL';
  language: string;
}

interface LexiconEntry {
  category: 'PORK' | 'ALCOHOL';
  language: string;
  pattern: RegExp;
}

// Normalized regex patterns
const LEXICON_ENTRIES: LexiconEntry[] = [
  // ── 1. Japanese (JA) ──
  { category: 'PORK', language: 'Japanese', pattern: /(?:豚肉|ポーク|ベーコン|ラード|チャーシュー|焼豚|とんかつ|豚骨|とんこつ)/i },
  { category: 'ALCOHOL', language: 'Japanese', pattern: /(?:みりん|味醂|日本酒|清酒|料理酒|ワイン|ビール|焼酎)/i },

  // ── 2. Chinese (ZH) ──
  { category: 'PORK', language: 'Chinese', pattern: /(?:猪肉|豬肉|猪油|豬油|叉烧|叉燒|培根|五花肉|猪排|豬排)/i },
  { category: 'ALCOHOL', language: 'Chinese', pattern: /(?:料酒|黄酒|黃酒|白酒|米酒|啤酒|红酒|紅酒|花雕酒)/i },

  // ── 3. Korean (KO) ──
  { category: 'PORK', language: 'Korean', pattern: /(?:돼지고기|삼겹살|돼지|돈가스|베이컨|라드|제육)/i },
  { category: 'ALCOHOL', language: 'Korean', pattern: /(?:소주|맥주|미림|맛술|청주|와인)/i },

  // ── 4. Indonesian / Malay (ID/MS) ──
  { category: 'PORK', language: 'Indonesian/Malay', pattern: /\b(?:babi|pork|lard|minyak\s*babi|daging\s*babi|celeng|char\s*siu|bacon|ham)\b/i },
  { category: 'ALCOHOL', language: 'Indonesian/Malay', pattern: /\b(?:arak|khamr|angciu|mirin|sake|soju|bir|wine|tuak|minuman\s*keras)\b/i },

  // ── 5. Arabic (AR) ──
  { category: 'PORK', language: 'Arabic', pattern: /(?:خنزير|لحم\s*خنزير|شحم\s*خنزير|باكون)/i },
  { category: 'ALCOHOL', language: 'Arabic', pattern: /(?:خمر|كحول|نبيذ|بيرة|مسكر)/i },

  // ── 6. Turkish (TR) ──
  { category: 'PORK', language: 'Turkish', pattern: /\b(?:domuz|domuz\s*eti|domuz\s*yagi|domuz\s*yağı|pastırma\s*domuz)\b/i },
  { category: 'ALCOHOL', language: 'Turkish', pattern: /\b(?:şarap|sarap|rakı|raki|bira|likör|alkol)\b/i },

  // ── 7. French (FR) ──
  { category: 'PORK', language: 'French', pattern: /\b(?:porc|lard|jambon|bacon|saucisse\s*de\s*porc|boudin|rillettes\s*de\s*porc)\b/i },
  { category: 'ALCOHOL', language: 'French', pattern: /\b(?:vin|vin\s*rouge|vin\s*blanc|cognac|rhum|biere|bière|eau\s*de\s*vie)\b/i },

  // ── 8. German (DE) ──
  { category: 'PORK', language: 'German', pattern: /\b(?:schwein|schweinefleisch|speck|schmalz|schweineschmalz|schinken)\b/i },
  { category: 'ALCOHOL', language: 'German', pattern: /\b(?:bier|wein|schnaps|rum|likor|likör|branntwein)\b/i },

  // ── 9. Italian (IT) ──
  { category: 'PORK', language: 'Italian', pattern: /\b(?:maiale|carne\s*di\s*maiale|pancetta|prosciutto\s*crudo|lardo|guanciale|salame)\b/i },
  { category: 'ALCOHOL', language: 'Italian', pattern: /\b(?:vino|vino\s*rosso|vino\s*bianco|birra|grappa|marsala|limoncello)\b/i },

  // ── 10. Thai (TH) ──
  { category: 'PORK', language: 'Thai', pattern: /(?:หมู|เนื้อหมู|มันหมู|หมูกรอบ|หมูแดง|เบคอน)/i },
  { category: 'ALCOHOL', language: 'Thai', pattern: /(?:เหล้า|เบียร์|ไวน์|สุรา)/i },

  // ── 11. English (EN) ──
  { category: 'PORK', language: 'English', pattern: /\b(?:pork|bacon|ham|lard|prosciutto|pancetta|carnitas|pork\s*chops|pepperoni\s*\(pork\))\b/i },
  { category: 'ALCOHOL', language: 'English', pattern: /\b(?:wine|beer|alcohol|rum|vodka|whiskey|bourbon|brandy|sake|mirin|liqueur|champagne|cocktail|cocktails|byob|bring-your-own-bottle|ales|ciders)\b/i },

  // ── 12. Spanish (ES) ──
  { category: 'PORK', language: 'Spanish', pattern: /\b(?:cerdo|carne\s*de\s*cerdo|tocino|jamon|jamón|manteca\s*de\s*cerdo|chorizo)\b/i },
  { category: 'ALCOHOL', language: 'Spanish', pattern: /\b(?:vino|cerveza|licor|ron|tequila|coñac)\b/i },
];

/**
 * Normalize text to NFKC Unicode, collapse whitespace, strip zero-width characters.
 */
export function normalizeInspectionText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // strip zero-width chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a dietary match is explicitly negated in the surrounding context.
 * e.g. "without mirin or sake", "No pork or lard", "pork-free", "无猪油", "zero pork".
 */
export function isTermNegated(fullText: string, matchIndex: number, termLength: number): boolean {
  // 1. Check immediate suffix (e.g. "pork-free", "alcohol-free", "豚肉不使用")
  const suffix = fullText.slice(matchIndex + termLength, matchIndex + termLength + 15);
  if (/^-(?:free|frei|libre)/i.test(suffix)) return true;
  if (/^(?:\s*不使用|\s*なし|\s*抜き|\s*없음|\s*불포함)/.test(suffix)) return true;

  // 2. Check preceding context within the same sentence/clause (up to 80 chars)
  const lastBoundary = Math.max(
    0,
    fullText.lastIndexOf('.', matchIndex),
    fullText.lastIndexOf(';', matchIndex),
    fullText.lastIndexOf('!', matchIndex)
  );
  const prefix = fullText.slice(Math.max(lastBoundary, matchIndex - 80), matchIndex);

  // CJK direct negation prefix (e.g. 无猪油, (无猪油), 不含酒精)
  if (/(?:无|無|不含|零)[(\s]*$/i.test(prefix.trim())) return true;

  // Latin negation phrases (e.g. "without mirin or sake", "no pork or lard", "they dont serve pork", "zero pork or alcohol")
  const latinNegationRegex = /\b(?:no|not|dont|don't|doesnt|doesn't|do\s*not|does\s*not|didnt|didn't|did\s*not|without|zero|never|tanpa|tidak|bukan|bebas|strict\s*no|free\s*from|free\s*of|neither|nor)\b[\w\s,/(/)]*$/i;
  if (latinNegationRegex.test(prefix)) return true;

  return false;
}

/**
 * Scan raw text against the 12-language lexicon.
 * Returns all detected pork and alcohol occurrences with language & category.
 */
export function scanDietaryLexicon(rawText: string): {
  porkDetected: boolean;
  alcoholDetected: boolean;
  matches: LexiconMatch[];
} {
  const normalized = normalizeInspectionText(rawText);
  const matches: LexiconMatch[] = [];

  for (const entry of LEXICON_ENTRIES) {
    const globalPattern = new RegExp(entry.pattern.source, 'gi');
    const allMatches = normalized.matchAll(globalPattern);
    for (const match of allMatches) {
      if (match[0] && match.index !== undefined) {
        // Skip match if it is explicitly negated in the text
        if (isTermNegated(normalized, match.index, match[0].length)) {
          continue;
        }

        matches.push({
          term: match[0],
          category: entry.category,
          language: entry.language,
        });
      }
    }
  }

  const porkDetected = matches.some((m) => m.category === 'PORK');
  const alcoholDetected = matches.some((m) => m.category === 'ALCOHOL');

  return {
    porkDetected,
    alcoholDetected,
    matches,
  };
}
