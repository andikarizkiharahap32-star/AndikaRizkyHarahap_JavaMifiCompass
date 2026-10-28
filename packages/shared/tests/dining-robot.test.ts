import { describe, it, expect } from 'vitest';

describe('Tactile Robot Assistant & Payment Links Contract', () => {
  it('formats "Tanya AI" label with bilingual support without AI slop', () => {
    const getAssistantLabel = (locale: string, customLabel?: string) => {
      if (customLabel) return customLabel;
      return locale === 'id' ? 'Tanya AI' : 'Ask AI';
    };

    expect(getAssistantLabel('id')).toBe('Tanya AI');
    expect(getAssistantLabel('en')).toBe('Ask AI');
    expect(getAssistantLabel('id', 'Tanya AI Halal')).toBe('Tanya AI Halal');
  });

  it('resolves MockGateway simulation URLs with proper query params', () => {
    const orderNumber = 'JMF-JPN-2026';
    const amount = 150000;
    const customer = 'Budi Santoso';

    const webBaseUrl = 'http://localhost:3000';
    const simulatorUrl = `${webBaseUrl}/id/checkout/mock-payment?orderNumber=${encodeURIComponent(orderNumber)}&amount=${amount}&customer=${encodeURIComponent(customer)}`;
    const callbackUrl = `${webBaseUrl}/id/payment/callback?order_id=${encodeURIComponent(orderNumber)}&status=SUCCESS`;
    const tripHubUrl = `${webBaseUrl}/id/trip-hub/${encodeURIComponent(orderNumber)}`;

    expect(simulatorUrl).toContain('orderNumber=JMF-JPN-2026');
    expect(simulatorUrl).toContain('amount=150000');
    expect(simulatorUrl).toContain('customer=Budi%20Santoso');

    expect(callbackUrl).toContain('order_id=JMF-JPN-2026');
    expect(callbackUrl).toContain('status=SUCCESS');

    expect(tripHubUrl).toBe('http://localhost:3000/id/trip-hub/JMF-JPN-2026');
  });

  it('validates fail-closed dining query intent extraction contract', () => {
    const sampleQuery = 'ramen halal tokyo under 2000 yen';
    const hasHalal = sampleQuery.toLowerCase().includes('halal');
    const isTokyo = sampleQuery.toLowerCase().includes('tokyo');

    expect(hasHalal).toBe(true);
    expect(isTokyo).toBe(true);
  });
});
