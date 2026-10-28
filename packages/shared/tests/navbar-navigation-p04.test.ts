import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Navbar, Mobile Navigation, and Wayfinding (P04)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');

  it('contains complete i18n keys for all navigation actions and items in EN and ID', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    const requiredKeys = [
      'planner',
      'destinations',
      'dining',
      'products',
      'support',
      'faq',
      'cart',
      'account',
      'newBadge',
      'themeLight',
      'themeNight',
      'openMenu',
      'closeMenu',
      'tagline',
    ];

    for (const key of requiredKeys) {
      expect(en.nav[key], `Missing en.nav.${key}`).toBeDefined();
      expect(id.nav[key], `Missing id.nav.${key}`).toBeDefined();
    }
  });

  it('implements logo lockup linking to root with transit wayfinding styling', () => {
    const content = fs.readFileSync(navbarPath, 'utf8');

    expect(content).toContain('href={`/${currentLocale}`}');
    expect(content).toContain('aria-label="JavaMifi Compass Home"');
    expect(content).toContain('COMPASS');
    expect(content).toContain("t('tagline')");
  });

  it('enforces active route marker and accessible aria-current on desktop links', () => {
    const content = fs.readFileSync(navbarPath, 'utf8');

    expect(content).toContain("aria-current={active ? 'page' : undefined}");
    expect(content).toContain('border-primary text-primary font-black');
    expect(content).toContain('border-transparent text-secondary');
  });

  it('implements mobile navigation drawer with accessible toggle and zero backdrop-blur', () => {
    const content = fs.readFileSync(navbarPath, 'utf8');

    // Mobile menu toggle
    expect(content).toContain('md:hidden');
    expect(content).toContain("aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}");
    expect(content).toContain('aria-expanded={mobileMenuOpen}');

    // Keyboard Escape listener
    expect(content).toContain("e.key === 'Escape'");

    // Drawer container & scrim (zero backdrop-blur per GEMINI.md hard rules)
    expect(content).toContain('z-drawer bg-scrim');
    expect(content).not.toContain('backdrop-blur');

    // Mobile drawer navigation items
    expect(content).toContain('onClick={() => setMobileMenuOpen(false)}');
  });

  it('enforces 48px touch targets and sticky header tokens with zero drop shadows', () => {
    const content = fs.readFileSync(navbarPath, 'utf8');

    // Touch targets >= 48px
    expect(content).toContain('min-h-12 min-w-12');
    expect(content).toContain('h-16');

    // Sticky header tokens
    expect(content).toContain('sticky top-0 z-sticky bg-paper border-b border-paper-edge');

    // Zero drop shadows
    expect(content).not.toContain('shadow-');
  });
});
