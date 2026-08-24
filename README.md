# 🌾 Kentara — Marketplace Benih Pertanian Unggul

**Kentara** adalah platform e-commerce dan marketplace modern yang dirancang khusus untuk memfasilitasi jual beli benih pertanian unggul, berkualitas, dan bersertifikasi di Indonesia.

---

## 🎯 Tujuan & Visi Proyek

* **Tujuan Utama:** Menghubungkan petani, produsen benih lokal/nasional, serta penghobi tanaman dengan akses langsung ke benih pertanian berkualitas tinggi (benih padi, jagung, palawija, sayuran, buah-buahan, dan tanaman perkebunan).
* **Bahasa Utama Aplikasi:** **Bahasa Indonesia** — Semua antarmuka pengguna (UI), deskripsi produk, notifikasi, dan komunikasi transaksi dirancang secara native menggunakan Bahasa Indonesia.

---

## 📱 Panduan Pengembangan: Mobile-First Focus

> [!IMPORTANT]
> **Aplikasi ini diutamakan untuk versi mobile (Mobile-First Experience).** Semua pengembangan fitur dan antarmuka masa depan **wajib memprioritaskan tata letak, kenyamanan, dan performa pada perangkat mobile** menggunakan kombinasi **shadcn/ui** dan **Tailwind CSS**.

### Prinsip Desain Mobile UI:
1. **Komponen shadcn/ui & Tailwind CSS:**
   - Gunakan komponen shadcn/ui (Button, Dialog, Sheet/Drawer, Card, Tabs, Input, Select, Badge, Skeleton, dll.) yang disesuaikan dengan tema hijau pertanian (*emerald / forest green*).
   - Manfaatkan utility classes Tailwind CSS v4 untuk styling yang fleksibel, konsisten, dan ringan.
2. **Thumb-Friendly Touch Targets:**
   - Semua tombol dan elemen interaktif memiliki area sentuh minimal `44x44px` agar nyaman diakses satu tangan oleh petani/pengguna di lapangan.
3. **Pola Navigasi Mobile:**
   - Prioritaskan *Bottom Navigation Bar* untuk navigasi utama (Beranda, Katalog Benih, Transaksi, Akun).
   - Gunakan *Sheet / Bottom Drawer* untuk filter pencarian, varietas benih, dan keranjang belanja.
4. **Safe Area & Responsivitas:**
   - Pastikan layout mendukung notch dan gesture bar (`viewport-fit=cover`, safe area padding).
   - Tampilan desktop tetap rapi (misal: layout max-width terpusat atau responsive expanded view) dengan basis mobile yang solid.

---

## 🚀 Fitur Utama

- 🛒 **Katalog & Belanja Benih:** Pencarian, filter varietas benih, spesifikasi daya tumbuh, masa panen, dan rekomendasi iklim tanam.
- 📱 **Progressive Web App (PWA):** Dapat di-install langsung di perangkat mobile (Android/iOS) dan Desktop layaknya aplikasi native, dilengkapi dengan kemampuan *offline caching*.
- 🔐 **Autentikasi & Database Terintegrasi:** Didukung oleh **Supabase (PostgreSQL)** dengan Row Level Security (RLS) dan session SSR yang aman.
- ⚡ **Performa & Desain Modern:** Dibangun dengan Next.js 16 App Router, React 19, Tailwind CSS v4, dan shadcn/ui.
- 🔄 **Otomasi CI/CD:** Pipeline otomatis melalui **GitHub Actions** untuk verifikasi kode (lint, type-check, build) dan deployment otomatis ke **Vercel**.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Library UI:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Database & Auth:** [Supabase](https://supabase.com/) (`@supabase/ssr`, PostgreSQL 17)
* **PWA Engine:** Web App Manifest (`app/manifest.ts`), Custom Service Worker (`public/sw.js`)
* **Deployment & CI/CD:** [Vercel](https://vercel.com/), [GitHub Actions](https://github.com/features/actions)

---

## 📦 Struktur PWA (Progressive Web App)

Aplikasi Kentara dilengkapi dengan konfigurasi PWA standar:
* `app/manifest.ts`: Metadata Web App Manifest (Nama, deskripsi, warna tema, orientasi, dan ikon).
* `public/sw.js`: Service Worker untuk caching asset statis dan fallback offline.
* `public/icons/`: Ikon aplikasi dalam berbagai resolusi (`192x192`, `512x512`, maskable, apple-touch-icon).

---

## 💻 Memulai Pengembangan (Local Development)

1. **Clone repository:**
   ```bash
   git clone https://github.com/Fdhlzz/kentara-app.git
   cd kentara-app
   ```

2. **Instal dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin `.env.example` atau buat `.env.local` dengan konfigurasi Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
   ```

4. **Jalankan development server:**
   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000) di browser Anda (disarankan membuka dalam mobile device emulation di DevTools).

---

## 🧪 Skrip Perintah

* `npm run dev` — Menjalankan server pengembangan Next.js
* `npm run build` — Membangun build produksi untuk deployment
* `npm run lint` — Menjalankan pemeriksaan kode dengan ESLint
* `npx tsc --noEmit` — Menjalankan pemeriksaan tipe TypeScript
