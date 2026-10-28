import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Content Semantics & Internationalization (i18n) Governance', () => {
  const homeDocPath = path.resolve(
    __dirname,
    '../../../design-system/pages/home.md'
  );
  const homePagePath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/[locale]/page.tsx'
  );
  const heroComponentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/DepartureBoardHero.tsx'
  );
  const enMessagesPath = path.resolve(
    __dirname,
    '../../../apps/web/messages/en.json'
  );
  const idMessagesPath = path.resolve(
    __dirname,
    '../../../apps/web/messages/id.json'
  );

  it('documents content semantics and rejection of abstract art in design-system/pages/home.md', () => {
    expect(fs.existsSync(homeDocPath)).toBe(true);
    const content = fs.readFileSync(homeDocPath, 'utf8');

    // Abstract art and sci-fi titles explicitly rejected
    expect(content).toContain('Rejection of Abstract Art & Irrelevant Content');
    expect(content).toContain('Chroma I');
    expect(content).toContain('Nebula VI');
    expect(content).toContain('Zero Hard-Coded Copy (Mandatory EN/ID i18n Keys)');
  });

  it('ensures Home page and DepartureBoardHero contain zero abstract art titles or unvetted CDNs', () => {
    const pageSource = fs.readFileSync(homePagePath, 'utf8');
    const heroSource = fs.readFileSync(heroComponentPath, 'utf8');
    const combined = pageSource + '\n' + heroSource;

    // Zero abstract art titles
    expect(combined).not.toContain('Chroma I');
    expect(combined).not.toContain('Nebula VI');
    expect(combined).not.toContain('Prism III');
    expect(combined).not.toContain('Quantum V');
    expect(combined).not.toContain('Aether IX');

    // Zero unvetted 21st.dev CDN images
    expect(combined).not.toContain('cdn.21st.dev');
    expect(combined).not.toContain('Warp Drive');
    expect(combined).not.toContain('Into the Ether');
  });

  it('verifies that all home and hero copy resolves through bilingual i18n dictionary keys', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    // Check home preset keys in both languages
    const presetKeys = ['umrah', 'japan', 'china', 'europe'];
    for (const key of presetKeys) {
      expect(en.home.presets[key]).toBeDefined();
      expect(id.home.presets[key]).toBeDefined();

      expect(en.home.presets[key].title).toBeTruthy();
      expect(id.home.presets[key].title).toBeTruthy();
      expect(en.home.presets[key].desc).toBeTruthy();
      expect(id.home.presets[key].desc).toBeTruthy();
    }

    // Check hero keys in both languages
    expect(en.hero.title).toBeTruthy();
    expect(id.hero.title).toBeTruthy();
    expect(en.hero.subtitle).toBeTruthy();
    expect(id.hero.subtitle).toBeTruthy();
    expect(en.hero.ctaPlanner).toBeTruthy();
    expect(id.hero.ctaPlanner).toBeTruthy();
  });
});
