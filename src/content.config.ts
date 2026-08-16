import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const eventTypes = z.enum(['mesto-obec', 'skola-skolka', 'firma', 'svadba', 'narodeniny', 'festival', 'pobytovy-tabor']);

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    location: z.string(),
    childrenCount: z.string(),
    eventType: eventTypes,
    services: z.array(z.string()).default([]),
    cover: z.string(),
    gallery: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    testimonial: z.object({ quote: z.string(), author: z.string() }).optional(),
  }),
});

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

export const collections = { events, services, mascots, references };
