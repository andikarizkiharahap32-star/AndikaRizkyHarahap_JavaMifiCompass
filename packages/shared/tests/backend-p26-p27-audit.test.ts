import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  DisasterRecoveryManager,
  assertKmsKeySeparation,
  REDIS_DISASTER_RECOVERY_POLICY,
  DR_TARGETS,
} from '../../../infra/backup/disaster-recovery';
import { CrossRegionReplicator } from '../../../infra/backup/cross-region-copy';
import { PerfSloEvaluator, PERF_SLO_LIMITS } from '../../../perf/k6/slo-evaluator';

describe('Backend and Workflows - P26: Backup and Disaster Recovery', () => {
  it('P26-1: Strictly enforces Disaster Recovery targets (RPO <= 5 min, RTO <= 1 h)', () => {
    expect(DR_TARGETS.RPO_MAX_MINUTES).toBe(5);
    expect(DR_TARGETS.RTO_MAX_HOURS).toBe(1);
    expect(DR_TARGETS.MAX_DRILL_AGE_DAYS).toBe(90);
  });

  it('P26-2: Replicates WAL archive segments and daily snapshots to an isolated secondary region', () => {
    const replicator = new CrossRegionReplicator({
      primaryRegion: 'ap-southeast-1',
      drRegion: 'ap-southeast-2',
      primaryBucket: 'javamifi-primary-db-wal-prod',
      drIsolatedBucket: 'javamifi-dr-isolated-backup-sydney',
    });

    // Replicate WAL segment
    const walTask = replicator.replicateWalSegment('00000001000000000000002A', 16777216);
    expect(walTask.sourceRegion).toBe('ap-southeast-1');
    expect(walTask.destinationRegion).toBe('ap-southeast-2');
    expect(walTask.status).toBe('completed');
    expect(walTask.checksumSha256).toMatch(/^[a-f0-9]{64}$/);

    // Replicate Daily Snapshot
    const snapTask = replicator.replicateDailySnapshot('snap_daily_20261028', 524288000);
    expect(snapTask.destinationBucket).toBe('javamifi-dr-isolated-backup-sydney');
    expect(snapTask.status).toBe('completed');
  });

  it('P26-3: Enforces backup encryption using dedicated KMS keys strictly separate from primary', () => {
    const primaryKey = 'arn:aws:kms:ap-southeast-1:123456789012:key/primary-key-abc';
    const backupKey = 'arn:aws:kms:ap-southeast-2:123456789012:key/dr-backup-key-xyz';

    // Different keys: valid
    expect(() => assertKmsKeySeparation(primaryKey, backupKey)).not.toThrow();

    // Identical keys: prohibited
    expect(() => assertKmsKeySeparation(primaryKey, primaryKey)).toThrow(
      /Backup KMS key .* must be separate and isolated from primary DB key/,
    );
  });

  it('P26-4: Explicitly defines and verifies Redis persistence decision as cache-only with volatile eviction', () => {
    expect(REDIS_DISASTER_RECOVERY_POLICY.mode).toBe('cache_only');
    expect(REDIS_DISASTER_RECOVERY_POLICY.evictionPolicy).toBe('volatile-lru');
    expect(REDIS_DISASTER_RECOVERY_POLICY.isEphemeral).toBe(true);
    expect(REDIS_DISASTER_RECOVERY_POLICY.rRationale).toContain('PostgreSQL with PITR');
  });

  it('P26-5: Prohibits counting a backup as valid before a successful restore drill test', () => {
    const dr = new DisasterRecoveryManager({
      primaryKeyArn: 'arn:aws:kms:ap-southeast-1:123456789012:key/primary-key-1',
      backupKeyArn: 'arn:aws:kms:ap-southeast-2:123456789012:key/dr-key-2',
    });

    const backup = dr.registerBackup({
      id: 'snap_untested_01',
      type: 'daily_snapshot',
      database: 'javamifi',
      createdAt: new Date(),
      sourceRegion: 'ap-southeast-1',
      destinationRegion: 'ap-southeast-2',
      kmsKeyArn: 'arn:aws:kms:ap-southeast-2:123456789012:key/dr-key-2',
      checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    // P26 Invariant: unverified until tested
    expect(backup.verified).toBe(false);
    expect(dr.isBackupValid(backup.id)).toBe(false);
  });

  it('P26-6: Executes quarterly restore drill with SHA-256 checksum validation and recency check', () => {
    const dr = new DisasterRecoveryManager({
      primaryKeyArn: 'arn:aws:kms:ap-southeast-1:123456789012:key/primary-key-1',
      backupKeyArn: 'arn:aws:kms:ap-southeast-2:123456789012:key/dr-key-2',
    });

    const checksum = 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2';
    const backup = dr.registerBackup({
      id: 'snap_tested_01',
      type: 'daily_snapshot',
      database: 'javamifi',
      createdAt: new Date(),
      sourceRegion: 'ap-southeast-1',
      destinationRegion: 'ap-southeast-2',
      kmsKeyArn: 'arn:aws:kms:ap-southeast-2:123456789012:key/dr-key-2',
      checksumSha256: checksum,
    });

    // Execute drill in isolated sandbox
    const report = dr.executeQuarterlyRestoreDrill(backup.id, {
      simulateMeasuredRpoMinutes: 2.1,
      simulateMeasuredRtoMinutes: 18,
      simulatedRestoredChecksum: checksum,
    });

    expect(report.status).toBe('PASSED');
    expect(report.targetEnvironment).toBe('isolated_dr_sandbox');
    expect(report.checksumsMatch).toBe(true);
    expect(report.rpoSloMet).toBe(true);
    expect(report.rtoSloMet).toBe(true);

    // After successful drill, backup is certified valid
    expect(dr.isBackupValid(backup.id)).toBe(true);

    // Audit report recency: report is brand new (< 90 days), must pass
    expect(() => dr.assertDrillReportRecency()).not.toThrow();

    // Old drill report (> 90 days) must throw audit failure
    const ninetyOneDaysLater = new Date(Date.now() + 91 * 24 * 60 * 60 * 1000);
    expect(() => dr.assertDrillReportRecency(ninetyOneDaysLater)).toThrow(
      /Last restore drill report is .* days old \(maximum allowed: < 90 days\)/,
    );
  });
});

describe('Backend and Workflows - P27: Performance and Load Testing', () => {
  const k6ScriptPath = path.resolve(__dirname, '../../../perf/k6/load-scenarios.js');

  it('P27-1: k6 test file implements all 4 required scenarios (search spike, fx burst, assist, checkout)', () => {
    expect(fs.existsSync(k6ScriptPath)).toBe(true);
    const scriptContent = fs.readFileSync(k6ScriptPath, 'utf-8');

    // 1. Search spike
    expect(scriptContent).toContain('search_spike:');
    expect(scriptContent).toContain('/api/v1/places/search');
    expect(scriptContent).toContain('search p95 < 300 ms');

    // 2. FX burst
    expect(scriptContent).toContain('fx_burst:');
    expect(scriptContent).toContain('/api/v1/fx/convert');
    expect(scriptContent).toContain('FX p95 < 100 ms (cache hit)');

    // 3. Assist endpoint with mocked LLM
    expect(scriptContent).toContain('assist_mocked_llm:');
    expect(scriptContent).toContain('/api/v1/assist');
    expect(scriptContent).toContain('X-Mock-LLM');

    // 4. Checkout with mock gateway and idempotency
    expect(scriptContent).toContain('checkout_mock_gateway:');
    expect(scriptContent).toContain('/api/v1/orders/checkout');
    expect(scriptContent).toContain('Idempotency-Key');
    expect(scriptContent).toContain('X-Mock-Payment');
  });

  it('P27-2: Evaluator enforces performance SLO thresholds (search < 300ms, FX < 100ms, error rate < 0.5%)', () => {
    const evaluator = new PerfSloEvaluator();

    // Meeting all SLOs
    const passingRun = evaluator.evaluateRun({
      runId: 'run_perf_pass_01',
      datasetPlacesCount: 520000,
      searchP95Ms: 240, // < 300ms
      fxP95Ms: 65, // < 100ms
      errorRate: 0.002, // 0.2% < 0.5%
      totalRequests: 50000,
      evaluatedAt: new Date(),
    });

    expect(passingRun.passed).toBe(true);
    expect(passingRun.searchSloMet).toBe(true);
    expect(passingRun.fxSloMet).toBe(true);
    expect(passingRun.errorRateSloMet).toBe(true);
    expect(passingRun.datasetThresholdMet).toBe(true);

    // Failing search SLO
    const failingSearchRun = evaluator.evaluateRun({
      runId: 'run_perf_fail_search',
      datasetPlacesCount: 520000,
      searchP95Ms: 345, // > 300ms
      fxP95Ms: 60,
      errorRate: 0.001,
      totalRequests: 50000,
      evaluatedAt: new Date(),
    });
    expect(failingSearchRun.passed).toBe(false);
    expect(failingSearchRun.searchSloMet).toBe(false);

    // Failing error rate SLO
    const failingErrorRateRun = evaluator.evaluateRun({
      runId: 'run_perf_fail_errors',
      datasetPlacesCount: 520000,
      searchP95Ms: 220,
      fxP95Ms: 50,
      errorRate: 0.008, // 0.8% > 0.5%
      totalRequests: 50000,
      evaluatedAt: new Date(),
    });
    expect(failingErrorRateRun.passed).toBe(false);
    expect(failingErrorRateRun.errorRateSloMet).toBe(false);
  });

  it('P27-3: Validates places dataset scaling requirement (dataset >= 500k places in perf env)', () => {
    const evaluator = new PerfSloEvaluator();

    // Below 500,000 places: fails dataset check
    const insufficientDatasetRun = evaluator.evaluateRun({
      runId: 'run_perf_small_dataset',
      datasetPlacesCount: 150000, // < 500,000 places
      searchP95Ms: 120,
      fxP95Ms: 40,
      errorRate: 0.001,
      totalRequests: 10000,
      evaluatedAt: new Date(),
    });

    expect(insufficientDatasetRun.passed).toBe(false);
    expect(insufficientDatasetRun.datasetThresholdMet).toBe(false);
    expect(insufficientDatasetRun.reportSummary).toContain('Threshold >= 500,000): FAIL');
  });

  it('P27-4: Load test safety guard blocks unapproved production load tests without window and kill switch', () => {
    const evaluator = new PerfSloEvaluator();

    // Production test without approved window: throws
    expect(() =>
      evaluator.assertSafeExecutionEnv('production', {
        isApprovedWindow: false,
        killSwitchConfigured: true,
      }),
    ).toThrow(/Prohibited to load test production outside an approved maintenance window/);

    // Production test without kill switch: throws
    expect(() =>
      evaluator.assertSafeExecutionEnv('production', {
        isApprovedWindow: true,
        killSwitchConfigured: false,
      }),
    ).toThrow(/Prohibited to load test production without an active kill switch/);

    // Approved production test with kill switch: passes safety guard
    expect(() =>
      evaluator.assertSafeExecutionEnv('production', {
        isApprovedWindow: true,
        killSwitchConfigured: true,
      }),
    ).not.toThrow();

    // Staging test: passes without requiring production window
    expect(() => evaluator.assertSafeExecutionEnv('staging')).not.toThrow();
  });

  it('P27-5: Flags performance regressions against baseline on critical hot paths', () => {
    const evaluator = new PerfSloEvaluator({
      searchP95Ms: 180,
      fxP95Ms: 45,
      errorRate: 0.001,
    });

    const regressedRun = evaluator.evaluateRun({
      runId: 'run_perf_regressed',
      datasetPlacesCount: 600000,
      searchP95Ms: 250, // Meets < 300ms SLO, but regressed > 15% from 180ms baseline (+38.9%)
      fxP95Ms: 70, // Meets < 100ms SLO, but regressed > 15% from 45ms baseline (+55.6%)
      errorRate: 0.001,
      totalRequests: 20000,
      evaluatedAt: new Date(),
    });

    expect(regressedRun.passed).toBe(true); // Still meets hard SLOs
    expect(regressedRun.regressions.length).toBe(2);
    expect(regressedRun.regressions[0]).toContain(
      'Search latency degraded: 250ms vs baseline 180ms',
    );
    expect(regressedRun.regressions[1]).toContain('FX latency degraded: 70ms vs baseline 45ms');
  });
});
