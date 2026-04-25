// Metadata for every "simple" partner service that shares the same L2
// landing layout. Keyed by URL slug — each entry is consumed by the
// [service] dynamic route. Add / remove entries here instead of creating
// one bespoke page per service.
//
// `pricingKey` maps to `item_key` in event_pricing_defaults so the landing
// can show a live "from ₹X" label + the customer's booking flow shares the
// same pricing source of truth.

export type ServiceTemplate = {
  slug: string;
  pricingKey: string;
  focusKey?: string;                          // defaults to pricingKey; pass different if /cooks/events expects it
  label: string;
  icon: string;

  // Hero
  heroTagline: string;                        // small uppercase pre-headline
  heroPrefix?: string;                        // optional pre-emphasis line
  heroSubheading: string;                     // 1-2 sentence description
  heroChips: string[];                        // 3 feature chips under subheading
  heroPhoto: string;
  heroBadge: string;

  // Theme
  heroGradient: string;                       // hero bg gradient
  ctaBg: string;                              // primary button bg
  ctaHover: string;                           // primary button hover
  accentText: string;                         // small badge accent text

  // Gallery (4-8 images recommended)
  galleryTitle: string;
  gallerySubtitle: string;
  gallery: { label: string; photoUrl: string }[];

  // Optional overrides — defaults used if omitted
  howItWorks?: { icon: string; title: string; body: string }[];
  testimonials?: { name: string; city: string; text: string; stars?: number }[];
  faq?: { q: string; a: string }[];

  // Trust stats (shown in hero)
  stats?: { n: string; l: string }[];
};

// Default sections reused across services that don't provide their own.
export const DEFAULT_HOW_IT_WORKS = [
  { icon: '📝', title: 'Pick your service',     body: 'Browse designs and pick what fits your event. Transparent pricing, no hidden fees.' },
  { icon: '📅', title: 'Book + pay advance',    body: 'Share date, time and venue. Secure a 60% advance to lock in the booking.' },
  { icon: '🤝', title: 'We coordinate',         body: 'Our partner reaches out on WhatsApp within 2 hours to finalise any specifics.' },
  { icon: '🎉', title: 'On-time service',       body: 'The partner arrives on time, delivers, and a unique check-in OTP is shared for your safety.' },
];

export const DEFAULT_TESTIMONIALS = [
  { name: 'Priya R.',  city: 'Hyderabad', text: 'Smooth experience — booked online, partner confirmed on WhatsApp, arrived on time. Highly recommend.', stars: 5 },
  { name: 'Arun S.',   city: 'Bengaluru', text: 'Quality was excellent and the advance payment gave me peace of mind. Will book again.',                 stars: 5 },
  { name: 'Neha M.',   city: 'Mumbai',    text: 'Customer support via WhatsApp was quick. Partner was professional and delivered above expectations.',   stars: 5 },
];

export const DEFAULT_FAQ = [
  { q: 'How far in advance should I book?', a: 'Minimum 24 hours for most services; 48-72 hours for premium or peak-day bookings (weddings, festivals).' },
  { q: 'Which cities do you serve?',        a: 'Currently 20 cities including Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai, Pune, Ahmedabad, Jaipur, Kolkata and more.' },
  { q: 'Is the advance refundable?',        a: '60% advance locks in the partner and date. Cancellations up to 12 hours after booking are fully refundable. After that the advance is non-refundable.' },
  { q: 'Can I customise?',                  a: 'Yes — after booking, our partner reaches out on WhatsApp within 2 hours to discuss theme, colours, timing and any special requests.' },
  { q: 'How do I know the partner is vetted?', a: 'Every partner on our platform goes through KYC, reference checks and sample-work review. You also get a unique check-in OTP on the event day.' },
];

export const SERVICES: Record<string, ServiceTemplate> = {
  // ── Photography ───────────────────────────────────────────────────
  photographer: {
    slug: 'photographer',
    pricingKey: 'photography',
    label: 'Photographer',
    icon: '📷',
    heroTagline: 'Candid · Traditional · Drone',
    heroSubheading: 'Experienced photographers for birthdays, anniversaries, weddings and corporate events. Same-day highlights available.',
    heroChips: ['✓ Candid + posed coverage', '✓ Edited photos in 72 hrs', '✓ Optional highlight reel'],
    heroPhoto: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1000&auto=format&fit=crop',
    heroBadge: '200+ photographers',
    heroGradient: 'from-violet-100 via-fuchsia-50 to-pink-50',
    ctaBg:    'bg-violet-600 hover:bg-violet-700',
    ctaHover: 'text-violet-600',
    accentText: 'text-violet-600',
    galleryTitle: 'Recent work',
    gallerySubtitle: 'A taste of what our photographers capture.',
    gallery: [
      { label: 'Birthday candid',        photoUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop' },
      { label: 'Anniversary portrait',   photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop' },
      { label: 'Wedding ceremony',       photoUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&auto=format&fit=crop' },
      { label: 'Baby shower',            photoUrl: 'https://images.unsplash.com/photo-1515816052601-210d5501d471?w=600&auto=format&fit=crop' },
      { label: 'Corporate event',        photoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop' },
      { label: 'Cocktail party',         photoUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop' },
    ],
    stats: [{ n: '3L+', l: 'Events shot' }, { n: '20', l: 'Cities' }, { n: '4.8 ★', l: 'Rating' }],
  },

  // ── Videography ───────────────────────────────────────────────────
  videographer: {
    slug: 'videographer',
    pricingKey: 'videography',
    label: 'Videographer',
    icon: '🎥',
    heroTagline: 'Cinematic · Highlight reel · Drone',
    heroSubheading: 'Professional videographers capturing your event in full detail — from highlight reels to full-event films.',
    heroChips: ['✓ 4K cinematic', '✓ Highlight reel in 72 hrs', '✓ Drone on request'],
    heroPhoto: 'https://images.unsplash.com/photo-1598618356794-eb1720430eb4?w=1000&auto=format&fit=crop',
    heroBadge: '150+ videographers',
    heroGradient: 'from-indigo-100 via-violet-50 to-purple-50',
    ctaBg:    'bg-indigo-600 hover:bg-indigo-700',
    ctaHover: 'text-indigo-600',
    accentText: 'text-indigo-600',
    galleryTitle: 'Recent films',
    gallerySubtitle: 'A sampling of our videographers\' work.',
    gallery: [
      { label: 'Wedding highlight',  photoUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&auto=format&fit=crop' },
      { label: 'Sangeet',            photoUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop' },
      { label: 'Birthday cinematic', photoUrl: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&auto=format&fit=crop' },
      { label: 'Anniversary',        photoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop' },
    ],
    stats: [{ n: '1L+', l: 'Videos delivered' }, { n: '20', l: 'Cities' }, { n: '4.7 ★', l: 'Rating' }],
  },

  // ── DJ ────────────────────────────────────────────────────────────
  dj: {
    slug: 'dj',
    pricingKey: 'dj',
    label: 'DJ & Sound',
    icon: '🎧',
    heroTagline: 'Bollywood · Hip-hop · EDM · Retro',
    heroSubheading: 'Professional DJs with full sound + lights setup. Birthdays, cocktails, weddings, corporate gigs.',
    heroChips: ['✓ Sound + lights included', '✓ Mixed playlist', '✓ MC on request'],
    heroPhoto: 'https://images.unsplash.com/photo-1571266028243-d220c6a3a6b2?w=1000&auto=format&fit=crop',
    heroBadge: '80+ DJs',
    heroGradient: 'from-sky-100 via-blue-50 to-indigo-50',
    ctaBg:    'bg-blue-600 hover:bg-blue-700',
    ctaHover: 'text-blue-600',
    accentText: 'text-blue-600',
    galleryTitle: 'Recent gigs',
    gallerySubtitle: 'Our DJs in action.',
    gallery: [
      { label: 'Cocktail night',   photoUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop' },
      { label: 'Sangeet',          photoUrl: 'https://images.unsplash.com/photo-1571266028243-d220c6a3a6b2?w=600&auto=format&fit=crop' },
      { label: 'Corporate party',  photoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop' },
      { label: 'Birthday bash',    photoUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop' },
    ],
  },

  // NOTE: `live-music` and `appliances` had entries here but now have their
  // own bespoke pages at /services/live-music/ and /services/
  // appliances/ which take precedence over this dynamic route.

  // ── MC / Host ─────────────────────────────────────────────────────
  mc: {
    slug: 'mc',
    pricingKey: 'mc',
    label: 'MC / Host',
    icon: '🎤',
    heroTagline: 'Bilingual · Energetic · Professional',
    heroSubheading: 'Anchors to run your evening — keep the flow, introduce speakers, engage guests, handle announcements.',
    heroChips: ['✓ Hindi / English / regional', '✓ Script + rehearsal included', '✓ Games & activities optional'],
    heroPhoto: 'https://images.unsplash.com/photo-1559223607-a43c990c692c?w=1000&auto=format&fit=crop',
    heroBadge: '50+ MCs',
    heroGradient: 'from-yellow-100 via-amber-50 to-orange-50',
    ctaBg:    'bg-amber-500 hover:bg-amber-600',
    ctaHover: 'text-amber-600',
    accentText: 'text-amber-600',
    galleryTitle: 'Our hosts',
    gallerySubtitle: 'Professional anchors for every event size.',
    gallery: [
      { label: 'Wedding MC',      photoUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop' },
      { label: 'Corporate host',  photoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop' },
      { label: 'Birthday MC',     photoUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop' },
    ],
  },

  // ── Makeup ────────────────────────────────────────────────────────
  makeup: {
    slug: 'makeup',
    pricingKey: 'makeup',
    label: 'Makeup Artist',
    icon: '💄',
    heroTagline: 'Bridal · Party · HD · Airbrush',
    heroSubheading: 'Certified makeup artists for the couple, guest of honour or full bridal parties — at your home, on your schedule.',
    heroChips: ['✓ HD & airbrush makeup', '✓ Hair styling included', '✓ Trial before the day'],
    heroPhoto: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1000&auto=format&fit=crop',
    heroBadge: '120+ artists',
    heroGradient: 'from-rose-100 via-fuchsia-50 to-pink-50',
    ctaBg:    'bg-fuchsia-600 hover:bg-fuchsia-700',
    ctaHover: 'text-fuchsia-600',
    accentText: 'text-fuchsia-600',
    galleryTitle: 'Recent looks',
    gallerySubtitle: 'Bridal, party and day looks.',
    gallery: [
      { label: 'Bridal glam',       photoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop' },
      { label: 'Natural party',     photoUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&auto=format&fit=crop' },
      { label: 'Reception look',    photoUrl: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop' },
      { label: 'Engagement look',   photoUrl: 'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=600&auto=format&fit=crop' },
    ],
  },

  // ── Mehndi ────────────────────────────────────────────────────────
  mehndi: {
    slug: 'mehndi',
    pricingKey: 'mehndi',
    label: 'Mehndi Artist',
    icon: '🎨',
    heroTagline: 'Arabic · Indian · Moroccan · Minimal',
    heroSubheading: 'Intricate mehndi designs — for the bride, family or guests. Organic cones only, stain guarantee.',
    heroChips: ['✓ 100% organic cones', '✓ Bridal to minimal styles', '✓ Travels to your venue'],
    heroPhoto: 'https://images.unsplash.com/photo-1615716174835-7ba6bf7a0562?w=1000&auto=format&fit=crop',
    heroBadge: '80+ artists',
    heroGradient: 'from-lime-100 via-green-50 to-emerald-50',
    ctaBg:    'bg-emerald-600 hover:bg-emerald-700',
    ctaHover: 'text-emerald-600',
    accentText: 'text-emerald-600',
    galleryTitle: 'Our work',
    gallerySubtitle: 'Bridal, arabic and light minimal styles.',
    gallery: [
      { label: 'Full bridal',    photoUrl: 'https://images.unsplash.com/photo-1615716174835-7ba6bf7a0562?w=600&auto=format&fit=crop' },
      { label: 'Arabic',         photoUrl: 'https://images.unsplash.com/photo-1617102918907-e50e4c9db9ed?w=600&auto=format&fit=crop' },
      { label: 'Minimal hand',   photoUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&auto=format&fit=crop' },
      { label: 'Guests quick',   photoUrl: 'https://images.unsplash.com/photo-1615716174835-7ba6bf7a0562?w=600&auto=format&fit=crop&sat=-30' },
    ],
  },

  // ── Bouquet & Gifts ───────────────────────────────────────────────
  bouquet: {
    slug: 'bouquet',
    pricingKey: 'bouquet',
    label: 'Bouquet & Gifts',
    icon: '💐',
    heroTagline: 'Anniversary · Birthday · Custom hampers',
    heroSubheading: 'Fresh-flower bouquets, chocolate hampers and curated gift boxes — delivered in-city, same day.',
    heroChips: ['✓ Same-day delivery', '✓ Fresh flowers', '✓ Custom hampers'],
    heroPhoto: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=1000&auto=format&fit=crop',
    heroBadge: '500+ combos',
    heroGradient: 'from-red-100 via-rose-50 to-pink-50',
    ctaBg:    'bg-rose-600 hover:bg-rose-700',
    ctaHover: 'text-rose-600',
    accentText: 'text-rose-600',
    galleryTitle: 'Popular gifts',
    gallerySubtitle: 'A selection of curated bouquets and hampers.',
    gallery: [
      { label: 'Rose bouquet',        photoUrl: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=600&auto=format&fit=crop' },
      { label: 'Chocolate hamper',    photoUrl: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600&auto=format&fit=crop' },
      { label: 'Mixed flowers',       photoUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&auto=format&fit=crop' },
      { label: 'Wine + choco combo',  photoUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop' },
    ],
  },

  // ── Entertainer ───────────────────────────────────────────────────
  entertainer: {
    slug: 'entertainer',
    pricingKey: 'entertainer',
    label: 'Live Entertainer',
    icon: '🎩',
    heroTagline: 'Magicians · Puppet · Games · Mentalist',
    heroSubheading: 'Kids-friendly magicians, mentalists and hosts. Make any birthday, anniversary or corporate party memorable.',
    heroChips: ['✓ Kids-safe routines', '✓ 45-90 min acts', '✓ Prop magic + balloon art'],
    heroPhoto: 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=1000&auto=format&fit=crop',
    heroBadge: '40+ entertainers',
    heroGradient: 'from-indigo-100 via-purple-50 to-pink-50',
    ctaBg:    'bg-purple-600 hover:bg-purple-700',
    ctaHover: 'text-purple-600',
    accentText: 'text-purple-600',
    galleryTitle: 'Our performers',
    gallerySubtitle: 'Magicians, mentalists and party hosts.',
    gallery: [
      { label: 'Magic show',     photoUrl: 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?w=600&auto=format&fit=crop' },
      { label: 'Kids party',     photoUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop' },
      { label: 'Mentalist act',  photoUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop' },
    ],
  },

  // ── Valet / Parking ───────────────────────────────────────────────
  valet: {
    slug: 'valet',
    pricingKey: 'valet',
    label: 'Valet / Parking',
    icon: '🚗',
    heroTagline: 'Uniformed · Insured · Courteous',
    heroSubheading: 'Valet + parking marshals so your guests don\'t have to think about where to park. Ideal for weddings and big gatherings.',
    heroChips: ['✓ Uniformed staff', '✓ Insurance cover', '✓ Marshals + signage'],
    heroPhoto: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1000&auto=format&fit=crop',
    heroBadge: '30+ teams',
    heroGradient: 'from-slate-100 via-gray-50 to-zinc-50',
    ctaBg:    'bg-slate-700 hover:bg-slate-800',
    ctaHover: 'text-slate-700',
    accentText: 'text-slate-700',
    galleryTitle: 'Our teams',
    gallerySubtitle: 'Courteous, insured, on-time.',
    gallery: [
      { label: 'Valet uniformed', photoUrl: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=600&auto=format&fit=crop' },
      { label: 'Parking marshal', photoUrl: 'https://images.unsplash.com/photo-1597076545399-91a0ff5b9a1b?w=600&auto=format&fit=crop' },
    ],
  },

  // ── Fine Dine Setup ───────────────────────────────────────────────
  'fine-dine': {
    slug: 'fine-dine',
    pricingKey: 'table_setup',
    label: 'Fine Dine Setup',
    icon: '🕯️',
    heroTagline: 'Candles · Cloth · Florals · Chinaware',
    heroSubheading: 'Premium tablecloth, centerpiece florals, candles and chinaware — turn your dining room into a restaurant.',
    heroChips: ['✓ Setup in under 2 hrs', '✓ Crockery + cutlery', '✓ Cleanup included'],
    heroPhoto: 'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=1000&auto=format&fit=crop',
    heroBadge: '60+ themes',
    heroGradient: 'from-rose-100 via-amber-50 to-orange-50',
    ctaBg:    'bg-rose-600 hover:bg-rose-700',
    ctaHover: 'text-rose-600',
    accentText: 'text-rose-600',
    galleryTitle: 'Fine-dine themes',
    gallerySubtitle: 'Romantic, elegant, minimal — your pick.',
    gallery: [
      { label: 'Candle-lit romantic', photoUrl: 'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=600&auto=format&fit=crop' },
      { label: 'Floral elegant',      photoUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&auto=format&fit=crop' },
      { label: 'Rustic minimal',      photoUrl: 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=600&auto=format&fit=crop' },
      { label: 'Terrace dinner',      photoUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format&fit=crop' },
    ],
  },

  // ── Crockery Rental ───────────────────────────────────────────────
  crockery: {
    slug: 'crockery',
    pricingKey: 'crockery',
    label: 'Crockery Rental',
    icon: '🍽️',
    heroTagline: 'Plates · Glasses · Cutlery · Serving bowls',
    heroSubheading: 'High-quality crockery, glassware and cutlery rental — pickup / drop included.',
    heroChips: ['✓ Plates + bowls + spoons', '✓ Wine + cocktail glasses', '✓ Serving ware included'],
    heroPhoto: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000&auto=format&fit=crop',
    heroBadge: '500+ sets',
    heroGradient: 'from-slate-100 via-gray-50 to-zinc-50',
    ctaBg:    'bg-slate-700 hover:bg-slate-800',
    ctaHover: 'text-slate-700',
    accentText: 'text-slate-700',
    galleryTitle: 'Rental sets',
    gallerySubtitle: 'Classic, gold-rim, premium porcelain.',
    gallery: [
      { label: 'Banquet set',   photoUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop' },
      { label: 'Fine china',    photoUrl: 'https://images.unsplash.com/photo-1542834369-f10ebf06d3e0?w=600&auto=format&fit=crop' },
      { label: 'Glassware',     photoUrl: 'https://images.unsplash.com/photo-1520637836862-4d197d17c55a?w=600&auto=format&fit=crop' },
    ],
  },

  // appliances moved to /services/appliances/ bespoke pages.
};

export function getService(slug: string): ServiceTemplate | undefined {
  return SERVICES[slug];
}

export function allServiceSlugs(): string[] {
  return Object.keys(SERVICES);
}
