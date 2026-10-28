import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P16 — Buttons, Forms, Fields, and Touch Targets', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const buttonPath = path.join(rootDir, 'packages/ui/src/primitives/Button.tsx');
  const loginPath = path.join(rootDir, 'apps/web/src/app/[locale]/login/page.tsx');
  const checkoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
  const idLocalePath = path.join(rootDir, 'apps/web/messages/id.json');
  const enLocalePath = path.join(rootDir, 'apps/web/messages/en.json');

  const buttonSource = fs.readFileSync(buttonPath, 'utf8');
  const loginSource = fs.readFileSync(loginPath, 'utf8');
  const checkoutSource = fs.readFileSync(checkoutPath, 'utf8');
  const idJson = JSON.parse(fs.readFileSync(idLocalePath, 'utf8'));
  const enJson = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));

  describe('WS01 to WS05: Button Primitives and Variants', () => {
    it('implements primary, secondary, outline, ghost, and danger variants using design tokens', () => {
      // Primary variant
      expect(buttonSource).toContain(
        'bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary border border-primary',
      );
      // Secondary variant
      expect(buttonSource).toContain(
        'bg-surface hover:bg-paper active:bg-surface text-primary border border-paper-edge',
      );
      // Outline variant
      expect(buttonSource).toContain(
        'bg-transparent hover:bg-paper active:bg-surface text-primary border border-paper-edge',
      );
      // Ghost variant
      expect(buttonSource).toContain(
        'bg-transparent hover:bg-paper active:bg-surface text-secondary hover:text-primary border border-transparent',
      );
      // Danger variant
      expect(buttonSource).toContain(
        'bg-danger hover:bg-danger text-on-error active:bg-danger border border-danger',
      );
    });

    it('WS12 & GEMINI.md: Enforces 48px minimum touch target across all button sizes', () => {
      expect(buttonSource).toContain("sm: 'min-h-12 h-12 px-4 text-xs'");
      expect(buttonSource).toContain("md: 'min-h-12 h-12 px-6 text-xs'");
      expect(buttonSource).toContain("lg: 'min-h-13 h-13 px-8 text-sm'");
    });

    it('WS04 & WS15: Handles loading and disabled states with accessibility attributes', () => {
      expect(buttonSource).toContain('aria-busy={isLoading}');
      expect(buttonSource).toContain('aria-disabled={isDisabled}');
      expect(buttonSource).toContain('disabled={isDisabled}');
      expect(buttonSource).toContain('motion-reduce:animate-none');
      expect(buttonSource).toContain('<span className="sr-only">Loading...</span>');
    });

    it('WS14: Defaults button type to button to prevent unintentional form submissions', () => {
      expect(buttonSource).toContain("type = 'button'");
    });

    it('GEMINI.md Hard Rules: Button contains zero forbidden patterns (no shadow, no backdrop-blur, no gradient, no arbitrary brackets)', () => {
      expect(buttonSource).not.toMatch(/shadow-/);
      expect(buttonSource).not.toMatch(/backdrop-blur/);
      expect(buttonSource).not.toMatch(/bg-gradient/);
      expect(buttonSource).not.toMatch(/-\[[^\]]+\]/);
    });
  });

  describe('WS06 to WS11 & WS16 to WS19: Login Form Accessibility & Keypads', () => {
    it('associates form labels with input fields via explicit htmlFor and id', () => {
      expect(loginSource).toContain('htmlFor="login-email"');
      expect(loginSource).toContain('id="login-email"');
      expect(loginSource).toContain('htmlFor="login-password"');
      expect(loginSource).toContain('id="login-password"');
      expect(loginSource).toContain('htmlFor="login-fullname"');
      expect(loginSource).toContain('id="login-fullname"');
      expect(loginSource).toContain('htmlFor="login-phone"');
      expect(loginSource).toContain('id="login-phone"');
    });

    it('WS09 & WS19: Configures appropriate autocomplete and inputMode attributes', () => {
      expect(loginSource).toContain('autoComplete="email"');
      expect(loginSource).toContain('inputMode="email"');
      expect(loginSource).toContain('current-password');
      expect(loginSource).toContain('autoComplete="name"');
      expect(loginSource).toContain('autoComplete="tel"');
      expect(loginSource).toContain('inputMode="tel"');
    });

    it('WS17: Supports accessible error and success announcements with role="alert"', () => {
      expect(loginSource).toContain('role="alert"');
      expect(loginSource).toContain('aria-live="polite"');
      expect(loginSource).toContain('aria-invalid');
    });

    it('GEMINI.md & WS12: Enforces minimum 48px touch targets on form inputs and uses Button primitive', () => {
      expect(loginSource).toContain('min-h-12');
      expect(loginSource).toContain('<Button');
      expect(loginSource).toContain('variant="primary"');
    });
  });

  describe('WS06 to WS15: Checkout Form Accessibility & Double Submit Prevention', () => {
    it('associates checkout form labels with inputs via htmlFor and id', () => {
      expect(checkoutSource).toContain('htmlFor="checkout-fullname"');
      expect(checkoutSource).toContain('id="checkout-fullname"');
      expect(checkoutSource).toContain('htmlFor="checkout-email"');
      expect(checkoutSource).toContain('id="checkout-email"');
      expect(checkoutSource).toContain('htmlFor="checkout-phone"');
      expect(checkoutSource).toContain('id="checkout-phone"');
      expect(checkoutSource).toContain('htmlFor="checkout-promo"');
      expect(checkoutSource).toContain('id="checkout-promo"');
    });

    it('configures checkout autocomplete, inputMode, and helper text links', () => {
      expect(checkoutSource).toContain('autoComplete="name"');
      expect(checkoutSource).toContain('autoComplete="email"');
      expect(checkoutSource).toContain('inputMode="email"');
      expect(checkoutSource).toContain('aria-describedby="checkout-email-help"');
      expect(checkoutSource).toContain('autoComplete="tel"');
      expect(checkoutSource).toContain('inputMode="tel"');
      expect(checkoutSource).toContain('aria-describedby="checkout-phone-help"');
    });

    it('WS15: Prevents double submit and manages loading state on checkout button', () => {
      expect(checkoutSource).toContain('isLoading={isSubmitting}');
      expect(checkoutSource).toContain('disabled={isSubmitting}');
      expect(checkoutSource).toContain('variant="primary"');
    });

    it('GEMINI.md Hard Rules: Checkout contains zero arbitrary Tailwind brackets or forbidden drop shadows', () => {
      expect(checkoutSource).not.toMatch(/shadow-/);
      expect(checkoutSource).not.toMatch(/backdrop-blur/);
      expect(checkoutSource).not.toMatch(/bg-gradient/);
      expect(checkoutSource).not.toMatch(/-\[[0-9]+px\]/);
    });
  });

  describe('i18n Parity: Checkout and Login Translations', () => {
    it('ensures checkout dictionary exists and has matching keys in ID and EN', () => {
      expect(idJson.checkout).toBeDefined();
      expect(enJson.checkout).toBeDefined();

      const requiredKeys = [
        'title',
        'subtitle',
        'contactInfo',
        'fullName',
        'email',
        'phone',
        'deliveryAddress',
        'promoCode',
        'applyPromo',
        'paymentMethod',
        'gatewayMockTitle',
        'gatewayMockDesc',
        'gatewayMidtransTitle',
        'gatewayMidtransDesc',
        'submitOrder',
        'processingOrder',
        'shippingHelp',
        'errorSummaryTitle',
        'promoActive',
        'promoInvalid',
      ];

      for (const key of requiredKeys) {
        expect(idJson.checkout[key], `Missing checkout.${key} in id.json`).toBeDefined();
        expect(enJson.checkout[key], `Missing checkout.${key} in en.json`).toBeDefined();
      }
    });

    it('ensures loginPage dictionary exists and has matching keys in ID and EN', () => {
      expect(idJson.loginPage).toBeDefined();
      expect(enJson.loginPage).toBeDefined();

      const requiredKeys = [
        'titleSignIn',
        'titleRegister',
        'subtitle',
        'tabSignIn',
        'tabRegister',
        'fullName',
        'phone',
        'email',
        'password',
        'submitSignIn',
        'submitRegister',
        'processing',
        'demoCredentialsTitle',
        'resetButton',
        'invalidCredentials',
      ];

      for (const key of requiredKeys) {
        expect(idJson.loginPage[key], `Missing loginPage.${key} in id.json`).toBeDefined();
        expect(enJson.loginPage[key], `Missing loginPage.${key} in en.json`).toBeDefined();
      }
    });
  });
});
