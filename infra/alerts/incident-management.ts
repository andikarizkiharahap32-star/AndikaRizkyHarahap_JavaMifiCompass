/**
 * P28: Incident Management, Runbooks, and Blameless Postmortem Engine
 *
 * Requirements:
 * 1. Authoritative Runbooks for:
 *    - db-failover
 *    - queue-backlog
 *    - fx-divergence
 *    - provider-outage
 *    - secret-rotation
 *    - rollback
 * 2. Blameless postmortem template with action-item tracking.
 * 3. Game day quarterly drill simulation (< 90 days recency).
 * 4. Prohibitions:
 *    - Do not create alerts without runbooks.
 *    - Do not page for non-actionable noise.
 *    - Do not close postmortems without owners and dates.
 */

export const REQUIRED_RUNBOOKS = [
  'db-failover',
  'queue-backlog',
  'fx-divergence',
  'provider-outage',
  'secret-rotation',
  'rollback',
] as const;

export type RunbookSlug = (typeof REQUIRED_RUNBOOKS)[number];

export interface RunbookDefinition {
  slug: RunbookSlug;
  title: string;
  category: 'database' | 'worker' | 'integration' | 'ingestion' | 'security' | 'deployment';
  url: string;
  mitigationSteps: string[];
  verificationCriteria: string[];
}

export const RUNBOOK_REGISTRY: Record<RunbookSlug, RunbookDefinition> = {
  'db-failover': {
    slug: 'db-failover',
    title: 'PostgreSQL Primary Database Failover',
    category: 'database',
    url: 'https://ops.javamifi.com/runbooks/db-failover',
    mitigationSteps: [
      'Confirm health of secondary availability zone read replica',
      'Execute RDS promote replica CLI or switch Route53 private DNS record',
      'Verify application connection pool re-establishment with zero stale locks',
    ],
    verificationCriteria: [
      'pg_up returns 1',
      'Write latency p95 < 20ms',
      'Zero 500 DB connection errors',
    ],
  },
  'queue-backlog': {
    slug: 'queue-backlog',
    title: 'BullMQ Worker Queue Backlog Mitigation',
    category: 'worker',
    url: 'https://ops.javamifi.com/runbooks/queue-backlog',
    mitigationSteps: [
      'Scale worker deployment replicas from 2 to 8 pods',
      'Temporarily throttle non-critical ingestion jobs (Foursquare / OSM)',
      'Inspect Dead Letter Queue (DLQ) for repeated poison pill payloads',
    ],
    verificationCriteria: ['Waiting job count drops below 1,000', 'Job processing latency < 30s'],
  },
  'fx-divergence': {
    slug: 'fx-divergence',
    title: 'Dual-Provider FX Rate Divergence Investigation',
    category: 'integration',
    url: 'https://ops.javamifi.com/runbooks/fx-divergence',
    mitigationSteps: [
      'Verify fail-closed circuit is active and returning null IDR conversion',
      'Compare Bank of Japan vs European Central Bank daily fixing rates',
      'Pin manual override rate via Redis admin if divergence is an upstream provider bug',
    ],
    verificationCriteria: [
      'Divergence ratio <= 0.005',
      'Zero arbitrary unverified currency guesses in UI',
    ],
  },
  'provider-outage': {
    slug: 'provider-outage',
    title: 'Downstream Places Provider Outage Fallback',
    category: 'ingestion',
    url: 'https://ops.javamifi.com/runbooks/provider-outage',
    mitigationSteps: [
      'Engage circuit breaker for affected provider (Google / OSM / Foursquare)',
      'Fall back to stale-while-revalidate cached place records',
      'Pause upstream provider ingestion queue to prevent rate limit burns',
    ],
    verificationCriteria: [
      'Search endpoint success rate >= 99.5%',
      'Zero raw upstream error leaks to API clients',
    ],
  },
  'secret-rotation': {
    slug: 'secret-rotation',
    title: 'Webhook HMAC & JWT Secret Dual-Window Rotation',
    category: 'security',
    url: 'https://ops.javamifi.com/runbooks/secret-rotation',
    mitigationSteps: [
      'Generate new secret in AWS Secrets Manager / Vault',
      'Append new secret to dual-validity window in API configuration',
      'Verify outbound webhooks sign with new secret while verifying inbound with either secret',
      'Deprecate old secret after 48-hour drain window',
    ],
    verificationCriteria: [
      'Secret age reset to 0 days',
      'Zero webhook signature rejection spikes during rotation',
    ],
  },
  rollback: {
    slug: 'rollback',
    title: 'Emergency Deployment Rollback Procedure',
    category: 'deployment',
    url: 'https://ops.javamifi.com/runbooks/rollback',
    mitigationSteps: [
      'Trigger CanaryController auto-rollback or set canary traffic weight to 0%',
      'Execute kubectl rollout undo deployment/javamifi-api',
      'Verify traffic shifts entirely to previous stable image',
    ],
    verificationCriteria: ['HTTP 5xx rate drops below 0.1%', 'P95 latency returns below 300ms'],
  },
};

export interface ActionItem {
  id: string;
  description: string;
  owner: string; // P28 Invariant: MANDATORY
  dueDate: Date; // P28 Invariant: MANDATORY
  status: 'open' | 'in_progress' | 'completed';
  completedAt?: Date;
}

export interface PostmortemRecord {
  incidentId: string;
  title: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3';
  summary: string;
  timeline: Array<{ timestamp: Date; description: string }>;
  rootCauses5Whys: string[];
  actionItems: ActionItem[];
  isClosed: boolean;
  closedAt?: Date;
}

export interface GameDayRecord {
  id: string;
  scenario: 'db_failover' | 'provider_outage' | 'canary_rollback';
  executedAt: Date;
  rtoAchievedMinutes: number;
  passed: boolean;
  participants: string[];
  findings: string[];
}

export class IncidentManagementService {
  private postmortems = new Map<string, PostmortemRecord>();
  private gameDays: GameDayRecord[] = [];

  createPostmortem(params: Omit<PostmortemRecord, 'isClosed' | 'closedAt'>): PostmortemRecord {
    const postmortem: PostmortemRecord = {
      ...params,
      isClosed: false,
    };
    this.postmortems.set(postmortem.incidentId, postmortem);
    return postmortem;
  }

  /**
   * P28 Prohibition: Do not close postmortems without owners and dates.
   */
  closePostmortem(incidentId: string): PostmortemRecord {
    const pm = this.postmortems.get(incidentId);
    if (!pm) {
      throw new Error(`Postmortem with incident ID ${incidentId} not found`);
    }

    if (pm.actionItems.length === 0) {
      throw new Error(
        'Postmortem closure failure: At least one preventative action item is required.',
      );
    }

    for (const item of pm.actionItems) {
      if (!item.owner || item.owner.trim() === '') {
        throw new Error(
          `Postmortem closure failure: Action item "${item.description}" has no assigned owner. Owners are mandatory.`,
        );
      }
      if (!item.dueDate || isNaN(item.dueDate.getTime())) {
        throw new Error(
          `Postmortem closure failure: Action item "${item.description}" has no valid due date. Due dates are mandatory.`,
        );
      }
    }

    pm.isClosed = true;
    pm.closedAt = new Date();
    return pm;
  }

  recordGameDay(gameDay: GameDayRecord): void {
    this.gameDays.push(gameDay);
  }

  /**
   * P28 Acceptance Criterion: Game day completed this quarter (< 90 days).
   */
  assertGameDayQuarterlyRecency(asOfDate = new Date()): void {
    if (this.gameDays.length === 0) {
      throw new Error('Game Day Audit Failure: No game day exercises recorded.');
    }

    const lastGameDay = this.gameDays[this.gameDays.length - 1];
    if (!lastGameDay) {
      throw new Error('Game Day Audit Failure: No valid game day available.');
    }

    const ageInDays =
      (asOfDate.getTime() - lastGameDay.executedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays >= 90) {
      throw new Error(
        `Game Day Audit Failure: Last game day is ${ageInDays.toFixed(1)} days old (maximum allowed: < 90 days).`,
      );
    }
  }

  getPostmortem(incidentId: string): PostmortemRecord | undefined {
    return this.postmortems.get(incidentId);
  }

  getGameDays(): GameDayRecord[] {
    return [...this.gameDays];
  }
}

export const incidentManagementService = new IncidentManagementService();
