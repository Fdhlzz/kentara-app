export type NotificationType =
  | 'new_order'
  | 'courier_task'
  | 'order_success'
  | 'payment_success'
  | 'order_delivered'
  | 'general';

export type RecipientRole = 'admin' | 'kurir' | 'petani' | 'all';

export interface AppNotification {
  id: string;
  user_id?: string | null;
  recipient_role: RecipientRole | string;
  title: string;
  message: string;
  type: NotificationType | string;
  order_id?: string | null;
  data?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface SendNotificationInput {
  title: string;
  message: string;
  type: NotificationType;
  recipient_role?: RecipientRole;
  user_id?: string | null;
  order_id?: string | null;
  data?: Record<string, any>;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
