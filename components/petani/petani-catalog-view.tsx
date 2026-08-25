'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Sprout,
  ShieldCheck,
  MapPin,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  CreditCard,
  Banknote,
  CheckCircle2,
  Loader2,
  Layers,
  Award,
  Leaf,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// Lazy load LocationPicker to keep main bundle lean
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

interface PetaniCatalogViewProps {
  products: Product[];
  currentUser: UserProfile;
  externalSearchQuery?: string;
}

export function PetaniCatalogView({
  products,
  currentUser,
  externalSearchQuery = '',
}: PetaniCatalogViewProps) {
  // Use global Cart Hook backed by Supabase database & guest localStorage
  const {
    items: cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    getItemQty,
    subtotal: cartSubtotal,
    totalWeightKg: cartTotalWeightKg,
    estimatedShipping,
    grandTotal,
  } = useCart();

  // Search & Filter States
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedSeedClass, setSelectedSeedClass] = useState<string>('all');
  const [selectedSproutStatus, setSelectedSproutStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'stock_desc'>('relevance');

  // Checkout Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [completedOrderCode, setCompletedOrderCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout Form States
  const [customerName, setCustomerName] = useState(currentUser.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<'gateway' | 'cash'>('gateway');

  const { openSnapPopup } = useMidtransSnap();

  // Combine external & internal search query
  const activeSearch = externalSearchQuery || internalSearchQuery;

  // Extract unique real varieties & classes from products
  const varieties = useMemo(() => {
    const set = new Set(products.map((p) => p.variety).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  const seedClasses = useMemo(() => {
    const set = new Set(products.map((p) => p.seed_class).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered and Sorted Real Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!p.is_active) return false;

        // Search query
        if (activeSearch.trim()) {
          const q = activeSearch.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchVariety = p.variety?.toLowerCase().includes(q);
          const matchOrigin = p.origin_location?.toLowerCase().includes(q);
          const matchClass = p.seed_class?.toLowerCase().includes(q);
          if (!matchName && !matchVariety && !matchOrigin && !matchClass) {
            return false;
          }
        }

        // Variety filter
        if (selectedVariety !== 'all' && p.variety !== selectedVariety) {
          return false;
        }

        // Seed Class filter
        if (selectedSeedClass !== 'all' && p.seed_class !== selectedSeedClass) {
          return false;
        }

        // Sprout readiness filter
        if (selectedSproutStatus !== 'all' && p.sprout_status !== selectedSproutStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    products,
    activeSearch,
    selectedVariety,
    selectedSeedClass,
    selectedSproutStatus,
    sortBy,
  ]);

  // Handle Checkout Order Submission
  const handleProceedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Keranjang belanja kosong.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      toast.error('Mohon lengkapi nama, nomor WhatsApp, dan alamat pengiriman.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: CreateOrderItemInput[] = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_variety: item.product.variety || undefined,
        seed_class: item.product.seed_class || undefined,
        quantity: item.quantity,
        price: item.product.price,
        unit: item.product.unit,
        weight_kg: (item.product.weight_per_unit || 1) * item.quantity,
      }));

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

      // ONLINE MIDTRANS PAYMENT
      if (paymentMethodType === 'gateway') {
        if (!res.snapToken) {
          toast.error('Gagal memuat sistem pembayaran online');
          setIsSubmitting(false);
          return;
        }

        openSnapPopup(res.snapToken, {
          onSuccess: async () => {
            await markOrderPaymentSuccessAction(createdOrder.id);
            await clearCart();
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
            setIsSuccessOpen(true);
          },
          onPending: () => {
            clearCart();
            setIsCheckoutOpen(false);
            setIsCartOpen(false);
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
        // CASH ON DELIVERY (COD)
        await clearCart();
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        setIsSuccessOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* 1. VARIETY & SEED CLASS HORIZONTAL FILTER BAR */}
      <section className="bg-white dark:bg-zinc-900 p-2.5 sm:p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
        {/* Real Varieties Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-0.5">
          {varieties.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedVariety(v)}
              className={`px-3 py-1 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition cursor-pointer border ${
                selectedVariety === v
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {v === 'all' ? '🌾 Semua Varietas' : v}
            </button>
          ))}
        </div>

        {/* Real Filter Selectors: Class, Readiness & Sort */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {/* Seed Class Selector */}
            <select
              value={selectedSeedClass}
              onChange={(e) => setSelectedSeedClass(e.target.value)}
              className="px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">Semua Kelas</option>
              {seedClasses.filter((c) => c !== 'all').map((c) => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>

            {/* Sprout Status Selector */}
            <select
              value={selectedSproutStatus}
              onChange={(e) => setSelectedSproutStatus(e.target.value)}
              className="px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">Semua Tunas</option>
              <option value="siap_tanam">🌱 Siap Tanam</option>
              <option value="pecah_dormansi">✨ Pecah Dormansi</option>
              <option value="dormansi">💤 Dormansi</option>
            </select>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 shrink-0"
          >
            <option value="relevance">Urutkan: Sesuai</option>
            <option value="price_asc">Harga: Terendah</option>
            <option value="price_desc">Harga: Tertinggi</option>
            <option value="stock_desc">Stok Terbanyak</option>
          </select>
        </div>
      </section>

      {/* 2. FULL-BLEED IMAGE PRODUCT CARDS GRID (MOBILE-FIRST) */}
      <section className="space-y-3">
        {filteredProducts.length === 0 ? (
          <Card className="p-8 text-center rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Tidak ada benih yang sesuai
            </h3>
            <Button
              onClick={() => {
                setInternalSearchQuery('');
                setSelectedVariety('all');
                setSelectedSeedClass('all');
                setSelectedSproutStatus('all');
              }}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold"
            >
              Reset Filter
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isReadyToPlant = product.sprout_status === 'siap_tanam';
              const inCartQty = getItemQty(product.id);

              return (
                <div
                  key={product.id}
                  className="flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:shadow-lg hover:border-emerald-500/50 transition-all duration-200 overflow-hidden group select-none"
                >
                  {/* FULL-BLEED TOP IMAGE CONTAINER */}
                  <Link
                    href={`/petani/products/${product.slug || product.id}`}
                    className="relative aspect-[4/3] sm:aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden block"
                  >
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      variety={product.variety}
                      seedClass={product.seed_class}
                    />

                    {/* Official Badges Overlay */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
                      {product.cert_number ? (
                        <Badge className="bg-emerald-600/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 border-none shadow-sm">
                          ✓ BPSB RESMI
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-900/80 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 border-none">
                          TERUJI
                        </Badge>
                      )}
                      <Badge className="bg-blue-600/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 border-none shadow-sm">
                        Kelas G{product.seed_class.replace('G', '')}
                      </Badge>
                    </div>

                    <div className="absolute top-2 right-2 pointer-events-none">
                      <Badge
                        className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 border-none shadow-sm ${
                          isReadyToPlant
                            ? 'bg-emerald-500/90 text-white'
                            : product.sprout_status === 'pecah_dormansi'
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-zinc-800/90 text-white'
                        }`}
                      >
                        {isReadyToPlant ? '🌱 Siap Tanam' : product.sprout_status === 'pecah_dormansi' ? '✨ Pecah' : '💤 Dormansi'}
                      </Badge>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <Link
                      href={`/petani/products/${product.slug || product.id}`}
                      className="space-y-1 block group-hover:text-emerald-600 transition"
                    >
                      {/* Origin */}
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold truncate">
                        <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                        <span className="truncate">{product.origin_location}</span>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                        {product.name}
                      </h3>

                      {/* Real Price Display */}
                      <div className="pt-0.5 flex items-baseline gap-1">
                        <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          /{product.unit}
                        </span>
                      </div>

                      {/* Real Stock & Min Order Info */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                        <span>Min. {product.min_order} {product.unit}</span>
                        <span className={isOutOfStock ? 'text-rose-500 font-bold' : 'text-zinc-500 font-semibold'}>
                          {isOutOfStock ? 'Stok Habis' : `Tersedia ${product.stock} ${product.unit}`}
                        </span>
                      </div>
                    </Link>

                    {/* ROCK-SOLID FULL-WIDTH BELI BUTTON (CONNECTED TO CART HOOK) */}
                    <div className="pt-1">
                      <Button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await addToCart(product, product.min_order || 1);
                        }}
                        className={`w-full rounded-xl sm:rounded-2xl text-xs font-black h-10 sm:h-11 shadow-sm cursor-pointer transition active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                          isOutOfStock
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            : inCartQty > 0
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white ring-2 ring-emerald-600/30'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isOutOfStock ? (
                          <span>Stok Habis</span>
                        ) : inCartQty > 0 ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>{inCartQty} {product.unit} di Keranjang (+ Tambah)</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4" />
                            <span>+ Beli ({product.min_order || 1} {product.unit})</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. FLOATING MOBILE-FIRST STICKY CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-2">
          <div
            onClick={() => setIsCartOpen(true)}
            className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md text-white shadow-2xl border border-zinc-700 flex items-center justify-between gap-3 cursor-pointer active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">
                  {cart.length} Varietas Benih ({cartTotalWeightKg} kg)
                </span>
                <span className="text-xs text-emerald-400 font-black block truncate">
                  Subtotal: Rp {cartSubtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsCartOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl h-9 px-3.5 gap-1 shrink-0 shadow-md cursor-pointer"
            >
              <span>Keranjang</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 4. REDESIGNED ULTRA MOBILE-FRIENDLY SHOPPING CART BOTTOM SHEET */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-lg w-full rounded-t-3xl sm:rounded-3xl p-0 max-h-[92vh] flex flex-col overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          {/* Top Drag Handle for Mobile */}
          <div className="pt-2.5 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto" />
          </div>

          {/* Cart Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white leading-none">
                  Keranjang Belanja Benih
                </h3>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                  {cart.length} Varietas Benih ({cartTotalWeightKg} kg)
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3 my-auto">
              <div className="h-16 w-16 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Keranjang Belanja Anda Masih Kosong
                </h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Pilih benih kentang unggul bersertifikat dari katalog kami untuk memulai pemesanan.
                </p>
              </div>
              <Button
                onClick={() => setIsCartOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black h-10 px-5 shadow-sm"
              >
                Pilih Benih Sekarang
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-start gap-3 shadow-2xs"
                >
                  {/* Large Product Thumbnail */}
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                    <ProductImage
                      src={item.product.image_url}
                      alt={item.product.name}
                      variety={item.product.variety}
                      seedClass={item.product.seed_class}
                    />
                  </div>

                  {/* Product Details & Subtotal */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div>
                      <div className="flex items-center gap-1">
                        <Badge className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0 border-none">
                          Kelas {item.product.seed_class}
                        </Badge>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {item.product.origin_location}
                        </span>
                      </div>
                      <h4 className="font-black text-zinc-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-tight mt-0.5">
                        {item.product.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 block">
                        Rp {item.product.price.toLocaleString('id-ID')} / {item.product.unit} (Min. {item.product.min_order} {item.product.unit})
                      </span>
                    </div>

                    {/* Stepper Controls & Subtotal Row */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                      {/* Big Ergonomic Stepper */}
                      <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, -5)}
                          className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:scale-90 transition cursor-pointer"
                          aria-label="Kurangi Jumlah"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-black px-2 min-w-[28px] text-center text-zinc-900 dark:text-white">
                          {item.quantity} {item.product.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, 5)}
                          className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:scale-90 transition cursor-pointer"
                          aria-label="Tambah Jumlah"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Subtotal & Trash */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400">
                          Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                          title="Hapus Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sticky Bottom Summary & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md shrink-0 space-y-3">
              {/* Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Total Muatan Logistik:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {cartTotalWeightKg} kg
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Subtotal Benih ({cart.length} varietas):</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Rp {cartSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Estimasi Ongkos Kirim Armada Khusus:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Rp {estimatedShipping.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-black text-sm text-emerald-700 dark:text-emerald-400">
                  <span>Total Tagihan:</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Glowing High-Touch Checkout Button */}
              <Button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black h-13 shadow-xl gap-2 cursor-pointer active:scale-[0.99] transition"
              >
                <span>Lanjut ke Pengiriman &amp; Pembayaran</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                    Konfirmasi Pengiriman &amp; Pembayaran Benih
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-zinc-500 line-clamp-1">
                    Lengkapi alamat lahan di Sulawesi &amp; pilih metode pembayaran
                  </DialogDescription>
                </div>
              </div>
              <Badge className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-1 border-0">
                🌱 Benih Bersertifikat
              </Badge>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <form id="petani-checkout-form" onSubmit={handleProceedCheckout} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* 1. Item List in Cart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  1. Benih yang Dipesan ({cart.length} Varietas)
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Total Berat: {cartTotalWeightKg} kg
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
                        Rp {product.price.toLocaleString('id-ID')} /{product.unit} &bull; {quantity} {product.unit}
                      </span>
                    </div>

                    <span className="font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 shrink-0">
                      Rp {(product.price * quantity).toLocaleString('id-ID')}
                    </span>
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
                    Nama Pemesan / Kelompok Tani <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bpk. Herman (Kelompok Tani Harapan)"
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
                    placeholder="Contoh: Posko tani depan gapura..."
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
                      name="petani_payment_choice"
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
                      name="petani_payment_choice"
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
                        Bayar tunai langsung ke kurir saat benih tiba di lokasi lahan.
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
                  Subtotal ({cart.length} item): Rp {cartSubtotal.toLocaleString('id-ID')} + Ongkir: Rp {estimatedShipping.toLocaleString('id-ID')}
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
                form="petani-checkout-form"
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
              Kode Pesanan Anda:{' '}
              <strong className="text-zinc-900 dark:text-white font-mono text-sm block mt-0.5">
                {completedOrderCode}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Kurir Kentara akan segera memproses pengantaran benih langsung ke lahan Anda.
          </p>

          <Button
            type="button"
            onClick={() => setIsSuccessOpen(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black h-11"
          >
            Kembali ke Katalog
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
