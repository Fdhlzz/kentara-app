'use client';

import { useState } from 'react';
import { Sprout } from 'lucide-react';
import { PetaniNavbar } from '@/components/petani/petani-navbar';
import { PetaniCatalogView } from '@/components/petani/petani-catalog-view';
import { CartProvider } from '@/lib/cart/cart-context';
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
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 sm:pb-8">
      {/* 1. SHARED UNIFIED NAVBAR */}
      <PetaniNavbar
        profile={profile}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Cari bibit Granola, Atlantic, G2..."
      />

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
