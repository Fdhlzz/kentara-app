import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sprout,
  Mail,
  Phone,
  ShoppingBag,
  MapPin,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/logout-button';
import { DeliveryTrackingMap } from '@/components/maps/delivery-tracking-map';
import { NotificationCenter } from '@/components/notifications/notification-center';

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

  const supabase = await createClient();
  const { data: userOrders } = await supabase
    .from('orders')
    .select(`
      *,
      courier:profiles!orders_courier_id_fkey(full_name, phone),
      items:order_items(*)
    `)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const orders = userOrders || [];

  return (
    <div className="min-h-screen flex flex-col bg-emerald-950/5 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={34}
              height={34}
              className="rounded-xl shadow-xs"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400 leading-tight">
                Dashboard Petani
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                Pusat Pesanan &amp; Benih Pertanian
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationCenter role="petani" userId={profile.id} />
            <Link
              href="/#katalog-benih"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Beli Benih Kentang</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Sprout className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  {profile.full_name}
                </h1>
                <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 uppercase">
                  {profile.role}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {profile.email || '-'}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Package className="h-3.5 w-3.5" />
                  Akun Pembeli Terverifikasi
                </span>
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center flex items-center gap-2">
            <LogoutButton className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2" />
          </div>
        </div>

        {/* Farmer's Recent Orders List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Riwayat Pesanan Benih Saya
              </h2>
            </div>
            <Link
              href="/#katalog-benih"
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <span>+ Pesan Lagi</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60">
              <ShoppingBag className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Belum ada riwayat pesanan benih
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Pilih varietas benih kentang unggulan bersertifikat di marketplace Kentara.
              </p>
              <Link
                href="/#katalog-benih"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Beli Benih Sekarang</span>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order: any) => (
                <Card
                  key={order.id}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white block">
                        {order.order_code}
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {order.payment_status === 'settlement' || order.payment_status === 'paid' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                          Lunas
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                          Pending
                        </Badge>
                      )}
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase">
                        {order.order_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {item.quantity} {item.unit} &times; {item.product_name}
                        </span>
                        <span className="font-bold">
                          Rp {item.subtotal?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Total Pembayaran</span>
                      <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        Rp {order.total_amount?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {order.courier?.full_name ? (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" /> {order.courier.full_name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 italic">
                        Menunggu Kurir
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Live Delivery Map Tracking Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Pelacakan Pengiriman Benih ke Lahan (Leaflet Maps)
              </h2>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-2.5 py-0.5">
              Live Tracker
            </Badge>
          </div>

          <DeliveryTrackingMap
            orderId="KNT-ORD-MKS-5542"
            seedName="Benih Kentang Granola L - G2 Pangalengan Bersertifikat (100 Kg)"
            courierName="Budi Santoso (Kurir Kentara)"
            courierPhone="081987654321"
            farmerName={profile.full_name}
            farmerAddress="Jl. Perintis Kemerdekaan, Tamalanrea, Kota Makassar"
            farmerCoords={[-5.1379367, 119.4357388]}
            warehouseCoords={[-5.1215, 119.4195]}
          />
        </section>
      </main>
    </div>
  );
}
