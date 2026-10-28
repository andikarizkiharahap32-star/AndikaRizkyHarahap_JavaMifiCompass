/**
 * P14: Search Ranking Engine & Weights
 *
 * Requirements:
 * 1. Ranking formula: Rank = halalStrength * 0.45 + proximity * 0.25 + text * 0.2 + quality * 0.1
 * 2. Transparent weights consolidated in one file with property tests.
 * 3. Offline evaluation set (>= 100 queries) tracked for continuous testing.
 * 4. Prohibition: Do not rank by paid placement (No sponsored fields/boosts).
 * 5. Prohibition: Do not run ranking logic client-side.
 */

export interface RankingWeights {
  readonly halalStrength: number;
  readonly proximity: number;
  readonly text: number;
  readonly quality: number;
}

export const RANKING_WEIGHTS: RankingWeights = Object.freeze({
  halalStrength: 0.45,
  proximity: 0.25,
  text: 0.2,
  quality: 0.1,
});

export type HalalStatus = 'verified' | 'self_declared' | 'unverified' | 'disputed';

export const HALAL_STRENGTH_SCORES: Record<HalalStatus, number> = Object.freeze({
  verified: 1.0, // Accredited certificate or government authority listing
  self_declared: 0.7, // Operator Muslim-owned declaration
  unverified: 0.3, // Default state
  disputed: 0.05, // Active contamination or false certification dispute
});

export interface PlaceRankingCandidate {
  id: string;
  name: string;
  halalStatus: HalalStatus;
  distanceMeters: number;
  searchRadiusMeters: number;
  textScore: number; // 0.0 to 1.0 from ts_rank or trigram
  rating: number; // 0.0 to 5.0
  reviewCount: number;
}

export interface RankedPlaceResult extends PlaceRankingCandidate {
  totalScore: number;
  scoreBreakdown: {
    halalScore: number;
    proximityScore: number;
    textScore: number;
    qualityScore: number;
  };
}

/**
 * Calculates deterministic rank score for a candidate place.
 * Strictly adheres to P14 formula: 0.45*Halal + 0.25*Proximity + 0.20*Text + 0.10*Quality.
 * PROHIBITION: Contains NO sponsored or promoted boosts.
 */
export function calculatePlaceRankScore(candidate: PlaceRankingCandidate): RankedPlaceResult {
  // 1. Halal Strength (0.0 to 1.0)
  const halalScore = HALAL_STRENGTH_SCORES[candidate.halalStatus] ?? 0.3;

  // 2. Proximity (0.0 to 1.0, decaying linearly with distance up to search radius)
  const radius = Math.max(1, candidate.searchRadiusMeters);
  const proximityScore = Math.max(0, Math.min(1, 1 - candidate.distanceMeters / radius));

  // 3. Text score (0.0 to 1.0)
  const textScore = Math.max(0, Math.min(1, candidate.textScore));

  // 4. Quality (0.0 to 1.0 based on normalized rating and log review volume confidence)
  const normalizedRating = Math.max(0, Math.min(5, candidate.rating)) / 5.0;
  const reviewConfidence = Math.min(1, Math.log10(Math.max(1, candidate.reviewCount) + 1) / 2.5);
  const qualityScore = normalizedRating * (0.7 + 0.3 * reviewConfidence);

  const totalScore =
    halalScore * RANKING_WEIGHTS.halalStrength +
    proximityScore * RANKING_WEIGHTS.proximity +
    textScore * RANKING_WEIGHTS.text +
    qualityScore * RANKING_WEIGHTS.quality;

  return {
    ...candidate,
    totalScore: Math.round(totalScore * 10000) / 10000,
    scoreBreakdown: {
      halalScore,
      proximityScore,
      textScore,
      qualityScore,
    },
  };
}

/**
 * Validates that an object contains no sponsored or paid ranking attributes.
 */
export function assertNoSponsoredAttributes(obj: Record<string, any>): void {
  const forbiddenKeys = ['sponsored', 'promoted', 'boost_bid', 'paid_tier', 'ad_id'];
  for (const key of forbiddenKeys) {
    if (key in obj) {
      throw new Error(
        `P14 Prohibition: Forbidden sponsored/paid attribute '${key}' detected in ranking payload`,
      );
    }
  }
}

/**
 * Offline evaluation set: >= 100 benchmark queries spanning Asian and European destination dining.
 */
export const OFFLINE_EVAL_QUERIES: readonly string[] = Object.freeze([
  'halal ramen tokyo',
  'pork free ramen shinjuku',
  'halal yakiniku shibuya',
  'halal wagyu ginza',
  'muslim friendly sushi asakusa',
  'halal bento osaka station',
  'halal okonomiyaki dotonbori',
  'halal kobe beef hyogo',
  'halal sukiyaki kyoto gion',
  'halal matcha cafe kyoto',
  'halal tempura ueno',
  'halal udon narita airport',
  'halal curry akihabara',
  'halal fried chicken shin-okubo',
  'halal gyudon tokyo',
  'halal dining sapporo hokkaido',
  'halal seafood otaru',
  'halal yakitori fukuoka',
  'halal gyoza nagoya',
  'halal korean bbq seoul hongdae',
  'halal samgyetang myeongdong',
  'halal tteokbokki itaewon',
  'halal bibimbap insadong',
  'muslim friendly cafe busan haeundae',
  'halal street food noryangjin',
  'halal beef soup gangnam',
  'halal dim sum taipei',
  'halal beef noodles ximending',
  'halal night market shilin',
  'muslim friendly restaurant kaohsiung',
  'halal hotpot taichung',
  'halal roast duck kuala lumpur bukit bintang',
  'halal nasi lemak klcc',
  'halal roti canai petaling jaya',
  'halal banana leaf rice bangsar',
  'halal laksa penang georgetown',
  'halal mee goreng mamak melaka',
  'halal chicken rice singapore orchard',
  'halal murtabak arab street singapore',
  'halal satay lau pa sat singapore',
  'halal chili crab changi',
  'halal pad thai bangkok sukhumvit',
  'halal tom yum goong silom',
  'halal boat noodles pratunam',
  'halal massaman curry chatuchak',
  'halal thai fried rice phuket patong',
  'halal seafood krabi aonang',
  'halal mango sticky rice chiang mai',
  'halal pho hanoi old quarter',
  'halal banh mi ho chi minh district 1',
  'halal bun cha da nang',
  'halal spring rolls hue',
  'halal rendang padang jakarta pusat',
  'halal soto betawi sudirman',
  'halal sate ayam senopati',
  'halal nasi goreng menteng',
  'halal gudeg yogyakarta malioboro',
  'halal rawon surabaya',
  'halal ayam betutu ubud bali',
  'halal seafood jimbaran bali',
  'halal dim sum hong kong wanchai',
  'halal roast goose tsim sha tsui',
  'halal cantonese noodles central hk',
  'halal fish ball mong kok',
  'halal lamb kebab beijing sanlitun',
  'halal biang biang noodles xi an',
  'halal hand pulled noodles lanzhou',
  'halal hotpot shanghai bund',
  'halal dumplings chengdu',
  'halal doner kebab london soho',
  'halal fish and chips paddington',
  'halal burger shoreditch',
  'halal afternoon tea kensington',
  'halal steakhouse mayfair',
  'halal bistro paris marais',
  'halal croissants champs elysees',
  'halal creperie montmartre',
  'halal shawarma berlin kreuzberg',
  'halal currywurst alexanderplatz',
  'halal schnitzel vienna prater',
  'halal tapas barcelona gothic',
  'halal paella valencia beach',
  'halal churros madrid sol',
  'halal pasta rome trastevere',
  'halal pizza naples spaccanapoli',
  'halal gelato florence duomo',
  'halal fondue zurich hb',
  'halal waffles brussels grand place',
  'halal stroopwafel amsterdam jordaan',
  'halal mezze istanbul sultanahmet',
  'halal iskender kebab bursa',
  'halal baklava taksim',
  'halal pide kadikoy',
  'halal mandi dubai marina',
  'halal luqaimat deira',
  'halal biryani downtown dubai',
  'halal karak chai al fahidi',
  'halal machboos doha souq waqif',
  'halal kabsa riyadh olaya',
  'halal shawarma jeddah corniche',
  'halal falafel amman rainbow street',
]);
