# Salmon Supply Allocator

A dashboard for automatically and manually distributing salmon inventory across customer orders, with real-time filtering, sorting, and allocation tracking.

---

## Features

- **Auto-allocation** — runs a priority-based algorithm (Emergency → Overdue → Daily, then FIFO) across 5 000+ orders in one click
- **Manual override** — edit any order's allocated quantity through a modal with live stock and credit-limit validation
- **Virtualized table** — renders thousands of rows at 60 fps using windowed rendering; no pagination needed
- **Sortable columns** — click any header to cycle asc → desc → off; type, status, date, and numeric columns all have smart comparators
- **Filter bar** — instant search by order/customer ID plus dropdown filters for status, type, customer, warehouse, supplier, and item
- **Stock panel** — live view of remaining inventory per warehouse/supplier/item after each allocation round
- **Toast notifications** — slide-in confirmation after every manual allocation with quantity delta and total value
- **Error boundary** — table render failures are caught and surfaced with a retry button instead of a blank screen

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React | 19.2.5 |
| Language | TypeScript | 6.0.2 |
| Build | Vite | 8.0.10 |
| Styles | Tailwind CSS | 4.2.4 |
| Virtualization | @tanstack/react-virtual | 3.13.24 |
| Testing | Vitest | 4.1.5 |

---

## Prerequisites

- **Node.js** >= 18 (developed on v22)
- **npm** >= 9

---

## Quick Start

```bash
git clone <repo-url>
cd salmon-supply-allocator
npm install
npm run dev
```

The app opens at `http://localhost:5173` (or the next free port if 5173 is taken).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check then bundle for production |
| `npm run preview` | Serve the production bundle locally |
| `npm test` | Run Vitest unit tests (watch mode) |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx       # Class-based error boundary with retry
│   ├── FilterBar.tsx           # Search + dropdown filters (200 ms debounce)
│   ├── ManualAllocateModal.tsx # Per-order manual allocation dialog
│   ├── OrderTable.tsx          # Virtualized, sortable order table
│   ├── StockPanel.tsx          # Live stock levels
│   ├── SummaryBar.tsx          # Totals + "Run Allocation" button
│   └── ToastContainer.tsx      # Slide-in notification stack
├── data/
│   └── pricing.ts              # Supplier x order-type pricing lookup
├── hooks/
│   └── useToast.ts             # Toast state with auto-dismiss
├── services/
│   └── mockGenerator.ts        # Deterministic mock orders / stocks / customers
├── types/
│   └── allocation.ts           # Core TypeScript types and interfaces
├── utils/
│   ├── allocationLogic.ts      # Auto-allocation algorithm
│   ├── allocationLogic.test.ts
│   ├── math.ts                 # bankersRound utility
│   └── math.test.ts
└── App.tsx                     # Root component — state, filters, handlers
```

---

## Allocation Rules

### Priority Order

Orders are processed in this sequence before any other criterion:

1. **EMERGENCY** — highest priority
2. **OVERDUE**
3. **DAILY**

Within each priority tier, orders are processed **FIFO** by `createDate`.

### Warehouse and Supplier Wildcards

- `WH-000` — order accepts stock from any warehouse; the algorithm picks the slot with the highest remaining quantity
- `SP-000` — order accepts stock from any supplier; same highest-remaining selection applies

### Credit Limits

Each customer has a `creditLimit`. The allocator will not assign quantity that would push `usedCredit` past that limit. Manual allocation enforces the same check.

### Pricing

Unit price = `bankersRound(BASE x TIER, 2)`

| Supplier | Base ($/kg) |
|---|---|
| SP-001 | 123.49 |
| SP-002 | 99.75 |
| Others | 100.00 |

| Order Type | Multiplier |
|---|---|
| EMERGENCY | x 1.25 |
| OVERDUE | x 1.00 |
| DAILY | x 0.90 |

### Rounding

All quantity and monetary arithmetic uses **Banker's rounding** (round-half-to-even) to minimise cumulative drift over large datasets.

---

## Running Tests

```bash
npm test
```

42 unit tests cover:

- Priority ordering and FIFO sequencing
- Wildcard warehouse/supplier selection
- Credit limit enforcement
- Partial and zero allocations
- Banker's rounding edge cases
- Supplier x type pricing matrix
