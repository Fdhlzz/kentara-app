export type UserRole = 'admin' | 'petani' | 'kurir';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}
