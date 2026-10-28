import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Security Audit & Quality Remediation Governance', () => {
  const navbarPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/Navbar.tsx'
  );
  const mockAdapterPath = path.resolve(
    __dirname,
    '../../../apps/api/src/modules/payments/adapters/mock-gateway.adapter.ts'
  );
  const automationDocPath = path.resolve(
    __dirname,
    '../../../docs/AUTOMATION.md'
  );
  const readmePath = path.resolve(__dirname, '../../../README.md');
  const n8nDir = path.resolve(__dirname, '../../../automation/n8n');

  it('enforces 48px minimum touch targets (min-h-12) on all Navbar interactive elements', () => {
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');

    // Cart, Account, and Theme buttons must use min-h-12 and min-w-12
    expect(navbarCode).toContain('w-12 h-12 min-w-12 min-h-12');

    // Language switcher buttons must use min-h-12 min-w-12
    expect(navbarCode).toContain('min-h-12 min-w-12 px-3 py-2');

    // Planner CTA button must use min-h-12
    expect(navbarCode).toContain('h-12 min-h-12');

    // Focus rings for keyboard accessibility
    expect(navbarCode).toContain('focus-visible:ring-2');
  });

  it('verifies payment redirect URLs omit mutable personal data (amount, customer name) to prevent PII exposure', () => {
    const adapterCode = fs.readFileSync(mockAdapterPath, 'utf8');

    // Redirect URL must use opaque paymentId and orderNumber
    expect(adapterCode).toContain('paymentId=${paymentId}');
    expect(adapterCode).toContain('orderNumber=${params.orderNumber}');

    // Must not append customer name or amount in cleartext query string
    expect(adapterCode).not.toContain('customer=');
    expect(adapterCode).not.toContain('amount=${params.amountIdr}');
  });

  it('reconciles n8n workflow exports inventory with documentation (12 workflows)', () => {
    const workflowFiles = fs
      .readdirSync(n8nDir)
      .filter((file) => file.endsWith('.json'));

    expect(workflowFiles.length).toBe(12);

    const automationDoc = fs.readFileSync(automationDocPath, 'utf8');
    const readme = fs.readFileSync(readmePath, 'utf8');

    // Documentation mentions 12 automation workflows
    expect(automationDoc).toContain('Twelve production-grade n8n workflows');
    expect(automationDoc).toContain('The Twelve Automation Workflows');
    expect(automationDoc).toContain('Mock Payment Gateway Relay');
    expect(automationDoc).toContain('Voice-to-Halal & Place Enrichment');

    expect(readme).toContain('12 self-hosted n8n automation workflows');
    expect(readme).toContain('12 production-grade n8n workflow JSON exports');
  });
});
