// Catalog for Book-a-Singer flow. Unlike cake/decor/pandit the customer
// doesn't pick a specific singer upfront — they specify occasion, genre
// and equipment preference, and the platform books the first available
// singer that matches (hence the "Check Availability" CTA on the summary).
// The gallery on the landing is social proof, not a selector.

export type SingerGenre =
  | 'BOLLYWOOD' | 'CLASSICAL' | 'WESTERN' | 'SUFI' | 'GHAZAL'
  | 'ROCK'      | 'JAZZ'      | 'INDIAN_FOLK' | 'KIRTAN_BHAJAN' | 'TAMIL_TELUGU';

export const OCCASIONS = [
  { key: 'SHADI_KA_GHAR', label: 'Shadi ka Ghar',    icon: '💍' },
  { key: 'SANGEET',       label: 'Sangeet',          icon: '🎶' },
  { key: 'WEDDING',       label: 'Wedding',          icon: '💍' },
  { key: 'RECEPTION',     label: 'Reception',        icon: '🥂' },
  { key: 'ENGAGEMENT',    label: 'Engagement',       icon: '💎' },
  { key: 'ANNIVERSARY',   label: 'Anniversary',      icon: '💝' },
  { key: 'BIRTHDAY',      label: 'Birthday',         icon: '🎂' },
  { key: 'COCKTAIL',      label: 'Cocktail Night',   icon: '🍹' },
  { key: 'CORPORATE',     label: 'Corporate',        icon: '💼' },
  { key: 'POOJA',         label: 'Pooja / Bhajan',   icon: '🪔' },
  { key: 'OTHER',         label: 'Other',            icon: '🎤' },
];

// Genre → base price (without sound equipment, 2-hour performance).
// Equipment surcharge is flat across genres — see `SOUND_EQUIPMENT_PAISE`.
export const GENRES: { key: SingerGenre; label: string; basePaise: number; tagline: string }[] = [
  { key: 'BOLLYWOOD',      label: 'Bollywood',          basePaise: 900000,  tagline: 'Retro hits, latest chartbusters' },
  { key: 'CLASSICAL',      label: 'Classical (Hindustani/Carnatic)', basePaise: 1200000, tagline: 'Sitar, tabla, vocal recitals' },
  { key: 'WESTERN',        label: 'Western',            basePaise: 1100000, tagline: 'Pop, acoustic, English covers' },
  { key: 'SUFI',           label: 'Sufi',               basePaise: 1100000, tagline: 'Qawwali, devotional' },
  { key: 'GHAZAL',         label: 'Ghazal',             basePaise: 1000000, tagline: 'Urdu poetry, soulful renditions' },
  { key: 'ROCK',           label: 'Rock / Band',        basePaise: 1500000, tagline: 'Full band with electric setup' },
  { key: 'JAZZ',           label: 'Jazz',               basePaise: 1300000, tagline: 'Smooth evening, lounge feel' },
  { key: 'INDIAN_FOLK',    label: 'Indian Folk',        basePaise: 900000,  tagline: 'Rajasthani, Maithili, folk medley' },
  { key: 'KIRTAN_BHAJAN',  label: 'Kirtan / Bhajan',    basePaise: 800000,  tagline: 'Devotional singing, puja-friendly' },
  { key: 'TAMIL_TELUGU',   label: 'Tamil / Telugu',     basePaise: 1000000, tagline: 'Carnatic + film songs' },
];

export const PREFERENCES = [
  { key: 'WITH_SOUND',    label: 'With Sound Equipment',    desc: 'Singer brings mic, speaker, amp, mixer' },
  { key: 'WITHOUT_SOUND', label: 'Without Sound Equipment', desc: 'You provide sound setup or it\'s not needed' },
];

export const SOUND_EQUIPMENT_PAISE = 200000;  // ₹2,000 surcharge
export const DEFAULT_PERFORMANCE_HOURS = 2;
export const OVERTIME_PER_MINUTE_PAISE = 1650; // ₹16.5/min

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

// Public gallery entries (social proof on the landing). Customer doesn't
// pick a specific singer — the platform matches after "Check Availability".
export type SingerProfile = {
  key: string;
  name: string;
  genre: SingerGenre;
  photoUrl: string;
  experienceYears: number;
  languages: string[];
  rating: number;
  tagline: string;
};

export const SINGERS: SingerProfile[] = [
  {
    key: 'radhika_kapur',
    name: 'Radhika Kapur',
    genre: 'SUFI',
    photoUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&auto=format&fit=crop',
    experienceYears: 12, languages: ['Hindi', 'Urdu', 'Punjabi'], rating: 4.9,
    tagline: 'Qawwali & Sufi recitals for weddings & anniversaries',
  },
  {
    key: 'arjun_mehta',
    name: 'Arjun Mehta',
    genre: 'BOLLYWOOD',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
    experienceYears: 8, languages: ['Hindi', 'English'], rating: 4.8,
    tagline: 'Retro to chartbusters — sangeet / reception specialist',
  },
  {
    key: 'priya_iyer',
    name: 'Priya Iyer',
    genre: 'CLASSICAL',
    photoUrl: 'https://images.unsplash.com/photo-1519892338195-0b2aa22e6d4a?w=600&auto=format&fit=crop',
    experienceYears: 15, languages: ['Tamil', 'Telugu', 'Sanskrit'], rating: 4.9,
    tagline: 'Carnatic vocalist — pooja, housewarming, classical concerts',
  },
  {
    key: 'acoustic_duo',
    name: 'Acoustic Duo — Zain & Tara',
    genre: 'WESTERN',
    photoUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop',
    experienceYears: 6, languages: ['English', 'Hindi'], rating: 4.7,
    tagline: 'Pop / acoustic — cocktail, reception, intimate gatherings',
  },
  {
    key: 'band_nexus',
    name: 'Nexus — Live Band',
    genre: 'ROCK',
    photoUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop',
    experienceYears: 10, languages: ['English', 'Hindi'], rating: 4.8,
    tagline: 'Full-band setup — engagements, corporate, high-energy parties',
  },
  {
    key: 'vikram_ghazal',
    name: 'Vikram Das',
    genre: 'GHAZAL',
    photoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&auto=format&fit=crop',
    experienceYears: 14, languages: ['Urdu', 'Hindi'], rating: 4.9,
    tagline: 'Ghazal / soulful evenings — anniversaries, classical gatherings',
  },
  {
    key: 'lakshmi_kirtan',
    name: 'Lakshmi Bhajan Samaj',
    genre: 'KIRTAN_BHAJAN',
    photoUrl: 'https://images.unsplash.com/photo-1605979257913-1704eb7b6246?w=600&auto=format&fit=crop',
    experienceYears: 20, languages: ['Hindi', 'Sanskrit', 'Gujarati'], rating: 4.9,
    tagline: 'Kirtan, bhajan, satsang — pooja & festival specialist',
  },
  {
    key: 'jaggu_folk',
    name: 'Jaggu Brothers',
    genre: 'INDIAN_FOLK',
    photoUrl: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&auto=format&fit=crop',
    experienceYears: 9, languages: ['Hindi', 'Rajasthani', 'Marwari'], rating: 4.7,
    tagline: 'Rajasthani folk — shaadi, mehndi, sangeet',
  },
];

export function singersForGenre(g?: SingerGenre): SingerProfile[] {
  if (!g) return SINGERS;
  return SINGERS.filter(s => s.genre === g);
}

export function computePrice(genreKey: SingerGenre | '', preference: string | '', couponDiscountPaise = 0) {
  const genre = GENRES.find(g => g.key === genreKey);
  if (!genre) return null;
  const base = genre.basePaise;
  const equipment = preference === 'WITH_SOUND' ? SOUND_EQUIPMENT_PAISE : 0;
  const service = base + equipment;
  const discount = couponDiscountPaise;
  const taxable = Math.max(0, service - discount);
  const gst = Math.round(taxable * 0.18);
  const total = taxable + gst;
  const advance = Math.round(total * 0.60);
  const balance = total - advance;
  return { base, equipment, service, discount, gst, total, advance, balance };
}
