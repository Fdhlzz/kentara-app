import Image from "next/image";
import { Sprout, ShieldCheck, Truck, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
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
              className="rounded-xl shadow-sm"
              priority
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
                Kentara
              </span>
              <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
                Benih Pertanian Unggul
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition">
              <ShoppingBag className="h-4 w-4" />
              <span>Katalog Benih</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div className="flex flex-col gap-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 self-center rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 lg:self-start">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Platform Benih Pertanian #1 di Indonesia</span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-zinc-900 dark:text-white">
                  Tumbuhkan Hasil Panen Terbaik dengan{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Benih Unggul
                  </span>
                </h1>

                <p className="text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Kentara menyediakan beragam benih pertanian bersertifikasi resmi, mulai dari padi, jagung, palawija, hingga sayuran organik berkualitas tinggi untuk petani dan pegiat agrikultur modern.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md hover:bg-emerald-700 transition">
                    <span>Jelajahi Produk</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-base font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80 transition">
                    <Sprout className="h-4 w-4 text-emerald-600" />
                    <span>Panduan Menanam</span>
                  </button>
                </div>
              </div>

              {/* App Icon Showcase */}
              <div className="flex justify-center">
                <div className="relative flex items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-800 to-emerald-600 p-8 shadow-2xl">
                  <Image
                    src="/icons/icon-512x512.png"
                    alt="Kentara App Icon"
                    width={280}
                    height={280}
                    className="rounded-2xl shadow-lg"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Features */}
        <section className="border-t border-emerald-900/10 bg-white py-16 dark:border-emerald-500/10 dark:bg-zinc-900/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  100% Benih Bersertifikasi
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Semua benih teruji daya kecambah tinggi (&gt;85%) dan bebas dari kontaminasi hama penyakit.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Sprout className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Varietas Lengkap
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Tersedia benih pangan utama, sayuran daun & buah, herbal, hingga bibit tanaman perkebunan unggul.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Pengiriman Seluruh Nusantara
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Kemasan khusus kedap udara menjaga kualitas benih tetap prima hingga tiba di lahan Anda.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/10 bg-white py-8 text-center text-sm text-zinc-500 dark:border-emerald-500/10 dark:bg-zinc-950">
        <p>© {new Date().getFullYear()} Kentara. Hak Cipta Dilindungi. Platform Benih Pertanian Indonesia.</p>
      </footer>
    </div>
  );
}
