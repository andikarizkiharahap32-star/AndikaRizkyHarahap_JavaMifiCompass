import { HalalTier, DietaryFlag, DiningPriceType } from '@javamifi/shared';

export interface RawPlaceItem {
  id: string;
  nameOriginal: string;
  nameEn: string;
  nameId: string;
  category: string;
  sourceDescription?: string;
  explainerId?: string;
  amountMinor: number;
  currency: string;
  isHalal: boolean;
  flags: DietaryFlag[];
}

export interface RawEvidence {
  id: string;
  sourceType: 'REGISTRY' | 'RESTAURANT_WEBSITE' | 'MENU_TEXT' | 'VERIFIED_REVIEW';
  quoteText: string;
  language: string;
  retrievedAt: string;
  sourceUrl?: string;
  attributionNotice: string;
}

export interface RawPlace {
  id: string;
  placeRef: string;
  name: string;
  nameOriginal?: string;
  countryIso2: string;
  countryName: string;
  cityName: string;
  cuisine: string;
  latitude: number;
  longitude: number;
  geohashCell: string;
  address: string;
  addressLocalScript?: string;
  postalCode?: string;
  plusCode?: string;
  googleRating: number;
  reviewCount: number;
  ratingSource?: string;
  tier: HalalTier;
  certifierName?: string;
  certNumber?: string;
  certExpiresAt?: string;
  lastVerifiedDate?: string;
  dietaryFlags: DietaryFlag[];
  alcoholStatus?: 'CERTIFIED_FREE' | 'NOT_MENTIONED' | 'SERVES_ALCOHOL';
  averagePriceMinor: number;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  currency: string;
  phone?: string;
  openingHours: string[];
  whyHalalExplanation?: string;
  evidence: RawEvidence[];
  menuItems: RawPlaceItem[];
}

export const COUNTRIES_CATALOG = [
  { code: 'JP', name: 'Jepang', flag: '🇯🇵', currency: 'JPY', city: 'Tokyo' },
  { code: 'SA', name: 'Arab Saudi', flag: '🇸🇦', currency: 'SAR', city: 'Makkah' },
  { code: 'SG', name: 'Singapura', flag: '🇸🇬', currency: 'SGD', city: 'Kampong Glam' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', city: 'Kuala Lumpur' },
  { code: 'KR', name: 'Korea Selatan', flag: '🇰🇷', currency: 'KRW', city: 'Seoul' },
  { code: 'TR', name: 'Turki', flag: '🇹🇷', currency: 'TRY', city: 'Istanbul' },
  { code: 'GB', name: 'Inggris (UK)', flag: '🇬🇧', currency: 'GBP', city: 'London' },
  { code: 'AE', name: 'Uni Emirat Arab', flag: '🇦🇪', currency: 'AED', city: 'Dubai' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', city: 'Bangkok' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', currency: 'HKD', city: 'Wan Chai' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', currency: 'TWD', city: 'Taipei' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', city: 'Sydney' },
  { code: 'FR', name: 'Prancis', flag: '🇫🇷', currency: 'EUR', city: 'Paris' },
  { code: 'DE', name: 'Jerman', flag: '🇩🇪', currency: 'EUR', city: 'Berlin' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', currency: 'EUR', city: 'Roma' },
  { code: 'NL', name: 'Belanda', flag: '🇳🇱', currency: 'EUR', city: 'Amsterdam' },
  { code: 'CH', name: 'Swiss', flag: '🇨🇭', currency: 'CHF', city: 'Zurich' },
  { code: 'EG', name: 'Mesir', flag: '🇪🇬', currency: 'EGP', city: 'Kairo' },
  { code: 'MA', name: 'Maroko', flag: '🇲🇦', currency: 'MAD', city: 'Marrakech' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', city: 'Doha' },
];

export const SEEDED_PLACES: RawPlace[] = [
  // 1. JAPAN (JP)
  {
    id: 'jp-tokyo-honolu',
    placeRef: 'pl_jp_honolu_01',
    name: 'Halal Ramen Honolu Ebisu',
    nameOriginal: '麺屋 帆のる 恵比寿店',
    countryIso2: 'JP',
    countryName: 'Jepang',
    cityName: 'Tokyo',
    cuisine: 'Ramen & Gyoza',
    latitude: 35.6465,
    longitude: 139.7103,
    geohashCell: 'xn76ug',
    address: '1-23-1 Ebisuminami, Shibuya-ku, Tokyo 150-0022',
    addressLocalScript: '東京都渋谷区恵比寿南1-23-1',
    postalCode: '〒150-0022',
    plusCode: '8Q7XMMWF+34',
    googleRating: 4.6,
    reviewCount: 1420,
    ratingSource: 'Google Places (New)',
    tier: HalalTier.CERTIFIED,
    certifierName: 'Japan Halal Foundation (JHF)',
    certNumber: 'JHF-2025-0891',
    certExpiresAt: '2027-08-31',
    lastVerifiedDate: '26 Okt 2026',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE, DietaryFlag.PORK_FREE_COOKWARE],
    alcoholStatus: 'CERTIFIED_FREE',
    averagePriceMinor: 1400,
    minPriceMinor: 1000,
    maxPriceMinor: 2000,
    currency: 'JPY',
    phone: '+81 3-5734-1667',
    openingHours: ['Senin - Minggu: 11:30 - 14:30, 17:00 - 22:00'],
    whyHalalExplanation:
      'Diverifikasi memiliki sertifikat Halal aktif dari Japan Halal Foundation (JHF). Seluruh kaldu ayam diproses terpisah tanpa mirin atau sake, peralatan masak bebas babi.',
    evidence: [
      {
        id: 'ev-jp-01',
        sourceType: 'REGISTRY',
        quoteText: 'Halal Certificate JHF-2025-0891 issued to Menya Honolu Ebisu. Status: Active, Expiry: 2027-08-31.',
        language: 'en',
        retrievedAt: '2026-10-15',
        sourceUrl: 'https://japanhalal.or.jp/registry/jhf-2025-0891',
        attributionNotice: 'Japan Halal Foundation Official Registry',
      },
    ],
    menuItems: [
      {
        id: 'm-jp-01',
        nameOriginal: '特製濃厚鶏白湯らーめん',
        nameEn: 'Special Rich Halal Chicken Paitan Ramen',
        nameId: 'Ramen Ayam Kuah Kental Gurih',
        category: 'Ramen',
        sourceDescription: 'Slow-cooked halal chicken broth served with tender chicken char siu and ajitsuke tamago.',
        explainerId: 'Kaldu ayam asli halal yang direbus 8 jam hingga lembut dan kental, disajikan dengan telur setengah matang.',
        amountMinor: 1380,
        currency: 'JPY',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-jp-02',
        nameOriginal: 'スパイシー鶏白湯らーめん',
        nameEn: 'Spicy Halal Chicken Ramen',
        nameId: 'Ramen Ayam Kuah Pedas Spesial',
        category: 'Ramen',
        sourceDescription: 'Signature chicken ramen infused with aromatic chili oil and Japanese spices.',
        explainerId: 'Ramen kuah pedas aroma wijen dan cabai khas Jepang dengan potongan dada ayam panggang halal.',
        amountMinor: 1480,
        currency: 'JPY',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-jp-03',
        nameOriginal: '自家製ハラール焼き餃子 (5個)',
        nameEn: 'Handmade Halal Pan-Fried Gyoza (5 pcs)',
        nameId: 'Gyoza Ayam Panggang Halal (5 buah)',
        category: 'Side Dish',
        sourceDescription: 'Crispy bottom dumplings stuffed with halal chicken mince, cabbage, and scallions.',
        explainerId: 'Pangsit Jepang isi daging ayam cincang dan sayuran dengan kulit renyah.',
        amountMinor: 600,
        currency: 'JPY',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },
  {
    id: 'jp-tokyo-panga',
    placeRef: 'pl_jp_panga_02',
    name: 'Yakiniku Panga Halal Asakusa',
    nameOriginal: '炭火焼肉 パンガ 浅草店',
    countryIso2: 'JP',
    countryName: 'Jepang',
    cityName: 'Tokyo',
    cuisine: 'Wagyu & Yakiniku',
    latitude: 35.7118,
    longitude: 139.7942,
    geohashCell: 'xn77hf',
    address: '3-27-9 Taito, Taito-ku, Tokyo 110-0016',
    addressLocalScript: '東京都台東区台東3-27-9',
    postalCode: '〒110-0016',
    plusCode: '8Q7XMRPV+X8',
    googleRating: 4.8,
    reviewCount: 2310,
    ratingSource: 'Google Places (New)',
    tier: HalalTier.CERTIFIED,
    certifierName: 'Japan Halal Foundation (JHF)',
    certNumber: 'JHF-2024-0312',
    certExpiresAt: '2027-03-31',
    lastVerifiedDate: '26 Okt 2026',
    dietaryFlags: [DietaryFlag.PORK_FREE],
    alcoholStatus: 'NOT_MENTIONED',
    averagePriceMinor: 4500,
    minPriceMinor: 3000,
    maxPriceMinor: 6000,
    currency: 'JPY',
    phone: '+81 3-3839-8929',
    openingHours: ['Senin - Minggu: 17:00 - 23:00'],
    whyHalalExplanation:
      'Daging Wagyu bersertifikat Halal A5 resmi. Tidak menyediakan daging babi, saus celup (tare) dibuat khusus tanpa alkohol maupun sake.',
    evidence: [
      {
        id: 'ev-jp-02',
        sourceType: 'REGISTRY',
        quoteText: 'Full Halal Kitchen Certification granted to Yakiniku Panga. Certificate JHF-2024-0312.',
        language: 'en',
        retrievedAt: '2026-10-12',
        attributionNotice: 'Japan Halal Foundation Public Database',
      },
    ],
    menuItems: [
      {
        id: 'm-jp-04',
        nameOriginal: 'A5黒毛和牛特上カルビ',
        nameEn: 'A5 Kuroge Wagyu Premium Short Rib (Kalbi)',
        nameId: 'Daging Panggang Wagyu A5 Kalbi Premium',
        category: 'Yakiniku Wagyu',
        sourceDescription: 'Melt-in-your-mouth halal certified Japanese black wagyu rib.',
        explainerId: 'Daging sapi wagyu hitam Jepang A5 bermarmer halus yang dipanggang arang.',
        amountMinor: 3200,
        currency: 'JPY',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-jp-05',
        nameOriginal: '和牛上ロースセット',
        nameEn: 'Premium Wagyu Loin Dinner Set',
        nameId: 'Set Lengkap Wagyu Loin, Nasi & Sup',
        category: 'Set Menu',
        sourceDescription: 'Halal wagyu loin slices accompanied by steamed rice, kimchi, and clear beef soup.',
        explainerId: 'Set makan lengkap daging wagyu panggang dengan nasi putih Jepang, kimchi, dan kuah kaldu sapi.',
        amountMinor: 4800,
        currency: 'JPY',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 2. SAUDI ARABIA (SA)
  {
    id: 'sa-makkah-albaik',
    placeRef: 'pl_sa_albaik_01',
    name: 'Albaik Clock Tower Makkah',
    nameOriginal: 'البيك - أبراج البيت مكة',
    countryIso2: 'SA',
    countryName: 'Arab Saudi',
    cityName: 'Makkah',
    cuisine: 'Crispy Fried Chicken',
    latitude: 21.4187,
    longitude: 39.8262,
    geohashCell: 'sg3w2b',
    address: 'Abraj Al-Bait Mall, 4th Floor Food Court, Makkah',
    googleRating: 4.7,
    reviewCount: 38400,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Saudi Food and Drug Authority (SFDA)',
    certNumber: 'SFDA-KSA-9921',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 2500, // 25.00 SAR
    currency: 'SAR',
    phone: '+966 800 244 2245',
    openingHours: ['24 Jam Setiap Hari'],
    whyHalalExplanation:
      'Seluruh bahan baku ayam dan rempah diawasi secara nasional di bawah regulasi SFDA Arab Saudi. Terjamin 100% Halal.',
    evidence: [
      {
        id: 'ev-sa-01',
        sourceType: 'REGISTRY',
        quoteText: 'SFDA Kingdom of Saudi Arabia National Compliance 100% Halal Certified Slaughter.',
        language: 'en',
        retrievedAt: '2026-10-10',
        attributionNotice: 'Saudi SFDA Central Verification',
      },
    ],
    menuItems: [
      {
        id: 'm-sa-01',
        nameOriginal: 'وجبة دجاج البيك 4 قطع',
        nameEn: 'Albaik 4-Piece Crispy Chicken Meal',
        nameId: 'Paket Ayam Goreng Renyah Albaik (4 Potong)',
        category: 'Ayam Goreng',
        sourceDescription: '4 pieces of famous broasted chicken with signature garlic sauce, bun, and fries.',
        explainerId: 'Ayam goreng khas rempah Albaik dengan saus bawang putih legendaris, kentang goreng, dan roti roti.',
        amountMinor: 2200, // 22.00 SAR
        currency: 'SAR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-sa-02',
        nameOriginal: 'وجبة ساندوتش فيليه دجاج حراق',
        nameEn: 'Spicy Chicken Fillet Sandwich Combo',
        nameId: 'Burger Fillet Ayam Pedas Albaik Jumbo',
        category: 'Sandwich & Burger',
        sourceDescription: 'Crispy spicy chicken breast in toasted sesame bun with garlic paste and pickles.',
        explainerId: 'Burger fillet dada ayam goreng pedas renyah dengan pasta bawang putih dan acar renyah.',
        amountMinor: 1650, // 16.50 SAR
        currency: 'SAR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-sa-03',
        nameOriginal: 'وجبة جمبري مقرمش',
        nameEn: 'Jumbo Fried Shrimp Meal (10 pcs)',
        nameId: 'Paket Udang Goreng Renyah (10 Ekor)',
        category: 'Seafood',
        sourceDescription: 'Golden crumbed jumbo prawns served with cocktail dip and potato fries.',
        explainerId: '10 ekor udang jumbo goreng renyah saus cocol koktail dan kentang goreng hangat.',
        amountMinor: 2900, // 29.00 SAR
        currency: 'SAR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE, DietaryFlag.SEAFOOD_ONLY],
      },
    ],
  },
  {
    id: 'sa-madinah-najd',
    placeRef: 'pl_sa_najd_02',
    name: 'Al Tazaj Fresh Barbecue Madinah',
    nameOriginal: 'الطازج - طريق الأمير عبدالمجيد المدينة',
    countryIso2: 'SA',
    countryName: 'Arab Saudi',
    cityName: 'Madinah',
    cuisine: 'Fresh Mandi & Charcoal Chicken',
    latitude: 24.4686,
    longitude: 39.6142,
    geohashCell: 'sh22cf',
    address: 'Near Masjid An-Nabawi Northern Courtyard, Madinah',
    googleRating: 4.5,
    reviewCount: 9400,
    tier: HalalTier.CERTIFIED,
    certifierName: 'SFDA Saudi Arabia',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 3400,
    currency: 'SAR',
    phone: '+966 9200 00729',
    openingHours: ['10:00 - 02:00 Setiap Hari'],
    whyHalalExplanation:
      'Daging ayam segar lokal yang dipotong halal setiap hari sesuai syariah di peternakan Al Tazaj Faqieh.',
    evidence: [
      {
        id: 'ev-sa-02',
        sourceType: 'REGISTRY',
        quoteText: 'Direct poultry farm to grill with certified SFDA Islamic slaughter practices.',
        language: 'en',
        retrievedAt: '2026-10-18',
        attributionNotice: 'Saudi Ministry of Commerce & SFDA',
      },
    ],
    menuItems: [
      {
        id: 'm-sa-04',
        nameOriginal: 'فروج مشوي مع الأرز الرزيزة',
        nameEn: 'Charcoal Grilled Baby Chicken with Roz Ruziza',
        nameId: 'Ayam Muda Panggang Arang & Nasi Rempah Kuning',
        category: 'Nasi Mandi & Ayam',
        sourceDescription: 'Tender baby chicken marinated in fresh garlic and sumac, chargrilled on open coals.',
        explainerId: 'Satu ekor ayam muda lembut dibumbui bawang dan sumac, dipanggang arang di atas nasi rempah wangi.',
        amountMinor: 3200,
        currency: 'SAR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 3. SINGAPORE (SG)
  {
    id: 'sg-kampong-zamzam',
    placeRef: 'pl_sg_zamzam_01',
    name: 'Singapore Zam Zam Restaurant (Est. 1908)',
    countryIso2: 'SG',
    countryName: 'Singapura',
    cityName: 'Kampong Glam',
    cuisine: 'Indian Muslim & Murtabak',
    latitude: 1.3023,
    longitude: 103.8589,
    geohashCell: 'w21z7k',
    address: '697-699 North Bridge Road, Kampong Glam, Singapore 198675',
    googleRating: 4.4,
    reviewCount: 11200,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Majlis Ugama Islam Singapura (MUIS)',
    certNumber: 'MUIS-C-2024-887',
    certExpiresAt: '2027-04-30',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 1200, // 12.00 SGD
    currency: 'SGD',
    phone: '+65 6298 6668',
    openingHours: ['07:00 - 23:00 Setiap Hari'],
    whyHalalExplanation:
      'Telah tersertifikasi Halal resmi oleh MUIS Singapura selama puluhan tahun. Restoran Muslim legendaris seberang Masjid Sultan.',
    evidence: [
      {
        id: 'ev-sg-01',
        sourceType: 'REGISTRY',
        quoteText: 'Singapore Zam Zam certified Halal by MUIS Singapore under Eating Establishment scheme.',
        language: 'en',
        retrievedAt: '2026-10-19',
        attributionNotice: 'MUIS Halal Directory Verification',
      },
    ],
    menuItems: [
      {
        id: 'm-sg-01',
        nameOriginal: 'Signature Mutton Murtabak (Medium)',
        nameEn: 'Classic Mutton Murtabak with Curry Gravy',
        nameId: 'Martabak Daging Kambing Khas Zam Zam',
        category: 'Murtabak Legendaris',
        sourceDescription: 'Hand-stretched roti pastry filled with minced spiced mutton, egg, and onions, with rich dalcha curry.',
        explainerId: 'Martabak gurih renyah isi daging kambing bumbu rempah melimpah disajikan dengan kuah kari khas.',
        amountMinor: 1100, // 11.00 SGD
        currency: 'SGD',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-sg-02',
        nameOriginal: 'Chicken Dum Biryani',
        nameEn: 'Aromatic Chicken Dum Biryani with Achar',
        nameId: 'Nasi Biryani Ayam Rempah & Acar',
        category: 'Nasi Biryani',
        sourceDescription: 'Basmati rice cooked in fragrant saffron and ghee served with tender curry chicken thigh.',
        explainerId: 'Nasi basmati bumbu rempah kapulaga saffron dengan potongan paha ayam empuk dan saus kari kental.',
        amountMinor: 1000,
        currency: 'SGD',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 4. MALAYSIA (MY)
  {
    id: 'my-kl-villagepark',
    placeRef: 'pl_my_villagepark_01',
    name: 'Village Park Restaurant Damansara',
    countryIso2: 'MY',
    countryName: 'Malaysia',
    cityName: 'Kuala Lumpur',
    cuisine: 'Nasi Lemak & Malaysian Heritage',
    latitude: 3.1362,
    longitude: 101.6231,
    geohashCell: 'w281r8',
    address: '5 Jalan SS 21/37, Damansara Utama, 47400 Petaling Jaya, Selangor',
    googleRating: 4.5,
    reviewCount: 16800,
    tier: HalalTier.CLAIMED,
    certifierName: 'Bahan Baku Bersertifikat JAKIM (Muslim-friendly)',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 1600, // 16.00 MYR
    currency: 'MYR',
    phone: '+60 12-273 8438',
    openingHours: ['06:30 - 17:30 Setiap Hari'],
    whyHalalExplanation:
      'Dapur bebas babi dan alkohol (Pork-Free / Alcohol-Free). Seluruh ayam dan daging dipasok dari suplier bersertifikat JAKIM Malaysia.',
    evidence: [
      {
        id: 'ev-my-01',
        sourceType: 'RESTAURANT_WEBSITE',
        quoteText: 'All chicken and meats are 100% sourced from JAKIM-certified halal poultry suppliers. No pork, lard, or alcohol used on premises.',
        language: 'en',
        retrievedAt: '2026-10-18',
        attributionNotice: 'Village Park Official Declaration',
      },
    ],
    menuItems: [
      {
        id: 'm-my-01',
        nameOriginal: 'Nasi Lemak Ayam Goreng Berempah',
        nameEn: 'Signature Nasi Lemak with Spiced Fried Chicken',
        nameId: 'Nasi Lemak Gurih Ayam Goreng Berempah',
        category: 'Nasi Lemak',
        sourceDescription: 'Fluffy santan coconut rice with crispy spiced fried chicken, sambal manis-pedas, anchovies, and egg.',
        explainerId: 'Nasi uduk kelapa wangi dengan paha ayam goreng bumbu serundeng renyah dan sambal khas Malaysia.',
        amountMinor: 1450,
        currency: 'MYR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 5. SOUTH KOREA (KR)
  {
    id: 'kr-seoul-halalkitchen',
    placeRef: 'pl_kr_halalkitchen_01',
    name: 'Halal Kitchen Korea Samcheong-dong',
    nameOriginal: '할랄키친 코리아 북촌삼청점',
    countryIso2: 'KR',
    countryName: 'Korea Selatan',
    cityName: 'Seoul',
    cuisine: 'Korean Traditional & BBQ',
    latitude: 37.5828,
    longitude: 126.9835,
    geohashCell: 'wydm6u',
    address: '86-4 Samcheong-ro, Jongno-gu, Seoul',
    googleRating: 4.8,
    reviewCount: 980,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Korea Muslim Federation (KMF)',
    certNumber: 'KMF-HC-2024-118',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 22000, // 22,000 KRW
    currency: 'KRW',
    phone: '+82 2-730-8889',
    openingHours: ['12:00 - 15:00, 17:00 - 21:00 (Tutup Selasa)'],
    whyHalalExplanation:
      'Pemilik Muslim Korea asli dengan sertifikat Halal resmi KMF. Menyajikan masakan otentik Korea di rumah tradisional Hanok.',
    evidence: [
      {
        id: 'ev-kr-01',
        sourceType: 'REGISTRY',
        quoteText: 'Korea Muslim Federation Halal Certification Registry 2024. Halal Kitchen Korea officially listed.',
        language: 'en',
        retrievedAt: '2026-10-14',
        attributionNotice: 'KMF Seoul Central Registry',
      },
    ],
    menuItems: [
      {
        id: 'm-kr-01',
        nameOriginal: '소불고기 정식',
        nameEn: 'Halal Beef Bulgogi Hanok Set',
        nameId: 'Paket Bulgogi Daging Sapi Halal',
        category: 'Korean BBQ',
        sourceDescription: 'Thinly sliced halal Korean beef marinated in sweet soy and pear juice, served with 6 banchan side dishes.',
        explainerId: 'Daging sapi bulgogi manis gurih lembut dengan paket 6 macam lauk banchan khas Korea dan nasi hangat.',
        amountMinor: 22000,
        currency: 'KRW',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-kr-02',
        nameOriginal: '할랄 닭볶음탕',
        nameEn: 'Halal Dakbokkeumtang (Spicy Braised Chicken)',
        nameId: 'Sup Ayam Pedas Rebus Kentang (Dakbokkeumtang)',
        category: 'Tradisional Korea',
        sourceDescription: 'Spicy chicken stew with tender potatoes, carrots, and sweet gochujang chili broth.',
        explainerId: 'Rebusan ayam bumbu gochujang pedas khas Korea dengan kentang lembut dan sayuran segar.',
        amountMinor: 25000,
        currency: 'KRW',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 6. TURKEY (TR)
  {
    id: 'tr-istanbul-sultanahmet',
    placeRef: 'pl_tr_kofte_01',
    name: 'Tarihi Sultanahmet Koftecisi Selim Usta',
    nameOriginal: 'Tarihi Sultanahmet Köftecisi (1920)',
    countryIso2: 'TR',
    countryName: 'Turki',
    cityName: 'Istanbul',
    cuisine: 'Turkish Grill & Kofte',
    latitude: 41.0082,
    longitude: 28.9774,
    geohashCell: 'sxk97c',
    address: 'Divanyolu Cad. No:12 Sultanahmet, Fatih, Istanbul',
    googleRating: 4.6,
    reviewCount: 14900,
    tier: HalalTier.CERTIFIED,
    certifierName: 'GIMDES Halal Turkey',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 38000, // 380.00 TRY
    currency: 'TRY',
    phone: '+90 212 520 05 66',
    openingHours: ['10:30 - 23:00 Setiap Hari'],
    whyHalalExplanation:
      'Tradisi 100 tahun menyajikan kofte daging sapi Turki murni 100% Halal tanpa alkohol di lokasi bersejarah Sultanahmet.',
    evidence: [
      {
        id: 'ev-tr-01',
        sourceType: 'REGISTRY',
        quoteText: 'Full compliance with Turkish GIMDES Halal meat production standard and alcohol-free premises.',
        language: 'en',
        retrievedAt: '2026-10-11',
        attributionNotice: 'GIMDES Turkey Food Authority',
      },
    ],
    menuItems: [
      {
        id: 'm-tr-01',
        nameOriginal: 'Tarihi Sultanahmet Izgara Köfte',
        nameEn: 'Historic Grilled Meatballs with Piyaz Salad',
        nameId: 'Bakso Panggang Daging Sapi Turki & Salad Piyaz',
        category: 'Izgara / Grill',
        sourceDescription: 'Charcoal-grilled minced beef patties served with white bean salad, fresh tomatoes, and spicy biber pepper.',
        explainerId: 'Daging cincang sapi panggang arang gurih disajikan dengan salad kacang putih piyaz dan cabai panggang.',
        amountMinor: 36000,
        currency: 'TRY',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 7. UNITED KINGDOM (GB)
  {
    id: 'gb-london-dishoom',
    placeRef: 'pl_gb_dishoom_01',
    name: 'Dishoom Covent Garden',
    countryIso2: 'GB',
    countryName: 'Inggris (UK)',
    cityName: 'London',
    cuisine: 'Bombay Cafe & Grill',
    latitude: 51.5126,
    longitude: -0.1264,
    geohashCell: 'gcpvhc',
    address: '12 Upper St Martins Lane, Covent Garden, London WC2H 9FB',
    googleRating: 4.7,
    reviewCount: 15400,
    tier: HalalTier.OPTIONS,
    certifierName: 'Halal Food Authority (HFA) Sourced',
    dietaryFlags: [DietaryFlag.PORK_FREE_COOKWARE, DietaryFlag.SERVES_ALCOHOL],
    averagePriceMinor: 2800, // 28.00 GBP
    currency: 'GBP',
    phone: '+44 20 7420 9320',
    openingHours: ['08:00 - 23:00 Setiap Hari'],
    whyHalalExplanation:
      'Seluruh daging ayam dan domba bersertifikat Halal resmi dari HFA. Peralatan masak untuk daging halal dipisahkan. Catatan: restoran menyajikan minuman beralkohol di bar.',
    evidence: [
      {
        id: 'ev-gb-01',
        sourceType: 'RESTAURANT_WEBSITE',
        quoteText: 'All chicken and lamb across all Dishoom locations is certified Halal by accredited UK suppliers.',
        language: 'en',
        retrievedAt: '2026-10-16',
        attributionNotice: 'Dishoom Official Dietary Guide',
      },
    ],
    menuItems: [
      {
        id: 'm-gb-01',
        nameOriginal: 'Dishoom Chicken Ruby Curry',
        nameEn: 'Tender Chicken Ruby in Velvety Spiced Makhani',
        nameId: 'Kari Ayam Ruby Makhani Khas Dishoom',
        category: 'Ruby Murgh',
        sourceDescription: 'Tender halal chicken thigh in a rich, silky makhani tomato gravy simmered with fenugreek.',
        explainerId: 'Potongan ayam halal empuk dalam kuah kari tomat butter makhani aromatik dengan rempah kapulaga.',
        amountMinor: 1650,
        currency: 'GBP',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
      {
        id: 'm-gb-02',
        nameOriginal: 'House Black Daal',
        nameEn: 'Slow-Cooked House Black Daal',
        nameId: 'Daal Hitam Rempah Dimasak 24 Jam',
        category: 'Vegetarian Legend',
        sourceDescription: 'Dark, rich, deeply flavored lentils slow-cooked for 24 hours with butter and cream.',
        explainerId: 'Kacang miju hitam yang dimasak perlahan 24 jam dengan mentega dan rempah khas Bombay.',
        amountMinor: 950,
        currency: 'GBP',
        isHalal: true,
        flags: [DietaryFlag.VEGETARIAN, DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 8. UNITED ARAB EMIRATES (AE)
  {
    id: 'ae-dubai-alsafadi',
    placeRef: 'pl_ae_alsafadi_01',
    name: 'Al Safadi Lebanese Restaurant Sheikh Zayed Rd',
    countryIso2: 'AE',
    countryName: 'Uni Emirat Arab',
    cityName: 'Dubai',
    cuisine: 'Lebanese & Charcoal Grills',
    latitude: 25.2048,
    longitude: 55.2708,
    geohashCell: 'thrn88',
    address: 'Trade Centre 1, Sheikh Zayed Road, Dubai',
    googleRating: 4.6,
    reviewCount: 8200,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Dubai Municipality Halal Control',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 8500, // 85.00 AED
    currency: 'AED',
    phone: '+971 600 500601',
    openingHours: ['09:00 - 02:00 Setiap Hari'],
    whyHalalExplanation:
      'Seluruh operasional diawasi oleh Dubai Municipality Islamic Affairs. Bebas alkohol 100%.',
    evidence: [
      {
        id: 'ev-ae-01',
        sourceType: 'REGISTRY',
        quoteText: 'Full compliance with UAE Food Safety and Dubai Municipality Halal standards.',
        language: 'en',
        retrievedAt: '2026-10-18',
        attributionNotice: 'Dubai Municipality Food Safety Dept',
      },
    ],
    menuItems: [
      {
        id: 'm-ae-01',
        nameOriginal: 'مشاوي مشكلة الصفاوي',
        nameEn: 'Al Safadi Mixed Grill Platter',
        nameId: 'Platter Sate Panggang Campur Lebanon',
        category: 'Lebanese Grill',
        sourceDescription: 'Shish taouk, lamb kebab, and tender beef tikka served on biwaz bread with garlic dip.',
        explainerId: 'Sate ayam shish taouk dan sate daging domba panggang arang disajikan dengan roti lebanon dan saus bawang putih.',
        amountMinor: 8200,
        currency: 'AED',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 9. THAILAND (TH)
  {
    id: 'th-bkk-yana',
    placeRef: 'pl_th_yana_01',
    name: 'Yana Restaurant Halal Thai MBK Center',
    countryIso2: 'TH',
    countryName: 'Thailand',
    cityName: 'Bangkok',
    cuisine: 'Halal Authentic Thai Food',
    latitude: 13.7443,
    longitude: 100.5298,
    geohashCell: 'w4rqpw',
    address: 'MBK Center 5th Floor, Tokyu Side, Pathum Wan, Bangkok 10330',
    googleRating: 4.5,
    reviewCount: 3400,
    tier: HalalTier.CERTIFIED,
    certifierName: 'The Central Islamic Committee of Thailand (CICOT)',
    certNumber: 'CICOT-HL-8821',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 28000, // 280.00 THB
    currency: 'THB',
    phone: '+66 2 611 4589',
    openingHours: ['10:30 - 21:00 Setiap Hari'],
    whyHalalExplanation:
      'Sertifikat Halal resmi dari Central Islamic Committee of Thailand (CICOT). Lokasi strategis di MBK Bangkok bagi wisatawan Muslim.',
    evidence: [
      {
        id: 'ev-th-01',
        sourceType: 'REGISTRY',
        quoteText: 'Official CICOT Halal certification registered for Yana Thai Restaurant Bangkok.',
        language: 'en',
        retrievedAt: '2026-10-15',
        attributionNotice: 'CICOT Thailand Halal Directory',
      },
    ],
    menuItems: [
      {
        id: 'm-th-01',
        nameOriginal: 'ต้มยำกุ้งน้ำข้น ฮาลาล',
        nameEn: 'Authentic Halal Tom Yum Goong Nam Khon',
        nameId: 'Tom Yum Udang Segar Kuah Santan Kental',
        category: 'Sup Tradisional Thai',
        sourceDescription: 'Spicy and sour lemongrass soup with fresh river prawns, galangal, lime leaves, and evaporated milk.',
        explainerId: 'Sup tom yum segar dengan udang besar, serai, daun jeruk, dan cabai rawit pedas asam khas Bangkok.',
        amountMinor: 26000,
        currency: 'THB',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 10. HONG KONG (HK)
  {
    id: 'hk-wanchai-islamic',
    placeRef: 'pl_hk_islamic_01',
    name: 'Islamic Centre Canteen Wan Chai',
    nameOriginal: '伊斯蘭中心餐廳 (灣仔)',
    countryIso2: 'HK',
    countryName: 'Hong Kong',
    cityName: 'Wan Chai',
    cuisine: 'Halal Dim Sum & Cantonese',
    latitude: 22.2774,
    longitude: 114.1788,
    geohashCell: 'wecp7n',
    address: '5/F, Masjid Ammar & Osman Ramju Sadick Islamic Centre, 40 Oi Kwan Rd, Wan Chai',
    googleRating: 4.6,
    reviewCount: 3950,
    tier: HalalTier.CERTIFIED,
    certifierName: 'The Incorporated Trustees of the Islamic Community Fund of HK',
    certNumber: 'HK-IC-9901',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 9500, // 95.00 HKD
    currency: 'HKD',
    phone: '+852 2834 8218',
    openingHours: ['10:00 - 15:00 (Dim Sum), 18:00 - 21:00 (Cantonese Dinner)'],
    whyHalalExplanation:
      'Pusat dim sum halal legendaris yang berada langsung di gedung Masjid Ammar Wan Chai, bersertifikat resmi komunitas Islam Hong Kong.',
    evidence: [
      {
        id: 'ev-hk-01',
        sourceType: 'REGISTRY',
        quoteText: 'Operating inside Masjid Ammar under Islamic Community Fund of Hong Kong supervision.',
        language: 'en',
        retrievedAt: '2026-10-12',
        attributionNotice: 'Islamic Community Fund of Hong Kong',
      },
    ],
    menuItems: [
      {
        id: 'm-hk-01',
        nameOriginal: '清真鮮蝦餃 (4件)',
        nameEn: 'Halal Steamed Har Gow Shrimp Dumplings',
        nameId: 'Dim Sum Hakau Udang Halal (4 Pcs)',
        category: 'Dim Sum Halal',
        sourceDescription: 'Translucent steamed crystal pastry filled with plump fresh shrimp and bamboo shoots.',
        explainerId: 'Kulit hakau transparan lembut dengan isian udang segar kenyal kukus bebas babi.',
        amountMinor: 3800,
        currency: 'HKD',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 11. TAIWAN (TW)
  {
    id: 'tw-taipei-chang',
    placeRef: 'pl_tw_chang_01',
    name: 'Chang Beef Noodle Restaurant Halal Taipei',
    nameOriginal: '清真黃牛肉麵館 (延平南路)',
    countryIso2: 'TW',
    countryName: 'Taiwan',
    cityName: 'Taipei',
    cuisine: 'Taiwanese Halal Beef Noodle',
    latitude: 25.0441,
    longitude: 121.5098,
    geohashCell: 'wsqqqv',
    address: 'No. 23 Yanping South Road, Zhongzheng District, Taipei City',
    googleRating: 4.4,
    reviewCount: 2100,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Chinese Muslim Association Taiwan (CMA)',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 21000, // 210.00 TWD
    currency: 'TWD',
    phone: '+886 2 2331 8203',
    openingHours: ['10:00 - 20:00 Setiap Hari'],
    whyHalalExplanation:
      'Sertifikat Halal resmi dari Chinese Muslim Association (CMA) Taiwan. Menggunakan daging sapi lokal segar yang disembelih sesuai syariat.',
    evidence: [
      {
        id: 'ev-tw-01',
        sourceType: 'REGISTRY',
        quoteText: 'Chinese Muslim Association Certified Halal Restaurant Taipei Registry.',
        language: 'en',
        retrievedAt: '2026-10-13',
        attributionNotice: 'CMA Taiwan Halal Portal',
      },
    ],
    menuItems: [
      {
        id: 'm-tw-01',
        nameOriginal: '清燉牛肉麵 (手工拉麵)',
        nameEn: 'Clear-Broth Braised Halal Beef Noodle Soup',
        nameId: 'Mie Daging Sapi Kuah Bening Khas Taipei',
        category: 'Mie Daging Sapi',
        sourceDescription: 'Handmade wheat noodles with tender beef shank slices in a slow-simmered herbal clear bone broth.',
        explainerId: 'Mie kenyal kuah kaldu sapi bening dengan potongan daging sengkel empuk beraroma jahe dan rempah.',
        amountMinor: 20000,
        currency: 'TWD',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 12. AUSTRALIA (AU)
  {
    id: 'au-sydney-fishmarket',
    placeRef: 'pl_au_sydney_01',
    name: 'Sydney Fish Market Halal Oyster & Seafood Bar',
    countryIso2: 'AU',
    countryName: 'Australia',
    cityName: 'Sydney',
    cuisine: 'Fresh Australian Seafood',
    latitude: -33.8722,
    longitude: 151.1917,
    geohashCell: 'r3gx27',
    address: 'Bank St, Pyrmont NSW 2009, Sydney',
    googleRating: 4.6,
    reviewCount: 22100,
    tier: HalalTier.OPTIONS,
    certifierName: 'Halal Certified Batter & Dedicated Seafood Fryer',
    dietaryFlags: [DietaryFlag.PORK_FREE, DietaryFlag.SEAFOOD_ONLY],
    averagePriceMinor: 3500, // 35.00 AUD
    currency: 'AUD',
    phone: '+61 2 9004 1100',
    openingHours: ['07:00 - 16:30 Setiap Hari'],
    whyHalalExplanation:
      'Penggorengan khusus ikan dan kerang dengan minyak nabati tanpa lemak hewani. Tersedia pilihan sashimi tiram segar dan salmon liar Australia.',
    evidence: [
      {
        id: 'ev-au-01',
        sourceType: 'VERIFIED_REVIEW',
        quoteText: 'Designated 100% vegetable oil fryers and alcohol-free batter confirmed by Sydney Muslim Travelers Guide.',
        language: 'en',
        retrievedAt: '2026-10-11',
        attributionNotice: 'Sydney Halal Travelers Review Registry',
      },
    ],
    menuItems: [
      {
        id: 'm-au-01',
        nameOriginal: 'Wild Australian Barramundi & Chips',
        nameEn: 'Crispy Grilled Australian Barramundi with Chips',
        nameId: 'Ikan Barramundi Panggang Segar & Kentang Goreng',
        category: 'Fresh Seafood',
        sourceDescription: 'Grilled fresh wild Australian barramundi fillet with lemon herb seasoning and rustic chips.',
        explainerId: 'Fillet ikan barramundi liar segar panggang gurih disajikan dengan kentang goreng garing dan lemon.',
        amountMinor: 2850,
        currency: 'AUD',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE, DietaryFlag.SEAFOOD_ONLY],
      },
    ],
  },

  // 13. FRANCE (FR)
  {
    id: 'fr-paris-lebutcher',
    placeRef: 'pl_fr_butcher_01',
    name: 'Le Butcher Gourmet Halal Burger Paris',
    countryIso2: 'FR',
    countryName: 'Prancis',
    cityName: 'Paris',
    cuisine: 'French Gourmet Burgers',
    latitude: 48.8712,
    longitude: 2.3087,
    geohashCell: 'u09wjn',
    address: '157 Rue du Faubourg Saint-Honoré, 75008 Paris',
    googleRating: 4.6,
    reviewCount: 3100,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Association Rituelle de la Grande Mosquée de Paris',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 2200, // 22.00 EUR
    currency: 'EUR',
    phone: '+33 1 47 42 76 14',
    openingHours: ['11:30 - 23:00 Setiap Hari'],
    whyHalalExplanation:
      'Daging sapi Charolais Prancis bersertifikat Halal resmi dari Masjid Agung Paris. Seluruh saus dan keju bebas rennet hewani non-halal.',
    evidence: [
      {
        id: 'ev-fr-01',
        sourceType: 'REGISTRY',
        quoteText: 'Certified 100% Halal beef and poultry certified under Grande Mosquée de Paris authority.',
        language: 'en',
        retrievedAt: '2026-10-17',
        attributionNotice: 'Mosquée de Paris Halal Certification',
      },
    ],
    menuItems: [
      {
        id: 'm-fr-01',
        nameOriginal: 'Le Burger Montmartre au Fromage Raclette',
        nameEn: 'Gourmet French Burger with Melted Raclette',
        nameId: 'Burger Sapi Gourmet Prancis Keju Raclette Meleleh',
        category: 'Gourmet Burgers',
        sourceDescription: 'Fresh minced French halal Charolais beef patty, melted raclette cheese, caramelized shallots in brioche.',
        explainerId: 'Daging sapi Charolais cincang panggang dengan lelehan keju raclette khas Prancis dan bawang karamel.',
        amountMinor: 1950,
        currency: 'EUR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 14. GERMANY (DE)
  {
    id: 'de-berlin-mustafa',
    placeRef: 'pl_de_mustafa_01',
    name: "Mustafa's Gemüse Kebap Kreuzberg",
    countryIso2: 'DE',
    countryName: 'Jerman',
    cityName: 'Berlin',
    cuisine: 'Berlin Döner & Grilled Veggies',
    latitude: 52.4939,
    longitude: 13.3879,
    geohashCell: 'u33db1',
    address: 'Mehringdamm 32, 10961 Berlin-Kreuzberg',
    googleRating: 4.7,
    reviewCount: 28400,
    tier: HalalTier.CLAIMED,
    certifierName: 'Halal Certified German Poultry Supplier',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 850, // 8.50 EUR
    currency: 'EUR',
    phone: '+49 30 1234567',
    openingHours: ['10:00 - 02:00 Setiap Hari'],
    whyHalalExplanation:
      'Döner sayur ayam panggang legendaris Berlin. Ayam dipasok dari produsen bersertifikat Halal Jerman, tidak menjual olahan babi.',
    evidence: [
      {
        id: 'ev-de-01',
        sourceType: 'RESTAURANT_WEBSITE',
        quoteText: 'Halal certified chicken kebab served with freshly roasted Mediterranean vegetables and feta.',
        language: 'en',
        retrievedAt: '2026-10-12',
        attributionNotice: 'Mustafas Döner Berlin Documentation',
      },
    ],
    menuItems: [
      {
        id: 'm-de-01',
        nameOriginal: 'Hähnchen Döner mit Röstgemüse',
        nameEn: "Famous Chicken Döner with Roasted Vegetables & Feta",
        nameId: 'Doner Kebab Ayam Panggang Sayur Kreuzberg',
        category: 'Döner Kebab',
        sourceDescription: 'Warm pita bread filled with shaved spiced chicken, caramelized roasted carrots, potatoes, garlic sauce, and feta.',
        explainerId: 'Roti pita hangat isi irisan daging ayam bumbu rempah, sayuran panggang karamel, dan saus garlic khas Berlin.',
        amountMinor: 850,
        currency: 'EUR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 15. ITALY (IT)
  {
    id: 'it-rome-vatican',
    placeRef: 'pl_it_rome_01',
    name: 'Luna Caprese Halal Italian Ristorante Roma',
    countryIso2: 'IT',
    countryName: 'Italia',
    cityName: 'Roma',
    cuisine: 'Authentic Italian Pasta & Pizza',
    latitude: 41.9056,
    longitude: 12.4578,
    geohashCell: 'sr2yk9',
    address: 'Via Candia 24, near Vatican Museums, 00192 Roma',
    googleRating: 4.5,
    reviewCount: 1650,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Halal Italia Authority (Zabiha)',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 2400, // 24.00 EUR
    currency: 'EUR',
    phone: '+39 06 3973 2210',
    openingHours: ['11:30 - 23:30 Setiap Hari'],
    whyHalalExplanation:
      'Masakan otentik Italia (Pizza oven kayu & Pasta segar) dengan sertifikasi Halal Italia. Bebas alkohol dan tanpa daging babi.',
    evidence: [
      {
        id: 'ev-it-01',
        sourceType: 'REGISTRY',
        quoteText: 'Certified 100% Halal Italian Kitchen with zero alcohol in food preparation.',
        language: 'en',
        retrievedAt: '2026-10-16',
        attributionNotice: 'Halal Italia Central Register',
      },
    ],
    menuItems: [
      {
        id: 'm-it-01',
        nameOriginal: 'Pizza Margherita Verace con Mozzarella di Bufala',
        nameEn: 'Authentic Wood-Fired Buffalo Mozzarella Pizza',
        nameId: 'Pizza Margherita Oven Kayu Mozzarella Kerbau',
        category: 'Pizza Italia',
        sourceDescription: 'Wood-fired sourdough base with San Marzano tomatoes, fresh buffalo mozzarella, and fresh basil.',
        explainerId: 'Pizza sourdough panggang kayu dengan saus tomat San Marzano manis alami, keju mozzarella segar, dan daun basil.',
        amountMinor: 1400,
        currency: 'EUR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE, DietaryFlag.VEGETARIAN],
      },
    ],
  },

  // 16. NETHERLANDS (NL)
  {
    id: 'nl-amsterdam-kartika',
    placeRef: 'pl_nl_kartika_01',
    name: 'Restaurant Kartika Halal Indonesian Amsterdam',
    countryIso2: 'NL',
    countryName: 'Belanda',
    cityName: 'Amsterdam',
    cuisine: 'Indonesian Rijsttafel & Grill',
    latitude: 52.3614,
    longitude: 4.8812,
    geohashCell: 'u173zp',
    address: 'Overtoom 299, 1054 HW Amsterdam',
    googleRating: 4.7,
    reviewCount: 2400,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Halal Quality Control (HQC) Netherlands',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 3200, // 32.00 EUR
    currency: 'EUR',
    phone: '+31 20 618 3145',
    openingHours: ['16:00 - 22:30 (Tutup Senin)'],
    whyHalalExplanation:
      'Rijsttafel Indonesia otentik bersertifikat HQC Belanda. Daging sapi dan ayam 100% bersertifikat Halal disukai para diplomat dan wisatawan.',
    evidence: [
      {
        id: 'ev-nl-01',
        sourceType: 'REGISTRY',
        quoteText: 'Halal Quality Control (HQC) Netherlands certified Indonesian dining establishment.',
        language: 'en',
        retrievedAt: '2026-10-14',
        attributionNotice: 'HQC Netherlands Verification',
      },
    ],
    menuItems: [
      {
        id: 'm-nl-01',
        nameOriginal: 'Kartika Royal Halal Rijsttafel (12 Gerechten)',
        nameEn: 'Royal Indonesian Rijsttafel Feast (12 Dishes)',
        nameId: 'Paket Rijsttafel Lengkap 12 Masakan Nusantara',
        category: 'Rijsttafel',
        sourceDescription: 'Rendang daging sapi, ayam bumbu rujak, sate ayam kacang, gado-gado, sayur lodeh, dan sambal goreng.',
        explainerId: 'Pesta hidangan 12 jenis masakan tradisional Indonesia lengkap dengan rendang empuk, sate, dan sambal ulek.',
        amountMinor: 3450,
        currency: 'EUR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 17. SWITZERLAND (CH)
  {
    id: 'ch-zurich-bebek',
    placeRef: 'pl_ch_bebek_01',
    name: 'Restaurant Bebek Halal Zurich',
    countryIso2: 'CH',
    countryName: 'Swiss',
    cityName: 'Zurich',
    cuisine: 'Mediterranean & Swiss Halal Meze',
    latitude: 47.3739,
    longitude: 8.5218,
    geohashCell: 'u0qj2g',
    address: 'Badenerstrasse 171, 8003 Zürich',
    googleRating: 4.6,
    reviewCount: 3800,
    tier: HalalTier.OPTIONS,
    certifierName: 'Halal Certified Swiss Meat Procurement',
    dietaryFlags: [DietaryFlag.PORK_FREE_COOKWARE, DietaryFlag.SERVES_ALCOHOL],
    averagePriceMinor: 4800, // 48.00 CHF
    currency: 'CHF',
    phone: '+41 44 297 11 00',
    openingHours: ['08:00 - 24:00 Setiap Hari'],
    whyHalalExplanation:
      'Menyajikan menu Mediterania segar dengan daging sapi dan domba bersertifikasi Halal lokal Swiss. Tersedia bar terpisah.',
    evidence: [
      {
        id: 'ev-ch-01',
        sourceType: 'RESTAURANT_WEBSITE',
        quoteText: 'Lamb and beef sourced exclusively from certified Swiss halal organic butcheries.',
        language: 'en',
        retrievedAt: '2026-10-15',
        attributionNotice: 'Restaurant Bebek Zurich Food Declarations',
      },
    ],
    menuItems: [
      {
        id: 'm-ch-01',
        nameOriginal: 'Swiss Alpine Halal Lamb Tagine',
        nameEn: 'Slow-Braised Alpine Lamb with Dried Apricots & Couscous',
        nameId: 'Tagine Domba Alpin Swiss Rebus Aprikot & Couscous',
        category: 'Main Courses',
        sourceDescription: 'Tender Swiss Alpine lamb shank slow-braised with sweet apricots, almonds, and spiced broth.',
        explainerId: 'Betis domba Alpin Swiss empuk dimasak dengan kuah rempah manis aprikot dan taburan kacang almond.',
        amountMinor: 4200,
        currency: 'CHF',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 18. EGYPT (EG)
  {
    id: 'eg-cairo-aboutarek',
    placeRef: 'pl_eg_aboutarek_01',
    name: 'Koshary Abou Tarek Downtown Cairo',
    nameOriginal: 'كشري أبو طارق - وسط البلد القاهرة',
    countryIso2: 'EG',
    countryName: 'Mesir',
    cityName: 'Kairo',
    cuisine: 'Traditional Egyptian Koshari',
    latitude: 30.0519,
    longitude: 31.2384,
    geohashCell: 'stq4tu',
    address: '16 Marouf, Qasr El Nil, Downtown Cairo',
    googleRating: 4.6,
    reviewCount: 31200,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Egyptian Ministry of Islamic Affairs (Al-Azhar Verified)',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE, DietaryFlag.VEGETARIAN],
    averagePriceMinor: 9500, // 95.00 EGP
    currency: 'EGP',
    phone: '+20 2 25775935',
    openingHours: ['08:00 - 01:00 Setiap Hari'],
    whyHalalExplanation:
      'Hidangan nasional Mesir Koshari legendaris 100% Halal dan nabati. Terjamin halal dan menjadi tujuan utama wisatawan Muslim dunia.',
    evidence: [
      {
        id: 'ev-eg-01',
        sourceType: 'REGISTRY',
        quoteText: '100% Egyptian national halal compliance and vegetarian grain preparation.',
        language: 'en',
        retrievedAt: '2026-10-10',
        attributionNotice: 'Al-Azhar Food Verification Dept',
      },
    ],
    menuItems: [
      {
        id: 'm-eg-01',
        nameOriginal: 'كشري أبو طارق المميز بالتقلية المقرمشة',
        nameEn: 'Abou Tarek Special Jumbo Koshari',
        nameId: 'Koshari Khas Mesir Spesial Jumbo Bawang Krispi',
        category: 'Koshari Mesir',
        sourceDescription: 'Layered rice, brown lentils, macaroni, chickpeas, topped with crispy spiced onions and garlic chili vinegar.',
        explainerId: 'Kombinasi nasi, lentil cokelat, makaroni, kacang arab dengan saus tomat rempah dan taburan bawang goreng renyah.',
        amountMinor: 8500,
        currency: 'EGP',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE, DietaryFlag.VEGETARIAN],
      },
    ],
  },

  // 19. MOROCCO (MA)
  {
    id: 'ma-marrakech-nomad',
    placeRef: 'pl_ma_nomad_01',
    name: 'Nomad Rooftop Restaurant Marrakech',
    nameOriginal: 'مطعم نومان - المدينة العتيقة مراكش',
    countryIso2: 'MA',
    countryName: 'Maroko',
    cityName: 'Marrakech',
    cuisine: 'Modern Moroccan & Tagine',
    latitude: 31.6295,
    longitude: -7.9873,
    geohashCell: 'ev3y9p',
    address: '1 Derb Aarjan, Rahba Lakdima, Medina, Marrakech 40000',
    googleRating: 4.5,
    reviewCount: 9200,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Moroccan Ministry of Endowments and Islamic Affairs',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 19000, // 190.00 MAD
    currency: 'MAD',
    phone: '+212 5243-81609',
    openingHours: ['12:00 - 23:00 Setiap Hari'],
    whyHalalExplanation:
      '100% Halal nasional Maroko. Tidak menyajikan alkohol. Masakan khas rempah Atlas dan rempah saffron Maroko.',
    evidence: [
      {
        id: 'ev-ma-01',
        sourceType: 'REGISTRY',
        quoteText: 'Full compliance with Moroccan Islamic Food Regulations and Alcohol-Free premises.',
        language: 'en',
        retrievedAt: '2026-10-17',
        attributionNotice: 'Kingdom of Morocco Islamic Affairs Registry',
      },
    ],
    menuItems: [
      {
        id: 'm-ma-01',
        nameOriginal: 'طاجين لحم الغنم بالبرقوق واللوز',
        nameEn: 'Slow-Cooked Lamb Shank Tagine with Prunes',
        nameId: 'Tagine Daging Domba Rebus Buah Prune & Almond',
        category: 'Tagine Tradisional',
        sourceDescription: 'Braised tender lamb shoulder in terracotta clay pot with sweet prunes, toasted sesame, and roasted almonds.',
        explainerId: 'Daging domba empuk dimasak dalam kuali tanah liat dengan buah prune manis dan taburan almond gurih.',
        amountMinor: 17500,
        currency: 'MAD',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },

  // 20. QATAR (QA)
  {
    id: 'qa-doha-sukarpasha',
    placeRef: 'pl_qa_sukar_01',
    name: 'Sukar Pasha Ottoman Lounge Katara Doha',
    nameOriginal: 'سكر باشا كتارا - الدوحة قطر',
    countryIso2: 'QA',
    countryName: 'Qatar',
    cityName: 'Doha',
    cuisine: 'Ottoman Turkish & Arabian Feast',
    latitude: 25.3578,
    longitude: 51.5245,
    geohashCell: 'thtt3u',
    address: 'Building 31, Katara Cultural Village, Doha',
    googleRating: 4.7,
    reviewCount: 5100,
    tier: HalalTier.CERTIFIED,
    certifierName: 'Qatar Ministry of Municipality and Environment (MME)',
    dietaryFlags: [DietaryFlag.ALCOHOL_FREE, DietaryFlag.PORK_FREE],
    averagePriceMinor: 16000, // 160.00 QAR
    currency: 'QAR',
    phone: '+974 4408 2000',
    openingHours: ['09:00 - 01:00 Setiap Hari'],
    whyHalalExplanation:
      'Seluruh hidangan diawasi ketat oleh otoritas pangan Halal negara Qatar. Terjamin 100% Halal dan bebas alkohol.',
    evidence: [
      {
        id: 'ev-qa-01',
        sourceType: 'REGISTRY',
        quoteText: 'Full Qatar MME Food Quality and National Halal standard verification.',
        language: 'en',
        retrievedAt: '2026-10-18',
        attributionNotice: 'State of Qatar MME Central Registry',
      },
    ],
    menuItems: [
      {
        id: 'm-qa-01',
        nameOriginal: 'مشاوي السلاطين العثمانية الفاخرة',
        nameEn: 'Sultan Ottoman Imperial Mixed Kebabs',
        nameId: 'Kebab Spesial Sultan Panggang Arang Khas Katara',
        category: 'Sultan Grills',
        sourceDescription: 'Charcoal-grilled tender lamb cutlets, chicken shish, and spiced minced Adana kebabs on buttered flatbread.',
        explainerId: 'Potongan iga domba panggang arang, sate ayam rempah, dan kebab Adana disajikan dengan roti mentega hangat.',
        amountMinor: 15500,
        currency: 'QAR',
        isHalal: true,
        flags: [DietaryFlag.PORK_FREE],
      },
    ],
  },
];
