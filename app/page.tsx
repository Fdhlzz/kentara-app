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
import { Badge } from '@/components/ui/badge';
import { PotatoSeedCatalog } from '@/components/marketplace/potato-seed-catalog';
import { getAdminProductsList } from '@/lib/admin/product-actions';
import { getCurrentUserProfile } from '@/lib/auth/actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [products, profile] = await Promise.all([
    getAdminProductsList(),
    getCurrentUserProfile(),
  ]);

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
            {profile ? (
              <Link
                href={`/${profile.role}`}
                className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50/60 px-4 py-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 transition min-h-[36px]"
              >
                <User className="h-3.5 w-3.5" />
                <span>Dashboard ({profile.role})</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50/60 px-4 py-1.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 transition min-h-[36px]"
              >
                <User className="h-3.5 w-3.5" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 self-center rounded-full border border-emerald-600/20 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 lg:self-start">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Sentra Perbenihan Kentang Terpercaya di Indonesia</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                  Maksimalkan Hasil Panen dengan{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Benih Kentang Bersertifikat
                  </span>
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Kentara menghadirkan varietas benih kentang Granola L, Atlantic, Medians, Tenggo, dan G0 Mini Tuber langsung dari screenhouse dan penangkar resmi BPSB. Pembayaran instan via Midtrans (QRIS, VA, E-Wallet) dan armada kurir langsung ke lahan.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <a
                    href="#katalog-benih"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-md transition min-h-[44px]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Pesan Benih Sekarang</span>
                  </a>
                  <Link
                    href="/login"
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-sm sm:text-base font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 transition min-h-[44px]"
                  >
                    <User className="h-4 w-4 text-emerald-600" />
                    <span>Masuk Akun Petani</span>
                  </Link>
                </div>

                {/* Midtrans Payment Badge */}
                <div className="flex items-center justify-center lg:justify-start gap-2 pt-2 text-xs text-zinc-500">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Gateway Pembayaran Resmi Midtrans: QRIS, GoPay, ShopeePay, Bank Transfer</span>
                </div>
              </div>

              {/* App Showcase Visual */}
              <div className="flex justify-center">
                <div className="relative flex items-center justify-center rounded-3xl bg-linear-to-tr from-emerald-800 to-emerald-600 p-8 shadow-2xl">
                  <Image
                    src="/icons/icon-512x512.png"
                    alt="Kentara App Icon"
                    width={260}
                    height={260}
                    className="rounded-2xl shadow-lg"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Potato Seed Products Section */}
        <section id="katalog-benih" className="border-t border-emerald-900/10 bg-zinc-50/50 py-14 sm:py-20 dark:border-emerald-500/10 dark:bg-zinc-900/20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 mb-2 font-bold">
                Katalog Komoditas Benih Kentang
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
                Pilih Varietas Benih Kentang Unggulan
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Anda dapat memilih 1 atau beberapa varietas benih sekaligus, menambahkan ke keranjang, dan melakukan pembayaran instan melalui Midtrans.
              </p>
            </div>

            <PotatoSeedCatalog
              products={activeProducts}
              currentUser={
                profile
                  ? {
                      full_name: profile.full_name,
                      phone: profile.phone || '',
                      email: profile.email || '',
                    }
                  : null
              }
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
                  100% Sertifikasi BPSB Resmi
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Semua kelas benih (G0, G1, G2, G3) telah melalui pengujian laboratorium dan memiliki label sertifikasi pengawasan benih.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Sprout className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Kondisi Tunas Optimal
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Tersedia pilihan benih siap tanam (tunas 1-2 cm) maupun kondisi pecah dormansi dengan daya tumbuh di atas 90%.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Armada Logistik Khusus
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Pengantaran langsung oleh mitra kurir terlatih dengan pelacakan peta GPS waktu-nyata sampai ke lokasi lahan.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 bg-white py-8 text-center text-xs text-zinc-500 dark:border-emerald-500/10 dark:bg-zinc-950">
        <p>© {new Date().getFullYear()} Kentara. Hak Cipta Dilindungi. Platform Sentra Benih Kentang Indonesia.</p>
      </footer>
    </div>
  );
}
