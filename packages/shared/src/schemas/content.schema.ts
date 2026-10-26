// ─────────────────────────────────────────────────────────────
// Content / CMS schemas
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';
import { ContentStatus } from '../enums';
import { localeSchema } from './index';

const localizedStringSchema = z.object({
  id: z.string().min(1),
  en: z.string().min(1),
});

// ── Pages ────────────────────────────────────────────────────

/** Create a CMS page. */
export const createPageSchema = z.object({
  title: localizedStringSchema,
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  locale: localeSchema.default('id'),
  metaTitle: z.string().max(120).optional(),
  metaDescription: z.string().max(300).optional(),
  publishAt: z.coerce.date().optional(),
});
export type CreatePageInput = z.infer<typeof createPageSchema>;

/** Partial update for a CMS page. */
export const updatePageSchema = createPageSchema.partial();
export type UpdatePageInput = z.infer<typeof updatePageSchema>;

// ── Content blocks ───────────────────────────────────────────

/** Block types used by the page builder. */
const blockTypeSchema = z.enum([
  'hero',
  'text',
  'image',
  'video',
  'cta',
  'faq',
  'testimonial',
  'pricing',
  'html',
]);

/** Create a content block within a page. */
export const createBlockSchema = z.object({
  pageId: z.string().uuid(),
  type: blockTypeSchema,
  content: z.record(z.unknown()),
  sortOrder: z.number().int().nonnegative().default(0),
  isVisible: z.boolean().default(true),
});
export type CreateBlockInput = z.infer<typeof createBlockSchema>;

// ── FAQ ──────────────────────────────────────────────────────

/** Create an FAQ entry. */
export const createFaqSchema = z.object({
  question: localizedStringSchema,
  answer: localizedStringSchema,
  category: z.string().min(1).max(100),
  sortOrder: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(false),
});
export type CreateFaqInput = z.infer<typeof createFaqSchema>;

// ── Banners ──────────────────────────────────────────────────

/** Create a promotional banner. */
export const createBannerSchema = z
  .object({
    title: localizedStringSchema,
    subtitle: localizedStringSchema.optional(),
    imageUrl: z.string().url(),
    linkUrl: z.string().url().optional(),
    placement: z.enum(['homepage', 'checkout', 'dashboard', 'global']),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().nonnegative().default(0),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: 'End date must be after start date',
    path: ['endAt'],
  });
export type CreateBannerInput = z.infer<typeof createBannerSchema>;

// ── Media upload ─────────────────────────────────────────────

/** Validate media upload metadata. */
export const uploadMediaSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().regex(/^(image|video|application)\/.+$/, 'Unsupported MIME type'),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024, 'File must be smaller than 50 MB'),
  altText: z.string().max(255).optional(),
  folder: z.string().max(100).optional(),
});
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
