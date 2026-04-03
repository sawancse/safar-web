import type { MetadataRoute } from 'next';

const BASE = 'https://ysafar.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    '', '/search', '/experiences', '/cooks', '/buy', '/buy/search',
    '/aashray', '/aashray/donate', '/aashray/host', '/aashray/ngo',
    '/medical', '/looking-for', '/projects', '/auth',
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.8,
  }));

  // Dynamic listings from API
  let listingUrls: MetadataRoute.Sitemap = [];
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/api/v1/listings?size=500&status=VERIFIED`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const listings = data?.content || [];
      listingUrls = listings.map((l: any) => ({
        url: `${BASE}/listings/${l.id}`,
        lastModified: l.updatedAt || l.createdAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Silently fail — sitemap still works with static pages
  }

  // Dynamic experiences
  let experienceUrls: MetadataRoute.Sitemap = [];
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/api/v1/experiences?size=200`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const experiences = data?.content || [];
      experienceUrls = experiences.map((e: any) => ({
        url: `${BASE}/experiences/${e.id}`,
        lastModified: e.createdAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {}

  return [...staticPages, ...listingUrls, ...experienceUrls];
}
