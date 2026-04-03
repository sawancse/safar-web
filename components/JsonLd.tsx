export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Safar',
    url: 'https://ysafar.com',
    logo: 'https://ysafar.com/logo.png',
    description: 'India\'s zero-commission property rental marketplace. Book homes, PGs, hotels, villas, and unique stays.',
    foundingDate: '2026',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Safar',
    url: 'https://ysafar.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://ysafar.com/search?query={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ListingJsonLd({ listing }: { listing: any }) {
  if (!listing) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: listing.title,
    description: listing.description?.slice(0, 300),
    url: `https://ysafar.com/listings/${listing.id}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.city,
      addressRegion: listing.state,
      addressCountry: 'IN',
    },
    ...(listing.lat && listing.lng ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.lat,
        longitude: listing.lng,
      },
    } : {}),
    ...(listing.avgRating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: listing.avgRating,
        reviewCount: listing.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    priceRange: listing.basePricePaise
      ? `₹${Math.round(listing.basePricePaise / 100)}`
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ExperienceJsonLd({ experience }: { experience: any }) {
  if (!experience) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: experience.title,
    description: experience.description?.slice(0, 300),
    url: `https://ysafar.com/experiences/${experience.id}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: experience.city,
      addressCountry: 'IN',
    },
    ...(experience.avgRating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: experience.avgRating,
        reviewCount: experience.reviewCount || 0,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
