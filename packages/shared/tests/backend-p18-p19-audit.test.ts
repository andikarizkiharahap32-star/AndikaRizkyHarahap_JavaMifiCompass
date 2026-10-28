import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  PreferencesService,
  assertNoInferredAttributes,
} from '../../../apps/api/src/modules/preferences/preferences.service';
import {
  FavoritesService,
  MAX_FAVORITES_PER_USER,
} from '../../../apps/api/src/modules/favorites/favorites.service';
import {
  MediaService,
  sniffMimeType,
  stripExifMetadata,
  MAX_UPLOAD_SIZE_BYTES,
  CDN_ORIGIN,
  API_ORIGIN,
} from '../../../apps/api/src/modules/media/media.service';

describe('Backend and Workflows - P18: User Preferences and Favorites', () => {
  let prefService: PreferencesService;
  let favService: FavoritesService;

  beforeEach(() => {
    prefService = new PreferencesService();
    favService = new FavoritesService();
  });

  it('P18-1: Updates and retrieves explicit user preferences with valid dietary strictness', async () => {
    const updated = await prefService.updatePreferences('usr_001', {
      displayCurrency: 'USD',
      locale: 'en',
      dietaryStrictness: 'strict_halal',
      cuisineTags: ['ramen', 'wagyu'],
    });

    expect(updated.userId).toBe('usr_001');
    expect(updated.displayCurrency).toBe('USD');
    expect(updated.dietaryStrictness).toBe('strict_halal');
    expect(updated.cuisineTags).toEqual(['ramen', 'wagyu']);
    expect(updated.optInTravelHistory).toBe(false); // Default false

    // Invalid dietary strictness
    await expect(
      prefService.updatePreferences('usr_001', {
        dietaryStrictness: 'invalid_tier' as any,
      }),
    ).rejects.toThrow(/Invalid dietaryStrictness/);
  });

  it('P18-2: Prohibition: Rejects storing inferred religion, sect, or ideological profiling attributes', () => {
    const safeData = { displayCurrency: 'IDR', locale: 'id' };
    expect(() => assertNoInferredAttributes(safeData)).not.toThrow();

    const unsafeData = { religion: 'inferred_sunni', displayCurrency: 'IDR' };
    expect(() => assertNoInferredAttributes(unsafeData)).toThrow(/Privacy Violation \(P18\)/);
  });

  it('P18-3: Enforces favorites composite key (user_id, place_id) and soft cap of 500', async () => {
    const userId = 'usr_collector';

    // Add up to 500 favorites
    for (let i = 1; i <= 500; i++) {
      await favService.addFavorite(userId, `plc_venue_${i}`);
    }

    expect(favService.countUserFavorites(userId)).toBe(500);

    // 501st favorite exceeds soft cap -> rejected
    await expect(favService.addFavorite(userId, 'plc_venue_501')).rejects.toThrow(
      /Favorites soft cap of 500 places reached/,
    );
  });

  it('P18-4: Favorites are strictly private and cannot be accessed across different users', async () => {
    await favService.addFavorite('usr_alice', 'plc_tokyo_01');
    await favService.addFavorite('usr_bob', 'plc_osaka_02');

    const aliceFavorites = favService.listFavorites('usr_alice');
    expect(aliceFavorites).toHaveLength(1);
    expect(aliceFavorites[0]?.placeId).toBe('plc_tokyo_01');

    // Bob cannot see Alice's favorites
    const bobFavorites = favService.listFavorites('usr_bob');
    expect(bobFavorites).toHaveLength(1);
    expect(bobFavorites[0]?.placeId).toBe('plc_osaka_02');
  });

  it('P18-5: GDPR Data Portability & Right to be Forgotten (Export & Deletion)', async () => {
    const userId = 'usr_gdpr_test';

    await prefService.updatePreferences(userId, { displayCurrency: 'SGD' });
    await favService.addFavorite(userId, 'plc_kyoto_01');

    // 1. Export covers all user data
    const exportData = await prefService.exportUserData(userId, {
      favorites: [{ placeId: 'plc_kyoto_01', addedAt: new Date().toISOString() }],
      reviews: [
        {
          id: 'rev_1',
          placeId: 'plc_kyoto_01',
          rating: 5,
          body: 'Superb dining',
          createdAt: new Date().toISOString(),
        },
      ],
      sessionsCount: 2,
    });

    expect(exportData.userId).toBe(userId);
    expect(exportData.preferences?.displayCurrency).toBe('SGD');
    expect(exportData.favorites).toHaveLength(1);
    expect(exportData.reviews).toHaveLength(1);
    expect(exportData.sessionsCount).toBe(2);

    // 2. Deletion cascades everywhere
    let reviewsAnonymized = false;
    let sessionsDeleted = false;

    const deleteResult = await prefService.deleteUserData(userId, {
      deleteFavorites: (uid) => favService.deleteAllForUser(uid),
      anonymizeReviews: () => {
        reviewsAnonymized = true;
      },
      deleteSessions: () => {
        sessionsDeleted = true;
      },
    });

    expect(deleteResult.deleted).toBe(true);
    expect(deleteResult.tablesAffected).toContain('user_preferences');
    expect(deleteResult.tablesAffected).toContain('favorites');
    expect(deleteResult.tablesAffected).toContain('reviews');
    expect(deleteResult.tablesAffected).toContain('sessions');

    expect(favService.countUserFavorites(userId)).toBe(0);
    expect(reviewsAnonymized).toBe(true);
    expect(sessionsDeleted).toBe(true);
  });
});

describe('Backend and Workflows - P19: Media and Uploads', () => {
  let mediaService: MediaService;

  beforeEach(() => {
    mediaService = new MediaService();
  });

  it('P19-1: Generates direct-to-S3 presigned PUT with size condition <= 8 MB and CDN origin', () => {
    // Valid 5MB upload
    const details = mediaService.createPresignedUploadUrl(
      'usr_001',
      'halal_ramen.jpg',
      'image/jpeg',
      5 * 1024 * 1024,
    );

    expect(details.uploadUrl).toContain('s3.ap-southeast-1.amazonaws.com');
    expect(details.s3Key).toMatch(/^uploads\/usr_001\/[a-f0-9-]+\.jpg$/);

    // P19 Prohibition: Must be served from separate CDN origin, never API origin
    expect(details.cdnUrl.startsWith(CDN_ORIGIN)).toBe(true);
    expect(details.cdnUrl.startsWith(API_ORIGIN)).toBe(false);

    // Rejects upload exceeding 8 MB
    expect(() =>
      mediaService.createPresignedUploadUrl(
        'usr_001',
        'huge_photo.jpg',
        'image/jpeg',
        9 * 1024 * 1024, // 9 MB
      ),
    ).toThrow(/File size exceeds maximum allowable limit of 8 MB/);
  });

  it('P19-2: Magic byte content sniffing rejects mismatched or spoofed MIME types', () => {
    // 1. Valid JPEG buffer (SOI header FF D8 FF)
    const validJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    expect(sniffMimeType(validJpeg)).toBe('image/jpeg');

    // 2. Valid PNG buffer (89 50 4E 47 ...)
    const validPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    expect(sniffMimeType(validPng)).toBe('image/png');

    // 3. Spoofed file: Client declares image/jpeg but payload is HTML script
    const fakeJpeg = Buffer.from('<script>alert("malicious payload")</script>');
    expect(sniffMimeType(fakeJpeg)).toBeNull();

    expect(() => mediaService.processAndSanitizeUpload(fakeJpeg, 'image/jpeg')).toThrow(
      /Content sniff failed/,
    );
  });

  it('P19-3: Strips APP1 EXIF & GPS metadata from JPEG buffers', () => {
    // Construct JPEG buffer with APP1 EXIF segment (0xFF 0xE1) containing mock GPS data
    const app1Payload = Buffer.from('Exif..GPS:35.6895,139.6917');
    const app1Length = app1Payload.length + 2;

    const bufferWithExif = Buffer.concat([
      Buffer.from([0xff, 0xd8]), // SOI
      Buffer.from([0xff, 0xe1, (app1Length >> 8) & 0xff, app1Length & 0xff]), // APP1 header + length
      app1Payload, // APP1 data
      Buffer.from([0xff, 0xda, 0x00, 0x02]), // SOS (Start of Scan)
      Buffer.from('image_entropy_data'),
      Buffer.from([0xff, 0xd9]), // EOI
    ]);

    expect(bufferWithExif.includes(Buffer.from([0xff, 0xe1]))).toBe(true);

    const stripped = stripExifMetadata(bufferWithExif);

    // APP1 EXIF marker and GPS coordinates are completely removed
    expect(stripped.includes(Buffer.from([0xff, 0xe1]))).toBe(false);
    expect(stripped.toString('utf-8')).not.toContain('GPS:35.6895');
    expect(stripped.includes(Buffer.from([0xff, 0xd8]))).toBe(true); // SOI intact
    expect(stripped.includes(Buffer.from([0xff, 0xd9]))).toBe(true); // EOI intact
  });

  it('P19-4: Signed CDN URLs provide time-limited access to private objects', () => {
    const signed = mediaService.createSignedCdnUrl('certificates/cert_9921.jpg', 1800);

    expect(signed.startsWith(CDN_ORIGIN)).toBe(true);
    expect(signed).toContain('token=');
    expect(signed).toContain('expires=');
  });

  it('P19-5: infra/storage/policy.json enforces 8MB limit and separate CDN origin', () => {
    const policyPath = path.resolve(__dirname, '../../../infra/storage/policy.json');
    expect(fs.existsSync(policyPath)).toBe(true);

    const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
    expect(policy.Statement).toBeDefined();

    const sizeLimitStmt = policy.Statement.find((s: any) => s.Sid === 'EnforceMaxUploadSize8MB');
    expect(sizeLimitStmt).toBeDefined();
    expect(sizeLimitStmt.Condition.NumericGreaterThan['s3:content-length-range']).toBe(8388608);

    const corsOrigins = policy.CorsConfiguration.CorsRules[0].AllowedOrigins;
    expect(corsOrigins).toContain('https://media.javamifi.com');
  });
});
