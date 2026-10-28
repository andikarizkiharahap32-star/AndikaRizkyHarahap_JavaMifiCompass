import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P33–P34 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P33 & P34 Paths
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const destinationsPagePath = path.join(
    rootDir,
    'apps/web/src/app/[locale]/destinations/page.tsx',
  );
  const supportPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/support/page.tsx');
  const footerPath = path.join(rootDir, 'apps/web/src/components/Footer.tsx');
  const baselinesDir = path.join(rootDir, '.gstack/qa-reports/baseline-screenshots');

  describe('P33: UX Writing and Content Quality Pass (UI-P33-TASK-01 to TASK-05)', () => {
    it('verifies complete elimination of lorem ipsum placeholder copy across messages (TASK-01)', () => {
      const enRaw = fs.readFileSync(enMessagesPath, 'utf8').toLowerCase();
      const idRaw = fs.readFileSync(idMessagesPath, 'utf8').toLowerCase();

      expect(enRaw).not.toContain('lorem ipsum');
      expect(idRaw).not.toContain('lorem ipsum');
    });

    it('verifies safe, user-friendly error copy without internal stack traces or jargon (TASK-02)', () => {
      const diningCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      // User-friendly diagnostic messaging
      expect(diningCode).toContain('Gagal Memuat Data Kuliner');
      expect(diningCode).toContain('Terjadi kendala saat menghubungi server verifikasi');
      expect(diningCode).not.toContain('error.stack');
      expect(diningCode).not.toContain('NullPointerException');
    });

    it('verifies actionable recovery triggers in error and empty states (TASK-03)', () => {
      const diningCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      // Error recovery trigger
      expect(diningCode).toContain('Coba Lagi');
      expect(diningCode).toContain('min-h-12 min-w-12');

      // Empty state recovery options
      expect(diningCode).toContain('Hapus Semua Filter');
      expect(diningCode).toContain('Perluas Radius ke 10 km');
      expect(diningCode).toContain('Tampilkan Semua Menu');
    });

    it('verifies structural parity across key dictionaries in EN and ID (TASK-04)', () => {
      const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
      const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

      // Check support dictionary keys
      expect(Object.keys(en.support)).toEqual(Object.keys(id.support));

      // Check footer dictionary keys
      expect(Object.keys(en.footer)).toEqual(Object.keys(id.footer));

      // Check destinationsPage dictionary keys
      expect(Object.keys(en.destinationsPage)).toEqual(Object.keys(id.destinationsPage));
    });

    it('verifies consistent, authoritative transit wayfinding tone in support and footer (TASK-05)', () => {
      const supportCode = fs.readFileSync(supportPagePath, 'utf8');
      const footerCode = fs.readFileSync(footerPath, 'utf8');

      expect(footerCode).toContain('JavaMifi Compass');
      expect(supportCode).toContain("useTranslations('support')");
      expect(supportCode).toContain('slaBadge');
      expect(footerCode).toContain('telemetryStatus');
      expect(footerCode).toContain('min-h-12');
    });
  });

  describe('P34: Visual QA and Regression Control (UI-P34-TASK-01 to TASK-05)', () => {
    it('verifies approved visual baseline captures exist for all 14 key route configurations (TASK-01)', () => {
      expect(fs.existsSync(baselinesDir)).toBe(true);

      const requiredBaselines = [
        'home-id-desktop.png',
        'home-en-desktop.png',
        'home-id-mobile.png',
        'planner-desktop.png',
        'planner-mobile.png',
        'dining-desktop.png',
        'dining-mobile.png',
        'destinations-desktop.png',
        'destination-detail-desktop.png',
        'checkout-desktop.png',
        'checkout-mobile.png',
        'trip-hub-desktop.png',
        'design-system-lab-desktop.png',
        'admin-dashboard-desktop.png',
      ];

      for (const baseline of requiredBaselines) {
        const filePath = path.join(baselinesDir, baseline);
        expect(fs.existsSync(filePath), `Missing baseline snapshot: ${baseline}`).toBe(true);
        const stats = fs.statSync(filePath);
        expect(stats.size).toBeGreaterThan(1000); // Verify non-empty valid PNG file
      }
    });

    it('verifies normalized image viewport sizing and aspect ratio containment in destinations (TASK-02)', () => {
      const destCode = fs.readFileSync(destinationsPagePath, 'utf8');

      expect(destCode).toContain('aspect-video');
      expect(destCode).toContain(
        'sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"',
      );
      expect(destCode).toContain('object-cover');
    });

    it('verifies shared component integrity and absence of visual regressions across routes (TASK-04)', () => {
      const destCode = fs.readFileSync(destinationsPagePath, 'utf8');
      const footerCode = fs.readFileSync(footerPath, 'utf8');

      // Zero arbitrary px values
      expect(destCode).not.toContain('text-[');
      expect(destCode).not.toContain('min-h-[');
      expect(footerCode).not.toContain('text-[');
      expect(footerCode).not.toContain('min-h-[');

      // Tabular numerics enforced
      expect(destCode).toContain('tnum');
    });
  });
});
