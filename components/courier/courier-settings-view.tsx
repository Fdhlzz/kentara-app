'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  User,
  Phone,
  Mail,
  Shield,
  Bell,
  Check,
  Save,
  Loader2,
  HelpCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '@/components/auth/logout-button';
import { updateCourierSelfProfileAction } from '@/lib/admin/courier-actions';
import { useNotifications } from '@/hooks/use-notifications';
import type { UserProfile } from '@/types/auth';

interface CourierSettingsViewProps {
  profile: UserProfile;
}

export function CourierSettingsView({ profile }: CourierSettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [isEditing, setIsEditing] = useState(false);

  const { permission, requestPermission } = useNotifications({
    role: 'kurir',
    userId: profile.id,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCourierSelfProfileAction({
        full_name: fullName,
        phone,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal memperbarui profil.');
        return;
      }

      toast.success('Profil berhasil diperbarui!');
      setIsEditing(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Profile Card */}
      <Card className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            {profile.full_name?.charAt(0) || 'K'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white truncate">
                {profile.full_name}
              </h3>
              <Badge className="bg-blue-600 text-white text-[10px] px-2 py-0.5 uppercase">
                Kurir
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{profile.email || '-'}</p>
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nomor WhatsApp / Telepon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Telepon:
              </span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {profile.phone || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Hak Akses:
              </span>
              <span className="font-semibold text-emerald-600">Mitra Logistik Terverifikasi</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="w-full mt-2 rounded-xl text-xs font-semibold h-8"
            >
              Ubah Data Profil
            </Button>
          </div>
        )}
      </Card>

      {/* Push Notifications Card */}
      <Card className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                Notifikasi Tugas &amp; Web Push
              </h4>
              <p className="text-[11px] text-zinc-400">
                {permission === 'granted'
                  ? 'Notifikasi aktif untuk tugas pengantaran baru'
                  : 'Aktifkan agar menerima notifikasi saat ada tugas'}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-7 px-3 shadow-xs"
            >
              Aktifkan
            </Button>
          )}
        </div>
      </Card>

      {/* App Support / Info */}
      <Card className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2 text-xs">
        <div className="flex items-center justify-between text-zinc-500">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" /> Bantuan Operasional:
          </span>
          <a
            href="https://wa.me/628123456789"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 font-semibold hover:underline"
          >
            Hubungi Dispatcher / Admin
          </a>
        </div>
        <div className="flex items-center justify-between text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span>Versi Aplikasi:</span>
          <span className="font-mono text-[11px]">Kentara Kurir v1.2 (PWA)</span>
        </div>
      </Card>

      {/* Logout Action */}
      <div className="pt-2">
        <LogoutButton className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl h-11 shadow-md gap-2 flex items-center justify-center" />
      </div>
    </div>
  );
}
