import { ValidationError } from '../../errors/app-error';

/**
 * P18: Favorites Architecture
 *
 * Requirements:
 * 1. Keyed by composite key (user_id, place_id).
 * 2. Soft cap of 500 favorites per user.
 * 3. Strictly private (never exposed publicly).
 */

export interface FavoriteRecord {
  userId: string;
  placeId: string;
  notes?: string;
  createdAt: string;
}

export const MAX_FAVORITES_PER_USER = 500;

export class FavoritesService {
  // Keyed by composite string: `${userId}:${placeId}`
  private favorites = new Map<string, FavoriteRecord>();

  private getCompositeKey(userId: string, placeId: string): string {
    return `${userId.trim()}:${placeId.trim()}`;
  }

  /**
   * Adds a place to user favorites, enforcing the 500-item soft cap.
   */
  async addFavorite(
    userId: string,
    placeId: string,
    notes?: string
  ): Promise<FavoriteRecord> {
    const key = this.getCompositeKey(userId, placeId);
    const existing = this.favorites.get(key);

    if (existing) {
      if (notes !== undefined) {
        existing.notes = notes;
      }
      return existing;
    }

    const currentCount = this.countUserFavorites(userId);
    if (currentCount >= MAX_FAVORITES_PER_USER) {
      throw new ValidationError(
        `Favorites soft cap of ${MAX_FAVORITES_PER_USER} places reached. Please remove items before adding more.`,
        [{ name: 'placeId', reason: `Exceeded soft cap limit of ${MAX_FAVORITES_PER_USER}` }]
      );
    }

    const record: FavoriteRecord = {
      userId: userId.trim(),
      placeId: placeId.trim(),
      notes,
      createdAt: new Date().toISOString(),
    };

    this.favorites.set(key, record);
    return record;
  }

  async removeFavorite(userId: string, placeId: string): Promise<boolean> {
    const key = this.getCompositeKey(userId, placeId);
    return this.favorites.delete(key);
  }

  isFavorite(userId: string, placeId: string): boolean {
    const key = this.getCompositeKey(userId, placeId);
    return this.favorites.has(key);
  }

  /**
   * Strictly returns favorites for the authenticated user only.
   */
  listFavorites(userId: string): FavoriteRecord[] {
    const uid = userId.trim();
    const result: FavoriteRecord[] = [];
    for (const fav of this.favorites.values()) {
      if (fav.userId === uid) {
        result.push({ ...fav });
      }
    }
    return result;
  }

  countUserFavorites(userId: string): number {
    const uid = userId.trim();
    let count = 0;
    for (const fav of this.favorites.values()) {
      if (fav.userId === uid) count++;
    }
    return count;
  }

  deleteAllForUser(userId: string): number {
    const uid = userId.trim();
    let deletedCount = 0;
    for (const [key, fav] of this.favorites.entries()) {
      if (fav.userId === uid) {
        this.favorites.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  clear(): void {
    this.favorites.clear();
  }
}

export const favoritesService = new FavoritesService();
