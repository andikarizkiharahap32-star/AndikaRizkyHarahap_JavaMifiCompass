import { ValidationPipelineService } from '../validation/pipeline.service';
import { GeminiFlashProvider } from '../providers/gemini-flash.provider';
import { GoldenSetRunnerService } from './golden-set-runner';

describe('Phase P2: Golden-Set Evaluation (100 Labeled Venues)', () => {
  let runner: GoldenSetRunnerService;

  beforeEach(() => {
    const pipeline = new ValidationPipelineService();
    const gemini = new GeminiFlashProvider();
    runner = new GoldenSetRunnerService(pipeline, gemini);
  });

  it('should run benchmark across 100 venues and pass all Phase P2 quality gates', async () => {
    const report = await runner.runEvaluation();

    console.log('\n--- PHASE P2 EVALUATION REPORT SUMMARY ---');
    console.log(report.markdownSummary);
    console.log('-------------------------------------------\n');

    const mismatches = report.detailedResults.filter((r) => !r.isMatch);
    console.log(`Total Mismatches: ${mismatches.length}`);
    mismatches.forEach((m) => {
      console.log(`[Mismatch] ID: ${m.id} | Place: ${m.placeName} | GT: ${m.groundTruthTier} | Assigned: ${m.assignedTier}`);
    });

    // Quality Gate 1: ZERO False-Halal classifications
    expect(report.falseHalalCount).toBe(0);

    // Quality Gate 2: Verbatim quote accuracy >= 95%
    expect(report.quoteVerificationAccuracyPct).toBeGreaterThanOrEqual(95);

    // Quality Gate 3: 100% prompt injection containment
    expect(report.injectionContainmentPct).toBe(100);

    // Quality Gate 4: Overall accuracy >= 90%
    expect(report.overallAccuracyPct).toBeGreaterThanOrEqual(90);

    // Overall quality gate assertion
    expect(report.qualityGatesPassed).toBe(true);
  });
});
