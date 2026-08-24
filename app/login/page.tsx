'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LogIn, Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginAction } from '@/lib/auth/actions';

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email wajib diisi');
      return;
    }
    if (!password) {
      toast.error('Kata sandi wajib diisi');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (!res.success) {
        toast.error(res.error || 'Gagal masuk akun');
        return;
      }

      toast.success('Berhasil masuk!', {
        description: 'Mengarahkan ke halaman dashboard Anda...',
      });

      if (res.redirectTo) {
        router.push(res.redirectTo);
      } else {
        router.push('/');
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
        <div className="text-center space-y-2 mb-8">
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
            Masuk ke Kentara
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Akses akun Anda sebagai Admin, Petani, atau Kurir
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px] transition"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[48px] touch-manipulation font-bold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition mt-2"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Memverifikasi Akun...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>Masuk Sekarang</span>
              </div>
            )}
          </Button>
        </form>

        {/* Footer Navigasi */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-3">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Belum memiliki akun Kentara?{' '}
            <Link
              href="/register"
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Daftar Sekarang
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Sistem Otentikasi Aman &amp; Terenkripsi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
