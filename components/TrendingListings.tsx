'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ListingCard from '@/components/ListingCard';

export default function TrendingListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.search({ size: '6' })
      .then((res) => setListings(res.content ?? []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Trending properties</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-100 h-72 animate-pulse" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">&#x1F3E0;</p>
          <p>Be the first to list your property on Safar!</p>
          <a
            href="/host"
            className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-orange-600"
          >
            List your space &#x2192;
          </a>
        </div>
      )}
    </section>
  );
}
