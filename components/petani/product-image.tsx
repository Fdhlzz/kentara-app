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
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-100/70 via-teal-50 to-emerald-200/50 dark:from-emerald-950/60 dark:via-zinc-900 dark:to-teal-950/60 p-4 select-none ${className}`}
      >
        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-inner border border-emerald-600/20 mb-1.5">
          <Sprout className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>
        <span className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-200 text-center leading-tight truncate max-w-[90%]">
          {variety || 'Benih Kentang'}
        </span>
        {seedClass && (
          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
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
