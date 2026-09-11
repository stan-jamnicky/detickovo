import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    description: z.string(),
    order: z.number().default(99),
  }),
});

const mascots = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/mascots' }),
  schema: z.object({
    name: z.string(),
    photo: z.string(),
    category: z.enum(['labkova-patrola', 'ladove-kralovstvo', 'superhrdinovia', 'disney', 'ostatni']).default('ostatni'),
    order: z.number().default(99),
  }),
});

const references = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/references' }),
  schema: z.object({
    name: z.string(),
    quote: z.string().optional(),
    logo: z.string().optional(),
    order: z.number().default(99),
  }),
});

export const collections = { services, mascots, references };
