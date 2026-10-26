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
  'GIMDES', // Turkey
  'CICOT', // Thailand
  'CMA', // Chinese Muslim Association Taiwan
  'HMC', // Halal Monitoring Committee UK
  'HFA', // Halal Food Authority UK
  'HQC', // Halal Quality Control Netherlands
  'HALAL ITALIA',
  'GRANDE MOSQUÉE DE PARIS',
  'AFIC', // Australia
  'DUBAI MUNICIPALITY',
  'QATAR MME',
];

export interface TierEvaluationInput {
  signals: LlmSignalsOutput;
  porkDetected: boolean;
  alcoholDetected: boolean;
  quotesVerified: boolean;
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
  const { signals, porkDetected, alcoholDetected, quotesVerified } = input;
  const flags: DietaryFlag[] = [];

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
  if (signals.cookwareNotes && signals.cookwareNotes.toLowerCase().includes('dedicated')) {
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
    certifierUpper.includes(cert)
  );

  // RULE 2: Valid certificate from accredited body + quotes verified
  if (signals.hasCertificate && isAccredited && quotesVerified) {
    return {
      tier: HalalTier.CERTIFIED,
      dietaryFlags: flags,
      reason: `Sertifikasi Halal resmi terverifikasi dari lembaga terakreditasi (${signals.certifierName}).`,
      isAccreditedCertifier: true,
    };
  }

  // RULE 3: First-party owner declaration or >= 2 independent claims
  const ownerClaim = signals.halalClaims.some(
    (c) => c.claimedBy === 'OWNER' || c.claimedBy === 'REGISTRY'
  );
  const independentClaimsCount = signals.halalClaims.filter(
    (c) => c.claimedBy === 'REVIEWER' || c.claimedBy === 'THIRD_PARTY'
  ).length;

  if ((ownerClaim || independentClaimsCount >= 2) && quotesVerified && !alcoholDetected) {
    return {
      tier: HalalTier.CLAIMED,
      dietaryFlags: flags,
      reason: 'Klaim Halal dari pemilik atau multi-sumber independen terverifikasi.',
      isAccreditedCertifier: isAccredited,
    };
  }

  // RULE 4: Mixed kitchen with designated halal/pork-free cookware
  if (
    quotesVerified &&
    (flags.includes(DietaryFlag.PORK_FREE_COOKWARE) ||
      (signals.halalClaims.length > 0 && flags.includes(DietaryFlag.SERVES_ALCOHOL)))
  ) {
    return {
      tier: HalalTier.OPTIONS,
      dietaryFlags: flags,
      reason: 'Tersedia pilihan menu Halal atau peralatan masak bebas babi pada dapur campuran.',
      isAccreditedCertifier: isAccredited,
    };
  }

  // RULE 5: Default fail-closed fallback -> UNKNOWN
  return {
    tier: HalalTier.UNKNOWN,
    dietaryFlags: flags,
    reason: 'Bukti tidak mencukupi atau kutipan klaim tidak lolos verifikasi verbatim.',
    isAccreditedCertifier: false,
  };
}
