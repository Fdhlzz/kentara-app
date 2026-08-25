export type SeedClass = 'G0' | 'G1' | 'G2' | 'G3' | 'G4';

export type SproutStatus = 'siap_tanam' | 'pecah_dormansi' | 'dormansi';

export type ProductUnit = 'kg' | 'sak_25kg' | 'sak_50kg' | 'knol';

export interface Product {
  id: string;
  name: string;
  slug: string;
  variety: string;
  seed_class: string;
  cert_number: string | null;
  size_category: string;
  sprout_status: string;
  price: number;
  unit: string;
  stock: number;
  min_order: number;
  weight_per_unit: number;
  origin_location: string;
  elevation_masl: string | null;
  harvest_days: string | null;
  potential_yield: string | null;
  resilience: string | null;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  featuredProducts: number;
  totalStockKg: number;
  totalStockKnol: number;
}

export interface ProductFormData {
  name: string;
  variety: string;
  seed_class: string;
  cert_number?: string;
  size_category: string;
  sprout_status: string;
  price: number;
  unit: string;
  stock: number;
  min_order: number;
  weight_per_unit: number;
  origin_location: string;
  elevation_masl?: string;
  harvest_days?: string;
  potential_yield?: string;
  resilience?: string;
  description?: string;
  image_url?: string;
  is_featured: boolean;
  is_active: boolean;
}

export interface ProductActionResult {
  success: boolean;
  error?: string;
  product?: Product;
}

export interface UploadImageResult {
  success: boolean;
  error?: string;
  publicUrl?: string;
}
