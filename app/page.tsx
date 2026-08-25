import Link from 'next/link';
import Image from 'next/image';
import {
  Sprout,
  ShieldCheck,
  Truck,
  Sparkles,
  CreditCard,
  User,
  ShoppingBag,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { PotatoSeedCatalog } from '@/components/marketplace/potato-seed-catalog';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { getAdminProductsList } from '@/lib/admin/product-actions';
import { getCurrentUserProfile } from '@/lib/auth/actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const profile = await getCurrentUserProfile();

  // Jika akun sudah login, otomatis langsung diarahkan ke dashboard perannya masing-masing
  if (profile) {
    redirect(`/${profile.role}`);
  }

  const products = await getAdminProductsList();
  const activeProducts = products.filter((p) => p.is_active);

  return (
    <div className="flex flex-col min-h-screen bg-emerald-950/5 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/80 backdrop-blur-md dark:border-emerald-500/10 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={38}
              height={38}
              className="rounded-xl shadow-xs"
              priority
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
                Kentara
              </span>
              <span className="text-[10px] font-bold tracking-wide text-zinc-500 uppercase">
                Pusat Benih Kentang Unggul Bersertifikat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationCenter role="all" />
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50/60 px-4 py-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 transition min-h-[36px]"
            >
              <User className="h-3.5 w-3.5" />
              <span>Masuk</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-10 sm:py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col items-center text-center">
              <Badge
                variant="outline"
                className="mb-4 flex items-center gap-1.5 rounded-full border-emerald-600/20 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Varietas Unggul Bersertifikasi Balitsa Lembang &amp; BPSB</span>
              </Badge>

              <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-zinc-900 dark:text-white">
                Solusi Benih Pertanian Berkualitas untuk{' '}
                <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  Hasil Panen Maksimal
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base md:text-lg">
                Dapatkan benih kentang unggulan bersertifikat (*Granola L, Atlantic, Medians, Tenggo, G0 Mini Tuber*) dengan daya tumbuh tinggi, bebas virus, dan dikirim langsung dengan pelacakan GPS armada kurir ke lokasi lahan Anda.
              </p>
            </div>
          </div>
        </section>

        {/* POTATO SEED CATALOG WITH MULTI-ITEM CHECKOUT & MIDTRANS */}
        <section className="py-8 sm:py-12 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-emerald-900/10 dark:border-emerald-500/10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-xs px-3 py-1 font-bold">
                Katalog Benih Kentang
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-2">
                Pilih Varietas Benih Kentang Unggulan
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Anda dapat memilih 1 atau beberapa varietas benih sekaligus, menambahkan ke keranjang, dan melakukan pembayaran instan melalui Midtrans.
              </p>
            </div>

            <PotatoSeedCatalog
              products={activeProducts}
              currentUser={null}
            />
          </div>
        </section>

        {/* Value Proposition Features */}
        <section className="border-t border-emerald-900/10 bg-white py-14 dark:border-emerald-500/10 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  100% Bersertifikasi Resmi
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Semua bibit kentang memiliki sertifikasi mutu Balitsa Lembang &amp; BPSB Jawa Barat dengan tingkat daya tumbuh di atas 95%.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Pengantaran GPS Real-Time
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Lacak armada kurir pengantar bibit kentang langsung menuju koordinat lahan pertanian Anda dengan estimasi tiba akurat.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Pembayaran Aman &amp; Otomatis
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Didukung Midtrans Payment Gateway untuk pembayaran instan via QRIS, GoPay, ShopeePay, serta Virtual Account bank resmi.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 bg-white py-6 dark:border-emerald-500/10 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Kentara. Hak Cipta Dilindungi Undang-Undang. Platform Agribisnis Benih Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}
