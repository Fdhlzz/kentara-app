'use server';

import { createClient } from '@/lib/supabase/server';
import type { CourierLocationInput, CourierLocationRecord } from '@/types/maps';

/**
 * Server Action: Upsert live GPS coordinates for courier
 * High-performance 1:1 row per courier to avoid database bloat
 */
export async function upsertCourierLocationAction(
  input: CourierLocationInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesi kurir tidak valid.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role;
    if (role !== 'kurir' && role !== 'admin') {
      return { success: false, error: 'Akses ditolak: Hanya akun kurir yang dapat memperbarui lokasi pengantaran.' };
    }

    const { validateCoordinates } = await import('@/lib/security/validation');

    const {
      order_id = null,
      latitude,
      longitude,
      heading = 0,
      speed = 0,
      accuracy = null,
      is_active = true,
    } = input;

    // Validate coordinates range
    const coordCheck = validateCoordinates(latitude, longitude);
    if (!coordCheck.valid || coordCheck.lat === undefined || coordCheck.lng === undefined) {
      return { success: false, error: coordCheck.error || 'Koordinat GPS di luar rentang valid.' };
    }

    const now = new Date().toISOString();

    const { error } = await supabase.from('courier_locations').upsert(
      {
        courier_id: user.id,
        order_id,
        latitude: coordCheck.lat,
        longitude: coordCheck.lng,
        heading: Math.max(0, Math.min(360, Number(heading || 0))),
        speed: Math.max(0, Math.min(300, Number(speed || 0))),
        accuracy: accuracy ? Math.max(0, Number(accuracy)) : null,
        is_active,
        updated_at: now,
      },
      { onConflict: 'courier_id' }
    );

    if (error) {
      console.error('[upsertCourierLocationAction Error]:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal memperbarui lokasi kurir.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action: Get latest live courier location for an order
 */
export async function getCourierLocationByOrderAction(
  orderId: string
): Promise<CourierLocationRecord | null> {
  try {
    const supabase = await createClient();

    // 1. Check direct match by order_id
    const { data: directLoc, error: directErr } = await supabase
      .from('courier_locations')
      .select('*')
      .eq('order_id', orderId)
      .eq('is_active', true)
      .maybeSingle();

    if (!directErr && directLoc) {
      return directLoc as CourierLocationRecord;
    }

    // 2. Fallback: Lookup courier_id from order
    const { data: order } = await supabase
      .from('orders')
      .select('courier_id')
      .eq('id', orderId)
      .single();

    if (order?.courier_id) {
      const { data: courierLoc } = await supabase
        .from('courier_locations')
        .select('*')
        .eq('courier_id', order.courier_id)
        .eq('is_active', true)
        .maybeSingle();

      if (courierLoc) {
        return courierLoc as CourierLocationRecord;
      }
    }

    return null;
  } catch (err) {
    console.error('[getCourierLocationByOrderAction Error]:', err);
    return null;
  }
}

/**
 * Server Action: Deactivate location tracking when delivery finishes or courier stops
 */
export async function deactivateCourierLocationAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    await supabase
      .from('courier_locations')
      .update({
        is_active: false,
        order_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('courier_id', user.id);

    return { success: true };
  } catch {
    return { success: false };
  }
}
