/**
 * Definisi Type untuk Midtrans Payment Gateway (Snap & Core API)
 */

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
  merchant_name?: string;
  url?: string;
}

export interface MidtransCustomerAddress {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
}

export interface MidtransCustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  billing_address?: MidtransCustomerAddress;
  shipping_address?: MidtransCustomerAddress;
}

export interface MidtransExpiryDetails {
  start_time?: string;
  unit: 'minute' | 'hour' | 'day';
  duration: number;
}

export interface MidtransSnapTransactionParams {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: MidtransItemDetail[];
  customer_details?: MidtransCustomerDetails;
  enabled_payments?: string[];
  expiry?: MidtransExpiryDetails;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
  callbacks?: {
    finish?: string;
    error?: string;
    unfinish?: string;
  };
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransTransactionStatusResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  currency?: string;
  payment_type: string;
  transaction_time: string;
  transaction_status:
    | 'capture'
    | 'settlement'
    | 'pending'
    | 'deny'
    | 'cancel'
    | 'expire'
    | 'refund'
    | 'partial_refund'
    | 'authorize';
  fraud_status?: 'accept' | 'deny' | 'challenge';
  approval_code?: string;
  signature_key?: string;
  bank?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  bca_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
  [key: string]: unknown;
}

export interface MidtransNotificationPayload {
  transaction_time: string;
  transaction_status:
    | 'capture'
    | 'settlement'
    | 'pending'
    | 'deny'
    | 'cancel'
    | 'expire'
    | 'refund'
    | 'partial_refund'
    | 'authorize';
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id?: string;
  gross_amount: string;
  fraud_status?: 'accept' | 'deny' | 'challenge';
  currency?: string;
  settlement_time?: string;
  approval_code?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  bill_key?: string;
  biller_code?: string;
  payment_amounts?: Array<{
    paid_at: string;
    amount: string;
  }>;
  pdf_url?: string;
  finish_redirect_url?: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'CHALLENGE'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'UNKNOWN';

export interface PaymentStatusInfo {
  status: PaymentStatus;
  label: string;
  description: string;
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

export interface SnapResult {
  status_code: string;
  status_message: string[];
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  pdf_url?: string;
  finish_redirect_url?: string;
  [key: string]: unknown;
}

export interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: SnapCallbacks) => void;
      embed: (token: string, options: { embedId: string } & SnapCallbacks) => void;
      hide?: () => void;
      show?: () => void;
    };
  }
}
