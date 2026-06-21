// Shubh Muhurat 2026 reference data for the Pandit / Puja landing page.
// Dates are indicative (sourced from Drik Panchang / Prokerala / GaneshaSpeaks
// style Hindu Panchang). All muhurats are location-based and many vary slightly
// by source — they should be confirmed with a pandit for the family's
// gotra/nakshatra and exact city. Empty months reflect genuine Panchang
// restrictions (e.g. Kharmas / Chaturmas).

export type MuhuratCategory = {
  key: string;
  label: string;
  icon: string;
  note: string;
  dates: string[]; // ISO YYYY-MM-DD
  /** occasion key in catalog.ts, so we can deep-link "Book" to the right puja group */
  occasion?: string;
};

export const MUHURATS_2026: MuhuratCategory[] = [
  {
    key: 'grihaPravesh',
    label: 'Griha Pravesh',
    icon: '🏠',
    occasion: 'HOUSEWARMING',
    note: 'Chosen by moon nakshatra (Rohini, Mrigashira, Hasta, Anuradha, Revati), tithi, weekday and lagna — avoiding Chaturmas and eclipses. No muhurats in Jan, Aug, Sep, Oct 2026.',
    dates: ['2026-02-06', '2026-02-11', '2026-02-19', '2026-02-21', '2026-02-25', '2026-03-04', '2026-03-09', '2026-03-13', '2026-04-20', '2026-05-08', '2026-06-24', '2026-07-01', '2026-11-14', '2026-11-20', '2026-12-04', '2026-12-11'],
  },
  {
    key: 'marriage',
    label: 'Marriage / Vivah',
    icon: '💍',
    occasion: 'MARRIAGE',
    note: "Fixed using the bride's and groom's nakshatras and rashis with an auspicious tithi and lagna. No dates in Jan (Venus combustion) or during Chaturmas (Jul–Oct). Match to both horoscopes with a pandit.",
    dates: ['2026-02-04', '2026-02-06', '2026-02-08', '2026-02-12', '2026-02-19', '2026-02-21', '2026-02-25', '2026-05-01', '2026-05-05', '2026-05-08', '2026-05-13', '2026-11-22', '2026-11-25', '2026-12-04', '2026-12-11'],
  },
  {
    key: 'vehicle',
    label: 'Vehicle Purchase',
    icon: '🚗',
    occasion: 'CAR_VEHICLE',
    note: 'Favours swift nakshatras (Pushya, Hasta, Chitra, Swati, Anuradha, Revati, Shravana) and Wed/Thu/Fri; Tue and Sat avoided. Akshaya Tritiya, Dussehra and Dhanteras are also auspicious. Avoid Rahu Kaal.',
    dates: ['2026-01-14', '2026-01-21', '2026-01-28', '2026-02-11', '2026-02-26', '2026-03-06', '2026-03-15', '2026-04-13', '2026-04-20', '2026-05-11', '2026-07-08', '2026-12-13'],
  },
  {
    key: 'naamkaran',
    label: 'Naamkaran',
    icon: '👶',
    occasion: 'BABY',
    note: 'Traditionally on the 11th–12th day after birth, so the muhurat is set from the baby’s own birth nakshatra. Days below are commonly cited 2026 windows — the actual date must be set by a pandit using the child’s birth details.',
    dates: ['2026-01-14', '2026-01-21', '2026-01-28', '2026-02-05', '2026-02-12', '2026-02-19', '2026-03-06', '2026-03-13', '2026-04-09', '2026-04-17', '2026-08-13', '2026-09-13', '2026-10-14', '2026-10-22'],
  },
  {
    key: 'bhoomiPujan',
    label: 'Bhoomi Pujan',
    icon: '🧱',
    occasion: 'HOUSEWARMING',
    note: 'Land worship before construction — favours Vaishakh, Shravan, Margashirsha and Phalgun months with nakshatras Rohini, Mrigashira, Pushya, Hasta, Chitra, Anuradha and Revati. Avoid Amavasya, eclipses, Holashtak and Pitru Paksha.',
    dates: ['2026-02-19', '2026-03-04', '2026-03-14', '2026-04-20', '2026-05-09', '2026-06-24', '2026-10-30', '2026-11-14', '2026-11-20', '2026-12-04', '2026-12-06', '2026-12-11'],
  },
  {
    key: 'mundan',
    label: 'Mundan',
    icon: '✂️',
    occasion: 'BABY',
    note: 'Chudakarana (tonsure) is performed in odd years of the child’s age, daytime only, on auspicious nakshatras (Ashwini, Mrigashira, Pushya, Hasta, Chitra, Shravana, Revati). No muhurats Aug–Dec 2026.',
    dates: ['2026-01-20', '2026-01-21', '2026-01-31', '2026-02-06', '2026-02-11', '2026-02-18', '2026-02-26', '2026-03-05', '2026-03-16', '2026-05-04', '2026-05-09', '2026-05-14', '2026-06-17', '2026-06-24', '2026-07-02', '2026-07-09', '2026-07-15', '2026-07-20'],
  },
];

/** Pretty-print an ISO date as e.g. "4 Feb". */
export function formatMuhuratDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Upcoming dates (>= today) for a category, capped to `limit`. */
export function upcomingDates(dates: string[], todayIso: string, limit = 6): string[] {
  return dates.filter(d => d >= todayIso).slice(0, limit);
}
