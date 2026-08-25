'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sprout,
  ArrowLeft,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Award,
  Leaf,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  Banknote,
  Loader2,
  Calendar,
  Share2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ProductImage } from '@/components/petani/product-image';
import { useCart } from '@/lib/cart/cart-context';
import { useMidtransSnap } from '@/hooks/use-midtrans-snap';
import dynamic from 'next/dynamic';
import {
  createOrderAndGetSnapAction,
  markOrderPaymentSuccessAction,
} from '@/lib/admin/order-actions';
import type { Product } from '@/types/product';
import type { UserProfile } from '@/types/auth';
import type { CreateOrderItemInput } from '@/types/order';

// Lazy load LocationPicker
const DynamicLocationPicker = dynamic(
  () => import('@/components/maps/location-picker').then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-zinc-400">
        <span>Memuat Pemilih Peta Lokasi...</span>
      </div>
    ),
  }
);

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
  currentUser: UserProfile;
}

export function ProductDetailView({
  product,
  relatedProducts = [],
  currentUser,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart, getItemQty } = useCart();
  const [quantity, setQuantity] = useState(product.min_order || 1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [completedOrderCode, setCompletedOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [customerName, setCustomerName] = useState(currentUser.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<'gateway' | 'cash'>('gateway');

  const { openSnapPopup } = useMidtransSnap();

  const isOutOfStock = product.stock <= 0;
  const isReadyToPlant = product.sprout_status === 'siap_tanam';
  const inCartQty = getItemQty(product.id);
  const subtotal = product.price * quantity;
  const totalWeightKg = (product.weight_per_unit || 1) * quantity;
  const estimatedShipping = Math.max(20000, Math.round(totalWeightKg * 500));
  const grandTotal = subtotal + estimatedShipping;

  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < (product.min_order || 1)) {
        toast.warning(`Jumlah minimal pemesanan adalah ${product.min_order || 1} ${product.unit}`);
        return prev;
      }
      if (next > product.stock) {
        toast.warning(`Maksimal stok tersedia hanya ${product.stock} ${product.unit}`);
        return prev;
      }
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      toast.error('Stok produk ini sedang habis.');
      return;
    }
    await addToCart(product, quantity);
  };

  const handleProceedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      toast.error('Mohon lengkapi nama, nomor telepon, dan alamat pengiriman.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: CreateOrderItemInput[] = [
        {
          product_id: product.id,
          product_name: product.name,
          product_variety: product.variety || undefined,
          seed_class: product.seed_class || undefined,
          quantity,
          price: product.price,
          unit: product.unit,
          weight_kg: totalWeightKg,
        },
      ];

      const res = await createOrderAndGetSnapAction({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        shipping_address: shippingAddress,
        shipping_city: shippingCity || undefined,
        customer_latitude: customerCoords?.lat,
        customer_longitude: customerCoords?.lng,
        shipping_cost: estimatedShipping,
        payment_method_type: paymentMethodType,
        items: orderItems,
        notes: notes || undefined,
      });

      if (!res.success || !res.order) {
        toast.error(res.error || 'Gagal membuat pesanan');
        setIsSubmitting(false);
        return;
      }

      const createdOrder = res.order;
      setCompletedOrderCode(createdOrder.order_code);

      if (paymentMethodType === 'gateway') {
        if (!res.snapToken) {
          toast.error('Gagal memuat gateway pembayaran online');
          setIsSubmitting(false);
          return;
        }

        openSnapPopup(res.snapToken, {
          onSuccess: async () => {
            await markOrderPaymentSuccessAction(createdOrder.id);
            setIsCheckoutOpen(false);
            setIsSuccessOpen(true);
          },
          onPending: () => {
            setIsCheckoutOpen(false);
            setIsSuccessOpen(true);
          },
          onError: () => {
            toast.error('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            toast.info('Jendela pembayaran ditutup.');
          },
        });
      } else {
        setIsCheckoutOpen(false);
        setIsSuccessOpen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* 1. TOP BREADCRUMB & BACK BUTTON */}
      <div className="flex items-center justify-between">
        <Link
          href="/petani"
          className="inline-flex items-center gap-1.5 text-xs font-black text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Katalog Benih</span>
        </Link>
      </div>

      {/* 2. PRODUCT HERO & SPECIFICATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {/* Left Column: Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              variety={product.variety}
              seedClass={product.seed_class}
              priority
            />

            {/* Official Certification Badge */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
              {product.cert_number ? (
                <Badge className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 shadow-md">
                  ✓ BPSB RESMI
                </Badge>
              ) : (
                <Badge className="bg-zinc-800 text-white text-[10px] font-bold px-2 py-0.5">
                  TERUJI PENANGKAR
                </Badge>
              )}
              <Badge className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 shadow-md">
                Kelas G{product.seed_class.replace('G', '')}
              </Badge>
            </div>

            <div className="absolute top-3 right-3">
              <Badge
                className={`text-[10px] font-black px-2 py-0.5 shadow-md ${
                  isReadyToPlant
                    ? 'bg-emerald-500 text-white'
                    : product.sprout_status === 'pecah_dormansi'
                    ? 'bg-amber-500 text-white'
                    : 'bg-zinc-700 text-white'
                }`}
              >
                {isReadyToPlant ? '🌱 Siap Tanam' : product.sprout_status === 'pecah_dormansi' ? '✨ Pecah Tunas' : '💤 Masa Dormansi'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right Column: Details, Price & Actions */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>Lokasi Penangkar: {product.origin_location}</span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Real Price Display */}
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-zinc-500 font-bold">
                / {product.unit}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs pt-1 text-zinc-600 dark:text-zinc-400">
              <span>Minimal Pesan: <strong>{product.min_order} {product.unit}</strong></span>
              <span>•</span>
              <span className={isOutOfStock ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                {isOutOfStock ? 'Stok Habis' : `Tersedia: ${product.stock} ${product.unit}`}
              </span>
            </div>
          </div>

          {/* Certificate Notice if available */}
          {product.cert_number && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Sertifikasi Resmi Balai Pengawasan &amp; Sertifikasi Benih (BPSB)</span>
                <span className="text-[11px] font-mono">{product.cert_number}</span>
              </div>
            </div>
          )}

          {/* Agronomic Specs Grid */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs space-y-2.5">
            <h3 className="font-extrabold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">
              Karakteristik &amp; Spesifikasi Agronomis
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                <span className="text-zinc-400 text-[10px] block">Varietas Benih:</span>
                <strong className="text-zinc-900 dark:text-white">{product.variety}</strong>
              </div>

              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                <span className="text-zinc-400 text-[10px] block">Ukuran Knol:</span>
                <strong className="text-zinc-900 dark:text-white">{product.size_category}</strong>
              </div>

              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                <span className="text-zinc-400 text-[10px] block">Elevasi Lahan:</span>
                <strong className="text-zinc-900 dark:text-white">{product.elevation_masl || '1.000 - 1.800 mdpl'}</strong>
              </div>

              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                <span className="text-zinc-400 text-[10px] block">Umur Panen:</span>
                <strong className="text-zinc-900 dark:text-white">{product.harvest_days || '90 - 110 HST'}</strong>
              </div>

              <div className="col-span-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                <span className="text-zinc-400 text-[10px] block">Potensi Produksi:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{product.potential_yield || '25 - 35 Ton/Ha'}</strong>
              </div>

              {product.resilience && (
                <div className="col-span-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                  <span className="text-zinc-400 text-[10px] block">Ketahanan Penyakit:</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">{product.resilience}</span>
                </div>
              )}
            </div>

            {product.description && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 text-[10px] block mb-1">Deskripsi Tambahan:</span>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-[11px]">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Quantity & Purchase Box */}
          <div className="hidden sm:block p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Atur Jumlah Pesanan ({product.unit}):
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleQtyChange(-5)}
                  size="icon-sm"
                  variant="outline"
                  className="h-8 w-8 rounded-xl"
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="text-sm font-black w-10 text-center">
                  {quantity}
                </span>
                <Button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleQtyChange(5)}
                  size="icon-sm"
                  variant="outline"
                  className="h-8 w-8 rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500">Subtotal ({quantity} {product.unit}):</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                variant="outline"
                className="rounded-2xl text-xs font-bold h-11 cursor-pointer"
              >
                {inCartQty > 0 ? (
                  <span className="text-emerald-600 font-black">✓ {inCartQty} di Keranjang (+ Tambah)</span>
                ) : (
                  '+ Masukkan Keranjang'
                )}
              </Button>
              <Button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setIsCheckoutOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black h-11 shadow-md cursor-pointer"
              >
                Beli Sekarang (Checkout)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RELATED PRODUCTS RECOMMENDATION */}
      {relatedProducts.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-zinc-200/80 dark:border-zinc-800">
          <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
            Benih Serupa &amp; Varietas Lainnya
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {relatedProducts.slice(0, 4).map((rel) => (
              <Link
                key={rel.id}
                href={`/petani/products/${rel.slug || rel.id}`}
                className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 transition flex flex-col justify-between space-y-2 group"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <ProductImage
                    src={rel.image_url}
                    alt={rel.name}
                    variety={rel.variety}
                    seedClass={rel.seed_class}
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-zinc-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 transition">
                    {rel.name}
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">
                    Rp {rel.price.toLocaleString('id-ID')} / {rel.unit}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4. MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-2.5 shadow-2xl">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          <div>
            <span className="text-[10px] text-zinc-400 block leading-none">Subtotal ({quantity} {product.unit})</span>
            <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
              Rp {subtotal.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold h-10 px-3 cursor-pointer"
            >
              {inCartQty > 0 ? `✓ ${inCartQty} di Keranjang` : '+ Keranjang'}
            </Button>
            <Button
              type="button"
              disabled={isOutOfStock}
              onClick={() => setIsCheckoutOpen(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black h-10 px-4 shadow-md cursor-pointer"
            >
              Beli Sekarang
            </Button>
          </div>
        </div>
      </div>

      {/* 5. CHECKOUT & PAYMENT DIALOG - REDESIGNED FOR MOBILE & DESKTOP */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-2xl w-[96vw] sm:w-full max-h-[92dvh] sm:max-h-[85vh] p-0 flex flex-col overflow-hidden rounded-t-[28px] sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950">
          {/* Sticky Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-500/20">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-sm sm:text-base font-black text-zinc-900 dark:text-white leading-tight">
                    Konfirmasi Pesanan Benih
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-zinc-500 line-clamp-1">
                    {product.name} ({quantity} {product.unit}) &bull; Pengantaran Lahan Sulawesi
                  </DialogDescription>
                </div>
              </div>
              <Badge className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 border-0">
                Kelas {product.seed_class}
              </Badge>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <form id="product-detail-checkout-form" onSubmit={handleProceedCheckout} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* 1. Product Summary Card */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                    {product.name}
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    {product.variety}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                  Rp {product.price.toLocaleString('id-ID')} /{product.unit} &bull; Jumlah: {quantity} {product.unit} ({totalWeightKg} kg)
                </span>
              </div>

              <span className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 shrink-0">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* 2. Customer & Delivery Form */}
            <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] sm:text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Data Pemesan &amp; Titik Lahan Pengantaran
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Pemesan / Kelompok Tani <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bpk. Herman"
                    className="w-full h-10 sm:h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full h-10 sm:h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kota / Kabupaten di Sulawesi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="Contoh: Gowa, Makassar, Enrekang, Maros..."
                    className="w-full h-10 sm:h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Catatan Khusus untuk Kurir (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Titipkan di posko tani..."
                    className="w-full h-10 sm:h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Alamat Lengkap Lahan / Pengantaran <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nama jalan, patokan lahan, RT/RW, Dusun, Desa, Kecamatan..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              {/* Pinpoint Location Picker with Leaflet centered in Sulawesi */}
              <div className="pt-1">
                <DynamicLocationPicker
                  coords={customerCoords}
                  onCoordsChange={setCustomerCoords}
                  height="190px"
                />
              </div>
            </div>

            {/* 3. Payment Method Choice */}
            <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] sm:text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Pilih Metode Pembayaran
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Midtrans Gateway */}
                <div
                  onClick={() => setPaymentMethodType('gateway')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between select-none ${
                    paymentMethodType === 'gateway'
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="detail_payment_choice"
                      value="gateway"
                      checked={paymentMethodType === 'gateway'}
                      onChange={() => setPaymentMethodType('gateway')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
                        <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white">
                          Online Gateway (Midtrans)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                        QRIS, GoPay, ShopeePay, VA Bank (BCA, Mandiri, BRI, BNI).
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[9px] font-bold self-start mt-2 px-2 py-0.5">
                    ⚡ Otomatis &amp; Instan
                  </Badge>
                </div>

                {/* Option 2: Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethodType('cash')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between select-none ${
                    paymentMethodType === 'cash'
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="detail_payment_choice"
                      value="cash"
                      checked={paymentMethodType === 'cash'}
                      onChange={() => setPaymentMethodType('cash')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="h-4 w-4 text-amber-600" />
                        <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white">
                          Bayar Tunai di Lahan (COD)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                        Bayar langsung ke kurir saat armada Kentara tiba di lahan.
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-amber-600 text-white text-[9px] font-bold self-start mt-2 px-2 py-0.5">
                    💵 Bayar ke Kurir
                  </Badge>
                </div>
              </div>
            </div>
          </form>

          {/* Sticky Bottom Action Bar */}
          <div className="px-4 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md shrink-0 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex flex-col">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Subtotal: Rp {subtotal.toLocaleString('id-ID')} + Ongkir: Rp {estimatedShipping.toLocaleString('id-ID')}
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-400">
                  Total Tagihan: Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                  {paymentMethodType === 'cash' ? 'Metode: COD Tunai' : 'Metode: Midtrans Online'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-xl text-xs font-bold h-11 px-4 border-zinc-300 dark:border-zinc-700"
              >
                Batal
              </Button>
              <Button
                type="submit"
                form="product-detail-checkout-form"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black h-11 px-5 gap-2 shadow-lg active:scale-[0.99] transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : paymentMethodType === 'cash' ? (
                  <>
                    <Banknote className="h-4 w-4" />
                    <span>Konfirmasi Pesanan Tunai (COD)</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Bayar Sekarang (Midtrans)</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. ORDER SUCCESS MODAL */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center space-y-3 border-2 border-emerald-500/30">
          <DialogHeader className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white mt-1">
              Pesanan Berhasil Dibuat!
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Kode Pesanan:{' '}
              <strong className="text-zinc-900 dark:text-white font-mono text-sm block mt-0.5">
                {completedOrderCode}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Kurir Kentara akan segera mengantarkan benih langsung ke lahan Anda.
          </p>

          <Button
            type="button"
            onClick={() => router.push('/petani')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black h-11"
          >
            Kembali ke Katalog Benih
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
