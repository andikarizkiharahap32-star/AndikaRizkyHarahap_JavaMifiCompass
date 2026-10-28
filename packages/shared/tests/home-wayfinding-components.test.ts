import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Home Page Wayfinding Architecture: TripBoardingPass & PerforatedReceiptChit Governance', () => {
  const pagePath = path.resolve(__dirname, '../../../apps/web/src/app/[locale]/page.tsx');
  const enPath = path.resolve(__dirname, '../../../apps/web/messages/en.json');
  const idPath = path.resolve(__dirname, '../../../apps/web/messages/id.json');
  const boardingPassComponentPath = path.resolve(
    __dirname,
    '../../../packages/ui/src/wayfinding/TripBoardingPass.tsx',
  );
  const receiptChitComponentPath = path.resolve(
    __dirname,
    '../../../packages/ui/src/wayfinding/PerforatedReceiptChit.tsx',
  );

  it('replaces generic presets and trust sections with TripBoardingPass and PerforatedReceiptChit', () => {
    const pageCode = fs.readFileSync(pagePath, 'utf8');

    // Asserts imports from packages/ui/src/wayfinding
    expect(pageCode).toContain('TripBoardingPass');
    expect(pageCode).toContain('PerforatedReceiptChit');
    expect(pageCode).toContain('packages/ui/src/wayfinding');

    // Asserts rendering of TripBoardingPass components
    expect(pageCode).toContain('<TripBoardingPass');
    expect(pageCode).toContain('orderNumber={preset.orderNumber}');
    expect(pageCode).toContain('destinations={[preset.destCode]}');
    expect(pageCode).toContain('headerMedia=');

    // Asserts rendering of PerforatedReceiptChit components
    expect(pageCode).toContain('<PerforatedReceiptChit');
    expect(pageCode).toContain('orderNumber="JMC-TRP-001"');
    expect(pageCode).toContain('orderNumber="JMC-TRP-002"');
    expect(pageCode).toContain('orderNumber="JMC-TRP-003"');
    expect(pageCode).toContain('isDepositRefundable={true}');
  });

  it('verifies 100% bilingual i18n coverage for boardingPasses and receiptChits dictionaries', () => {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

    // Boarding passes dictionaries
    expect(en.home.boardingPasses).toBeDefined();
    expect(id.home.boardingPasses).toBeDefined();
    expect(en.home.boardingPasses.activeStatus).toBe('TICKET READY FOR ACTIVATION');
    expect(id.home.boardingPasses.activeStatus).toBe('TIKET SIAP AKTIVASI');
    expect(en.home.boardingPasses.offlineReady).toBe('● Offline Mode Ready');
    expect(id.home.boardingPasses.offlineReady).toBe('● Mode Offline Aktif');

    // Receipt chits dictionaries
    expect(en.home.receiptChits).toBeDefined();
    expect(id.home.receiptChits).toBeDefined();
    expect(en.home.receiptChits.durationLabel).toBe('Duration');
    expect(id.home.receiptChits.durationLabel).toBe('Durasi');
    expect(en.home.receiptChits.totalPaymentLabel).toBe('Total Breakdown');
    expect(id.home.receiptChits.totalPaymentLabel).toBe('Total Pembayaran');

    // Trust chits metadata
    expect(en.home.trust.chits.chit1.productName).toBe('Mathematical Recommendation Audit');
    expect(id.home.trust.chits.chit1.productName).toBe('Audit Rekomendasi Matematis');
    expect(en.home.trust.chits.chit3.guaranteeTitle).toBe('Automated Escrow Refund:');
    expect(id.home.trust.chits.chit3.guaranteeTitle).toBe('Jaminan Pengembalian Dana 1×24 Jam:');
  });

  it('enforces strict design token compliance, tabular figures, and minimum 48px touch targets', () => {
    const pageCode = fs.readFileSync(pagePath, 'utf8');
    const boardingPassCode = fs.readFileSync(boardingPassComponentPath, 'utf8');
    const receiptChitCode = fs.readFileSync(receiptChitComponentPath, 'utf8');

    // Tabular numbers enforced across all components
    expect(pageCode).toContain('tnum');
    expect(boardingPassCode).toContain('tnum');
    expect(receiptChitCode).toContain('tnum');

    // Minimum 48px interactive touch targets (min-h-12)
    expect(pageCode).toContain('min-h-12');
    expect(boardingPassCode).toContain('min-h-12');
    expect(receiptChitCode).toContain('min-h-12');

    // Zero forbidden patterns
    expect(pageCode).not.toContain('shadow-');
    expect(pageCode).not.toContain('backdrop-blur');
    expect(pageCode).not.toContain('bg-gradient');
    expect(pageCode).not.toMatch(/\[(#[0-9a-fA-F]{3,8}|\d+px|\d+rem)\]/);

    expect(boardingPassCode).not.toContain('shadow-');
    expect(boardingPassCode).not.toContain('backdrop-blur');
    expect(boardingPassCode).not.toContain('bg-gradient');
    expect(boardingPassCode).not.toMatch(/\[(#[0-9a-fA-F]{3,8}|\d+px|\d+rem)\]/);

    expect(receiptChitCode).not.toContain('shadow-');
    expect(receiptChitCode).not.toContain('backdrop-blur');
    expect(receiptChitCode).not.toContain('bg-gradient');
    expect(receiptChitCode).not.toMatch(/\[(#[0-9a-fA-F]{3,8}|\d+px|\d+rem)\]/);
  });
});
