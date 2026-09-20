import { EVENT_TYPES } from './eventTypes';

export const CAMP_TURNUS_NOTICE = 'Pobytový tábor – 1 letný turnus v roku';

const MAX_TEXT_LENGTH = 1_000;
const CAMP_DIETS = new Set([
  'Bežná strava',
  'Vegetariánska',
  'Bezlepková (celiakia)',
  'Bezlaktózová',
  'Potravinové alergie / Iná diéta',
]);
const EVENT_TYPE_LABELS = new Set([...EVENT_TYPES.map((type) => type.label), 'Iná akcia']);

export interface OrderInquiry {
  eventType: string;
  otherEventDescription?: string;
  date: string;
  time?: string;
  location: string;
  children: string;
  services?: string;
  mascots?: string;
  otherRequirements?: string;
  campChildInfo?: string;
  campDiet?: string;
  campHealthInfo?: string;
  name: string;
  phone: string;
  email: string;
  message?: string;
}

function text(value: unknown, maximumLength = MAX_TEXT_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized.length > 0 && normalized.length <= maximumLength ? normalized : undefined;
}

function required(data: Record<string, unknown>, key: string, maximumLength?: number): string | undefined {
  return text(data[key], maximumLength);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Some browsers/extensions write a locale-formatted string (e.g. autofill) into <input type="date">
// instead of the spec-mandated ISO value; accept the Slovak dd.mm.yyyy form as a fallback.
function toIsoDate(value: string): string | undefined {
  if (isIsoDate(value)) return value;
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (!match) return undefined;
  const [, day, month, year] = match;
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return isIsoDate(iso) ? iso : undefined;
}

export function normalizeOrderInquiry(data: Record<string, unknown>, reasons?: string[]): OrderInquiry | undefined {
  const fail = (reason: string) => {
    reasons?.push(reason);
    return undefined;
  };

  const eventType = required(data, 'Typ akcie', 100);
  const location = required(data, 'Miesto', 300);
  const name = required(data, 'Meno', 160);
  const phone = required(data, 'Telefón', 32);
  const email = required(data, 'email', 254)?.toLowerCase();

  if (!eventType) return fail('eventType missing');
  if (!EVENT_TYPE_LABELS.has(eventType)) return fail(`eventType not recognized: ${eventType}`);
  if (!location) return fail('location missing');
  if (!name) return fail('name missing');
  if (!phone) return fail('phone missing');
  if (!email) return fail('email missing');
  if (!/^[0-9+(). -]{6,32}$/.test(phone)) return fail('phone failed format check');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('email failed format check');
  if (data['GDPR súhlas'] !== 'áno') return fail('GDPR consent not given');

  const isCamp = eventType === 'Pobytový tábor';
  const inquiry: OrderInquiry = {
    eventType,
    date: isCamp ? CAMP_TURNUS_NOTICE : '',
    location,
    children: isCamp ? 'Podľa registrácie dieťaťa' : '',
    name,
    phone,
    email,
  };

  if (isCamp) {
    const campChildInfo = required(data, 'tabor-deti-info', 500);
    const campDiet = required(data, 'tabor_strava', 100);
    if (!campChildInfo) return fail('campChildInfo missing');
    if (!campDiet) return fail('campDiet missing');
    if (!CAMP_DIETS.has(campDiet)) return fail(`campDiet not recognized: ${campDiet}`);
    inquiry.campChildInfo = campChildInfo;
    inquiry.campDiet = campDiet;
    inquiry.campHealthInfo = text(data['tabor-zdravie-info'], 1_000);
    inquiry.services = 'Kompletný táborový program (animátori, maskoti, hry)';
  } else {
    const rawDate = required(data, 'Dátum', 10);
    const time = required(data, 'Čas', 100);
    const children = required(data, 'Počet detí', 100);
    if (!rawDate) return fail('date missing');
    if (!time) return fail('time missing');
    if (!children) return fail('children missing');
    const date = toIsoDate(rawDate);
    if (!date) return fail(`date not ISO format: ${rawDate}`);
    if (eventType === 'Iná akcia') {
      const otherEventDescription = required(data, 'Popis inej akcie', 300);
      if (!otherEventDescription) return fail('otherEventDescription missing');
      inquiry.otherEventDescription = otherEventDescription;
    }
    inquiry.date = date;
    inquiry.time = time;
    inquiry.children = children;
    inquiry.services = text(data['Služby'], 500);
    inquiry.mascots = text(data['Maskoti'], 500);
    inquiry.otherRequirements = text(data['Iné požiadavky'], 1_000);
  }

  inquiry.message = text(data['Správa'], 1_000);
  return inquiry;
}

export function formatOrderEmail(inquiry: OrderInquiry): string {
  const fields: Array<[string, string | undefined]> = [
    ['Typ akcie', inquiry.eventType],
    ['Popis inej akcie', inquiry.otherEventDescription],
    ['Dátum / turnus', inquiry.date],
    ['Čas', inquiry.time],
    ['Miesto', inquiry.location],
    ['Počet detí', inquiry.children],
    ['Služby', inquiry.services],
    ['Maskoti', inquiry.mascots],
    ['Meno a vek detí', inquiry.campChildInfo],
    ['Stravovanie', inquiry.campDiet],
    ['Zdravotné informácie', inquiry.campHealthInfo],
    ['Iné požiadavky', inquiry.otherRequirements],
    ['Meno', inquiry.name],
    ['Telefón', inquiry.phone],
    ['E-mail', inquiry.email],
    ['Správa', inquiry.message],
  ];

  return fields
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}