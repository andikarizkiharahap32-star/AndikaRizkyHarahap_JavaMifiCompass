import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P08 — Cards, Tactile Surfaces, and Content Density', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const cardPath = path.join(rootDir, 'packages/ui/src/primitives/Card.tsx');
  const restaurantCardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
  const boardingPassPath = path.join(rootDir, 'packages/ui/src/wayfinding/TripBoardingPass.tsx');
  const receiptChitPath = path.join(
    rootDir,
    'packages/ui/src/wayfinding/PerforatedReceiptChit.tsx',
  );

  const cardSource = fs.readFileSync(cardPath, 'utf8');
  const restaurantCardSource = fs.readFileSync(restaurantCardPath, 'utf8');
  const boardingPassSource = fs.readFileSync(boardingPassPath, 'utf8');
  const receiptChitSource = fs.readFileSync(receiptChitPath, 'utf8');

  it('P08-WS01 & WS02: Card Primitives and Tactile Lower Lip Borders', () => {
    // Card supports tactile variant definitions
    expect(cardSource).toContain(
      "card: 'bg-paper border border-paper-edge border-b-2 text-primary'",
    );
    expect(cardSource).toContain("flat: 'bg-paper border border-paper-edge text-primary'");
    expect(cardSource).toContain(
      "raised: 'bg-paper border border-paper-edge border-b-4 text-primary'",
    );
    expect(cardSource).toContain("sunken: 'bg-sunken border border-paper-edge text-primary'");

    // Lower lip tactile borders
    expect(cardSource).toContain('border-b-2');
    expect(cardSource).toContain('border-b-4');
  });

  it('P08-WS03 & WS04: Card Radius and Content Padding Density Scales', () => {
    // Density padding scales
    expect(cardSource).toContain("compact: 'p-4'");
    expect(cardSource).toContain("normal: 'p-6'");
    expect(cardSource).toContain("spacious: 'p-8'");

    // Radius scale definitions
    expect(cardSource).toContain("none: 'rounded-none'");
    expect(cardSource).toContain("sm: 'rounded-sm'");
    expect(cardSource).toContain("md: 'rounded-md'");
    expect(cardSource).toContain("lg: 'rounded-lg'");
    expect(cardSource).toContain("xl: 'rounded-xl'");
    expect(cardSource).toContain("'2xl': 'rounded-2xl'");
  });

  it('P08-WS05, WS06, WS07: Interactive Card Semantics, Hover & Pressed Affordances', () => {
    // Interactive classes definition
    expect(cardSource).toContain('cursor-pointer hover:border-primary');
    expect(cardSource).toContain('active:translate-y-0 active:bg-sunken');
    expect(cardSource).toContain('motion-safe:hover:-translate-y-1');
    expect(cardSource).toContain('motion-reduce:transform-none');
    expect(cardSource).toContain('focus-visible:ring-primary');
    expect(cardSource).toContain('focus-visible:ring-2');
    expect(cardSource).toContain('focus-visible:outline-none');

    // Accessibility attributes in interactive mode
    expect(cardSource).toContain("role={isInteractive && !role ? 'button' : role}");
    expect(cardSource).toContain(
      'tabIndex={isInteractive && tabIndex === undefined ? 0 : tabIndex}',
    );
    expect(cardSource).toContain("e.key === 'Enter' || e.key === ' '");
  });

  it('P08-WS08: Disabled Card State Handling', () => {
    expect(cardSource).toContain(
      "disabledClasses = 'opacity-60 cursor-not-allowed pointer-events-none'",
    );
    expect(cardSource).toContain('aria-disabled={disabled ? true : undefined}');
  });

  it('P08-WS11: Dining RestaurantCard Tactile Lower Lip & Accessible Focus', () => {
    // 2px lower lip border
    expect(restaurantCardSource).toContain('border border-paper-edge border-b-2');
    expect(restaurantCardSource).toContain('bg-paper');

    // Visible focus ring on interactive card
    expect(restaurantCardSource).toContain('focus-visible:ring-primary');
    expect(restaurantCardSource).toContain('focus-visible:ring-2');
    expect(restaurantCardSource).toContain('focus-visible:outline-none');

    // Touch targets for actions
    expect(restaurantCardSource).toContain('h-12');
  });

  it('P08-WS13 & WS16: Boarding Pass & Receipt Chit Surfaces with Zero Shadow Drift', () => {
    // Wayfinding cards use tactile border-b-2
    expect(boardingPassSource).toContain('border-b-2');
    expect(boardingPassSource).toContain('bg-paper');
    expect(receiptChitSource).toContain('border-b-2');
    expect(receiptChitSource).toContain('bg-paper');

    // Zero drop shadows across all card primitives
    expect(cardSource).not.toContain('shadow-');
    expect(restaurantCardSource).not.toContain('shadow-');
    expect(boardingPassSource).not.toContain('shadow-');
    expect(receiptChitSource).not.toContain('shadow-');
  });

  it('P08-WS21 & WS22: Badge Token Semantics and Zero Non-Token Color Literals', () => {
    // Badge uses design tokens
    expect(cardSource).toContain('bg-sunken text-primary border border-paper-edge');
    expect(cardSource).toContain('bg-success-surface text-success');
    expect(cardSource).toContain('bg-warning-surface text-warning');
    expect(cardSource).toContain('bg-danger-surface text-danger');
    expect(cardSource).toContain('bg-primary-container text-on-primary');

    // No raw non-token Tailwind colors
    expect(cardSource).not.toMatch(/\bslate-\d+/);
    expect(cardSource).not.toMatch(/\bemerald-\d+/);
    expect(cardSource).not.toMatch(/\bamber-\d+/);
    expect(cardSource).not.toMatch(/\brose-\d+/);
    expect(cardSource).not.toMatch(/\bsky-\d+/);
  });
});
