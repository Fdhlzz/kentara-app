'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Eye,
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
import { useMidtransSnap } from '@/hooks/use-midtrans-snap';
import {
  createOrderAndGetSnapAction,
  markOrderPaymentSuccessAction,
} from '@/lib/admin/order-actions';
import type { Product } from '@/types/product';
import type { UserProfile } from '@/types/auth';
import type { CreateOrderItemInput } from '@/types/order';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface PetaniCatalogViewProps {
  products: Product[];
  currentUser: UserProfile;
  cartCount: number;
  onCartCountChange: (count: number) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  externalSearchQuery?: string;
}

export function PetaniCatalogView({
  products,
  currentUser,
  cartCount,
  onCartCountChange,
  isCartDrawerOpen,
  setIsCartDrawerOpen,
  externalSearchQuery = '',
}: PetaniCatalogViewProps) {
  // Search & Filter States
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedSeedClass, setSelectedSeedClass] = useState<string>('all');
  const [selectedSproutStatus, setSelectedSproutStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'stock_desc'>('relevance');

  // Cart & Modal States
  const [cart, setCart] = useState<CartItem[]>([]);
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
  const [notes, setNotes] = useState('');
  const [paymentMethodType, setPaymentMethodType] = useState<'gateway' | 'cash'>('gateway');

  const { openSnapPopup } = useMidtransSnap();

  // Combine external & internal search query
  const activeSearch = externalSearchQuery || internalSearchQuery;

  // Sync cart count with parent navbar
  useEffect(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    onCartCountChange(totalItems);
  }, [cart, onCartCountChange]);

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

  // Cart Helpers
  const addToCart = (product: Product, qtyToAdd?: number) => {
    if (product.stock <= 0) {
      toast.error('Stok produk ini sedang habis.');
      return;
    }

    const defaultQty = qtyToAdd || product.min_order || 1;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + defaultQty);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, defaultQty) }];
    });

    toast.success(`${product.name} ditambahkan ke keranjang`, {
      description: `Jumlah: ${defaultQty} ${product.unit}`,
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const minQty = item.product.min_order || 1;
          const newQty = item.quantity + delta;

          if (newQty < minQty && delta < 0) {
            // Remove if reduced below min_order
            return null;
          }
          if (newQty > item.product.stock) {
            toast.warning(`Maksimal stok tersedia: ${item.product.stock} ${item.product.unit}`);
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    toast.info('Item dihapus dari keranjang.');
  };

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTotalWeightKg = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + (item.product.weight_per_unit || 1) * item.quantity,
      0
    );
  }, [cart]);

  const estimatedShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    return Math.max(20000, Math.round(cartTotalWeightKg * 500));
  }, [cart.length, cartTotalWeightKg]);

  const grandTotal = cartSubtotal + estimatedShipping;

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
            setCart([]);
            setIsCheckoutOpen(false);
            setIsCartDrawerOpen(false);
            setIsSuccessOpen(true);
          },
          onPending: () => {
            setCart([]);
            setIsCheckoutOpen(false);
            setIsCartDrawerOpen(false);
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
        setCart([]);
        setIsCheckoutOpen(false);
        setIsCartDrawerOpen(false);
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
      {/* 1. REAL VARIETY & SEED CLASS HORIZONTAL FILTER BAR */}
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

      {/* 2. REAL PRODUCT CARDS GRID (2-COL MOBILE / 4-COL DESKTOP) */}
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

              return (
                <Card
                  key={product.id}
                  className="flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden group select-none hover:border-emerald-500/50 hover:shadow-md transition"
                >
                  {/* Square Aspect 1:1 Image with Safe Fallback */}
                  <Link
                    href={`/petani/products/${product.slug || product.id}`}
                    className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden block"
                  >
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      variety={product.variety}
                      seedClass={product.seed_class}
                    />

                    {/* Official Badges Overlay */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 items-start">
                      {product.cert_number ? (
                        <Badge className="bg-emerald-600 text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0 border-none shadow-xs">
                          ✓ BPSB RESMI
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0 border-none">
                          TERUJI
                        </Badge>
                      )}
                      <Badge className="bg-blue-600 text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0 border-none">
                        G{product.seed_class.replace('G', '')}
                      </Badge>
                    </div>

                    <div className="absolute top-1.5 right-1.5">
                      <Badge
                        className={`text-[7px] sm:text-[8px] font-black px-1.5 py-0 border-none shadow-xs ${
                          isReadyToPlant
                            ? 'bg-emerald-500 text-white'
                            : product.sprout_status === 'pecah_dormansi'
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-700 text-white'
                        }`}
                      >
                        {isReadyToPlant ? '🌱 Siap' : product.sprout_status === 'pecah_dormansi' ? '✨ Pecah' : '💤 Dorm'}
                      </Badge>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                    <div className="space-y-0.5">
                      {/* Origin */}
                      <div className="flex items-center gap-0.5 text-[9px] text-zinc-400 font-semibold truncate">
                        <MapPin className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                        <span className="truncate">{product.origin_location}</span>
                      </div>

                      {/* Product Name */}
                      <Link
                        href={`/petani/products/${product.slug || product.id}`}
                        className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white line-clamp-2 leading-snug hover:text-emerald-600 transition block"
                      >
                        {product.name}
                      </Link>

                      {/* Real Price Display */}
                      <div className="pt-0.5 flex items-baseline gap-0.5">
                        <span className="text-xs sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-medium">
                          /{product.unit}
                        </span>
                      </div>

                      {/* Stock & Min Order */}
                      <div className="flex items-center justify-between text-[9px] text-zinc-400 pt-0.5">
                        <span>Min. {product.min_order} {product.unit}</span>
                        <span className={isOutOfStock ? 'text-rose-500 font-bold' : 'text-zinc-500 font-semibold'}>
                          {isOutOfStock ? 'Stok Habis' : `Stok: ${product.stock} ${product.unit}`}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-1">
                      <Link
                        href={`/petani/products/${product.slug || product.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold h-8 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span>Detail</span>
                      </Link>

                      <Button
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product, product.min_order || 1)}
                        size="sm"
                        className={`w-full rounded-xl text-[10px] font-black h-8 px-1 shadow-xs cursor-pointer ${
                          isOutOfStock
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>{isOutOfStock ? 'Habis' : '+ Beli'}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. FLOATING MOBILE-FIRST STICKY CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-2">
          <div
            onClick={() => setIsCartDrawerOpen(true)}
            className="p-3 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white shadow-2xl border border-zinc-700 flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-xs shrink-0">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block truncate">
                  {cart.length} Varietas Benih ({cartTotalWeightKg} kg)
                </span>
                <span className="text-[10px] text-emerald-400 font-extrabold block truncate">
                  Subtotal: Rp {cartSubtotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsCartDrawerOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl h-8 px-3 gap-1 shrink-0 shadow-xs cursor-pointer"
            >
              <span>Keranjang</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 4. REDESIGNED SHOPPING CART DRAWER */}
      <Dialog open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen}>
        <DialogContent className="max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
                <span>Keranjang Belanja Benih</span>
              </DialogTitle>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    toast.info('Keranjang telah dikosongkan.');
                  }}
                  className="text-[10px] text-rose-500 hover:underline font-bold"
                >
                  Kosongkan
                </button>
              )}
            </div>
            <DialogDescription className="text-xs text-zinc-500">
              Periksa daftar varietas dan sesuaikan kuantitas sebelum melakukan pemesanan.
            </DialogDescription>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <ShoppingBag className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Keranjang belanja Anda masih kosong</p>
              <Button
                onClick={() => setIsCartDrawerOpen(false)}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
              >
                Pilih Benih Sekarang
              </Button>
            </div>
          ) : (
            <div className="space-y-3 my-1">
              {/* Item List */}
              <div className="space-y-2 divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[40vh] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                      <ProductImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        variety={item.product.variety}
                        seedClass={item.product.seed_class}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-black text-zinc-900 dark:text-white block truncate text-xs">
                        {item.product.name}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <span>Rp {item.product.price.toLocaleString('id-ID')} / {item.product.unit}</span>
                        <span>•</span>
                        <span>Kelas {item.product.seed_class}</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-extrabold block">
                        Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-0.5 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -5)}
                          className="p-1 text-zinc-500 hover:text-zinc-900"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-xs font-black px-1 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, 5)}
                          className="p-1 text-zinc-500 hover:text-zinc-900"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Real Summary Breakdown */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Total Muatan Benih:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {cartTotalWeightKg} kg
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Subtotal Benih:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Rp {cartSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Estimasi Ongkos Kirim:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Rp {estimatedShipping.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                  <span>Total Pembayaran:</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <Button
                type="button"
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black h-11 shadow-md gap-1.5 cursor-pointer"
              >
                <span>Lanjut ke Pengiriman &amp; Pembayaran</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 5. CHECKOUT & PAYMENT DIALOG */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
              Konfirmasi Pengiriman &amp; Pembayaran
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Lengkapi data pemesan agar kurir logistik Kentara dapat mengantar langsung ke lahan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProceedCheckout} className="space-y-3 my-2 text-xs">
            {/* Contact */}
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Nama Pemesan / Kelompok Tani *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Bpk. Herman"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    No. WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Kota / Kab *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="Bandung Barat"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Alamat Lengkap Lahan / Pengantaran *
                </label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nama jalan, patokan lahan, RT/RW, Desa..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                  Catatan untuk Kurir (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titipkan di pos petani..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-[10px] font-bold uppercase text-zinc-400">
                Pilih Metode Pembayaran *
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setPaymentMethodType('gateway')}
                  className={`p-2.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    paymentMethodType === 'gateway'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span className="font-black text-xs text-zinc-900 dark:text-white">
                      Online Gateway
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-0.5">QRIS, VA Bank, Kartu</span>
                </div>

                <div
                  onClick={() => setPaymentMethodType('cash')}
                  className={`p-2.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    paymentMethodType === 'cash'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-amber-600" />
                    <span className="font-black text-xs text-zinc-900 dark:text-white">
                      Bayar Tunai (COD)
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-0.5">Bayar ke kurir di lokasi</span>
                </div>
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-0.5">
              <div className="flex justify-between text-zinc-500 text-[10px]">
                <span>Subtotal ({cart.length} varietas):</span>
                <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-[10px]">
                <span>Ongkos Kirim ({cartTotalWeightKg} kg):</span>
                <span>Rp {estimatedShipping.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-emerald-700 dark:text-emerald-400 pt-0.5 border-t border-zinc-200 dark:border-zinc-700">
                <span>Total yang Harus Dibayar:</span>
                <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black h-12 shadow-lg gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Pesanan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {paymentMethodType === 'gateway'
                      ? 'Bayar Sekarang via Gateway ➔'
                      : 'Pesan Sekarang (Bayar COD) ➔'}
                  </span>
                </>
              )}
            </Button>
          </form>
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
