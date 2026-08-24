import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, User, Mail, Phone, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getCurrentUserProfile } from '@/lib/auth/actions';
import { LogoutButton } from '@/components/auth/logout-button';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect('/login');
  }

  // Jika bukan admin, arahkan ke role yang sesuai
  if (profile.role !== 'admin') {
    redirect(`/${profile.role}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-emerald-950/5 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={34}
              height={34}
              className="rounded-xl shadow-xs"
            />
            <span className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
              Kentara Admin
            </span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-emerald-700 dark:text-zinc-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <Card className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-6 text-center">
            {/* Avatar & Role Badge */}
            <div className="flex flex-col items-center space-y-3">
              <div className="h-20 w-20 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-inner">
                <ShieldAlert className="h-10 w-10" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  {profile.full_name}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Panel Administrator Kentara
                </p>
              </div>

              <Badge className="bg-purple-600 text-white hover:bg-purple-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-xs">
                Peran: {profile.role}
              </Badge>
            </div>

            {/* Informasi Detail Akun */}
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50 p-4 text-left space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Nama
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {profile.full_name}
                </span>
              </div>

              {profile.email && (
                <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/80 pt-2.5">
                  <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </span>
                  <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
                    {profile.email}
                  </span>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/80 pt-2.5">
                  <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    WhatsApp
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {profile.phone}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/80 pt-2.5">
                <span className="text-zinc-500 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                  Status Hak Akses
                </span>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                  Akses Penuh (Admin)
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-2">
              <LogoutButton className="w-full bg-rose-600 hover:bg-rose-700 text-white" />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
