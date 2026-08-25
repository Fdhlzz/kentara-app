'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  Sprout,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Package,
  Trash2,
  Phone,
  User,
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useMidtransSnap } from '@/hooks/use-midtrans-snap';
import {
  createOrderAndGetSnapAction,
  markOrderPaymentSuccessAction,
} from '@/lib/admin/order-actions';
import type { Product } from '@/types/product';
import type { CreateOrderItemInput } from '@/types/order';

// Lazy load LocationPicker to reduce initial page bundle
const DynamicLocationPicker = dynamic(
  () => import('@/components/maps/location-picker').then((mod) => mod.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-zinc-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
        <span>Memuat Pemilih Peta Lokasi...</span>
      </div>
    ),
  }
);

interface PotatoSeedCatalogProps {
  products: Product[];
  currentUser?: {
    full_name?: string;
    phone?: string;
    email?: string;
  } | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function PotatoSeedCatalog({ products, currentUser }: PotatoSeedCatalogProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [completedOrderCode, setCompletedOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [customerName, setCustomerName] = useState(currentUser?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<'gateway' | 'cash'>('gateway');

  const { openSnapPopup } = useMidtransSnap();

  // Helper to add item to cart
  const addToCart = useCallback((product: Product, qtyToAdd = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { product, quantity: Math.max(product.min_order || 1, qtyToAdd) }];
    });

    toast.success(`${product.name} dimasukkan ke keranjang`, {
      description: `Klik keranjang di bawah untuk checkout.`,
    });
  }, []);

  // Helper to buy single product immediately
  const buyNow = useCallback((product: Product) => {
    setCart([{ product, quantity: product.min_order || 1 }]);
    setIsCheckoutOpen(true);
  }, []);

  // Update quantity in cart
  const updateQuantity = useCallback((productId: string, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      );
    });
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // Memoized Calculations
  const totalItemsCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );
  const shippingCost = useMemo(() => (cart.length > 0 ? 25000 : 0), [cart.length]);
  const grandTotal = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

  // Handle Checkout
  const handleProceedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Keranjang pesanan masih kosong');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Mohon isi nama lengkap penerima');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 8) {
      toast.error('Mohon isi nomor WhatsApp yang valid');
      return;
    }
    if (!shippingAddress.trim()) {
      toast.error('Mohon isi alamat pengiriman lengkap');
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload: CreateOrderItemInput[] = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_variety: item.product.variety,
        seed_class: item.product.seed_class,
        price: item.product.price,
        quantity: item.quantity,
        unit: item.product.unit,
        weight_kg: Number(item.product.weight_per_unit || 1.0) * item.quantity,
      }));

      const res = await createOrderAndGetSnapAction({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        shipping_address: shippingAddress,
        shipping_city: shippingCity || undefined,
        customer_latitude: customerCoords?.lat,
        customer_longitude: customerCoords?.lng,
        notes: notes || undefined,
        shipping_cost: shippingCost,
        payment_method_type: paymentMethodType,
        payment_method_detail: paymentMethodType === 'cash' ? 'cash_on_delivery' : 'midtrans',
        items: itemsPayload,
      });

      if (!res.success || !res.order) {
        toast.error(res.error || 'Gagal memproses pesanan');
        setIsSubmitting(false);
        return;
      }

      const orderCode = res.order.order_code;
      setCompletedOrderCode(orderCode);

      // CASH ON DELIVERY (COD)
      if (paymentMethodType === 'cash') {
        setIsCheckoutOpen(false);
        setCart([]);
        setIsSuccessOpen(true);
        toast.success('Pesanan Tunai (COD) Berhasil Dibuat!', {
          description: `Pesanan telah masuk ke sistem dan akan dikirim oleh kurir.`,
        });
      }
      // PAYMENT GATEWAY (MIDTRANS)
      else if (res.snapToken) {
        openSnapPopup(res.snapToken, {
          onSuccess: async (result) => {
            await markOrderPaymentSuccessAction(orderCode, {
              payment_method: result?.payment_type || 'midtrans',
              transaction_id: result?.transaction_id,
            });
            setIsCheckoutOpen(false);
            setCart([]);
            setIsSuccessOpen(true);
            toast.success('Pembayaran Berhasil Dikonfirmasi!', {
              description: `Stok produk telah terpotong otomatis dan pesanan masuk ke dashboard admin.`,
            });
          },
          onPending: () => {
            setIsCheckoutOpen(false);
            setCart([]);
            setIsSuccessOpen(true);
            toast.info('Pesanan Dibuat (Menunggu Pembayaran)', {
              description: 'Silakan selesaikan pembayaran sesuai petunjuk.',
            });
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
        setCart([]);
        setIsSuccessOpen(true);
      }
    } catch (err: unknown) {
      console.error('[Checkout Error]:', err);
      toast.error('Terjadi gangguan saat memproses checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClassBadge = (seedClass: string) => {
    switch (seedClass) {
      case 'G0':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
      case 'G1':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
      case 'G2':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'G3':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const inCartItem = cart.find((item) => item.product.id === product.id);

          return (
            <div
              key={product.id}
              className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-400 transition dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                {/* Image & Header Tags */}
                <div className="relative h-52 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                      <Sprout className="h-10 w-10 text-emerald-600/60" />
                      <span className="text-xs font-semibold mt-1">Benih Kentang Unggul</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`text-xs font-extrabold px-2 py-0.5 border ${getClassBadge(product.seed_class)}`}>
                        Kelas {product.seed_class}
                      </Badge>
                      <Badge className="bg-white/90 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-100 text-[10px] font-bold backdrop-blur-xs">
                        {product.variety}
                      </Badge>
                    </div>

                    {product.is_featured && (
                      <Badge className="bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Pilihan Utama
                      </Badge>
                    )}
                  </div>

                  {/* Bottom Location & Sprout Status */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 font-medium drop-shadow-sm truncate max-w-[200px]">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      {product.origin_location.split(',')[0]}
                    </span>
                    <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-300">
                      Stok: {product.stock.toLocaleString('id-ID')} {product.unit}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    {product.cert_number && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-1 flex items-center gap-1 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>{product.cert_number}</span>
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {product.description || 'Benih kentang unggulan dengan standar mutu tinggi dan sertifikasi resmi penangkaran.'}
                  </p>

                  {/* Spec Row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Ukuran Umbi:</span>
                      <span className="font-semibold">{product.size_category}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Umur Panen:</span>
                      <span className="font-semibold">{product.harvest_days || '-'}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Harga / {product.unit}</span>
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Min. {product.min_order} {product.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 pt-0 flex items-center gap-2">
                {inCartItem ? (
                  <div className="flex-1 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, inCartItem.quantity - 1)}
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-emerald-700 hover:bg-emerald-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                      {inCartItem.quantity} {product.unit} di Keranjang
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, inCartItem.quantity + 1)}
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-emerald-700 hover:bg-emerald-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    onClick={() => addToCart(product, product.min_order || 1)}
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-semibold border-emerald-600/30 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50 min-h-[40px]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                    + Keranjang
                  </Button>
                )}

                <Button
                  onClick={() => buyNow(product)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 min-h-[40px] shadow-xs"
                >
                  Beli Langsung
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 max-w-4xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-5">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/95 dark:bg-zinc-900/95 text-white shadow-2xl backdrop-blur-md border border-zinc-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {cart.length}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-300 block">
                  {cart.length} Varietas Benih ({totalItemsCount} Satuan)
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Button
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-extrabold rounded-xl px-5 text-xs sm:text-sm h-10 gap-1.5 shadow-md"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* CHECKOUT DIALOG (GATEWAY & CASH) - REDESIGNED FOR MOBILE & DESKTOP */}
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
                    Checkout Pembelian Benih Kentang
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-zinc-500 line-clamp-1">
                    Lengkapi alamat lahan &amp; pilih metode pembayaran (Online / COD)
                  </DialogDescription>
                </div>
              </div>
              <Badge className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 border-0">
                🔒 Transaksi Aman
              </Badge>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <form id="public-checkout-form" onSubmit={handleProceedCheckout} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* 1. Item List in Cart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  1. Daftar Benih Pilihan ({cart.length} Varietas)
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Total: {totalItemsCount} Unit
                </span>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden bg-zinc-50/60 dark:bg-zinc-900/40">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                          {product.name}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                          {product.seed_class}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                        Rp {product.price.toLocaleString('id-ID')} /{product.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition"
                          aria-label="Kurangi jumlah"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 sm:px-2.5 text-xs font-black text-zinc-900 dark:text-zinc-100">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition"
                          aria-label="Tambah jumlah"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 min-w-[72px] sm:min-w-[84px] text-right">
                        Rp {(product.price * quantity).toLocaleString('id-ID')}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Hapus benih"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Customer & Delivery Form */}
            <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] sm:text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                2. Data Pemesan &amp; Titik Lahan Pengantaran
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nama Penerima / Kelompok Tani <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Petani / Penerima"
                    className="w-full h-10 sm:h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
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
                    placeholder="Contoh: Posko tani depan gapura..."
                    className="w-full h-10 sm:h-11 px-3.5 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Alamat Lengkap Lahan / Gudang <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nama jalan, nomor, RT/RW, Dusun, Desa, Kecamatan..."
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
                3. Pilih Metode Pembayaran
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
                      name="payment_choice"
                      value="gateway"
                      checked={paymentMethodType === 'gateway'}
                      onChange={() => setPaymentMethodType('gateway')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
                        <span className="font-extrabold text-xs sm:text-sm text-zinc-900 dark:text-white">
                          Gerbang Online (Midtrans)
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
                      name="payment_choice"
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
                        Bayar langsung ke kurir Kentara saat armada tiba di lahan Anda.
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
                  Subtotal: Rp {subtotal.toLocaleString('id-ID')} + Ongkir: Rp {shippingCost.toLocaleString('id-ID')}
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
                form="public-checkout-form"
                disabled={isSubmitting || cart.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black h-11 px-5 gap-2 shadow-lg active:scale-[0.99] transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses Pesanan...</span>
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

      {/* PAYMENT SUCCESS CELEBRATION MODAL */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-zinc-900 dark:text-white">
            Pesanan Berhasil Diterima!
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 mt-1">
            Kode Transaksi: <strong className="font-mono text-zinc-900 dark:text-white">{completedOrderCode}</strong>
          </DialogDescription>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-xs text-left space-y-2 my-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <Check className="h-4 w-4 shrink-0" />
              <span>
                {paymentMethodType === 'cash'
                  ? 'Metode: Bayar Tunai saat Terima (COD ke Kurir)'
                  : 'Metode: Gateway Online Midtrans'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold">
              <Check className="h-4 w-4 shrink-0" />
              <span>Pesanan masuk ke dashboard Admin untuk penugasan kurir pengantar</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
            >
              Selesai &amp; Kembali ke Katalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
