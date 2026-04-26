'use client';

import Link from 'next/link';

type Item = {
  label: string;
  emoji: string;
  startsPaise: number;
  href: string;
  tint: string;
  img: string;
};

const ITEMS: Item[] = [
  { label: 'Domestic Cook',        emoji: '👨‍🍳', startsPaise:  49900, href: '/cooks?type=DAILY',                   tint: 'from-orange-100 to-amber-100',  img: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&auto=format&fit=crop&q=70' },
  { label: 'Monthly Cook',         emoji: '🍲',   startsPaise: 299900, href: '/cooks?type=MONTHLY',                 tint: 'from-rose-100 to-pink-100',     img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=70' },
  { label: 'Waiter Service',       emoji: '🤵',   startsPaise:  79900, href: '/services/staff-hire?role=WAITER',    tint: 'from-blue-100 to-indigo-100',   img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=70' },
  { label: 'Bartender Service',    emoji: '🍹',   startsPaise:  99900, href: '/services/staff-hire?role=BARTENDER', tint: 'from-violet-100 to-purple-100', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=70' },
  { label: 'Kitchen Cleaner',      emoji: '🧽',   startsPaise:  79900, href: '/services/staff-hire?role=CLEANER',   tint: 'from-cyan-100 to-sky-100',      img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=70' },
  { label: 'Ingredients Delivery', emoji: '🛒',   startsPaise:   9900, href: '/cooks?addon=INGREDIENTS',            tint: 'from-lime-100 to-green-100',    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=70' },
  { label: 'Appliances on Rent',   emoji: '🍳',   startsPaise:  49900, href: '/services/appliances',                tint: 'from-slate-100 to-gray-200',    img: 'https://images.unsplash.com/photo-1556910633-5099dc3971e4?w=400&auto=format&fit=crop&q=70' },
  { label: 'Crockery on Rent',     emoji: '🍽️',  startsPaise:  79900, href: '/services/appliances?cat=CROCKERY',   tint: 'from-stone-100 to-zinc-200',    img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&auto=format&fit=crop&q=70' },
  { label: 'Live Singer',          emoji: '🎤',   startsPaise: 299900, href: '/services/live-music',                tint: 'from-amber-100 to-orange-100',  img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&auto=format&fit=crop&q=70' },
  { label: 'Party Decorator',      emoji: '🎈',   startsPaise:  99900, href: '/services/decor',                     tint: 'from-pink-100 to-rose-100',     img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=70' },
  { label: 'Designer Cake',        emoji: '🎂',   startsPaise:  99900, href: '/services/cake',                      tint: 'from-fuchsia-100 to-pink-100',  img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=70' },
];

function formatStarts(paise: number): string {
  return `₹${Math.round(paise / 100)}`;
}

export default function PeopleAlsoBooked({ title = 'People Also Booked', className = '' }: {
  title?: string;
  className?: string;
}) {
  return (
    <section className={`mt-8 ${className}`}>
      <div className="flex items-end justify-between mb-3 px-1">
        <h2 className="text-base md:text-lg font-bold text-gray-900">{title}</h2>
        <Link href="/services" className="text-xs font-semibold text-orange-600 hover:text-orange-700">See all →</Link>
      </div>
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-thin">
        <ul className="flex gap-3 pb-2 min-w-max">
          {ITEMS.map(it => (
            <li key={it.label} className="w-[140px] shrink-0">
              <Link href={it.href}
                className="block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition group">
                <div className={`relative h-24 bg-gradient-to-br ${it.tint} flex items-center justify-center overflow-hidden`}>
                  <span className="absolute text-3xl opacity-40 select-none">{it.emoji}</span>
                  <img
                    src={it.img}
                    alt={it.label}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.2em]">
                    {it.label}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Starts <span className="font-bold text-orange-600">{formatStarts(it.startsPaise)}</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
