<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kentara Project Guidelines for Agents & Developers

## 1. Domain & Purpose
- **App Name:** Kentara
- **Core Domain:** Agricultural marketplace for selling and buying quality farm seeds (*benih pertanian: padi, jagung, palawija, sayuran, buah, dll.*).

## 2. Language Standard
- **Primary Language:** **Bahasa Indonesia**
- All user interfaces, buttons, labels, form inputs, validation messages, toast notifications, and empty states must be in Indonesian.

## 3. UI/UX & Mobile-First Architecture
- **Mobile-First Priority:** The primary user experience is mobile devices (smartphones and tablets used by farmers and buyers in the field).
- **UI Stack:** Build all components using **shadcn/ui** and **Tailwind CSS v4**.
- **Touch & Accessibility:**
  - Maintain thumb-friendly touch targets (min `44x44px`).
  - Use mobile-friendly patterns like Bottom Navigation, Drawers/Sheets for filters, and swipeable cards.
  - Test layouts primarily on mobile screen dimensions (360px–430px width).
