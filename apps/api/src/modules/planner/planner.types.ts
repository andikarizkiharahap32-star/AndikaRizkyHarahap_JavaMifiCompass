export type UsageProfile = 'LIGHT' | 'MODERATE' | 'HEAVY' | 'WORK';

export interface PlannerInput {
  destinations: string[]; // ISO 3166-1 alpha-2 codes (e.g. ['JP'], ['CN'])
  startDate: string; // ISO date
  endDate: string; // ISO date
  travelerCount: number;
  deviceCount: number;
  usageProfile: UsageProfile;
  needsVPN?: boolean;
  esimCompatible: boolean;
  budget?: number;
}

export interface RecommendationOption {
  type: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD';
  title: string;
  rank: number; // 1 = Best recommendation, 2 = Second best, etc.
  isPrimary: boolean;
  totalEstimatedPriceIdr: number;
  pricePerPersonPerDayIdr: number;
  score: number; // 0-100
  reasons: string[];
  caveats: string[];
  breakEvenNote?: string;
  features: {
    dataLimit: string;
    speed: string;
    deviceSharing: string;
    batteryEffort: string;
    handlingEffort: string;
    vpnIncluded: boolean;
  };
}

export interface PlannerResult {
  destinations: string[];
  tripDays: number;
  travelerCount: number;
  deviceCount: number;
  recommendedOption: RecommendationOption;
  alternativeOptions: RecommendationOption[];
  breakEvenAnalysis: {
    crossOverGroupSize?: number;
    breakEvenDescription: string;
  };
  destinationNotes: {
    requiresVpn: boolean;
    vpnAdvice?: string;
    networkNotice?: string;
  };
}
