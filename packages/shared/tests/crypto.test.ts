import { describe, it, expect } from 'vitest';
import {
  constantTimeCompare,
  generateHmacSha256,
  verifyHmacSha256,
  hashSha512,
  generateTrackingCode,
} from '../src/helpers';

describe('Crypto & String Helpers', () => {
  it('constantTimeCompare detects equality securely', () => {
    expect(constantTimeCompare('secret123', 'secret123')).toBe(true);
    expect(constantTimeCompare('secret123', 'secret456')).toBe(false);
    expect(constantTimeCompare('short', 'longer-string')).toBe(false);
  });

  it('generateHmacSha256 and verifyHmacSha256 work reliably', () => {
    const payload = JSON.stringify({ orderId: 'test-123', amount: 150000 });
    const secret = 'super-secret-key-for-test';
    const sig = generateHmacSha256(payload, secret);
    expect(verifyHmacSha256(payload, sig, secret)).toBe(true);
    expect(verifyHmacSha256(payload, 'wrong-sig', secret)).toBe(false);
  });

  it('hashSha512 generates 128 character hex string', () => {
    const hash = hashSha512('ORDER123200150000MidtransServerKey');
    expect(hash.length).toBe(128);
  });

  it('generateTrackingCode returns expected format', () => {
    const code = generateTrackingCode('JMF');
    expect(code).toMatch(/^JMF-[A-Z0-9]{8}$/);
  });
});
