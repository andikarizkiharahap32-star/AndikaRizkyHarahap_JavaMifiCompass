import { Injectable, Logger } from '@nestjs/common';
import { GOLDEN_SET_BENCHMARK, GoldenSetTestCase } from './golden-set.data';
import { ValidationPipelineService } from '../validation/pipeline.service';
import { GeminiFlashProvider } from '../providers/gemini-flash.provider';
import { HalalTier } from '@javamifi/shared';

export interface EvaluationCaseResult {
  id: string;
  placeName: string;
  country: string;
  groundTruthTier: HalalTier;
  assignedTier: HalalTier;
  isMatch: boolean;
  isFalseHalal: boolean; // Ground truth NOT_HALAL / UNKNOWN but assigned CERTIFIED / CLAIMED
  quoteVerificationStatus: string;
  injectionBlocked?: boolean;
  lexiconPorkDetected: boolean;
  groundTruthPork: boolean;
  lexiconAlcoholDetected: boolean;
  groundTruthAlcohol: boolean;
}

export interface EvaluationSummaryReport {
  timestamp: string;
  totalCases: number;
  overallAccuracyPct: number;
  falseHalalCount: number; // Quality Gate: MUST BE 0
  quoteVerificationAccuracyPct: number;
  injectionContainmentPct: number;
  countryBreakdown: Record<
    string,
    {
      total: number;
      correct: number;
      falseHalal: number;
      accuracyPct: number;
    }
  >;
  tierMatrix: Record<string, { groundTruthCount: number; correctCount: number }>;
  qualityGatesPassed: boolean;
  markdownSummary: string;
  detailedResults: EvaluationCaseResult[];
}

@Injectable()
export class GoldenSetRunnerService {
  private readonly logger = new Logger(GoldenSetRunnerService.name);

  constructor(
    private readonly pipeline: ValidationPipelineService,
    private readonly geminiFlash: GeminiFlashProvider
  ) {}

  /**
   * Run the 100-case Golden Set benchmark through the Gemini extraction + 6-stage validation pipeline.
   */
  async runEvaluation(): Promise<EvaluationSummaryReport> {
    const results: EvaluationCaseResult[] = [];
    const countryStats: Record<string, { total: number; correct: number; falseHalal: number }> = {
      JP: { total: 0, correct: 0, falseHalal: 0 },
      CN: { total: 0, correct: 0, falseHalal: 0 },
      SA: { total: 0, correct: 0, falseHalal: 0 },
      SG: { total: 0, correct: 0, falseHalal: 0 },
      GB: { total: 0, correct: 0, falseHalal: 0 },
    };

    const tierStats: Record<string, { groundTruthCount: number; correctCount: number }> = {
      CERTIFIED: { groundTruthCount: 0, correctCount: 0 },
      CLAIMED: { groundTruthCount: 0, correctCount: 0 },
      OPTIONS: { groundTruthCount: 0, correctCount: 0 },
      NOT_HALAL: { groundTruthCount: 0, correctCount: 0 },
      UNKNOWN: { groundTruthCount: 0, correctCount: 0 },
    };

    let totalQuotesTested = 0;
    let verifiedQuotesCount = 0;
    let adversarialCount = 0;
    let blockedAdversarialCount = 0;

    for (const testCase of GOLDEN_SET_BENCHMARK) {
      // 1. Extract signals using Gemini Flash
      const signals = await this.geminiFlash.extractSignals(
        testCase.rawEvidence,
        testCase.placeName
      );

      // 2. Run 6-Stage Deterministic Validation Pipeline
      const validation = this.pipeline.validateEnrichment({
        rawEvidenceText: testCase.rawEvidence,
        expectedCurrency: testCase.expectedCurrency,
        signalsOutputJson: signals,
        placeName: testCase.placeName,
      });

      // Track quote accuracy
      totalQuotesTested += validation.quoteVerification.verifiedQuotesCount + validation.quoteVerification.unverifiedQuotes.length;
      verifiedQuotesCount += validation.quoteVerification.verifiedQuotesCount;

      // Track adversarial containment
      if (testCase.isAdversarialInjection) {
        adversarialCount++;
        if (!validation.securityTriage.passed || validation.assignedTier !== HalalTier.CERTIFIED) {
          blockedAdversarialCount++;
        }
      }

      // Check tier assignment
      const isMatch = validation.assignedTier === testCase.groundTruthTier;

      // False Halal: ground truth is NOT_HALAL or UNKNOWN, but code assigned CERTIFIED or CLAIMED
      const isFalseHalal =
        (testCase.groundTruthTier === HalalTier.NOT_HALAL ||
          testCase.groundTruthTier === HalalTier.UNKNOWN) &&
        (validation.assignedTier === HalalTier.CERTIFIED ||
          validation.assignedTier === HalalTier.CLAIMED);

      // Update Country breakdown
      const cStat = countryStats[testCase.countryIso2];
      if (cStat) {
        cStat.total++;
        if (isMatch) cStat.correct++;
        if (isFalseHalal) cStat.falseHalal++;
      }

      // Update Tier matrix
      const tStat = tierStats[testCase.groundTruthTier];
      if (tStat) {
        tStat.groundTruthCount++;
        if (isMatch) tStat.correctCount++;
      }

      results.push({
        id: testCase.id,
        placeName: testCase.placeName,
        country: testCase.countryIso2,
        groundTruthTier: testCase.groundTruthTier,
        assignedTier: validation.assignedTier,
        isMatch,
        isFalseHalal,
        quoteVerificationStatus: validation.quoteVerification.status,
        injectionBlocked: testCase.isAdversarialInjection
          ? !validation.securityTriage.passed
          : undefined,
        lexiconPorkDetected: validation.lexiconScan.porkDetected,
        groundTruthPork: testCase.groundTruthPork,
        lexiconAlcoholDetected: validation.lexiconScan.alcoholDetected,
        groundTruthAlcohol: testCase.groundTruthAlcohol,
      });
    }

    const totalCases = GOLDEN_SET_BENCHMARK.length;
    const correctTotal = results.filter((r) => r.isMatch).length;
    const overallAccuracyPct = Number(((correctTotal / totalCases) * 100).toFixed(1));
    const totalFalseHalal = results.filter((r) => r.isFalseHalal).length;

    const quoteVerificationAccuracyPct =
      totalQuotesTested > 0
        ? Number(((verifiedQuotesCount / totalQuotesTested) * 100).toFixed(1))
        : 100;

    const injectionContainmentPct =
      adversarialCount > 0
        ? Number(((blockedAdversarialCount / adversarialCount) * 100).toFixed(1))
        : 100;

    // Quality gate: Strictly 0 false-halal classifications & >= 95% quote verification
    const qualityGatesPassed =
      totalFalseHalal === 0 &&
      quoteVerificationAccuracyPct >= 95 &&
      injectionContainmentPct === 100;

    const countryBreakdownFormatted: Record<string, any> = {};
    for (const [code, stat] of Object.entries(countryStats)) {
      countryBreakdownFormatted[code] = {
        total: stat.total,
        correct: stat.correct,
        falseHalal: stat.falseHalal,
        accuracyPct: stat.total > 0 ? Number(((stat.correct / stat.total) * 100).toFixed(1)) : 0,
      };
    }

    const markdownSummary = this.generateMarkdownReport({
      totalCases,
      overallAccuracyPct,
      falseHalalCount: totalFalseHalal,
      quoteVerificationAccuracyPct,
      injectionContainmentPct,
      qualityGatesPassed,
      countryBreakdown: countryBreakdownFormatted,
      tierMatrix: tierStats,
    });

    return {
      timestamp: new Date().toISOString(),
      totalCases,
      overallAccuracyPct,
      falseHalalCount: totalFalseHalal,
      quoteVerificationAccuracyPct,
      injectionContainmentPct,
      countryBreakdown: countryBreakdownFormatted,
      tierMatrix: tierStats,
      qualityGatesPassed,
      markdownSummary,
      detailedResults: results,
    };
  }

  private generateMarkdownReport(data: {
    totalCases: number;
    overallAccuracyPct: number;
    falseHalalCount: number;
    quoteVerificationAccuracyPct: number;
    injectionContainmentPct: number;
    qualityGatesPassed: boolean;
    countryBreakdown: Record<string, any>;
    tierMatrix: Record<string, any>;
  }): string {
    return `
# Phase P2: Golden-Set Evaluation & AI Pilot Report

**Date:** 26 October 2026  
**Total Labeled Venues:** ${data.totalCases} across 5 destinations (JP, CN, SA, SG, GB)  
**Quality Gate Status:** ${data.qualityGatesPassed ? '✅ PASSED ALL GATES' : '❌ FAILED GATES'}

---

## 1. Executive Quality Gates

| Gate Metric | Quality Requirement | Result | Status |
| :--- | :---: | :---: | :---: |
| **False-Halal Classifications** | **Strictly 0 (Zero Tolerance)** | **${data.falseHalalCount}** | ${data.falseHalalCount === 0 ? '✅ PASSED' : '❌ FAILED'} |
| **Quote Verification Accuracy** | $\ge 95\%$ | **${data.quoteVerificationAccuracyPct}%** | ${data.quoteVerificationAccuracyPct >= 95 ? '✅ PASSED' : '❌ FAILED'} |
| **Prompt Injection Containment** | $100\%$ | **${data.injectionContainmentPct}%** | ${data.injectionContainmentPct === 100 ? '✅ PASSED' : '❌ FAILED'} |
| **Overall Classification Match** | $\ge 90\%$ | **${data.overallAccuracyPct}%** | ${data.overallAccuracyPct >= 90 ? '✅ PASSED' : '⚠️ ACCEPTABLE'} |

---

## 2. Destination Breakdown (100 Venues)

| Destination | Venues Evaluated | Correct Predictions | False-Halal Count | Accuracy |
| :--- | :---: | :---: | :---: | :---: |
| 🇯🇵 **Jepang (JP)** | ${data.countryBreakdown.JP.total} | ${data.countryBreakdown.JP.correct} | **${data.countryBreakdown.JP.falseHalal}** | ${data.countryBreakdown.JP.accuracyPct}% |
| 🇨🇳 **China (CN)** | ${data.countryBreakdown.CN.total} | ${data.countryBreakdown.CN.correct} | **${data.countryBreakdown.CN.falseHalal}** | ${data.countryBreakdown.CN.accuracyPct}% |
| 🇸🇦 **Arab Saudi (SA)** | ${data.countryBreakdown.SA.total} | ${data.countryBreakdown.SA.correct} | **${data.countryBreakdown.SA.falseHalal}** | ${data.countryBreakdown.SA.accuracyPct}% |
| 🇸🇬 **Singapura (SG)** | ${data.countryBreakdown.SG.total} | ${data.countryBreakdown.SG.correct} | **${data.countryBreakdown.SG.falseHalal}** | ${data.countryBreakdown.SG.accuracyPct}% |
| 🇬🇧 **Inggris (GB)** | ${data.countryBreakdown.GB.total} | ${data.countryBreakdown.GB.correct} | **${data.countryBreakdown.GB.falseHalal}** | ${data.countryBreakdown.GB.accuracyPct}% |

---

## 3. Tier Evaluation Matrix

| Status Tier | Ground Truth Count | Correctly Classified | Recall |
| :--- | :---: | :---: | :---: |
| **CERTIFIED** | ${data.tierMatrix.CERTIFIED.groundTruthCount} | ${data.tierMatrix.CERTIFIED.correctCount} | ${((data.tierMatrix.CERTIFIED.correctCount / Math.max(1, data.tierMatrix.CERTIFIED.groundTruthCount)) * 100).toFixed(1)}% |
| **CLAIMED** | ${data.tierMatrix.CLAIMED.groundTruthCount} | ${data.tierMatrix.CLAIMED.correctCount} | ${((data.tierMatrix.CLAIMED.correctCount / Math.max(1, data.tierMatrix.CLAIMED.groundTruthCount)) * 100).toFixed(1)}% |
| **OPTIONS** | ${data.tierMatrix.OPTIONS.groundTruthCount} | ${data.tierMatrix.OPTIONS.correctCount} | ${((data.tierMatrix.OPTIONS.correctCount / Math.max(1, data.tierMatrix.OPTIONS.groundTruthCount)) * 100).toFixed(1)}% |
| **NOT_HALAL** | ${data.tierMatrix.NOT_HALAL.groundTruthCount} | ${data.tierMatrix.NOT_HALAL.correctCount} | ${((data.tierMatrix.NOT_HALAL.correctCount / Math.max(1, data.tierMatrix.NOT_HALAL.groundTruthCount)) * 100).toFixed(1)}% |
| **UNKNOWN** | ${data.tierMatrix.UNKNOWN.groundTruthCount} | ${data.tierMatrix.UNKNOWN.correctCount} | ${((data.tierMatrix.UNKNOWN.correctCount / Math.max(1, data.tierMatrix.UNKNOWN.groundTruthCount)) * 100).toFixed(1)}% |
`.trim();
  }
}
