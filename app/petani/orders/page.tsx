import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { getPetaniOrdersAction } from '@/lib/admin/order-actions';
import { getUserCartAction } from '@/lib/cart/cart-actions';
import { CartProvider } from '@/lib/cart/cart-context';
import { PetaniOrdersPageContent } from '@/components/petani/petani-orders-page-content';

export const dynamic = 'force-dynamic';

export default async function PetaniOrdersPage() {
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
      <PetaniOrdersPageContent orders={orders} currentUser={profile} />
    </CartProvider>
  );
}
