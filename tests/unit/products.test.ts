import { describe, it, expect } from 'vitest';
import type { Product, AdminProductStats, ProductFormData } from '@/types/product';

describe('1. Product Management Unit Tests (Katalog Benih Kentang)', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Benih Kentang Granola L - G2 Pangalengan Bersertifikat',
      slug: 'benih-kentang-granola-l-g2',
      variety: 'Granola L',
      seed_class: 'G2',
      cert_number: 'BPSB-TPH/JB/KTG/2026/001',
      origin_location: 'Pangalengan, Kab. Bandung',
      price: 28000,
      stock: 500,
      unit: 'kg',
      min_order: 10,
      weight_per_unit: 1.0,
      size_category: 'Sedang (30-50 gr/umbi)',
      sprout_status: 'siap_tanam',
      harvest_days: '90-100 HST',
      potential_yield: '25-30 Ton/Ha',
      elevation_masl: '1.000 - 2.000 mdpl',
      resilience: 'Tahan Phytophthora infestans',
      description: 'Benih bersertifikasi resmi.',
      image_url: null,
      is_active: true,
      is_featured: true,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'prod-2',
      name: 'Benih Kentang Industri Atlantic - G2 Dieng Mutu Tinggi',
      slug: 'benih-kentang-atlantic-g2',
      variety: 'Atlantic',
      seed_class: 'G2',
      cert_number: 'BPSB-TPH/JT/KTG/2026/014',
      origin_location: 'Dataran Tinggi Dieng, Wonosobo',
      price: 32000,
      stock: 0, // Out of stock
      unit: 'kg',
      min_order: 25,
      weight_per_unit: 1.0,
      size_category: 'Besar (50-80 gr/umbi)',
      sprout_status: 'pecah_dormansi',
      harvest_days: '100-110 HST',
      potential_yield: '28-35 Ton/Ha',
      elevation_masl: '1.200 - 2.200 mdpl',
      resilience: 'Cocok untuk keripik kentang',
      description: 'Benih kentang industri.',
      image_url: null,
      is_active: true,
      is_featured: false,
      created_at: '2026-08-25T01:00:00Z',
      updated_at: '2026-08-25T01:00:00Z',
    },
    {
      id: 'prod-3',
      name: 'Benih Kentang Mini Tuber G0 Tissue Culture Bebas Virus',
      slug: 'benih-kentang-mini-tuber-g0',
      variety: 'Granola L',
      seed_class: 'G0',
      cert_number: 'BALITSA/KTG/G0/2026/09',
      origin_location: 'Balitsa Lembang',
      price: 6500,
      stock: 1200,
      unit: 'knol',
      min_order: 50,
      weight_per_unit: 0.02,
      size_category: 'Mini Tuber (10-15 gr/umbi)',
      sprout_status: 'siap_tanam',
      harvest_days: '80-90 HST',
      potential_yield: 'Multiplikasi Tinggi',
      elevation_masl: 'Greenhouse Berjaring',
      resilience: 'Bebas virus PVY & PLRV',
      description: 'Kultur jaringan.',
      image_url: null,
      is_active: false, // Inactive
      is_featured: false,
      created_at: '2026-08-25T02:00:00Z',
      updated_at: '2026-08-25T02:00:00Z',
    },
  ];

  it('should correctly calculate product inventory statistics', () => {
    const totalProducts = mockProducts.length;
    const activeProducts = mockProducts.filter((p) => p.is_active).length;
    const outOfStockProducts = mockProducts.filter((p) => p.stock === 0).length;
    const lowStockProducts = mockProducts.filter((p) => p.stock > 0 && p.stock <= 50).length;
    const featuredProducts = mockProducts.filter((p) => p.is_featured).length;
    const totalStockKg = mockProducts
      .filter((p) => p.unit === 'kg')
      .reduce((sum, p) => sum + p.stock, 0);
    const totalStockKnol = mockProducts
      .filter((p) => p.unit === 'knol')
      .reduce((sum, p) => sum + p.stock, 0);

    const stats: AdminProductStats = {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      featuredProducts,
      totalStockKg,
      totalStockKnol,
    };

    expect(stats.totalProducts).toBe(3);
    expect(stats.activeProducts).toBe(2);
    expect(stats.outOfStockProducts).toBe(1);
    expect(stats.featuredProducts).toBe(1);
    expect(stats.totalStockKg).toBe(500);
    expect(stats.totalStockKnol).toBe(1200);
  });

  it('should validate potato seed input creation constraints', () => {
    const validateProductInput = (input: Partial<ProductFormData>) => {
      const errors: string[] = [];
      if (!input.name || input.name.trim().length < 3) {
        errors.push('Nama produk minimal 3 karakter.');
      }
      if (!input.variety) {
        errors.push('Varietas benih kentang wajib dipilih.');
      }
      if (!input.seed_class) {
        errors.push('Kelas benih (G0, G1, G2, G3) wajib dipilih.');
      }
      if (input.price === undefined || input.price <= 0) {
        errors.push('Harga harus lebih dari Rp 0.');
      }
      if (input.stock === undefined || input.stock < 0) {
        errors.push('Stok tidak boleh bernilai negatif.');
      }
      return { isValid: errors.length === 0, errors };
    };

    // Valid Input
    const valid = validateProductInput({
      name: 'Benih Kentang Medians G1',
      variety: 'Medians',
      seed_class: 'G1',
      price: 35000,
      stock: 200,
    });
    expect(valid.isValid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    // Invalid Input (missing name, negative price)
    const invalid = validateProductInput({
      name: '',
      variety: '',
      price: -5000,
      stock: -10,
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('should filter potato seed products by variety and seed class', () => {
    const filterProducts = (
      items: Product[],
      filter: { variety?: string; seedClass?: string; onlyActive?: boolean }
    ) => {
      return items.filter((item) => {
        if (filter.onlyActive && !item.is_active) return false;
        if (filter.variety && item.variety !== filter.variety) return false;
        if (filter.seedClass && item.seed_class !== filter.seedClass) return false;
        return true;
      });
    };

    // Filter G2 class only
    const g2Items = filterProducts(mockProducts, { seedClass: 'G2' });
    expect(g2Items).toHaveLength(2);
    expect(g2Items.every((p) => p.seed_class === 'G2')).toBe(true);

    // Filter Active Granola L
    const activeGranola = filterProducts(mockProducts, {
      variety: 'Granola L',
      onlyActive: true,
    });
    expect(activeGranola).toHaveLength(1);
    expect(activeGranola[0].id).toBe('prod-1');
  });
});
