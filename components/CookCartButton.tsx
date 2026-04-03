'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCartCount } from '@/lib/cookCart';

export default function CookCartButton() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setCount(getCartCount());
    const handler = () => setCount(getCartCount());
    window.addEventListener('cart-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('cart-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Only show on cook pages
  if (!pathname.startsWith('/cooks')) return null;
  if (count === 0) return null;

  return (
    <Link href="/cooks/cart"
      className="fixed bottom-6 right-6 z-40 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-2 transition-all hover:scale-105">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      <span className="font-semibold text-sm">Cart</span>
      <span className="bg-white text-orange-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {count}
      </span>
    </Link>
  );
}
