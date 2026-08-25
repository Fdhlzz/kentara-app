'use client';

import { useState } from 'react';
import { Sprout, Truck, Sparkles, Package } from 'lucide-react';
import { ProductManager } from '@/components/admin/product-manager';
import { CourierManager } from '@/components/admin/courier-manager';
import type { Product, AdminProductStats } from '@/types/product';
import type { CourierUser } from '@/lib/admin/courier-actions';

interface AdminViewSwitcherProps {
  initialProducts: Product[];
  productStats: AdminProductStats;
  initialCouriers: CourierUser[];
  defaultTab?: 'products' | 'couriers';
}

export function AdminViewSwitcher({
  initialProducts,
  productStats,
  initialCouriers,
  defaultTab = 'products',
}: AdminViewSwitcherProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'couriers'>(defaultTab);

  return (
    <div className="space-y-6">
      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shrink-0 ${
            activeTab === 'products'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <Sprout className="h-4 w-4" />
          <span>Katalog Benih Kentang</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              activeTab === 'products'
                ? 'bg-emerald-700/50 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {productStats.totalProducts}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('couriers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shrink-0 ${
            activeTab === 'couriers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Manajemen Mitra Kurir</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              activeTab === 'couriers'
                ? 'bg-blue-700/50 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {initialCouriers.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'products' ? (
          <ProductManager initialProducts={initialProducts} stats={productStats} />
        ) : (
          <CourierManager initialCouriers={initialCouriers} />
        )}
      </div>
    </div>
  );
}
