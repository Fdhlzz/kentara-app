'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Search,
  Filter,
  Sprout,
  ShieldCheck,
  MapPin,
  Package,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  Award,
  Leaf,
  Info,
  Star,
  Flame,
  Truck,
  Percent,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useMidtransSnap } from '@/hooks/use-midtrans-snap';
import {
  createOrderAndGetSnapAction,
  markOrderPaymentSuccessAction,
} from '@/lib/admin/order-actions';
import type { Product } from '@/types/product';
import type { UserProfile } from '@/types/auth';
import type { CreateOrderItemInput } from '@/types/order';

interface CartItem {
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
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'stock_desc'>('relevance');

  // Active Promo Banner Slide index
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Cart & Modal States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [detailModalQty, setDetailModalQty] = useState(1);
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

  // Promotional Marketplace Banners (Compact Mobile-First)
  const promoBanners = [
    {
      id: 1,
      badge: 'PROMO MUSIM TANAM',
      title: 'Benih Granola L - G2 Pangalengan',
      subtitle: 'Daya tumbuh unggul >95%, bersertifikat resmi BPSB. Subsidi Ongkir!',
      bgGradient: 'from-emerald-800 via-emerald-700 to-teal-900',
      actionText: 'Lihat Granola',
      filterVariety: 'Granola L',
    },
    {
      id: 2,
      badge: 'SPESIAL INDUSTRI CHIPS',
      title: 'Benih Atlantic G1 Industri',
      subtitle: 'Kadar padatan tinggi, umbi bulat padat favorit industri olahan.',
      bgGradient: 'from-blue-900 via-indigo-800 to-teal-900',
      actionText: 'Lihat Atlantic',
      filterVariety: 'Atlantic',
    },
    {
      id: 3,
      badge: 'LOGISTIK LANGSUNG KE LAHAN',
      title: 'Pengantaran Khusus Kentara',
      subtitle: 'Armada logistik terpercaya menjamin benih tiba aman & segar di lahan.',
      bgGradient: 'from-amber-900 via-amber-800 to-emerald-900',
      actionText: 'Pesan Sekarang',
      filterVariety: 'all',
    },
  ];

  // Auto banner carousel rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % promoBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promoBanners.length]);

  // Extract unique filter options
  const varieties = useMemo(() => {
    const set = new Set(products.map((p) => p.variety).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  const seedClasses = useMemo(() => {
    const set = new Set(products.map((p) => p.seed_class).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered and Sorted Marketplace Products
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

        // Quick Category Tag
        if (selectedCategoryTag === 'siap_tanam' && p.sprout_status !== 'siap_tanam') return false;
        if (selectedCategoryTag === 'g2' && p.seed_class !== 'G2') return false;
        if (selectedCategoryTag === 'g1' && p.seed_class !== 'G1') return false;
        if (selectedCategoryTag === 'industri' && !p.name.toLowerCase().includes('atlantic') && !p.variety?.toLowerCase().includes('atlantic')) return false;

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
        // Default: featured first, then newest
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    products,
    activeSearch,
    selectedCategoryTag,
    selectedVariety,
    selectedSeedClass,
    selectedSproutStatus,
    sortBy,
  ]);

  // Cart Helpers
  const addToCart = (product: Product, qtyToAdd = 1) => {
    if (product.stock <= 0) {
      toast.error('Stok produk ini sedang habis.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + qtyToAdd);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      const initialQty = Math.max(product.min_order || 1, qtyToAdd);
      return [...prev, { product, quantity: Math.min(product.stock, initialQty) }];
    });

    toast.success(`${product.name} dimasukkan ke keranjang`, {
      description: `${qtyToAdd} ${product.unit} berhasil ditambahkan.`,
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            toast.warning(`Maksimal stok tersedia hanya ${item.product.stock} ${item.product.unit}`);
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

  const buyNow = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Stok produk ini sedang habis.');
      return;
    }
    const initialQty = product.min_order || 1;
    setCart([{ product, quantity: initialQty }]);
    setIsCheckoutOpen(true);
  };

  const openDetailModal = (product: Product) => {
    setSelectedDetailProduct(product);
    setDetailModalQty(product.min_order || 1);
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
      toast.error('Mohon lengkapi nama, nomor telepon, dan alamat pengiriman.');
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

  const currentBanner = promoBanners[activeBannerIndex];

  return (
    <div className="space-y-3.5 sm:space-y-6">
      {/* 1. MOBILE-FIRST COMPACT PROMO BANNER CAROUSEL */}
      <section
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r ${currentBanner.bgGradient} text-white p-4 sm:p-6 shadow-md transition-all duration-700`}
      >
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider">
            <Flame className="h-3 w-3 text-amber-300 animate-pulse" />
            <span>{currentBanner.badge}</span>
          </div>

          <h2 className="text-base sm:text-2xl font-black tracking-tight leading-tight">
            {currentBanner.title}
          </h2>

          <p className="text-[11px] sm:text-xs text-white/90 max-w-xl line-clamp-2 leading-relaxed">
            {currentBanner.subtitle}
          </p>

          <div className="flex items-center justify-between pt-1">
            <Button
              size="sm"
              onClick={() => {
                if (currentBanner.filterVariety !== 'all') {
                  setSelectedVariety(currentBanner.filterVariety);
                } else {
                  setSelectedVariety('all');
                }
              }}
              className="bg-white text-zinc-900 hover:bg-zinc-100 font-black text-xs rounded-xl h-8 px-3.5 shadow-xs gap-1 cursor-pointer"
            >
              <span>{currentBanner.actionText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>

            <div className="flex items-center gap-1">
              {promoBanners.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveBannerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeBannerIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. MOBILE HORIZONTAL SWIPEABLE CATEGORY BUBBLES */}
      <section className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none px-0.5">
          {[
            { tag: 'all', label: 'Semua Benih', icon: Sprout, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
            { tag: 'siap_tanam', label: 'Siap Tanam', icon: Leaf, color: 'text-green-600 bg-green-50 dark:bg-green-950/60' },
            { tag: 'g2', label: 'Kelas G2', icon: Award, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
            { tag: 'g1', label: 'Kelas G1', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
            { tag: 'industri', label: 'Atlantic', icon: Sparkles, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
            { tag: 'ongkir', label: 'Free Ongkir', icon: Truck, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' },
          ].map((cat) => (
            <button
              key={cat.tag}
              type="button"
              onClick={() => {
                setSelectedCategoryTag(cat.tag);
                setSelectedVariety('all');
              }}
              className={`flex flex-col items-center justify-center gap-1 shrink-0 p-1 rounded-xl transition cursor-pointer select-none active:scale-95 min-w-[56px]`}
            >
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center transition border ${cat.color} ${
                  selectedCategoryTag === cat.tag
                    ? 'border-emerald-600 ring-2 ring-emerald-600/30 scale-105'
                    : 'border-transparent'
                }`}
              >
                <cat.icon className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] font-extrabold whitespace-nowrap leading-tight ${
                  selectedCategoryTag === cat.tag
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. MOBILE SINGLE-ROW HORIZONTAL FILTER CHIPS */}
      <section className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-0.5">
        {varieties.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setSelectedVariety(v);
              setSelectedCategoryTag('all');
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold whitespace-nowrap shrink-0 transition cursor-pointer border ${
              selectedVariety === v
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {v === 'all' ? '🌱 Semua Varietas' : v}
          </button>
        ))}

        {/* Quick Sort Dropdown inside scroll */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 shrink-0"
        >
          <option value="relevance">Urutkan: Sesuai</option>
          <option value="price_asc">Harga: Murah</option>
          <option value="price_desc">Harga: Tinggi</option>
          <option value="stock_desc">Stok Terbanyak</option>
        </select>
      </section>

      {/* 4. 2-COLUMN MOBILE MARKETPLACE PRODUCT GRID */}
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
                setSelectedCategoryTag('all');
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
              const fakeOriginalPrice = Math.round(product.price * 1.15);

              return (
                <Card
                  key={product.id}
                  className="flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden group select-none hover:border-emerald-500/50 transition"
                >
                  {/* Square Aspect 1:1 Image Container */}
                  <div
                    className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden cursor-pointer"
                    onClick={() => openDetailModal(product)}
                  >
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                        <Sprout className="h-10 w-10 sm:h-14 sm:w-14 text-emerald-600/40" />
                        <span className="text-[9px] font-bold text-zinc-400 mt-1">
                          {product.variety}
                        </span>
                      </div>
                    )}

                    {/* Official Badges Overlay */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 items-start">
                      {product.cert_number ? (
                        <Badge className="bg-emerald-600 text-white text-[7px] sm:text-[8px] font-black px-1 py-0 border-none shadow-xs">
                          ✓ BPSB
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-white text-[7px] sm:text-[8px] font-bold px-1 py-0 border-none">
                          TERUJI
                        </Badge>
                      )}
                      <Badge className="bg-blue-600 text-white text-[7px] sm:text-[8px] font-bold px-1 py-0 border-none">
                        G{product.seed_class.replace('G', '')}
                      </Badge>
                    </div>

                    <div className="absolute top-1.5 right-1.5">
                      <Badge
                        className={`text-[7px] sm:text-[8px] font-black px-1 py-0 border-none shadow-xs ${
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

                    {/* Discount Ribbon */}
                    <div className="absolute bottom-1.5 left-1.5">
                      <span className="bg-rose-500 text-white text-[8px] font-black px-1 py-0.5 rounded-sm shadow-xs">
                        15% OFF
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                    <div className="space-y-0.5">
                      {/* Origin */}
                      <div className="flex items-center gap-0.5 text-[9px] text-zinc-400 font-semibold truncate">
                        <MapPin className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                        <span className="truncate">{product.origin_location}</span>
                      </div>

                      {/* Product Name */}
                      <h3
                        onClick={() => openDetailModal(product)}
                        className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white line-clamp-2 leading-snug cursor-pointer group-hover:text-emerald-600 transition"
                      >
                        {product.name}
                      </h3>

                      {/* Price Tag */}
                      <div className="pt-0.5">
                        <span className="text-[9px] text-zinc-400 line-through block leading-none">
                          Rp {fakeOriginalPrice.toLocaleString('id-ID')}
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                          <span className="text-xs sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-medium">
                            /{product.unit}
                          </span>
                        </div>
                      </div>

                      {/* Rating & Sales */}
                      <div className="flex items-center gap-1 text-[9px] text-zinc-500 pt-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">4.9</span>
                        <span>•</span>
                        <span className="truncate">Terjual 100+ kg</span>
                      </div>
                    </div>

                    {/* Quick Button */}
                    <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                      <Button
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product, product.min_order || 1)}
                        size="sm"
                        className={`w-full rounded-xl text-[11px] font-black h-8 px-1 shadow-xs cursor-pointer ${
                          isOutOfStock
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>{isOutOfStock ? 'Habis' : '+ Keranjang'}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. FLOATING MOBILE-FIRST STICKY CART BAR */}
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
                  {cart.length} Produk ({cartTotalWeightKg} kg)
                </span>
                <span className="text-[10px] text-emerald-400 font-extrabold block truncate">
                  Rp {cartSubtotal.toLocaleString('id-ID')}
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
              <span>Checkout</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. PRODUCT DETAIL BOTTOM SHEET MODAL */}
      <Dialog
        open={!!selectedDetailProduct}
        onOpenChange={(open) => !open && setSelectedDetailProduct(null)}
      >
        {selectedDetailProduct && (
          <DialogContent className="max-w-lg rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-1.5">
                <Badge className="bg-emerald-600 text-white text-[9px] font-black">
                  Kelas {selectedDetailProduct.seed_class}
                </Badge>
                {selectedDetailProduct.cert_number && (
                  <Badge className="bg-blue-600 text-white text-[9px] font-bold">
                    ✓ Bersertifikat BPSB
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-white mt-1">
                {selectedDetailProduct.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-rose-500" />
                <span>Asal: {selectedDetailProduct.origin_location}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2">
              {/* Product Photo */}
              <div className="relative aspect-16/9 w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                {selectedDetailProduct.image_url ? (
                  <Image
                    src={selectedDetailProduct.image_url}
                    alt={selectedDetailProduct.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600">
                    <Sprout className="h-12 w-12 text-emerald-600/40" />
                  </div>
                )}
              </div>

              {/* Agronomic Specifications Table */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1.5">
                <h4 className="font-extrabold text-zinc-800 dark:text-zinc-200 uppercase text-[10px] tracking-wider">
                  Karakteristik Agronomis
                </h4>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Varietas:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedDetailProduct.variety}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Ukuran Knol:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedDetailProduct.size_category}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Elevasi Ideal:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedDetailProduct.elevation_masl || '1.000 - 1.800 mdpl'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Umur Panen:</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {selectedDetailProduct.harvest_days || '90 - 110 HST'}
                    </strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block text-[10px]">Potensi Hasil:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {selectedDetailProduct.potential_yield || '25 - 35 Ton/Ha'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Quantity Picker */}
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                    Total ({selectedDetailProduct.unit})
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-100">
                    Rp {(selectedDetailProduct.price * detailModalQty).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    onClick={() =>
                      setDetailModalQty((q) =>
                        Math.max(selectedDetailProduct.min_order || 1, q - 5)
                      )
                    }
                    size="icon-sm"
                    variant="outline"
                    className="h-7 w-7 rounded-lg"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-black w-8 text-center text-zinc-900 dark:text-white">
                    {detailModalQty}
                  </span>
                  <Button
                    type="button"
                    onClick={() =>
                      setDetailModalQty((q) =>
                        Math.min(selectedDetailProduct.stock, q + 5)
                      )
                    }
                    size="icon-sm"
                    variant="outline"
                    className="h-7 w-7 rounded-lg"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                onClick={() => {
                  addToCart(selectedDetailProduct, detailModalQty);
                  setSelectedDetailProduct(null);
                }}
                variant="outline"
                className="rounded-xl text-xs font-bold h-10"
              >
                + Keranjang
              </Button>
              <Button
                type="button"
                onClick={() => {
                  buyNow(selectedDetailProduct);
                  setSelectedDetailProduct(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black h-10 shadow-xs"
              >
                Beli Langsung
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* 7. CART DRAWER BOTTOM SHEET */}
      <Dialog open={isCartDrawerOpen} onOpenChange={setIsCartDrawerOpen}>
        <DialogContent className="max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              <span>Keranjang Belanja Benih</span>
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <ShoppingBag className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Keranjang masih kosong</p>
              <Button
                onClick={() => setIsCartDrawerOpen(false)}
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
              >
                Pilih Benih
              </Button>
            </div>
          ) : (
            <div className="space-y-3 my-1">
              {/* Item List */}
              <div className="space-y-2 divide-y divide-zinc-100 dark:divide-zinc-800">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-black text-zinc-900 dark:text-white block truncate">
                        {item.product.name}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        Rp {item.product.price.toLocaleString('id-ID')} / {item.product.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-0.5 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="p-1 text-zinc-500 hover:text-zinc-900"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-xs font-black px-1 min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, 1)}
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
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Box */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Total Muatan:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {cartTotalWeightKg} kg
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Subtotal:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Rp {cartSubtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Estimasi Ongkir:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Rp {estimatedShipping.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                  <span>Total Tagihan:</span>
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
                <span>Lanjut ke Pembayaran</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. CHECKOUT & PAYMENT DIALOG */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
              Alamat Pengiriman &amp; Pembayaran
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Lengkapi data penerima agar kurir dapat mengantar tepat ke lokasi lahan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProceedCheckout} className="space-y-3 my-2 text-xs">
            {/* Customer Contact */}
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
                  placeholder="Bpk. Herman"
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
                  Alamat Lengkap Lahan *
                </label>
                <textarea
                  required
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nama jalan, nomor, patokan lahan..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-bold uppercase text-zinc-400">
                Metode Pembayaran *
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
                <span>Subtotal ({cart.length} produk):</span>
                <span>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-[10px]">
                <span>Ongkos Kirim:</span>
                <span>Rp {estimatedShipping.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-emerald-700 dark:text-emerald-400 pt-0.5 border-t border-zinc-200 dark:border-zinc-700">
                <span>Total Bayar:</span>
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
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {paymentMethodType === 'gateway'
                      ? 'Bayar Sekarang ➔'
                      : 'Pesan Sekarang (COD) ➔'}
                  </span>
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 9. ORDER SUCCESS MODAL */}
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
            onClick={() => setIsSuccessOpen(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black h-11"
          >
            Kembali Belanja Benih
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
