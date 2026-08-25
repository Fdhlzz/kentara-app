'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  upsertCourierLocationAction,
  deactivateCourierLocationAction,
} from '@/lib/maps/location-actions';

interface UseCourierLocationTrackerOptions {
  orderId?: string | null;
  isActive: boolean; // active when delivery task modal is open
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
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
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

  // Function to manually request and recenter GPS position
  const requestCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation tidak didukung pada perangkat ini.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, heading: hd, speed: sp, accuracy: acc } = position.coords;
        const lat = latitude;
        const lng = longitude;
        const currHeading = hd || 0;
        const currSpeed = sp ? Math.round(sp * 3.6) : 0; // convert m/s to km/h

        setCurrentPosition([lat, lng]);
        setHeading(currHeading);
        setSpeed(currSpeed);
        setAccuracy(acc ? Math.round(acc) : null);
        setIsGpsActive(true);
        setIsLocating(false);

        // Immediate first sync
        syncLocationToBackend(lat, lng, currHeading, sp || 0, acc || null);
      },
      (error) => {
        console.warn('[Courier Geolocation Error]:', error.message);
        setGpsError(
          error.code === 1
            ? 'Izin akses lokasi ditolak. Mohon aktifkan GPS peramban.'
            : 'Mencari sinyal GPS perangkat...'
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [syncLocationToBackend]);

  useEffect(() => {
    if (!isActive || typeof window === 'undefined' || !navigator.geolocation) {
      if (!isActive && lastDispatchedRef.current) {
        deactivateCourierLocationAction();
        lastDispatchedRef.current = null;
      }
      return;
    }

    // 1. Initial immediate GPS acquisition
    requestCurrentLocation();

    // 2. High-accuracy continuous GPS watch
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading: hd, speed: sp, accuracy: acc } = position.coords;
        const lat = latitude;
        const lng = longitude;
        const currHeading = hd || 0;
        const currSpeed = sp ? Math.round(sp * 3.6) : 0; // km/h

        setCurrentPosition([lat, lng]);
        setHeading(currHeading);
        setSpeed(currSpeed);
        setAccuracy(acc ? Math.round(acc) : null);
        setIsGpsActive(true);
        setGpsError(null);

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
          syncLocationToBackend(lat, lng, currHeading, sp || 0, acc || null);
        }
      },
      (error) => {
        console.warn('[Courier Geolocation watchPosition Warning]:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      deactivateCourierLocationAction();
    };
  }, [isActive, minDistanceMeters, minIntervalMs, syncLocationToBackend, requestCurrentLocation]);

  return {
    currentPosition,
    heading,
    speed,
    accuracy,
    isGpsActive,
    isLocating,
    gpsError,
    lastSyncTime,
    recenterGps: requestCurrentLocation,
  };
}
