import type { Product } from '@/types/product';

export interface CartItem {
  id?: string;
  user_id?: string;
  product_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  product: Product;
}

export interface GuestCartItem {
  product_id: string;
  quantity: number;
}
