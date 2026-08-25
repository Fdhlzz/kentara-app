'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  upsertCourierLocationAction,
  deactivateCourierLocationAction,
} from '@/lib/maps/location-actions';

interface UseCourierLocationTrackerOptions {
  orderId?: string | null;
  isActive: boolean; // active when delivery task is open & in progress
  minDistanceMeters?: number; // default: 10m
  minIntervalMs?: number; // default: 10,000ms (10s)
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function useCourierLocationTracker({
  orderId,
  isActive,
  minDistanceMeters = 10,
  minIntervalMs = 10000,
}: UseCourierLocationTrackerOptions) {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const lastDispatchedRef = useRef<{
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);

  const isDispatchingRef = useRef(false);

  // Sync to database
  const syncLocationToBackend = useCallback(
    async (lat: number, lng: number, head: number, spd: number, acc: number | null) => {
      if (isDispatchingRef.current) return;
      isDispatchingRef.current = true;

      try {
        await upsertCourierLocationAction({
          order_id: orderId || null,
          latitude: lat,
          longitude: lng,
          heading: head,
          speed: spd,
          accuracy: acc,
          is_active: true,
        });

        const now = Date.now();
        lastDispatchedRef.current = { lat, lng, timestamp: now };
        setLastSyncTime(now);
      } catch (err) {
        console.error('[Location Sync Error]:', err);
      } finally {
        isDispatchingRef.current = false;
      }
    },
    [orderId]
  );

  useEffect(() => {
    if (!isActive || typeof window === 'undefined' || !navigator.geolocation) {
      if (!isActive && lastDispatchedRef.current) {
        deactivateCourierLocationAction();
        lastDispatchedRef.current = null;
      }
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading: hd, speed: sp, accuracy: acc } = position.coords;
        const lat = latitude;
        const lng = longitude;
        const currHeading = hd || 0;
        const currSpeed = sp || 0;

        setCurrentPosition([lat, lng]);
        setHeading(currHeading);
        setSpeed(currSpeed);
        setAccuracy(acc || null);
        setIsGpsActive(true);

        const now = Date.now();
        const last = lastDispatchedRef.current;

        // Check whether to sync to server
        let shouldSync = false;

        if (!last) {
          shouldSync = true;
        } else {
          const timeDiff = now - last.timestamp;
          const distMoved = calculateDistanceMeters(last.lat, last.lng, lat, lng);

          if (distMoved >= minDistanceMeters || timeDiff >= minIntervalMs) {
            shouldSync = true;
          }
        }

        if (shouldSync) {
          syncLocationToBackend(lat, lng, currHeading, currSpeed, acc || null);
        }
      },
      (error) => {
        console.warn('[Courier Geolocation watchPosition Error]:', error.message);
        setIsGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      deactivateCourierLocationAction();
    };
  }, [isActive, minDistanceMeters, minIntervalMs, syncLocationToBackend]);

  return {
    currentPosition,
    heading,
    speed,
    accuracy,
    isGpsActive,
    lastSyncTime,
  };
}
