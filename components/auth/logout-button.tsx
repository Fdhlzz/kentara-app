'use client';

import { useTransition } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/auth/actions';

export function LogoutButton({
  variant = 'destructive',
  className,
}: {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      toast.info('Keluar dari akun...');
      await logoutAction();
    });
  };

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={isPending}
      className={`min-h-[44px] touch-manipulation font-semibold rounded-xl cursor-pointer transition ${className}`}
    >
      {isPending ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memproses Keluar...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span>Keluar Akun (Logout)</span>
        </div>
      )}
    </Button>
  );
}
