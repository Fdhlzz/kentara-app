'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  ShoppingBag,
  Truck,
  CheckCircle2,
  DollarSign,
  Info,
  CheckCheck,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/hooks/use-notifications';
import type { AppNotification } from '@/types/notification';

interface NotificationCenterProps {
  role?: string;
  userId?: string;
  className?: string;
}

export function NotificationCenter({
  role = 'all',
  userId,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ role, userId });

  // Get type icon & badge
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return (
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </div>
        );
      case 'courier_task':
        return (
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 shrink-0">
            <Truck className="h-4 w-4" />
          </div>
        );
      case 'payment_success':
        return (
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'order_delivered':
        return (
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
            <Info className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-xs ${className || ''}`}
        title="Pemberitahuan & Notifikasi"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        ) : (
          <Bell className="h-4 w-4" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dialog Center */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-5">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold text-zinc-900 dark:text-white">
                    Pemberitahuan Real-Time
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua notifikasi telah dibaca'}
                  </DialogDescription>
                </div>
              </div>

              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-2 text-zinc-500 hover:text-zinc-800"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  <span>Tandai Baca</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Web Push Permission Banner */}
          {permission !== 'granted' && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs flex items-center justify-between gap-2 mt-2">
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  Aktifkan Notifikasi Web Push
                </span>
                <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  Terima push notification saat ada pesanan &amp; tugas baru.
                </span>
              </div>
              <Button
                onClick={requestPermission}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl h-7 px-2.5 shrink-0 shadow-xs"
              >
                Aktifkan
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-2.5 mt-3">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-xs space-y-1">
                <Bell className="h-8 w-8 mx-auto opacity-40 mb-2" />
                <p className="font-semibold text-zinc-600 dark:text-zinc-400">Belum ada notifikasi baru</p>
                <p className="text-[11px]">Pemberitahuan transaksi dan tugas akan muncul di sini.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                    !notif.is_read
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 ring-1 ring-emerald-500/10'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-80 hover:opacity-100'
                  }`}
                >
                  {getNotificationIcon(notif.type)}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-400">
                        {new Date(notif.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>

                      {notif.data?.url && (
                        <Link
                          href={notif.data.url}
                          onClick={() => {
                            markAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Buka Menu</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
