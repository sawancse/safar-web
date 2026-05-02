'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';
import { api } from '@/lib/api';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const r = localStorage.getItem('user_role') ?? '';
    const name = localStorage.getItem('user_name') ?? '';
    const avatar = localStorage.getItem('user_avatar') ?? '';
    setIsLoggedIn(!!token);
    setRole(r);
    setUserName(name);
    setUserAvatar(avatar);

    if (token) {
      api.getUnreadCount(token)
        .then(res => setUnreadCount(res?.count ?? 0))
        .catch(() => setUnreadCount(0));
    }
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isImpersonated, setIsImpersonated] = useState(false);
  useEffect(() => {
    setIsImpersonated(localStorage.getItem('impersonated') === 'true');
  }, [pathname]);

  function handleLogout() {
    const wasImpersonated = localStorage.getItem('impersonated') === 'true';
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('last_login_phone');
    localStorage.removeItem('last_login_email');
    localStorage.removeItem('impersonated');
    document.cookie = 'access_token=; path=/; max-age=0';
    setIsLoggedIn(false);
    setMenuOpen(false);
    setUserMenuOpen(false);
    if (wasImpersonated) {
      window.close(); // close the impersonation tab
    } else {
      router.push('/');
    }
  }

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const apiUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
    : '';

  const avatarSrc = userAvatar
    ? (userAvatar.startsWith('http') ? userAvatar : `${apiUrl}${userAvatar}`)
    : '';

  // ── Mode detection: hosting vs travelling ──
  const isHost = role === 'HOST' || role === 'ADMIN';
  const isInHostMode = pathname.startsWith('/host');

  // Traveller menu items (shown when in travelling mode or non-hosts)
  const TRAVELLER_MENU = [
    { href: '/dashboard/account', icon: '\u{1F464}', label: 'Account' },
    { href: '/messages', icon: '\u{1F4AC}', label: 'Messages', badge: unreadCount },
    { href: '/dashboard', icon: '\u{1F9F3}', label: 'Bookings & Trips' },
    { href: '/flights', icon: '\u{2708}', label: 'Flights' },
    { href: '/dashboard/flights', icon: '\u{1F6EB}', label: 'My Flights' },
    { href: '/pg-dashboard', icon: '\u{1F3E0}', label: 'PG / Rent' },
    { href: '/dashboard/miles', icon: '\u{1F381}', label: 'Rewards & Wallet' },
    { href: '/dashboard/reviews', icon: '\u{2B50}', label: 'Reviews' },
    { href: '/cooks/my-bookings', icon: '\u{1F468}\u{200D}\u{1F373}', label: 'My Service Bookings' },
    { href: '/cooks/dashboard', icon: '\u{1F4CA}', label: 'Cook Dashboard' },
    { href: '/vendor/dashboard', icon: '\u{1F91D}', label: 'Vendor Dashboard' },
    { href: '/dashboard/saved', icon: '\u{2764}\u{FE0F}', label: 'Saved' },
  ];

  // Host menu items (shown when in hosting mode)
  const HOST_MENU = [
    { href: '/host', icon: '\u{1F4CA}', label: 'Dashboard' },
    { href: '/messages', icon: '\u{1F4AC}', label: 'Messages', badge: unreadCount },
    { href: '/host?tab=listings', icon: '\u{1F3E0}', label: 'Listings' },
    { href: '/host?tab=bookings', icon: '\u{1F4C5}', label: 'Reservations' },
    { href: '/host?tab=earnings', icon: '\u{1F4B0}', label: 'Earnings' },
    { href: '/host?tab=reviews', icon: '\u{2B50}', label: 'Reviews' },
  ];

  const activeMenu = (isLoggedIn && isHost && isInHostMode) ? HOST_MENU : TRAVELLER_MENU;

  // Switch link — what to show in nav and dropdown
  const switchLabel = isInHostMode ? 'Switch to travelling' : 'Switch to hosting';
  const switchHref = isInHostMode ? '/dashboard' : '/host';

  const SwapIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );

  return (
    <>
    {isImpersonated && (
      <div className="bg-red-600 text-white text-center text-xs py-1.5 font-semibold tracking-wide">
        Admin Support Mode — Viewing as {userName || 'Host'}
        <button onClick={handleLogout} className="ml-4 underline hover:no-underline">Exit</button>
      </div>
    )}
    <nav className={`sticky top-0 z-[60] border-b shadow-sm ${isInHostMode ? 'bg-gray-900' : 'bg-[#003B95]'}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className={`flex items-center gap-2 font-bold text-xl ${isInHostMode ? 'text-orange-400' : 'text-white'}`}>
          Safar{isInHostMode && <span className="text-xs font-normal text-gray-400 ml-1">hosting</span>}
        </Link>

        {/* Desktop center links */}
        <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${isInHostMode ? 'text-gray-300' : 'text-white/80'}`}>
          {isInHostMode ? (
            <>
              <Link href="/host" className={`hover:text-white transition ${pathname === '/host' && !pathname.includes('?') ? 'text-white' : ''}`}>
                Today
              </Link>
              <Link href="/messages" className="hover:text-white transition">
                Inbox
              </Link>
              <Link href="/host?tab=calendar" className="hover:text-white transition">
                Calendar
              </Link>
              <Link href="/host?tab=listings" className="hover:text-white transition">
                Listings
              </Link>
            </>
          ) : (
            <>
              <Link href="/search" className="hover:text-white transition">
                {t('nav.search')}
              </Link>
              <div className="relative group">
                {/* Clicking "Services" lands on the /services marketplace.
                    Hover still reveals the sub-category dropdown below. */}
                <Link href="/services" className="hover:text-white transition flex items-center gap-1">
                  Services <span className="text-[10px]">▼</span>
                </Link>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link href="/services" className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition border-b">
                    <span className="text-lg">🎉</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">House Parties</p>
                      <p className="text-[11px] text-gray-400">Chef + waiters + photographer + more</p>
                    </div>
                  </Link>
                  <Link href="/cooks" className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition">
                    <span className="text-lg">👨‍🍳</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Safar Cooks</p>
                      <p className="text-[11px] text-gray-400">Home cooks & caterers</p>
                    </div>
                  </Link>
                  <Link href="/experiences" className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition">
                    <span className="text-lg">✨</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Experiences</p>
                      <p className="text-[11px] text-gray-400">Tours & activities</p>
                    </div>
                  </Link>
                  <Link href="/medical" className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition">
                    <span className="text-lg">🏥</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Medical Stays</p>
                      <p className="text-[11px] text-gray-400">Hospital-partnered housing</p>
                    </div>
                  </Link>
                  <Link href="/aashray" className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition">
                    <span className="text-lg">🏠</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Aashray</p>
                      <p className="text-[11px] text-gray-400">Refugee & emergency housing</p>
                    </div>
                  </Link>
                  <div className="border-t my-1" />
                  <Link href="/buy" className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition">
                    <span className="text-lg">🏡</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Buy / Sell</p>
                      <p className="text-[11px] text-gray-400">Property marketplace</p>
                    </div>
                  </Link>
                  <Link href="/projects" className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition">
                    <span className="text-lg">🏗️</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">New Projects</p>
                      <p className="text-[11px] text-gray-400">Builder developments</p>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {/* Switch mode button */}
          {isLoggedIn && isHost && (
            <Link
              href={switchHref}
              className={`flex items-center gap-1.5 text-sm font-medium transition rounded-full px-3 py-1.5 ${
                isInHostMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <SwapIcon />
              {switchLabel}
            </Link>
          )}
          {isLoggedIn && !isHost && (
            <Link
              href="/host"
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition"
            >
              <SwapIcon />
              Switch to hosting
            </Link>
          )}
          <Link href="/become-a-partner" className="text-sm font-medium text-white/80 hover:text-white transition">
            Become a partner
          </Link>
          {!isLoggedIn && (
            <Link href="/host" className="text-sm font-medium text-white/80 hover:text-white transition">
              List your property
            </Link>
          )}

          {/* Messages icon */}
          {isLoggedIn && (
            <Link
              href="/messages"
              className={`relative p-2 transition ${isInHostMode ? 'text-gray-400 hover:text-white' : 'text-white/70 hover:text-white'}`}
              title="Messages"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          <LanguageSelector />

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2 border rounded-full pl-3 pr-1 py-1 hover:shadow-md transition ${
                  isInHostMode ? 'border-gray-600 bg-gray-800' : 'border-white/30 bg-white/10'
                }`}
              >
                <svg className={`w-4 h-4 ${isInHostMode ? 'text-gray-400' : 'text-white/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {avatarSrc ? (
                  <img src={avatarSrc} alt={userName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                )}
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white border rounded-2xl shadow-xl py-2 z-50">
                  {/* User header */}
                  <div className="px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{userName || 'Traveller'}</p>
                        <p className="text-xs text-gray-400">{isInHostMode ? 'Hosting mode' : 'Travelling mode'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Context menu items */}
                  <div className="py-1">
                    {activeMenu.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition ${
                          pathname === item.href ? 'text-orange-500 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-base w-5 text-center">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {'badge' in item && (item as any).badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {(item as any).badge > 9 ? '9+' : (item as any).badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Switch mode */}
                  {isHost && (
                    <div className="border-t py-1">
                      <Link
                        href={switchHref}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
                      >
                        <span className="text-base w-5 text-center">{'\u{1F504}'}</span>
                        {switchLabel}
                      </Link>
                    </div>
                  )}
                  {!isHost && (
                    <div className="border-t py-1">
                      <Link
                        href="/host"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
                      >
                        <span className="text-base w-5 text-center">{'\u{1F504}'}</span>
                        Switch to hosting
                      </Link>
                    </div>
                  )}

                  {/* Account + Sign out */}
                  <div className="border-t pt-1">
                    {isInHostMode && (
                      <Link
                        href="/dashboard/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span className="text-base w-5 text-center">{'\u{1F464}'}</span>
                        Account
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition"
                    >
                      <span className="text-base w-5 text-center">{'\u{1F6AA}'}</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <div className="space-y-1">
            <span className={`block w-5 h-0.5 ${isInHostMode ? 'bg-gray-300' : 'bg-gray-600'}`} />
            <span className={`block w-5 h-0.5 ${isInHostMode ? 'bg-gray-300' : 'bg-gray-600'}`} />
            <span className={`block w-5 h-0.5 ${isInHostMode ? 'bg-gray-300' : 'bg-gray-600'}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={`md:hidden border-t px-4 py-4 space-y-1 text-sm font-medium ${isInHostMode ? 'bg-gray-900 text-gray-200' : 'bg-white'}`}>
          <div className="pb-3">
            <LanguageSelector />
          </div>

          {isLoggedIn && (
            <>
              <div className="flex items-center gap-3 pb-3 border-b mb-2">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                    {initials}
                  </div>
                )}
                <div>
                  <p className={`font-semibold ${isInHostMode ? 'text-white' : 'text-gray-800'}`}>{userName || 'Traveller'}</p>
                  <p className="text-xs text-gray-400">{isInHostMode ? 'Hosting mode' : 'Travelling mode'}</p>
                </div>
              </div>
            </>
          )}

          {isLoggedIn ? (
            <>
              {activeMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 py-2.5 ${
                    isInHostMode ? 'hover:text-white' : 'hover:text-orange-500'
                  } ${pathname === item.href ? 'text-orange-500' : isInHostMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {'badge' in item && (item as any).badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {(item as any).badge > 9 ? '9+' : (item as any).badge}
                    </span>
                  )}
                </Link>
              ))}

              {/* Services section for logged-in users */}
              {!isInHostMode && (
                <div className="border-t mt-2 pt-2">
                  <Link href="/services" className="flex items-center justify-between py-1" onClick={() => setMenuOpen(false)}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Services</p>
                    <span className="text-[10px] text-orange-500 font-semibold">View all →</span>
                  </Link>
                  <Link href="/services" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                    <span className="w-5 text-center">🎉</span> House Parties
                  </Link>
                  <Link href="/cooks" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                    <span className="w-5 text-center">{'\u{1F468}\u{200D}\u{1F373}'}</span> Safar Cooks
                  </Link>
                  <Link href="/experiences" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                    <span className="w-5 text-center">{'\u{2728}'}</span> Experiences
                  </Link>
                  <Link href="/medical" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                    <span className="w-5 text-center">{'\u{1F3E5}'}</span> Medical Stays
                  </Link>
                  <Link href="/aashray" className="flex items-center gap-3 py-2 text-teal-700 hover:text-teal-600 font-medium" onClick={() => setMenuOpen(false)}>
                    <span className="w-5 text-center">{'\u{1F3E0}'}</span> Aashray
                  </Link>
                  <Link href="/buy" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                    <span className="w-5 text-center">{'\u{1F3E1}'}</span> Buy / Sell
                  </Link>
                  <Link href="/projects" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                    <span className="w-5 text-center">{'\u{1F3D7}'}</span> New Projects
                  </Link>
                </div>
              )}

              <div className="border-t mt-2 pt-2">
                <Link
                  href={isHost ? switchHref : '/host'}
                  className={`flex items-center gap-3 py-2.5 font-medium ${isInHostMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-orange-500'}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="w-5 text-center">{'\u{1F504}'}</span>
                  {isHost ? switchLabel : 'Switch to hosting'}
                </Link>
              </div>

              <div className="border-t mt-2 pt-2">
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 py-2.5 text-red-500 w-full"
                >
                  <span className="w-5 text-center">{'\u{1F6AA}'}</span> Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/search" className="flex items-center gap-3 py-2.5 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F50D}'}</span> {t('nav.search')}
              </Link>
              <Link href="/services" className="flex items-center justify-between pt-3 pb-1" onClick={() => setMenuOpen(false)}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Services</p>
                <span className="text-[10px] text-orange-500 font-semibold">View all →</span>
              </Link>
              <Link href="/services" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">🎉</span> House Parties
              </Link>
              <Link href="/cooks" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F468}\u{200D}\u{1F373}'}</span> Safar Cooks
              </Link>
              <Link href="/experiences" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{2728}'}</span> Experiences
              </Link>
              <Link href="/medical" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F3E5}'}</span> Medical Stays
              </Link>
              <Link href="/aashray" className="flex items-center gap-3 py-2 text-teal-700 hover:text-teal-600 font-medium" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F3E0}'}</span> Aashray
              </Link>
              <Link href="/buy" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F3E1}'}</span> Buy / Sell
              </Link>
              <Link href="/projects" className="flex items-center gap-3 py-2 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F3D7}'}</span> New Projects
              </Link>
              <div className="border-t my-2" />
              <Link href="/become-a-partner" className="flex items-center gap-3 py-2.5 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F91D}'}</span> Become a partner
              </Link>
              <Link href="/host" className="flex items-center gap-3 py-2.5 text-gray-700 hover:text-orange-500" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F3E0}'}</span> List your property
              </Link>
              <Link href="/auth" className="flex items-center gap-3 py-2.5 text-orange-500 font-semibold" onClick={() => setMenuOpen(false)}>
                <span className="w-5 text-center">{'\u{1F511}'}</span> {t('nav.login')}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
    </>
  );
}
