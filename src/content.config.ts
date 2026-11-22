import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const lessons = defineCollection({
  loader: glob({ base: './src/content/lessons', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    answer: z.string(),
    track: z.enum(['Physics', 'Gates', 'Algorithms', 'Hardware', 'Crypto']),
    myth: z.string(),
    truth: z.string(),
    next: z.string(),
    prereqs: z.array(z.string()).default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
  }),
});

export const collections = { lessons, posts };
