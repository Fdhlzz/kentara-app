import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendNotificationAction } from '@/lib/notifications/notification-actions';
import { sanitizeString } from '@/lib/security/validation';
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/security/rate-limit';
import type { NotificationType, RecipientRole } from '@/types/notification';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`push-api:${clientIp}`, RATE_LIMIT_PRESETS.api);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan. Silakan coba beberapa saat lagi.' },
        { status: 429 }
      );
    }

    // 2. Authentication & Authorization Guard
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Autentikasi diperlukan.' },
        { status: 401 }
      );
    }

    // Check user profile for role authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const userRole = profile?.role || user.user_metadata?.role || 'petani';

    const body = await req.json();
    const title = sanitizeString(body.title, 150);
    const message = sanitizeString(body.message, 500);
    const rawRole = sanitizeString(body.recipient_role, 20) as RecipientRole;
    const rawType = sanitizeString(body.type, 30) as NotificationType;
    const targetUserId = body.user_id ? sanitizeString(body.user_id, 100) : null;
    const orderId = body.order_id ? sanitizeString(body.order_id, 100) : null;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Judul dan pesan notifikasi wajib diisi.' },
        { status: 400 }
      );
    }

    // Non-admin users are only allowed to send notifications targeted to themselves or system events
    let recipient_role: RecipientRole = 'all';
    if (userRole !== 'admin') {
      recipient_role = userRole as RecipientRole;
    } else if (['admin', 'petani', 'kurir', 'all'].includes(rawRole)) {
      recipient_role = rawRole;
    }

    const result = await sendNotificationAction({
      title,
      message,
      type: rawType || 'general',
      recipient_role,
      user_id: userRole === 'admin' ? targetUserId : user.id,
      order_id: orderId || null,
      data: body.data || null,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan sistem saat mengirim notifikasi.';
    console.error('[POST /api/notifications/push Error]:', msg);
    return NextResponse.json({ success: false, error: 'Gagal memproses permintaan notifikasi.' }, { status: 500 });
  }
}
