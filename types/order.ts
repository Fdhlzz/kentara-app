export type OrderStatus =
  | 'menunggu_pembayaran'
  | 'sudah_dibayar'
  | 'diproses'
  | 'dikirim'
  | 'selesai'
  | 'dibatalkan';

export type PaymentStatus =
  | 'pending'
  | 'settlement'
  | 'paid'
  | 'capture'
  | 'expire'
  | 'cancel'
  | 'deny'
  | 'failed';

export interface OrderItem {
  id?: string;
  product_id?: string | null;
  product_name: string;
  product_variety?: string | null;
  seed_class?: string | null;
  price: number;
  quantity: number;
  unit: string;
  weight_kg: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_code: string;
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: string;
  shipping_city?: string | null;
  notes?: string | null;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  payment_gateway: string;
  payment_status: PaymentStatus | string;
  payment_method?: string | null;
  midtrans_snap_token?: string | null;
  midtrans_transaction_id?: string | null;
  order_status: OrderStatus | string;
  courier_id?: string | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  courier_assigned_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface AdminOrderStats {
  totalOrders: number;
  pendingPaymentOrders: number;
  paidOrders: number;
  inDeliveryOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface CreateOrderItemInput {
  product_id?: string;
  product_name: string;
  product_variety?: string;
  seed_class?: string;
  price: number;
  quantity: number;
  unit?: string;
  weight_kg?: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  shipping_city?: string;
  notes?: string;
  shipping_cost?: number;
  payment_method_type?: 'gateway' | 'cash';
  payment_method_detail?: string;
  items: CreateOrderItemInput[];
}

export interface OrderActionResult {
  success: boolean;
  error?: string;
  order?: Order;
  snapToken?: string;
  redirectUrl?: string;
}
