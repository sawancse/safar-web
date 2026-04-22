// Shared catalog for Pandit / Puja landing + order flow. Each puja has
// its own inclusions, typical duration and dakshina (recommended donation)
// in addition to the fixed service charge.

export type PanditTier = 'STANDARD' | 'PREMIUM' | 'LUXURY';

export type PujaService = {
  key: string;
  label: string;
  tier: PanditTier;
  photoUrl: string;
  pricePaise: number;                 // pandit service charge (before GST)
  durationHours: number;              // typical duration
  recommendedDakshinaPaise: number;   // indicative dakshina shown to customer
  inclusions: string[];               // what's included (pandit, samagri kit, etc.)
  samagri: string[];                  // puja items included in the kit
  tags: string[];                     // occasion keys — lets the landing group pujas
};

export const OCCASIONS = [
  { key: 'HOUSEWARMING',  label: 'Housewarming (Griha Pravesh)', icon: '🏠' },
  { key: 'ANNIVERSARY',   label: 'Anniversary Pujas',            icon: '💝' },
  { key: 'BIRTHDAY',      label: 'Birthday / Ayush Homam',       icon: '🎂' },
  { key: 'CAR_VEHICLE',   label: 'Vehicle / Car Puja',           icon: '🚗' },
  { key: 'BABY',          label: 'Namkaran / Annaprashan',       icon: '👶' },
  { key: 'FESTIVAL',      label: 'Festival Pujas',               icon: '🪔' },
  { key: 'MARRIAGE',      label: 'Marriage / Engagement',        icon: '💍' },
  { key: 'OTHER',         label: 'Other / Custom',               icon: '🙏' },
];

/** Arrival slots in 24-h form — formatted for display with `formatSlot`. */
export const ARRIVAL_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '10:00', '11:00', '12:00', '14:00', '16:00',
  '17:00', '18:00', '19:00',
];

export function formatSlot(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'pm' : 'am';
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hr12} ${period}` : `${hr12}:${String(m).padStart(2, '0')} ${period}`;
}

export const LANGUAGES = [
  'Hindi', 'Sanskrit', 'Telugu', 'Tamil', 'Kannada', 'Malayalam',
  'Marathi', 'Bengali', 'Gujarati', 'Odia', 'Punjabi',
];

export const PUJAS: PujaService[] = [
  // ── Housewarming ───────────────────────────────────────────────────
  {
    key: 'griha_pravesh_standard',
    label: 'Griha Pravesh (Standard)',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?w=800&auto=format&fit=crop',
    pricePaise: 350000,
    durationHours: 2,
    recommendedDakshinaPaise: 50000,
    inclusions: ['1 experienced pandit', 'Basic samagri kit', 'Mantra booklet'],
    samagri: ['Diyas, wicks and ghee', 'Kumkum, haldi, chandan', 'Camphor, incense', 'Betel leaves, coconut', 'Flowers (marigold + rose)', 'Rice, jaggery, fruits'],
    tags: ['HOUSEWARMING'],
  },
  {
    key: 'griha_pravesh_premium',
    label: 'Griha Pravesh (Premium)',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=800&auto=format&fit=crop',
    pricePaise: 600000,
    durationHours: 3,
    recommendedDakshinaPaise: 75000,
    inclusions: ['2 pandits', 'Premium samagri kit', 'Havan setup', 'Personalised sankalp'],
    samagri: ['Extended samagri (15+ items)', 'Havan samagri & hawan kund', 'Akshat rice + dry fruits', 'Silver tumbler & kalash', 'Mango leaves torans'],
    tags: ['HOUSEWARMING'],
  },
  {
    key: 'vastu_shanti',
    label: 'Vastu Shanti Puja',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&auto=format&fit=crop',
    pricePaise: 900000,
    durationHours: 4,
    recommendedDakshinaPaise: 100000,
    inclusions: ['3 pandits', 'Full vastu yagna with 9 dishas', 'Havan + Sankalp + Aarti', 'Custom mantra chanting'],
    samagri: ['Premium samagri kit', 'Navagraha samagri', 'Silver kalash set', 'Full havan kund + ghee'],
    tags: ['HOUSEWARMING'],
  },

  // ── Anniversary ────────────────────────────────────────────────────
  {
    key: 'satyanarayan_small',
    label: 'Satyanarayan Puja (Small)',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1599656432221-4d9cf8b3c1f4?w=800&auto=format&fit=crop',
    pricePaise: 300000,
    durationHours: 2,
    recommendedDakshinaPaise: 50000,
    inclusions: ['1 pandit', 'Satyanarayan katha booklet', 'Samagri kit', 'Prasad arrangement guide'],
    samagri: ['Diyas, wicks, ghee', 'Kumkum, chandan, haldi', 'Flowers, tulsi', 'Panchamrit ingredients', 'Supari, rice, jaggery'],
    tags: ['ANNIVERSARY'],
  },
  {
    key: 'silver_jubilee',
    label: 'Silver Jubilee Puja',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&fit=crop',
    pricePaise: 750000,
    durationHours: 3,
    recommendedDakshinaPaise: 100000,
    inclusions: ['2 pandits', 'Silver jubilee mantras', 'Couple-specific blessings', 'Extended havan'],
    samagri: ['Premium kit', 'Silver kalash', '25-year jubilee yagna samagri', 'Garlands for the couple'],
    tags: ['ANNIVERSARY'],
  },
  {
    key: 'golden_jubilee',
    label: 'Golden Jubilee Puja',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1609152867693-e7fd58b18b93?w=800&auto=format&fit=crop&sat=30',
    pricePaise: 1200000,
    durationHours: 4,
    recommendedDakshinaPaise: 150000,
    inclusions: ['3 pandits', 'Grand havan', 'Guest blessing ceremony', 'Personalised mantras + sankalp'],
    samagri: ['Luxury samagri kit', 'Brass + silver kalash set', 'Full yagna with gold-dipped items', 'Floral decoration for altar'],
    tags: ['ANNIVERSARY'],
  },

  // ── Birthday / Ayush Homam ─────────────────────────────────────────
  {
    key: 'ayush_homam',
    label: 'Ayush Homam (Birthday)',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=800&auto=format&fit=crop',
    pricePaise: 600000,
    durationHours: 3,
    recommendedDakshinaPaise: 75000,
    inclusions: ['2 pandits', 'Ayush homam yagna', 'Sankalp for long life', 'Prasad distribution guidance'],
    samagri: ['Ayush homam samagri', 'Havan kund + ghee', 'Special ayur herbs', 'Flowers + garland'],
    tags: ['BIRTHDAY'],
  },
  {
    key: 'navagraha_shanti',
    label: 'Navagraha Shanti Puja',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1606830733744-0ad778449672?w=800&auto=format&fit=crop&sat=40',
    pricePaise: 1000000,
    durationHours: 4,
    recommendedDakshinaPaise: 100000,
    inclusions: ['2 pandits', 'Full navagraha mantras', 'Individual graha puja', 'Sankalp for birth star'],
    samagri: ['Navagraha samagri kit', 'Nine-metal kalash', 'Graha-specific flowers and seeds', 'Dhoti + angavastram for pandits'],
    tags: ['BIRTHDAY'],
  },

  // ── Car / Vehicle ──────────────────────────────────────────────────
  {
    key: 'car_puja',
    label: 'Vehicle / Car Puja',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&auto=format&fit=crop',
    pricePaise: 150000,
    durationHours: 1,
    recommendedDakshinaPaise: 30000,
    inclusions: ['1 pandit', 'Car puja samagri', 'Wheel aarti', 'Vehicle stickers + lemon + chilli'],
    samagri: ['Coconut, flowers, kumkum', 'Incense + camphor', 'Lemon + chilli charm', 'Blessed red thread'],
    tags: ['CAR_VEHICLE'],
  },

  // ── Baby ───────────────────────────────────────────────────────────
  {
    key: 'namkaran',
    label: 'Namkaran (Naming)',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1623934199716-dc28818a0ca0?w=800&auto=format&fit=crop',
    pricePaise: 500000,
    durationHours: 2,
    recommendedDakshinaPaise: 75000,
    inclusions: ['1 senior pandit', 'Nakshatra calculation', 'Lucky letter + name guidance', 'Cradle puja'],
    samagri: ['Standard samagri kit', 'Baby cradle items', 'Gold-foil paper for name', 'Milk + honey + ghee'],
    tags: ['BABY'],
  },
  {
    key: 'annaprashan',
    label: 'Annaprashan (First Rice)',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1623934199716-dc28818a0ca0?w=800&auto=format&fit=crop&sat=-30',
    pricePaise: 500000,
    durationHours: 2,
    recommendedDakshinaPaise: 75000,
    inclusions: ['1 pandit', 'Annaprashan mantras', 'Silver spoon + bowl (loaned)', 'Family blessings ceremony'],
    samagri: ['Annaprashan samagri', 'Rice, ghee, honey, fruits', 'Flowers + kumkum'],
    tags: ['BABY'],
  },

  // ── Festival ───────────────────────────────────────────────────────
  {
    key: 'lakshmi_puja_diwali',
    label: 'Lakshmi Puja (Diwali)',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1603457461170-3f70e6a0b1e6?w=800&auto=format&fit=crop',
    pricePaise: 500000,
    durationHours: 2,
    recommendedDakshinaPaise: 100000,
    inclusions: ['1 pandit', 'Lakshmi mantra chanting', 'Wealth altar setup', 'Deep-daan guidance'],
    samagri: ['Premium samagri', 'Silver coin + kalash', '21 diyas', 'Marigold + lotus flowers', 'Prasad items'],
    tags: ['FESTIVAL'],
  },
  {
    key: 'ganesh_puja',
    label: 'Ganesh Chaturthi Puja',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1627893649776-9e8e63a5ca99?w=800&auto=format&fit=crop',
    pricePaise: 400000,
    durationHours: 2,
    recommendedDakshinaPaise: 51000,
    inclusions: ['1 pandit', 'Ganesh sthapana + visarjan prep', 'Modak prasad guidance', '16-step puja'],
    samagri: ['Ganesh puja kit', 'Durva grass, red flowers', 'Modak ingredients'],
    tags: ['FESTIVAL'],
  },

  // ── Marriage / Engagement ──────────────────────────────────────────
  {
    key: 'engagement',
    label: 'Engagement (Sagai) Puja',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop',
    pricePaise: 800000,
    durationHours: 3,
    recommendedDakshinaPaise: 100000,
    inclusions: ['2 pandits', 'Ring-exchange mantras', 'Family sankalp', 'Ganesh + Lakshmi puja'],
    samagri: ['Engagement samagri', 'Ring-exchange plate', 'Haldi + kumkum for couples', 'Flowers + garlands'],
    tags: ['MARRIAGE'],
  },
  {
    key: 'wedding_pandit',
    label: 'Wedding Pandit (Full)',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&sat=40',
    pricePaise: 2500000,
    durationHours: 6,
    recommendedDakshinaPaise: 250000,
    inclusions: ['3 pandits', 'Complete wedding rituals', 'Pre-wedding pujas', 'Mandap + havan setup guidance'],
    samagri: ['Full wedding samagri', 'Havan kund set', 'Saptapadi + kanyadaan items', 'Mangalsutra blessings'],
    tags: ['MARRIAGE'],
  },

  // ── Other ──────────────────────────────────────────────────────────
  {
    key: 'custom_puja',
    label: 'Custom / Any other puja',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=800&auto=format&fit=crop&sat=-30',
    pricePaise: 300000,
    durationHours: 2,
    recommendedDakshinaPaise: 50000,
    inclusions: ['1 pandit', 'Scope to be agreed via WhatsApp', 'Basic samagri kit'],
    samagri: ['Configurable on request'],
    tags: ['OTHER'],
  },
];

export function pujasForOccasion(key: string): PujaService[] {
  return PUJAS.filter(p => p.tags.includes(key));
}
