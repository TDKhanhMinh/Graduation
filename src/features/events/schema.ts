import { z } from 'zod';

import { isCloudinaryDeliveryUrl } from '@/features/media/cloudinary-cover';

export const normalizeSlug = (slug: string) => {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const eventSchema = z.object({
  title: z.string().min(2, 'Tên sự kiện phải có ít nhất 2 ký tự.').max(100, 'Tên sự kiện tối đa 100 ký tự.'),
  slug: z.string().min(3, 'Đường dẫn phải có ít nhất 3 ký tự.').max(50, 'Đường dẫn tối đa 50 ký tự.')
    .regex(/^[a-z0-9-]+$/, 'Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang.'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự.').optional(),
  date: z.string().datetime({ offset: true }).optional().nullable(),
  visibility: z.enum(['private', 'unlisted', 'public']).default('unlisted'),
  submission_mode: z.enum(['open', 'approval_required', 'closed']).default('open'),
  is_archived: z.boolean().default(false),
});

export type EventInput = z.infer<typeof eventSchema>;

export const appearanceSchema = z.object({
  theme_key: z.enum(['graduation', 'editorial', 'minimal']),
  experience_preset: z.enum(['minimal', 'elegant', 'romantic', 'graduation', 'celebration', 'galaxy']).default('minimal'),
  effect_intensity: z.enum(['off', 'low', 'medium', 'high']).default('low'),
  effect_quality: z.enum(['auto', 'low', 'medium', 'high']).default('auto'),
  wall_layout: z.enum(['spotlight', 'grid', 'photo-focus']).default('spotlight'),
  qr_visible: z.boolean().default(true),
  qr_cta: z.string().trim().min(1).max(80).default('Send a wish'),
  animation_speed: z.enum(['slow', 'normal', 'fast']).default('normal'),
  cover_path: z
    .string()
    .trim()
    .max(500, 'Cover URL is too long.')
    .refine((value) => value === '' || isCloudinaryDeliveryUrl(value), 'Cover must be a Cloudinary delivery URL.'),
});
