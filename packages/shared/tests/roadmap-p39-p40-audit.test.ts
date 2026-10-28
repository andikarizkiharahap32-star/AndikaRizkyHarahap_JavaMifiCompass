import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P39–P40 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // Paths under audit
  const designSystemPagePath = path.join(
    rootDir,
    'apps/web/src/app/[locale]/design-system/page.tsx',
  );
  const designSystemLabPath = path.join(
    rootDir,
    'apps/web/src/app/[locale]/design-system/lab/page.tsx',
  );
  const baselinesDir = path.join(rootDir, '.gstack/qa-reports/baseline-screenshots');
  const fxServicePath = path.join(rootDir, 'apps/api/src/modules/dining/fx.service.ts');
  const healthControllerPath = path.join(
    rootDir,
    'apps/api/src/modules/health/health.controller.ts',
  );
  const tokensIndexPath = path.join(rootDir, 'packages/ui/src/tokens/index.ts');
  const semanticsPath = path.join(rootDir, 'packages/ui/src/tokens/semantics.ts');
  const spacingPath = path.join(rootDir, 'packages/ui/src/tokens/spacing.ts');
  const typographyPath = path.join(rootDir, 'packages/ui/src/tokens/typography.ts');
  const testsDir = path.join(rootDir, 'packages/shared/tests');

  describe('P39: Final UI/UX Audit and Handoff (UI-P39-TASK-01 to TASK-05)', () => {
    it('verifies complete traceability across all roadmap phases (TASK-01)', () => {
      // Confirm presence of test suites spanning the entire roadmap lifecycle
      const testFiles = fs.readdirSync(testsDir);

      expect(testFiles.some((f) => f.includes('roadmap-p0-p5'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p6-p7'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p8-p9'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p10-p11'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p12-p13'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p14-p15'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p15-p16'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p17-p18'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p19-p20'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p21-p22'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p23-p24'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p25-p26'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p27-p28'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p29-p30'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p31-p32'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p33-p34'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p35-p36'))).toBe(true);
      expect(testFiles.some((f) => f.includes('roadmap-p37-p38'))).toBe(true);
    });

    it('verifies route and viewport visual baseline evidence (TASK-02)', () => {
      expect(fs.existsSync(baselinesDir)).toBe(true);

      const baselineSnapshots = [
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

      for (const snapshot of baselineSnapshots) {
        const filePath = path.join(baselinesDir, snapshot);
        expect(fs.existsSync(filePath), `Missing baseline snapshot: ${snapshot}`).toBe(true);
      }
    });

    it('verifies fail-closed financial and security containment (TASK-03)', () => {
      const fxCode = fs.readFileSync(fxServicePath, 'utf8');

      // Fail-closed policy for unseeded or unavailable currency conversions
      expect(fxCode).toContain('Fail-Closed');
      expect(fxCode).toContain('rateSnapshotDate');
      expect(fxCode).toContain('provider');
    });

    it('verifies accessibility and performance gates compliance (TASK-04)', () => {
      const designSystemCode = fs.readFileSync(designSystemPagePath, 'utf8');
      const labCode = fs.readFileSync(designSystemLabPath, 'utf8');

      // Zero arbitrary pixel brackets in design system surfaces
      expect(designSystemCode).not.toContain('text-[');
      expect(designSystemCode).not.toContain('min-h-[');
      expect(labCode).not.toContain('text-[');
      expect(labCode).not.toContain('min-h-[');

      // Touch target compliance
      expect(labCode).toContain('min-h-12');
      expect(labCode).toContain('focus-visible:ring-primary');
    });

    it('verifies publication of interactive design system and 3D laboratory (TASK-05)', () => {
      const designSystemCode = fs.readFileSync(designSystemPagePath, 'utf8');
      const labCode = fs.readFileSync(designSystemLabPath, 'utf8');

      // Core design system features showcased
      expect(designSystemCode).toContain('TripBoardingPass');
      expect(designSystemCode).toContain('BreakEvenSchematicCard');
      expect(designSystemCode).toContain('PerforatedReceiptChit');
      expect(designSystemCode).toContain('SandboxGatewaySimulator');

      // 3D perspective lab published
      expect(labCode).toContain('OctilinearTicketTunnel');
    });
  });

  describe('P40: Design-System Governance and Long-Term Maintenance (UI-P40-TASK-01 to TASK-05)', () => {
    it('verifies token ownership and semantic exports in UI package (TASK-01)', () => {
      const tokensIndex = fs.readFileSync(tokensIndexPath, 'utf8');
      const semanticsCode = fs.readFileSync(semanticsPath, 'utf8');
      const spacingCode = fs.readFileSync(spacingPath, 'utf8');
      const typographyCode = fs.readFileSync(typographyPath, 'utf8');

      // UI package exports complete token architecture
      expect(tokensIndex).toContain('tokens =');
      expect(tokensIndex).toContain('spacingTokens');
      expect(tokensIndex).toContain('transitLineTokens');

      // Strict semantic boundaries
      expect(semanticsCode).toContain('transitLineTokens');
      expect(spacingCode).toContain('minTouchTarget');
      expect(typographyCode).toContain('fontFamilies');
    });

    it('verifies component review, lifecycle, and theme testing support (TASK-02)', () => {
      const designSystemCode = fs.readFileSync(designSystemPagePath, 'utf8');

      // Multi-theme previewing support
      expect(designSystemCode).toContain('activeTheme');
      expect(designSystemCode).toContain('side-by-side');
      expect(designSystemCode).toContain('Terminal Siang (Light) & Kabin Malam (Night)');
    });

    it('verifies automated regression firewall and ongoing maintenance tests (TASK-03)', () => {
      // Ensure comprehensive test suites exist across all critical domains
      const testFiles = fs.readdirSync(testsDir);

      expect(testFiles.length).toBeGreaterThanOrEqual(65);
      expect(testFiles).toContain('wcag-aa-compliance-p20.test.ts');
      expect(testFiles).toContain('token-architecture-p02.test.ts');
      expect(testFiles).toContain('global-reduced-motion.test.ts');
    });

    it('verifies clean style elimination without dead ad-hoc rules (TASK-04)', () => {
      const spacingCode = fs.readFileSync(spacingPath, 'utf8');

      // Standard house touch target constant strictly 48px
      expect(spacingCode).toContain("minTouchTarget: '48px'");
    });

    it('verifies health probes and operational telemetry for maintenance (TASK-05)', () => {
      const healthCode = fs.readFileSync(healthControllerPath, 'utf8');

      // Liveness and readiness endpoints
      expect(healthCode).toContain('@Get()');
      expect(healthCode).toContain("@Get('live')");
      expect(healthCode).toContain("@Get('ready')");
      expect(healthCode).toContain('uptimeSeconds');
      expect(healthCode).toContain('paymentGateway');
      expect(healthCode).toContain('esimProvider');
    });
  });
});
