'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sprout } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  variety?: string | null;
  seedClass?: string | null;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}

export function ProductImage({
  src,
  alt,
  variety,
  seedClass,
  className = '',
  fill = true,
  priority = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  // If no source or failed to load, render clean modern seed placeholder
  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-teal-950/40 p-4 select-none ${className}`}
      >
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-600/15 mb-1.5">
          <Sprout className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <span className="text-[11px] sm:text-xs font-black text-emerald-800 dark:text-emerald-300 text-center leading-tight truncate max-w-[90%]">
          {variety || 'Benih Kentang'}
        </span>
        {seedClass && (
          <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kelas {seedClass}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
