/**
 * P27: Performance and Load Testing SLO Evaluator
 *
 * Requirements:
 * 1. SLO validation:
 *    - search p95 < 300 ms
 *    - FX p95 < 100 ms (cache hit)
 *    - error rate < 0.5% (0.005)
 * 2. Dataset scale validation: dataset >= 500k places in perf environment.
 * 3. Hot path baseline comparison and regression detection.
 * 4. Kill switch and safe execution guard (Prohibits unapproved prod tests).
 */

export interface PerfRunMetrics {
  runId: string;
  datasetPlacesCount: number;
  searchP95Ms: number;
  fxP95Ms: number;
  errorRate: number;
  totalRequests: number;
  evaluatedAt: Date;
}

export interface BaselineMetrics {
  searchP95Ms: number;
  fxP95Ms: number;
  errorRate: number;
}

export interface SloEvaluationResult {
  passed: boolean;
  searchSloMet: boolean;
  fxSloMet: boolean;
  errorRateSloMet: boolean;
  datasetThresholdMet: boolean;
  regressions: string[];
  reportSummary: string;
}

export const PERF_SLO_LIMITS = {
  SEARCH_P95_MAX_MS: 300,
  FX_P95_MAX_MS: 100,
  ERROR_RATE_MAX: 0.005, // 0.5%
  MIN_DATASET_PLACES: 500000,
} as const;

export class PerfSloEvaluator {
  private killSwitchActive = false;
  private killSwitchReason?: string;

  constructor(
    readonly baseline: BaselineMetrics = {
      searchP95Ms: 180,
      fxP95Ms: 45,
      errorRate: 0.001,
    },
  ) {}

  /**
   * P27 Invariant: Prohibit load testing production without a designated window and kill switch.
   */
  assertSafeExecutionEnv(
    targetEnv: string,
    options: {
      isApprovedWindow?: boolean;
      killSwitchConfigured?: boolean;
    } = {},
  ): void {
    if (targetEnv.toLowerCase() === 'production' || targetEnv.toLowerCase() === 'prod') {
      if (!options.isApprovedWindow) {
        throw new Error(
          'Load test safety violation: Prohibited to load test production outside an approved maintenance window',
        );
      }
      if (!options.killSwitchConfigured) {
        throw new Error(
          'Load test safety violation: Prohibited to load test production without an active kill switch',
        );
      }
    }
  }

  triggerKillSwitch(reason: string): void {
    this.killSwitchActive = true;
    this.killSwitchReason = reason;
  }

  isKillSwitchActive(): boolean {
    return this.killSwitchActive;
  }

  getKillSwitchReason(): string | undefined {
    return this.killSwitchReason;
  }

  resetKillSwitch(): void {
    this.killSwitchActive = false;
    this.killSwitchReason = undefined;
  }

  /**
   * Evaluates k6 run metrics against defined SLOs and baseline comparison.
   */
  evaluateRun(metrics: PerfRunMetrics): SloEvaluationResult {
    // 1. Dataset size verification (P27 Acceptance: >= 500k places)
    const datasetThresholdMet = metrics.datasetPlacesCount >= PERF_SLO_LIMITS.MIN_DATASET_PLACES;

    // 2. SLO gates
    const searchSloMet = metrics.searchP95Ms < PERF_SLO_LIMITS.SEARCH_P95_MAX_MS;
    const fxSloMet = metrics.fxP95Ms < PERF_SLO_LIMITS.FX_P95_MAX_MS;
    const errorRateSloMet = metrics.errorRate < PERF_SLO_LIMITS.ERROR_RATE_MAX;

    // 3. Baseline regression checks (flags if degraded > 15% from baseline)
    const regressions: string[] = [];
    if (metrics.searchP95Ms > this.baseline.searchP95Ms * 1.15) {
      regressions.push(
        `Search latency degraded: ${metrics.searchP95Ms}ms vs baseline ${this.baseline.searchP95Ms}ms (+${(
          ((metrics.searchP95Ms - this.baseline.searchP95Ms) / this.baseline.searchP95Ms) *
          100
        ).toFixed(1)}%)`,
      );
    }
    if (metrics.fxP95Ms > this.baseline.fxP95Ms * 1.15) {
      regressions.push(
        `FX latency degraded: ${metrics.fxP95Ms}ms vs baseline ${this.baseline.fxP95Ms}ms (+${(
          ((metrics.fxP95Ms - this.baseline.fxP95Ms) / this.baseline.fxP95Ms) *
          100
        ).toFixed(1)}%)`,
      );
    }

    const passed = datasetThresholdMet && searchSloMet && fxSloMet && errorRateSloMet;

    const reportSummary = [
      `Perf Run Evaluation [${metrics.runId}]: ${passed ? 'PASSED' : 'FAILED'}`,
      `- Places Dataset: ${metrics.datasetPlacesCount.toLocaleString()} (Threshold >= 500,000): ${datasetThresholdMet ? 'PASS' : 'FAIL'}`,
      `- Search P95: ${metrics.searchP95Ms}ms (SLO < 300ms): ${searchSloMet ? 'PASS' : 'FAIL'}`,
      `- FX P95: ${metrics.fxP95Ms}ms (SLO < 100ms): ${fxSloMet ? 'PASS' : 'FAIL'}`,
      `- Error Rate: ${(metrics.errorRate * 100).toFixed(2)}% (SLO < 0.5%): ${errorRateSloMet ? 'PASS' : 'FAIL'}`,
      regressions.length > 0
        ? `- Regressions: ${regressions.join('; ')}`
        : '- Zero regressions detected against baseline',
    ].join('\n');

    return {
      passed,
      searchSloMet,
      fxSloMet,
      errorRateSloMet,
      datasetThresholdMet,
      regressions,
      reportSummary,
    };
  }
}

export const perfSloEvaluator = new PerfSloEvaluator();
