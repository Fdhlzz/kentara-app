'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sprout,
  ShoppingBag,
  Search,
  Package,
  User,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { useCart } from '@/lib/cart/cart-context';
import type { UserProfile } from '@/types/auth';

interface PetaniNavbarProps {
  profile: UserProfile;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export function PetaniNavbar({
  profile,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Cari bibit Granola, Atlantic, G2...',
}: PetaniNavbarProps) {
  const pathname = usePathname();
  const { totalCount, setIsCartOpen } = useCart();

  const isCatalogActive = pathname === '/petani';
  const isOrdersActive = pathname === '/petani/orders';
  const isAccountActive = pathname === '/petani/account';

  const initialLetter = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P';

  return (
    <>
      {/* 1. ULTRA SLIM MOBILE-FIRST TOP NAVBAR (56px) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800 shadow-xs px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 h-14 sm:h-16">
          {/* Brand Logo */}
          <Link href="/petani" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-emerald-800 dark:text-emerald-400 leading-none">
                  Kentara
                </span>
                <Badge className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0">
                  PASAR BENIH
                </Badge>
              </div>
              <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                Pusat Benih Petani
              </span>
            </div>
          </Link>

          {/* Integrated Search Bar (Mobile & Desktop) */}
          <div className="flex-1 max-w-xl mx-1 sm:mx-4">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 sm:py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition"
              />
              {searchQuery && onSearchChange && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 p-0.5 rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300 transition cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons: Menu Links, Cart, Theme Toggle, Notifications, User */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Navigation Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/petani"
                className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl transition ${
                  isCatalogActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Sprout className="h-4 w-4" />
                <span>Katalog</span>
              </Link>

              <Link
                href="/petani/orders"
                className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl transition ${
                  isOrdersActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Pesanan</span>
              </Link>

              <Link
                href="/petani/account"
                className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl transition ${
                  isAccountActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Akun</span>
              </Link>
            </div>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 transition cursor-pointer active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 min-w-[18px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Light/Dark Toggle */}
            <ThemeToggle />

            {/* Strictly Isolated Customer Notifications */}
            <NotificationCenter role="petani" userId={profile.id} />

            {/* Profile Avatar -> Routes to Account Page */}
            <Link
              href="/petani/account"
              className="flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800"
              title="Buka Pengaturan Akun"
            >
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black border transition shrink-0 ${
                  isAccountActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:ring-2 hover:ring-emerald-500/20'
                }`}
              >
                {initialLetter}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (4 TABS) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 py-2 px-3 flex items-center justify-around shadow-2xl">
        {/* Tab 1: Pasar Benih */}
        <Link
          href="/petani"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition ${
            isCatalogActive ? 'text-emerald-600' : 'text-zinc-500 hover:text-emerald-600'
          }`}
        >
          <Sprout className="h-5 w-5" />
          <span>Pasar Benih</span>
        </Link>

        {/* Tab 2: Pesanan */}
        <Link
          href="/petani/orders"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition ${
            isOrdersActive ? 'text-emerald-600' : 'text-zinc-500 hover:text-emerald-600'
          }`}
        >
          <Package className="h-5 w-5" />
          <span>Pesanan</span>
        </Link>

        {/* Tab 3: Keranjang */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-0.5 text-zinc-500 hover:text-emerald-600 font-bold text-[10px] cursor-pointer"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Keranjang</span>
          {totalCount > 0 && (
            <span className="absolute -top-1 right-1 h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
              {totalCount}
            </span>
          )}
        </button>

        {/* Tab 4: Akun Saya */}
        <Link
          href="/petani/account"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black transition ${
            isAccountActive ? 'text-emerald-600' : 'text-zinc-500 hover:text-emerald-600'
          }`}
        >
          <User className="h-5 w-5" />
          <span>Akun Saya</span>
        </Link>
      </nav>
    </>
  );
}
