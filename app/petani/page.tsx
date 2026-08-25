import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { getAdminProductsList } from '@/lib/admin/product-actions';
import { getUserCartAction } from '@/lib/cart/cart-actions';
import { createClient } from '@/lib/supabase/server';
import { PetaniAppShell } from '@/components/petani/petani-app-shell';
import type { Order } from '@/types/order';

export const dynamic = 'force-dynamic';

export default async function PetaniPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login');
  }

  // Jika bukan petani, arahkan ke role yang sesuai
  if (profile.role !== 'petani') {
    redirect(`/${profile.role}`);
  }

  // Fetch products, user orders, and initial user cart in parallel
  const supabase = await createClient();
  const [products, cartItems, { data: userOrders }] = await Promise.all([
    getAdminProductsList(),
    getUserCartAction(),
    supabase
      .from('orders')
      .select(`
        *,
        courier:profiles!orders_courier_id_fkey(full_name, phone),
        items:order_items(*)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
  ]);

  const activeProducts = products.filter((p) => p.is_active);
  const orders: Order[] = (userOrders || []) as Order[];

  return (
    <PetaniAppShell
      profile={profile}
      products={activeProducts}
      orders={orders}
      initialCartItems={cartItems}
    />
  );
}
