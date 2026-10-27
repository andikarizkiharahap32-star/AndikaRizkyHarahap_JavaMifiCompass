import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ContentService } from './content.service';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Get block-based page by slug with bilingual content' })
  getPage(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.contentService.getPage(slug, locale || 'id');
  }

  @Get('faqs')
  @ApiOperation({ summary: 'Get FAQ items by category' })
  getFaqs(@Query('locale') locale?: string, @Query('category') category?: string) {
    return this.contentService.getFaqs(locale || 'id', category);
  }

  @Get('banners')
  @ApiOperation({ summary: 'Get active marketing banners' })
  getBanners(@Query('position') position?: string, @Query('locale') locale?: string) {
    return this.contentService.getBanners(position || 'HOME_HERO', locale || 'id');
  }

  @Post('pages/:id/publish')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish page and trigger n8n distribution workflow' })
  publishPage(@Param('id') id: string) {
    return this.contentService.publishPage(id);
  }
}
