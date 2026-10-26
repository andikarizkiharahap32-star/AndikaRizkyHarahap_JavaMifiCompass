import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from '../automation/outbox.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
  ) {}

  async getPage(slug: string, locale = 'id') {
    const page = await this.prisma.page.findUnique({
      where: { slug },
      include: {
        blocks: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!page) throw new NotFoundException(`Page ${slug} not found`);

    return {
      id: page.id,
      slug: page.slug,
      title: locale === 'id' ? page.titleId : page.titleEn,
      seoTitle: locale === 'id' ? page.seoTitleId : page.seoTitleEn,
      seoDesc: locale === 'id' ? page.seoDescId : page.seoDescEn,
      blocks: page.blocks.map((b) => ({
        id: b.id,
        type: b.type,
        content: locale === 'id' ? b.contentId : b.contentEn,
        settings: b.settings,
      })),
    };
  }

  async getFaqs(locale = 'id', category?: string) {
    const where = category ? { isActive: true, category } : { isActive: true };
    const faqs = await this.prisma.faq.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return faqs.map((f) => ({
      id: f.id,
      category: f.category,
      question: locale === 'id' ? f.questionId : f.questionEn,
      answer: locale === 'id' ? f.answerId : f.answerEn,
    }));
  }

  async getBanners(position = 'HOME_HERO', locale = 'id') {
    const banners = await this.prisma.banner.findMany({
      where: { isActive: true, position },
      orderBy: { sortOrder: 'asc' },
    });

    return banners.map((b) => ({
      id: b.id,
      title: locale === 'id' ? b.titleId : b.titleEn,
      subtitle: locale === 'id' ? b.subtitleId : b.subtitleEn,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      position: b.position,
    }));
  }

  async publishPage(pageId: string) {
    const page = await this.prisma.page.update({
      where: { id: pageId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    // Fire article.published outbox event for n8n newsletter & social draft workflow
    await this.outboxService.recordEvent('article.published', page.id, {
      pageId: page.id,
      titleId: page.titleId,
      titleEn: page.titleEn,
      slug: page.slug,
    });

    return page;
  }
}
