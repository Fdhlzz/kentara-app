'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Home,
  CheckCircle2,
  Settings,
  Truck,
  MapPin,
  Phone,
  Navigation,
  Clock,
  Banknote,
  CreditCard,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { CourierTaskModal } from '@/components/courier/courier-task-modal';
import { CourierHistoryView } from '@/components/courier/courier-history-view';
import { CourierSettingsView } from '@/components/courier/courier-settings-view';
import type { Order } from '@/types/order';
import type { UserProfile } from '@/types/auth';

interface CourierAppShellProps {
  profile: UserProfile;
  orders: Order[];
}

export function CourierAppShell({ profile, orders = [] }: CourierAppShellProps) {
  const [activeTab, setActiveTab] = useState<'beranda' | 'riwayat' | 'pengaturan'>('beranda');
  const [selectedTaskOrder, setSelectedTaskOrder] = useState<Order | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Active / in-progress tasks
  const activeTasks = orders.filter(
    (o) => o.order_status === 'diproses' || o.order_status === 'dikirim'
  );
  const completedTasks = orders.filter((o) => o.order_status === 'selesai');

  const totalCashCollected = completedTasks
    .filter((o) => o.payment_gateway === 'cash')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const openTaskMap = (order: Order) => {
    setSelectedTaskOrder(order);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20">
      {/* 1. Mobile App Clean Header (No traditional navbar / profile banner) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo Kentara"
              width={32}
              height={32}
              className="rounded-xl shadow-xs"
              priority
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-400 leading-tight">
                  Kentara Kurir
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              </div>
              <span className="text-[10px] text-zinc-500 font-medium block">
                Halo, {profile.full_name?.split(' ')[0]} 👋
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationCenter role="kurir" userId={profile.id} />
          </div>
        </div>
      </header>

      {/* 2. Main Content Area per Tab */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* TAB 1: BERANDA / DASHBOARD */}
        {activeTab === 'beranda' && (
          <div className="space-y-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2.5">
              <Card className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs text-center">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  Tugas Aktif
                </span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {activeTasks.length}
                </span>
              </Card>

              <Card className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs text-center">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  Selesai
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {completedTasks.length}
                </span>
              </Card>

              <Card className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs text-center">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  Kas COD
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1 block truncate">
                  Rp {(totalCashCollected / 1000).toLocaleString('id-ID')}k
                </span>
              </Card>
            </div>

            {/* Active Tasks List / Spotlight */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span>Tugas Pengantaran Hari Ini</span>
                </h3>
                {activeTasks.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 text-[10px] font-bold">
                    {activeTasks.length} Aktif
                  </Badge>
                )}
              </div>

              {activeTasks.length === 0 ? (
                <Card className="p-8 text-center rounded-3xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Tidak ada tugas pengantaran aktif
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Semua pesanan telah diantar atau belum ada tugas baru dari administrator.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-blue-500/30 dark:border-blue-500/20 shadow-md space-y-3 hover:border-blue-500 transition"
                    >
                      {/* Top Code & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-sm text-zinc-900 dark:text-white">
                              {task.order_code}
                            </span>
                            <Badge
                              className={`text-[9px] font-bold ${
                                task.order_status === 'dikirim'
                                  ? 'bg-blue-600 text-white animate-pulse'
                                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {task.order_status === 'dikirim'
                                ? '🚚 Sedang Diantar'
                                : '📦 Siap Dimulai'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-7 w-7 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-black shrink-0 border border-blue-200 dark:border-blue-900">
                              {task.customer_name ? task.customer_name.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <span className="text-sm font-black text-zinc-900 dark:text-white leading-tight">
                              {task.customer_name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 block font-medium">
                            {task.payment_gateway === 'cash' ? 'Wajib Tagih Tunai' : 'Status Tagihan'}
                          </span>
                          {task.payment_gateway === 'cash' ? (
                            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                              Rp {task.total_amount.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              Lunas Online
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Address preview */}
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs space-y-1">
                        <p className="text-zinc-600 dark:text-zinc-300 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{task.shipping_address}{task.shipping_city ? `, ${task.shipping_city}` : ''}</span>
                        </p>
                      </div>

                      {/* Items Pill */}
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {task.items?.length || 0} varietas benih
                        </span>
                        <Badge
                          className={`text-[9px] ${
                            task.payment_gateway === 'cash'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {task.payment_gateway === 'cash' ? '💵 Bayar Tunai (COD)' : '💳 Lunas Online'}
                        </Badge>
                      </div>

                      {/* Action Button to Open Full-Screen Map */}
                      <Button
                        onClick={() => openTaskMap(task)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold h-11 shadow-md gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        <span>Buka Navigasi Peta &amp; Mulai Antar</span>
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RIWAYAT TUGAS SELESAI */}
        {activeTab === 'riwayat' && (
          <CourierHistoryView orders={orders} />
        )}

        {/* TAB 3: PENGATURAN & AKUN */}
        {activeTab === 'pengaturan' && (
          <CourierSettingsView profile={profile} />
        )}
      </main>

      {/* 3. Modern Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 py-1.5 px-6 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {/* Tab 1: Beranda */}
          <button
            type="button"
            onClick={() => setActiveTab('beranda')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition min-w-[64px] ${
              activeTab === 'beranda'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <div className="relative">
              <Home className="h-5 w-5" />
              {activeTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping" />
              )}
            </div>
            <span className="text-[10px] mt-0.5">Beranda</span>
          </button>

          {/* Tab 2: Riwayat */}
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition min-w-[64px] ${
              activeTab === 'riwayat'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Riwayat</span>
          </button>

          {/* Tab 3: Pengaturan */}
          <button
            type="button"
            onClick={() => setActiveTab('pengaturan')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition min-w-[64px] ${
              activeTab === 'pengaturan'
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Pengaturan</span>
          </button>
        </div>
      </nav>

      {/* 4. Full Screen Task Leaflet Map & Swipe Drawer */}
      <CourierTaskModal
        order={selectedTaskOrder}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTaskOrder(null);
        }}
        courierName={profile.full_name || 'Kurir Kentara'}
        courierPhone={profile.phone || ''}
      />
    </div>
  );
}
