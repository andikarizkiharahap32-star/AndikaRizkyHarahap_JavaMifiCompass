import { HalalTier, DietaryFlag, LlmSignalsOutput } from '@javamifi/shared';

/**
 * Recognized accredited international Halal certification bodies.
 */
export const ACCREDITED_CERTIFIERS = [
  'BPJPH',
  'MUI',
  'JAKIM',
  'MUIS',
  'JHF', // Japan Halal Foundation
  'JHA', // Japan Halal Association
  'NAHA', // Nippon Asia Halal Association
  'KMF', // Korea Muslim Federation
  'SFDA', // Saudi Food and Drug Authority
  'SAUDI COMMERCIAL',
  'MASJID AL HARAM',
  'GIMDES', // Turkey
  'CICOT', // Thailand
  'CMA', // Chinese Muslim Association Taiwan
  'HMC', // Halal Monitoring Committee UK
  'HFA', // Halal Food Authority UK
  'HQC', // Halal Quality Control Netherlands
  'UK MUSLIM AUTHORITIES',
  'HALAL ITALIA',
  'GRANDE MOSQUÉE DE PARIS',
  'AFIC', // Australia
  'DUBAI MUNICIPALITY',
  'QATAR MME',
  'ISLAMIC ASSOCIATION',
  'ISLAMIC COMMITTEE',
  'HALAL GREEN CERTIFICATE',
  'HUAISHENG MOSQUE',
  'CERTIFIED QINGZHEN',
  'QINGZHEN CERTIFICATION',
  '清真认证',
  'NIUJIE',
];

export interface TierEvaluationInput {
  signals: LlmSignalsOutput;
  porkDetected: boolean;
  alcoholDetected: boolean;
  quotesVerified: boolean;
  rawEvidenceText?: string;
  placeName?: string;
}

export interface TierEvaluationResult {
  tier: HalalTier;
  dietaryFlags: DietaryFlag[];
  reason: string;
  isAccreditedCertifier: boolean;
}

/**
 * Stage 4: Deterministic Halal Tier Assignment
 * Pure code decision engine. Never delegates tier status to an LLM.
 */
export function evaluateHalalTier(input: TierEvaluationInput): TierEvaluationResult {
  const { signals, porkDetected, alcoholDetected, quotesVerified, rawEvidenceText = '', placeName = '' } = input;
  const flags: DietaryFlag[] = [];
  const rawLower = rawEvidenceText.toLowerCase();
  const placeNameLower = placeName.toLowerCase();

  const isSeafoodOrVeg =
    rawLower.includes('vegetarian') ||
    rawLower.includes('vegan') ||
    rawLower.includes('seafood') ||
    rawLower.includes('fish') ||
    rawLower.includes('sashimi') ||
    rawLower.includes('tempura') ||
    rawLower.includes('plant-based') ||
    rawLower.includes('yakitori') ||
    placeNameLower.includes('yakitori') ||
    placeNameLower.includes('tempura') ||
    placeNameLower.includes('seafood') ||
    placeNameLower.includes('sashimi') ||
    placeNameLower.includes('vegetarian') ||
    placeNameLower.includes('vegan');

  const isOnRequest = rawLower.includes('on request') || rawLower.includes('upon request');

  const hasNegativeHalalStatement =
    rawLower.includes('does not offer halal') ||
    rawLower.includes("doesn't offer halal") ||
    rawLower.includes('not offer halal') ||
    rawLower.includes('no halal') ||
    rawLower.includes('non-halal');

  // Flag pork status
  if (porkDetected || (signals.porkFlags && signals.porkFlags.length > 0)) {
    flags.push(DietaryFlag.PORK_ON_MENU);
  } else {
    flags.push(DietaryFlag.PORK_FREE);
  }

  // Flag alcohol status
  if (alcoholDetected || (signals.alcoholFlags && signals.alcoholFlags.length > 0)) {
    flags.push(DietaryFlag.SERVES_ALCOHOL);
  } else {
    flags.push(DietaryFlag.ALCOHOL_FREE);
  }

  // Cookware separation flag
  if (
    (signals.cookwareNotes && signals.cookwareNotes.toLowerCase().includes('dedicated')) ||
    rawLower.includes('dedicated') ||
    rawLower.includes('separate')
  ) {
    flags.push(DietaryFlag.PORK_FREE_COOKWARE);
  }

  // RULE 1: Direct Pork presence -> strictly NOT_HALAL
  if (porkDetected || (signals.porkFlags && signals.porkFlags.length > 0)) {
    return {
      tier: HalalTier.NOT_HALAL,
      dietaryFlags: flags,
      reason: 'Bahan mengandung babi atau olahan babi terdeteksi pada menu/sumber.',
      isAccreditedCertifier: false,
    };
  }

  // Check if certifier matches accredited list
  const certifierUpper = (signals.certifierName || '').toUpperCase();
  const isAccredited = ACCREDITED_CERTIFIERS.some((cert) =>
    certifierUpper.includes(cert) || rawLower.includes(cert.toLowerCase())
  );

  // RULE 2: Valid certificate from accredited body + quotes verified
  if ((signals.hasCertificate || isAccredited) && isAccredited && quotesVerified) {
    if (alcoholDetected || isOnRequest) {
      return {
        tier: HalalTier.OPTIONS,
        dietaryFlags: flags,
        reason: `Daging halal bersertifikat (${signals.certifierName || 'Accredited'}), namun tempat menyajikan alkohol atau opsi halal hanya tersedia atas permintaan.`,
        isAccreditedCertifier: true,
      };
    }
    return {
      tier: HalalTier.CERTIFIED,
      dietaryFlags: flags,
      reason: `Sertifikasi Halal resmi terverifikasi dari lembaga terakreditasi (${signals.certifierName || 'Registry'}).`,
      isAccreditedCertifier: true,
    };
  }

  // Mixed cookware separation (e.g. separate grills, dedicated halal cookware area in mixed kitchen)
  const hasSeparationCookware = flags.includes(DietaryFlag.PORK_FREE_COOKWARE);

  // RULE 3: First-party owner declaration or >= 2 independent claims (full Halal menu)
  const ownerClaim = signals.halalClaims.some(
    (c) => c.claimedBy === 'OWNER' || c.claimedBy === 'REGISTRY'
  );
  const independentClaimsCount = signals.halalClaims.filter(
    (c) => c.claimedBy === 'REVIEWER' || c.claimedBy === 'THIRD_PARTY'
  ).length;

  if (
    !hasSeparationCookware &&
    (ownerClaim || independentClaimsCount >= 2) &&
    quotesVerified &&
    !alcoholDetected &&
    !hasNegativeHalalStatement
  ) {
    return {
      tier: HalalTier.CLAIMED,
      dietaryFlags: flags,
      reason: 'Klaim Halal dari pemilik atau multi-sumber independen terverifikasi.',
      isAccreditedCertifier: isAccredited,
    };
  }

  // RULE 4: Mixed kitchen with designated halal/pork-free cookware, seafood, or vegetarian
  if (
    flags.includes(DietaryFlag.PORK_FREE_COOKWARE) ||
    isSeafoodOrVeg ||
    (!hasNegativeHalalStatement && quotesVerified && signals.halalClaims.length > 0 && flags.includes(DietaryFlag.SERVES_ALCOHOL)) ||
    (!hasNegativeHalalStatement && alcoholDetected && signals.halalClaims.length > 0)
  ) {
    return {
      tier: HalalTier.OPTIONS,
      dietaryFlags: flags,
      reason: 'Tersedia pilihan menu Halal atau peralatan masak bebas babi pada dapur campuran.',
      isAccreditedCertifier: isAccredited,
    };
  }

  // RULE 5: Alcohol detected with no halal claim or certification -> NOT_HALAL
  if (
    (alcoholDetected && !signals.hasCertificate && signals.halalClaims.length === 0) ||
    hasNegativeHalalStatement
  ) {
    return {
      tier: HalalTier.NOT_HALAL,
      dietaryFlags: flags,
      reason: 'Menyajikan minuman keras atau menyatakan tidak menyediakan sertifikasi/menu halal.',
      isAccreditedCertifier: false,
    };
  }

  // RULE 6: Default fail-closed fallback -> UNKNOWN
  return {
    tier: HalalTier.UNKNOWN,
    dietaryFlags: flags,
    reason: 'Bukti tidak mencukupi atau kutipan klaim tidak lolos verifikasi verbatim.',
    isAccreditedCertifier: false,
  };
}
