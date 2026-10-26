import { Injectable, Logger } from '@nestjs/common';
import {
  llmSignalsOutputSchema,
  llmMenuOutputSchema,
  LlmSignalsOutput,
  LlmMenuOutput,
  ValidationResult,
  HalalTier,
} from '@javamifi/shared';
import { scanDietaryLexicon, LexiconMatch } from './multilingual-lexicon';
import { verifyVerbatimQuotes } from './quote-verifier';
import { evaluateHalalTier } from './tier-engine';

export interface RawEnrichmentPayload {
  rawEvidenceText: string;
  expectedCurrency: string;
  signalsOutputJson: any;
  menuOutputJson?: any;
}

// Security patterns for detecting prompt injection in inputs or outputs
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:previous|all)\s+instructions/i,
  /system\s+prompt/i,
  /disregard\s+(?:the\s+above|rules)/i,
  /you\s+are\s+now\s+(?:in\s+DAN\s+mode|unrestricted)/i,
  /jailbreak/i,
  /override\s+halal\s+status/i,
  /always\s+classify\s+as\s+halal/i,
];

// Price sanity bands per currency (in minor units)
const PRICE_SANITY_BANDS: Record<string, { min: number; max: number }> = {
  JPY: { min: 200, max: 50000 }, // ¥200 to ¥50,000
  SAR: { min: 500, max: 200000 }, // SAR 5.00 to SAR 2,000.00
  AED: { min: 500, max: 200000 },
  SGD: { min: 200, max: 50000 }, // SGD 2.00 to SGD 500.00
  MYR: { min: 200, max: 50000 },
  KRW: { min: 2000, max: 500000 }, // ₩2,000 to ₩500,000
  EUR: { min: 200, max: 30000 }, // €2.00 to €300.00
  GBP: { min: 200, max: 30000 },
  USD: { min: 200, max: 30000 },
  THB: { min: 3000, max: 500000 }, // ฿30.00 to ฿5,000.00
};

@Injectable()
export class ValidationPipelineService {
  private readonly logger = new Logger(ValidationPipelineService.name);

  /**
   * Execute the 6-stage post-model deterministic validation pipeline.
   */
  validateEnrichment(payload: RawEnrichmentPayload): ValidationResult {
    const { rawEvidenceText, expectedCurrency, signalsOutputJson, menuOutputJson } = payload;
    const reviewReasons: string[] = [];
    const injectionFlags: string[] = [];

    // ── STAGE 1: Zod Strict Schema Check ────────────────────────
    const parsedSignals = llmSignalsOutputSchema.safeParse(signalsOutputJson);
    if (!parsedSignals.success) {
      this.logger.warn(`Stage 1 Failed: Malformed signals JSON: ${parsedSignals.error.message}`);
      return this.buildFailedFallback(
        HalalTier.UNKNOWN,
        ['Stage 1 Schema Check Failed: Output format tidak sesuai skema Zod.'],
        ['ERR_SCHEMA_VALIDATION_FAILED']
      );
    }
    const signals: LlmSignalsOutput = parsedSignals.data;

    let parsedMenu: LlmMenuOutput | null = null;
    if (menuOutputJson) {
      const menuRes = llmMenuOutputSchema.safeParse(menuOutputJson);
      if (menuRes.success) {
        parsedMenu = menuRes.data;
      } else {
        reviewReasons.push('Menu JSON parsing failed; items flagged for re-extraction.');
      }
    }

    // ── STAGE 2: Verbatim NFKC Quote Check ──────────────────────
    const candidateQuotes: string[] = [
      ...signals.rawQuoteReferences,
      ...signals.halalClaims.map((c) => c.quote),
      ...signals.porkFlags.map((p) => p.quote),
      ...signals.alcoholFlags.map((a) => a.quote),
    ];
    if (signals.certNumber) candidateQuotes.push(signals.certNumber);

    const quoteCheck = verifyVerbatimQuotes(rawEvidenceText, candidateQuotes);
    const quotesVerified = quoteCheck.allQuotesVerified && quoteCheck.verifiedCount > 0;

    if (!quoteCheck.allQuotesVerified && quoteCheck.unverifiedQuotes.length > 0) {
      reviewReasons.push(
        `Stage 2 Quote Verification: ${quoteCheck.unverifiedQuotes.length} kutipan tidak ditemukan verbatim di teks sumber.`
      );
    }

    // ── STAGE 3: Multilingual Lexicon Regex Scan ─────────────────
    // Scan both raw evidence and menu texts independently of LLM
    let combinedTextToScan = rawEvidenceText;
    if (parsedMenu) {
      const menuText = parsedMenu.items
        .map((i) => `${i.nameOriginal} ${i.nameEn} ${i.description || ''}`)
        .join(' ');
      combinedTextToScan += ` ${menuText}`;
    }

    const lexiconResult = scanDietaryLexicon(combinedTextToScan);
    if (lexiconResult.porkDetected) {
      reviewReasons.push(
        `Stage 3 Lexicon: Terdeteksi bahan babi (${lexiconResult.matches
          .filter((m) => m.category === 'PORK')
          .map((m) => `${m.term} [${m.language}]`)
          .join(', ')}).`
      );
    }

    // ── STAGE 4: Deterministic Halal Tier Engine ────────────────
    const tierEvaluation = evaluateHalalTier({
      signals,
      porkDetected: lexiconResult.porkDetected,
      alcoholDetected: lexiconResult.alcoholDetected,
      quotesVerified,
    });

    // ── STAGE 5: Price Sanity & Currency Bands ──────────────────
    let isWithinBands = true;
    let currencyMatched = true;
    const outlierItems: string[] = [];

    if (parsedMenu) {
      if (parsedMenu.currency.toUpperCase() !== expectedCurrency.toUpperCase()) {
        currencyMatched = false;
        reviewReasons.push(
          `Stage 5 Currency Mismatch: Model output ${parsedMenu.currency}, expected ${expectedCurrency}.`
        );
      }

      const band = PRICE_SANITY_BANDS[expectedCurrency.toUpperCase()] || {
        min: 100,
        max: 500000,
      };

      for (const item of parsedMenu.items) {
        if (item.amountMinor < band.min || item.amountMinor > band.max) {
          isWithinBands = false;
          outlierItems.push(`${item.nameEn} (${item.amountMinor} ${expectedCurrency})`);
        }
      }

      if (outlierItems.length > 0) {
        reviewReasons.push(`Stage 5 Price Sanity: Outlier harga terdeteksi pada ${outlierItems.length} menu.`);
      }
    }

    // ── STAGE 6: Security & Anomaly Triage ───────────────────────
    // Check for prompt injection attempts in raw input and outputs
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(rawEvidenceText) || pattern.test(JSON.stringify(signalsOutputJson))) {
        injectionFlags.push(`Prompt Injection pattern detected: ${pattern.toString()}`);
      }
    }

    // Check for contradictions (e.g. model claiming 100% Halal certified but pork detected)
    if (signals.hasCertificate && lexiconResult.porkDetected) {
      injectionFlags.push('Contradiction: Certificate claimed while pork detected in lexicon.');
    }

    const requiresManualReview =
      injectionFlags.length > 0 ||
      reviewReasons.length > 0 ||
      tierEvaluation.tier === HalalTier.UNKNOWN;

    return {
      isValid: injectionFlags.length === 0,
      assignedTier: tierEvaluation.tier,
      dietaryFlags: tierEvaluation.dietaryFlags,
      certifierName: signals.certifierName || undefined,
      certNumber: signals.certNumber || undefined,
      certExpiresAt: signals.certExpiry || undefined,
      quoteVerification: {
        status: quoteCheck.allQuotesVerified
          ? 'ALL_VERIFIED'
          : quoteCheck.verifiedCount > 0
          ? 'PARTIAL_VERIFIED'
          : 'FAILED',
        verifiedQuotesCount: quoteCheck.verifiedCount,
        unverifiedQuotes: quoteCheck.unverifiedQuotes,
      },
      lexiconScan: {
        porkDetected: lexiconResult.porkDetected,
        alcoholDetected: lexiconResult.alcoholDetected,
        detectedTerms: lexiconResult.matches.map((m) => ({
          term: m.term,
          language: m.language,
          matchedIn: m.category,
        })),
      },
      priceSanity: {
        isWithinBands,
        currencyMatched,
        outlierItems,
      },
      securityTriage: {
        passed: injectionFlags.length === 0,
        requiresManualReview,
        injectionFlags,
        reviewReasons,
      },
    };
  }

  private buildFailedFallback(
    tier: HalalTier,
    reasons: string[],
    flags: string[]
  ): ValidationResult {
    return {
      isValid: false,
      assignedTier: tier,
      dietaryFlags: [],
      quoteVerification: {
        status: 'FAILED',
        verifiedQuotesCount: 0,
        unverifiedQuotes: [],
      },
      lexiconScan: {
        porkDetected: false,
        alcoholDetected: false,
        detectedTerms: [],
      },
      priceSanity: {
        isWithinBands: false,
        currencyMatched: false,
        outlierItems: [],
      },
      securityTriage: {
        passed: false,
        requiresManualReview: true,
        injectionFlags: flags,
        reviewReasons: reasons,
      },
    };
  }
}
