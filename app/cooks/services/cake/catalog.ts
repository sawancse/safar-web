// Shared cake catalog for the landing gallery and the order flow.
// Keep both sides reading from the same source so clicking a specific cake
// on /cooks/services/cake pre-selects it on the order page.

export type CakeTier = 'STANDARD' | 'PREMIUM' | 'LUXURY';

export type CakeDesign = {
  key: string;
  label: string;
  tier: CakeTier;
  photoUrl: string;
  /** Loose occasion tags used to group cakes on the landing gallery. */
  tags: string[];
};

export const WEIGHTS = [
  { key: '0.5', label: '0.5 KG',   basePaise: 100000 },  // ₹1,000
  { key: '1',   label: '1 KG',     basePaise: 180000 },  // ₹1,800
  { key: '1.5', label: '1.5 KG',   basePaise: 250000 },  // ₹2,500
  { key: '2',   label: '2 KG',     basePaise: 320000 },  // ₹3,200
  { key: '3',   label: '3 KG',     basePaise: 450000 },  // ₹4,500
  { key: '5',   label: '5 KG',     basePaise: 700000 },  // ₹7,000
];

export const FLAVOURS = [
  'Vanilla', 'Chocolate', 'Butterscotch', 'Black Forest', 'Strawberry',
  'Pineapple', 'Red Velvet', 'Mango', 'Coffee', 'Blueberry',
];

export const TIER_SURCHARGE: Record<CakeTier, number> = {
  STANDARD:     0,
  PREMIUM:  50000,
  LUXURY:  150000,
};

export const CAKES: CakeDesign[] = [
  // Anniversary
  { key: 'anniv_two_tier_gold',  label: 'Two-tier Gold',         tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&auto=format&fit=crop', tags: ['anniversary','two-tier'] },
  { key: 'anniv_rose_garden',    label: 'Rose Garden',           tier: 'LUXURY',  photoUrl: 'https://images.unsplash.com/photo-1586040140378-b5634cb4c8fc?w=800&auto=format&fit=crop', tags: ['anniversary','gold'] },
  { key: 'anniv_classic_heart',  label: 'Classic Heart',         tier: 'STANDARD',photoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop', tags: ['anniversary'] },
  { key: 'anniv_floral_vintage', label: 'Floral Vintage',        tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&auto=format&fit=crop', tags: ['anniversary','floral'] },
  { key: 'anniv_silver',         label: 'Silver Jubilee',        tier: 'LUXURY',  photoUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop', tags: ['anniversary'] },
  { key: 'anniv_golden',         label: 'Golden Jubilee',        tier: 'LUXURY',  photoUrl: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800&auto=format&fit=crop', tags: ['anniversary','gold'] },

  // Birthday
  { key: 'birthday_chocolate',   label: 'Chocolate Drip',        tier: 'STANDARD',photoUrl: 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=800&auto=format&fit=crop', tags: ['birthday','chocolate'] },
  { key: 'birthday_photo_print', label: 'Photo-print Cake',      tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&auto=format&fit=crop', tags: ['birthday','photo'] },
  { key: 'birthday_number',      label: 'Number / Letter shape', tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=800&auto=format&fit=crop', tags: ['birthday'] },
  { key: 'birthday_classic',     label: 'Classic Vanilla',       tier: 'STANDARD',photoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop', tags: ['birthday'] },
  { key: 'birthday_premium',     label: 'Premium Buttercream',   tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1562777717-dc6984f65a63?w=800&auto=format&fit=crop', tags: ['birthday'] },
  { key: 'birthday_rainbow',     label: 'Rainbow',               tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=800&auto=format&fit=crop', tags: ['birthday'] },

  // Kids
  { key: 'kids_unicorn',         label: 'Unicorn',               tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800&auto=format&fit=crop', tags: ['kids','birthday'] },
  { key: 'kids_superhero',       label: 'Superhero',             tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=800&auto=format&fit=crop', tags: ['kids','birthday'] },
  { key: 'kids_princess',        label: 'Princess',              tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop', tags: ['kids','birthday'] },
  { key: 'kids_cartoon',         label: 'Cartoon Character',     tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1549312194-90a9df4b9e25?w=800&auto=format&fit=crop', tags: ['kids'] },

  // Baby shower
  { key: 'baby_girl_pink',       label: 'Baby Girl Pink',        tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1584303893625-e71eb40c6a2b?w=800&auto=format&fit=crop', tags: ['baby_shower'] },
  { key: 'baby_boy_blue',        label: 'Baby Boy Blue',         tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop', tags: ['baby_shower'] },
  { key: 'baby_pastel',          label: 'Pastel Neutral',        tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&auto=format&fit=crop', tags: ['baby_shower'] },

  // Wedding
  { key: 'wedding_three_tier',   label: 'Three-tier Classic',    tier: 'LUXURY',  photoUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&auto=format&fit=crop', tags: ['wedding','tiered'] },
  { key: 'wedding_mini',         label: 'Mini Wedding Tower',    tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&auto=format&fit=crop&sat=-50', tags: ['wedding'] },
  { key: 'wedding_floral',       label: 'Floral Cascade',        tier: 'LUXURY',  photoUrl: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800&auto=format&fit=crop', tags: ['wedding','floral'] },
  { key: 'wedding_fondant',      label: 'Fondant Designer',      tier: 'LUXURY',  photoUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop', tags: ['wedding','fondant'] },

  // Specialty
  { key: 'other_bachelor',       label: 'Bachelor Party',        tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=800&auto=format&fit=crop', tags: ['other','bachelor'] },
  { key: 'other_farewell',       label: 'Office Farewell',       tier: 'STANDARD',photoUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&auto=format&fit=crop', tags: ['other'] },
  { key: 'other_promotion',      label: 'Promotion',             tier: 'STANDARD',photoUrl: 'https://images.unsplash.com/photo-1578775887804-699de7086ff9?w=800&auto=format&fit=crop', tags: ['other'] },
  { key: 'other_floral',         label: 'Floral Buttercream',    tier: 'PREMIUM', photoUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&auto=format&fit=crop', tags: ['other','floral'] },
];

export const CATEGORIES: { key: string; label: string; tagline: string; tag: string }[] = [
  { key: 'anniversary',  label: 'Anniversary Cakes',       tagline: 'From silver to golden jubilees',       tag: 'anniversary' },
  { key: 'birthday',     label: 'Birthday Cakes',          tagline: 'Classic to custom, fondant to photo',  tag: 'birthday'    },
  { key: 'kids',         label: 'Kids Birthday Cakes',     tagline: 'Cartoons, characters, themed',         tag: 'kids'        },
  { key: 'baby_shower',  label: 'Baby Shower Cakes',       tagline: 'Pink, blue and neutral pastels',       tag: 'baby_shower' },
  { key: 'wedding',      label: 'Wedding Cakes',           tagline: 'Tiered towers, fondant couture',       tag: 'wedding'     },
  { key: 'other',        label: 'Specialty Cakes',         tagline: 'Bachelor, farewell, promotion & more', tag: 'other'       },
];

export function cakesForCategory(category: string): CakeDesign[] {
  const cat = CATEGORIES.find(c => c.key === category);
  if (!cat) return [];
  return CAKES.filter(c => c.tags.includes(cat.tag));
}
