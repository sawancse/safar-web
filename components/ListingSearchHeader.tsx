'use client';

import Link from 'next/link';
import SearchBar from '@/components/SearchBar';

const TYPE_LABELS: Record<string, string> = {
  HOME: 'Homes', ROOM: 'Rooms', VILLA: 'Villas', HOTEL: 'Hotels',
  RESORT: 'Resorts', HOMESTAY: 'Homestays', PG: 'PG', COLIVING: 'Co-living',
  FARMSTAY: 'Farm Stays', HOSTEL: 'Hostels', UNIQUE: 'Unique Stays',
  COMMERCIAL: 'Commercial', BUDGET_HOTEL: 'Budget Hotels', HOSTEL_DORM: 'Hostels',
  GUESTHOUSE: 'Guesthouses', LODGE: 'Lodges', BNB: 'B&Bs', APARTMENT: 'Apartments',
};

interface Props {
  city: string;
  state: string;
  type: string;
}

export default function ListingSearchHeader({ city, state, type }: Props) {
  return (
    <div className="bg-[#003B95]">
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-3">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link href={`/search?city=${encodeURIComponent(city)}`} className="hover:text-white transition">{city}</Link>
          <span>/</span>
          <Link href={`/search?type=${type}&city=${encodeURIComponent(city)}`} className="hover:text-white transition">
            {TYPE_LABELS[type] || type}
          </Link>
        </nav>

        {/* Same SearchBar as homepage */}
        <SearchBar initialCity={city} />
      </div>
    </div>
  );
}
