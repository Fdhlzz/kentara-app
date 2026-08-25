'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowLeft,
  Sprout,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { registerAction } from '@/lib/auth/actions';

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      const err = 'Nama lengkap wajib diisi.';
      setErrorMessage(err);
      toast.error(err);
      return;
    }
    if (!email.trim()) {
      const err = 'Alamat email wajib diisi.';
      setErrorMessage(err);
      toast.error(err);
      return;
    }
    if (!password || password.length < 6) {
      const err = 'Kata sandi minimal harus 6 karakter.';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('password', password);

    startTransition(async () => {
      const res = await registerAction(formData);
      if (!res.success) {
        const errorText = res.error || 'Gagal mendaftar akun. Silakan coba kembali.';
        setErrorMessage(errorText);
        toast.error(errorText);
        return;
      }

      toast.success('Pendaftaran Berhasil!', {
        description: 'Selamat datang di Kentara! Mengarahkan ke dashboard Petani...',
      });

      // Sync guest cart from localStorage into database if exists
      if (typeof window !== 'undefined') {
        const guestStorage = localStorage.getItem('kentara_guest_cart');
        if (guestStorage) {
          try {
            const { syncGuestCartToDatabaseAction } = await import('@/lib/cart/cart-actions');
            const parsed = JSON.parse(guestStorage);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await syncGuestCartToDatabaseAction(parsed);
              localStorage.removeItem('kentara_guest_cart');
            }
          } catch (e) {
            console.error('[Register guest cart sync error]:', e);
          }
        }
      }

      if (res.redirectTo) {
        router.push(res.redirectTo);
      } else {
        router.push('/petani');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-emerald-950/5 dark:bg-zinc-950">
      {/* Tombol Kembali */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-700 dark:text-emerald-400 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shadow-sm mb-1">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={44}
              height={44}
              className="rounded-xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Daftar Akun Petani
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Daftar untuk membeli benih bersertifikasi dan pantau riwayat pesanan Anda
          </p>

          <div className="pt-2">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 px-3 py-1 text-xs">
              <Sprout className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Peran: Petani / Pembeli Benih
            </Badge>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form Registrasi */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nama Lengkap Petani / Kelompok Tani *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Contoh: Bpk. Budi Santoso"
                required
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nomor WhatsApp / HP Aktif
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Contoh: 081234567890"
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Alamat Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="petani@email.com"
                required
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Kata Sandi (Minimal 6 Karakter) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px] transition"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[48px] touch-manipulation font-bold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition mt-2 cursor-pointer"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Mendaftarkan Akun Petani...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Daftar Akun Petani</span>
              </div>
            )}
          </Button>
        </form>

        {/* Footer Navigasi */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Sudah memiliki akun?{' '}
            <Link
              href="/login"
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Masuk Sekarang
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Akun Admin &amp; Kurir dikonfigurasi melalui database</span>
          </div>
        </div>
      </div>
    </div>
  );
}
