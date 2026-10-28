import { describe, it, expect } from 'vitest';
import {
  PiiCategoryEnum,
  RetentionPolicyCategoryEnum,
  maskEmail,
  maskPhoneNumber,
  maskNationalId,
  maskAddress,
  maskFullName,
  maskIpAddress,
  maskPiiDeep,
  evaluateRetentionSchedule,
  buildDataSubjectExport,
  anonymizeUserData,
  evaluatePrivacyMinimizationCompliance,
  UserDataSubjectInput,
} from '../src';

describe('SEC-P08: Privacy and Data Minimization', () => {
  describe('PII Field Masking Functions (INV-03, SEC-P08-CTRL-0016)', () => {
    it('masks email addresses properly while preserving domain context', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j***e@example.com');
      expect(maskEmail('a@javamifi.com')).toBe('a***@javamifi.com');
      expect(maskEmail('customer.service@sub.domain.co.id')).toBe('c***e@sub.domain.co.id');
      expect(maskEmail('')).toBe('***@***');
      expect(maskEmail('invalid-email')).toBe('***@***');
    });

    it('masks phone numbers preserving country prefix and last 4 digits', () => {
      expect(maskPhoneNumber('+6281234567890')).toBe('+62812****7890');
      expect(maskPhoneNumber('081234567890')).toBe('0812****7890');
      expect(maskPhoneNumber('12345')).toBe('****');
      expect(maskPhoneNumber('')).toBe('***');
    });

    it('masks national ID / passport / KTP numbers', () => {
      const maskedPassport = maskNationalId('A12345678');
      expect(maskedPassport.startsWith('A123')).toBe(true);
      expect(maskedPassport.includes('****')).toBe(true);
      expect(maskNationalId('123')).toBe('****');
    });

    it('masks physical delivery addresses removing unit, street number, and RT/RW details', () => {
      const rawAddress = 'Jl. Jend. Sudirman No. 10, RT.01/RW.02, Jakarta Pusat 10220';
      const masked = maskAddress(rawAddress);
      expect(masked).toContain('[REDACTED]');
      expect(masked).not.toContain('No. 10');
      expect(masked).toContain('Jakarta Pusat');
    });

    it('masks full names preserving initial letters', () => {
      expect(maskFullName('Budi Santoso')).toBe('B*** S***');
      expect(maskFullName('John')).toBe('J***');
      expect(maskFullName('')).toBe('***');
    });

    it('masks IP addresses truncating client host identifier (subnet masking)', () => {
      expect(maskIpAddress('192.168.1.150')).toBe('192.168.1.0/24');
      expect(maskIpAddress('10.0.55.99')).toBe('10.0.55.0/24');
      expect(maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3::/48');
    });
  });

  describe('Deep Diagnostic and Telemetry PII Masking (INV-03, SEC-P08-CTRL-0017)', () => {
    it('recursively masks known PII keys in structured telemetry objects', () => {
      const rawTelemetry = {
        traceId: 'trc-12345',
        timestamp: '2026-10-28T10:00:00Z',
        context: {
          clientIp: '203.0.113.195',
          email: 'traveler@gmail.com',
          contactNumber: '+6281234567890',
          shippingAddress: 'Jl. Boulevard Raya Blok QJ No. 45, Kelapa Gading, Jakarta Utara',
          customerName: 'Ahmad Dahlan',
        },
        payload: {
          deviceId: 'dev-9988',
          items: [
            {
              sku: 'JM-WIFI-JP',
              recipientName: 'Siti Aminah',
            },
          ],
        },
      };

      const masked = maskPiiDeep(rawTelemetry);

      expect(masked.traceId).toBe('trc-12345');
      expect(masked.context.email).toBe('t***r@gmail.com');
      expect(masked.context.contactNumber).toBe('+62812****7890');
      expect(masked.context.shippingAddress).toContain('[REDACTED]');
      expect(masked.context.customerName).toBe('A*** D***');
      expect(masked.context.clientIp).toBe('203.0.113.0/24');
      expect(masked.payload.items[0].recipientName).toBe('S*** A***');
    });
  });

  describe('Retention Schedule Evaluation (SEC-P08-CTRL-0028)', () => {
    const referenceDate = new Date('2026-10-28T00:00:00Z');

    it('evaluates ephemeral checkout sessions (2-day SLA)', () => {
      const freshSession = new Date('2026-10-27T12:00:00Z'); // 12 hours old
      const oldSession = new Date('2026-10-25T00:00:00Z'); // 3 days old

      const resFresh = evaluateRetentionSchedule(freshSession, 'EPHEMERAL_CHECKOUT_SESSION', referenceDate);
      expect(resFresh.isExpired).toBe(false);
      expect(resFresh.actionRequired).toBe('RETAIN');

      const resOld = evaluateRetentionSchedule(oldSession, 'EPHEMERAL_CHECKOUT_SESSION', referenceDate);
      expect(resOld.isExpired).toBe(true);
      expect(resOld.purgeEligible).toBe(true);
      expect(resOld.actionRequired).toBe('PURGE_PII');
    });

    it('evaluates shipping logistics PII (90-day SLA per SEC-P01)', () => {
      const withinSla = new Date('2026-09-01T00:00:00Z'); // ~57 days old
      const expiredSla = new Date('2026-06-01T00:00:00Z'); // ~149 days old

      const resWithin = evaluateRetentionSchedule(withinSla, 'SHIPPING_LOGISTICS_PII', referenceDate);
      expect(resWithin.isExpired).toBe(false);
      expect(resWithin.retentionLimitDays).toBe(90);

      const resExpired = evaluateRetentionSchedule(expiredSla, 'SHIPPING_LOGISTICS_PII', referenceDate);
      expect(resExpired.isExpired).toBe(true);
      expect(resExpired.purgeEligible).toBe(true);
      expect(resExpired.actionRequired).toBe('PURGE_PII');
    });

    it('evaluates financial ledger retention (7-year statutory SLA)', () => {
      const fourYearsOld = new Date('2022-10-28T00:00:00Z');
      const res = evaluateRetentionSchedule(fourYearsOld, 'FINANCIAL_LEDGER', referenceDate);
      expect(res.isExpired).toBe(false);
      expect(res.retentionLimitDays).toBe(2555);
      expect(res.actionRequired).toBe('RETAIN');
    });
  });

  describe('Data Subject Rights: Export and Erasure (UU PDP Art. 35-40 / GDPR Art. 15-20)', () => {
    const mockUserRecord: UserDataSubjectInput = {
      userId: 'usr_88294018',
      email: 'traveler.indonesia@example.com',
      name: 'Rian Pratama',
      phone: '+6281122334455',
      role: 'CUSTOMER',
      createdAt: '2025-01-15T08:30:00Z',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$someSecretSalt$hashValue',
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      refreshTokenHash: 'sha256_mock_hash_value',
      paymentGatewayTokens: { midtransCardToken: 'tok_live_12345' },
      orders: [
        {
          id: 'ord_001',
          orderNumber: 'JM-2025-001',
          totalAmountIdr: 450000,
          currency: 'IDR',
          status: 'COMPLETED',
          createdAt: '2025-02-10T11:00:00Z',
          shippingRecipient: 'Rian Pratama',
          shippingPhone: '+6281122334455',
          shippingAddress: 'Jl. Asia Afrika No. 8, Bandung',
        },
      ],
      consents: [
        {
          consentType: 'MARKETING_EMAILS',
          granted: true,
          timestamp: '2025-01-15T08:30:00Z',
        },
      ],
    };

    it('builds a secure data export strictly redacting password, MFA, and payment credentials (INV-01, INV-02)', () => {
      const exportResult = buildDataSubjectExport(mockUserRecord);

      expect(exportResult.userId).toBe('usr_88294018');
      expect(exportResult.jurisdiction).toBe('UU_PDP_INDONESIA');
      expect(exportResult.dataSubject.profile.email).toBe('traveler.indonesia@example.com');
      expect(exportResult.dataSubject.orders.length).toBe(1);
      expect(exportResult.dataSubject.orders[0].orderNumber).toBe('JM-2025-001');

      // Assert zero credentials leaked in export output
      const jsonOutput = JSON.stringify(exportResult);
      expect(jsonOutput).not.toContain('argon2id');
      expect(jsonOutput).not.toContain('JBSWY3DPEHPK3PXP');
      expect(jsonOutput).not.toContain('tok_live_12345');
      expect(exportResult.redactedCredentialsCount).toBe(4);
    });

    it('anonymizes user data on erasure request while preserving statutory financial totals (INV-02, INV-04)', () => {
      const userCopy = JSON.parse(JSON.stringify(mockUserRecord));
      const erasureResult = anonymizeUserData(userCopy);

      expect(erasureResult.userId).toBe('usr_88294018');
      expect(erasureResult.pseudonymizedName).toContain('ANONYMIZED_USER_');
      expect(erasureResult.pseudonymizedEmail).toContain('@deleted.javamifi.local');
      expect(erasureResult.phoneCleared).toBe(true);
      expect(erasureResult.shippingAddressesPurgedCount).toBe(1);
      expect(erasureResult.preservedFinancialLedgerCount).toBe(1);

      // Verify that shipping address details are cleared from orders
      expect(userCopy.orders[0].shippingAddress).toBeNull();
      expect(userCopy.orders[0].shippingRecipient).toBeNull();
      // Verify financial metadata remains intact for tax records
      expect(userCopy.orders[0].totalAmountIdr).toBe(450000);
      expect(userCopy.orders[0].orderNumber).toBe('JM-2025-001');
    });
  });

  describe('Comprehensive Compliance Evaluator (INV-04, SEC-P08-CTRL-0001, CTRL-0028)', () => {
    it('returns COMPLIANT when masking, retention SLAs, and invariants hold', () => {
      const report = evaluatePrivacyMinimizationCompliance({
        shippingRetentionDays: 90,
        financialRetentionYears: 7,
        sampleTelemetryLogs: [
          { action: 'LOGIN', user: 'j***e@example.com', ip: '10.0.0.0/24' },
          { action: 'ORDER_PLACED', phone: '+62812****7890' },
        ],
      });

      expect(report.status).toBe('COMPLIANT');
      expect(report.invariants['INV-01'].passed).toBe(true);
      expect(report.invariants['INV-02'].passed).toBe(true);
      expect(report.invariants['INV-03'].passed).toBe(true);
      expect(report.invariants['INV-04'].passed).toBe(true);
      expect(report.controls['SEC-P08-CTRL-0001'].verified).toBe(true);
      expect(report.controls['SEC-P08-CTRL-0028'].verified).toBe(true);
      expect(report.metrics.unmaskedPiiDetectedInTelemetry).toBe(0);
    });

    it('fails compliance if shipping retention SLA exceeds 90 days', () => {
      const report = evaluatePrivacyMinimizationCompliance({
        shippingRetentionDays: 180, // Exceeds 90-day SLA
      });

      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.invariants['INV-04'].passed).toBe(false);
      expect(report.controls['SEC-P08-CTRL-0028'].verified).toBe(false);
    });

    it('detects unmasked PII in telemetry logs and fails INV-03', () => {
      const report = evaluatePrivacyMinimizationCompliance({
        sampleTelemetryLogs: [
          { event: 'CHECKOUT_FAIL', unmaskedCustomerEmail: 'leaked.traveler@domain.com' },
        ],
      });

      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.invariants['INV-03'].passed).toBe(false);
      expect(report.metrics.unmaskedPiiDetectedInTelemetry).toBeGreaterThan(0);
    });
  });
});
