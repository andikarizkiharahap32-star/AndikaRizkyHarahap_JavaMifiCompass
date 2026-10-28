import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Complete i18n Dictionary Coverage & Zero-Inline String Governance', () => {
  const heroComponentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/DepartureBoardHero.tsx',
  );
  const homePagePath = path.resolve(__dirname, '../../../apps/web/src/app/[locale]/page.tsx');
  const enMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/en.json');
  const idMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/id.json');

  it('DepartureBoardHero contains zero inline language ternaries and uses useTranslations', () => {
    const heroCode = fs.readFileSync(heroComponentPath, 'utf8');

    // Asserts zero inline ternary language branching
    expect(heroCode).not.toContain('isId ?');
    expect(heroCode).not.toContain("locale === 'id'");

    // Asserts next-intl hook usage
    expect(heroCode).toContain("useTranslations('hero')");
    expect(heroCode).toContain("t('terminalBadge')");
    expect(heroCode).toContain("t('stationsLabel')");
    expect(heroCode).toContain("t('paxLabel')");
    expect(heroCode).toContain("t('durationLabel')");
  });

  it('enforces complete matching hero keys across en.json and id.json', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    const requiredHeroKeys = [
      'terminalBadge',
      'title',
      'subtitle',
      'ctaPlanner',
      'ctaDestinations',
      'stationsLabel',
      'stationsSub',
      'paxLabel',
      'durationLabel',
      'speedLabel',
      'socketLabel',
      'currencyLabel',
      'netDailyRate',
      'splitDailyRate',
      'perDay',
      'soloBadge',
      'groupBadge',
      'standardTransit',
      'trackNotice',
    ];

    for (const key of requiredHeroKeys) {
      expect(en.hero[key]).toBeDefined();
      expect(id.hero[key]).toBeDefined();
      expect(typeof en.hero[key]).toBe('string');
      expect(typeof id.hero[key]).toBe('string');
      expect(en.hero[key].length).toBeGreaterThan(0);
      expect(id.hero[key].length).toBeGreaterThan(0);
    }

    // Hubs coverage
    const hubIds = ['JP', 'SA', 'GB', 'SG', 'CN'];
    for (const hubId of hubIds) {
      expect(en.hero.hubs[hubId].name).toBeTruthy();
      expect(id.hero.hubs[hubId].name).toBeTruthy();
      expect(en.hero.hubs[hubId].status).toBeTruthy();
      expect(id.hero.hubs[hubId].status).toBeTruthy();
      expect(en.hero.hubs[hubId].speed).toBeTruthy();
      expect(id.hero.hubs[hubId].speed).toBeTruthy();
      expect(en.hero.hubs[hubId].socket).toBeTruthy();
      expect(id.hero.hubs[hubId].socket).toBeTruthy();
    }
  });

  it('home metadata is fully localized via home.meta dictionary keys', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    expect(en.home.meta.title).toBeTruthy();
    expect(id.home.meta.title).toBeTruthy();
    expect(en.home.meta.description).toBeTruthy();
    expect(id.home.meta.description).toBeTruthy();

    const pageCode = fs.readFileSync(homePagePath, 'utf8');
    expect(pageCode).toContain("namespace: 'home.meta'");
  });
});
