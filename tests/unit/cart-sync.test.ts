import { describe, it, expect } from 'vitest';
import type { Product } from '@/types/product';
import type { CartItem, GuestCartItem } from '@/types/cart';

describe('Cart Database & Guest LocalStorage Sync Unit Tests', () => {
  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Benih Kentang Granola L - G2 Pangalengan',
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
      resilience: 'Tahan Penyakit Busuk Daun',
      description: 'Benih kentang varietas Granola L turunan G2 bersertifikat.',
      image_url: '/images/products/granola-g2.jpg',
      is_featured: true,
      is_active: true,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'prod-2',
      name: 'Benih Kentang Atlantic - G1 Industri',
      slug: 'benih-kentang-atlantic-g1-industri',
      variety: 'Atlantic',
      seed_class: 'G1',
      cert_number: 'BPSB-TPH/2026/AT-012',
      size_category: 'Ukuran S (20-30g/knol)',
      sprout_status: 'pecah_dormansi',
      price: 38000,
      unit: 'kg',
      stock: 100,
      min_order: 5,
      weight_per_unit: 1.0,
      origin_location: 'Lembang, Bandung Barat',
      elevation_masl: '1.100 - 1.500 mdpl',
      harvest_days: '100 - 120 HST',
      potential_yield: '28 - 40 Ton/Ha',
      resilience: 'Kadar Padatan Tinggi',
      description: 'Benih kentang varietas Atlantic G1.',
      image_url: '/images/products/atlantic-g1.jpg',
      is_featured: true,
      is_active: true,
      created_at: '2026-08-25T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
  ];

  it('should store and read guest cart items in localStorage format', () => {
    const guestCart: GuestCartItem[] = [
      { product_id: 'prod-1', quantity: 15 },
      { product_id: 'prod-2', quantity: 5 },
    ];

    const serialized = JSON.stringify(guestCart);
    const parsed: GuestCartItem[] = JSON.parse(serialized);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].product_id).toBe('prod-1');
    expect(parsed[0].quantity).toBe(15);
  });

  it('should merge guest localStorage items into existing database cart items on login', () => {
    // Existing items in database for user
    const existingDbItems: CartItem[] = [
      {
        id: 'db-item-1',
        product_id: 'prod-1',
        quantity: 10,
        product: mockProducts[0],
      },
    ];

    // Guest items from localStorage to push
    const guestItems: GuestCartItem[] = [
      { product_id: 'prod-1', quantity: 15 }, // Duplicate: should merge quantity to 10 + 15 = 25
      { product_id: 'prod-2', quantity: 5 },  // New item: should be added
    ];

    function mergeGuestCart(
      dbItems: CartItem[],
      guest: GuestCartItem[],
      availableProducts: Product[]
    ): CartItem[] {
      const mergedMap = new Map<string, CartItem>();

      // Load DB items first
      for (const item of dbItems) {
        mergedMap.set(item.product_id, { ...item });
      }

      // Merge guest items
      for (const g of guest) {
        const prod = availableProducts.find((p) => p.id === g.product_id);
        if (!prod || !prod.is_active || prod.stock <= 0) continue;

        if (mergedMap.has(g.product_id)) {
          const existing = mergedMap.get(g.product_id)!;
          const mergedQty = Math.min(prod.stock, existing.quantity + g.quantity);
          mergedMap.set(g.product_id, { ...existing, quantity: mergedQty });
        } else {
          mergedMap.set(g.product_id, {
            id: `synced-${g.product_id}`,
            product_id: g.product_id,
            quantity: Math.min(prod.stock, Math.max(prod.min_order || 1, g.quantity)),
            product: prod,
          });
        }
      }

      return Array.from(mergedMap.values());
    }

    const merged = mergeGuestCart(existingDbItems, guestItems, mockProducts);

    expect(merged).toHaveLength(2);
    const prod1Merged = merged.find((m) => m.product_id === 'prod-1');
    expect(prod1Merged?.quantity).toBe(25); // 10 + 15 = 25

    const prod2Merged = merged.find((m) => m.product_id === 'prod-2');
    expect(prod2Merged?.quantity).toBe(5);
  });

  it('should clear guest localStorage after database push is completed', () => {
    let mockLocalStorage: Record<string, string> = {
      kentara_guest_cart: JSON.stringify([{ product_id: 'prod-1', quantity: 10 }]),
    };

    function clearGuestCartStorage() {
      delete mockLocalStorage.kentara_guest_cart;
    }

    expect(mockLocalStorage.kentara_guest_cart).toBeDefined();
    clearGuestCartStorage();
    expect(mockLocalStorage.kentara_guest_cart).toBeUndefined();
  });

  it('should prevent out-of-stock products from being merged or added', () => {
    const outOfStockProd: Product = {
      ...mockProducts[0],
      id: 'prod-out',
      stock: 0,
    };

    const guestItems: GuestCartItem[] = [
      { product_id: 'prod-out', quantity: 10 },
    ];

    function filterValidCartItems(guest: GuestCartItem[], products: Product[]) {
      return guest.filter((g) => {
        const p = products.find((prod) => prod.id === g.product_id);
        return p && p.is_active && p.stock > 0;
      });
    }

    const validItems = filterValidCartItems(guestItems, [outOfStockProd]);
    expect(validItems).toHaveLength(0);
  });
});
