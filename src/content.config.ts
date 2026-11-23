import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One MDX file per stop. The id is the file name and must match an id in docs/curriculum.md.
const stops = defineCollection({
  loader: glob({ base: './src/content/stops', pattern: '*.mdx' }),
  schema: z.object({
    description: z.string().max(160),
    answer: z.string(),
    myth: z.object({ claim: z.string(), truth: z.string() }),
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

export const collections = { stops, posts };
