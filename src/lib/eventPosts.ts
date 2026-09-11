import { ObjectId, type Collection } from 'mongodb';
import { EVENT_TYPES } from './eventTypes';
import { getDb } from './mongodb';

export interface EventPost {
  id: string;
  eventType: string;
  facebookPostUrl: string;
  facebookEmbedHeight: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EventPostDocument {
  _id: ObjectId;
  eventType: string;
  facebookPostUrl: string;
  facebookEmbedHeight: number;
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
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export function validateEventPostInput(input: EventPostInput) {
  const eventType = input.eventType?.trim();
  const facebookPostUrl = input.facebookPostUrl?.trim();
  const parsedHeight = Number(input.facebookEmbedHeight ?? 560);

  if (!allowedEventTypes.has(eventType)) {
    throw new Error('Vyberte platny typ akcie.');
  }

  if (!facebookPostUrl) {
    throw new Error('Vlozte Facebook prispevok.');
  }

  if (!Number.isFinite(parsedHeight) || parsedHeight < 320 || parsedHeight > 1200) {
    throw new Error('Vyska Facebook karty musi byt medzi 320 a 1200.');
  }

  return {
    eventType,
    facebookPostUrl,
    facebookEmbedHeight: Math.round(parsedHeight),
  };
}

export async function listEventPosts(limit?: number) {
  const cursor = (await getCollection()).find({}).sort({ createdAt: -1, _id: -1 });
  if (limit) cursor.limit(limit);
  return (await cursor.toArray()).map(toEventPost);
}

export async function createEventPost(input: EventPostInput) {
  const data = validateEventPostInput(input);
  const now = new Date();
  await (await getCollection()).insertOne({
    _id: new ObjectId(),
    ...data,
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