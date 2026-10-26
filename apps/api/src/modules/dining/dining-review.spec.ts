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
});
