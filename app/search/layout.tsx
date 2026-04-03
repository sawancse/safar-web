import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Stays — Homes, PGs, Hotels, Villas',
  description: 'Search and book verified properties across 50+ Indian cities. Filter by price, type, amenities. Instant booking with zero commission.',
  alternates: { canonical: 'https://ysafar.com/search' },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
