import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { getPetaniOrdersAction } from '@/lib/admin/order-actions';
import { getUserCartAction } from '@/lib/cart/cart-actions';
import { CartProvider } from '@/lib/cart/cart-context';
import { PetaniNavbar } from '@/components/petani/petani-navbar';
import { PetaniAccountView } from '@/components/petani/petani-account-view';
import { Sprout } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PetaniAccountPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'petani') {
    redirect(`/${profile.role}`);
  }

  const [orders, cartItems] = await Promise.all([
    getPetaniOrdersAction(),
    getUserCartAction(),
  ]);

  return (
    <CartProvider initialItems={cartItems} isLoggedIn={true}>
      <div className="min-h-screen flex flex-col bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 sm:pb-8">
        {/* 1. SHARED UNIFIED NAVBAR */}
        <PetaniNavbar profile={profile} />

        {/* 2. MAIN ACCOUNT CONTENT */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-6 lg:p-8 space-y-4">
          <PetaniAccountView profile={profile} orders={orders} />
        </main>

        {/* 3. DESKTOP FOOTER */}
        <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold">
              <Sprout className="h-4 w-4 text-emerald-600" />
              <span>Kentara — Marketplace Benih Pertanian Unggul</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Pengaturan akun petani dan pusat informasi jaminan benih bersertifikat BPSB.
            </p>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
