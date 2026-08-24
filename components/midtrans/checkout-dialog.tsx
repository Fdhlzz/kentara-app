'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMidtransSnap } from '@/hooks/use-midtrans-snap';
import type { MidtransItemDetail, SnapResult } from '@/types/midtrans';

export interface SeedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  weight: string;
  germinationRate: string;
}

const SAMPLE_PRODUCTS: SeedProduct[] = [
  {
    id: 'seed-padi-inpari32',
    name: 'Benih Padi Inpari 32 Bersertifikat (5 Kg)',
    category: 'Benih Pangan',
    price: 110000,
    description: 'Tahan wereng batang coklat & hawar daun bakteri, potensi hasil 10 ton/ha.',
    weight: '5 Kg',
    germinationRate: '88%',
  },
  {
    id: 'seed-jagung-bisi18',
    name: 'Benih Jagung Hibrida BISI 18 (1 Kg)',
    category: 'Benih Palawija',
    price: 95000,
    description: 'Tongkol besar & seragam, tahan kekeringan, rendemen tinggi.',
    weight: '1 Kg',
    germinationRate: '90%',
  },
  {
    id: 'seed-cabai-ori212',
    name: 'Benih Cabai Rawit Unggul Ori 212 (10 Gram)',
    category: 'Benih Sayuran',
    price: 85000,
    description: 'Percabangan banyak, buah lebat, tahan simpan dan transportasi jauh.',
    weight: '10 Gram',
    germinationRate: '85%',
  },
];

export function CheckoutDialog({
  product = SAMPLE_PRODUCTS[0],
  triggerLabel = 'Beli Benih Sekarang',
  className,
}: {
  product?: SeedProduct;
  triggerLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [lastPaymentResult, setLastPaymentResult] = useState<SnapResult | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'pending' | 'success' | 'failed'
  >('idle');

  const { checkout, isLoading } = useMidtransSnap();

  const subtotal = product.price * quantity;
  const shippingCost = 15000;
  const grandTotal = subtotal + shippingCost;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error('Mohon isi nama lengkap pembeli');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 9) {
      toast.error('Mohon isi nomor telepon / WhatsApp yang valid');
      return;
    }

    const items: MidtransItemDetail[] = [
      {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        category: product.category,
      },
      {
        id: 'shipping-fee',
        name: 'Ongkos Kirim Khusus Benih (Kedap Udara)',
        price: shippingCost,
        quantity: 1,
        category: 'Ekspedisi',
      },
    ];

    const orderId = `KTR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    await checkout(
      {
        orderId,
        grossAmount: grandTotal,
        items,
        customer: {
          first_name: customerName,
          phone: customerPhone,
          address: customerAddress || 'Alamat Lahan / Rumah',
          city: customerCity || 'Indonesia',
        },
      },
      {
        onSuccess: (result) => {
          setLastPaymentResult(result);
          setPaymentStatus('success');
          toast.success('Pembayaran Berhasil Dikonfirmasi!', {
            description: `Pesanan ${result.order_id} segera kami siapkan untuk pengiriman.`,
          });
        },
        onPending: (result) => {
          setLastPaymentResult(result);
          setPaymentStatus('pending');
          toast.info('Menunggu Pembayaran', {
            description: `Silakan selesaikan pembayaran untuk pesanan ${result.order_id}.`,
          });
        },
        onError: (result) => {
          setLastPaymentResult(result);
          setPaymentStatus('failed');
          toast.error('Pembayaran Gagal atau Dibatalkan', {
            description: 'Silakan coba lagi atau gunakan metode pembayaran lain.',
          });
        },
        onClose: () => {
          toast.info('Popup pembayaran ditutup');
        },
      }
    );
  };

  const resetForm = () => {
    setPaymentStatus('idle');
    setLastPaymentResult(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="lg"
            className={`min-h-[44px] touch-manipulation font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer ${className}`}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>{triggerLabel}</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-2xl">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
              {product.category}
            </Badge>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Daya Kecambah {product.germinationRate}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-zinc-900">
            Formulir Pembelian Benih
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-600">
            Lengkapi data pemesanan di bawah ini untuk melanjutkan pembayaran via Midtrans.
          </DialogDescription>
        </DialogHeader>

        {paymentStatus === 'idle' ? (
          <div className="space-y-5 pt-2">
            {/* Detail Produk */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-100/70 text-emerald-700 shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{product.description}</p>
                    <p className="text-xs text-emerald-700 font-medium mt-1">
                      Kemasan: {product.weight}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kontrol Jumlah */}
              <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
                <span className="text-xs text-zinc-600">Jumlah Kemasan:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isLoading}
                    className="h-8 w-8 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-bold hover:bg-zinc-100 disabled:opacity-40 transition"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm text-zinc-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isLoading}
                    className="h-8 w-8 rounded-lg border border-zinc-300 bg-white text-zinc-700 font-bold hover:bg-zinc-100 disabled:opacity-40 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Input Data Pembeli */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Informasi Penerima & Lahan
              </h5>

              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5 mb-1">
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    Nama Lengkap Pembeli / Kelompok Tani *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bpk. Budi Santoso"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5 mb-1">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    Nomor WhatsApp / HP Aktif *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      Kota / Kabupaten
                    </label>
                    <input
                      type="text"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      placeholder="Contoh: Subang / Karawang"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5 mb-1">
                      Alamat Lengkap Pengiriman
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Jl. Desa, RT/RW, Dusun"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rincian Biaya */}
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal Benih ({quantity}x)</span>
                <span className="font-semibold text-zinc-900">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Ongkir Khusus Benih Kedap Udara</span>
                <span className="font-semibold text-zinc-900">{formatRupiah(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-900 border-t border-emerald-200/80 pt-2 mt-1">
                <span>Total Pembayaran</span>
                <span className="text-emerald-700">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full min-h-[48px] touch-manipulation font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Menghubungkan ke Midtrans...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Bayar {formatRupiah(grandTotal)}</span>
                  </div>
                )}
              </Button>
              <p className="text-[11px] text-center text-zinc-500 mt-2">
                Didukung oleh Midtrans Payment Gateway (QRIS, GoPay, ShopeePay, Virtual Account BCA/BNI/BRI/Mandiri, Kartu Kredit).
              </p>
            </div>
          </div>
        ) : (
          /* Tampilan Status Setelah Transaksi */
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            {paymentStatus === 'success' && (
              <>
                <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    Pembayaran Berhasil!
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                    Terima kasih, pembayaran pesanan Anda telah diverifikasi oleh sistem Midtrans. Benih berkualitas tinggi segera kami kemas.
                  </p>
                </div>
              </>
            )}

            {paymentStatus === 'pending' && (
              <>
                <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    Menunggu Pembayaran
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                    Silakan ikuti instruksi pembayaran di aplikasi atau e-wallet Anda. Status akan otomatis diperbarui.
                  </p>
                </div>
              </>
            )}

            {paymentStatus === 'failed' && (
              <>
                <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    Pembayaran Belum Berhasil
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 max-w-sm">
                    Transaksi tidak dapat diselesaikan atau telah dibatalkan. Anda dapat mengulangi proses pembayaran.
                  </p>
                </div>
              </>
            )}

            {lastPaymentResult && (
              <div className="w-full rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order ID:</span>
                  <span className="font-mono font-semibold text-zinc-800">
                    {lastPaymentResult.order_id}
                  </span>
                </div>
                {lastPaymentResult.payment_type && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Metode Bayar:</span>
                    <span className="font-semibold uppercase text-zinc-800">
                      {lastPaymentResult.payment_type}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total:</span>
                  <span className="font-semibold text-emerald-700">
                    {formatRupiah(Number(lastPaymentResult.gross_amount) || grandTotal)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex w-full gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex-1 min-h-[44px] rounded-xl"
              >
                Pesan Lainnya
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
