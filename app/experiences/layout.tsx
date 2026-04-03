import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Experiences — Unique Activities by Local Hosts',
  description: 'Discover cooking classes, heritage walks, adventure trips, wellness retreats and more. Curated by local hosts across India.',
  alternates: { canonical: 'https://ysafar.com/experiences' },
};

export default function ExperiencesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
