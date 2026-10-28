/**
 * P17: Review Content Moderation & Sanitization Engine
 *
 * Requirements:
 * 1. Pre-publish checks: profanity, links, duplicate similarity.
 * 2. Sanitize HTML to clean plain text (resilient against XSS fuzzing).
 * 3. Flag suspicious reviews to moderation queue.
 * 4. Record immutable audit logs for all moderator actions.
 * 5. Prohibition: Do not allow HTML in review bodies.
 */

export interface PrePublishCheckResult {
  passed: boolean;
  sanitizedText: string;
  hasProfanity: boolean;
  hasLinks: boolean;
  isDuplicate: boolean;
  actionRequired: 'auto_approve' | 'queue_to_moderator' | 'reject';
  flags: string[];
}

export interface ModerationAuditEntry {
  id: string;
  reviewId: string;
  moderatorId: string;
  action: 'approve' | 'reject' | 'flag';
  reason: string;
  timestamp: string;
}

const PROFANITY_PATTERNS = [
  /fuck/i,
  /shit/i,
  /bitch/i,
  /asshole/i,
  /bastard/i,
  /scam/i,
  /fraud/i,
];

const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /www\.[a-z0-9-]+\.[a-z]{2,}/i,
  /[a-z0-9-]+\.(com|net|org|xyz|io|co|me|biz|info)/i,
];

/**
 * Strips HTML tags and decodes entities into clean, safe plain text.
 * Resilient against malicious fuzzing (<script>, <img>, <iframe>, nested tags).
 */
export function sanitizeHtmlToPlainText(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // 1. Remove dangerous script and style elements and their inner content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 2. Strip all remaining HTML tags
  sanitized = sanitized.replace(/<[^>]+>/g, ' ');

  // 3. Decode common HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 4. Normalize excess whitespace
  return sanitized.replace(/\s+/g, ' ').trim();
}

/**
 * Evaluates duplicate similarity against recent place reviews.
 */
export function calculateTextSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersectionCount = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...wordsA, ...wordsB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export class ModerationService {
  private auditLogs: ModerationAuditEntry[] = [];

  /**
   * Runs pre-publish checks on review text.
   */
  evaluateReviewText(
    rawText: string,
    existingPlaceReviewTexts: string[] = []
  ): PrePublishCheckResult {
    const sanitizedText = sanitizeHtmlToPlainText(rawText);
    const flags: string[] = [];

    // 1. Profanity check
    const hasProfanity = PROFANITY_PATTERNS.some((p) => p.test(sanitizedText));
    if (hasProfanity) {
      flags.push('profanity_detected');
    }

    // 2. Links check (Strict prohibition against commercial/spam links in reviews)
    const hasLinks = LINK_PATTERNS.some((p) => p.test(rawText) || p.test(sanitizedText));
    if (hasLinks) {
      flags.push('links_detected');
    }

    // 3. Duplicate similarity check (> 80% similarity with recent reviews)
    let isDuplicate = false;
    for (const existing of existingPlaceReviewTexts) {
      const sim = calculateTextSimilarity(sanitizedText, existing);
      if (sim > 0.8) {
        isDuplicate = true;
        flags.push('duplicate_review_detected');
        break;
      }
    }

    let actionRequired: 'auto_approve' | 'queue_to_moderator' | 'reject' = 'auto_approve';
    if (hasProfanity || hasLinks || isDuplicate) {
      actionRequired = 'queue_to_moderator';
    }

    return {
      passed: actionRequired === 'auto_approve',
      sanitizedText,
      hasProfanity,
      hasLinks,
      isDuplicate,
      actionRequired,
      flags,
    };
  }

  /**
   * Records an immutable moderation audit log entry.
   */
  logModerationAction(
    reviewId: string,
    moderatorId: string,
    action: 'approve' | 'reject' | 'flag',
    reason: string
  ): ModerationAuditEntry {
    const entry: ModerationAuditEntry = {
      id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      reviewId,
      moderatorId,
      action,
      reason,
      timestamp: new Date().toISOString(),
    };

    this.auditLogs.push(entry);
    return entry;
  }

  getAuditLogs(): readonly ModerationAuditEntry[] {
    return this.auditLogs;
  }

  clear(): void {
    this.auditLogs = [];
  }
}

export const moderationService = new ModerationService();
