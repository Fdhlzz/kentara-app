'use client';

import { useState } from 'react';
import { Sprout } from 'lucide-react';
import { PetaniNavbar } from '@/components/petani/petani-navbar';
import { PetaniOrdersView } from '@/components/petani/petani-orders-view';
import type { Order } from '@/types/order';
import type { UserProfile } from '@/types/auth';

interface PetaniOrdersPageContentProps {
  orders: Order[];
  currentUser: UserProfile;
}

export function PetaniOrdersPageContent({
  orders,
  currentUser,
}: PetaniOrdersPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 sm:pb-8">
      {/* 1. SHARED UNIFIED NAVBAR */}
      <PetaniNavbar
        profile={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nomor pesanan, benih, atau alamat..."
      />

      {/* 2. MAIN ORDERS VIEW */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-6 lg:p-8 space-y-4">
        <PetaniOrdersView
          orders={orders}
          currentUser={currentUser}
          externalSearchQuery={searchQuery}
        />
      </main>

      {/* 3. DESKTOP FOOTER */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold">
            <Sprout className="h-4 w-4 text-emerald-600" />
            <span>Kentara — Marketplace Benih Pertanian Unggul</span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Pusat monitoring pesanan dan logistik benih bersertifikat langsung dari penangkar.
          </p>
        </div>
      </footer>
    </div>
  );
}
