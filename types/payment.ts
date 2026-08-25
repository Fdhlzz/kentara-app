export type PaymentMethodType = 'gateway' | 'cash';

export type PaymentRecordStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  payment_code: string;
  order_id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  user_id?: string | null;
  amount: number;
  payment_method_type: PaymentMethodType;
  payment_method_detail: string;
  payment_status: PaymentRecordStatus | string;
  paid_at?: string | null;
  gateway_transaction_id?: string | null;
  cash_collected_by?: string | null;
  collector_name?: string | null;
  collector_phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_status?: string;
  shipping_address?: string;
  shipping_city?: string;
}

export interface AdminPaymentStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  gatewayPaymentsCount: number;
  cashPaymentsCount: number;
  totalRevenue: number;
  gatewayRevenue: number;
  cashRevenue: number;
}

export interface ConfirmCashPaymentResult {
  success: boolean;
  error?: string;
  payment?: Payment;
}
