'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  ShieldAlert,
  Mail,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Laptop,
  Palette,
  ExternalLink,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '@/components/auth/logout-button';
import { useNotifications } from '@/hooks/use-notifications';
import type { UserProfile } from '@/types/auth';

interface AdminSettingsViewProps {
  profile: UserProfile;
}

export function AdminSettingsView({ profile }: AdminSettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { permission, requestPermission } = useNotifications({
    role: 'admin',
    userId: profile.id,
  });

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. Admin Profile Card */}
      <Card className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xl shadow-xs shrink-0 border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white truncate">
                {profile.full_name}
              </h3>
              <Badge className="bg-purple-600 text-white text-[10px] px-2 py-0.5 uppercase">
                Admin
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              <span>{profile.email || 'admin@kentara.com'}</span>
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Hak Akses Sistem:</span>
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            Superadmin Penuh (All Permissions)
          </span>
        </div>
      </Card>

      {/* 2. Theme Setting (Light / Dark / System Mode) */}
      <Card className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
              Tema Tampilan Admin Panel
            </h4>
            <p className="text-[11px] text-zinc-400">
              Pilih mode terang untuk tampilan bersih atau mode gelap untuk kenyamanan mata.
            </p>
          </div>
        </div>

        {mounted && (
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                theme === 'light'
                  ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-medium'
              }`}
            >
              <Sun className="h-5 w-5 text-amber-500" />
              <span className="text-xs">Terang</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-medium'
              }`}
            >
              <Moon className="h-5 w-5 text-indigo-500" />
              <span className="text-xs">Gelap</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                theme === 'system'
                  ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-medium'
              }`}
            >
              <Laptop className="h-5 w-5 text-zinc-500" />
              <span className="text-xs">Sistem</span>
            </button>
          </div>
        )}
      </Card>

      {/* 3. Push Notifications Card */}
      <Card className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                Notifikasi Pesanan &amp; Transaksi
              </h4>
              <p className="text-[11px] text-zinc-400">
                {permission === 'granted'
                  ? 'Notifikasi aktif untuk setiap pesanan masuk & pelunasan'
                  : 'Aktifkan agar menerima notifikasi saat ada pesanan baru'}
              </p>
            </div>
          </div>

          {permission === 'granted' ? (
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Aktif
            </Badge>
          ) : (
            <Button
              onClick={requestPermission}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold h-7 px-3 shadow-xs"
            >
              Aktifkan
            </Button>
          )}
        </div>
      </Card>

      {/* 4. Quick Link to Public Marketplace */}
      <Card className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
              Lihat Etalase Marketplace
            </h4>
            <p className="text-[11px] text-zinc-400">
              Buka tampilan toko dan katalog dari sudut pandang pembeli / petani.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
          >
            <span>Buka Toko</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Card>

      {/* 5. Logout Action */}
      <div className="pt-2">
        <LogoutButton className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl h-11 shadow-md gap-2 flex items-center justify-center cursor-pointer" />
      </div>
    </div>
  );
}
