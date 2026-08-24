'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  User,
  Lock,
  Loader2,
  Calendar,
  AlertTriangle,
  PackageCheck,
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
import {
  createCourierAction,
  updateCourierAction,
  deleteCourierAction,
  type CourierUser,
} from '@/lib/admin/courier-actions';

export function CourierManager({ initialCouriers }: { initialCouriers: CourierUser[] }) {
  const router = useRouter();
  const [couriers, setCouriers] = useState<CourierUser[]>(initialCouriers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierUser | null>(null);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Filter couriers
  const filteredCouriers = couriers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  // Handle Create Courier
  const handleCreateCourier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Nama lengkap kurir wajib diisi');
      return;
    }
    if (!email.trim()) {
      toast.error('Email kurir wajib diisi');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Kata sandi awal minimal 6 karakter');
      return;
    }

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);

    startTransition(async () => {
      const res = await createCourierAction(formData);
      if (!res.success) {
        toast.error(res.error || 'Gagal membuat akun kurir');
        return;
      }

      toast.success('Akun Kurir Berhasil Dibuat!', {
        description: `Kurir ${fullName} kini dapat login dengan email ${email}.`,
      });

      // Reset form and close
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setIsCreateOpen(false);

      // Optimistic update
      setCouriers([
        {
          id: `new-${Date.now()}`,
          full_name: fullName,
          email: email,
          phone: phone || null,
          role: 'kurir',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...couriers,
      ]);
      router.refresh();
    });
  };

  // Open Edit Modal
  const openEditModal = (courier: CourierUser) => {
    setSelectedCourier(courier);
    setFullName(courier.full_name);
    setPhone(courier.phone || '');
    setNewPassword('');
    setIsEditOpen(true);
  };

  // Handle Update Courier
  const handleUpdateCourier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourier) return;

    if (!fullName.trim()) {
      toast.error('Nama lengkap kurir wajib diisi');
      return;
    }

    const formData = new FormData();
    formData.append('id', selectedCourier.id);
    formData.append('full_name', fullName);
    formData.append('phone', phone);
    if (newPassword) {
      formData.append('new_password', newPassword);
    }

    startTransition(async () => {
      const res = await updateCourierAction(formData);
      if (!res.success) {
        toast.error(res.error || 'Gagal memperbarui akun kurir');
        return;
      }

      toast.success('Akun Kurir Berhasil Diperbarui!');
      setIsEditOpen(false);

      // Update local state
      setCouriers(
        couriers.map((c) =>
          c.id === selectedCourier.id
            ? { ...c, full_name: fullName, phone: phone || null, updated_at: new Date().toISOString() }
            : c
        )
      );
      setSelectedCourier(null);
      router.refresh();
    });
  };

  // Open Delete Modal
  const openDeleteModal = (courier: CourierUser) => {
    setSelectedCourier(courier);
    setIsDeleteOpen(true);
  };

  // Handle Delete Courier
  const handleDeleteCourier = () => {
    if (!selectedCourier) return;

    startTransition(async () => {
      const res = await deleteCourierAction(selectedCourier.id);
      if (!res.success) {
        toast.error(res.error || 'Gagal menghapus akun kurir');
        return;
      }

      toast.success('Akun Kurir Berhasil Dihapus!');
      setIsDeleteOpen(false);

      // Remove from local state
      setCouriers(couriers.filter((c) => c.id !== selectedCourier.id));
      setSelectedCourier(null);
      router.refresh();
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Bar: Title, Search, and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Manajemen Akun Kurir</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Tambah, ubah, dan kelola akun mitra kurir pengiriman benih Kentara
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setFullName('');
              setEmail('');
              setPhone('');
              setPassword('');
              setIsCreateOpen(true);
            }}
            className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Tambah Kurir Baru</span>
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nama kurir, email, atau nomor HP..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 min-h-[44px] shadow-xs"
        />
      </div>

      {/* Couriers List / Cards */}
      {filteredCouriers.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Truck className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white text-base">
              {searchQuery ? 'Tidak Ada Kurir yang Cocok' : 'Belum Ada Akun Kurir'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan akun kurir dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : 'Buat akun kurir pertama Anda agar tim logistik dapat masuk ke dashboard kurir.'}
            </p>
          </div>
          {!searchQuery && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold mt-2"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Tambah Akun Kurir</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCouriers.map((courier) => (
            <div
              key={courier.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-900 transition"
            >
              <div className="space-y-3.5">
                {/* Header Kurir */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      {courier.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base">
                        {courier.full_name}
                      </h4>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-[10px] px-2 py-0.5 mt-0.5">
                        <PackageCheck className="h-3 w-3 mr-1" />
                        Kurir Aktif
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Info Detail */}
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 p-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate">
                      {courier.email || 'Email terdaftar'}
                    </span>
                  </div>

                  {courier.phone && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="text-zinc-800 dark:text-zinc-200">
                        {courier.phone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-zinc-500 text-[11px] pt-0.5 border-t border-zinc-200/50 dark:border-zinc-800/80">
                    <Calendar className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span>Terdaftar: {formatDate(courier.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                <Button
                  variant="outline"
                  onClick={() => openEditModal(courier)}
                  className="flex-1 min-h-[40px] text-xs font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Edit2 className="mr-1.5 h-3.5 w-3.5 text-zinc-500" />
                  <span>Ubah Data</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => openDeleteModal(courier)}
                  className="min-h-[40px] text-xs font-semibold rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-950 px-3"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Hapus Kurir</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG: TAMBAH KURIR BARU */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-2xl">
          <DialogHeader className="text-left space-y-1">
            <div className="inline-flex p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 w-fit">
              <Truck className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
              Tambah Akun Kurir Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Buat akun kurir baru agar dapat login ke dashboard kurir dan mengantarkan pesanan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCourier} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nama Lengkap Kurir *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Rian Firmansyah"
                  required
                  disabled={isPending}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm outline-none focus:border-blue-600 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Alamat Email Kurir *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kurir@kentara.com"
                  required
                  disabled={isPending}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm outline-none focus:border-blue-600 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  disabled={isPending}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm outline-none focus:border-blue-600 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kata Sandi Awal (Minimal 6 Karakter) *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={isPending}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm outline-none focus:border-blue-600 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  <span>Simpan Akun Kurir</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: UBAH DATA KURIR */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-2xl">
          <DialogHeader className="text-left space-y-1">
            <div className="inline-flex p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 w-fit">
              <Edit2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
              Ubah Data Akun Kurir
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Perbarui nama, nomor telepon, atau reset kata sandi untuk {selectedCourier?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCourier} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nama Lengkap Kurir *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm outline-none focus:border-blue-600 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  disabled={isPending}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm outline-none focus:border-blue-600 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Ubah Kata Sandi Baru (Kosongkan jika tidak ingin diubah)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  disabled={isPending}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm outline-none focus:border-blue-600 min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isPending}
                className="flex-1 min-h-[44px] rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  <span>Perbarui Akun</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: KONFIRMASI HAPUS KURIR */}
      {/* ========================================================================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-2xl text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
              Hapus Akun Kurir?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Apakah Anda yakin ingin menghapus akun kurir{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {selectedCourier?.full_name}
              </strong>
              ? Tindakan ini akan menghapus akses login kurir tersebut secara permanen.
            </DialogDescription>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isPending}
              className="flex-1 min-h-[44px] rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDeleteCourier}
              disabled={isPending}
              className="flex-1 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghapus...</span>
                </div>
              ) : (
                <span>Ya, Hapus Kurir</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
