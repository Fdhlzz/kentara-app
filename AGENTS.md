<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kentara Project Guidelines for Agents & Developers

## 1. Domain & Purpose
- **App Name:** Kentara
- **Core Domain:** Agricultural marketplace for selling and buying quality farm seeds (*benih pertanian: benih kentang unggul bersertifikat, padi, jagung, palawija, sayuran, dll.*).

## 2. Language Standard
- **Primary Language:** **Bahasa Indonesia**
- All user interfaces, buttons, labels, form inputs, validation messages, toast notifications, and empty states must be in Indonesian.

## 3. UI/UX & Mobile-First Architecture
- **Mobile-First Priority:** The primary user experience is mobile devices (smartphones and tablets used by farmers, buyers, and couriers in the field).
- **UI Stack:** Build all components using **shadcn/ui** and **Tailwind CSS v4**.
- **Touch & Accessibility:**
  - Maintain thumb-friendly touch targets (min `44x44px`).
  - Use mobile-friendly patterns like Bottom Navigation, Drawers/Sheets for filters, and swipeable cards.
  - Test layouts primarily on mobile screen dimensions (360px–430px width).

## 4. Test-Driven Development (TDD) & Unit Testing Standard
> [!IMPORTANT]
> **Mandatory Rule for All AI Agents & Developers:**
> Whenever adding a new feature, business logic, server action, API route, or database workflow, **ALWAYS write the unit tests under `tests/unit/` FIRST (or alongside the feature design)**.

- **Test Framework:** **Vitest** (`npm test`).
- **Test Locations:** All unit tests live in `tests/unit/*.test.ts`.
- **Mandatory Test Checklist for Every Feature:**
  1. **Input Validation & Edge Cases:** Test mandatory fields, empty states, boundary values (e.g. negative numbers, string length limits).
  2. **Business Calculations & State Machines:** Test calculations (e.g. item subtotals, shipping costs, stock deductions) and valid/invalid lifecycle status transitions.
  3. **Role & Permission Guardrails:** Test access control rules across roles (`admin`, `kurir`, `petani`).
  4. **Verification Gate:** Every code change MUST pass `npm test` (100% green tests) and `npm run build` (0 type-checking errors) before committing.
