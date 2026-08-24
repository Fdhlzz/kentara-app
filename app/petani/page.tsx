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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { LogoutButton } from '@/components/auth/logout-button';
import { DeliveryTrackingMap } from '@/components/maps/delivery-tracking-map';

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

          <div className="flex items-center gap-2">
            <Link
              href="/#katalog-benih"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl shadow-xs transition"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Beli Benih</span>
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
            orderId="KNT-ORD-5542"
            seedName="Benih Padi Inpari 32 Bersertifikat (10 Kg)"
            courierName="Budi Santoso (Kurir Kentara)"
            courierPhone="081987654321"
            courierCoords={[-7.262, 112.742]}
            farmerName={profile.full_name}
            farmerAddress="Lahan Pertanian Krajan Kidul, Jawa Timur"
            farmerCoords={[-7.288, 112.782]}
            warehouseCoords={[-7.242, 112.732]}
          />
        </section>
      </main>
    </div>
  );
}
