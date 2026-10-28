/**
 * P24: Progressive Delivery Controller & Auto-Rollback Engine
 *
 * Requirements:
 * 1. Progressive delivery: canary 5% -> 50% -> 100%.
 * 2. Auto-rollback immediately on SLO breach (error rate > 0.1%, p95 latency > 250ms).
 * 3. Rollback drill executed and verified.
 * 4. Prohibition: Do not deploy from developer machines (executed via CI OIDC runner).
 */

export interface SloThresholds {
  maxErrorRate: number; // e.g., 0.001 (0.1%)
  maxP95LatencyMs: number; // e.g., 250ms
}

export interface CanaryMetrics {
  totalRequests: number;
  errorCount: number;
  p95LatencyMs: number;
}

export interface RollbackDrillResult {
  success: boolean;
  drillTimestamp: string;
  initialWeight: number;
  rolledBackToWeight: number;
  rollbackDurationMs: number;
  reason: string;
}

export class CanaryController {
  readonly steps = [5, 50, 100] as const;
  private currentWeight = 0;
  private isRolledBack = false;

  constructor(
    readonly slo: SloThresholds = {
      maxErrorRate: 0.001, // 0.1% max errors allowed
      maxP95LatencyMs: 250, // 250ms max p95 latency
    },
  ) {}

  getCurrentWeight(): number {
    return this.currentWeight;
  }

  isRollbackActive(): boolean {
    return this.isRolledBack;
  }

  /**
   * Evaluates incoming real-time metrics against production SLO thresholds.
   */
  evaluateSlo(metrics: CanaryMetrics): { healthy: boolean; breachReason?: string } {
    if (metrics.totalRequests === 0) {
      return { healthy: true };
    }

    const currentErrorRate = metrics.errorCount / metrics.totalRequests;
    if (currentErrorRate > this.slo.maxErrorRate) {
      return {
        healthy: false,
        breachReason: `Error rate ${(currentErrorRate * 100).toFixed(2)}% breached SLO threshold of ${(this.slo.maxErrorRate * 100).toFixed(2)}%`,
      };
    }

    if (metrics.p95LatencyMs > this.slo.maxP95LatencyMs) {
      return {
        healthy: false,
        breachReason: `P95 latency ${metrics.p95LatencyMs}ms breached SLO threshold of ${this.slo.maxP95LatencyMs}ms`,
      };
    }

    return { healthy: true };
  }

  /**
   * Advances the canary to the target step if SLO remains healthy.
   * If SLO is breached, auto-rollback is immediately triggered.
   */
  progressCanary(
    stepIndex: number,
    metrics: CanaryMetrics,
  ): { nextWeight: number; rolledBack: boolean; reason?: string } {
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      throw new Error(`Invalid canary step index: ${stepIndex}`);
    }

    const evaluation = this.evaluateSlo(metrics);
    if (!evaluation.healthy) {
      // Auto-rollback immediately
      this.currentWeight = 0;
      this.isRolledBack = true;
      return {
        nextWeight: 0,
        rolledBack: true,
        reason: `Auto-rollback triggered: ${evaluation.breachReason}`,
      };
    }

    const targetWeight = this.steps[stepIndex]!;
    this.currentWeight = targetWeight;
    this.isRolledBack = false;

    return {
      nextWeight: targetWeight,
      rolledBack: false,
    };
  }

  /**
   * Executes a simulated rollback drill to verify rollback capability before wide rollout.
   */
  executeRollbackDrill(): RollbackDrillResult {
    const startTime = Date.now();
    this.currentWeight = 5; // Start at 5% canary
    this.isRolledBack = false;

    // Simulate an SLO-breaching burst of errors
    const breachMetrics: CanaryMetrics = {
      totalRequests: 1000,
      errorCount: 20, // 2% error rate > 0.1% limit
      p95LatencyMs: 120,
    };

    const outcome = this.progressCanary(0, breachMetrics);
    const duration = Date.now() - startTime;

    return {
      success: outcome.rolledBack && outcome.nextWeight === 0,
      drillTimestamp: new Date().toISOString(),
      initialWeight: 5,
      rolledBackToWeight: outcome.nextWeight,
      rollbackDurationMs: duration,
      reason: outcome.reason || 'Simulated SLO breach',
    };
  }
}

export const canaryController = new CanaryController();

if (require.main === module) {
  console.log('[CanaryController] Executing P24 Rollback Drill...');
  const drill = canaryController.executeRollbackDrill();
  console.log('[CanaryController] Drill Result:', JSON.stringify(drill, null, 2));
  if (!drill.success) {
    process.exit(1);
  }
}
