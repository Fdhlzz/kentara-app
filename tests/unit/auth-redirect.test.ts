import { describe, it, expect } from 'vitest';
import type { UserRole } from '@/types/auth';

describe('7. Auth & Auto-Redirect to Dashboard Unit Tests (Redirect Otomatis Pengguna)', () => {
  interface UserSession {
    id: string;
    email: string;
    role: UserRole;
  }

  // Routing resolver simulator
  function resolveLandingPageRoute(
    user: UserSession | null,
    pathname: string
  ): { shouldRedirect: boolean; targetPath?: string } {
    if (pathname === '/') {
      if (user) {
        return {
          shouldRedirect: true,
          targetPath: `/${user.role}`,
        };
      }
      return { shouldRedirect: false };
    }

    if (pathname === '/login' || pathname === '/register') {
      if (user) {
        return {
          shouldRedirect: true,
          targetPath: `/${user.role}`,
        };
      }
      return { shouldRedirect: false };
    }

    return { shouldRedirect: false };
  }

  it('should redirect logged-in Admin to /admin when opening landing page /', () => {
    const adminUser: UserSession = {
      id: 'admin-1',
      email: 'admin@kentara.id',
      role: 'admin',
    };

    const result = resolveLandingPageRoute(adminUser, '/');
    expect(result.shouldRedirect).toBe(true);
    expect(result.targetPath).toBe('/admin');
  });

  it('should redirect logged-in Courier to /kurir when opening landing page /', () => {
    const courierUser: UserSession = {
      id: 'kurir-1',
      email: 'kurir@kentara.id',
      role: 'kurir',
    };

    const result = resolveLandingPageRoute(courierUser, '/');
    expect(result.shouldRedirect).toBe(true);
    expect(result.targetPath).toBe('/kurir');
  });

  it('should redirect logged-in Petani to /petani when opening landing page /', () => {
    const petaniUser: UserSession = {
      id: 'petani-1',
      email: 'petani@kentara.id',
      role: 'petani',
    };

    const result = resolveLandingPageRoute(petaniUser, '/');
    expect(result.shouldRedirect).toBe(true);
    expect(result.targetPath).toBe('/petani');
  });

  it('should allow non-logged-in public guest to view landing page / without redirect', () => {
    const guestUser = null;

    const result = resolveLandingPageRoute(guestUser, '/');
    expect(result.shouldRedirect).toBe(false);
    expect(result.targetPath).toBeUndefined();
  });
});
