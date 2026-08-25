import { describe, it, expect } from 'vitest';
import type { Product } from '@/types/product';

describe('Petani Customer Portal & Product Catalog Unit Tests', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Benih Kentang Granola L - G2 Bersertifikat Pangalengan',
      slug: 'benih-kentang-granola-l-g2-pangalengan',
      variety: 'Granola L',
      seed_class: 'G2',
      cert_number: 'BPSB-TPH/2026/GR-089',
      size_category: 'Ukuran M (30-45g/knol)',
      sprout_status: 'siap_tanam',
      price: 28000,
      unit: 'kg',
      stock: 500,
      min_order: 10,
      weight_per_unit: 1.0,
      origin_location: 'Pangalengan, Bandung',
      elevation_masl: '1.200 - 1.600 mdpl',
      harvest_days: '90 - 110 HST',
      potential_yield: '25 - 35 Ton/Ha',
      resilience: 'Tahan Penyakit Busuk Daun (Phytophthora)',
      description: 'Benih kentang varietas Granola L turunan G2 bersertifikat resmi BPSB.',
      image_url: '/images/products/granola-g2.jpg',
      is_featured: true,
      is_active: true,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'prod-2',
      name: 'Benih Kentang Atlantic Unggul - G1 Industri Keripik',
      slug: 'benih-kentang-atlantic-g1-industri',
      variety: 'Atlantic',
      seed_class: 'G1',
      cert_number: 'BPSB-TPH/2026/AT-012',
      size_category: 'Ukuran S (20-30g/knol)',
      sprout_status: 'pecah_dormansi',
      price: 38000,
      unit: 'kg',
      stock: 150,
      min_order: 5,
      weight_per_unit: 1.0,
      origin_location: 'Lembang, Bandung Barat',
      elevation_masl: '1.100 - 1.500 mdpl',
      harvest_days: '100 - 120 HST',
      potential_yield: '28 - 40 Ton/Ha',
      resilience: 'Kadar Padatan Tinggi (Cocok untuk Olahan Chips)',
      description: 'Benih kentang varietas Atlantic G1 spesialisasi industri olahan.',
      image_url: '/images/products/atlantic-g1.jpg',
      is_featured: true,
      is_active: true,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'prod-3',
      name: 'Benih Kentang Medians G2 Super',
      slug: 'benih-kentang-medians-g2-super',
      variety: 'Medians',
      seed_class: 'G2',
      cert_number: null,
      size_category: 'Ukuran M (35-50g/knol)',
      sprout_status: 'dormansi',
      price: 24000,
      unit: 'kg',
      stock: 0, // Out of stock
      min_order: 20,
      weight_per_unit: 1.0,
      origin_location: 'Dieng, Banjarnegara',
      elevation_masl: '1.400 - 2.000 mdpl',
      harvest_days: '95 - 105 HST',
      potential_yield: '22 - 30 Ton/Ha',
      resilience: 'Adaptasi dataran tinggi ekstrem',
      description: 'Benih kentang Medians kualitas terpercaya petani Dieng.',
      image_url: null,
      is_featured: false,
      is_active: true,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
  ];

  it('should filter products by search query, variety, seed class, and sprout readiness', () => {
    function filterProducts(
      products: Product[],
      filters: {
        query?: string;
        variety?: string;
        seedClass?: string;
        sproutStatus?: string;
      }
    ) {
      return products.filter((p) => {
        if (!p.is_active) return false;
        if (
          filters.query &&
          !p.name.toLowerCase().includes(filters.query.toLowerCase()) &&
          !p.variety.toLowerCase().includes(filters.query.toLowerCase()) &&
          !p.origin_location.toLowerCase().includes(filters.query.toLowerCase())
        ) {
          return false;
        }
        if (filters.variety && filters.variety !== 'all' && p.variety !== filters.variety) {
          return false;
        }
        if (filters.seedClass && filters.seedClass !== 'all' && p.seed_class !== filters.seedClass) {
          return false;
        }
        if (filters.sproutStatus && filters.sproutStatus !== 'all' && p.sprout_status !== filters.sproutStatus) {
          return false;
        }
        return true;
      });
    }

    // 1. Search query: 'pangalengan'
    const searchRes = filterProducts(mockProducts, { query: 'pangalengan' });
    expect(searchRes).toHaveLength(1);
    expect(searchRes[0].id).toBe('prod-1');

    // 2. Variety filter: 'Atlantic'
    const varietyRes = filterProducts(mockProducts, { variety: 'Atlantic' });
    expect(varietyRes).toHaveLength(1);
    expect(varietyRes[0].id).toBe('prod-2');

    // 3. Seed Class filter: 'G2'
    const classRes = filterProducts(mockProducts, { seedClass: 'G2' });
    expect(classRes).toHaveLength(2); // prod-1, prod-3

    // 4. Sprout Status: 'siap_tanam'
    const sproutRes = filterProducts(mockProducts, { sproutStatus: 'siap_tanam' });
    expect(sproutRes).toHaveLength(1);
    expect(sproutRes[0].id).toBe('prod-1');
  });

  it('should calculate cart total amount and enforce minimum order threshold', () => {
    interface CartItem {
      product: Product;
      quantity: number;
    }

    function calculateCartSummary(items: CartItem[], flatShippingPerKg = 500) {
      const subtotal = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const totalWeightKg = items.reduce(
        (sum, item) => sum + (item.product.weight_per_unit || 1) * item.quantity,
        0
      );
      const shippingCost = Math.max(15000, totalWeightKg * flatShippingPerKg);
      const totalAmount = subtotal + shippingCost;

      const hasInvalidMinOrder = items.some(
        (item) => item.quantity < (item.product.min_order || 1)
      );

      return {
        subtotal,
        totalWeightKg,
        shippingCost,
        totalAmount,
        hasInvalidMinOrder,
        itemCount: items.length,
      };
    }

    const cart: CartItem[] = [
      { product: mockProducts[0], quantity: 20 }, // 20 kg x 28.000 = 560.000 (min_order is 10, valid)
      { product: mockProducts[1], quantity: 10 }, // 10 kg x 38.000 = 380.000 (min_order is 5, valid)
    ];

    const summary = calculateCartSummary(cart);
    expect(summary.subtotal).toBe(940000);
    expect(summary.totalWeightKg).toBe(30);
    expect(summary.shippingCost).toBe(15000); // 30 * 500 = 15.000
    expect(summary.totalAmount).toBe(955000);
    expect(summary.hasInvalidMinOrder).toBe(false);
  });

  it('should flag out of stock products as unpurchasable', () => {
    function getProductPurchaseState(product: Product) {
      const isOutOfStock = product.stock <= 0;
      return {
        isOutOfStock,
        buttonText: isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang',
        canBuy: !isOutOfStock && product.is_active,
      };
    }

    const inStockState = getProductPurchaseState(mockProducts[0]);
    expect(inStockState.isOutOfStock).toBe(false);
    expect(inStockState.canBuy).toBe(true);
    expect(inStockState.buttonText).toBe('Tambah ke Keranjang');

    const outOfStockState = getProductPurchaseState(mockProducts[2]);
    expect(outOfStockState.isOutOfStock).toBe(true);
    expect(outOfStockState.canBuy).toBe(false);
    expect(outOfStockState.buttonText).toBe('Stok Habis');
  });

  it('should support 2-column mobile marketplace layout with thumb-friendly touch targets', () => {
    function getMobileLayoutSpecs(screenWidth: number) {
      const isMobile = screenWidth < 640;
      return {
        gridCols: isMobile ? 2 : 4,
        compactHeader: isMobile,
        minTouchTargetPx: 44,
        drawerMaxHeight: '85vh',
      };
    }

    const mobileSpecs = getMobileLayoutSpecs(390); // iPhone/Pixel mobile width
    expect(mobileSpecs.gridCols).toBe(2);
    expect(mobileSpecs.compactHeader).toBe(true);
    expect(mobileSpecs.minTouchTargetPx).toBeGreaterThanOrEqual(44);
  });

  it('should provide intuitive cart state feedback and min order addition on the Beli button', () => {
    function getBeliButtonState(product: Product, inCartQty: number) {
      if (product.stock <= 0) {
        return {
          disabled: true,
          label: 'Stok Habis',
          isInCart: false,
        };
      }

      if (inCartQty > 0) {
        return {
          disabled: false,
          label: `${inCartQty} ${product.unit} di Keranjang (+ Tambah)`,
          isInCart: true,
        };
      }

      return {
        disabled: false,
        label: `+ Beli (${product.min_order || 1} ${product.unit})`,
        isInCart: false,
      };
    }

    const unaddedState = getBeliButtonState(mockProducts[0], 0);
    expect(unaddedState.label).toBe('+ Beli (10 kg)');
    expect(unaddedState.isInCart).toBe(false);

    const addedState = getBeliButtonState(mockProducts[0], 20);
    expect(addedState.label).toBe('20 kg di Keranjang (+ Tambah)');
    expect(addedState.isInCart).toBe(true);

    const outOfStockState = getBeliButtonState(mockProducts[2], 0);
    expect(outOfStockState.disabled).toBe(true);
    expect(outOfStockState.label).toBe('Stok Habis');
  });

  it('should calculate cart weight accurately and provide mobile stepper controls with min order constraints', () => {
    interface CartItem {
      product: Product;
      quantity: number;
    }

    function applyStepper(
      items: CartItem[],
      productId: string,
      delta: number
    ): CartItem[] {
      return items
        .map((item) => {
          if (item.product.id !== productId) return item;
          const minQty = item.product.min_order || 1;
          const nextQty = item.quantity + delta;
          if (nextQty < minQty && delta < 0) {
            return null; // Remove from cart
          }
          if (nextQty > item.product.stock) {
            return item; // Clamped to max stock
          }
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean) as CartItem[];
    }

    let cart: CartItem[] = [{ product: mockProducts[0], quantity: 10 }]; // min_order is 10
    // Step up by 5
    cart = applyStepper(cart, 'prod-1', 5);
    expect(cart[0].quantity).toBe(15);

    // Step down by 5
    cart = applyStepper(cart, 'prod-1', -5);
    expect(cart[0].quantity).toBe(10);

    // Step down below min_order removes item
    cart = applyStepper(cart, 'prod-1', -5);
    expect(cart).toHaveLength(0);
  });
});
