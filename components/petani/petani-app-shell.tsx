'use client';

import { useState } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { LogoutButton } from '@/components/auth/logout-button';
import { PetaniCatalogView } from '@/components/petani/petani-catalog-view';
import type { Product } from '@/types/product';
import type { UserProfile } from '@/types/auth';
import type { Order } from '@/types/order';

interface PetaniAppShellProps {
  profile: UserProfile;
  products: Product[];
  orders?: Order[];
}

export function PetaniAppShell({ profile, products = [], orders = [] }: PetaniAppShellProps) {
  const [activeMenu, setActiveMenu] = useState<'katalog'>('katalog');
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* 1. NEW FRESH PETANI NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <Link href="/petani" className="flex items-center gap-2.5 group">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                  <Sprout className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                      Kentara
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold border-emerald-300 dark:border-emerald-800">
                      Petani
                    </Badge>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block leading-tight">
                    Pusat Benih Pertanian Berkualitas
                  </span>
                </div>
              </Link>

              {/* Single Navigation Menu: Katalog Benih */}
              <nav className="hidden sm:flex items-center ml-6 border-l border-zinc-200 dark:border-zinc-800 pl-6">
                <button
                  type="button"
                  onClick={() => setActiveMenu('katalog')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                    activeMenu === 'katalog'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Katalog Benih Unggul</span>
                </button>
              </nav>
            </div>

            {/* Right: Cart, Theme Toggle, Notification & Profile */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer border border-zinc-200/80 dark:border-zinc-800"
                aria-label="Buka Keranjang Belanja"
              >
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification Center */}
              <NotificationCenter role="petani" userId={profile.id} />

              {/* Customer Profile & Logout */}
              <div className="flex items-center gap-2 pl-1 border-l border-zinc-200 dark:border-zinc-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-black text-zinc-900 dark:text-white leading-tight">
                    {profile.full_name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {profile.phone || profile.email}
                  </span>
                </div>

                <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-300 dark:border-emerald-800">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P'}
                </div>

                <div className="hidden sm:block">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Single Menu: Katalog Benih) */}
        <div className="sm:hidden px-4 py-2 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setActiveMenu('katalog')}
            className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 py-1"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Katalog Benih Unggul</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Halo, <strong>{profile.full_name?.split(' ')[0]}</strong></span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 2. MAIN CATALOG VIEW */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PetaniCatalogView
          products={products}
          currentUser={profile}
          cartCount={cartCount}
          onCartCountChange={setCartCount}
          isCartDrawerOpen={isCartOpen}
          setIsCartDrawerOpen={setIsCartOpen}
        />
      </main>

      {/* 3. MOBILE-FRIENDLY FOOTER */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500 space-y-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              Kentara — Marketplace Benih Pertanian Unggul
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Benih bersertifikat BPSB langsung dari penangkar terverifikasi. Pengiriman aman sampai lahan.
          </p>
        </div>
      </footer>
    </div>
  );
}
