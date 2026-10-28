import { PlannerInput, PlannerResult, RecommendationOption } from './planner.types';

/**
 * Pure, deterministic recommendation engine for JavaMifi Compass.
 * Zero network or database I/O — 100% testable and explainable.
 */
export function calculatePlannerRecommendation(input: PlannerInput): PlannerResult {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const tripDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const travelers = Math.max(1, input.travelerCount);
  const devices = Math.max(1, input.deviceCount);
  const isChina = input.destinations.some((d) => d.toUpperCase() === 'CN');
  const needsVpn = input.needsVPN || isChina;

  // Base pricing models (benchmark estimates per day/package in IDR)
  // Pocket WiFi: typically flat ~Rp 70,000 / day for unlimited 4G, shares up to 5 devices
  const wifiDailyRate = 70_000;
  const wifiDeposit = 500_000; // refundable deposit
  const wifiTotal = wifiDailyRate * tripDays;
  const wifiPerPersonPerDay = Math.round(wifiTotal / (travelers * tripDays));

  // eSIM: typically ~Rp 45,000 / day per device, or 10GB/30days ~Rp 250,000
  // For multiple travelers without sharing, each person needs their own eSIM
  const esimDailyRatePerPerson = 45_000;
  const esimTotal = input.esimCompatible
    ? esimDailyRatePerPerson * tripDays * travelers
    : 999_999_999;
  const esimPerPersonPerDay = input.esimCompatible
    ? Math.round(esimTotal / (travelers * tripDays))
    : 0;

  // Physical SIM: ~Rp 40,000 / day per person
  const simDailyRatePerPerson = 40_000;
  const simTotal = simDailyRatePerPerson * tripDays * travelers;
  const simPerPersonPerDay = Math.round(simTotal / (travelers * tripDays));

  // ── Scoring Rules (0 - 100) ──
  let wifiScore = 50;
  let esimScore = 50;
  let simScore = 40;

  const wifiReasons: string[] = [];
  const wifiCaveats: string[] = [];
  const esimReasons: string[] = [];
  const esimCaveats: string[] = [];
  const simReasons: string[] = [];
  const simCaveats: string[] = [];

  // Group size factor
  if (travelers >= 3 || devices > travelers) {
    wifiScore += 30;
    wifiReasons.push(
      `Cost-effective for groups (${travelers} travelers): 1 device shares high-speed data for all.`,
    );
    esimScore -= 15;
    esimCaveats.push(`Every traveler needs their own individual eSIM purchase.`);
    simScore -= 15;
  } else if (travelers === 1) {
    esimScore += 25;
    esimReasons.push(`Zero physical handling: instant digital QR delivery for solo traveler.`);
    wifiScore -= 15;
    wifiCaveats.push(
      `Requires carrying an extra device, daily recharging, and returning after the trip.`,
    );
  } else {
    // 2 travelers
    wifiReasons.push(`Easy hotspot sharing between 2 travelers.`);
    esimReasons.push(`Independence: each traveler can explore separately.`);
  }

  // Device count factor
  if (devices >= 4) {
    wifiScore += 20;
    wifiReasons.push(`Supports connecting up to 5 phones, tablets, or laptops simultaneously.`);
  }

  // eSIM compatibility
  if (!input.esimCompatible) {
    esimScore = 0;
    esimCaveats.push(
      `Your device does not support digital eSIM. Physical SIM or Pocket WiFi required.`,
    );
    simScore += 25;
    simReasons.push(`Physical SIM works with any unlocked smartphone.`);
  } else {
    esimScore += 10;
    esimReasons.push(`Keeps your primary SIM active for SMS banking and OTP while abroad.`);
  }

  // Destination specific: China VPN restriction
  if (isChina) {
    wifiScore += 20;
    wifiReasons.push(
      `JavaMifi China Pocket WiFi comes with built-in unrestricted VPN to access Google, WhatsApp & Instagram.`,
    );
    if (needsVpn) {
      esimReasons.push(`Verify eSIM APN bypasses China firewall restrictions.`);
    }
  }

  // Usage profile factor
  if (input.usageProfile === 'HEAVY' || input.usageProfile === 'WORK') {
    wifiScore += 15;
    wifiReasons.push(
      `True unlimited high-speed data without throttling or battery drain on your phone.`,
    );
  } else if (input.usageProfile === 'LIGHT') {
    esimScore += 15;
    esimReasons.push(`Light usage on eSIM is the most economical choice without device deposit.`);
  }

  // Trip duration factor
  if (tripDays > 14) {
    wifiCaveats.push(
      `Longer rentals accrue higher daily rates; monitor battery and return schedule.`,
    );
  } else if (tripDays <= 5 && travelers <= 2 && input.esimCompatible) {
    esimScore += 10;
    esimReasons.push(`Short trip convenience: activate upon arrival with no airport pickup queue.`);
  }

  // Assemble Options
  const options: RecommendationOption[] = [
    {
      type: 'WIFI_RENTAL',
      title: 'JavaMifi Pocket WiFi (Unlimited 4G)',
      rank: 0,
      isPrimary: false,
      score: wifiScore,
      totalEstimatedPriceIdr: wifiTotal,
      pricePerPersonPerDayIdr: wifiPerPersonPerDay,
      reasons: wifiReasons,
      caveats: wifiCaveats,
      breakEvenNote: `Cheaper than individual eSIMs when traveling in a group of 2 or more.`,
      features: {
        dataLimit: 'Unlimited 4G LTE',
        speed: 'Up to 150 Mbps',
        deviceSharing: 'Up to 5 devices',
        batteryEffort: '12-15 hours battery life (requires nightly charge)',
        handlingEffort: 'Requires airport pickup/courier and return',
        vpnIncluded: isChina,
      },
    },
    {
      type: 'ESIM',
      title: 'JavaMifi Digital Travel eSIM',
      rank: 0,
      isPrimary: false,
      score: input.esimCompatible ? esimScore : 0,
      totalEstimatedPriceIdr: input.esimCompatible ? esimTotal : 0,
      pricePerPersonPerDayIdr: esimPerPersonPerDay,
      reasons: esimReasons,
      caveats: esimCaveats,
      breakEvenNote: `Cheapest for solo travelers and short weekend trips.`,
      features: {
        dataLimit: input.usageProfile === 'LIGHT' ? '1 GB / day' : 'Daily FUP or 10GB/trip',
        speed: '4G / 5G Local Tier-1',
        deviceSharing: 'Single device only',
        batteryEffort: 'No extra device to charge',
        handlingEffort: '100% Digital via QR Code, zero logistics',
        vpnIncluded: false,
      },
    },
    {
      type: 'SIM_CARD',
      title: 'JavaMifi Travel SIM Card',
      rank: 0,
      isPrimary: false,
      score: simScore,
      totalEstimatedPriceIdr: simTotal,
      pricePerPersonPerDayIdr: simPerPersonPerDay,
      reasons: simReasons,
      caveats: simCaveats,
      breakEvenNote: `Reliable physical fallback if device lacks eSIM support.`,
      features: {
        dataLimit: 'Daily or package quotas',
        speed: '4G LTE',
        deviceSharing: 'Single phone (tethering dependent)',
        batteryEffort: 'Phone battery only',
        handlingEffort: 'Requires physical SIM swap and slot tray ejector',
        vpnIncluded: false,
      },
    },
  ];

  // Sort by score descending
  options.sort((a, b) => b.score - a.score);

  // Assign ranks
  options.forEach((opt, idx) => {
    opt.rank = idx + 1;
    opt.isPrimary = idx === 0;
  });

  const recommended = options[0]!;
  const alternatives = options.slice(1);

  // Break-even analysis explanation
  let breakEvenDescription = '';
  let crossOverGroupSize = 2;

  if (recommended.type === 'WIFI_RENTAL') {
    const travelerText = travelers === 1 ? '1 traveler' : `group of ${travelers} travelers`;
    const deviceText = devices === 1 ? '1 device' : `${devices} devices`;
    breakEvenDescription = `WiFi rental is your #1 choice because for a ${travelerText} and ${deviceText}, sharing one connection drops your cost to Rp ${wifiPerPersonPerDay.toLocaleString('id-ID')} / person / day. If you were traveling alone, a digital eSIM would be more affordable.`;
    crossOverGroupSize = 2;
  } else if (recommended.type === 'ESIM') {
    const travelerText = travelers === 1 ? '1 traveler' : `${travelers} travelers`;
    breakEvenDescription = `Digital eSIM is your #1 choice because for ${travelerText} on a ${tripDays}-day journey, it offers instant activation with zero physical return logistics. At 3 or more travelers, Pocket WiFi becomes more cost-effective.`;
    crossOverGroupSize = 3;
  } else {
    breakEvenDescription = `Physical SIM card is recommended because your phone does not support digital eSIM, offering zero extra device baggage.`;
    crossOverGroupSize = 2;
  }

  return {
    destinations: input.destinations,
    tripDays,
    travelerCount: travelers,
    deviceCount: devices,
    recommendedOption: recommended,
    alternativeOptions: alternatives,
    breakEvenAnalysis: {
      crossOverGroupSize,
      breakEvenDescription,
    },
    destinationNotes: {
      requiresVpn: isChina,
      vpnAdvice: isChina
        ? 'Mainland China restricts Google, WhatsApp, Facebook, and Instagram. JavaMifi WiFi includes pre-configured VPN tunneling.'
        : undefined,
      networkNotice: 'Connected to Tier-1 local mobile telecommunication carriers.',
    },
  };
}
