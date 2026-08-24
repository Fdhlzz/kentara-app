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
  Truck,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerAction } from '@/lib/auth/actions';
import type { UserRole } from '@/types/auth';

const ROLES: Array<{
  id: UserRole;
  title: string;
  desc: string;
  icon: typeof Sprout;
}> = [
  {
    id: 'petani',
    title: 'Petani / Pembeli',
    desc: 'Beli dan kelola pesanan benih unggul',
    icon: Sprout,
  },
  {
    id: 'kurir',
    title: 'Kurir Pengiriman',
    desc: 'Antar benih ke alamat petani di lahan',
    icon: Truck,
  },
  {
    id: 'admin',
    title: 'Admin Platform',
    desc: 'Kelola marketplace dan katalog benih',
    icon: ShieldAlert,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('petani');

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim()) {
      toast.error('Email wajib diisi');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter');
      return;
    }

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('phone', phone);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', selectedRole);

    startTransition(async () => {
      const res = await registerAction(formData);
      if (!res.success) {
        toast.error(res.error || 'Gagal mendaftar akun');
        return;
      }

      toast.success('Pendaftaran Berhasil!', {
        description: `Selamat datang di Kentara sebagai ${selectedRole.toUpperCase()}.`,
      });

      if (res.redirectTo) {
        router.push(res.redirectTo);
      } else {
        router.push(`/${selectedRole}`);
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
            Daftar Akun Kentara
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Bergabunglah dengan ekosistem marketplace benih pertanian
          </p>
        </div>

        {/* Form Registrasi */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Pilihan Role */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Pilih Peran Akun (Role) *
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {ROLES.map((role) => {
                const IconComponent = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    disabled={isPending}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition text-xs ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-emerald-200'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'
                    }`}
                  >
                    <IconComponent
                      className={`h-5 w-5 mb-1 ${
                        isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                      }`}
                    />
                    <span className="font-semibold">{role.title.split('/')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nama Lengkap *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Bpk. Hendra Gunawan"
                required
                disabled={isPending}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nomor WhatsApp / Telepon
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="petani@kentara.id"
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
                onChange={(e) => setPassword(e.target.value)}
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
            className="w-full min-h-[48px] touch-manipulation font-bold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition mt-2"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Mendaftarkan Akun...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Daftar Sebagai {selectedRole.toUpperCase()}</span>
              </div>
            )}
          </Button>
        </form>

        {/* Footer Navigasi */}
        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Sudah memiliki akun?{' '}
            <Link
              href="/login"
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Masuk Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
