import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safar Cooks — Book Personal Chefs & Catering',
  description: 'Hire verified personal chefs for home cooking, parties, and events. Browse menus, check availability, book instantly across Indian cities.',
  alternates: { canonical: 'https://ysafar.com/cooks' },
};

export default function CooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
