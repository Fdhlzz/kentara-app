import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateEmail,
  validatePhone,
  validatePositiveNumber,
  validateCoordinates,
  validatePasswordStrength,
  validateOrderInput,
  validateProductInput,
  validateFileMimeAndSize,
} from '@/lib/security/validation';

describe('Security Validation & Sanitization Tests', () => {
  describe('String Sanitization', () => {
    it('should trim and strip dangerous control/script characters', () => {
      expect(sanitizeString('   hello world   ')).toBe('hello world');
      expect(sanitizeString('Test <script>alert(1)</script>')).toBe('Test');
      expect(sanitizeString('A'.repeat(500), 50).length).toBe(50);
    });

    it('should handle empty or null values gracefully', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('Email Validation', () => {
    it('should accept valid standard email addresses', () => {
      expect(validateEmail('user@kentara.id').valid).toBe(true);
      expect(validateEmail('petani.makmur@gmail.com').valid).toBe(true);
      expect(validateEmail('admin+ops@domain.co.id').valid).toBe(true);
    });

    it('should reject malformed or dangerous email addresses', () => {
      expect(validateEmail('').valid).toBe(false);
      expect(validateEmail('invalid-email').valid).toBe(false);
      expect(validateEmail('@missing-user.com').valid).toBe(false);
      expect(validateEmail('user@.com').valid).toBe(false);
      expect(validateEmail('a'.repeat(300) + '@test.com').valid).toBe(false); // Max RFC length 254
    });
  });

  describe('Phone Validation (Indonesian formats)', () => {
    it('should accept valid Indonesian phone numbers', () => {
      expect(validatePhone('081234567890').valid).toBe(true);
      expect(validatePhone('+6281234567890').valid).toBe(true);
      expect(validatePhone('6281234567890').valid).toBe(true);
      expect(validatePhone('0852-1234-5678').valid).toBe(true);
    });

    it('should reject invalid or short phone numbers', () => {
      expect(validatePhone('123').valid).toBe(false);
      expect(validatePhone('abcdefghijk').valid).toBe(false);
      expect(validatePhone('').valid).toBe(false);
    });
  });

  describe('Positive Number & Bounds Validation', () => {
    it('should validate positive numbers within bounds', () => {
      expect(validatePositiveNumber(100, 1, 1000).valid).toBe(true);
      expect(validatePositiveNumber('250', 1, 1000).valid).toBe(true);
      expect(validatePositiveNumber(0, 0, 100).valid).toBe(true);
    });

    it('should reject negative, non-numeric, or out of bound values', () => {
      expect(validatePositiveNumber(-5, 0, 100).valid).toBe(false);
      expect(validatePositiveNumber('not-a-number').valid).toBe(false);
      expect(validatePositiveNumber(5000, 1, 1000).valid).toBe(false);
      expect(validatePositiveNumber(Infinity).valid).toBe(false);
      expect(validatePositiveNumber(NaN).valid).toBe(false);
    });
  });

  describe('GPS Coordinate Range Validation', () => {
    it('should validate standard latitude (-90 to 90) and longitude (-180 to 180)', () => {
      expect(validateCoordinates(-5.1476, 119.4327).valid).toBe(true); // Makassar
      expect(validateCoordinates(-6.2088, 106.8456).valid).toBe(true); // Jakarta
      expect(validateCoordinates(0, 0).valid).toBe(true);
    });

    it('should reject out of range or malformed coordinates', () => {
      expect(validateCoordinates(95.0, 100.0).valid).toBe(false); // Lat > 90
      expect(validateCoordinates(-5.0, 200.0).valid).toBe(false); // Lng > 180
      expect(validateCoordinates(NaN, 100.0).valid).toBe(false);
      expect(validateCoordinates(null, null).valid).toBe(true); // Optional coordinates
    });
  });

  describe('Password Strength & Bounds', () => {
    it('should accept passwords with sufficient length and character safety', () => {
      expect(validatePasswordStrength('Kentara#2026').valid).toBe(true);
      expect(validatePasswordStrength('rahasia-petani-123').valid).toBe(true);
    });

    it('should reject too short or excessively long passwords (DoS prevention)', () => {
      expect(validatePasswordStrength('12345').valid).toBe(false); // < 6 chars
      expect(validatePasswordStrength('a'.repeat(200)).valid).toBe(false); // > 128 chars to avoid bcrypt DoS
    });
  });

  describe('Order Input Boundary Validation', () => {
    it('should validate a clean order payload', () => {
      const validOrder = {
        customer_name: 'Budi Petani',
        customer_phone: '081234567890',
        shipping_address: 'Jl. Malino Km. 10, Gowa',
        items: [
          {
            product_name: 'Benih Kentang Granola G0',
            price: 50000,
            quantity: 5,
          },
        ],
        shipping_cost: 15000,
      };

      const result = validateOrderInput(validOrder);
      expect(result.valid).toBe(true);
      expect(result.sanitizedData?.customer_name).toBe('Budi Petani');
    });

    it('should reject order with empty items, negative prices, or malicious inputs', () => {
      expect(
        validateOrderInput({
          customer_name: '',
          customer_phone: '081234567890',
          shipping_address: 'Alamat',
          items: [],
        }).valid
      ).toBe(false);

      expect(
        validateOrderInput({
          customer_name: 'Budi',
          customer_phone: '081234567890',
          shipping_address: 'Alamat',
          items: [{ product_name: 'Benih', price: -5000, quantity: 1 }],
        }).valid
      ).toBe(false);
    });

    it('should sanitize items and validate customer email in order input', () => {
      const orderWithEmail = {
        customer_name: 'Siti Petani',
        customer_phone: '081234567890',
        customer_email: 'siti@farm.id',
        shipping_address: 'Desa Kanreapia, Tombolo Pao',
        items: [
          {
            product_id: 'prod-uuid-123',
            product_name: 'Benih Medians <script>alert(1)</script>',
            price: 60000,
            quantity: 10,
            unit: 'kg',
          },
        ],
      };

      const res = validateOrderInput(orderWithEmail);
      expect(res.valid).toBe(true);
      expect(res.sanitizedData?.customer_email).toBe('siti@farm.id');
      expect(res.sanitizedData?.items[0].product_name).toBe('Benih Medians');
      expect(res.sanitizedData?.items[0].quantity).toBe(10);
    });

    it('should reject invalid email in order payload', () => {
      const res = validateOrderInput({
        customer_name: 'Siti',
        customer_phone: '081234567890',
        customer_email: 'not-an-email',
        shipping_address: 'Alamat Valid Minimal 5 Char',
        items: [{ product_name: 'Benih', price: 10000, quantity: 1 }],
      });
      expect(res.valid).toBe(false);
    });
  });

  describe('File MIME and Size Validation', () => {
    it('should validate allowed image formats within size limit', () => {
      const validFile = { type: 'image/jpeg', size: 1024 * 1024 * 2 }; // 2MB
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      expect(validateFileMimeAndSize(validFile, allowed, maxSize).valid).toBe(true);
    });

    it('should reject disallowed file types or oversized files', () => {
      const disallowedFile = { type: 'application/x-msdownload', size: 1024 };
      const oversizedFile = { type: 'image/jpeg', size: 10 * 1024 * 1024 };
      const allowed = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024;

      expect(validateFileMimeAndSize(disallowedFile, allowed, maxSize).valid).toBe(false);
      expect(validateFileMimeAndSize(oversizedFile, allowed, maxSize).valid).toBe(false);
    });
  });

  describe('Product Input Validation', () => {
    it('should validate clean product parameters', () => {
      const validProduct = {
        name: 'Benih Kentang Atlantic G1',
        variety: 'Atlantic',
        seed_class: 'G1',
        price: 45000,
        stock: 500,
        origin_location: 'Pangalengan, Bandung',
      };

      const result = validateProductInput(validProduct);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid pricing, negative stock, or missing mandatory fields', () => {
      expect(
        validateProductInput({
          name: '',
          variety: 'Atlantic',
          seed_class: 'G1',
          price: 45000,
          stock: 100,
          origin_location: 'Malang',
        }).valid
      ).toBe(false);

      expect(
        validateProductInput({
          name: 'Benih',
          variety: 'Atlantic',
          seed_class: 'G1',
          price: -1000,
          stock: 100,
          origin_location: 'Malang',
        }).valid
      ).toBe(false);
    });
  });
});
