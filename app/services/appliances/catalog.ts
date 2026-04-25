// Appliance rental catalog — each item is priced per day. Customer picks
// qty per item, pickup and drop dates. Minimum 1-day rental; additional
// days multiply the daily rate.

export type ApplianceCategory = 'COOKING' | 'WARMING' | 'PREP' | 'BEVERAGE';

export type Appliance = {
  key: string;
  label: string;
  category: ApplianceCategory;
  photoUrl: string;
  dailyRatePaise: number;
  description: string;
  specs: string[];
};

export const APPLIANCES: Appliance[] = [
  // ── Cooking ────────────────────────────────────────────────────────
  {
    key: 'gas_stove_2b',
    label: '2-Burner Gas Stove',
    category: 'COOKING',
    photoUrl: 'https://images.unsplash.com/photo-1556910633-5099dc3971e4?w=600&auto=format&fit=crop',
    dailyRatePaise: 40000,           // ₹400/day
    description: 'Portable LPG-compatible, ideal for small gatherings.',
    specs: ['Auto-ignition', 'Stainless steel', 'LPG cylinder compatible', 'Regulator included'],
  },
  {
    key: 'gas_stove_4b',
    label: '4-Burner Commercial Stove',
    category: 'COOKING',
    photoUrl: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f?w=600&auto=format&fit=crop',
    dailyRatePaise: 100000,          // ₹1,000/day
    description: 'Heavy-duty commercial stove for large events.',
    specs: ['Cast iron burners', 'Heavy-duty frame', '4 × high-pressure burners', 'Gas hose + regulator'],
  },
  {
    key: 'induction',
    label: 'Induction Cooktop',
    category: 'COOKING',
    photoUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&auto=format&fit=crop',
    dailyRatePaise: 30000,           // ₹300/day
    description: 'Single-burner induction, easy for indoor live counters.',
    specs: ['2000W', 'Touch controls', 'Auto shut-off', 'Compatible induction tawa included'],
  },
  {
    key: 'tandoor',
    label: 'Portable Tandoor',
    category: 'COOKING',
    photoUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&auto=format&fit=crop',
    dailyRatePaise: 180000,          // ₹1,800/day
    description: 'Traditional clay tandoor for live grills.',
    specs: ['Charcoal-fired', 'Insulated base', 'Skewers included', 'Setup assistance'],
  },

  // ── Warming ────────────────────────────────────────────────────────
  {
    key: 'chafing_full',
    label: 'Full-Size Chafing Dish',
    category: 'WARMING',
    photoUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop',
    dailyRatePaise: 25000,           // ₹250/day
    description: 'Gastronorm 1/1, 8-litre capacity — classic banquet setup.',
    specs: ['8-litre capacity', 'Gel fuel × 2 included', 'Mirror-finish steel', 'Serving ladle + lid'],
  },
  {
    key: 'chafing_half',
    label: 'Half-Size Chafing Dish',
    category: 'WARMING',
    photoUrl: 'https://images.unsplash.com/photo-1546695259-ad30ff3fd643?w=600&auto=format&fit=crop',
    dailyRatePaise: 15000,           // ₹150/day
    description: 'Gastronorm 1/2, 4-litre capacity — for smaller dishes.',
    specs: ['4-litre capacity', 'Gel fuel included', 'Compact size'],
  },
  {
    key: 'soup_warmer',
    label: 'Soup / Curry Warmer',
    category: 'WARMING',
    photoUrl: 'https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=600&auto=format&fit=crop',
    dailyRatePaise: 20000,           // ₹200/day
    description: '5-litre insulated warmer with tap.',
    specs: ['Electric', '50-95°C range', 'Drip-free tap', 'Stainless interior'],
  },

  // ── Prep ──────────────────────────────────────────────────────────
  {
    key: 'mixer_grinder',
    label: 'Heavy-Duty Mixer Grinder',
    category: 'PREP',
    photoUrl: 'https://images.unsplash.com/photo-1585237017125-24baf8d7406f?w=600&auto=format&fit=crop',
    dailyRatePaise: 30000,           // ₹300/day
    description: '750W mixer with 3 jars for batter, chutney and masalas.',
    specs: ['750W motor', '3 jars (1.5L, 1L, 0.4L)', 'Stone-grind tech', '5-speed'],
  },
  {
    key: 'wet_grinder',
    label: 'Wet Grinder (Idli/Dosa)',
    category: 'PREP',
    photoUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop',
    dailyRatePaise: 50000,           // ₹500/day
    description: 'Traditional stone wet grinder for authentic batter.',
    specs: ['2L capacity', 'Granite stones', 'Heavy motor', 'Includes atta kneading attachment'],
  },
  {
    key: 'food_processor',
    label: 'Commercial Food Processor',
    category: 'PREP',
    photoUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&auto=format&fit=crop',
    dailyRatePaise: 70000,           // ₹700/day
    description: 'Large-capacity prep bowl for chopping and slicing at scale.',
    specs: ['3-litre bowl', 'Slicing/shredding disks', 'Dough kneader', 'Pulse control'],
  },

  // ── Beverage ──────────────────────────────────────────────────────
  {
    key: 'coffee_urn',
    label: 'Coffee Urn (10L)',
    category: 'BEVERAGE',
    photoUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop',
    dailyRatePaise: 30000,           // ₹300/day
    description: 'Commercial coffee urn with drip tap.',
    specs: ['10-litre capacity', 'Electric', 'Drip-free tap', 'Keep-warm mode'],
  },
  {
    key: 'tea_urn',
    label: 'Tea / Chai Urn (15L)',
    category: 'BEVERAGE',
    photoUrl: 'https://images.unsplash.com/photo-1587734195342-3436d59feed7?w=600&auto=format&fit=crop',
    dailyRatePaise: 35000,           // ₹350/day
    description: '15-litre chai urn, ideal for weddings + large gatherings.',
    specs: ['15-litre capacity', 'Self-boiling', 'Temperature gauge', 'Milk whisk attachment'],
  },
  {
    key: 'juice_dispenser',
    label: 'Juice Dispenser (3 × 7L)',
    category: 'BEVERAGE',
    photoUrl: 'https://images.unsplash.com/photo-1583077874340-79db6564672e?w=600&auto=format&fit=crop',
    dailyRatePaise: 50000,           // ₹500/day
    description: '3-bowl beverage fountain for mocktails / fresh juices.',
    specs: ['3 bowls × 7L', 'Chilled circulation', 'LED backlight'],
  },
];

export const CATEGORIES: { key: ApplianceCategory; label: string; icon: string }[] = [
  { key: 'COOKING',  label: 'Cooking',   icon: '🔥' },
  { key: 'WARMING',  label: 'Warming',   icon: '♨️' },
  { key: 'PREP',     label: 'Prep',      icon: '🔪' },
  { key: 'BEVERAGE', label: 'Beverage',  icon: '🍵' },
];

export function appliancesForCategory(category?: ApplianceCategory): Appliance[] {
  if (!category) return APPLIANCES;
  return APPLIANCES.filter(a => a.category === category);
}

export const DELIVERY_FEE_PAISE = 30000;   // ₹300 delivery + pickup (flat, per city)
export const GST_RATE = 0.18;
