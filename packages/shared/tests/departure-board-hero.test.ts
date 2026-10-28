import { describe, it, expect } from 'vitest';

interface DestinationHub {
  id: string;
  stationCode: string;
  wifiDailyRate: number;
  esimDailyRate: number;
  socketType: string;
}

const TEST_HUBS: DestinationHub[] = [
  { id: 'JP', stationCode: 'HND', wifiDailyRate: 70000, esimDailyRate: 35000, socketType: 'Tipe A/B (100V)' },
  { id: 'SA', stationCode: 'JED', wifiDailyRate: 75000, esimDailyRate: 45000, socketType: 'Tipe G (220V)' },
  { id: 'GB', stationCode: 'LHR', wifiDailyRate: 80000, esimDailyRate: 40000, socketType: 'Tipe G (230V)' },
  { id: 'SG', stationCode: 'SIN', wifiDailyRate: 60000, esimDailyRate: 30000, socketType: 'Tipe G (230V)' },
  { id: 'CN', stationCode: 'PEK', wifiDailyRate: 75000, esimDailyRate: 45000, socketType: 'Tipe A/I (220V)' },
];

function resolveHeroRecommendation(hub: DestinationHub, paxCount: number) {
  const isSolo = paxCount === 1;
  const recommendedProduct = isSolo ? 'esim' : 'wifi';
  const dailyPrice = isSolo ? hub.esimDailyRate : hub.wifiDailyRate;
  const costPerPerson = isSolo ? dailyPrice : Math.round(dailyPrice / paxCount);
  const badge = isSolo ? 'SOLO FAST-PASS' : 'GROUP FAVORITE';

  return {
    recommendedProduct,
    dailyPrice,
    costPerPerson,
    badge,
  };
}

describe('DepartureBoardHero Recommendation & Contract Tests', () => {
  it('correctly recommends eSIM Solo Fast-Pass when pax is 1', () => {
    const hub = TEST_HUBS[0]; // JP
    const rec = resolveHeroRecommendation(hub, 1);

    expect(rec.recommendedProduct).toBe('esim');
    expect(rec.badge).toBe('SOLO FAST-PASS');
    expect(rec.dailyPrice).toBe(35000);
    expect(rec.costPerPerson).toBe(35000);
  });

  it('correctly recommends Pocket WiFi Group Favorite with shared cost when pax >= 2', () => {
    const hub = TEST_HUBS[0]; // JP
    const recDuo = resolveHeroRecommendation(hub, 2);
    expect(recDuo.recommendedProduct).toBe('wifi');
    expect(recDuo.badge).toBe('GROUP FAVORITE');
    expect(recDuo.dailyPrice).toBe(70000);
    expect(recDuo.costPerPerson).toBe(35000); // 70000 / 2

    const recGroup = resolveHeroRecommendation(hub, 5);
    expect(recGroup.recommendedProduct).toBe('wifi');
    expect(recGroup.dailyPrice).toBe(70000);
    expect(recGroup.costPerPerson).toBe(14000); // 70000 / 5
  });

  it('ensures all transit departure hubs have valid 3-letter station codes and positive pricing', () => {
    for (const hub of TEST_HUBS) {
      expect(hub.stationCode.length).toBe(3);
      expect(hub.wifiDailyRate).toBeGreaterThan(0);
      expect(hub.esimDailyRate).toBeGreaterThan(0);
      expect(hub.wifiDailyRate).toBeGreaterThan(hub.esimDailyRate);
      expect(hub.socketType).toContain('Tipe');
    }
  });
});
