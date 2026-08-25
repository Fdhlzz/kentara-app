'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import {
  getUserCartAction,
  addToUserCartAction,
  updateUserCartQtyAction,
  removeFromUserCartAction,
  clearUserCartAction,
  syncGuestCartToDatabaseAction,
} from '@/lib/cart/cart-actions';
import type { CartItem, GuestCartItem } from '@/types/cart';
import type { Product } from '@/types/product';

const GUEST_CART_KEY = 'kentara_guest_cart';

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  totalWeightKg: number;
  estimatedShipping: number;
  grandTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQty: (productId: string, delta: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemQty: (productId: string) => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
  initialItems?: CartItem[];
  isLoggedIn?: boolean;
}

export function CartProvider({
  children,
  initialItems = [],
  isLoggedIn = false,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Initial Client-side Sync and Fetch
  useEffect(() => {
    let isMounted = true;

    async function initCart() {
      if (typeof window === 'undefined') return;

      if (isLoggedIn) {
        // Check if there is guest cart in localStorage to push into database
        const guestStorage = localStorage.getItem(GUEST_CART_KEY);
        if (guestStorage) {
          try {
            const parsedGuest: GuestCartItem[] = JSON.parse(guestStorage);
            if (Array.isArray(parsedGuest) && parsedGuest.length > 0) {
              await syncGuestCartToDatabaseAction(parsedGuest);
              localStorage.removeItem(GUEST_CART_KEY);
            }
          } catch (e) {
            console.error('[Guest Cart Sync Error]:', e);
          }
        }

        // Fetch fresh database cart items
        try {
          const dbItems = await getUserCartAction();
          if (isMounted) {
            setItems(dbItems);
          }
        } catch (err) {
          console.error('[CartProvider fetch error]:', err);
        }
      } else {
        // Guest mode: Read from localStorage
        const guestStorage = localStorage.getItem(GUEST_CART_KEY);
        if (guestStorage) {
          try {
            const parsed = JSON.parse(guestStorage);
            if (Array.isArray(parsed) && isMounted) {
              setItems(parsed);
            }
          } catch (e) {
            console.error('[Guest Cart Parse Error]:', e);
          }
        }
      }
    }

    initCart();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // 2. Add to Cart Handler
  const addToCart = useCallback(
    async (product: Product, quantity?: number) => {
      if (!product || product.stock <= 0) {
        toast.error('Stok benih ini sedang habis.');
        return;
      }

      const defaultQty = quantity || product.min_order || 1;

      // Optimistic update
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === product.id);
        let updated: CartItem[];
        if (existing) {
          const newQty = Math.min(product.stock, existing.quantity + defaultQty);
          updated = prev.map((i) =>
            i.product_id === product.id ? { ...i, quantity: newQty } : i
          );
        } else {
          updated = [
            ...prev,
            {
              product_id: product.id,
              quantity: Math.min(product.stock, defaultQty),
              product,
            },
          ];
        }

        if (!isLoggedIn && typeof window !== 'undefined') {
          const guestData: GuestCartItem[] = updated.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          }));
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestData));
        }

        return updated;
      });

      toast.success(`${product.name} dimasukkan ke keranjang`, {
        description: `+${defaultQty} ${product.unit} berhasil ditambahkan.`,
        action: {
          label: 'Buka Keranjang',
          onClick: () => setIsCartOpen(true),
        },
      });

      // If logged in, push to database
      if (isLoggedIn) {
        try {
          await addToUserCartAction(product.id, defaultQty);
        } catch (err) {
          console.error('[addToCart Database Error]:', err);
        }
      }
    },
    [isLoggedIn]
  );

  // 3. Update Quantity Handler
  const updateQty = useCallback(
    async (productId: string, delta: number) => {
      let finalNewQty = 0;
      let shouldRemove = false;

      setItems((prev) => {
        const target = prev.find((i) => i.product_id === productId);
        if (!target) return prev;

        const minQty = target.product?.min_order || 1;
        const newQty = target.quantity + delta;

        if (newQty < minQty && delta < 0) {
          shouldRemove = true;
          const filtered = prev.filter((i) => i.product_id !== productId);
          if (!isLoggedIn && typeof window !== 'undefined') {
            const guestData: GuestCartItem[] = filtered.map((i) => ({
              product_id: i.product_id,
              quantity: i.quantity,
            }));
            localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestData));
          }
          return filtered;
        }

        if (newQty > target.product.stock) {
          toast.warning(`Maksimal stok tersedia hanya ${target.product.stock} ${target.product.unit}`);
          return prev;
        }

        finalNewQty = newQty;
        const updated = prev.map((i) =>
          i.product_id === productId ? { ...i, quantity: newQty } : i
        );

        if (!isLoggedIn && typeof window !== 'undefined') {
          const guestData: GuestCartItem[] = updated.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          }));
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestData));
        }

        return updated;
      });

      // Database sync
      if (isLoggedIn) {
        try {
          if (shouldRemove) {
            await removeFromUserCartAction(productId);
          } else if (finalNewQty > 0) {
            await updateUserCartQtyAction(productId, finalNewQty);
          }
        } catch (err) {
          console.error('[updateQty Database Error]:', err);
        }
      }
    },
    [isLoggedIn]
  );

  // 4. Remove from Cart Handler
  const removeFromCart = useCallback(
    async (productId: string) => {
      setItems((prev) => {
        const filtered = prev.filter((i) => i.product_id !== productId);
        if (!isLoggedIn && typeof window !== 'undefined') {
          const guestData: GuestCartItem[] = filtered.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          }));
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestData));
        }
        return filtered;
      });

      toast.info('Item dihapus dari keranjang.');

      if (isLoggedIn) {
        try {
          await removeFromUserCartAction(productId);
        } catch (err) {
          console.error('[removeFromCart Database Error]:', err);
        }
      }
    },
    [isLoggedIn]
  );

  // 5. Clear Cart Handler
  const clearCart = useCallback(async () => {
    setItems([]);
    if (!isLoggedIn && typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    toast.info('Keranjang telah dikosongkan.');

    if (isLoggedIn) {
      try {
        await clearUserCartAction();
      } catch (err) {
        console.error('[clearCart Database Error]:', err);
      }
    }
  }, [isLoggedIn]);

  // 6. Helper: Get Item Quantity
  const getItemQty = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.product_id === productId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  // 7. Computed Totals
  const totalCount = useMemo(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, i) => sum + (i.product?.price || 0) * i.quantity,
      0
    );
  }, [items]);

  const totalWeightKg = useMemo(() => {
    return items.reduce(
      (sum, i) => sum + (i.product?.weight_per_unit || 1) * i.quantity,
      0
    );
  }, [items]);

  const estimatedShipping = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.max(20000, Math.round(totalWeightKg * 500));
  }, [items.length, totalWeightKg]);

  const grandTotal = subtotal + estimatedShipping;

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotal,
        totalWeightKg,
        estimatedShipping,
        grandTotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        getItemQty,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
