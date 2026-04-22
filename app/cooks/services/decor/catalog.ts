// Shared catalog for the decoration landing gallery + order flow.
// Each decoration has its own photo, inclusions list and flat price (no
// weight/size tiers like cakes have — decorators quote per setup). Move
// this to event_pricing_defaults or a dedicated table when the feature
// stabilises.

export type DecorTier = 'STANDARD' | 'PREMIUM' | 'LUXURY';

export type Decoration = {
  key: string;
  label: string;
  tier: DecorTier;
  photoUrl: string;
  pricePaise: number;                // base service charge (before GST)
  setupHours: number;                // included setup window
  overtimePerHourPaise: number;      // charged if customer extends
  inclusions: string[];              // rose petals, curtains, balloons etc.
  tags: string[];                    // occasion keys
};

export const OCCASIONS = [
  { key: 'ANNIVERSARY',  label: 'Anniversary',  icon: '💝' },
  { key: 'BIRTHDAY',     label: 'Birthday',     icon: '🎂' },
  { key: 'BABY_SHOWER',  label: 'Baby Shower',  icon: '👶' },
  { key: 'WEDDING',      label: 'Wedding',      icon: '💍' },
  { key: 'HOUSEWARMING', label: 'Housewarming', icon: '🏠' },
  { key: 'POOJA',        label: 'Pooja / Puja', icon: '🪔' },
  { key: 'OTHER',        label: 'Other',        icon: '🎉' },
];

/** Half-hour / hour arrival slots shown as pill buttons on the order page. */
export const ARRIVAL_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00',
];

export function formatSlot(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hr12} ${period}` : `${hr12}:${String(m).padStart(2, '0')} ${period}`;
}

export const DECORATIONS: Decoration[] = [
  // ── Anniversary ────────────────────────────────────────────────────
  {
    key: 'anniv_love_you_room',
    label: 'Love You Room Decoration',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=800&auto=format&fit=crop',
    pricePaise: 300000,
    setupHours: 2,
    overtimePerHourPaise: 50000,
    inclusions: [
      '1 kg red rose petals decor on bed',
      '1 "LOVE YOU" heart balloon arch',
      '30 red + pink balloons on ceiling',
      'Fairy lights strung across walls',
    ],
    tags: ['ANNIVERSARY'],
  },
  {
    key: 'anniv_rose_gold',
    label: 'Rose Gold Anniversary Decoration',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
    pricePaise: 432800,                 // matches ₹4,328 shown in the doc
    setupHours: 3,
    overtimePerHourPaise: 75000,
    inclusions: [
      '50 rose gold + white balloon ceiling',
      'Heart-shaped balloon arch on stage',
      'Rose petals pathway',
      'Metallic curtains backdrop',
      'Fairy light mesh',
    ],
    tags: ['ANNIVERSARY'],
  },
  {
    key: 'anniv_first_night_rose',
    label: 'First Night With Rose Decoration',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?w=800&auto=format&fit=crop',
    pricePaise: 500000,
    setupHours: 2,
    overtimePerHourPaise: 75000,
    inclusions: [
      '2 kg red rose petals on bed',
      '100 red heart pastel balloons on ceiling',
      'White net curtains',
      'Candle walkway',
      'Rose petal "just married" text',
    ],
    tags: ['ANNIVERSARY'],
  },
  {
    key: 'anniv_first_night_dim',
    label: 'First Night With Dim Light Decor',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800&auto=format&fit=crop',
    pricePaise: 650000,
    setupHours: 3,
    overtimePerHourPaise: 100000,
    inclusions: [
      '3 kg mixed rose petals on bed',
      'LED warm fairy light canopy',
      'Rose bouquet and heart balloons',
      'Scented candle path',
      'Mirror + ribbon backdrop',
    ],
    tags: ['ANNIVERSARY'],
  },
  {
    key: 'anniv_stage',
    label: 'Anniversary Stage Decor',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&sat=-40',
    pricePaise: 850000,
    setupHours: 4,
    overtimePerHourPaise: 125000,
    inclusions: [
      'Stage backdrop with fresh flowers',
      'Monogram letters (couple initials)',
      'Aisle-style balloon entrance',
      'Uplight + spotlights',
    ],
    tags: ['ANNIVERSARY'],
  },

  // ── Birthday ───────────────────────────────────────────────────────
  {
    key: 'birthday_balloon_arch',
    label: 'Classic Balloon Arch',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop',
    pricePaise: 250000,
    setupHours: 2,
    overtimePerHourPaise: 50000,
    inclusions: [
      'Balloon arch (customer\'s colour theme)',
      'Birthday banner',
      '25 helium balloons',
      'Table + cake stand decor',
    ],
    tags: ['BIRTHDAY'],
  },
  {
    key: 'birthday_kids_theme',
    label: 'Kids Themed Decor',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&auto=format&fit=crop',
    pricePaise: 400000,
    setupHours: 3,
    overtimePerHourPaise: 75000,
    inclusions: [
      'Cartoon cutouts (superhero / princess / unicorn)',
      'Themed backdrop + foil curtain',
      '50 balloons',
      'Party props + photo booth frame',
    ],
    tags: ['BIRTHDAY'],
  },
  {
    key: 'birthday_number_ballooons',
    label: 'Number Balloon Stage',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop',
    pricePaise: 450000,
    setupHours: 3,
    overtimePerHourPaise: 75000,
    inclusions: [
      'Giant number foil balloons (e.g. "30")',
      'Balloon arch frame',
      'LED name sign',
      '60 latex balloons',
      'Confetti poppers',
    ],
    tags: ['BIRTHDAY'],
  },

  // ── Baby Shower ────────────────────────────────────────────────────
  {
    key: 'baby_pink_theme',
    label: 'Baby Girl Pink Theme',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1515816052601-210d5501d471?w=800&auto=format&fit=crop',
    pricePaise: 500000,
    setupHours: 3,
    overtimePerHourPaise: 75000,
    inclusions: [
      'Pink balloon arch + stage',
      '"Oh Baby!" LED sign',
      'Floral backdrop',
      'Table + chair sashes',
    ],
    tags: ['BABY_SHOWER'],
  },
  {
    key: 'baby_blue_theme',
    label: 'Baby Boy Blue Theme',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop',
    pricePaise: 500000,
    setupHours: 3,
    overtimePerHourPaise: 75000,
    inclusions: [
      'Blue + white balloon arch',
      '"Baby Boy" banner',
      'Cloud + star cutouts',
      'Themed chair covers',
    ],
    tags: ['BABY_SHOWER'],
  },

  // ── Wedding ────────────────────────────────────────────────────────
  {
    key: 'wedding_mandap',
    label: 'Floral Mandap',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&sat=40',
    pricePaise: 2500000,
    setupHours: 6,
    overtimePerHourPaise: 200000,
    inclusions: [
      'Full floral mandap (roses, marigold, orchids)',
      'Four pillars with drape cloth',
      'Havan setup table',
      'Rangoli at entry',
    ],
    tags: ['WEDDING'],
  },
  {
    key: 'wedding_reception',
    label: 'Reception Stage',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop',
    pricePaise: 2000000,
    setupHours: 5,
    overtimePerHourPaise: 175000,
    inclusions: [
      'Reception sofa stage with drape',
      'LED name sign',
      'Fresh flower backdrop',
      'Aisle balloon walk',
    ],
    tags: ['WEDDING'],
  },

  // ── Housewarming ───────────────────────────────────────────────────
  {
    key: 'housewarming_floral',
    label: 'Floral Entrance',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop',
    pricePaise: 300000,
    setupHours: 2,
    overtimePerHourPaise: 50000,
    inclusions: [
      'Marigold torans (door)',
      'Rangoli + diya setup',
      'Balloon arch',
      'Welcome banner',
    ],
    tags: ['HOUSEWARMING'],
  },

  // ── Pooja ──────────────────────────────────────────────────────────
  {
    key: 'pooja_silk_altar',
    label: 'Silk Flower Altar',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1589307357824-8c2d5c46b5d9?w=800&auto=format&fit=crop',
    pricePaise: 350000,
    setupHours: 2,
    overtimePerHourPaise: 50000,
    inclusions: [
      'Silk flower mandap',
      'Diya arrangement (21 pieces)',
      'Kalash + torans',
      'Carpet + asana seating',
    ],
    tags: ['POOJA'],
  },

  // ── Other ──────────────────────────────────────────────────────────
  {
    key: 'other_corporate',
    label: 'Corporate Stage',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&sat=-40',
    pricePaise: 600000,
    setupHours: 3,
    overtimePerHourPaise: 100000,
    inclusions: [
      'Branded backdrop',
      'Stage podium drape',
      'Floral table pieces',
      'Red carpet entry',
    ],
    tags: ['OTHER'],
  },
];

export function decorationsForOccasion(occasionKey: string): Decoration[] {
  return DECORATIONS.filter(d => d.tags.includes(occasionKey));
}
