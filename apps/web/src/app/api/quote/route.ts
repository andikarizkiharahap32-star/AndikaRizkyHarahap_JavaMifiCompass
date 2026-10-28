import { NextRequest, NextResponse } from 'next/server';
import { quoteRequestSchema, QuoteResponse } from '@javamifi/shared';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj = {
      dest: searchParams.get('dest') || 'JP',
      days: searchParams.get('days') || '7',
      pax: searchParams.get('pax') || 'solo',
      travelers: searchParams.get('travelers') || '1',
      devices: searchParams.get('devices') || '1',
      startDate: searchParams.get('start') || undefined,
      endDate: searchParams.get('end') || undefined,
      promoCode: searchParams.get('promo') || undefined,
    };

    const parsed = quoteRequestSchema.safeParse(queryObj);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_QUOTE_PARAMETERS',
          message: 'Parameter kalkulasi kuotasi tidak valid',
          details: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    const { dest, days, pax, travelers, devices } = parsed.data;

    const isGroup = pax === 'family' || pax === 'group' || travelers >= 2;

    const wifiDailyTotal = 70_000;
    const wifiTotal = wifiDailyTotal * days;
    const wifiPerPersonDay = Math.round(wifiTotal / (travelers * days));

    const esimDailyPerPerson = 45_000;
    const esimTotal = esimDailyPerPerson * travelers * days;
    const esimPerPersonDay = esimDailyPerPerson;

    let responseData: QuoteResponse;

    if (isGroup) {
      responseData = {
        dest: dest.toUpperCase(),
        days,
        travelers,
        recommendedOption: {
          type: 'WIFI_RENTAL',
          title: 'JavaMifi Pocket WiFi 4G Unlimited',
          pricePerDayIdr: wifiDailyTotal,
          totalEstimatedPriceIdr: wifiTotal,
          pricePerPersonPerDayIdr: wifiPerPersonDay,
          isRecommended: true,
          recommendationReason: `Hemat hingga ${Math.round(((esimTotal - wifiTotal) / esimTotal) * 100)}% untuk rombongan ${travelers} orang dengan 1 Pocket WiFi bersama.`,
          features: [
            'Bisa tethering hingga 5 gadget sekaligus',
            'Baterai tahan 15–20 jam pemakaian aktif',
            'Garansi ganti unit di bandara Soekarno-Hatta & Juanda',
            'Tanpa perlu ganti kartu SIM fisik ponsel',
          ],
        },
        alternativeOptions: [
          {
            type: 'ESIM',
            title: `${travelers}× Digital Travel eSIM Terpisah`,
            pricePerDayIdr: esimDailyPerPerson * travelers,
            totalEstimatedPriceIdr: esimTotal,
            pricePerPersonPerDayIdr: esimPerPersonDay,
            isRecommended: false,
            recommendationReason:
              'Pilihan kartu digital individu jika anggota rombongan sering berpencar.',
            features: [
              'Aktivasi instan via scan QR code',
              'Setiap orang memiliki kuota mandiri',
              'Tanpa perangkat modem tambahan untuk dibawa',
            ],
          },
        ],
        breakEvenDayText: 'Titik Impas Rombongan: 2 Orang (Hari ke-1)',
        breakEvenAnalysis: {
          crossOverGroupSize: 2,
          crossOverDurationDays: 4,
          breakEvenDescription:
            'Untuk rombongan 2+ orang, 1 unit Pocket WiFi langsung lebih hemat sejak hari pertama dibandingkan membeli paket data terpisah.',
        },
        computedAt: new Date().toISOString(),
        cacheTtlSeconds: 300,
      };
    } else {
      responseData = {
        dest: dest.toUpperCase(),
        days,
        travelers: 1,
        recommendedOption: {
          type: 'ESIM',
          title: 'JavaMifi Digital Travel eSIM 4G/5G',
          pricePerDayIdr: esimDailyPerPerson,
          totalEstimatedPriceIdr: esimTotal,
          pricePerPersonPerDayIdr: esimPerPersonDay,
          isRecommended: true,
          recommendationReason:
            'Pilihan paling praktis dan ekonomis untuk 1 orang tanpa perlu membawa modem fisik.',
          features: [
            'Aktivasi instan via scan QR code',
            'Tanpa antre ambil & kembalikan modem di bandara',
            'Tetap bisa menerima SMS perbankan & OTP nomor Indonesia',
            'Koneksi 4G/5G langsung dari operator tier-1 lokal',
          ],
        },
        alternativeOptions: [
          {
            type: 'WIFI_RENTAL',
            title: 'Pocket WiFi 4G Unlimited (1 Unit)',
            pricePerDayIdr: wifiDailyTotal,
            totalEstimatedPriceIdr: wifiTotal,
            pricePerPersonPerDayIdr: wifiDailyTotal,
            isRecommended: false,
            recommendationReason:
              'Opsi router jika membawa laptop kerja atau perangkat tanpa dukungan eSIM.',
            features: [
              'Bisa berbagi koneksi ke laptop & tablet',
              'Baterai cadangan tahan seharian',
              'Dukungan customer service 24 jam',
            ],
          },
        ],
        breakEvenDayText: 'Titik Impas Durasi: Hari ke-4',
        breakEvenAnalysis: {
          crossOverGroupSize: 2,
          crossOverDurationDays: 4,
          breakEvenDescription:
            'Untuk 1 traveler solo, eSIM lebih hemat hingga hari ke-4 tanpa perlu membayar biaya sewa modem fisik.',
        },
        computedAt: new Date().toISOString(),
        cacheTtlSeconds: 300,
      };
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'QUOTE_CALCULATION_FAILED',
        message: 'Gagal menghitung kuotasi harga perjalanan',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = quoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_QUOTE_PARAMETERS',
          message: 'Data formulir kuotasi tidak valid',
          details: parsed.error.format(),
        },
        { status: 400 },
      );
    }

    // Reuse deterministic calculation via internal GET URL parameters
    const params = new URLSearchParams({
      dest: parsed.data.dest,
      days: String(parsed.data.days),
      pax: parsed.data.pax,
      travelers: String(parsed.data.travelers),
      devices: String(parsed.data.devices),
    });

    const getRequest = new NextRequest(new URL(`/api/quote?${params.toString()}`, request.url));
    return GET(getRequest);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'INVALID_JSON_PAYLOAD',
        message: 'Format payload kuotasi tidak valid',
      },
      { status: 400 },
    );
  }
}
