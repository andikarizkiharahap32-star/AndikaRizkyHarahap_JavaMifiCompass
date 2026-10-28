import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Topbar Context and Utility Strip (P05)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const readinessPath = path.join(rootDir, 'apps/web/src/components/DestinationReadinessCard.tsx');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');

  it('contains complete i18n keys for topbar context and telemetry in EN and ID', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    const requiredKeys = [
      'telemetryLabel',
      'terminalNotice',
      'connectivityMode',
      'currencyContext',
      'diningMode',
      'dismiss',
    ];

    for (const key of requiredKeys) {
      expect(en.nav.topbar[key], `Missing en.nav.topbar.${key}`).toBeDefined();
      expect(id.nav.topbar[key], `Missing id.nav.topbar.${key}`).toBeDefined();
    }
  });

  it('renders topbar telemetry strip with destination, currency, dining, and dismiss behavior', () => {
    const content = fs.readFileSync(navbarPath, 'utf8');

    // Telemetry accessibility
    expect(content).toContain('role="status"');
    expect(content).toContain("aria-label={t('topbar.telemetryLabel')}");

    // Context tokens
    expect(content).toContain("t('topbar.terminalNotice')");
    expect(content).toContain("t('topbar.connectivityMode')");
    expect(content).toContain("t('topbar.currencyContext')");
    expect(content).toContain("t('topbar.diningMode')");

    // Dismiss persistence
    expect(content).toContain('topbarDismissed');
    expect(content).toContain("localStorage.getItem('javamifi-topbar-dismissed')");
    expect(content).toContain("localStorage.setItem('javamifi-topbar-dismissed', 'true')");

    // Mobile compression classes
    expect(content).toContain('hidden sm:inline');
    expect(content).toContain('hidden md:inline');
    expect(content).toContain('hidden lg:inline');
  });

  it('verifies DestinationReadinessCard enforces design tokens and semantic dining colorways', () => {
    const content = fs.readFileSync(readinessPath, 'utf8');

    // Tactile paper materials without arbitrary slate backgrounds
    expect(content).toContain('bg-paper border border-paper-edge border-b-2 rounded');
    expect(content).not.toContain('bg-white dark:bg-slate-900');

    // Semantic dining tokens (isolated line-dining Jade, never arbitrary success/emerald)
    expect(content).toContain('bg-line-dining');
    expect(content).toContain('text-line-dining');

    // Tabular numbers on currency and metrics
    expect(content).toContain('tnum');
  });
});
