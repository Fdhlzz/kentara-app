import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldAlert,
  Mail,
  Truck,
  Sprout,
  Users,
  ArrowLeft,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { getAdminProductStats, getAdminProductsList } from '@/lib/admin/product-actions';
import { LogoutButton } from '@/components/auth/logout-button';
import { ProductManager } from '@/components/admin/product-manager';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin') {
    redirect(`/${profile.role}`);
  }

  const [productStats, products] = await Promise.all([
    getAdminProductStats(),
    getAdminProductsList(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-emerald-950/5 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={36}
              height={36}
              className="rounded-xl shadow-xs"
              priority
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
                  Kentara
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">
                  Katalog Benih Kentang
                </Badge>
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">
                Pusat Manajemen Produk Unggulan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Admin Panel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <ProductManager initialProducts={products} stats={productStats} />
      </main>
    </div>
  );
}
