import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding JavaMifi Compass database...');

  // 1. Roles
  const roles = ['SUPER_ADMIN', 'EDITOR', 'OPS', 'FINANCE', 'SUPPORT', 'CUSTOMER'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role for JavaMifi Compass`,
      },
    });
  }

  // 2. Users
  const passwordHash = await argon2.hash('Admin12345!', {
    type: argon2.argon2id,
  });

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const opsRole = await prisma.role.findUnique({ where: { name: 'OPS' } });
  const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@javamifi.com' },
    update: {},
    create: {
      email: 'admin@javamifi.com',
      fullName: 'Super Administrator',
      passwordHash,
      roles: {
        create: { roleId: superAdminRole!.id },
      },
    },
  });

  const opsUser = await prisma.user.upsert({
    where: { email: 'ops@javamifi.com' },
    update: {},
    create: {
      email: 'ops@javamifi.com',
      fullName: 'Logistics Operations Lead',
      passwordHash,
      roles: {
        create: { roleId: opsRole!.id },
      },
    },
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: 'traveler@example.com' },
    update: {},
    create: {
      email: 'traveler@example.com',
      fullName: 'Budi Santoso',
      phone: '+6281234567890',
      passwordHash,
      roles: {
        create: { roleId: customerRole!.id },
      },
    },
  });

  console.log('✅ Created users: admin@javamifi.com, ops@javamifi.com, traveler@example.com');

  // 3. Products
  const wifiProduct = await prisma.product.upsert({
    where: { slug: 'pocket-wifi' },
    update: {},
    create: {
      type: 'WIFI_RENTAL',
      nameId: 'JavaMifi Pocket WiFi',
      nameEn: 'JavaMifi Pocket WiFi Rental',
      slug: 'pocket-wifi',
      descriptionId: 'Sewa modem WiFi portable tanpa batas kuota. Koneksi stabil hingga 5 perangkat sekaligus.',
      descriptionEn: 'Unlimited portable pocket WiFi router. Share high-speed data across 5 devices anywhere.',
      features: ['Unlimited 4G LTE', 'Share up to 5 devices', 'Free delivery & drop-box return', '15-hour battery life'],
      sortOrder: 1,
    },
  });

  const esimProduct = await prisma.product.upsert({
    where: { slug: 'travel-esim' },
    update: {},
    create: {
      type: 'ESIM',
      nameId: 'JavaMifi Travel eSIM',
      nameEn: 'JavaMifi Travel Digital eSIM',
      slug: 'travel-esim',
      descriptionId: 'eSIM digital langsung aktif tanpa kartu fisik. Scan QR langsung internetan saat mendarat.',
      descriptionEn: 'Instant digital eSIM with zero physical logistics. Scan QR and connect the moment you touch down.',
      features: ['100% Digital via QR Code', 'Instant email delivery', 'No airport queue or physical swap', 'Keep primary SIM active'],
      sortOrder: 2,
    },
  });

  const simProduct = await prisma.product.upsert({
    where: { slug: 'travel-sim' },
    update: {},
    create: {
      type: 'SIM_CARD',
      nameId: 'JavaMifi Travel SIM Card',
      nameEn: 'JavaMifi Physical Travel SIM Card',
      slug: 'travel-sim',
      descriptionId: 'Kartu SIM fisik prabayar praktis untuk semua jenis smartphone.',
      descriptionEn: 'Prepaid physical travel SIM card compatible with all unlocked mobile smartphones.',
      features: ['Plug and play', 'Includes SIM ejector tray tool', 'Works on any unlocked device'],
      sortOrder: 3,
    },
  });

  // 4. Destinations
  const destinationsData = [
    {
      countryCode: 'JP',
      nameId: 'Jepang',
      nameEn: 'Japan',
      slug: 'jepang',
      flagEmoji: '🇯🇵',
      callingCode: '+81',
      currency: 'JPY',
      needsVpn: false,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      tipsId: 'Jepang memiliki jaringan 4G/5G sangat kuat bahkan di dalam Shinkansen. Colokan tipe A (2 pin pipih, 100V).',
      tipsEn: 'Ultra-fast nationwide 4G/5G coverage including on bullet trains. Power outlet Type A (100V).',
    },
    {
      countryCode: 'CN',
      nameId: 'China',
      nameEn: 'China',
      slug: 'china',
      flagEmoji: '🇨🇳',
      callingCode: '+86',
      currency: 'CNY',
      needsVpn: true,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
      tipsId: 'Aplikasi Google, WhatsApp, Instagram diblokir. JavaMifi WiFi menyertakan VPN aktif otomatis tanpa setting rumit.',
      tipsEn: 'Google, WhatsApp and Instagram restricted. JavaMifi devices include automated VPN bypass built-in.',
    },
    {
      countryCode: 'SA',
      nameId: 'Arab Saudi (Umrah & Haji)',
      nameEn: 'Saudi Arabia (Umrah & Hajj)',
      slug: 'arab-saudi-umrah',
      flagEmoji: '🇸🇦',
      callingCode: '+966',
      currency: 'SAR',
      needsVpn: false,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
      tipsId: 'Sangat direkomendasikan paket WiFi untuk jemaah keluarga atau rombongan Umrah agar tetap terhubung di Makkah & Madinah.',
      tipsEn: 'Pocket WiFi is the best choice for pilgrim families sharing 1 device in Mecca & Medina.',
    },
    {
      countryCode: 'SG',
      nameId: 'Singapura',
      nameEn: 'Singapore',
      slug: 'singapura',
      flagEmoji: '🇸🇬',
      callingCode: '+65',
      currency: 'SGD',
      needsVpn: false,
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      tipsId: 'Cakupan 5G menyeluruh. eSIM digital sangat praktis untuk perjalanan singkat.',
      tipsEn: 'Comprehensive 5G coverage island-wide. Digital eSIM is optimal for short city breaks.',
    },
  ];

  const destinationMap = new Map<string, string>();
  for (const d of destinationsData) {
    const dest = await prisma.destination.upsert({
      where: { countryCode: d.countryCode },
      update: {},
      create: d,
    });
    destinationMap.set(d.countryCode, dest.id);
  }

  // 5. Plans
  await prisma.plan.upsert({
    where: { slug: 'wifi-japan-unlimited' },
    update: {},
    create: {
      productId: wifiProduct.id,
      destinationId: destinationMap.get('JP'),
      nameId: 'Pocket WiFi Jepang Unlimited 4G',
      nameEn: 'Pocket WiFi Japan Unlimited 4G',
      slug: 'wifi-japan-unlimited',
      priceIdr: 70_000,
      pricingType: 'PER_DAY',
      maxDevices: 5,
      depositIdr: 500_000,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'esim-japan-5gb' },
    update: {},
    create: {
      productId: esimProduct.id,
      destinationId: destinationMap.get('JP'),
      nameId: 'eSIM Jepang 5GB 15 Hari',
      nameEn: 'eSIM Japan 5GB 15 Days',
      slug: 'esim-japan-5gb',
      priceIdr: 185_000,
      pricingType: 'PER_PACKAGE',
      durationDays: 15,
      dataLimitMb: 5120,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'wifi-china-vpn-unlimited' },
    update: {},
    create: {
      productId: wifiProduct.id,
      destinationId: destinationMap.get('CN'),
      nameId: 'Pocket WiFi China Unlimited + Free VPN',
      nameEn: 'Pocket WiFi China Unlimited + Built-in VPN',
      slug: 'wifi-china-vpn-unlimited',
      priceIdr: 95_000,
      pricingType: 'PER_DAY',
      maxDevices: 5,
      includesVpn: true,
      depositIdr: 500_000,
    },
  });

  await prisma.plan.upsert({
    where: { slug: 'wifi-umrah-family' },
    update: {},
    create: {
      productId: wifiProduct.id,
      destinationId: destinationMap.get('SA'),
      nameId: 'Pocket WiFi Umrah Barokah Family',
      nameEn: 'Pocket WiFi Umrah Pilgrim Family Shared',
      slug: 'wifi-umrah-family',
      priceIdr: 85_000,
      pricingType: 'PER_DAY',
      maxDevices: 5,
      depositIdr: 500_000,
    },
  });

  // 6. Journey Presets
  await prisma.journeyPreset.upsert({
    where: { slug: 'umrah-barokah' },
    update: {},
    create: {
      slug: 'umrah-barokah',
      nameId: 'Paket Umrah Barokah (9 - 12 Hari)',
      nameEn: 'Umrah Pilgrimage Package (9 - 12 Days)',
      descriptionId: 'Dirancang khusus untuk jemaah Umrah bersama keluarga. 1 modem WiFi menghubungkan hingga 5 ponsel.',
      descriptionEn: 'Curated for pilgrim families. Share one Pocket WiFi across phones with zero roaming surprises.',
      imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
      destinations: ['SA'],
      defaultDays: 10,
      defaultUsage: 'MODERATE',
      sortOrder: 1,
    },
  });

  await prisma.journeyPreset.upsert({
    where: { slug: 'japan-cherry-blossom' },
    update: {},
    create: {
      slug: 'japan-cherry-blossom',
      nameId: 'Jelajah Tokyo & Kyoto (7 Hari)',
      nameEn: 'Tokyo & Kyoto Explorer (7 Days)',
      descriptionId: 'Liburan seru ke Jepang dengan koneksi super cepat di stasiun bawah tanah dan kereta peluru Shinkansen.',
      descriptionEn: 'High-speed unlimited connection across Tokyo, Osaka and Kyoto Shinkansen lines.',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      destinations: ['JP'],
      defaultDays: 7,
      defaultUsage: 'HEAVY',
      sortOrder: 2,
    },
  });

  await prisma.journeyPreset.upsert({
    where: { slug: 'china-vpn-ready' },
    update: {},
    create: {
      slug: 'china-vpn-ready',
      nameId: 'China VPN-Ready Explorer (8 Hari)',
      nameEn: 'China VPN-Ready Explorer (8 Days)',
      descriptionId: 'Jelajah Beijing dan Shanghai tetap terhubung WhatsApp dan media sosial tanpa kendala firewall.',
      descriptionEn: 'Stay connected to WhatsApp, Instagram & Google seamlessly across China with pre-configured VPN.',
      imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
      destinations: ['CN'],
      defaultDays: 8,
      defaultUsage: 'WORK',
      needsVpn: true,
      sortOrder: 3,
    },
  });

  // 7. Promo Codes
  await prisma.promoCode.upsert({
    where: { code: 'ANTISUSAHSINYAL' },
    update: {},
    create: {
      code: 'ANTISUSAHSINYAL',
      descriptionId: 'Diskon 15% untuk semua pemesanan WiFi dan eSIM',
      descriptionEn: '15% discount for all connectivity reservations',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      maxDiscountIdr: 50_000,
      minOrderIdr: 100_000,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-12-31'),
    },
  });

  await prisma.promoCode.upsert({
    where: { code: 'HEMAT50K' },
    update: {},
    create: {
      code: 'HEMAT50K',
      descriptionId: 'Potongan langsung Rp 50.000',
      descriptionEn: 'Direct Rp 50,000 cash discount',
      discountType: 'FIXED_AMOUNT',
      discountValue: 50_000,
      minOrderIdr: 250_000,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-12-31'),
    },
  });

  // 8. Device Inventory (10 Pocket WiFi units)
  for (let i = 1; i <= 10; i++) {
    const serialNumber = `JMF-WIFI-${i.toString().padStart(3, '0')}`;
    await prisma.device.upsert({
      where: { serialNumber },
      update: {},
      create: {
        serialNumber,
        model: 'JavaMifi 4G Global Touch V3',
        status: i <= 2 ? 'IN_USE' : i === 3 ? 'PREPARED' : 'AVAILABLE',
        batteryHealth: 95 + (i % 5),
        condition: 'GOOD',
        lastCheckedAt: new Date(),
      },
    });
  }

  // 9. Sample FAQs
  const faqs = [
    {
      category: 'WIFI',
      questionId: 'Berapa banyak perangkat yang bisa terhubung ke satu modem JavaMifi?',
      questionEn: 'How many devices can connect to one JavaMifi Pocket WiFi?',
      answerId: 'Satu modem JavaMifi dapat menghubungkan hingga 5 perangkat sekaligus, seperti smartphone, tablet, dan laptop.',
      answerEn: 'A single JavaMifi Pocket WiFi device supports up to 5 simultaneous devices including phones, tablets and laptops.',
      sortOrder: 1,
    },
    {
      category: 'ESIM',
      questionId: 'Bagaimana cara mengaktifkan JavaMifi eSIM?',
      questionEn: 'How do I activate my JavaMifi travel eSIM?',
      answerId: 'Setelah pembayaran terverifikasi, buka Trip Hub Anda, scan kode QR melalui menu pengaturan seluler di ponsel, dan aktifkan Data Roaming saat mendarat.',
      answerEn: 'After payment confirmation, view your Trip Hub, scan the provided QR code in your cellular settings, and enable Data Roaming upon arrival.',
      sortOrder: 2,
    },
    {
      category: 'LOGISTICS',
      questionId: 'Bagaimana prosedur pengembalian perangkat Pocket WiFi?',
      questionEn: 'How do I return the rented Pocket WiFi device?',
      answerId: 'Anda dapat mengembalikan modem di drop-box bandara internasional (Soekarno-Hatta T2 & T3, Juanda, Ngurah Rai) atau menggunakan kurir gratis ke kantor kami.',
      answerEn: 'Drop off the device at international airport drop boxes (CGK T2/T3, DPS, SUB) or utilize our pre-paid return courier.',
      sortOrder: 3,
    },
  ];

  for (const f of faqs) {
    await prisma.faq.create({ data: f });
  }

  // 10. Sample Banner
  await prisma.banner.create({
    data: {
      titleId: 'Rencanakan Koneksi Sebelum Berangkat',
      titleEn: 'Plan Your Connection Before You Pack',
      subtitleId: 'Pilih opsi terbaik antara Pocket WiFi, eSIM, atau SIM Card dengan perbandingan harga transparan.',
      subtitleEn: 'Choose the optimal choice between Pocket WiFi, eSIM, or SIM Card with transparent cost comparisons.',
      imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600',
      position: 'HOME_HERO',
      linkUrl: '/planner',
      sortOrder: 1,
    },
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
