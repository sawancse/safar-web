import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aashray — Safe Housing for Displaced Families',
  description: 'Donate to provide safe housing for displaced families across India. 80G tax benefits. Track your impact with transparency.',
  alternates: { canonical: 'https://ysafar.com/aashray' },
};

export default function AashrayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
