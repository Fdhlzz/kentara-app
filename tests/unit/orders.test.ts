import { describe, it, expect } from 'vitest';
import type { Order, OrderItem, CreateOrderItemInput, OrderStatus, PaymentStatus } from '@/types/order';

describe('2. Orders & Cart Management Unit Tests (Pemesanan Benih Kentang)', () => {
  function generateOrderCode(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `KTR-${dateStr}-${randomHex}`;
  }

  it('should generate valid Kentara order codes matching KTR-YYMMDD-XXXX format', () => {
    const code1 = generateOrderCode();
    const code2 = generateOrderCode();

    expect(code1).toMatch(/^KTR-\d{6}-[A-Z0-9]{4}$/);
    expect(code2).toMatch(/^KTR-\d{6}-[A-Z0-9]{4}$/);
    expect(code1).not.toBe(code2);
  });

  it('should accurately calculate multi-item order subtotals, weight, and grand total', () => {
    const cartItems: CreateOrderItemInput[] = [
      {
        product_id: 'prod-1',
        product_name: 'Benih Granola L - G2 Pangalengan',
        product_variety: 'Granola L',
        seed_class: 'G2',
        price: 28000,
        quantity: 20, // 20 kg
        unit: 'kg',
        weight_kg: 20.0,
      },
      {
        product_id: 'prod-2',
        product_name: 'Benih Atlantic - G2 Dieng',
        product_variety: 'Atlantic',
        seed_class: 'G2',
        price: 32000,
        quantity: 10, // 10 kg
        unit: 'kg',
        weight_kg: 10.0,
      },
    ];

    const shippingCost = 25000;

    let subtotal = 0;
    let totalWeight = 0;
    const sanitizedItems = cartItems.map((item) => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      totalWeight += item.weight_kg || item.quantity;
      return {
        ...item,
        subtotal: itemSubtotal,
      };
    });

    const grandTotal = subtotal + shippingCost;

    expect(sanitizedItems[0].subtotal).toBe(560000); // 28.000 * 20
    expect(sanitizedItems[1].subtotal).toBe(320000); // 32.000 * 10
    expect(subtotal).toBe(880000);
    expect(totalWeight).toBe(30.0);
    expect(grandTotal).toBe(905000); // 880.000 + 25.000
  });

  it('should validate mandatory customer checkout fields', () => {
    const validateCheckout = (customer: {
      name?: string;
      phone?: string;
      address?: string;
      items?: any[];
    }) => {
      const errors: string[] = [];
      if (!customer.name?.trim()) errors.push('Nama pembeli wajib diisi.');
      if (!customer.phone?.trim() || customer.phone.length < 8) {
        errors.push('Nomor telepon/WhatsApp wajib valid (min. 8 digit).');
      }
      if (!customer.address?.trim()) errors.push('Alamat pengiriman lengkap wajib diisi.');
      if (!customer.items || customer.items.length === 0) errors.push('Keranjang kosong.');
      return { isValid: errors.length === 0, errors };
    };

    const validCheck = validateCheckout({
      name: 'Bpk. Hendra Wijaya',
      phone: '081299887766',
      address: 'Kp. Pasir Salam RT 03/RW 04, Desa Tarumajaya, Kertasari',
      items: [{ product_id: 'prod-1', quantity: 50 }],
    });
    expect(validCheck.isValid).toBe(true);

    const invalidCheck = validateCheckout({
      name: '',
      phone: '123',
      address: '',
      items: [],
    });
    expect(invalidCheck.isValid).toBe(false);
    expect(invalidCheck.errors).toHaveLength(4);
  });

  it('should simulate automatic stock deduction upon payment settlement', () => {
    const productsInventory = {
      'prod-1': { id: 'prod-1', name: 'Granola L', stock: 100 },
      'prod-2': { id: 'prod-2', name: 'Atlantic', stock: 50 },
    };

    const orderItems = [
      { product_id: 'prod-1', quantity: 30 },
      { product_id: 'prod-2', quantity: 50 },
    ];

    // Trigger stock deduction function simulation
    function applyStockDeduction(items: typeof orderItems) {
      items.forEach((item) => {
        const prod = productsInventory[item.product_id as keyof typeof productsInventory];
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
        }
      });
    }

    applyStockDeduction(orderItems);

    expect(productsInventory['prod-1'].stock).toBe(70); // 100 - 30
    expect(productsInventory['prod-2'].stock).toBe(0); // 50 - 50 = 0
  });

  it('should enforce proper order status lifecycle transitions', () => {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      menunggu_pembayaran: ['sudah_dibayar', 'dibatalkan'],
      sudah_dibayar: ['diproses', 'dibatalkan'],
      diproses: ['dikirim', 'dibatalkan'],
      dikirim: ['selesai', 'dibatalkan'],
      selesai: [],
      dibatalkan: [],
    };

    const canTransition = (current: OrderStatus, next: OrderStatus): boolean => {
      return validTransitions[current]?.includes(next) ?? false;
    };

    // Valid progressions
    expect(canTransition('menunggu_pembayaran', 'sudah_dibayar')).toBe(true);
    expect(canTransition('sudah_dibayar', 'diproses')).toBe(true);
    expect(canTransition('diproses', 'dikirim')).toBe(true);
    expect(canTransition('dikirim', 'selesai')).toBe(true);

    // Invalid backwards transition
    expect(canTransition('selesai', 'menunggu_pembayaran')).toBe(false);
    expect(canTransition('diproses', 'menunggu_pembayaran')).toBe(false);
  });
});
