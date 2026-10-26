import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getDestinations(locale = 'id') {
    const list = await this.prisma.destination.findMany({
      where: { isActive: true },
      orderBy: [{ isPopular: 'desc' }, { nameEn: 'asc' }],
    });

    return list.map((d) => ({
      id: d.id,
      countryCode: d.countryCode,
      name: locale === 'id' ? d.nameId : d.nameEn,
      slug: d.slug,
      description: locale === 'id' ? d.descriptionId : d.descriptionEn,
      flagEmoji: d.flagEmoji,
      callingCode: d.callingCode,
      currency: d.currency,
      needsVpn: d.needsVpn,
      isPopular: d.isPopular,
      imageUrl: d.imageUrl,
      tips: locale === 'id' ? d.tipsId : d.tipsEn,
    }));
  }

  async getDestinationBySlug(slug: string, locale = 'id') {
    const d = await this.prisma.destination.findUnique({
      where: { slug },
      include: {
        plans: {
          where: { isActive: true },
          include: { product: true },
        },
      },
    });

    if (!d) throw new NotFoundException(`Destination not found: ${slug}`);

    return {
      id: d.id,
      countryCode: d.countryCode,
      name: locale === 'id' ? d.nameId : d.nameEn,
      slug: d.slug,
      description: locale === 'id' ? d.descriptionId : d.descriptionEn,
      flagEmoji: d.flagEmoji,
      callingCode: d.callingCode,
      currency: d.currency,
      needsVpn: d.needsVpn,
      isPopular: d.isPopular,
      imageUrl: d.imageUrl,
      tips: locale === 'id' ? d.tipsId : d.tipsEn,
      plans: d.plans.map((p) => ({
        id: p.id,
        name: locale === 'id' ? p.nameId : p.nameEn,
        slug: p.slug,
        priceIdr: p.priceIdr,
        pricingType: p.pricingType,
        durationDays: p.durationDays,
        dataLimitMb: p.dataLimitMb,
        speedMbps: p.speedMbps,
        includesVpn: p.includesVpn,
        depositIdr: p.depositIdr,
        product: {
          type: p.product.type,
          name: locale === 'id' ? p.product.nameId : p.product.nameEn,
          slug: p.product.slug,
        },
      })),
    };
  }

  async getProducts(locale = 'id') {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        plans: {
          where: { isActive: true },
        },
      },
    });

    return products.map((p) => ({
      id: p.id,
      type: p.type,
      name: locale === 'id' ? p.nameId : p.nameEn,
      slug: p.slug,
      description: locale === 'id' ? p.descriptionId : p.descriptionEn,
      imageUrl: p.imageUrl,
      features: p.features,
      plans: p.plans.map((pl) => ({
        id: pl.id,
        name: locale === 'id' ? pl.nameId : pl.nameEn,
        slug: pl.slug,
        priceIdr: pl.priceIdr,
        pricingType: pl.pricingType,
        durationDays: pl.durationDays,
        dataLimitMb: pl.dataLimitMb,
        depositIdr: pl.depositIdr,
      })),
    }));
  }

  async getPresets(locale = 'id') {
    const presets = await this.prisma.journeyPreset.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return presets.map((preset) => ({
      id: preset.id,
      slug: preset.slug,
      name: locale === 'id' ? preset.nameId : preset.nameEn,
      description: locale === 'id' ? preset.descriptionId : preset.descriptionEn,
      imageUrl: preset.imageUrl,
      destinations: preset.destinations,
      defaultDays: preset.defaultDays,
      defaultUsage: preset.defaultUsage,
      needsVpn: preset.needsVpn,
    }));
  }

  async validatePromoCode(code: string, subtotalIdr: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promo || !promo.isActive) {
      throw new BadRequestException('Invalid or expired promo code');
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      throw new BadRequestException('Promo code is not active for this date');
    }

    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      throw new BadRequestException('Promo code usage limit has been reached');
    }

    if (subtotalIdr < promo.minOrderIdr) {
      throw new BadRequestException(
        `Minimum order amount for this promo is Rp ${promo.minOrderIdr.toLocaleString('id-ID')}`,
      );
    }

    let discountIdr = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discountIdr = Math.round((subtotalIdr * promo.discountValue) / 100);
      if (promo.maxDiscountIdr && discountIdr > promo.maxDiscountIdr) {
        discountIdr = promo.maxDiscountIdr;
      }
    } else {
      discountIdr = promo.discountValue;
    }

    return {
      valid: true,
      promoCodeId: promo.id,
      code: promo.code,
      discountIdr,
    };
  }
}
