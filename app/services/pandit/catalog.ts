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
  { key: 'DOSH_NIVARAN',  label: 'Dosh Nivaran & Grah Shanti',   icon: '🪐' },
  { key: 'PAATH_JAAP',    label: 'Paath, Jaap & Havan',          icon: '📿' },
  { key: 'ANNIVERSARY',   label: 'Anniversary Pujas',            icon: '💝' },
  { key: 'BIRTHDAY',      label: 'Birthday / Ayush Homam',       icon: '🎂' },
  { key: 'CAR_VEHICLE',   label: 'Vehicle / Car Puja',           icon: '🚗' },
  { key: 'BABY',          label: 'Namkaran / Mundan',            icon: '👶' },
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
    photoUrl: 'https://images.unsplash.com/photo-1606830733744-0ad778449672?w=800&auto=format&fit=crop',
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
    photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&sat=30',
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
    photoUrl: 'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=800&auto=format&fit=crop',
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
    photoUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&auto=format&fit=crop',
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
    photoUrl: 'https://images.unsplash.com/photo-1606830733744-0ad778449672?w=800&auto=format&fit=crop&sat=20',
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
    photoUrl: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=800&auto=format&fit=crop&sat=20',
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

  // ── Housewarming (extra) ───────────────────────────────────────────
  {
    key: 'bhoomi_pujan',
    label: 'Bhoomi Pujan (Ground-breaking)',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&auto=format&fit=crop',
    pricePaise: 550000,
    durationHours: 3,
    recommendedDakshinaPaise: 75000,
    inclusions: ['2 pandits', 'Bhoomi pujan + Vastu purush sankalp', 'Foundation-stone ritual', 'Naag-devta & directional puja'],
    samagri: ['Bhoomi pujan samagri', 'Silver naag-naagin pair', 'Bricks/foundation items guidance', 'Copper kalash, navadhanya'],
    tags: ['HOUSEWARMING'],
  },

  // ── Dosh Nivaran & Grah Shanti ─────────────────────────────────────
  {
    key: 'kaal_sarp_dosh',
    label: 'Kaal Sarp Dosh Nivaran',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop',
    pricePaise: 1100000,
    durationHours: 4,
    recommendedDakshinaPaise: 150000,
    inclusions: ['2 senior pandits', 'Rahu-Ketu shanti japa', 'Naag-bali & sarpa-dosha homam', 'Personalised sankalp by birth chart'],
    samagri: ['Kaal sarp dosh samagri', 'Silver naag-naagin pair', 'Rudraksha & nag-kesar', 'Navagraha samidha for havan'],
    tags: ['DOSH_NIVARAN'],
  },
  {
    key: 'mangal_dosh_shanti',
    label: 'Mangal Dosh (Manglik) Shanti',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1604608672516-f1b9b1e0a9b6?w=800&auto=format&fit=crop',
    pricePaise: 700000,
    durationHours: 3,
    recommendedDakshinaPaise: 100000,
    inclusions: ['2 pandits', 'Mangal grah shanti japa', 'Kumbh vivah guidance (if advised)', 'Red-coral & Hanuman puja'],
    samagri: ['Mangal dosh samagri', 'Red flowers, masoor dal, gud', 'Copper kalash', 'Havan samidha + ghee'],
    tags: ['DOSH_NIVARAN'],
  },
  {
    key: 'pitra_dosh_shanti',
    label: 'Pitra Dosh / Shradh Shanti',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1582632431446-72b7cb9f4b3f?w=800&auto=format&fit=crop',
    pricePaise: 650000,
    durationHours: 3,
    recommendedDakshinaPaise: 100000,
    inclusions: ['2 pandits', 'Pitra dosh nivaran & tarpan', 'Pind-daan guidance', 'Narayan bali sankalp'],
    samagri: ['Tarpan & pind-daan samagri', 'Black til, jau, kusha grass', 'Banana leaf & kheer items', 'Brahmin-bhoj guidance'],
    tags: ['DOSH_NIVARAN'],
  },
  {
    key: 'shani_shanti',
    label: 'Shani Shanti / Sade Sati Puja',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=800&auto=format&fit=crop',
    pricePaise: 700000,
    durationHours: 3,
    recommendedDakshinaPaise: 100000,
    inclusions: ['1 senior pandit', 'Shani grah japa (23,000 mantras)', 'Sade-sati / dhaiya relief sankalp', 'Til-tel abhishek'],
    samagri: ['Shani shanti samagri', 'Black til, mustard oil, iron items', 'Blue flowers, urad dal', 'Havan samidha'],
    tags: ['DOSH_NIVARAN'],
  },

  // ── Paath, Jaap & Havan ────────────────────────────────────────────
  {
    key: 'sundarkand_paath',
    label: 'Sundarkand Paath',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1609619385002-f40f1df9b7eb?w=800&auto=format&fit=crop',
    pricePaise: 350000,
    durationHours: 3,
    recommendedDakshinaPaise: 51000,
    inclusions: ['1 pandit (with bhajan mandali on request)', 'Full Sundarkand recitation', 'Hanuman puja + aarti', 'Prasad guidance'],
    samagri: ['Hanuman puja samagri', 'Sindoor, chameli oil', 'Boondi/laddu prasad guidance', 'Flowers + incense'],
    tags: ['PAATH_JAAP'],
  },
  {
    key: 'maha_mrityunjaya_jaap',
    label: 'Maha Mrityunjaya Jaap',
    tier: 'LUXURY',
    photoUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&auto=format&fit=crop',
    pricePaise: 1100000,
    durationHours: 5,
    recommendedDakshinaPaise: 150000,
    inclusions: ['3 pandits', '1.25 lakh Maha Mrityunjaya mantra jaap', 'Rudra havan + abhishek', 'Health & longevity sankalp'],
    samagri: ['Maha Mrityunjaya samagri', 'Rudraksha mala, bilva patra', 'Panchamrit abhishek items', 'Havan kund + ghee + samidha'],
    tags: ['PAATH_JAAP'],
  },
  {
    key: 'rudrabhishek',
    label: 'Rudrabhishek Puja',
    tier: 'PREMIUM',
    photoUrl: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&auto=format&fit=crop',
    pricePaise: 650000,
    durationHours: 3,
    recommendedDakshinaPaise: 100000,
    inclusions: ['2 pandits', 'Shiva Rudri abhishek (11 path)', 'Panchamrit & jalabhishek', 'Bilva-archana + aarti'],
    samagri: ['Rudrabhishek samagri', 'Bilva patra, dhatura, bhang', 'Panchamrit (milk, curd, ghee, honey, sugar)', 'Gangajal + flowers'],
    tags: ['PAATH_JAAP'],
  },

  // ── Baby (extra) ───────────────────────────────────────────────────
  {
    key: 'mundan',
    label: 'Mundan (Tonsure) Ceremony',
    tier: 'STANDARD',
    photoUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop',
    pricePaise: 400000,
    durationHours: 2,
    recommendedDakshinaPaise: 51000,
    inclusions: ['1 pandit', 'Mundan sankalp & mantras', 'Choti-rakhne ritual', 'Coordination with barber (customer-arranged)'],
    samagri: ['Mundan samagri kit', 'Haldi, kumkum, akshat', 'Banana leaf & sweets guidance', 'Flowers + diya'],
    tags: ['BABY'],
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
