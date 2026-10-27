export const SLUG_TO_COUNTRY: Record<string, string> = {
  jepang: 'JP',
  japan: 'JP',
  china: 'CN',
  tiongkok: 'CN',
  'arab-saudi-umrah': 'SA',
  saudi: 'SA',
  'arab-saudi': 'SA',
  singapura: 'SG',
  singapore: 'SG',
  malaysia: 'MY',
  thailand: 'TH',
  korea: 'KR',
  'korea-selatan': 'KR',
  inggris: 'GB',
  uk: 'GB',
  prancis: 'FR',
  france: 'FR',
  jerman: 'DE',
  germany: 'DE',
  amerika: 'US',
  usa: 'US',
  turki: 'TR',
  turkey: 'TR',
  uae: 'AE',
  dubai: 'AE',
};

export function resolveCountryCodeFromSlug(slug: string): string | null {
  return SLUG_TO_COUNTRY[(slug || '').toLowerCase()] || null;
}
