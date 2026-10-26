import { Test, TestingModule } from '@nestjs/testing';
import { DiningReviewService } from './dining-review.service';
import { HalalTier } from '@javamifi/shared';

describe('Phase P3: CMS Review Queue & User Dispute Triage', () => {
  let reviewService: DiningReviewService;

  beforeEach(() => {
    reviewService = new DiningReviewService();
  });

  it('should seed default review items for adversarial and unverified flags', () => {
    const queue = reviewService.getReviewQueue();
    expect(queue.length).toBeGreaterThanOrEqual(3);
    const adversarialItem = queue.find((q) => q.type === 'ADVERSARIAL_ALERT');
    expect(adversarialItem).toBeDefined();
    expect(adversarialItem?.currentTier).toBe(HalalTier.NOT_HALAL);
  });

  it('should accept a user dispute report and add it to the pending review queue', () => {
    const report = reviewService.submitReport({
      placeId: 'test-place-99',
      placeName: 'Tokyo Ramen Stand',
      disputeReason: 'PORK_DETECTED',
      suggestedTier: HalalTier.NOT_HALAL,
      userComment: 'Saya melihat chef menambahkan kaldu chashu ke mangkuk ramen.',
      reporterEmail: 'traveler@javamifi.test',
    });

    expect(report.id).toBeDefined();
    expect(report.status).toBe('PENDING');
    expect(report.type).toBe('USER_DISPUTE');
    expect(report.currentTier).toBe(HalalTier.NOT_HALAL);

    const queue = reviewService.getReviewQueue();
    const found = queue.find((q) => q.id === report.id);
    expect(found).toBeDefined();
    expect(found?.reason).toContain('[PORK_DETECTED]');
    expect(found?.reason).toContain('traveler@javamifi.test');
  });

  it('should allow an auditor to resolve a review item with a tier override', () => {
    const queue = reviewService.getReviewQueue();
    const targetItem = queue[0]!;

    const resolved = reviewService.resolveItem(targetItem.id, {
      action: 'OVERRIDE_TIER',
      overrideTier: HalalTier.NOT_HALAL,
      resolvedBy: 'superadmin@javamifi.com',
      notes: 'Dikonfirmasi mengandung kaldu babi. Tier dikunci ke NOT_HALAL.',
    });

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedBy).toBe('superadmin@javamifi.com');
    expect(resolved.currentTier).toBe(HalalTier.NOT_HALAL);
    expect(resolved.actionTaken).toContain('NOT_HALAL');
  });

  it('should allow an auditor to dismiss an invalid user dispute', () => {
    const queue = reviewService.getReviewQueue();
    const targetItem = queue[1]!;

    const dismissed = reviewService.resolveItem(targetItem.id, {
      action: 'DISMISS',
      resolvedBy: 'auditor@javamifi.com',
      notes: 'Laporan pengguna tidak terbukti setelah audit menu fisik.',
    });

    expect(dismissed.status).toBe('DISMISSED');
    expect(dismissed.actionTaken).toContain('Laporan diabaikan');
  });

  it('should manage safety status and toggle AI enrichment kill-switch', () => {
    let safety = reviewService.getSafetyStatus();
    expect(safety.isAiEnrichmentEnabled).toBe(true);
    expect(safety.killSwitchActive).toBe(false);
    expect(safety.dailyTokenBudget).toBe(2000000);

    // Toggle kill switch ON
    safety = reviewService.toggleKillSwitch(true);
    expect(safety.killSwitchActive).toBe(true);
    expect(safety.isAiEnrichmentEnabled).toBe(false);

    // Toggle kill switch OFF
    safety = reviewService.toggleKillSwitch(false);
    expect(safety.killSwitchActive).toBe(false);
    expect(safety.isAiEnrichmentEnabled).toBe(true);
  });

  it('should auto-triage reports with critical keywords (pork/babi/mirin) as CRITICAL_SAFETY and enforce fail-closed tier', () => {
    const report = reviewService.submitReport({
      placeId: 'shinjuku-ramen-01',
      placeName: 'Shinjuku Tonkotsu Specialty',
      disputeReason: 'PORK_DETECTED',
      suggestedTier: HalalTier.OPTIONS, // user mistakenly suggests OPTIONS despite pork
      userComment: 'Restoran ini memakai mirin dan babi cincang di topping sup.',
      reporterEmail: 'auditor@traveler.id',
    });

    expect(report.reason).toContain('[CRITICAL_SAFETY: Contaminant/Halal Alert]');
    // Fail-closed tier: cannot remain OPTIONS when pork is reported
    expect(report.currentTier).toBe(HalalTier.UNKNOWN);

    const queue = reviewService.getReviewQueue();
    // Prepended to the very front of the queue
    expect(queue[0]?.id).toBe(report.id);
  });

  it('Phase 3 Gate: submitted report survives service restart and is queryable', () => {
    const report = reviewService.submitReport({
      placeId: 'restart-test-venue-42',
      placeName: 'Kyoto Soba House',
      disputeReason: 'ALCOHOL_SERVED',
      userComment: 'Soba dashi broth contains sake without halal labeling.',
      reporterEmail: 'restart-tester@javamifi.test',
    });

    expect(report.id).toBeDefined();

    // Simulate complete API service restart by creating a new instance
    const restartedService = new DiningReviewService();
    const persistedQueue = restartedService.getReviewQueue();
    const found = persistedQueue.find((item) => item.id === report.id);

    expect(found).toBeDefined();
    expect(found?.placeName).toBe('Kyoto Soba House');
    expect(found?.reason).toContain('sake without halal labeling');
  });

  it('Phase 5 Gate: records immutable audit log on resolveItem tier override', async () => {
    const mockAuditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-001' }),
    };

    const serviceWithAudit = new DiningReviewService(undefined, mockAuditService as any, undefined);
    const report = serviceWithAudit.submitReport({
      placeId: 'audit-test-venue',
      placeName: 'Ginza Tempura',
      disputeReason: 'PORK_DETECTED',
      userComment: 'Contaminant detected',
    });

    serviceWithAudit.resolveItem(report.id, {
      action: 'OVERRIDE_TIER',
      overrideTier: HalalTier.NOT_HALAL,
      resolvedBy: 'auditor@javamifi.com',
      notes: 'Confirmed non-halal oil used',
    });

    expect(mockAuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DINING_TIER_OVERRIDE',
        resource: 'dining_review',
        resourceId: report.id,
        actorId: 'auditor@javamifi.com',
        newValue: expect.objectContaining({ tier: HalalTier.NOT_HALAL, status: 'RESOLVED' }),
      })
    );
  });
});
