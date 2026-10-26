import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('destinations')
  @ApiOperation({ summary: 'List active travel destinations' })
  getDestinations(@Query('locale') locale?: string) {
    return this.catalogService.getDestinations(locale || 'id');
  }

  @Get('destinations/:slug')
  @ApiOperation({ summary: 'Get destination details by slug' })
  getDestinationBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.catalogService.getDestinationBySlug(slug, locale || 'id');
  }

  @Get('products')
  @ApiOperation({ summary: 'List products (WiFi, eSIM, SIM, PRO)' })
  getProducts(@Query('locale') locale?: string) {
    return this.catalogService.getProducts(locale || 'id');
  }

  @Get('presets')
  @ApiOperation({ summary: 'List curated journey presets (Umrah, Japan, China VPN, Europe)' })
  getPresets(@Query('locale') locale?: string) {
    return this.catalogService.getPresets(locale || 'id');
  }

  @Post('promos/validate')
  @ApiOperation({ summary: 'Validate promo code against order subtotal' })
  validatePromo(@Body() body: { code: string; subtotalIdr: number }) {
    return this.catalogService.validatePromoCode(body.code, body.subtotalIdr);
  }
}
