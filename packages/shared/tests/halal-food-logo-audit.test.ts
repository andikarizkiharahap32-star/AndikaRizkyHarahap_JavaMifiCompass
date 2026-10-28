import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { HALAL_FOOD_LOGO_PNG } from '../../ui/src/dining/DiningLogo';

describe('Halal Food PNG Logo Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const pngPath = path.join(rootDir, 'apps/web/public/images/halal-food-logo.png');
  const diningLogoPath = path.join(rootDir, 'packages/ui/src/dining/DiningLogo.tsx');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const readinessCardPath = path.join(rootDir, 'apps/web/src/components/DestinationReadinessCard.tsx');

  it('verifies the PNG screenshot asset exists in apps/web/public/images/ and has valid PNG header', () => {
    expect(fs.existsSync(pngPath)).toBe(true);

    const buffer = fs.readFileSync(pngPath);
    // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
    expect(buffer[4]).toBe(0x0d);
    expect(buffer[5]).toBe(0x0a);
    expect(buffer[6]).toBe(0x1a);
    expect(buffer[7]).toBe(0x0a);

    // File size matches the uploaded screenshot (~28KB)
    expect(buffer.length).toBeGreaterThan(20000);
  });

  it('verifies DiningLogo defaults to the user-provided PNG screenshot asset', () => {
    expect(HALAL_FOOD_LOGO_PNG).toBe('/images/halal-food-logo.png');

    const content = fs.readFileSync(diningLogoPath, 'utf8');
    expect(content).toContain("src = HALAL_FOOD_LOGO_PNG");
    expect(content).toContain("<img");
    expect(content).toContain("rounded-full");
    expect(content).toContain("alt={alt}");

    // Confirms legacy SVG cloche with 'D' glyph is no longer used
    expect(content).not.toContain('<circle cx="32" cy="16"');
    expect(content).not.toContain('>D<');
  });

  it('verifies DiningDiscovery prominently displays DiningLogo with wordmark', () => {
    const content = fs.readFileSync(diningDiscoveryPath, 'utf8');
    expect(content).toContain('<DiningLogo size={56} showWordmark={true} />');
  });

  it('verifies DestinationReadinessCard displays DiningLogo in the Halal Food banner', () => {
    const content = fs.readFileSync(readinessCardPath, 'utf8');
    expect(content).toContain('<DiningLogo size={40} showWordmark={false} />');
    expect(content).toContain('STATION: EAT // COMPASS RASA');
  });
});
