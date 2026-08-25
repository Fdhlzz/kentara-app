'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sprout,
  ShoppingBag,
  Search,
  User,
  LogOut,
  Sparkles,
  Layers,
  Leaf,
  ShieldCheck,
  Flame,
  Truck,
  Package,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { LogoutButton } from '@/components/auth/logout-button';
import { PetaniCatalogView } from '@/components/petani/petani-catalog-view';
import { CartProvider, useCart } from '@/lib/cart/cart-context';
import type { Product } from '@/types/product';
import type { UserProfile } from '@/types/auth';
import type { Order } from '@/types/order';
import type { CartItem } from '@/types/cart';

interface PetaniAppShellProps {
  profile: UserProfile;
  products: Product[];
  orders?: Order[];
  initialCartItems?: CartItem[];
}

function PetaniAppShellInner({
  profile,
  products,
  orders,
}: {
  profile: UserProfile;
  products: Product[];
  orders: Order[];
}) {
  const { totalCount, isCartOpen, setIsCartOpen } = useCart();
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 sm:pb-8">
      {/* 1. ULTRA SLIM MOBILE-FIRST HEADER (56px) */}
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

          {/* Integrated Slim Search Bar (Mobile & Desktop) */}
          <div className="flex-1 max-w-xl mx-1 sm:mx-4">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Cari bibit Granola, Atlantic, G2..."
                className="w-full pl-8 pr-7 py-1.5 sm:py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100/90 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-zinc-900 transition"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 p-0.5 rounded-full bg-zinc-200 text-zinc-600 hover:bg-zinc-300 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons: My Orders, Cart, Theme Toggle, Isolated Notifications, User */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Link: Pesanan Saya */}
            <Link
              href="/petani/orders"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Package className="h-4 w-4 text-emerald-600" />
              <span>Pesanan Saya</span>
            </Link>

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

            {/* Profile Avatar / Logout */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800">
              <div
                className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-black border border-emerald-300 dark:border-emerald-800 shrink-0"
                title={profile.full_name}
              >
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CATALOG CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <PetaniCatalogView
          products={products}
          currentUser={profile}
          externalSearchQuery={globalSearch}
        />
      </main>

      {/* 3. MOBILE-FRIENDLY FOOTER (DESKTOP) */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <span>Kentara — Marketplace Benih Pertanian Unggul</span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Benih bersertifikat BPSB langsung dari penangkar terverifikasi. Pengiriman aman sampai lahan.
          </p>
        </div>
      </footer>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 py-2 px-6 flex items-center justify-around shadow-2xl">
        <Link
          href="/petani"
          className="flex flex-col items-center gap-0.5 text-emerald-600 font-bold text-[10px]"
        >
          <Sprout className="h-5 w-5" />
          <span>Pasar Benih</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-0.5 text-zinc-500 hover:text-emerald-600 font-bold text-[10px]"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Keranjang</span>
          {totalCount > 0 && (
            <span className="absolute -top-1 right-2 h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
              {totalCount}
            </span>
          )}
        </button>

        <Link
          href="/petani/orders"
          className="flex flex-col items-center gap-0.5 text-zinc-500 hover:text-emerald-600 font-bold text-[10px]"
        >
          <Package className="h-5 w-5" />
          <span>Pesanan Saya</span>
        </Link>
      </nav>
    </div>
  );
}

export function PetaniAppShell({
  profile,
  products = [],
  orders = [],
  initialCartItems = [],
}: PetaniAppShellProps) {
  return (
    <CartProvider initialItems={initialCartItems} isLoggedIn={!!profile}>
      <PetaniAppShellInner
        profile={profile}
        products={products}
        orders={orders}
      />
    </CartProvider>
  );
}
