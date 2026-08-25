'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Check, Loader2, Lock } from 'lucide-react';

interface SwipeButtonProps {
  text: string;
  disabledText?: string;
  onSwipeComplete: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'success' | 'warning';
}

export function SwipeButton({
  text,
  disabledText,
  onSwipeComplete,
  isLoading = false,
  disabled = false,
  className = '',
  variant = 'primary',
}: SwipeButtonProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const getMaxSliderWidth = useCallback(() => {
    if (!containerRef.current || !handleRef.current) return 0;
    return containerRef.current.clientWidth - handleRef.current.clientWidth - 8;
  }, []);

  const handleStart = (clientX: number) => {
    if (disabled || isLoading || isCompleted) return;
    setIsDragging(true);
  };

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPos = Math.max(0, Math.min(clientX - rect.left - 24, getMaxSliderWidth()));
      setSliderPosition(newPos);
    },
    [isDragging, getMaxSliderWidth]
  );

  const handleEnd = useCallback(async () => {
    if (!isDragging) return;
    setIsDragging(false);

    const maxWidth = getMaxSliderWidth();
    if (maxWidth > 0 && sliderPosition >= maxWidth * 0.8) {
      // Snap to end
      setSliderPosition(maxWidth);
      setIsCompleted(true);
      try {
        await onSwipeComplete();
      } catch {
        // Reset if failed
        setSliderPosition(0);
        setIsCompleted(false);
      }
    } else {
      // Animate back to start
      setSliderPosition(0);
    }
  }, [isDragging, sliderPosition, getMaxSliderWidth, onSwipeComplete]);

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onMouseUp = () => {
      if (isDragging) handleEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  // Reset completion if disabled changed
  useEffect(() => {
    if (!isLoading && !disabled) {
      setIsCompleted(false);
      setSliderPosition(0);
    }
  }, [isLoading, disabled]);

  const getVariantStyles = () => {
    if (disabled) {
      return {
        bg: 'bg-zinc-300 dark:bg-zinc-800',
        track: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800',
        handle: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 shadow-none',
        textColor: 'text-zinc-400 dark:text-zinc-500',
      };
    }

    switch (variant) {
      case 'success':
        return {
          bg: 'bg-emerald-600 dark:bg-emerald-700',
          track: 'bg-white dark:bg-zinc-900 border-2 border-emerald-500/60 dark:border-emerald-500/40 ring-2 ring-emerald-500/20 shadow-md',
          handle: 'bg-emerald-600 dark:bg-white text-white dark:text-emerald-700 shadow-emerald-600/30',
          textColor: 'text-emerald-900 dark:text-emerald-100',
        };
      case 'warning':
        return {
          bg: 'bg-amber-600 dark:bg-amber-700',
          track: 'bg-white dark:bg-zinc-900 border-2 border-amber-500/60 dark:border-amber-500/40 ring-2 ring-amber-500/20 shadow-md',
          handle: 'bg-amber-600 dark:bg-white text-white dark:text-amber-700 shadow-amber-600/30',
          textColor: 'text-amber-900 dark:text-amber-100',
        };
      default:
        return {
          bg: 'bg-blue-600 dark:bg-blue-700',
          track: 'bg-white dark:bg-zinc-900 border-2 border-blue-500/60 dark:border-zinc-700/80 ring-2 ring-blue-500/20 shadow-md',
          handle: 'bg-blue-600 dark:bg-white text-white dark:text-blue-700 shadow-blue-600/30',
          textColor: 'text-blue-950 dark:text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      ref={containerRef}
      className={`relative h-14 w-full rounded-2xl overflow-hidden select-none touch-none p-1 border flex items-center justify-center transition-all ${
        styles.track
      } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {/* Background Fill as dragged */}
      <div
        className={`absolute left-0 top-0 bottom-0 ${styles.bg} transition-all ${
          isDragging ? 'duration-0' : 'duration-300'
        }`}
        style={{ width: `${sliderPosition + 48}px` }}
      />

      {/* Label Text */}
      <span
        className={`relative z-10 text-xs sm:text-sm font-black tracking-wide transition-opacity ${
          sliderPosition > 50 ? 'text-white opacity-40' : styles.textColor
        }`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memproses...</span>
          </span>
        ) : disabled && disabledText ? (
          <span className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>{disabledText}</span>
          </span>
        ) : (
          text
        )}
      </span>

      {/* Draggable Handle */}
      <div
        ref={handleRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{ transform: `translateX(${sliderPosition}px)` }}
        className={`absolute left-1 top-1 bottom-1 w-12 rounded-xl flex items-center justify-center shadow-md z-20 transition-transform ${
          disabled
            ? 'cursor-not-allowed'
            : 'cursor-grab active:cursor-grabbing hover:scale-105'
        } ${isDragging ? 'duration-0 scale-95' : 'duration-300'} ${styles.handle}`}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : disabled ? (
          <Lock className="h-4 w-4" />
        ) : isCompleted ? (
          <Check className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-6 w-6 animate-pulse" />
        )}
      </div>
    </div>
  );
}
