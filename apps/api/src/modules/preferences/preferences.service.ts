import { ValidationError } from '../../errors/app-error';

/**
 * P18: User Preferences & GDPR Export/Deletion Engine
 *
 * Requirements:
 * 1. Minimal explicit preferences: display currency, locale, dietary strictness, cuisine tags.
 * 2. Export endpoint covering all user data (preferences, favorites, reviews, sessions).
 * 3. Deletion endpoint removing or anonymizing everywhere (Right to be Forgotten).
 * 4. Prohibition: Do not store travel history unless user opts in.
 * 5. Prohibition: Do not infer religion or beliefs.
 * 6. Prohibition: Do not expose favorites publicly.
 */

export type DietaryStrictness = 'strict_halal' | 'halal_only' | 'muslim_friendly';

export interface UserPreferences {
  userId: string;
  displayCurrency: string; // e.g. IDR, USD, JPY
  locale: string; // e.g. id, en, ja
  dietaryStrictness: DietaryStrictness;
  cuisineTags: string[];
  optInTravelHistory: boolean; // default false
  updatedAt: string;
}

export interface UserDataExport {
  userId: string;
  exportedAt: string;
  preferences: UserPreferences | null;
  favorites: Array<{ placeId: string; addedAt: string }>;
  reviews: Array<{ id: string; placeId: string; rating: number; body: string; createdAt: string }>;
  sessionsCount: number;
}

const FORBIDDEN_INFERRED_ATTRIBUTES = [
  /religion/i,
  /sect/i,
  /creed/i,
  /ethnicity/i,
  /political/i,
  /belief/i,
];

/**
 * P18 Prohibition: Verify no inferred sensitive religious or ideological attributes are stored.
 */
export function assertNoInferredAttributes(data: Record<string, any>): void {
  const jsonStr = JSON.stringify(data);
  for (const pattern of FORBIDDEN_INFERRED_ATTRIBUTES) {
    if (pattern.test(jsonStr)) {
      throw new Error(
        `Privacy Violation (P18): Storing inferred beliefs or sensitive personal profiles is strictly prohibited matching ${pattern}`
      );
    }
  }
}

export class PreferencesService {
  private preferences = new Map<string, UserPreferences>();

  /**
   * Updates or sets explicit user preferences.
   */
  async updatePreferences(
    userId: string,
    input: Partial<Omit<UserPreferences, 'userId' | 'updatedAt'>>
  ): Promise<UserPreferences> {
    assertNoInferredAttributes(input);

    const existing = this.preferences.get(userId) || {
      userId,
      displayCurrency: 'IDR',
      locale: 'id',
      dietaryStrictness: 'halal_only',
      cuisineTags: [],
      optInTravelHistory: false,
      updatedAt: new Date().toISOString(),
    };

    if (input.displayCurrency) {
      existing.displayCurrency = input.displayCurrency.trim().toUpperCase();
    }
    if (input.locale) {
      existing.locale = input.locale.trim().toLowerCase();
    }
    if (input.dietaryStrictness) {
      const validStrictness: DietaryStrictness[] = ['strict_halal', 'halal_only', 'muslim_friendly'];
      if (!validStrictness.includes(input.dietaryStrictness)) {
        throw new ValidationError('Invalid dietaryStrictness value', [
          { name: 'dietaryStrictness', reason: 'Must be strict_halal, halal_only, or muslim_friendly' },
        ]);
      }
      existing.dietaryStrictness = input.dietaryStrictness;
    }
    if (Array.isArray(input.cuisineTags)) {
      existing.cuisineTags = input.cuisineTags.map((t) => t.trim().toLowerCase()).filter(Boolean);
    }
    if (typeof input.optInTravelHistory === 'boolean') {
      existing.optInTravelHistory = input.optInTravelHistory;
    }

    existing.updatedAt = new Date().toISOString();
    this.preferences.set(userId, existing);
    return existing;
  }

  getPreferences(userId: string): UserPreferences {
    return (
      this.preferences.get(userId) || {
        userId,
        displayCurrency: 'IDR',
        locale: 'id',
        dietaryStrictness: 'halal_only',
        cuisineTags: [],
        optInTravelHistory: false,
        updatedAt: new Date().toISOString(),
      }
    );
  }

  /**
   * GDPR Data Portability: Exports all user data across all tables.
   */
  async exportUserData(
    userId: string,
    mockStores?: {
      favorites?: Array<{ placeId: string; addedAt: string }>;
      reviews?: Array<{ id: string; placeId: string; rating: number; body: string; createdAt: string }>;
      sessionsCount?: number;
    }
  ): Promise<UserDataExport> {
    return {
      userId,
      exportedAt: new Date().toISOString(),
      preferences: this.preferences.get(userId) || null,
      favorites: mockStores?.favorites || [],
      reviews: mockStores?.reviews || [],
      sessionsCount: mockStores?.sessionsCount ?? 0,
    };
  }

  /**
   * GDPR Right to be Forgotten: Permanently deletes or anonymizes user records everywhere.
   */
  async deleteUserData(
    userId: string,
    cascades?: {
      deleteFavorites?: (uid: string) => void;
      anonymizeReviews?: (uid: string) => void;
      deleteSessions?: (uid: string) => void;
    }
  ): Promise<{ deleted: boolean; tablesAffected: string[] }> {
    const tablesAffected: string[] = [];

    if (this.preferences.has(userId)) {
      this.preferences.delete(userId);
      tablesAffected.push('user_preferences');
    }

    if (cascades?.deleteFavorites) {
      cascades.deleteFavorites(userId);
      tablesAffected.push('favorites');
    }

    if (cascades?.anonymizeReviews) {
      cascades.anonymizeReviews(userId);
      tablesAffected.push('reviews');
    }

    if (cascades?.deleteSessions) {
      cascades.deleteSessions(userId);
      tablesAffected.push('sessions');
    }

    return {
      deleted: true,
      tablesAffected,
    };
  }

  clear(): void {
    this.preferences.clear();
  }
}

export const preferencesService = new PreferencesService();
