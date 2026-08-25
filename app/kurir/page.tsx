import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Truck,
  Mail,
  Phone,
  ArrowLeft,
  PackageCheck,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/auth/logout-button';
import { DeliveryTrackingMap } from '@/components/maps/delivery-tracking-map';
import { NotificationCenter } from '@/components/notifications/notification-center';

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

  const tasks = assignedOrders || [];

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
                Dashboard Kurir
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">
                Logistik Pengantaran Benih Kentara
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationCenter role="kurir" userId={profile.id} />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Beranda</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Card Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  {profile.full_name}
                </h1>
                <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 uppercase">
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
                  <PackageCheck className="h-3.5 w-3.5" />
                  Status: Siap Bertugas ({tasks.filter(t => t.order_status !== 'selesai').length} Tugas Aktif)
                </span>
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <LogoutButton className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2" />
          </div>
        </div>

        {/* Courier Tasks List Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Daftar Tugas Pengantaran Benih
              </h2>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2.5 py-0.5">
              {tasks.length} Total Tugas
            </Badge>
          </div>

          {tasks.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60">
              <Truck className="h-10 w-10 mx-auto text-zinc-400 mb-2" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Belum ada tugas pengantaran baru
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                Ketika admin menugaskan pesanan pengantaran kepada Anda, notifikasi dan rute akan muncul di sini.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task: any) => (
                <Card
                  key={task.id}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-extrabold text-sm text-zinc-900 dark:text-white block">
                        {task.order_code}
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <Badge
                      className={`text-[10px] font-bold ${
                        task.order_status === 'selesai'
                          ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      }`}
                    >
                      {task.order_status === 'selesai' ? '✅ Selesai' : '🚚 Sedang Diantar'}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900 dark:text-white">{task.customer_name}</span>
                      <a
                        href={`https://wa.me/${task.customer_phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Phone className="h-3 w-3" />
                        {task.customer_phone}
                      </a>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{task.shipping_address}{task.shipping_city ? `, ${task.shipping_city}` : ''}</span>
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
                      Item Benih ({task.items?.length || 0}):
                    </span>
                    {task.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-zinc-700 dark:text-zinc-300">
                        <span>{item.quantity} {item.unit} &times; {item.product_name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Total Tagihan ({task.payment_gateway === 'cash' ? '💵 Bayar Tunai' : '💳 Sudah Bayar Online'})</span>
                      <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                        Rp {task.total_amount?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {task.payment_status === 'settlement' || task.payment_status === 'paid'
                        ? 'Lunas'
                        : 'Tagih Tunai (COD)'}
                    </span>
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
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Rute GPS Pengantaran Benih (Lokasi Anda ➔ Pembeli)
              </h2>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-2.5 py-0.5">
              Live GPS Sync
            </Badge>
          </div>

          <DeliveryTrackingMap
            orderId="KNT-EXP-MKS-9921"
            seedName="Benih Kentang Granola L - G2 Pangalengan Bersertifikat (100 Kg)"
            courierName={profile.full_name}
            courierPhone={profile.phone || '08123456789'}
            farmerName="Bpk. Subardi (Petani Pembeli)"
            farmerAddress="Jl. Perintis Kemerdekaan, Tamalanrea, Kota Makassar"
            farmerCoords={[-5.1379367, 119.4357388]}
            warehouseCoords={[-5.1215, 119.4195]}
          />
        </section>
      </main>
    </div>
  );
}
