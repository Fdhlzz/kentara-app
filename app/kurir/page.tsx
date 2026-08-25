import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { CourierAppShell } from '@/components/courier/courier-app-shell';
import type { Order } from '@/types/order';

export const dynamic = 'force-dynamic';

export default async function KurirPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login');
  }

  // Jika bukan kurir, arahkan ke role yang sesuai
  if (profile.role !== 'kurir') {
    redirect(`/${profile.role}`);
  }

  const supabase = await createClient();
  const { data: assignedOrders } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('courier_id', profile.id)
    .order('created_at', { ascending: false });

  const orders = (assignedOrders || []) as Order[];

  return <CourierAppShell profile={profile} orders={orders} />;
}
