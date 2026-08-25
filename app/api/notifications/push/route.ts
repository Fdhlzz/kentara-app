import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendNotificationAction } from '@/lib/notifications/notification-actions';
import type { NotificationType, RecipientRole } from '@/types/notification';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, type, recipient_role, user_id, order_id, data } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const result = await sendNotificationAction({
      title,
      message,
      type: (type as NotificationType) || 'general',
      recipient_role: (recipient_role as RecipientRole) || 'all',
      user_id: user_id || null,
      order_id: order_id || null,
      data: data || null,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal notification push error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
