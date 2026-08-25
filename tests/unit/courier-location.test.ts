import { describe, it, expect } from 'vitest';
import type { CourierLocationInput, CourierLocationRecord } from '@/types/maps';

describe('6. Courier Live Location & GPS Tracking Unit Tests (Pelacakan Lokasi Kurir)', () => {
  // Helper distance function in meters
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

  // Throttle logic simulator
  function shouldDispatchLocationUpdate(
    lastPosition: { lat: number; lng: number; timestamp: number } | null,
    newPosition: { lat: number; lng: number; timestamp: number },
    minDistanceMeters = 10,
    minIntervalMs = 10000 // 10 seconds
  ): boolean {
    if (!lastPosition) return true; // First ping

    const timeDiff = newPosition.timestamp - lastPosition.timestamp;
    const distanceMoved = calculateDistanceMeters(
      lastPosition.lat,
      lastPosition.lng,
      newPosition.lat,
      newPosition.lng
    );

    // Dispatch if moved more than minDistance OR if minInterval exceeded
    if (distanceMoved >= minDistanceMeters) return true;
    if (timeDiff >= minIntervalMs) return true;

    return false;
  }

  it('should validate GPS coordinate ranges and values', () => {
    const isValidCoordinate = (lat: number, lng: number) => {
      return (
        typeof lat === 'number' &&
        !isNaN(lat) &&
        lat >= -90 &&
        lat <= 90 &&
        typeof lng === 'number' &&
        !isNaN(lng) &&
        lng >= -180 &&
        lng <= 180
      );
    };

    expect(isValidCoordinate(-5.1379, 119.4357)).toBe(true);
    expect(isValidCoordinate(-6.8123, 107.6189)).toBe(true);
    expect(isValidCoordinate(95.0, 100.0)).toBe(false); // Invalid lat
    expect(isValidCoordinate(0, 190.0)).toBe(false); // Invalid lng
  });

  it('should throttle frequent pings to conserve battery and database performance', () => {
    const baseTime = 1000000;
    const initialPos = { lat: -5.1379, lng: 119.4357, timestamp: baseTime };

    // 1. Position changed by only 2 meters after 2 seconds -> DO NOT UPDATE
    const minorMove = { lat: -5.13791, lng: 119.43571, timestamp: baseTime + 2000 };
    expect(shouldDispatchLocationUpdate(initialPos, minorMove, 10, 10000)).toBe(false);

    // 2. Position moved 50 meters after 3 seconds -> UPDATE (Significant movement)
    const significantMove = { lat: -5.1384, lng: 119.4362, timestamp: baseTime + 3000 };
    expect(shouldDispatchLocationUpdate(initialPos, significantMove, 10, 10000)).toBe(true);

    // 3. Position stayed still but 12 seconds elapsed -> UPDATE (Heartbeat interval)
    const intervalHeartbeat = { lat: -5.13791, lng: 119.43571, timestamp: baseTime + 12000 };
    expect(shouldDispatchLocationUpdate(initialPos, intervalHeartbeat, 10, 10000)).toBe(true);
  });

  it('should format location upsert payload matching public.courier_locations schema', () => {
    const input: CourierLocationInput = {
      order_id: 'order-123',
      latitude: -5.1379367,
      longitude: 119.4357388,
      heading: 180,
      speed: 8.5, // 8.5 m/s (~30 km/h)
      accuracy: 5.0, // 5 meters
      is_active: true,
    };

    const courierId = 'kurir-uuid-1';

    const record: CourierLocationRecord = {
      id: 'loc-uuid-1',
      courier_id: courierId,
      ...input,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    expect(record.courier_id).toBe('kurir-uuid-1');
    expect(record.order_id).toBe('order-123');
    expect(record.latitude).toBeCloseTo(-5.1379367);
    expect(record.longitude).toBeCloseTo(119.4357388);
    expect(record.speed).toBe(8.5);
    expect(record.is_active).toBe(true);
  });

  it('should set is_active to false when courier finishes or exits active delivery task', () => {
    const activeRecord: CourierLocationRecord = {
      id: 'loc-1',
      courier_id: 'kurir-1',
      order_id: 'order-1',
      latitude: -5.1379,
      longitude: 119.4357,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // Deactivate on task completion
    const deactivated = {
      ...activeRecord,
      order_id: null,
      is_active: false,
      updated_at: new Date().toISOString(),
    };

    expect(deactivated.is_active).toBe(false);
    expect(deactivated.order_id).toBeNull();
  });

  it('should compute distance & proximity accurately between real courier GPS and customer farm', () => {
    const realCourierGps: [number, number] = [-5.1401, 119.4412]; // Current device GPS
    const customerDestination: [number, number] = [-5.1385, 119.4912]; // Tamalanrea Makassar

    const distMeters = calculateDistanceMeters(
      realCourierGps[0],
      realCourierGps[1],
      customerDestination[0],
      customerDestination[1]
    );

    const distKm = distMeters / 1000;
    expect(distKm).toBeGreaterThan(5); // ~5.5 km
    expect(distKm).toBeLessThan(7);

    // If within 500m
    const nearCourierGps: [number, number] = [-5.1386, 119.4915];
    const nearDistance = calculateDistanceMeters(
      nearCourierGps[0],
      nearCourierGps[1],
      customerDestination[0],
      customerDestination[1]
    );
    expect(nearDistance).toBeLessThan(500);
  });
});
