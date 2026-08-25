# Kentara — Agricultural Seed Marketplace Platform

Kentara is a modern e-commerce and logistics marketplace designed specifically for verified, high-quality agricultural seed distribution in Indonesia, with a primary focus on certified potato seed tubers (*Solanum tuberosum*), grains, and horticulture.

## Live Deployment

The live production application is accessible at:
- **URL:** [https://www.kentara.my.id](https://www.kentara.my.id)

---

## Overview and Purpose

Agricultural productivity begins with seed quality. Kentara bridges certified seed breeders, agricultural cooperatives, logistics partners, and farmers through a unified, mobile-first web platform.

Key Objectives:
- Direct access to certified seed varieties (e.g., Granola L, Atlantic, Medians) across seed classes (G0, G1, G2, G3).
- Precise land-delivery logistics with interactive Leaflet map pinpointing and real-time courier tracking.
- Secure transactions supporting both online payments (Midtrans Snap) and Cash on Delivery (COD) workflows.

---

## Key Features

### 1. Mobile-First Seed Marketplace
- Dynamic seed catalog with variety filtering, certification class details, sprout readiness status, and elevation guidelines.
- Multi-item shopping cart backed by Supabase database synchronization and guest fallback support.
- Direct checkout workflow with automated weight-based logistics fee calculation.

### 2. Interactive Leaflet Geolocation & Land Pinpointing
- Precise map picker powered by Leaflet to pin delivery locations down to specific agricultural plots.
- One-touch **"Get Current Location"** button utilizing the browser Geolocation API (`navigator.geolocation`) with high-accuracy GPS positioning.
- Real-time road routing calculations powered by OSRM driving engine.

### 3. Comprehensive Payment Workflows
- **Online Gateway:** Midtrans Snap integration supporting QRIS, Bank Virtual Accounts (BCA, Mandiri, BRI, BNI), and e-wallets.
- **Cash on Delivery (COD):** Field collection by verified couriers with digital receipt confirmation.
- Automated inventory deduction upon payment settlement.

### 4. Courier Logistics & Delivery Tracking
- Dedicated courier portal with task assignments, route maps, and turn-by-turn navigation links.
- Real-time delivery progress updates and location reporting.
- Instant in-app notifications and background Web Push alerts.

### 5. Administration & Role-Based Control
- Multi-role security guardrails for Administrators, Couriers (`kurir`), and Farmers/Buyers (`petani`).
- Management dashboards for product inventory, order lifecycle transitions, financial reporting, and courier assignments.

---

## Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Frontend Core:** React 19, TypeScript
- **Styling & UI:** Tailwind CSS v4, shadcn/ui
- **Icons:** Lucide React
- **Mapping & Geolocation:** Leaflet, OpenStreetMap / CARTO Voyager, OSRM Routing Engine
- **Database & Authentication:** Supabase (PostgreSQL, Row Level Security, SSR Sessions)
- **Payment Processing:** Midtrans Snap Engine
- **PWA Capabilities:** Web App Manifest, Service Worker caching
- **Testing:** Vitest, Test-Driven Development (TDD)
- **CI/CD & Hosting:** GitHub Actions, Vercel

---

## Project Structure

```
kentara-app/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── admin/            # Admin dashboard and management pages
│   ├── api/              # Midtrans webhooks, Snap, and push notification endpoints
│   ├── kurir/            # Courier dispatch and delivery tracking portal
│   ├── petani/           # Farmer marketplace, product detail, and order pages
│   ├── login/            # Authentication interface
│   └── layout.tsx        # Root application layout
├── components/           # Reusable UI and domain components
│   ├── admin/            # Admin management components
│   ├── courier/          # Logistics dispatch and modal components
│   ├── maps/             # Leaflet map views and location pickers
│   ├── marketplace/      # Public catalog and seed showcase
│   ├── petani/           # Farmer marketplace components
│   └── ui/               # Base shadcn/ui primitives
├── context/              # Global React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Server actions, Supabase clients, and utilities
├── public/               # Static assets, icons, and service worker
├── tests/                # Automated Vitest test suite
└── types/                # TypeScript type definitions and interfaces
```

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- A configured Supabase project with PostgreSQL

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Fdhlzz/kentara-app.git
   cd kentara-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

   # Midtrans Payment Gateway
   MIDTRANS_SERVER_KEY=<your-midtrans-server-key>
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=<your-midtrans-client-key>
   MIDTRANS_IS_PRODUCTION=false
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Assurance

Kentara enforces a Test-Driven Development (TDD) workflow. All business logic, state transitions, and calculations are covered by unit tests.

### Running Tests

```bash
# Run test suite
npm test

# Run type check
npx tsc --noEmit

# Run production build validation
npm run build
```

### Test Coverage (`tests/unit/`)

- **`products.test.ts`**: Product catalog filtering, stock limits, and variety certification validations.
- **`orders.test.ts`**: Order code generation, customer coordinate validation, multi-item subtotals, and state machine transitions.
- **`payments.test.ts`**: Payment status handling, cash collection validation, and revenue aggregation.
- **`courier.test.ts`**: Dispatch assignment, role permission verification, and logistics state management.
- **`courier-location.test.ts`**: Geolocation coordinates sanitization, movement delta thresholds, and route caching.
- **`notifications.test.ts`**: Recipient role isolation and push payload structure validation.

---

## License

This project is proprietary software developed for the Kentara agricultural network.
