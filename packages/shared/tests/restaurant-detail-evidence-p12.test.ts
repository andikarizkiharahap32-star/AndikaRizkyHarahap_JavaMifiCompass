import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P12 — Restaurant Details and Evidence Drawer', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const detailModalPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantDetailModal.tsx');
  const restaurantCardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
  const menuTicketPath = path.join(rootDir, 'packages/ui/src/dining/MenuTicketChit.tsx');
  const taxiCardPath = path.join(rootDir, 'packages/ui/src/dining/TaxiAddressCard.tsx');

  const detailModalSource = fs.readFileSync(detailModalPath, 'utf8');
  const restaurantCardSource = fs.readFileSync(restaurantCardPath, 'utf8');
  const menuTicketSource = fs.readFileSync(menuTicketPath, 'utf8');
  const taxiCardSource = fs.readFileSync(taxiCardPath, 'utf8');

  it('P12-WS01: Modal Structure & Dialog Accessibility Semantics', () => {
    // Accessible modal dialog attributes
    expect(detailModalSource).toContain('role="dialog"');
    expect(detailModalSource).toContain('aria-modal="true"');
    expect(detailModalSource).toContain('aria-labelledby="restaurant-detail-title"');
    expect(detailModalSource).toContain('id="restaurant-detail-title"');

    // Close button has accessible label
    expect(detailModalSource).toContain('aria-label="Tutup dialog rincian restoran"');
    expect(detailModalSource).toContain('w-12 h-12');
  });

  it('P12-WS16 & WS17: Modal Focus Trap, ESC Dismissal & Body Scroll Lock', () => {
    // Scroll Lock on mount and unmount cleanup
    expect(detailModalSource).toContain("document.body.style.overflow = 'hidden'");
    expect(detailModalSource).toContain('document.body.style.overflow = originalOverflow');

    // ESC Key listener
    expect(detailModalSource).toContain("e.key === 'Escape'");
    expect(detailModalSource).toContain("window.addEventListener('keydown', handleKeyDown)");
    expect(detailModalSource).toContain("window.removeEventListener('keydown', handleKeyDown)");

    // Focus Trap on Tab & Shift+Tab
    expect(detailModalSource).toContain("e.key !== 'Tab'");
    expect(detailModalSource).toContain('e.shiftKey');
    expect(detailModalSource).toContain('firstEl.focus()');
    expect(detailModalSource).toContain('lastEl.focus()');
  });

  it('P12-WS11: Phone Action with Standard tel: URI and 48px Target', () => {
    // Accessible phone dial action with tel: URI
    expect(detailModalSource).toContain('href={`tel:${place.phone.replace(/\\s+/g, \'\')}`}');
    expect(detailModalSource).toContain('min-h-12 h-12');
    expect(detailModalSource).toContain('font-mono tnum');
  });

  it('P12-WS12: Navigation Action Linking to Google Maps with 48px Target', () => {
    // Navigation action with Google Maps URL
    expect(detailModalSource).toContain('https://www.google.com/maps/search/?api=1&query=');
    expect(detailModalSource).toContain('target="_blank"');
    expect(detailModalSource).toContain('rel="noopener noreferrer"');
    expect(detailModalSource).toContain('min-h-12 h-12');
  });

  it('P12-WS20: Save/Share Details Action with Clipboard Integration', () => {
    // Clipboard copy action with summary lines
    expect(detailModalSource).toContain('navigator.clipboard.writeText');
    expect(detailModalSource).toContain('handleShareDetails');
    expect(detailModalSource).toContain('copiedDetails');
    expect(detailModalSource).toContain('min-h-12 h-12');
  });

  it('P12-WS02 & WS03: Wayfinding Coordinates, Plus Code, Postal Code & Script Aliases', () => {
    // Latitude and longitude rendered with 6 decimal places and tabular numerics
    expect(detailModalSource).toContain('place.latitude.toFixed(6)');
    expect(detailModalSource).toContain('place.longitude.toFixed(6)');
    expect(detailModalSource).toContain('plusCode');
    expect(detailModalSource).toContain('postalCode');
    expect(detailModalSource).toContain('addressLocalScript');
    expect(detailModalSource).toContain('tnum');
  });

  it('P12-WS04: Opening Hours Source Provenance', () => {
    // Labeled source provenance for opening hours
    expect(detailModalSource).toContain('Google Places API');
    expect(detailModalSource).toContain('place.openingHours');
    expect(detailModalSource).toContain('tnum');
  });

  it('P12-WS07, WS08 & WS19: Safe Verbatim Quotes, Source Citations & Stale Data Indicator', () => {
    // Plain text quotes without markdown or dangerous HTML
    expect(detailModalSource).toContain('ev.quoteText');
    expect(detailModalSource).toContain('ev.attributionNotice');
    expect(detailModalSource).toContain('ev.retrievedAt');
    expect(detailModalSource).not.toContain('dangerouslySetInnerHTML');

    // Freshness & Last Verified Date
    expect(detailModalSource).toContain('place.lastVerifiedDate');
    expect(detailModalSource).toContain('place.certExpiresAt');
  });

  it('P12-WS05 & WS14: Menu Ticket Chit with Categorized Dual-Price & AI Separation', () => {
    // Venue description separated from AI explanation
    expect(menuTicketSource).toContain('sourceDescription');
    expect(menuTicketSource).toContain('explainerId');
    expect(menuTicketSource).toContain('DualPrice');

    // Tabular numerals for dual currency
    expect(menuTicketSource).toContain('amountMinor');
    expect(menuTicketSource).toContain('amountIdr');
  });

  it('P12-WS31 & WS32: 48px Minimum Interactive Touch Target House Rule', () => {
    // Touch targets in RestaurantDetailModal
    expect(detailModalSource).toContain('w-12 h-12');
    expect(detailModalSource).toContain('min-h-12 h-12');

    // Touch targets in RestaurantCard
    expect(restaurantCardSource).toContain('min-h-12 h-12 px-3');

    // Touch targets in TaxiAddressCard
    expect(taxiCardSource).toContain('min-h-12 w-12 h-12');
    expect(taxiCardSource).toContain('min-h-12 w-full h-12');
  });

  it('P12-WS21, WS24 & WS25: Zero Arbitrary Literals, Zero Drop Shadows, Zero Gradients', () => {
    // No arbitrary bracket values in all 4 components
    expect(detailModalSource).not.toMatch(/-\[\s*[^\]]+\s*\]/);
    expect(restaurantCardSource).not.toMatch(/-\[\s*[^\]]+\s*\]/);
    expect(menuTicketSource).not.toMatch(/-\[\s*[^\]]+\s*\]/);
    expect(taxiCardSource).not.toMatch(/-\[\s*[^\]]+\s*\]/);

    // No forbidden patterns
    expect(detailModalSource).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/);
    expect(detailModalSource).not.toMatch(/\bbackdrop-blur\b/);
    expect(detailModalSource).not.toMatch(/\bbg-gradient\b/);

    expect(restaurantCardSource).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/);
    expect(restaurantCardSource).not.toMatch(/\bbackdrop-blur\b/);
    expect(restaurantCardSource).not.toMatch(/\bbg-gradient\b/);

    expect(menuTicketSource).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/);
    expect(taxiCardSource).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/);
  });
});
