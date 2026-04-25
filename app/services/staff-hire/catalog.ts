// Shared catalog for waiter / bartender / cleaner booking. The 3 roles
// use the same flow — only role metadata (label, photo, rate) differs.
// `?role=<key>` on the URL switches between them.

export type StaffRole = 'waiter' | 'bartender' | 'cleaner';

export type RoleSpec = {
  key: StaffRole;
  label: string;
  icon: string;
  heroPhoto: string;
  tagline: string;
  // Price per person for a 4-hour shift (the default "event" length)
  baseShiftPaise: number;
  // Minimum + maximum hours bookable
  minHours: number;
  maxHours: number;
  // Extra per-hour charge beyond default shift
  perHourPaise: number;
  // Colour theme
  theme: { hero: string; cta: string; accent: string };
  inclusions: string[];
  occasionFit: string[];
  heroBadge: string;
};

export const ROLES: Record<StaffRole, RoleSpec> = {
  waiter: {
    key: 'waiter',
    label: 'Waiter',
    icon: '🧑‍🍳',
    heroPhoto: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1000&auto=format&fit=crop',
    tagline: 'Professional waiters to serve food, drinks, and clear plates at your event.',
    baseShiftPaise: 99900,     // ₹999 per waiter per 4-hour shift
    minHours: 2,
    maxHours: 12,
    perHourPaise: 20000,       // ₹200/extra hour per waiter
    theme: { hero: 'from-blue-100 via-sky-50 to-cyan-50', cta: 'bg-blue-600 hover:bg-blue-700', accent: 'text-blue-600' },
    inclusions: ['Uniformed waiter', 'Brings service tray', 'Clears plates and glasses', 'Speaks English + regional', '4-hour standard shift'],
    occasionFit: ['Wedding', 'Reception', 'Sangeet', 'Cocktail', 'Birthday', 'Housewarming', 'Corporate'],
    heroBadge: '500+ waiters',
  },
  bartender: {
    key: 'bartender',
    label: 'Bartender',
    icon: '🍸',
    heroPhoto: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1000&auto=format&fit=crop',
    tagline: 'Certified mixologists for cocktails, mocktails and flawless drink service.',
    baseShiftPaise: 256900,    // ₹2,569 per bartender per 4-hour shift
    minHours: 2,
    maxHours: 12,
    perHourPaise: 50000,       // ₹500/extra hour
    theme: { hero: 'from-purple-100 via-fuchsia-50 to-pink-50', cta: 'bg-purple-600 hover:bg-purple-700', accent: 'text-purple-600' },
    inclusions: ['Certified mixologist', 'Brings shaker + jigger + strainer', '10+ cocktail recipes', 'Mocktails for non-drinkers', '4-hour standard shift'],
    occasionFit: ['Cocktail night', 'Wedding', 'Reception', 'Sangeet', 'Birthday (21+)', 'Corporate'],
    heroBadge: '120+ bartenders',
  },
  cleaner: {
    key: 'cleaner',
    label: 'Cleaner',
    icon: '🧹',
    heroPhoto: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1000&auto=format&fit=crop',
    tagline: 'Kitchen + venue cleaning before, during, and after your event.',
    baseShiftPaise: 99900,     // ₹999 per cleaner per 4-hour shift
    minHours: 2,
    maxHours: 12,
    perHourPaise: 20000,       // ₹200/extra hour
    theme: { hero: 'from-emerald-100 via-green-50 to-teal-50', cta: 'bg-emerald-600 hover:bg-emerald-700', accent: 'text-emerald-600' },
    inclusions: ['Uniformed cleaner', 'Brings cleaning supplies', 'Dish + utensil wash', 'Full venue sweep + mop', 'Trash disposal'],
    occasionFit: ['Post-event cleanup', 'Housewarming', 'Pooja', 'Corporate', 'Any large event'],
    heroBadge: '200+ cleaners',
  },
};

export const OCCASIONS = [
  { key: 'WEDDING',      label: 'Wedding',         icon: '💍' },
  { key: 'RECEPTION',    label: 'Reception',       icon: '🥂' },
  { key: 'SANGEET',      label: 'Sangeet',         icon: '🎶' },
  { key: 'BIRTHDAY',     label: 'Birthday',        icon: '🎂' },
  { key: 'ANNIVERSARY',  label: 'Anniversary',     icon: '💝' },
  { key: 'HOUSEWARMING', label: 'Housewarming',    icon: '🏠' },
  { key: 'COCKTAIL',     label: 'Cocktail Night',  icon: '🍹' },
  { key: 'POOJA',        label: 'Pooja',           icon: '🪔' },
  { key: 'CORPORATE',    label: 'Corporate',       icon: '💼' },
  { key: 'OTHER',        label: 'Other',           icon: '🎉' },
];

export const ARRIVAL_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
];

export function formatSlot(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hr12} ${period}` : `${hr12}:${String(m).padStart(2, '0')} ${period}`;
}

const DEFAULT_SHIFT_HOURS = 4;
const GST_RATE = 0.18;
const ADVANCE_PCT = 0.60;

export function computePrice(role: StaffRole, count: number, hours: number, couponDiscountPaise = 0) {
  const spec = ROLES[role];
  if (!spec || count < 1) return null;
  const extraHours = Math.max(0, hours - DEFAULT_SHIFT_HOURS);
  const perPerson  = spec.baseShiftPaise + extraHours * spec.perHourPaise;
  const service    = perPerson * count;
  const discount   = couponDiscountPaise;
  const taxable    = Math.max(0, service - discount);
  const gst        = Math.round(taxable * GST_RATE);
  const total      = taxable + gst;
  const advance    = Math.round(total * ADVANCE_PCT);
  const balance    = total - advance;
  return { perPerson, service, discount, gst, total, advance, balance, extraHours, count, hours };
}
