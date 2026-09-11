import { ObjectId, type Collection } from 'mongodb';
import { EVENT_TYPES } from './eventTypes';
import { getFacebookPostHref, isValidFacebookPostUrl } from './facebook';
import { getDb } from './mongodb';

export interface EventPost {
  id: string;
  eventType: string;
  facebookPostUrl: string;
  facebookEmbedHeight: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EventPostDocument {
  _id: ObjectId;
  eventType: string;
  facebookPostUrl: string;
  facebookEmbedHeight: number;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EventPostInput {
  eventType: string;
  facebookPostUrl: string;
  facebookEmbedHeight?: string | number | null;
}

const allowedEventTypes = new Set(EVENT_TYPES.map((type) => type.id));

async function getCollection(): Promise<Collection<EventPostDocument>> {
  return (await getDb()).collection<EventPostDocument>('eventPosts');
}

function toEventPost(document: EventPostDocument): EventPost {
  return {
    id: document._id.toHexString(),
    eventType: document.eventType,
    facebookPostUrl: document.facebookPostUrl,
    facebookEmbedHeight: document.facebookEmbedHeight,
    order: document.order ?? 0,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

// Backfills order for legacy documents so manual sorting has a stable base (lower = first).
async function ensureOrders() {
  const collection = await getCollection();
  const missing = await collection.find({ order: { $exists: false } }).sort({ createdAt: -1, _id: -1 }).toArray();
  if (missing.length === 0) return;

  const lowest = await collection.find({ order: { $exists: true } }).sort({ order: 1 }).limit(1).toArray();
  let next = (lowest[0]?.order ?? 0) - missing.length;

  for (const document of missing) {
    await collection.updateOne({ _id: document._id }, { $set: { order: next } });
    next += 1;
  }
}

export function validateEventPostInput(input: EventPostInput) {
  const eventType = input.eventType?.trim();
  const facebookPostUrl = input.facebookPostUrl?.trim();
  const parsedHeight = Number(input.facebookEmbedHeight ?? 550);

  if (!allowedEventTypes.has(eventType)) {
    throw new Error('Vyberte platny typ akcie.');
  }

  if (!facebookPostUrl) {
    throw new Error('Vlozte Facebook prispevok.');
  }

  if (!isValidFacebookPostUrl(facebookPostUrl)) {
    throw new Error('Vlozte platny verejny Facebook prispevok alebo Facebook plugin URL.');
  }

  if (!Number.isFinite(parsedHeight) || parsedHeight < 320 || parsedHeight > 1200) {
    throw new Error('Vyska Facebook karty musi byt medzi 320 a 1200.');
  }

  return {
    eventType,
    facebookPostUrl: getFacebookPostHref(facebookPostUrl),
    facebookEmbedHeight: Math.round(parsedHeight),
  };
}

export async function listEventPosts(limit?: number) {
  await ensureOrders();
  const cursor = (await getCollection()).find({}).sort({ order: 1, createdAt: -1, _id: -1 });
  if (limit) cursor.limit(limit);
  return (await cursor.toArray()).map(toEventPost);
}

export interface EventPostFilter {
  eventType?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export async function filterEventPosts(filter: EventPostFilter) {
  await ensureOrders();
  const query: Record<string, unknown> = {};

  if (filter.eventType && allowedEventTypes.has(filter.eventType)) {
    query.eventType = filter.eventType;
  }

  const createdAt: Record<string, Date> = {};
  if (filter.createdFrom) createdAt.$gte = filter.createdFrom;
  if (filter.createdTo) createdAt.$lte = filter.createdTo;
  if (Object.keys(createdAt).length > 0) query.createdAt = createdAt;

  const cursor = (await getCollection()).find(query).sort({ order: 1, createdAt: -1, _id: -1 });
  return (await cursor.toArray()).map(toEventPost);
}

export async function createEventPost(input: EventPostInput, position: 'top' | 'bottom' = 'top') {
  const data = validateEventPostInput(input);
  const collection = await getCollection();
  const edge = await collection
    .find({ order: { $exists: true } })
    .sort({ order: position === 'top' ? 1 : -1 })
    .limit(1)
    .toArray();
  const order = position === 'top' ? (edge[0]?.order ?? 0) - 1 : (edge[0]?.order ?? 0) + 1;
  const now = new Date();
  await collection.insertOne({
    _id: new ObjectId(),
    ...data,
    order,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateEventPost(id: string, input: EventPostInput) {
  const data = validateEventPostInput(input);
  await (await getCollection()).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    }
  );
}

export async function deleteEventPost(id: string) {
  await (await getCollection()).deleteOne({ _id: new ObjectId(id) });
}

export async function bulkDeleteEventPosts(ids: string[]) {
  const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
  if (objectIds.length === 0) return 0;
  const result = await (await getCollection()).deleteMany({ _id: { $in: objectIds } });
  return result.deletedCount;
}

export async function reorderEventPosts(ids: string[]) {
  const collection = await getCollection();
  const validIds = ids.filter((id) => ObjectId.isValid(id));

  await Promise.all(
    validIds.map((id, index) => collection.updateOne({ _id: new ObjectId(id) }, { $set: { order: index } }))
  );
}