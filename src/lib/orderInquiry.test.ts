import assert from 'node:assert/strict';
import test from 'node:test';
import { CAMP_TURNUS_NOTICE, formatOrderEmail, normalizeOrderInquiry } from './orderInquiry';

const baseInquiry = {
  'Typ akcie': 'Narodeniny',
  Dátum: '2026-07-12',
  Čas: '14:00 (trvanie: 2 hodiny)',
  Miesto: 'Prešov',
  'Počet detí': 'do 15 detí',
  Meno: 'Jana Nováková',
  Telefón: '+421 900 123 456',
  email: 'Jana@example.com',
  'GDPR súhlas': 'áno',
};

test('normalizes a valid standard inquiry', () => {
  const inquiry = normalizeOrderInquiry(baseInquiry);

  assert.ok(inquiry);
  assert.equal(inquiry.email, 'jana@example.com');
  assert.equal(inquiry.date, '2026-07-12');
});

test('rejects invalid standard inquiry dates and missing consent', () => {
  assert.equal(normalizeOrderInquiry({ ...baseInquiry, Dátum: '2026-02-30' }), undefined);
  assert.equal(normalizeOrderInquiry({ ...baseInquiry, 'GDPR súhlas': 'nie' }), undefined);
});

test('requires one approved camp diet and formats the canonical turnus notice', () => {
  const camp = normalizeOrderInquiry({
    ...baseInquiry,
    'Typ akcie': 'Pobytový tábor',
    'tabor-deti-info': 'Jakub (9 rokov)',
    tabor_strava: 'Bezlepková (celiakia)',
    'tabor-zdravie-info': 'Bez liekov',
  });

  assert.ok(camp);
  assert.equal(camp.date, CAMP_TURNUS_NOTICE);
  assert.equal(camp.time, undefined);
  assert.match(formatOrderEmail(camp), new RegExp(CAMP_TURNUS_NOTICE));
  assert.equal(normalizeOrderInquiry({ ...baseInquiry, 'Typ akcie': 'Pobytový tábor', 'tabor-deti-info': 'Jakub (9 rokov)' }), undefined);
  assert.equal(normalizeOrderInquiry({ ...baseInquiry, 'Typ akcie': 'Pobytový tábor', 'tabor-deti-info': 'Jakub (9 rokov)', tabor_strava: 'Any diet' }), undefined);
});

test('removes line breaks from mail fields', () => {
  const inquiry = normalizeOrderInquiry({ ...baseInquiry, Meno: 'Jana\r\nBcc: attacker@example.com' });

  assert.ok(inquiry);
  assert.doesNotMatch(formatOrderEmail(inquiry), /\r|\nBcc:/);
});