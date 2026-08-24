import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(10),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string().min(1).max(30)).max(15).optional(),
  published: z.boolean().optional(),
});

export const updatePostSchema = createPostSchema.partial();

export const caseStudySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  client: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  summary: z.string().min(10).max(1000),
  content: z.string().min(10),
  coverImage: z.string().url().optional(),
  results: z
    .array(z.object({ metric: z.string().max(60), value: z.string().max(40) }))
    .max(10)
    .optional(),
  published: z.boolean().optional(),
});

export const updateCaseStudySchema = caseStudySchema.partial();
