import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Property — Apartments, Villas, Plots in India',
  description: 'Browse verified properties for sale. Apartments, villas, plots, and builder projects. RERA verified, transparent pricing.',
  alternates: { canonical: 'https://ysafar.com/buy' },
};

export default function BuyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
