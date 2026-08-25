'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  Product,
  AdminProductStats,
  ProductActionResult,
} from '@/types/product';

/**
 * Generate URL-friendly slug from product name
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

/**
 * Ensure user is authenticated as admin
 */
async function verifyAdminRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Autentikasi diperlukan. Silakan login kembali.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Akses ditolak. Tindakan ini hanya untuk administrator.');
  }

  return { supabase, user };
}

/**
 * Mengambil ringkasan statistik produk benih kentang
 */
export async function getAdminProductStats(): Promise<AdminProductStats> {
  try {
    const supabase = await createClient();
    const { data: rpcStats, error } = await supabase.rpc('admin_get_product_stats');

    if (!error && rpcStats) {
      return {
        totalProducts: Number(rpcStats.totalProducts || 0),
        activeProducts: Number(rpcStats.activeProducts || 0),
        lowStockProducts: Number(rpcStats.lowStockProducts || 0),
        outOfStockProducts: Number(rpcStats.outOfStockProducts || 0),
        featuredProducts: Number(rpcStats.featuredProducts || 0),
        totalStockKg: Number(rpcStats.totalStockKg || 0),
        totalStockKnol: Number(rpcStats.totalStockKnol || 0),
      };
    }

    // Fallback if RPC is not available
    const { data: products, error: queryError } = await supabase
      .from('products')
      .select('is_active, is_featured, stock, unit');

    if (queryError || !products) {
      return {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        featuredProducts: 0,
        totalStockKg: 0,
        totalStockKnol: 0,
      };
    }

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.is_active).length,
      lowStockProducts: products.filter((p) => p.is_active && p.stock <= 50 && p.stock > 0).length,
      outOfStockProducts: products.filter((p) => p.is_active && p.stock === 0).length,
      featuredProducts: products.filter((p) => p.is_featured).length,
      totalStockKg: products
        .filter((p) => p.unit === 'kg')
        .reduce((sum, p) => sum + (p.stock || 0), 0),
      totalStockKnol: products
        .filter((p) => p.unit === 'knol')
        .reduce((sum, p) => sum + (p.stock || 0), 0),
    };
  } catch (err) {
    console.error('[getAdminProductStats Error]:', err);
    return {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      featuredProducts: 0,
      totalStockKg: 0,
      totalStockKnol: 0,
    };
  }
}

/**
 * Mengambil seluruh daftar produk benih kentang untuk Admin
 */
export async function getAdminProductsList(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[getAdminProductsList Error]:', error);
      return [];
    }

    return data as Product[];
  } catch (err) {
    console.error('[getAdminProductsList Error]:', err);
    return [];
  }
}

/**
 * Server Action: Tambah Benih Kentang Baru
 */
export async function createProductAction(formData: FormData): Promise<ProductActionResult> {
  try {
    const { supabase } = await verifyAdminRole();

    const name = String(formData.get('name') || '').trim();
    const variety = String(formData.get('variety') || '').trim();
    const seed_class = String(formData.get('seed_class') || '').trim();
    const cert_number = String(formData.get('cert_number') || '').trim() || null;
    const size_category = String(formData.get('size_category') || 'M (30-50g)').trim();
    const sprout_status = String(formData.get('sprout_status') || 'siap_tanam').trim();
    const price = Number(formData.get('price') || 0);
    const unit = String(formData.get('unit') || 'kg').trim();
    const stock = Number(formData.get('stock') || 0);
    const min_order = Number(formData.get('min_order') || 1);
    const weight_per_unit = Number(formData.get('weight_per_unit') || 1.0);
    const origin_location = String(formData.get('origin_location') || '').trim();
    const elevation_masl = String(formData.get('elevation_masl') || '').trim() || null;
    const harvest_days = String(formData.get('harvest_days') || '').trim() || null;
    const potential_yield = String(formData.get('potential_yield') || '').trim() || null;
    const resilience = String(formData.get('resilience') || '').trim() || null;
    const description = String(formData.get('description') || '').trim() || null;
    const image_url = String(formData.get('image_url') || '').trim() || null;
    const is_featured = formData.get('is_featured') === 'true' || formData.get('is_featured') === 'on';
    const is_active = formData.get('is_active') === 'true' || formData.get('is_active') === 'on';

    if (!name) return { success: false, error: 'Nama produk benih kentang wajib diisi.' };
    if (!variety) return { success: false, error: 'Varietas benih kentang wajib dipilih/diisi.' };
    if (!seed_class) return { success: false, error: 'Kelas generasi benih (G0-G4) wajib dipilih.' };
    if (price < 0 || isNaN(price)) return { success: false, error: 'Harga produk tidak valid.' };
    if (stock < 0 || isNaN(stock)) return { success: false, error: 'Jumlah stok tidak valid.' };
    if (!origin_location) return { success: false, error: 'Asal daerah penangkaran benih wajib diisi.' };

    // Create unique slug
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = `benih-kentang-${Date.now()}`;
    let finalSlug = baseSlug;

    // Check slug collision
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (existing) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { data: inserted, error: insertError } = await supabase
      .from('products')
      .insert({
        name,
        slug: finalSlug,
        variety,
        seed_class,
        cert_number,
        size_category,
        sprout_status,
        price,
        unit,
        stock,
        min_order: Math.max(1, min_order),
        weight_per_unit,
        origin_location,
        elevation_masl,
        harvest_days,
        potential_yield,
        resilience,
        description,
        image_url,
        is_featured,
        is_active,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error('[createProductAction Error]:', insertError);
      return { success: false, error: insertError?.message || 'Gagal menambahkan benih kentang baru.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true, product: inserted as Product };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Ubah Data Benih Kentang
 */
export async function updateProductAction(
  id: string,
  formData: FormData
): Promise<ProductActionResult> {
  try {
    const { supabase } = await verifyAdminRole();

    if (!id) return { success: false, error: 'ID produk tidak ditemukan.' };

    const name = String(formData.get('name') || '').trim();
    const variety = String(formData.get('variety') || '').trim();
    const seed_class = String(formData.get('seed_class') || '').trim();
    const cert_number = String(formData.get('cert_number') || '').trim() || null;
    const size_category = String(formData.get('size_category') || 'M (30-50g)').trim();
    const sprout_status = String(formData.get('sprout_status') || 'siap_tanam').trim();
    const price = Number(formData.get('price') || 0);
    const unit = String(formData.get('unit') || 'kg').trim();
    const stock = Number(formData.get('stock') || 0);
    const min_order = Number(formData.get('min_order') || 1);
    const weight_per_unit = Number(formData.get('weight_per_unit') || 1.0);
    const origin_location = String(formData.get('origin_location') || '').trim();
    const elevation_masl = String(formData.get('elevation_masl') || '').trim() || null;
    const harvest_days = String(formData.get('harvest_days') || '').trim() || null;
    const potential_yield = String(formData.get('potential_yield') || '').trim() || null;
    const resilience = String(formData.get('resilience') || '').trim() || null;
    const description = String(formData.get('description') || '').trim() || null;
    const image_url = String(formData.get('image_url') || '').trim() || null;
    const is_featured = formData.get('is_featured') === 'true' || formData.get('is_featured') === 'on';
    const is_active = formData.get('is_active') === 'true' || formData.get('is_active') === 'on';

    if (!name) return { success: false, error: 'Nama produk benih kentang wajib diisi.' };
    if (!variety) return { success: false, error: 'Varietas benih kentang wajib diisi.' };
    if (!seed_class) return { success: false, error: 'Kelas generasi benih wajib dipilih.' };
    if (price < 0 || isNaN(price)) return { success: false, error: 'Harga produk tidak valid.' };
    if (stock < 0 || isNaN(stock)) return { success: false, error: 'Jumlah stok tidak valid.' };
    if (!origin_location) return { success: false, error: 'Asal lokasi penangkaran wajib diisi.' };

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        name,
        variety,
        seed_class,
        cert_number,
        size_category,
        sprout_status,
        price,
        unit,
        stock,
        min_order: Math.max(1, min_order),
        weight_per_unit,
        origin_location,
        elevation_masl,
        harvest_days,
        potential_yield,
        resilience,
        description,
        image_url,
        is_featured,
        is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('[updateProductAction Error]:', updateError);
      return { success: false, error: updateError?.message || 'Gagal memperbarui data benih kentang.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true, product: updated as Product };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Hapus Produk Benih Kentang
 */
export async function deleteProductAction(id: string): Promise<ProductActionResult> {
  try {
    const { supabase } = await verifyAdminRole();

    if (!id) return { success: false, error: 'ID produk tidak ditemukan.' };

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      console.error('[deleteProductAction Error]:', error);
      return { success: false, error: error.message || 'Gagal menghapus produk benih kentang.' };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Toggle Status Aktif/Non-Aktif Produk
 */
export async function toggleProductActiveAction(
  id: string,
  is_active: boolean
): Promise<ProductActionResult> {
  try {
    const { supabase } = await verifyAdminRole();

    const { data: updated, error } = await supabase
      .from('products')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true, product: updated as Product };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui status aktif.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Toggle Status Featured / Produk Pilihan
 */
export async function toggleProductFeaturedAction(
  id: string,
  is_featured: boolean
): Promise<ProductActionResult> {
  try {
    const { supabase } = await verifyAdminRole();

    const { data: updated, error } = await supabase
      .from('products')
      .update({ is_featured })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true, product: updated as Product };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui status unggulan.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Cepat Update Stok Produk
 */
export async function updateProductStockAction(
  id: string,
  stock: number
): Promise<ProductActionResult> {
  try {
    const { supabase } = await verifyAdminRole();

    if (stock < 0 || isNaN(stock)) {
      return { success: false, error: 'Jumlah stok tidak boleh bernilai negatif.' };
    }

    const { data: updated, error } = await supabase
      .from('products')
      .update({ stock })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/products');
    revalidatePath('/');

    return { success: true, product: updated as Product };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui stok.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Unggah Gambar Produk ke Supabase Storage (Bucket: product-images)
 */
export async function uploadProductImageAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; publicUrl?: string }> {
  try {
    const { supabase } = await verifyAdminRole();

    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: 'File gambar tidak ditemukan.' };
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'Ukuran file gambar maksimal 5MB.' };
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Format gambar tidak didukung. Gunakan file JPEG, PNG, atau WEBP.',
      };
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = slugify(file.name.replace(/\.[^/.]+$/, ''));
    const filePath = `potato-seeds/${Date.now()}-${cleanFileName}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[uploadProductImageAction Error]:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Gagal mengunggah gambar ke Supabase Storage.',
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath);

    return { success: true, publicUrl };
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengunggah gambar.';
    return { success: false, error: msg };
  }
}

