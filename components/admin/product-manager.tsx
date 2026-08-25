'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Sprout,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Sparkles,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  LayoutGrid,
  List,
  Upload,
  Image as ImageIcon,
  Cloud,
  X,
  RefreshCw,
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
import type { Product, AdminProductStats } from '@/types/product';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  toggleProductFeaturedAction,
  updateProductStockAction,
  uploadProductImageAction,
} from '@/lib/admin/product-actions';

interface ProductManagerProps {
  initialProducts: Product[];
  stats: AdminProductStats;
}

export function ProductManager({ initialProducts = [], stats: initialStats }: ProductManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [stats, setStats] = useState<AdminProductStats>(initialStats);
  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Sync state if server revalidates props
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSprout, setSelectedSprout] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formVariety, setFormVariety] = useState('Granola L');
  const [formSeedClass, setFormSeedClass] = useState('G2');
  const [formCertNumber, setFormCertNumber] = useState('');
  const [formSizeCategory, setFormSizeCategory] = useState('M (30-50g)');
  const [formSproutStatus, setFormSproutStatus] = useState('siap_tanam');
  const [formPrice, setFormPrice] = useState<number | string>(38500);
  const [formUnit, setFormUnit] = useState('kg');
  const [formStock, setFormStock] = useState<number | string>(1000);
  const [formMinOrder, setFormMinOrder] = useState<number | string>(5);
  const [formWeightPerUnit, setFormWeightPerUnit] = useState<number | string>(1.0);
  const [formOriginLocation, setFormOriginLocation] = useState('Pangalengan, Kab. Bandung, Jawa Barat');
  const [formElevation, setFormElevation] = useState('1.100 - 1.800 mdpl');
  const [formHarvestDays, setFormHarvestDays] = useState('95 - 105 HST');
  const [formPotentialYield, setFormPotentialYield] = useState('28 - 35 Ton/Ha');
  const [formResilience, setFormResilience] = useState('Tahan Virus PVX/PVY & Hawar Daun');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);

  // Quick Stock Field
  const [quickStockValue, setQuickStockValue] = useState<number>(0);

  // Reset form to default creation values
  const resetForm = () => {
    setFormName('');
    setFormVariety('Granola L');
    setFormSeedClass('G2');
    setFormCertNumber('');
    setFormSizeCategory('M (30-50g)');
    setFormSproutStatus('siap_tanam');
    setFormPrice(38500);
    setFormUnit('kg');
    setFormStock(1000);
    setFormMinOrder(5);
    setFormWeightPerUnit(1.0);
    setFormOriginLocation('Pangalengan, Kab. Bandung, Jawa Barat');
    setFormElevation('1.100 - 1.800 mdpl');
    setFormHarvestDays('95 - 105 HST');
    setFormPotentialYield('28 - 35 Ton/Ha');
    setFormResilience('Tahan Virus PVX/PVY & Hawar Daun');
    setFormDescription('');
    setFormImageUrl('');
    setFormIsFeatured(false);
    setFormIsActive(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Populate form for editing
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormName(product.name);
    setFormVariety(product.variety);
    setFormSeedClass(product.seed_class);
    setFormCertNumber(product.cert_number || '');
    setFormSizeCategory(product.size_category);
    setFormSproutStatus(product.sprout_status);
    setFormPrice(product.price);
    setFormUnit(product.unit);
    setFormStock(product.stock);
    setFormMinOrder(product.min_order);
    setFormWeightPerUnit(product.weight_per_unit);
    setFormOriginLocation(product.origin_location);
    setFormElevation(product.elevation_masl || '');
    setFormHarvestDays(product.harvest_days || '');
    setFormPotentialYield(product.potential_yield || '');
    setFormResilience(product.resilience || '');
    setFormDescription(product.description || '');
    setFormImageUrl(product.image_url || '');
    setFormIsFeatured(product.is_featured);
    setFormIsActive(product.is_active);
    setIsEditOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open Detail modal
  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  // Open Delete modal
  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  // Open Quick Stock modal
  const openQuickStockModal = (product: Product) => {
    setSelectedProduct(product);
    setQuickStockValue(product.stock);
    setIsQuickStockOpen(true);
  };

  // Handle Image Upload to Supabase Storage (Bucket: product-images)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file melebihi 5MB', {
        description: 'Format gambar maksimal berukuran 5MB.',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format gambar tidak didukung', {
        description: 'Silakan pilih file JPG, JPEG, PNG, atau WEBP.',
      });
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadProductImageAction(formData);
      if (!res.success || !res.publicUrl) {
        toast.error(res.error || 'Gagal mengunggah foto');
        return;
      }

      setFormImageUrl(res.publicUrl);
      toast.success('Foto Berhasil Diunggah ke Supabase Storage!', {
        description: 'Tersimpan di bucket product-images.',
      });
    } catch {
      toast.error('Terjadi gangguan saat mengunggah foto');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Filter & Sort Products
  const filteredProducts = products
    .filter((product) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (product.name && product.name.toLowerCase().includes(q)) ||
        (product.variety && product.variety.toLowerCase().includes(q)) ||
        (product.origin_location && product.origin_location.toLowerCase().includes(q)) ||
        (product.cert_number && product.cert_number.toLowerCase().includes(q));

      const matchVariety = selectedVariety === 'all' || product.variety === selectedVariety;
      const matchClass = selectedClass === 'all' || product.seed_class === selectedClass;
      const matchSprout = selectedSprout === 'all' || product.sprout_status === selectedSprout;

      let matchStock = true;
      if (selectedStockStatus === 'available') matchStock = product.stock > 10;
      if (selectedStockStatus === 'low') matchStock = product.stock > 0 && product.stock <= 10;
      if (selectedStockStatus === 'empty') matchStock = product.stock === 0;
      if (selectedStockStatus === 'active') matchStock = product.is_active;
      if (selectedStockStatus === 'inactive') matchStock = !product.is_active;

      return matchSearch && matchVariety && matchClass && matchSprout && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Handle Create Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('Nama benih kentang wajib diisi');
      return;
    }
    if (!formVariety.trim()) {
      toast.error('Varietas benih wajib dipilih/diisi');
      return;
    }
    if (Number(formPrice) < 0 || isNaN(Number(formPrice))) {
      toast.error('Harga tidak valid');
      return;
    }

    const formData = new FormData();
    formData.append('name', formName.trim());
    formData.append('variety', formVariety.trim());
    formData.append('seed_class', formSeedClass.trim());
    formData.append('cert_number', formCertNumber.trim());
    formData.append('size_category', formSizeCategory.trim());
    formData.append('sprout_status', formSproutStatus.trim());
    formData.append('price', String(formPrice));
    formData.append('unit', formUnit.trim());
    formData.append('stock', String(formStock));
    formData.append('min_order', String(formMinOrder));
    formData.append('weight_per_unit', String(formWeightPerUnit));
    formData.append('origin_location', formOriginLocation.trim());
    formData.append('elevation_masl', formElevation.trim());
    formData.append('harvest_days', formHarvestDays.trim());
    formData.append('potential_yield', formPotentialYield.trim());
    formData.append('resilience', formResilience.trim());
    formData.append('description', formDescription.trim());
    formData.append('image_url', formImageUrl.trim());
    formData.append('is_featured', formIsFeatured ? 'true' : 'false');
    formData.append('is_active', formIsActive ? 'true' : 'false');

    startTransition(async () => {
      const res = await createProductAction(formData);
      if (!res.success || !res.product) {
        toast.error(res.error || 'Gagal menambahkan produk benih kentang');
        return;
      }

      toast.success('Benih Kentang Berhasil Ditambahkan!', {
        description: `${res.product.name} telah masuk dalam katalog.`,
      });

      setProducts((prev) => [res.product!, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalProducts: prev.totalProducts + 1,
        activeProducts: res.product!.is_active ? prev.activeProducts + 1 : prev.activeProducts,
      }));
      setIsCreateOpen(false);
      resetForm();
      router.refresh();
    });
  };

  // Handle Update Product
  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!formName.trim()) {
      toast.error('Nama benih kentang wajib diisi');
      return;
    }

    const formData = new FormData();
    formData.append('name', formName.trim());
    formData.append('variety', formVariety.trim());
    formData.append('seed_class', formSeedClass.trim());
    formData.append('cert_number', formCertNumber.trim());
    formData.append('size_category', formSizeCategory.trim());
    formData.append('sprout_status', formSproutStatus.trim());
    formData.append('price', String(formPrice));
    formData.append('unit', formUnit.trim());
    formData.append('stock', String(formStock));
    formData.append('min_order', String(formMinOrder));
    formData.append('weight_per_unit', String(formWeightPerUnit));
    formData.append('origin_location', formOriginLocation.trim());
    formData.append('elevation_masl', formElevation.trim());
    formData.append('harvest_days', formHarvestDays.trim());
    formData.append('potential_yield', formPotentialYield.trim());
    formData.append('resilience', formResilience.trim());
    formData.append('description', formDescription.trim());
    formData.append('image_url', formImageUrl.trim());
    formData.append('is_featured', formIsFeatured ? 'true' : 'false');
    formData.append('is_active', formIsActive ? 'true' : 'false');

    startTransition(async () => {
      const res = await updateProductAction(selectedProduct.id, formData);
      if (!res.success || !res.product) {
        toast.error(res.error || 'Gagal memperbarui data benih kentang');
        return;
      }

      toast.success('Data Benih Berhasil Diperbarui!');
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? res.product! : p))
      );
      setIsEditOpen(false);
      setSelectedProduct(null);
      router.refresh();
    });
  };

  // Handle Delete Product
  const handleDeleteProduct = () => {
    if (!selectedProduct) return;

    startTransition(async () => {
      const res = await deleteProductAction(selectedProduct.id);
      if (!res.success) {
        toast.error(res.error || 'Gagal menghapus benih kentang');
        return;
      }

      toast.success('Benih Kentang Dihapus', {
        description: `${selectedProduct.name} telah dihapus dari sistem.`,
      });

      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      setStats((prev) => ({
        ...prev,
        totalProducts: Math.max(0, prev.totalProducts - 1),
      }));
      setIsDeleteOpen(false);
      setSelectedProduct(null);
      router.refresh();
    });
  };

  // Handle Quick Toggle Active
  const handleToggleActive = (product: Product) => {
    const nextState = !product.is_active;
    startTransition(async () => {
      const res = await toggleProductActiveAction(product.id, nextState);
      if (!res.success) {
        toast.error(res.error || 'Gagal mengubah status aktif');
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: nextState } : p))
      );
      toast.success(nextState ? 'Benih Ditampilkan di Katalog' : 'Benih Disembunyikan');
      router.refresh();
    });
  };

  // Handle Quick Toggle Featured
  const handleToggleFeatured = (product: Product) => {
    const nextState = !product.is_featured;
    startTransition(async () => {
      const res = await toggleProductFeaturedAction(product.id, nextState);
      if (!res.success) {
        toast.error(res.error || 'Gagal mengubah status unggulan');
        return;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_featured: nextState } : p))
      );
      toast.success(nextState ? 'Ditetapkan sebagai Produk Unggulan' : 'Dihapus dari Produk Unggulan');
      router.refresh();
    });
  };

  // Handle Quick Stock Update
  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    startTransition(async () => {
      const res = await updateProductStockAction(selectedProduct.id, quickStockValue);
      if (!res.success || !res.product) {
        toast.error(res.error || 'Gagal memperbarui stok');
        return;
      }

      toast.success('Stok Berhasil Diperbarui', {
        description: `Stok ${selectedProduct.name} kini ${quickStockValue} ${selectedProduct.unit}.`,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, stock: quickStockValue } : p))
      );
      setIsQuickStockOpen(false);
      setSelectedProduct(null);
      router.refresh();
    });
  };

  // Helpers for class badge styling
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

  // Helpers for sprout status label & badge
  const getSproutStatusBadge = (status: string) => {
    switch (status) {
      case 'siap_tanam':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
            🌱 Siap Tanam
          </Badge>
        );
      case 'pecah_dormansi':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
            ⏳ Pecah Dormansi
          </Badge>
        );
      case 'dormansi':
        return (
          <Badge className="bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border border-zinc-500/30 text-[10px] font-semibold">
            📦 Dormansi Penuh
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isSupabaseHosted = formImageUrl.includes('supabase.co/storage/v1/object/public/product-images');

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Benih</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <Sprout className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {stats?.totalProducts ?? products.length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Katalog varietas kentang</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Aktif Dijual</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats?.activeProducts ?? products.filter((p) => p.is_active).length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Tampil di etalase pembeli</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Produk Unggulan</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {stats?.featuredProducts ?? products.filter((p) => p.is_featured).length}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Disorot di beranda</p>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Total Stok Fisik</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {(stats?.totalStockKg ?? products.filter(p => p.unit === 'kg').reduce((s, p) => s + (p.stock || 0), 0)).toLocaleString('id-ID')} <span className="text-xs font-normal">Kg</span> / {(stats?.totalStockKnol ?? products.filter(p => p.unit === 'knol').reduce((s, p) => s + (p.stock || 0), 0)).toLocaleString('id-ID')} <span className="text-xs font-normal">Knol</span>
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Stok gudang &amp; penangkaran</p>
          </div>
        </Card>
      </div>

      {/* Action Bar & Controls */}
      <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Katalog Manajemen Benih Kentang
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Kelola varietas, generasi G0-G4, sertifikasi BPSB, dan foto benih di Supabase Storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.refresh()}
              className="rounded-xl h-10 px-3 text-xs font-semibold gap-1.5"
              title="Muat Ulang Data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Segarkan</span>
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl gap-2 shadow-xs min-h-[40px]"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Benih Kentang</span>
            </Button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari benih, varietas, nomor sertifikat, asal..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Variety Filter */}
          <div>
            <select
              value={selectedVariety}
              onChange={(e) => setSelectedVariety(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Varietas</option>
              <option value="Granola L">Granola L</option>
              <option value="Atlantic">Atlantic (Industri)</option>
              <option value="Medians">Medians</option>
              <option value="Tenggo">Tenggo</option>
              <option value="Spunta">Spunta</option>
            </select>
          </div>

          {/* Seed Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Kelas Generasi</option>
              <option value="G0">G0 (Mini Tuber/Penjenis)</option>
              <option value="G1">G1 (Dasar)</option>
              <option value="G2">G2 (Pokok)</option>
              <option value="G3">G3 (Sebar)</option>
              <option value="G4">G4 (Sebar Akhir)</option>
            </select>
          </div>

          {/* Sprout Status Filter */}
          <div>
            <select
              value={selectedSprout}
              onChange={(e) => setSelectedSprout(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Kondisi Tunas</option>
              <option value="siap_tanam">Siap Tanam</option>
              <option value="pecah_dormansi">Pecah Dormansi</option>
              <option value="dormansi">Dormansi</option>
            </select>
          </div>

          {/* Sort & View Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-2.5 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="latest">Terbaru</option>
              <option value="price_asc">Harga Termurah</option>
              <option value="price_desc">Harga Termahal</option>
              <option value="stock_desc">Stok Terbanyak</option>
              <option value="stock_asc">Stok Tersedikit</option>
            </select>

            <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden p-0.5 bg-zinc-100 dark:bg-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Tampilan Tabel"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product List Content */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <Sprout className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {products.length === 0
              ? 'Belum ada data produk benih kentang di sistem'
              : 'Tidak ada produk benih kentang yang sesuai filter'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {products.length === 0
              ? 'Klik tombol "Tambah Benih Kentang" untuk menambahkan produk benih pertama Anda.'
              : 'Coba ubah kata kunci pencarian atau reset filter untuk melihat katalog benih lainnya.'}
          </p>
          {products.length > 0 ? (
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedVariety('all');
                setSelectedClass('all');
                setSelectedSprout('all');
                setSelectedStockStatus('all');
              }}
              variant="outline"
              className="mt-4 text-xs font-semibold rounded-xl"
            >
              Reset Filter
            </Button>
          ) : (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah Benih Sekarang
            </Button>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`overflow-hidden rounded-2xl border transition hover:shadow-md bg-white dark:bg-zinc-900 flex flex-col justify-between ${
                !product.is_active
                  ? 'opacity-65 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50'
                  : product.is_featured
                  ? 'border-emerald-300 dark:border-emerald-700/60 shadow-xs ring-1 ring-emerald-500/10'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div>
                {/* Image Header with Badges */}
                <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 gap-1 bg-zinc-100 dark:bg-zinc-800">
                      <Sprout className="h-8 w-8 text-emerald-600/50" />
                      <span className="text-[11px] font-medium">Foto Belum Diunggah</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`text-xs font-bold px-2 py-0.5 border ${getClassBadge(product.seed_class)}`}>
                        Kelas {product.seed_class}
                      </Badge>
                      <Badge className="bg-white/90 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-100 text-[10px] font-semibold backdrop-blur-xs">
                        {product.variety}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      {product.is_featured && (
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(product)}
                          title="Produk Unggulan (Klik untuk ubah)"
                          className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs hover:bg-amber-600 transition"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(product)}
                        title={product.is_active ? 'Status: Aktif (Klik untuk nonaktifkan)' : 'Status: Non-aktif (Klik untuk aktifkan)'}
                        className={`p-1.5 rounded-lg text-white shadow-xs transition ${
                          product.is_active ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-zinc-600 hover:bg-zinc-700'
                        }`}
                      >
                        {product.is_active ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Image Overlay Info */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-1 drop-shadow-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[190px]">{product.origin_location.split(',')[0]}</span>
                    </div>
                    <div>{getSproutStatusBadge(product.sprout_status)}</div>
                  </div>
                </div>

                {/* Product Content Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    {product.cert_number && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{product.cert_number}</span>
                      </p>
                    )}
                  </div>

                  {/* Specs Pill Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Ukuran Umbi:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{product.size_category}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Ketinggian:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{product.elevation_masl || '-'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Umur Panen:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{product.harvest_days || '-'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Potensi Hasil:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{product.potential_yield || '-'}</span>
                    </div>
                  </div>

                  {/* Price & Stock Section */}
                  <div className="flex items-end justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Harga per {product.unit}</span>
                      <span className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block font-medium">Sisa Stok</span>
                      <button
                        type="button"
                        onClick={() => openQuickStockModal(product)}
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg transition hover:ring-2 hover:ring-emerald-500/20 ${
                          product.stock > 50
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : product.stock > 0
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                        title="Klik untuk ubah stok cepat"
                      >
                        {product.stock.toLocaleString('id-ID')} {product.unit} ✏️
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-zinc-50/80 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                <Button
                  onClick={() => openDetailModal(product)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-semibold rounded-xl h-8 px-2"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  <span>Detail</span>
                </Button>

                <Button
                  onClick={() => openEditModal(product)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-semibold rounded-xl h-8 px-2 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  <span>Ubah</span>
                </Button>

                <Button
                  onClick={() => openDeleteModal(product)}
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold rounded-xl h-8 px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Produk Benih</th>
                <th className="py-3 px-3">Varietas &amp; Kelas</th>
                <th className="py-3 px-3">Kondisi Tunas</th>
                <th className="py-3 px-3">Harga</th>
                <th className="py-3 px-3">Stok</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition ${
                    !product.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Sprout className="h-5 w-5 text-emerald-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white line-clamp-1">
                          {product.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {product.origin_location}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Badge className={`text-[10px] font-bold px-1.5 py-0 border ${getClassBadge(product.seed_class)}`}>
                        {product.seed_class}
                      </Badge>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {product.variety}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">{getSproutStatusBadge(product.sprout_status)}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                    Rp {product.price.toLocaleString('id-ID')}
                    <span className="text-[10px] font-normal text-zinc-400 block">/{product.unit}</span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => openQuickStockModal(product)}
                      className="font-bold hover:underline"
                    >
                      {product.stock.toLocaleString('id-ID')} {product.unit} ✏️
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(product)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          product.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {product.is_active ? 'Aktif' : 'Non-aktif'}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        onClick={() => openDetailModal(product)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openEditModal(product)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openDeleteModal(product)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE PRODUCT MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Sprout className="h-6 w-6 text-emerald-600" />
              Tambah Benih Kentang Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lengkapi taksonomi benih, sertifikasi BPSB, spesifikasi budidaya, dan unggah foto ke Supabase Storage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 mt-2">
            {/* Section 1: Identitas Produk */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                1. Identitas &amp; Taksonomi Benih
              </h4>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Benih Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Benih Kentang Granola L - G2 Pangalengan Bersertifikat"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Varietas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formVariety}
                    onChange={(e) => setFormVariety(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="Granola L">Granola L (Kentang Sayur/Meja)</option>
                    <option value="Atlantic">Atlantic (Industri Keripik)</option>
                    <option value="Medians">Medians (Dwi-Guna Balitsa)</option>
                    <option value="Tenggo">Tenggo (Dataran Sedang)</option>
                    <option value="Spunta">Spunta (Ekspor/Dataran Tinggi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kelas Generasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSeedClass}
                    onChange={(e) => setFormSeedClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="G0">G0 (Mini Tuber / Penjenis)</option>
                    <option value="G1">G1 (Benih Dasar)</option>
                    <option value="G2">G2 (Benih Pokok)</option>
                    <option value="G3">G3 (Benih Sebar)</option>
                    <option value="G4">G4 (Sebar Akhir)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kondisi Tunas &amp; Dormansi
                  </label>
                  <select
                    value={formSproutStatus}
                    onChange={(e) => setFormSproutStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="siap_tanam">Siap Tanam (1-2 cm)</option>
                    <option value="pecah_dormansi">Pecah Dormansi (2-5 mm)</option>
                    <option value="dormansi">Dormansi Penuh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nomor Sertifikat BPSB / Legalitas
                  </label>
                  <input
                    type="text"
                    value={formCertNumber}
                    onChange={(e) => setFormCertNumber(e.target.value)}
                    placeholder="Contoh: BPSB-TPH/JB/KNT-2026/088"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategori Ukuran Umbi
                  </label>
                  <select
                    value={formSizeCategory}
                    onChange={(e) => setFormSizeCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="Knol Mini (8-15g)">Knol Mini (8-15g) - G0</option>
                    <option value="S (20-30g)">S (20-30g / Kecil)</option>
                    <option value="M (30-50g)">M (30-50g / Standar)</option>
                    <option value="L (50-80g)">L (50-80g / Jumbo)</option>
                    <option value="Campur">Campur Terstandar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Spesifikasi Agronomi */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                2. Spesifikasi Agronomi &amp; Lokasi
              </h4>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Asal Daerah Penangkaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formOriginLocation}
                  onChange={(e) => setFormOriginLocation(e.target.value)}
                  placeholder="Contoh: Pangalengan, Kab. Bandung, Jawa Barat"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ketinggian Optimal (mdpl)
                  </label>
                  <input
                    type="text"
                    value={formElevation}
                    onChange={(e) => setFormElevation(e.target.value)}
                    placeholder="1.100 - 1.800 mdpl"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Umur Panen (HST)
                  </label>
                  <input
                    type="text"
                    value={formHarvestDays}
                    onChange={(e) => setFormHarvestDays(e.target.value)}
                    placeholder="95 - 105 HST"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Potensi Hasil
                  </label>
                  <input
                    type="text"
                    value={formPotentialYield}
                    onChange={(e) => setFormPotentialYield(e.target.value)}
                    placeholder="28 - 35 Ton/Ha"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ketahanan Hama / Penyakit
                </label>
                <input
                  type="text"
                  value={formResilience}
                  onChange={(e) => setFormResilience(e.target.value)}
                  placeholder="Contoh: Tahan Busuk Daun (Phytophthora infestans) & Layu Bakteri"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Section 3: Harga & Stok */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                3. Harga &amp; Manajemen Stok
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Harga Satuan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Satuan Penjualan
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="kg">Per Kilogram (Kg)</option>
                    <option value="knol">Per Knol / Umbi Mini</option>
                    <option value="sak_25kg">Per Sak (25 Kg)</option>
                    <option value="sak_50kg">Per Sak (50 Kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jumlah Stok <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Minimal Pembelian
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Bobot per Satuan (Kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min={0.001}
                    value={formWeightPerUnit}
                    onChange={(e) => setFormWeightPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Foto via Supabase Storage Bucket & Deskripsi */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span>4. Unggah Foto Benih (Supabase Storage: product-images)</span>
                </h4>
                {isSupabaseHosted && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                    <Cloud className="h-3 w-3 mr-1" /> Supabase Storage
                  </Badge>
                )}
              </div>

              {/* Upload Input Area & Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  {formImageUrl ? (
                    <>
                      <Image src={formImageUrl} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        title="Hapus Foto"
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-xs">
                      <ImageIcon className="h-6 w-6 mb-1" />
                      <span>Belum ada foto</span>
                    </div>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Mengunggah...</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="create-image-upload"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-9 px-3 gap-1.5 shadow-xs"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Pilih Foto dari Perangkat</span>
                    </Button>
                    <span className="text-[11px] text-zinc-400">JPG, PNG, maks 5MB</span>
                  </div>

                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Atau tempel URL gambar..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Deskripsi &amp; Panduan Tanam
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Keterangan lengkap keunggulan benih, rekomendasi pemupukan dan teknik budidaya..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tampilkan &amp; Jual di Marketplace</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Jadikan Produk Unggulan (Beranda)</span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending || isUploadingImage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan &amp; Terbitkan Benih</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PRODUCT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Edit2 className="h-6 w-6 text-emerald-600" />
              Ubah Data Benih Kentang
            </DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui rincian harga, stok, varietas, spesifikasi, dan foto benih di Supabase Storage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProduct} className="space-y-4 mt-2">
            {/* Section 1: Identitas */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Benih <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Varietas
                  </label>
                  <select
                    value={formVariety}
                    onChange={(e) => setFormVariety(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="Granola L">Granola L</option>
                    <option value="Atlantic">Atlantic</option>
                    <option value="Medians">Medians</option>
                    <option value="Tenggo">Tenggo</option>
                    <option value="Spunta">Spunta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kelas Generasi
                  </label>
                  <select
                    value={formSeedClass}
                    onChange={(e) => setFormSeedClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="G0">G0 (Mini Tuber)</option>
                    <option value="G1">G1 (Dasar)</option>
                    <option value="G2">G2 (Pokok)</option>
                    <option value="G3">G3 (Sebar)</option>
                    <option value="G4">G4 (Sebar Akhir)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kondisi Tunas
                  </label>
                  <select
                    value={formSproutStatus}
                    onChange={(e) => setFormSproutStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="siap_tanam">Siap Tanam (1-2 cm)</option>
                    <option value="pecah_dormansi">Pecah Dormansi</option>
                    <option value="dormansi">Dormansi Penuh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nomor Sertifikat BPSB
                  </label>
                  <input
                    type="text"
                    value={formCertNumber}
                    onChange={(e) => setFormCertNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategori Ukuran Umbi
                  </label>
                  <select
                    value={formSizeCategory}
                    onChange={(e) => setFormSizeCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="Knol Mini (8-15g)">Knol Mini (8-15g) - G0</option>
                    <option value="S (20-30g)">S (20-30g / Kecil)</option>
                    <option value="M (30-50g)">M (30-50g / Standar)</option>
                    <option value="L (50-80g)">L (50-80g / Jumbo)</option>
                    <option value="Campur">Campur Terstandar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Harga & Stok */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Harga Satuan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Satuan
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  >
                    <option value="kg">Per Kilogram (Kg)</option>
                    <option value="knol">Per Knol / Umbi Mini</option>
                    <option value="sak_25kg">Per Sak (25 Kg)</option>
                    <option value="sak_50kg">Per Sak (50 Kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jumlah Stok <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Foto via Supabase Storage & Opsi */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span>Foto Benih (Supabase Storage: product-images)</span>
                </h4>
                {isSupabaseHosted && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                    <Cloud className="h-3 w-3 mr-1" /> Supabase Storage
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  {formImageUrl ? (
                    <>
                      <Image src={formImageUrl} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        title="Hapus Foto"
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-xs">
                      <ImageIcon className="h-6 w-6 mb-1" />
                      <span>Belum ada foto</span>
                    </div>
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-semibold gap-1">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Mengunggah...</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="edit-image-upload"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-9 px-3 gap-1.5 shadow-xs"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span>Ganti Foto dari Perangkat</span>
                    </Button>
                  </div>

                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="URL Foto..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Deskripsi Benih
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tampilkan &amp; Jual di Marketplace</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Jadikan Produk Unggulan</span>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending || isUploadingImage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <span>Perbarui Data Benih</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL SPEC MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          {selectedProduct && (
            <div className="space-y-4">
              <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {selectedProduct.image_url ? (
                  <Image
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-1">
                    <Sprout className="h-10 w-10 text-emerald-600/50" />
                    <span className="text-xs">Foto Belum Tersedia</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge className={`text-xs font-bold px-2 py-0.5 border ${getClassBadge(selectedProduct.seed_class)}`}>
                    Kelas {selectedProduct.seed_class}
                  </Badge>
                  <Badge className="bg-black/60 text-white text-xs backdrop-blur-xs">
                    {selectedProduct.variety}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  {selectedProduct.name}
                </h3>
                {selectedProduct.cert_number && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    {selectedProduct.cert_number}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Asal Penangkaran:</span>
                    <span className="font-semibold">{selectedProduct.origin_location}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Ketinggian Tanam:</span>
                    <span className="font-semibold">{selectedProduct.elevation_masl || '-'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Umur Panen:</span>
                    <span className="font-semibold">{selectedProduct.harvest_days || '-'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Potensi Panen:</span>
                    <span className="font-semibold">{selectedProduct.potential_yield || '-'}</span>
                  </div>
                </div>

                {selectedProduct.resilience && (
                  <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <span className="text-zinc-400 block text-[10px]">Ketahanan Penyakit:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{selectedProduct.resilience}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                {selectedProduct.description || 'Tidak ada deskripsi tambahan.'}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20">
                <div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-medium">Harga / Satuan</span>
                  <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                    Rp {selectedProduct.price.toLocaleString('id-ID')} /{selectedProduct.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-medium">Stok Tersedia</span>
                  <span className="text-sm font-extrabold text-emerald-900 dark:text-emerald-100">
                    {selectedProduct.stock.toLocaleString('id-ID')} {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  className="w-full rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
                >
                  Tutup Lembar Spesifikasi
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QUICK STOCK MODAL */}
      <Dialog open={isQuickStockOpen} onOpenChange={setIsQuickStockOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Perbarui Stok Cepat
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStock} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Jumlah Stok Baru ({selectedProduct?.unit})
              </label>
              <input
                type="number"
                min={0}
                required
                value={quickStockValue}
                onChange={(e) => setQuickStockValue(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-base font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuickStockValue((prev) => Math.max(0, prev + 100))}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => setQuickStockValue((prev) => Math.max(0, prev + 500))}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
              >
                +500
              </button>
              <button
                type="button"
                onClick={() => setQuickStockValue((prev) => Math.max(0, prev + 1000))}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
              >
                +1.000
              </button>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickStockOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Simpan Stok
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Hapus Benih Kentang?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Tindakan ini tidak dapat dibatalkan. Benih{' '}
              <strong className="text-zinc-900 dark:text-white font-semibold">
                &ldquo;{selectedProduct?.name}&rdquo;
              </strong>{' '}
              akan dihapus permanen dari etalase dan sistem katalog database Kentara.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDeleteProduct}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus Benih Ini</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
