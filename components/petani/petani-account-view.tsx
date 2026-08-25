'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ChevronRight,
  LogOut,
  HelpCircle,
  MessageCircle,
  FileText,
  MapPin,
  Moon,
  Sun,
  Sprout,
  ShoppingBag,
  ExternalLink,
  Award,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logoutAction } from '@/lib/auth/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import type { UserProfile } from '@/types/auth';
import type { Order } from '@/types/order';

interface PetaniAccountViewProps {
  profile: UserProfile;
  orders?: Order[];
}

export function PetaniAccountView({ profile, orders = [] }: PetaniAccountViewProps) {
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initialLetter = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'P';

  // Calculate order stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.order_status === 'menunggu_pembayaran').length;
  const inDeliveryOrders = orders.filter((o) => o.order_status === 'dikirim').length;
  const completedOrders = orders.filter((o) => o.order_status === 'selesai').length;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await logoutAction();
      if (res.success) {
        toast.success('Berhasil keluar dari akun Kentara.');
        window.location.href = res.redirectTo || '/login';
      } else {
        toast.error(res.error || 'Gagal keluar dari akun.');
        setIsLoggingOut(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal keluar dari akun.');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* 1. USER PROFILE BANNER CARD */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Avatar with Ring */}
        <div className="relative shrink-0">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg ring-4 ring-emerald-500/20">
            {initialLetter}
          </div>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-base sm:text-xl font-black text-zinc-900 dark:text-white leading-tight">
              {profile.full_name || 'Petani Kentara'}
            </h1>
            <Badge className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 border-none shadow-2xs">
              ✓ MITRA PETANI TERVERIFIKASI
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-zinc-500 font-semibold">
            {profile.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-600" />
                <span>{profile.phone}</span>
              </span>
            )}
            {profile.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-emerald-600" />
                <span>{profile.email}</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 max-w-lg">
            Akun resmi pembeli benih pertanian unggul bersertifikat BPSB langsung dari penangkar terverifikasi.
          </p>
        </div>
      </div>

      {/* 2. ORDER QUICK STATS GRID */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Link
          href="/petani/orders"
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center hover:border-emerald-500/50 transition active:scale-98 shadow-xs"
        >
          <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mx-auto flex items-center justify-center mb-1">
            <Package className="h-4 w-4" />
          </div>
          <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-white block">
            {totalOrders}
          </span>
          <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold block truncate">
            Semua Pesanan
          </span>
        </Link>

        <Link
          href="/petani/orders"
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center hover:border-amber-500/50 transition active:scale-98 shadow-xs"
        >
          <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 mx-auto flex items-center justify-center mb-1">
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-sm sm:text-base font-black text-amber-600 block">
            {pendingOrders}
          </span>
          <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold block truncate">
            Belum Bayar
          </span>
        </Link>

        <Link
          href="/petani/orders"
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center hover:border-purple-500/50 transition active:scale-98 shadow-xs"
        >
          <div className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 mx-auto flex items-center justify-center mb-1">
            <Truck className="h-4 w-4" />
          </div>
          <span className="text-sm sm:text-base font-black text-purple-600 block">
            {inDeliveryOrders}
          </span>
          <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold block truncate">
            Sedang Kirim
          </span>
        </Link>

        <Link
          href="/petani/orders"
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center hover:border-emerald-500/50 transition active:scale-98 shadow-xs"
        >
          <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center mb-1">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span className="text-sm sm:text-base font-black text-emerald-600 block">
            {completedOrders}
          </span>
          <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold block truncate">
            Selesai
          </span>
        </Link>
      </div>

      {/* 3. MENU & PENGATURAN LAYANAN */}
      <div className="space-y-3">
        {/* Aktivitas Belanja */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-2 sm:p-3 divide-y divide-zinc-100 dark:divide-zinc-800 shadow-xs">
          <Link
            href="/petani/orders"
            className="p-3 flex items-center justify-between gap-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Package className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white block group-hover:text-emerald-600 transition">
                  Daftar Pesanan Benih Saya
                </span>
                <span className="text-[10px] text-zinc-400">
                  Pantau resi, status kurir, dan pembayaran
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600 transition" />
          </Link>

          <Link
            href="/petani"
            className="p-3 flex items-center justify-between gap-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Sprout className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white block group-hover:text-emerald-600 transition">
                  Pasar &amp; Katalog Benih Kentara
                </span>
                <span className="text-[10px] text-zinc-400">
                  Eksplorasi benih kentang unggul Granola, Atlantic, Medians
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600 transition" />
          </Link>
        </div>

        {/* Bantuan & Informasi Layanan */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-2 sm:p-3 divide-y divide-zinc-100 dark:divide-zinc-800 shadow-xs">
          <a
            href="https://wa.me/6285156392978?text=Halo%20Admin%20Kentara,%20saya%20petani%20ingin%20konsultasi%20benih"
            target="_blank"
            rel="noreferrer"
            className="p-3 flex items-center justify-between gap-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <MessageCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white block group-hover:text-emerald-600 transition">
                  Pusat Bantuan &amp; Konsultasi Agronomi
                </span>
                <span className="text-[10px] text-zinc-400">
                  WhatsApp Customer Service resmi Kentara
                </span>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600 transition" />
          </a>

          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white block">
                  Jaminan Sertifikasi Resmi BPSB
                </span>
                <span className="text-[10px] text-zinc-400">
                  Benih berlabel resmi, bebas penyakit &amp; kemurnian varietas terjamin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tampilan & Pengaturan */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-3 sm:p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
              <Moon className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white block">
                Mode Tampilan Aplikasi
              </span>
              <span className="text-[10px] text-zinc-400">
                Pilih tema gelap (Dark) atau terang (Light)
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* 4. PROMINENT LOGOUT BUTTON (KELUAR AKUN) */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full h-12 sm:h-13 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black text-xs sm:text-sm border border-rose-200 dark:border-rose-800/80 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar dari Akun Kentara</span>
        </Button>
      </div>

      {/* 5. LOGOUT CONFIRMATION DIALOG */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center space-y-3">
          <DialogHeader className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto shadow-md ring-4 ring-rose-500/20">
              <LogOut className="h-7 w-7" />
            </div>
            <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              Konfirmasi Keluar Akun
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Apakah Anda yakin ingin keluar dari akun <strong>{profile.full_name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-zinc-500">
            Anda dapat masuk kembali kapan saja untuk memantau pesanan dan membeli benih unggul.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="rounded-2xl text-xs font-bold h-11"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black h-11 shadow-md"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                'Ya, Keluar Akun'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
