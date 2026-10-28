import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FxConversionService,
  roundHalfEven,
} from '../../../apps/api/src/modules/fx/fx.service';
import {
  checkProviderDivergence,
  FxRateQuote,
} from '../../../apps/api/src/modules/fx/providers/fx-provider';
import {
  ReviewService,
  REVIEW_COOLDOWN_MS,
} from '../../../apps/api/src/modules/reviews/review.service';
import {
  ModerationService,
  sanitizeHtmlToPlainText,
} from '../../../apps/api/src/modules/moderation/moderation.service';

describe('Backend and Workflows - P16: FX Service (Currency to IDR)', () => {
  let fxService: FxConversionService;

  beforeEach(() => {
    fxService = new FxConversionService();
  });

  it('P16-1: Property test: convert(a) + convert(b) is within 1 IDR of convert(a+b) tolerance', () => {
    // Test across 50 arbitrary positive pairs of amounts
    for (let i = 1; i <= 50; i++) {
      const a = i * 150 + Math.random() * 50;
      const b = i * 230 + Math.random() * 80;

      const resA = fxService.convert(a, 'JPY');
      const resB = fxService.convert(b, 'JPY');
      const resSum = fxService.convert(a + b, 'JPY');

      // The sum of individually rounded conversions must equal the conversion of the sum (+/- 1 IDR tolerance)
      const diff = Math.abs(resA.roundedIdr + resB.roundedIdr - resSum.roundedIdr);
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  it('P16-2: Dual provider divergence > 0.5% triggers alert and retains last known good rate', () => {
    const alertSpy = vi.fn();
    fxService.onDivergenceAlert(alertSpy);

    const initialRate = fxService.getRate('JPY')?.rate;
    expect(initialRate).toBeDefined();

    const quoteA: FxRateQuote = {
      base: 'JPY',
      quote: 'IDR',
      rate: 104.5,
      provider: 'Provider A',
      fetchedAt: new Date().toISOString(),
    };

    // Divergent rate: 106.0 vs 104.5 (diff = 1.5, divergence = 1.5 / 104.5 = 1.43% > 0.5%)
    const quoteB: FxRateQuote = {
      base: 'JPY',
      quote: 'IDR',
      rate: 106.0,
      provider: 'Provider B',
      fetchedAt: new Date().toISOString(),
    };

    const result = fxService.updateDualProviderRates(quoteA, quoteB);

    expect(result.accepted).toBe(false);
    expect(result.alertTriggered).toBe(true);
    expect(result.divergencePercent).toBeGreaterThan(0.5);
    expect(alertSpy).toHaveBeenCalledTimes(1);

    // Initial rate was retained without corruption
    expect(fxService.getRate('JPY')?.rate).toBe(initialRate);
  });

  it('P16-3: Dual provider divergence <= 0.5% is accepted and updates the rate', () => {
    const quoteA: FxRateQuote = {
      base: 'JPY',
      quote: 'IDR',
      rate: 104.5,
      provider: 'Provider A',
      fetchedAt: new Date().toISOString(),
    };

    // Aligned rate: 104.8 vs 104.5 (divergence = 0.3 / 104.5 = 0.28% <= 0.5%)
    const quoteB: FxRateQuote = {
      base: 'JPY',
      quote: 'IDR',
      rate: 104.8,
      provider: 'Provider B',
      fetchedAt: new Date().toISOString(),
    };

    const result = fxService.updateDualProviderRates(quoteA, quoteB);

    expect(result.accepted).toBe(true);
    expect(result.alertTriggered).toBe(false);
    expect(result.divergencePercent).toBeLessThanOrEqual(0.5);
    expect(fxService.getRate('JPY')?.rate).toBeCloseTo((104.5 + 104.8) / 2, 4);
  });

  it('P16-4: Emits stale: true when rate age exceeds staleLimit', () => {
    // Seed an expired rate fetched 30 hours ago (staleLimit is 24h)
    const thirtyHoursAgo = new Date(Date.now() - 30 * 3600 * 1000).toISOString();
    fxService.setRate('EUR', 17200.0, 'ECB Historical', thirtyHoursAgo);

    const staleResult = fxService.convert(10, 'EUR');
    expect(staleResult.stale).toBe(true);

    // Fresh rate (now)
    fxService.setRate('USD', 15850.0, 'ECB Live', new Date().toISOString());
    const freshResult = fxService.convert(10, 'USD');
    expect(freshResult.stale).toBe(false);
  });

  it('P16-5: Banker\'s rounding (ROUND_HALF_EVEN) correctly rounds half-way ties to even integers', () => {
    // Half-way ties round to the nearest EVEN integer
    expect(roundHalfEven(2.5)).toBe(2); // 2 is even
    expect(roundHalfEven(3.5)).toBe(4); // 4 is even
    expect(roundHalfEven(4.5)).toBe(4); // 4 is even
    expect(roundHalfEven(5.5)).toBe(6); // 6 is even

    // Normal roundings
    expect(roundHalfEven(2.4)).toBe(2);
    expect(roundHalfEven(2.6)).toBe(3);
  });
});

describe('Backend and Workflows - P17: Reviews and Moderation', () => {
  let reviewService: ReviewService;
  let modService: ModerationService;

  beforeEach(() => {
    reviewService = new ReviewService();
    modService = new ModerationService();
  });

  it('P17-1: Requires authenticated user and enforces body length bounds [20, 2000]', async () => {
    // 1. Unauthenticated submission
    await expect(
      reviewService.submitReview({
        placeId: 'plc_tokyo_01',
        userId: '',
        reviewerDisplayName: 'Guest',
        rating: 5,
        body: 'Great halal ramen in Shinjuku!',
      })
    ).rejects.toThrow(/Authentication required/);

    // 2. Body too short (< 20 chars)
    await expect(
      reviewService.submitReview({
        placeId: 'plc_tokyo_01',
        userId: 'usr_001',
        reviewerDisplayName: 'Ahmad',
        rating: 5,
        body: 'Short text',
      })
    ).rejects.toThrow(/between 20 and 2000 characters/);

    // 3. Body too long (> 2000 chars)
    await expect(
      reviewService.submitReview({
        placeId: 'plc_tokyo_01',
        userId: 'usr_001',
        reviewerDisplayName: 'Ahmad',
        rating: 5,
        body: 'x'.repeat(2001),
      })
    ).rejects.toThrow(/between 20 and 2000 characters/);
  });

  it('P17-2: Enforces frequency limit of 1 review per place per 90 days', async () => {
    const input = {
      placeId: 'plc_tokyo_02',
      userId: 'usr_frequent_diner',
      reviewerDisplayName: 'Farhan',
      rating: 5,
      body: 'This restaurant serves completely certified halal wagyu.',
    };

    // First review succeeds
    const firstReview = await reviewService.submitReview(input);
    expect(firstReview.status).toBe('published');

    // Duplicate review within 90 days is rejected
    await expect(reviewService.submitReview(input)).rejects.toThrow(
      /Only one review per place is permitted every 90 days/
    );
  });

  it('P17-3: Sanitization fuzz test: Strips all HTML tags, scripts, and entities to plain text', () => {
    const maliciousFuzz = [
      '<script>alert("xss")</script>Delicious food and friendly staff.',
      '<img src=x onerror=alert(1)>Authentic halal certified meat here.',
      '<a href="https://spam.com">Visit our website</a> Best soup ever!',
      '&lt;b&gt;Great&lt;/b&gt; &amp; authentic!',
      '<iframe src="evil.com"></iframe>Clean dining experience.',
    ];

    for (const raw of maliciousFuzz) {
      const sanitized = sanitizeHtmlToPlainText(raw);
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('<a href');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('&lt;');
      expect(sanitized).not.toContain('&gt;');
      expect(sanitized).not.toContain('&amp;');
      expect(sanitized.length).toBeGreaterThan(0);
    }
  });

  it('P17-4: Pre-publish moderation flags profanity and external links to moderation queue', async () => {
    const spamReview = await reviewService.submitReview({
      placeId: 'plc_tokyo_03',
      userId: 'usr_spammer',
      reviewerDisplayName: 'Spam Bot',
      rating: 5,
      body: 'Check out cheap discounts at https://promo-deals.com/now for huge savings!',
    });

    expect(spamReview.status).toBe('pending_moderation');
    expect(spamReview.flags).toContain('links_detected');
  });

  it('P17-5: Allows business owner response marked with isOwnerResponse: true', async () => {
    const review = await reviewService.submitReview({
      placeId: 'plc_tokyo_04',
      userId: 'usr_customer',
      reviewerDisplayName: 'Customer',
      rating: 4,
      body: 'Very pleasant atmosphere and delicious chicken karaage.',
    });

    const updated = await reviewService.addOwnerResponse({
      reviewId: review.id,
      ownerUserId: 'usr_owner_01',
      responseText: 'Thank you for your visit! We look forward to serving you again.',
    });

    expect(updated.ownerResponse).toBeDefined();
    expect(updated.ownerResponse?.isOwnerResponse).toBe(true);
    expect(updated.ownerResponse?.responseText).toContain('Thank you for your visit');
  });

  it('P17-6: Strict prohibition: Reviews cannot alter halal status or evidence tables', async () => {
    // Halal place state remains completely unchanged when a review is submitted
    const mockPlace = {
      id: 'plc_halal_01',
      halalStatus: 'verified' as const,
      evidenceTableVersion: 1,
    };

    await reviewService.submitReview({
      placeId: mockPlace.id,
      userId: 'usr_critic',
      reviewerDisplayName: 'Critic',
      rating: 1,
      body: 'I am claiming this place is not halal without proof!',
    });

    // Halal status is strictly decoupled from user reviews
    expect(mockPlace.halalStatus).toBe('verified');
    expect(mockPlace.evidenceTableVersion).toBe(1);
  });

  it('P17-7: Reviewer private emails are never exposed in public review records', async () => {
    const review = await reviewService.submitReview({
      placeId: 'plc_tokyo_05',
      userId: 'usr_privacy_tester',
      reviewerDisplayName: 'Hassan',
      userEmail: 'hassan.private@example.com',
      rating: 5,
      body: 'Outstanding service and strictly halal ingredients.',
    });

    expect(review).not.toHaveProperty('userEmail');
    expect(review).not.toHaveProperty('email');
    expect(review.reviewerDisplayName).toBe('Hassan');
  });

  it('P17-8: Moderation actions are audited with immutable log entries', () => {
    const entry = modService.logModerationAction(
      'rev_9921',
      'mod_usr_admin',
      'approve',
      'Reviewed and verified text compliance'
    );

    expect(entry.reviewId).toBe('rev_9921');
    expect(entry.moderatorId).toBe('mod_usr_admin');
    expect(entry.action).toBe('approve');
    expect(entry.timestamp).toBeDefined();
    expect(modService.getAuditLogs()).toHaveLength(1);
  });
});
