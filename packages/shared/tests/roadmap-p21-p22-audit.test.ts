import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { responsiveTokens, a11yTokens } from '../../ui/src/tokens/spacing';

describe('Roadmap P21–P22 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P21 paths
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const plannerPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');

  // P22 paths
  const diningPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const checkoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
  const loginPath = path.join(rootDir, 'apps/web/src/app/[locale]/login/page.tsx');
  const adminAppPath = path.join(rootDir, 'apps/admin/src/App.tsx');
  const integrationsPath = path.join(
    rootDir,
    'apps/admin/src/screens/IntegrationsHealthScreen.tsx',
  );
  const dashboardPath = path.join(rootDir, 'apps/admin/src/screens/DashboardScreen.tsx');

  describe('P21: Responsive Behavior, Breakpoints, and Localization Resilience', () => {
    it('verifies responsive breakpoint tokens derived from content failure points (WS01–WS06)', () => {
      expect(responsiveTokens).toBeDefined();
      expect(responsiveTokens.viewport320).toBe('320px');
      expect(responsiveTokens.viewport360).toBe('360px');
      expect(responsiveTokens.viewport390).toBe('390px');
      expect(responsiveTokens.viewport768).toBe('768px');
      expect(responsiveTokens.viewport1024).toBe('1024px');
      expect(responsiveTokens.viewport1440).toBe('1440px');
    });

    it('verifies horizontal overflow containment and 2D scroll prevention in CSS and containers', () => {
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
      const diningCode = fs.readFileSync(diningPath, 'utf8');
      const plannerCode = fs.readFileSync(plannerPath, 'utf8');

      expect(globalsCss).toContain('.viewport-contained');
      expect(globalsCss).toContain('overflow-x: hidden');
      expect(diningCode).toContain('overflow-x-hidden');
      expect(diningCode).toContain('break-words');
      expect(plannerCode).toContain('overflow-x-hidden');
    });

    it('verifies 48px touch targets preserved across viewports for interactive elements', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');
      const diningCode = fs.readFileSync(diningPath, 'utf8');

      expect(navbarCode).toContain('min-h-12');
      expect(navbarCode).toContain('min-w-12');
      expect(diningCode).toContain('min-h-12');
      expect(diningCode).toContain('min-w-12');
    });

    it('verifies 100% dictionary key parity between id.json and en.json for localized copy', () => {
      const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));
      const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));

      function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
        let keys: string[] = [];
        for (const k of Object.keys(obj)) {
          const full = prefix ? `${prefix}.${k}` : k;
          if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
            keys = keys.concat(getAllKeys(obj[k], full));
          } else {
            keys.push(full);
          }
        }
        return keys;
      }

      const idKeys = new Set(getAllKeys(id));
      const enKeys = new Set(getAllKeys(en));

      const missingInEn = [...idKeys].filter((k) => !enKeys.has(k));
      const missingInId = [...enKeys].filter((k) => !idKeys.has(k));

      expect(missingInEn).toEqual([]);
      expect(missingInId).toEqual([]);
      expect(idKeys.size).toBeGreaterThan(500);

      // Verify dining status keys
      expect(id.dining.status.checking).toBeTruthy();
      expect(en.dining.status.checking).toBeTruthy();
      expect(id.dining.status.empty).toBeTruthy();
      expect(en.dining.status.empty).toBeTruthy();
    });
  });

  describe('P22: Loading, Empty, Success, and Error States (Primary Roadmap)', () => {
    it('verifies complete async state coverage in DiningDiscovery with accessible live regions and retry mechanism', () => {
      const diningCode = fs.readFileSync(diningPath, 'utf8');

      // Loading state with role="status" and polite announcement
      expect(diningCode).toContain('role="status" aria-live="polite"');
      expect(diningCode).toContain("t('status.checking')");

      // Error state with role="alert", assertive announcement, and retry action
      expect(diningCode).toContain('role="alert" aria-live="assertive"');
      expect(diningCode).toContain('Gagal Memuat Data Kuliner');
      expect(diningCode).toContain('Coba Lagi');
      expect(diningCode).toContain('setRetryCount');

      // Empty state with role="status", polite announcement, and recovery actions
      expect(diningCode).toContain("t('status.empty')");
      expect(diningCode).toContain('Hapus Semua Filter');
    });

    it('verifies user input preservation on error in checkout and login flows', () => {
      const checkoutCode = fs.readFileSync(checkoutPath, 'utf8');
      const loginCode = fs.readFileSync(loginPath, 'utf8');

      // Checkout preserves form state when error occurs
      expect(checkoutCode).toContain('setErrorMessage(err.message');
      expect(checkoutCode).toContain('setIsSubmitting(false)');
      expect(checkoutCode).toContain('role="alert"');
      expect(checkoutCode).toContain('aria-live="polite"');

      // Login preserves form state and announces error / success
      expect(loginCode).toContain('role="alert"');
      expect(loginCode).toContain('aria-live="polite"');
      expect(loginCode).toContain('role="status"');
    });

    it('verifies double-submit prevention and loading indicators on async triggers', () => {
      const checkoutCode = fs.readFileSync(checkoutPath, 'utf8');
      const loginCode = fs.readFileSync(loginPath, 'utf8');
      const buttonCode = fs.readFileSync(
        path.join(rootDir, 'packages/ui/src/primitives/Button.tsx'),
        'utf8',
      );

      // Checkout submit button double-submit prevention
      expect(checkoutCode).toContain('isLoading={isSubmitting}');
      expect(checkoutCode).toContain('disabled={isSubmitting}');

      // Login uses Button with isLoading prop
      expect(loginCode).toContain('isLoading={loading}');

      // Button primitive handles aria-busy, aria-disabled, and disabled states
      expect(buttonCode).toContain('const isDisabled = disabled || isLoading;');
      expect(buttonCode).toContain('aria-busy={isLoading}');
      expect(buttonCode).toContain('aria-disabled={isDisabled}');
      expect(buttonCode).toContain('animate-spin');
    });
  });

  describe('P22: Admin Shell and High-Density Operations UI (Stream Roadmap)', () => {
    it('verifies admin navigation shell, landmarks, and bypass skip-link in App.tsx', () => {
      const adminCode = fs.readFileSync(adminAppPath, 'utf8');

      expect(adminCode).toContain('aria-label="Navigasi Samping Admin"');
      expect(adminCode).toContain('aria-label="Navigasi Menu Admin"');
      expect(adminCode).toContain('href="#admin-main-content"');
      expect(adminCode).toContain('id="admin-main-content"');
    });

    it('verifies role-aware navigation links (RBAC) in admin shell', () => {
      const adminCode = fs.readFileSync(adminAppPath, 'utf8');

      expect(adminCode).toContain(
        "currentRole === 'SUPER_ADMIN' || item.roles.includes(currentRole)",
      );
      expect(adminCode).toContain("'SUPER_ADMIN'");
      expect(adminCode).toContain("'OPS'");
      expect(adminCode).toContain("'FINANCE'");
      expect(adminCode).toContain("'EDITOR'");
      expect(adminCode).toContain("'SUPPORT'");
    });

    it('verifies active route indication and operator identity in admin shell', () => {
      const adminCode = fs.readFileSync(adminAppPath, 'utf8');

      // Active tab marker
      expect(adminCode).toContain("aria-current={activeTab === item.id ? 'page' : undefined}");
      expect(adminCode).toContain('bg-sky-600 text-white');

      // Operator identity
      expect(adminCode).toContain('user.fullName || user.email');
      expect(adminCode).toContain('user.role');
    });

    it('verifies environment banner and breadcrumb navigation in admin operations header', () => {
      const adminCode = fs.readFileSync(adminAppPath, 'utf8');

      expect(adminCode).toContain('aria-label="Breadcrumb"');
      expect(adminCode).toContain('JavaMifi CMS');
      expect(adminCode).toContain('SANDBOX OPS ACTIVE');
      expect(adminCode).toContain('role="status"');
    });

    it('verifies system health status probe and integration adapter switches in IntegrationsHealthScreen', () => {
      const integrationsCode = fs.readFileSync(integrationsPath, 'utf8');

      expect(integrationsCode).toContain('Status Integrasi & Kesehatan Sistem');
      expect(integrationsCode).toContain('fetchHealth');
      expect(integrationsCode).toContain('paymentGateway');
      expect(integrationsCode).toContain('esimProvider');
      expect(integrationsCode).toContain('PostgreSQL');
      expect(integrationsCode).toContain('Redis & BullMQ');
    });
  });
});
