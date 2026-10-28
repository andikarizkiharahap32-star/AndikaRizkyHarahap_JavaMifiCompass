import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TIER_DEFINITIONS } from '../src';

describe('P21 — Indonesian & English Localization Governance', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');
  const i18nConfigPath = path.join(rootDir, 'apps/web/src/i18n.ts');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const destinationsPath = path.join(rootDir, 'apps/web/src/app/[locale]/destinations/page.tsx');
  const faqAccordionPath = path.join(
    rootDir,
    'apps/web/src/components/FaqInteractiveAccordion.tsx',
  );

  const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
  const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

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

  it('P21-WS01 & WS17: guarantees 100% dictionary key parity between id.json and en.json', () => {
    const idKeys = new Set(getAllKeys(id));
    const enKeys = new Set(getAllKeys(en));

    const missingInEn = [...idKeys].filter((k) => !enKeys.has(k));
    const missingInId = [...enKeys].filter((k) => !idKeys.has(k));

    expect(
      missingInEn,
      `Keys present in id.json but missing in en.json: ${missingInEn.join(', ')}`,
    ).toEqual([]);
    expect(
      missingInId,
      `Keys present in en.json but missing in id.json: ${missingInId.join(', ')}`,
    ).toEqual([]);
    expect(idKeys.size).toBeGreaterThan(500);
    expect(idKeys.size).toBe(enKeys.size);

    // Verify no string is empty or undefined
    for (const key of idKeys) {
      const getVal = (dict: any, pathStr: string) =>
        pathStr.split('.').reduce((acc, part) => acc?.[part], dict);

      const idVal = getVal(id, key);
      const enVal = getVal(en, key);

      expect(typeof idVal, `id.json key ${key} must be a string`).toBe('string');
      expect(typeof enVal, `en.json key ${key} must be a string`).toBe('string');
      expect(idVal.trim().length, `id.json key ${key} must not be empty`).toBeGreaterThan(0);
      expect(enVal.trim().length, `en.json key ${key} must not be empty`).toBeGreaterThan(0);
    }
  });

  it('P21-WS02: enforces complete localized navbar strings & accessibility keys', () => {
    const requiredNavKeys = [
      'skipToContent',
      'mainNav',
      'mobileNav',
      'quickAccess',
      'languageId',
      'languageEn',
      'brandHomeAria',
      'themeLight',
      'themeNight',
      'openMenu',
      'closeMenu',
    ];

    for (const key of requiredNavKeys) {
      expect(id.nav[key], `Missing id.nav.${key}`).toBeDefined();
      expect(en.nav[key], `Missing en.nav.${key}`).toBeDefined();
    }

    // Verify Navbar.tsx uses next-intl useTranslations('nav') for bypass skip link
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');
    expect(navbarCode).toContain("t('skipToContent')");
    expect(navbarCode).not.toContain("currentLocale === 'id' ? 'Lewati ke konten utama'");
  });

  it('P21-WS03: verifies FAQ taxonomy and fallback parity across ID and EN', () => {
    expect(id.faqPage.meta.title).toBeTruthy();
    expect(en.faqPage.meta.title).toBeTruthy();
    expect(id.faqPage.meta.description).toBeTruthy();
    expect(en.faqPage.meta.description).toBeTruthy();

    const faqAccordionCode = fs.readFileSync(faqAccordionPath, 'utf8');
    // Ensure fallback items define both questionId/answerId and questionEn/answerEn
    expect(faqAccordionCode).toContain('questionId:');
    expect(faqAccordionCode).toContain('questionEn:');
    expect(faqAccordionCode).toContain('answerId:');
    expect(faqAccordionCode).toContain('answerEn:');
  });

  it('P21-WS04: verifies halal dining tier translations match deterministic TIER_DEFINITIONS', () => {
    const requiredTiers = ['certified', 'claimed', 'options', 'notHalal', 'unknown'];

    for (const tier of requiredTiers) {
      expect(id.dining.tier[tier]).toBeTruthy();
      expect(en.dining.tier[tier]).toBeTruthy();
    }

    // Verify claimed and unknown tier compliance with security fail-closed rules
    expect(id.dining.tier.claimed).toBe(TIER_DEFINITIONS.CLAIMED.labelId);
    expect(en.dining.tier.claimed).toBe(TIER_DEFINITIONS.CLAIMED.labelEn);
    expect(id.dining.tier.unknown).toBe(TIER_DEFINITIONS.UNKNOWN.labelId);
    expect(en.dining.tier.unknown).toBe(TIER_DEFINITIONS.UNKNOWN.labelEn);
  });

  it('P21-WS05: enforces consistent currency terminology and IDR reference notes', () => {
    expect(id.nav.topbar.currencyContext).toContain('IDR');
    expect(en.nav.topbar.currencyContext).toContain('IDR');
    expect(id.hero.currencyLabel).toBe('Valuta Lokal');
    expect(en.hero.currencyLabel).toBe('Currency');
    expect(id.hero.netDailyRate).toBe('Tarif Bersih Per Hari');
    expect(en.hero.netDailyRate).toBe('Net Daily Rate');
  });

  it('P21-WS06, WS07 & WS16: verifies i18n configuration with fallback locale, timezone, and formats', () => {
    const i18nCode = fs.readFileSync(i18nConfigPath, 'utf8');

    expect(i18nCode).toContain("locales = ['id', 'en']");
    expect(i18nCode).toContain("defaultLocale: Locale = 'id'");
    expect(i18nCode).toContain("timeZone: 'Asia/Jakarta'");
    expect(i18nCode).toContain('dateTime:');
    expect(i18nCode).toContain('number:');
    expect(i18nCode).toContain('currency:');
  });

  it('P21-WS09: verifies bilingual country aliases and destination taxonomy', () => {
    const coreCodes = [
      'JP',
      'CN',
      'SA',
      'SG',
      'MY',
      'TH',
      'KR',
      'GB',
      'FR',
      'DE',
      'US',
      'TR',
      'AE',
    ];

    for (const code of coreCodes) {
      expect(id.countries[code], `Missing id.countries.${code}`).toBeTruthy();
      expect(en.countries[code], `Missing en.countries.${code}`).toBeTruthy();
    }

    // Specific country names in ID and EN
    expect(id.countries.JP).toBe('Jepang');
    expect(en.countries.JP).toBe('Japan');
    expect(id.countries.SA).toBe('Arab Saudi');
    expect(en.countries.SA).toBe('Saudi Arabia');
    expect(id.countries.SG).toBe('Singapura');
    expect(en.countries.SG).toBe('Singapore');

    // Destinations page uses translated country lookup
    const destCode = fs.readFileSync(destinationsPath, 'utf8');
    expect(destCode).toContain("getTranslations('countries')");
    expect(destCode).not.toContain("name: 'Jepang (Japan)'");
  });

  it('P21-WS11: verifies form validation messages coverage in both locales', () => {
    const requiredValidation = [
      'required',
      'emailInvalid',
      'phoneInvalid',
      'passwordMin',
      'dateRangeInvalid',
      'destinationRequired',
    ];

    for (const field of requiredValidation) {
      expect(id.validation[field], `Missing id.validation.${field}`).toBeTruthy();
      expect(en.validation[field], `Missing en.validation.${field}`).toBeTruthy();
    }
  });

  it('P21-WS14: verifies untranslatable tokens are preserved across languages', () => {
    const preservedTokens = ['JavaMifi', 'Compass', 'Pocket WiFi', 'eSIM', '#AntiSusahSinyal'];

    for (const token of preservedTokens) {
      const inId = JSON.stringify(id).includes(token);
      const inEn = JSON.stringify(en).includes(token);
      expect(inId, `id.json should preserve token "${token}"`).toBe(true);
      expect(inEn, `en.json should preserve token "${token}"`).toBe(true);
    }
  });
});
