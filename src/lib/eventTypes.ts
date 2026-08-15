export interface EventTypeInfo {
  id: string;
  label: string;
  short: string;
  href: string;
  color: string;
  icon: string;
}

export const EVENT_TYPES: EventTypeInfo[] = [
  { id: 'mesto-obec', label: 'Mesto / Obec', short: 'Dni detí, mestské podujatia a oslavy pre stovky detí.', href: '/velke-akcie', color: 'var(--color-brand-blue)', icon: '🏛️' },
  { id: 'skola-skolka', label: 'Škola / Škôlka', short: 'Karnevaly, školské akcie a programy na mieru.', href: '/velke-akcie', color: 'var(--color-brand-green)', icon: '🎒' },
  { id: 'firma', label: 'Firma', short: 'Rodinné dni a firemné podujatia s detským programom.', href: '/velke-akcie', color: 'var(--color-brand-magenta)', icon: '🏢' },
  { id: 'svadba', label: 'Svadba', short: 'Postaráme sa o deti, aby ste si svadbu užili naplno.', href: '/svadby', color: 'var(--color-brand-orange)', icon: '💍' },
  { id: 'narodeniny', label: 'Narodeniny', short: 'Oslava u vás doma, na záhrade či v prenajatom priestore.', href: '/narodeniny', color: 'var(--color-brand-red)', icon: '🎂' },
  { id: 'festival', label: 'Festival', short: 'Detské zóny a program pre festivaly a komunitné akcie.', href: '/velke-akcie', color: 'var(--color-brand-blue)', icon: '🎪' },
];

export function eventTypeLabel(id: string): string {
  return EVENT_TYPES.find((t) => t.id === id)?.label ?? id;
}
