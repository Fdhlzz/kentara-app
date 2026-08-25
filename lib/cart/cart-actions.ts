'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { CartItem, GuestCartItem } from '@/types/cart';
import type { Product } from '@/types/product';

/**
 * Mengambil daftar item keranjang belanja untuk pengguna yang sedang login dari database
 */
export async function getUserCartAction(): Promise<CartItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        user_id,
        product_id,
        quantity,
        created_at,
        updated_at,
        product:products(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.error('[getUserCartAction Error]:', error);
      return [];
    }

    // Filter out items where product no longer exists or is inactive
    const validItems = data
      .filter((item: any) => item.product && item.product.is_active)
      .map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: Number(item.quantity),
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: item.product as Product,
      }));

    return validItems;
  } catch (err) {
    console.error('[getUserCartAction Exception]:', err);
    return [];
  }
}

/**
 * Menambahkan atau mengupdate item ke keranjang database pengguna
 */
export async function addToUserCartAction(
  productId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User tidak terautentikasi' };
    }

    // 1. Check existing item in database
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    // 2. Fetch product stock & min_order
    const { data: product } = await supabase
      .from('products')
      .select('stock, min_order')
      .eq('id', productId)
      .single();

    if (!product || product.stock <= 0) {
      return { success: false, error: 'Stok produk habis' };
    }

    if (existing) {
      const newQty = Math.min(product.stock, existing.quantity + quantity);
      const { error: updateErr } = await supabase
        .from('cart_items')
        .update({
          quantity: newQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateErr) return { success: false, error: updateErr.message };
    } else {
      const initialQty = Math.min(product.stock, Math.max(product.min_order || 1, quantity));
      const { error: insertErr } = await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: productId,
        quantity: initialQty,
      });

      if (insertErr) return { success: false, error: insertErr.message };
    }

    revalidatePath('/petani');
    return { success: true };
  } catch (err: any) {
    console.error('[addToUserCartAction Exception]:', err);
    return { success: false, error: err?.message || 'Gagal menambahkan ke keranjang' };
  }
}

/**
 * Mengubah jumlah kuantitas item keranjang di database
 */
export async function updateUserCartQtyAction(
  productId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User tidak terautentikasi' };
    }

    if (quantity <= 0) {
      return removeFromUserCartAction(productId);
    }

    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/petani');
    return { success: true };
  } catch (err: any) {
    console.error('[updateUserCartQtyAction Exception]:', err);
    return { success: false, error: err?.message || 'Gagal mengubah kuantitas' };
  }
}

/**
 * Menghapus satu item dari keranjang database
 */
export async function removeFromUserCartAction(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User tidak terautentikasi' };
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/petani');
    return { success: true };
  } catch (err: any) {
    console.error('[removeFromUserCartAction Exception]:', err);
    return { success: false, error: err?.message || 'Gagal menghapus item' };
  }
}

/**
 * Mengosongkan seluruh isi keranjang database pengguna
 */
export async function clearUserCartAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User tidak terautentikasi' };
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/petani');
    return { success: true };
  } catch (err: any) {
    console.error('[clearUserCartAction Exception]:', err);
    return { success: false, error: err?.message || 'Gagal mengosongkan keranjang' };
  }
}

/**
 * Mendorong / Menggabungkan item keranjang dari localStorage guest ke database saat login/daftar
 */
export async function syncGuestCartToDatabaseAction(
  guestItems: GuestCartItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !Array.isArray(guestItems) || guestItems.length === 0) {
      return { success: true };
    }

    for (const g of guestItems) {
      if (!g.product_id || g.quantity <= 0) continue;

      // Check existing item
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', g.product_id)
        .maybeSingle();

      const { data: prod } = await supabase
        .from('products')
        .select('stock, min_order, is_active')
        .eq('id', g.product_id)
        .single();

      if (!prod || !prod.is_active || prod.stock <= 0) continue;

      if (existing) {
        const mergedQty = Math.min(prod.stock, existing.quantity + g.quantity);
        await supabase
          .from('cart_items')
          .update({
            quantity: mergedQty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        const initialQty = Math.min(prod.stock, Math.max(prod.min_order || 1, g.quantity));
        await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: g.product_id,
          quantity: initialQty,
        });
      }
    }

    revalidatePath('/petani');
    return { success: true };
  } catch (err: any) {
    console.error('[syncGuestCartToDatabaseAction Exception]:', err);
    return { success: false, error: err?.message || 'Gagal sinkronisasi keranjang' };
  }
}
