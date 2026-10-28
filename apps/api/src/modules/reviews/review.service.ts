import { ValidationError, AuthenticationError, ConflictError } from '../../errors/app-error';
import { moderationService } from '../moderation/moderation.service';

/**
 * P17: Reviews Lifecycle & Owner Response Service
 *
 * Requirements:
 * 1. Require authenticated user.
 * 2. One review per place per 90 days.
 * 3. Body length: 20-2000 characters.
 * 4. Pre-publish moderation checks (profanity, links, similarity).
 * 5. Allow owner response with explicit isOwnerResponse: true.
 * 6. Prohibition: Do not let reviews change halal status.
 * 7. Prohibition: Do not expose reviewer emails.
 */

export interface CreateReviewInput {
  placeId: string;
  userId: string;
  reviewerDisplayName: string;
  userEmail?: string; // Must NOT be stored or leaked in public review
  rating: number; // 1 to 5
  body: string;
}

export interface OwnerResponseInput {
  reviewId: string;
  ownerUserId: string;
  responseText: string;
}

export interface ReviewRecord {
  id: string;
  placeId: string;
  userId: string;
  reviewerDisplayName: string;
  rating: number;
  body: string; // Sanitized plain text
  status: 'published' | 'pending_moderation' | 'rejected';
  flags: string[];
  ownerResponse?: {
    responseText: string;
    respondedAt: string;
    isOwnerResponse: true;
  };
  createdAt: number; // Timestamp ms
  updatedAt: number;
}

export const REVIEW_COOLDOWN_DAYS = 90;
export const REVIEW_COOLDOWN_MS = REVIEW_COOLDOWN_DAYS * 86400000;

export class ReviewService {
  private reviews = new Map<string, ReviewRecord>();

  /**
   * Submits a new user review with validation, frequency checking, and pre-publish moderation.
   */
  async submitReview(input: CreateReviewInput): Promise<ReviewRecord> {
    // 1. Authentication check
    if (!input.userId) {
      throw new AuthenticationError('Authentication required to submit a review');
    }

    // 2. Length check: 20 to 2000 characters
    const trimmedBody = (input.body || '').trim();
    if (trimmedBody.length < 20 || trimmedBody.length > 2000) {
      throw new ValidationError('Review body must be between 20 and 2000 characters', [
        { name: 'body', reason: 'Length must be in range [20, 2000]' },
      ]);
    }

    // 3. Frequency check: 1 review per place per 90 days
    const existing = this.findRecentUserReview(input.userId, input.placeId);
    if (existing) {
      const remainingDays = Math.ceil(
        (existing.createdAt + REVIEW_COOLDOWN_MS - Date.now()) / 86400000,
      );
      throw new ConflictError(
        `Only one review per place is permitted every 90 days. Please wait ${remainingDays} day(s).`,
      );
    }

    // 4. Pre-publish moderation
    const existingPlaceTexts = Array.from(this.reviews.values())
      .filter((r) => r.placeId === input.placeId)
      .map((r) => r.body);

    const modResult = moderationService.evaluateReviewText(trimmedBody, existingPlaceTexts);

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = Date.now();

    const record: ReviewRecord = {
      id: reviewId,
      placeId: input.placeId,
      userId: input.userId,
      // P17 Prohibition: Never expose reviewer emails in public objects
      reviewerDisplayName: input.reviewerDisplayName || 'Verified Diner',
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      body: modResult.sanitizedText,
      status: modResult.passed ? 'published' : 'pending_moderation',
      flags: modResult.flags,
      createdAt: now,
      updatedAt: now,
    };

    this.reviews.set(reviewId, record);
    return record;
  }

  /**
   * Adds an authenticated owner response, marking it clearly with isOwnerResponse: true.
   */
  async addOwnerResponse(input: OwnerResponseInput): Promise<ReviewRecord> {
    const review = this.reviews.get(input.reviewId);
    if (!review) {
      throw new ValidationError(`Review ${input.reviewId} not found`, [
        { name: 'reviewId', reason: 'Review does not exist' },
      ]);
    }

    const sanitizedResponse = (input.responseText || '').trim();
    if (sanitizedResponse.length < 5 || sanitizedResponse.length > 2000) {
      throw new ValidationError('Owner response must be between 5 and 2000 characters', [
        { name: 'responseText', reason: 'Length must be in range [5, 2000]' },
      ]);
    }

    review.ownerResponse = {
      responseText: sanitizedResponse,
      respondedAt: new Date().toISOString(),
      isOwnerResponse: true,
    };
    review.updatedAt = Date.now();

    return review;
  }

  findRecentUserReview(userId: string, placeId: string): ReviewRecord | undefined {
    const now = Date.now();
    for (const review of this.reviews.values()) {
      if (review.userId === userId && review.placeId === placeId) {
        if (now - review.createdAt < REVIEW_COOLDOWN_MS) {
          return review;
        }
      }
    }
    return undefined;
  }

  getReview(id: string): ReviewRecord | undefined {
    return this.reviews.get(id);
  }

  clear(): void {
    this.reviews.clear();
  }
}

export const reviewService = new ReviewService();
