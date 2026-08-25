import { redirect, notFound } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { getProductBySlugOrId, getAdminProductsList } from '@/lib/admin/product-actions';
import { getUserCartAction } from '@/lib/cart/cart-actions';
import { CartProvider } from '@/lib/cart/cart-context';
import { ProductDetailView } from '@/components/petani/product-detail-view';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { LogoutButton } from '@/components/auth/logout-button';
import { Sprout } from 'lucide-react';
import Link from 'next/link';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'petani') {
    redirect(`/${profile.role}`);
  }

  const [product, allProducts, cartItems] = await Promise.all([
    getProductBySlugOrId(slug),
    getAdminProductsList(),
    getUserCartAction(),
  ]);

  if (!product || !product.is_active) {
    notFound();
  }

  const relatedProducts = allProducts.filter(
    (p) => p.id !== product.id && p.is_active && (p.variety === product.variety || p.seed_class === product.seed_class)
  );

  return (
    <CartProvider initialItems={cartItems} isLoggedIn={true}>
      <div className="min-h-screen flex flex-col bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {/* Slim Top Navigation Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/90 dark:border-zinc-800 shadow-xs px-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 h-14 sm:h-16">
            <Link href="/petani" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-emerald-800 dark:text-emerald-400 leading-none block">
                  Kentara
                </span>
                <span className="text-[10px] text-zinc-400 font-bold block">
                  Detail Benih Unggul
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationCenter role="petani" userId={profile.id} />
              <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-black border border-emerald-300 dark:border-emerald-800">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="hidden sm:block">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Detail View Content */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 lg:p-8">
          <ProductDetailView
            product={product}
            relatedProducts={relatedProducts}
            currentUser={profile}
          />
        </main>
      </div>
    </CartProvider>
  );
}
