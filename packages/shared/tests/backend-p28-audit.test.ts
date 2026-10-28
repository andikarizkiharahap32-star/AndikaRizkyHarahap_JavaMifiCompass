import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  IncidentManagementService,
  RUNBOOK_REGISTRY,
  REQUIRED_RUNBOOKS,
} from '../../../infra/alerts/incident-management';

describe('Backend and Workflows - P28: Release, Runbooks and Operations', () => {
  const alertsYamlPath = path.resolve(__dirname, '../../../infra/alerts/prometheus-rules.yaml');

  it('P28-1: Every single alert in prometheus-rules.yaml links to an authoritative runbook URL', () => {
    expect(fs.existsSync(alertsYamlPath)).toBe(true);
    const yamlContent = fs.readFileSync(alertsYamlPath, 'utf-8');

    // Parse all alert blocks
    const alertBlocks = yamlContent.split('- alert:').slice(1);
    expect(alertBlocks.length).toBeGreaterThanOrEqual(6);

    for (const block of alertBlocks) {
      const alertName = block.trim().split('\n')[0]?.trim();
      expect(block).toContain('runbook_url:');
      expect(block).toMatch(/runbook_url:\s*"https:\/\/ops\.javamifi\.com\/runbooks\/[a-z0-9-]+"/);
    }
  });

  it('P28-2: Alerts are symptom-based (SLO burn rate) rather than naive threshold spam', () => {
    const yamlContent = fs.readFileSync(alertsYamlPath, 'utf-8');

    // 1. Error budget burn rate
    expect(yamlContent).toContain('HighErrorBudgetBurn1h');
    expect(yamlContent).toContain('(14.4 * 0.005)'); // Multi-window multi-burn-rate

    // 2. Latency budget burn rate
    expect(yamlContent).toContain('HighLatencyBudgetBurn1h');
    expect(yamlContent).toContain('histogram_quantile(0.95');

    // 3. Prohibits paging for non-actionable noise: warning alerts do not page engineers
    expect(yamlContent).toContain('alert: FxDivergenceDetected');
    expect(yamlContent).toContain('alert: DownstreamPlacesProviderOutage');
    expect(yamlContent).toContain('alert: WebhookSecretRotationImminent');

    // High-severity user-facing incidents trigger pages
    expect(yamlContent).toContain('page: "true"');
    expect(yamlContent).toContain('page: "false"');
  });

  it('P28-3: Runbook registry contains all 6 required operational incident procedures', () => {
    expect(REQUIRED_RUNBOOKS).toEqual([
      'db-failover',
      'queue-backlog',
      'fx-divergence',
      'provider-outage',
      'secret-rotation',
      'rollback',
    ]);

    for (const slug of REQUIRED_RUNBOOKS) {
      const runbook = RUNBOOK_REGISTRY[slug];
      expect(runbook).toBeDefined();
      expect(runbook.slug).toBe(slug);
      expect(runbook.url).toBe(`https://ops.javamifi.com/runbooks/${slug}`);
      expect(runbook.mitigationSteps.length).toBeGreaterThanOrEqual(2);
      expect(runbook.verificationCriteria.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('P28-4: Enforces blameless postmortem creation and prevents closing without owners and dates', () => {
    const ops = new IncidentManagementService();

    // Create postmortem with incomplete action item (missing owner)
    const pmMissingOwner = ops.createPostmortem({
      incidentId: 'inc_20261028_db_hiccup',
      title: 'Database replica lag spike during Tokyo evening traffic',
      severity: 'SEV2',
      summary: 'Postgres read replica lagged by 45 seconds due to heavy ingestion batches.',
      timeline: [
        { timestamp: new Date(), description: 'Alert HighReplicationLag fired' },
        { timestamp: new Date(), description: 'Ingestion worker batch size reduced; lag resolved' },
      ],
      rootCauses5Whys: [
        'Why? Replica lagged.',
        'Why? Large Foursquare ingestion batch.',
        'Why? Ingestion concurrency was unbounded.',
        'Why? Queue concurrency lacked dynamic throttle.',
        'Why? Initial worker config used static concurrency.',
      ],
      actionItems: [
        {
          id: 'act_1',
          description: 'Implement dynamic worker batch sizing on replication lag',
          owner: '', // MISSING OWNER
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'open',
        },
      ],
    });

    // P28 Prohibition: Cannot close postmortem without owner
    expect(() => ops.closePostmortem(pmMissingOwner.incidentId)).toThrow(
      /Postmortem closure failure: Action item .* has no assigned owner\. Owners are mandatory\./
    );

    // Provide owner but missing due date
    pmMissingOwner.actionItems[0]!.owner = 'alif.infra@javamifi.com';
    (pmMissingOwner.actionItems[0] as any).dueDate = null;

    // P28 Prohibition: Cannot close postmortem without date
    expect(() => ops.closePostmortem(pmMissingOwner.incidentId)).toThrow(
      /Postmortem closure failure: Action item .* has no valid due date\. Due dates are mandatory\./
    );

    // Provide valid owner and due date -> Closure succeeds
    pmMissingOwner.actionItems[0]!.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const closedPm = ops.closePostmortem(pmMissingOwner.incidentId);
    expect(closedPm.isClosed).toBe(true);
    expect(closedPm.closedAt).toBeDefined();
  });

  it('P28-5: Verifies Game Day quarterly exercise recency (< 90 days)', () => {
    const ops = new IncidentManagementService();

    // No game days recorded -> fails audit
    expect(() => ops.assertGameDayQuarterlyRecency()).toThrow(
      /Game Day Audit Failure: No game day exercises recorded\./
    );

    // Record game day executed today
    ops.recordGameDay({
      id: 'gameday_2026_q4',
      scenario: 'db_failover',
      executedAt: new Date(),
      rtoAchievedMinutes: 14,
      passed: true,
      participants: ['alif.infra@javamifi.com', 'budi.ops@javamifi.com'],
      findings: ['Secondary replica promoted within 14 minutes; zero connection dropped on API pool.'],
    });

    // Fresh game day -> passes audit
    expect(() => ops.assertGameDayQuarterlyRecency()).not.toThrow();

    // Stale game day (> 90 days) -> throws audit failure
    const ninetyOneDaysLater = new Date(Date.now() + 91 * 24 * 60 * 60 * 1000);
    expect(() => ops.assertGameDayQuarterlyRecency(ninetyOneDaysLater)).toThrow(
      /Game Day Audit Failure: Last game day is .* days old \(maximum allowed: < 90 days\)\./
    );
  });
});
