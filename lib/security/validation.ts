/**
 * Kentara Security & Input Validation Module
 * Centralized sanitization, boundary checks, and defensive validation
 */

/**
 * Sanitize string: trim, strip unsafe script tags & control chars, limit length
 */
export function sanitizeString(input: unknown, maxLen = 1000): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Remove script tags and embedded scripts
  const stripped = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '') // Strip basic HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Strip ASCII control characters

  return stripped.slice(0, maxLen).trim();
}

/**
 * Validate standard email addresses according to RFC specifications (max 254 chars)
 */
export function validateEmail(email: unknown): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof email !== 'string' || !email.trim()) {
    return { valid: false, error: 'Email wajib diisi.' };
  }

  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email melebihi batas panjang maksimum.' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Format alamat email tidak valid.' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate Indonesian phone numbers (+62 / 62 / 08)
 */
export function validatePhone(phone: unknown): { valid: boolean; formatted?: string; error?: string } {
  if (typeof phone !== 'string' || !phone.trim()) {
    return { valid: false, error: 'Nomor telepon wajib diisi.' };
  }

  // Normalize: remove dashes, spaces, brackets
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Must match Indonesian mobile/landline formats: 08xx, +628xx, 628xx, min 9 chars, max 16 chars
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Format nomor telepon tidak valid (contoh: 081234567890).' };
  }

  return { valid: true, formatted: cleaned };
}

/**
 * Validate positive number within defined min and max bounds
 */
export function validatePositiveNumber(
  num: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): { valid: boolean; value?: number; error?: string } {
  if (num === null || num === undefined || num === '') {
    return { valid: false, error: 'Nilai angka wajib diisi.' };
  }

  const parsed = Number(num);
  if (isNaN(parsed) || !Number.isFinite(parsed)) {
    return { valid: false, error: 'Format angka tidak valid.' };
  }

  if (parsed < min) {
    return { valid: false, error: `Nilai minimal adalah ${min}.` };
  }

  if (parsed > max) {
    return { valid: false, error: `Nilai maksimal adalah ${max}.` };
  }

  return { valid: true, value: parsed };
}

/**
 * Validate latitude and longitude coordinate boundaries
 */
export function validateCoordinates(
  lat: unknown,
  lng: unknown
): { valid: boolean; lat?: number; lng?: number; error?: string } {
  // Allow null/empty if coordinates are optional
  if ((lat === null || lat === undefined || lat === '') && (lng === null || lng === undefined || lng === '')) {
    return { valid: true };
  }

  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng) || !Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return { valid: false, error: 'Koordinat latitude dan longitude tidak valid.' };
  }

  if (parsedLat < -90 || parsedLat > 90) {
    return { valid: false, error: 'Latitude harus berada dalam rentang -90 hingga 90.' };
  }

  if (parsedLng < -180 || parsedLng > 180) {
    return { valid: false, error: 'Longitude harus berada dalam rentang -180 hingga 180.' };
  }

  return { valid: true, lat: parsedLat, lng: parsedLng };
}

/**
 * Validate password length and complexity bounds (DoS and brute-force prevention)
 */
export function validatePasswordStrength(password: unknown): { valid: boolean; error?: string } {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Kata sandi wajib diisi.' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Kata sandi minimal harus terdiri dari 6 karakter.' };
  }

  // Bound password length to 128 characters to prevent bcrypt CPU denial of service attacks
  if (password.length > 128) {
    return { valid: false, error: 'Kata sandi maksimal 128 karakter.' };
  }

  return { valid: true };
}

/**
 * Validate order creation payload
 */
export function validateOrderInput(input: any): { valid: boolean; sanitizedData?: any; error?: string } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Payload pesanan tidak valid.' };
  }

  const customer_name = sanitizeString(input.customer_name, 100);
  if (!customer_name || customer_name.length < 2) {
    return { valid: false, error: 'Nama penerima / pembeli minimal 2 karakter.' };
  }

  const phoneRes = validatePhone(input.customer_phone);
  if (!phoneRes.valid) {
    return { valid: false, error: phoneRes.error };
  }

  let sanitizedEmail: string | null = null;
  if (input.customer_email) {
    const emailRes = validateEmail(input.customer_email);
    if (!emailRes.valid) {
      return { valid: false, error: emailRes.error };
    }
    sanitizedEmail = emailRes.sanitized || null;
  }

  const shipping_address = sanitizeString(input.shipping_address, 500);
  if (!shipping_address || shipping_address.length < 5) {
    return { valid: false, error: 'Alamat pengiriman lengkap wajib diisi.' };
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { valid: false, error: 'Keranjang pesanan masih kosong.' };
  }

  if (input.items.length > 50) {
    return { valid: false, error: 'Jumlah varietas produk dalam satu pesanan maksimal 50.' };
  }

  const sanitizedItems = [];
  for (const item of input.items) {
    const product_name = sanitizeString(item.product_name, 150);
    if (!product_name) {
      return { valid: false, error: 'Nama produk dalam item pesanan tidak valid.' };
    }
    const priceRes = validatePositiveNumber(item.price, 0, 100_000_000);
    if (!priceRes.valid) {
      return { valid: false, error: `Harga item tidak valid: ${priceRes.error}` };
    }
    const qtyRes = validatePositiveNumber(item.quantity, 1, 10_000);
    if (!qtyRes.valid) {
      return { valid: false, error: `Kuantitas item tidak valid: ${qtyRes.error}` };
    }

    sanitizedItems.push({
      product_id: typeof item.product_id === 'string' ? sanitizeString(item.product_id, 100) : null,
      product_name,
      product_variety: item.product_variety ? sanitizeString(item.product_variety, 100) : null,
      seed_class: item.seed_class ? sanitizeString(item.seed_class, 50) : null,
      price: priceRes.value || 0,
      quantity: qtyRes.value || 1,
      unit: item.unit ? sanitizeString(item.unit, 20) : 'kg',
      weight_kg: Number(item.weight_kg || 1.0),
    });
  }

  const coordRes = validateCoordinates(input.customer_latitude, input.customer_longitude);
  if (!coordRes.valid) {
    return { valid: false, error: coordRes.error };
  }

  return {
    valid: true,
    sanitizedData: {
      customer_name,
      customer_phone: phoneRes.formatted,
      customer_email: sanitizedEmail,
      shipping_address,
      shipping_city: input.shipping_city ? sanitizeString(input.shipping_city, 100) : null,
      customer_latitude: coordRes.lat ?? null,
      customer_longitude: coordRes.lng ?? null,
      notes: input.notes ? sanitizeString(input.notes, 500) : null,
      items: sanitizedItems,
    },
  };
}

/**
 * Validate product creation/update payload
 */
export function validateProductInput(input: any): { valid: boolean; sanitizedData?: any; error?: string } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Data produk tidak valid.' };
  }

  const name = sanitizeString(input.name, 150);
  if (!name || name.length < 2) {
    return { valid: false, error: 'Nama produk benih kentang wajib diisi (minimal 2 karakter).' };
  }

  const variety = sanitizeString(input.variety, 100);
  if (!variety) {
    return { valid: false, error: 'Varietas benih kentang wajib diisi.' };
  }

  const seed_class = sanitizeString(input.seed_class, 50);
  if (!seed_class) {
    return { valid: false, error: 'Kelas generasi benih (G0-G4) wajib dipilih.' };
  }

  const priceRes = validatePositiveNumber(input.price, 0, 1_000_000_000);
  if (!priceRes.valid) {
    return { valid: false, error: `Harga produk tidak valid: ${priceRes.error}` };
  }

  const stockRes = validatePositiveNumber(input.stock, 0, 10_000_000);
  if (!stockRes.valid) {
    return { valid: false, error: `Stok produk tidak valid: ${stockRes.error}` };
  }

  const origin_location = sanitizeString(input.origin_location, 150);
  if (!origin_location) {
    return { valid: false, error: 'Asal lokasi penangkaran benih wajib diisi.' };
  }

  return {
    valid: true,
    sanitizedData: {
      name,
      variety,
      seed_class,
      price: priceRes.value,
      stock: stockRes.value,
      origin_location,
    },
  };
}

/**
 * Validate uploaded file MIME type and max size
 */
export function validateFileMimeAndSize(
  file: { type: string; size: number },
  allowedMimes: string[],
  maxBytes: number
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'File tidak ditemukan.' };
  }

  if (!allowedMimes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Tipe file '${file.type}' tidak diizinkan. Tipe yang didukung: ${allowedMimes.join(', ')}`,
    };
  }

  if (file.size > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `Ukuran file melebihi batas maksimum (${maxMb} MB).` };
  }

  return { valid: true };
}
