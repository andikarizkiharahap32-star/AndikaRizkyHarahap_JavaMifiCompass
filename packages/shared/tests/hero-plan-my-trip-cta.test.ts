import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('DepartureBoardHero "Plan my trip" CTA Verification', () => {
  const heroComponentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/DepartureBoardHero.tsx',
  );
  const enMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/en.json');
  const idMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/id.json');

  it('renders a visible "Plan my trip" CTA that routes to /planner', () => {
    const heroCode = fs.readFileSync(heroComponentPath, 'utf8');

    // Asserts exact visible button label
    expect(heroCode).toContain('Plan my trip');
    expect(heroCode).toContain('Rencanakan Perjalanan Saya');

    // Asserts primary link targets the planner route
    expect(heroCode).toMatch(/href=\{`\/\$\{locale\}\/planner\?/);
  });

  it('declares "Plan my trip" and "Rencanakan Perjalanan Saya" in i18n dictionaries', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    expect(en.hero.ctaPlanner).toBe('Plan my trip');
    expect(id.hero.ctaPlanner).toBe('Rencanakan Perjalanan Saya');
  });

  it('ensures the CTA button is styled as a prominent primary target with minimum 48px touch area', () => {
    const heroCode = fs.readFileSync(heroComponentPath, 'utf8');

    // Prominent primary token styling and >=48px touch target
    expect(heroCode).toContain('bg-primary');
    expect(heroCode).toContain('text-on-primary');
    expect(heroCode).toContain('min-h-12');
    expect(heroCode).toContain('focus-visible:ring-primary');
  });
});
