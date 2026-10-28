import { RateLimitError } from '../../errors/app-error';

/**
 * P10: Abuse Control & Per-User Daily Cost Budget for AI Assist Endpoints
 *
 * Requirements:
 * 1. Add daily cost budget per user for assist endpoints (/v1/assist/*).
 * 2. Cost budget enforced strictly in test and production.
 * 3. Resets daily at midnight UTC.
 * 4. Prohibition: Do not reveal limit internals in error responses.
 */

export interface CostBudgetResult {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  resetAt: string;
  secondsUntilReset: number;
}

export const DEFAULT_DAILY_ASSIST_BUDGET_CREDITS = 50.0; // 50 credits per user / day

export function getUtcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getSecondsUntilUtcMidnight(now = new Date()): number {
  const nextMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0),
  );
  return Math.max(1, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
}

export class CostBudgetService {
  // Key format: {userId}:{YYYY-MM-DD}
  private budgetMap = new Map<string, number>();

  /**
   * Consumes user credits against their daily budget.
   */
  consumeBudget(
    userId: string,
    costCredits = 1.0,
    dailyLimit = DEFAULT_DAILY_ASSIST_BUDGET_CREDITS,
  ): CostBudgetResult {
    const dayKey = getUtcDayKey();
    const storageKey = `${userId}:${dayKey}`;
    const now = new Date();
    const secondsUntilReset = getSecondsUntilUtcMidnight(now);
    const resetAt = new Date(now.getTime() + secondsUntilReset * 1000).toISOString();

    const currentUsed = this.budgetMap.get(storageKey) || 0;

    if (currentUsed + costCredits > dailyLimit) {
      return {
        allowed: false,
        used: currentUsed,
        remaining: Math.max(0, dailyLimit - currentUsed),
        limit: dailyLimit,
        resetAt,
        secondsUntilReset,
      };
    }

    const newUsed = currentUsed + costCredits;
    this.budgetMap.set(storageKey, newUsed);

    return {
      allowed: true,
      used: newUsed,
      remaining: Math.max(0, dailyLimit - newUsed),
      limit: dailyLimit,
      resetAt,
      secondsUntilReset,
    };
  }

  /**
   * Enforces cost budget, throwing RateLimitError (429) if user exceeds daily budget.
   */
  assertWithinCostBudget(
    userId: string,
    costCredits = 1.0,
    dailyLimit = DEFAULT_DAILY_ASSIST_BUDGET_CREDITS,
  ): CostBudgetResult {
    const result = this.consumeBudget(userId, costCredits, dailyLimit);

    if (!result.allowed) {
      throw new RateLimitError(
        result.secondsUntilReset,
        'Daily AI assist cost budget exceeded. Resets at midnight UTC.',
      );
    }

    return result;
  }

  getUsage(userId: string): number {
    const dayKey = getUtcDayKey();
    return this.budgetMap.get(`${userId}:${dayKey}`) || 0;
  }

  clear(): void {
    this.budgetMap.clear();
  }
}

export const costBudgetService = new CostBudgetService();
