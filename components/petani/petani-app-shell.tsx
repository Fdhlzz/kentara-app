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
  Flame,
  Truck,
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
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* 1. MARKETPLACE TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16 sm:h-20">
            {/* Left: Marketplace Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/petani" className="flex items-center gap-2.5 group">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition">
                  <Sprout className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg sm:text-xl font-black tracking-tight text-emerald-800 dark:text-emerald-400">
                      Kentara
                    </span>
                    <Badge className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0">
                      MARKETPLACE
                    </Badge>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold block leading-tight">
                    Pusat Benih Pertanian Berkualitas
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle: Marketplace Universal Search Bar (Desktop & Tablet) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <div className="flex items-center rounded-2xl border-2 border-emerald-600/30 dark:border-emerald-500/30 bg-zinc-50 dark:bg-zinc-800/80 focus-within:border-emerald-600 focus-within:bg-white dark:focus-within:bg-zinc-900 shadow-xs transition overflow-hidden">
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Cari bibit kentang bersertifikat, Granola, Atlantic, G2..."
                    className="w-full pl-4 pr-3 py-2 text-xs font-semibold bg-transparent text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                  />
                  <div className="pr-1">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 px-3 text-xs font-black gap-1"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Cari</span>
                    </Button>
                  </div>
                </div>

                {/* Popular Keywords Row */}
                <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-zinc-400">
                  <span className="font-bold text-zinc-500">Populer:</span>
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('Granola')}
                    className="hover:text-emerald-600 transition"
                  >
                    Granola L
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('Atlantic')}
                    className="hover:text-emerald-600 transition"
                  >
                    Atlantic G1
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('G2')}
                    className="hover:text-emerald-600 transition"
                  >
                    Kelas G2
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('Pangalengan')}
                    className="hover:text-emerald-600 transition"
                  >
                    Pangalengan
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Cart, Theme Toggle, Isolated Notifications, User */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Single Active Menu: Katalog Benih */}
              <nav className="hidden lg:flex items-center mr-2">
                <button
                  type="button"
                  onClick={() => setActiveMenu('katalog')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    activeMenu === 'katalog'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span>Katalog Benih Unggul</span>
                </button>
              </nav>

              {/* Shopping Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition cursor-pointer shadow-xs active:scale-95"
                aria-label="Keranjang Belanja"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Light/Dark Toggle */}
              <ThemeToggle />

              {/* Customer Isolated Notification Center (Strictly filtered for this user) */}
              <NotificationCenter role="petani" userId={profile.id} />

              {/* Profile & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                <div className="h-9 w-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-black border border-emerald-300 dark:border-emerald-800 shrink-0">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-black text-zinc-900 dark:text-white leading-tight">
                    {profile.full_name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold">
                    Akun Petani Terverifikasi
                  </span>
                </div>
                <div className="hidden sm:block">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar & Single Menu Tab */}
        <div className="md:hidden px-3 pb-3 space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Cari varietas benih kentang..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400 pt-0.5">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Layers className="h-3.5 w-3.5" />
              <span>Katalog Benih Unggul</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Halo, <strong>{profile.full_name?.split(' ')[0]}</strong></span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN MARKETPLACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        <PetaniCatalogView
          products={products}
          currentUser={profile}
          cartCount={cartCount}
          onCartCountChange={setCartCount}
          isCartDrawerOpen={isCartOpen}
          setIsCartDrawerOpen={setIsCartOpen}
          externalSearchQuery={globalSearch}
        />
      </main>

      {/* 3. MARKETPLACE FOOTER */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              100% Benih Bersertifikat BPSB
            </span>
            <span className="flex items-center gap-1.5 text-blue-600">
              <Truck className="h-4 w-4" />
              Pengiriman Cepat Armada Khusus
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <Sparkles className="h-4 w-4" />
              Garansi Tumbuh Unggul &gt;95%
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 max-w-2xl mx-auto">
            Kentara adalah platform marketplace agrikultur terintegrasi untuk jual-beli benih kentang unggulan bersertifikat langsung dari penangkar terpercaya di Pangalengan, Lembang, dan Dieng.
          </p>
          <p className="text-[10px] text-zinc-400">
            © 2026 Kentara Agrikultur Indonesia. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
