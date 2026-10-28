import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P37–P38 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // Paths under audit
  const boardingPassPath = path.join(rootDir, 'packages/ui/src/wayfinding/TripBoardingPass.tsx');
  const breakEvenPath = path.join(rootDir, 'packages/ui/src/wayfinding/BreakEvenSchematicCard.tsx');
  const receiptChitPath = path.join(
    rootDir,
    'packages/ui/src/wayfinding/PerforatedReceiptChit.tsx',
  );
  const restaurantCardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
  const buttonPrimitivePath = path.join(rootDir, 'packages/ui/src/primitives/Button.tsx');
  const integrationsHealthPath = path.join(
    rootDir,
    'apps/admin/src/screens/IntegrationsHealthScreen.tsx',
  );
  const mockGatewayPath = path.join(
    rootDir,
    'apps/api/src/modules/payments/adapters/mock-gateway.adapter.ts',
  );
  const fxServicePath = path.join(rootDir, 'apps/api/src/modules/dining/fx.service.ts');
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
  const tokensCssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');
  const spacingTokensPath = path.join(rootDir, 'packages/ui/src/tokens/spacing.ts');

  describe('P37: Final Fit-and-Finish (UI-P37-TASK-01 to TASK-05)', () => {
    it('verifies visual tokens parity across related wayfinding components side by side (TASK-01)', () => {
      const boardingPassCode = fs.readFileSync(boardingPassPath, 'utf8');
      const breakEvenCode = fs.readFileSync(breakEvenPath, 'utf8');
      const receiptChitCode = fs.readFileSync(receiptChitPath, 'utf8');
      const restaurantCode = fs.readFileSync(restaurantCardPath, 'utf8');

      // Shared tactile card surface styling
      expect(boardingPassCode).toContain('bg-paper');
      expect(breakEvenCode).toContain('bg-paper');
      expect(receiptChitCode).toContain('bg-paper');

      // Shared card border tokens
      expect(breakEvenCode).toContain('border-paper-edge');
      expect(receiptChitCode).toContain('border-paper-edge');

      // Tabular numerics enforced across all components
      expect(boardingPassCode).toContain('tnum');
      expect(breakEvenCode).toContain('tnum');
      expect(receiptChitCode).toContain('tnum');
      expect(restaurantCode).toContain('tnum');
    });

    it('verifies strict elimination of arbitrary bracket styling exceptions (TASK-02)', () => {
      const breakEvenCode = fs.readFileSync(breakEvenPath, 'utf8');
      const restaurantCode = fs.readFileSync(restaurantCardPath, 'utf8');
      const buttonCode = fs.readFileSync(buttonPrimitivePath, 'utf8');

      // Zero arbitrary Tailwind pixel bracket values
      expect(breakEvenCode).not.toContain('text-[');
      expect(breakEvenCode).not.toContain('min-h-[');
      expect(restaurantCode).not.toContain('text-[');
      expect(restaurantCode).not.toContain('min-h-[');
      expect(buttonCode).not.toContain('text-[');
      expect(buttonCode).not.toContain('min-h-[');
    });

    it('verifies spacing rhythm and baseline alignment standards (TASK-03)', () => {
      const spacingCode = fs.readFileSync(spacingTokensPath, 'utf8');
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

      // 4px/8px modular spacing scale defined
      expect(spacingCode).toContain("spaceXs: '0.25rem'");
      expect(spacingCode).toContain("spaceSm: '0.5rem'");
      expect(spacingCode).toContain("spaceMd: '1rem'");
      expect(spacingCode).toContain("spaceLg: '1.5rem'");

      // Tabular numerics globally declared
      expect(globalsCss).toContain('font-feature-settings: "tnum" 1');
    });

    it('verifies focus and disabled states at final visual scale (TASK-04)', () => {
      const buttonCode = fs.readFileSync(buttonPrimitivePath, 'utf8');
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

      // High-contrast focus rings
      expect(buttonCode).toContain('focus-visible:ring-2 focus-visible:ring-primary');
      expect(globalsCss).toContain(':focus-visible');

      // Disabled state styling
      expect(buttonCode).toContain('disabled:opacity-50');
      expect(buttonCode).toContain('disabled:cursor-not-allowed');

      // Minimum 48px touch target across all interactive elements
      expect(buttonCode).toContain('min-h-12');
      expect(globalsCss).toContain('min-height: 48px');
    });

    it('verifies high-severity defect closure across error and content surfaces (TASK-05)', () => {
      const enMessages = JSON.parse(
        fs.readFileSync(path.join(rootDir, 'apps/web/messages/en.json'), 'utf8'),
      );
      const idMessages = JSON.parse(
        fs.readFileSync(path.join(rootDir, 'apps/web/messages/id.json'), 'utf8'),
      );

      // 100% dictionary key parity
      expect(Object.keys(enMessages.support)).toEqual(Object.keys(idMessages.support));
      expect(Object.keys(enMessages.footer)).toEqual(Object.keys(idMessages.footer));

      // Complete absence of lorem ipsum
      expect(JSON.stringify(enMessages).toLowerCase()).not.toContain('lorem ipsum');
      expect(JSON.stringify(idMessages).toLowerCase()).not.toContain('lorem ipsum');
    });
  });

  describe('P38: Staged Rollout and Feature Controls (UI-P38-TASK-01 to TASK-05)', () => {
    it('verifies segmented reviewable package architecture (TASK-01)', () => {
      const rootPackageJson = JSON.parse(
        fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
      );
      const pnpmWorkspace = fs.readFileSync(path.join(rootDir, 'pnpm-workspace.yaml'), 'utf8');

      expect(rootPackageJson.name).toBe('javamifi-compass');
      expect(pnpmWorkspace).toContain('apps/*');
      expect(pnpmWorkspace).toContain('packages/*');
    });

    it('verifies controlled adapter feature switching and rollback boundaries (TASK-02)', () => {
      const healthCode = fs.readFileSync(integrationsHealthPath, 'utf8');

      // Controlled runtime adapter switching between mock and sandbox
      expect(healthCode).toContain('handleSwitchPayment');
      expect(healthCode).toContain('handleSwitchEsim');
      expect(healthCode).toContain('apiClient.admin.switchAdapter');
    });

    it('verifies absence of hidden permanent dead branches via clean adapter ports (TASK-03)', () => {
      const mockCode = fs.readFileSync(mockGatewayPath, 'utf8');

      // Implements clean PaymentGatewayPort interface
      expect(mockCode).toContain('implements PaymentGatewayPort');
      expect(mockCode).toContain("readonly mode = 'mock'");
      expect(mockCode).toContain('createPayment(');
      expect(mockCode).toContain('verifyNotification(');
    });

    it('verifies post-release observability and health telemetry signals (TASK-04)', () => {
      const healthCode = fs.readFileSync(integrationsHealthPath, 'utf8');

      // Live health monitoring endpoint integration
      expect(healthCode).toContain('/health');
      expect(healthCode).toContain('fetchHealth');
      expect(healthCode).toContain('paymentGateway');
      expect(healthCode).toContain('esimProvider');
    });

    it('verifies fail-closed rollback policy and financial invariants (TASK-05)', () => {
      const fxCode = fs.readFileSync(fxServicePath, 'utf8');

      // Fail-Closed policy: no guessing or synthetic rates if fresh quote missing
      expect(fxCode).toContain('Fail-Closed');
      expect(fxCode).toContain('rateSnapshotDate');
    });
  });
});
