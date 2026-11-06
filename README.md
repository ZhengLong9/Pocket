# Pocket

See [SETUP-LOG.md](SETUP-LOG.md) for the setup issues, permission-enabled commands, fixes, and verification results.

A desktop-first personal finance dashboard in SGD. Built from the Workspace design reviewed in this chat: sidebar navigation, compact summaries, a spending chart, readable transaction rows, and focused expense-entry modals.

## Run locally

Requires Node.js 22.12 or newer (Node 22.14 is installed on this machine).

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. The development server supports the Overview, Transactions, Budget, and Goals routes.

```sh
npm test
npm run typecheck
npm run build
npm run format:check
```

## Current features

- Add, edit, delete, and undo expenses. Amounts are stored as integer cents.
- Accessible Radix modal with keyboard focus management, Escape, Cancel, validation, and draft preservation.
- Explicit transaction dates defaulting to today in Singapore, independently of the reporting-month filter.
- Monthly totals, category budgets, spending history, and explainable month-end projections.
- Search and filter transactions; manage monthly budget limits and add categories.
- Create savings goals and record contributions separately from expenses.
- Separate sample-data and personal workspaces, with browser-local persistence and JSON backup export.
- Responsive desktop layout, mobile navigation, empty states, clear transaction text, and reduced-motion support.

The sample-data workspace opens first. Switch to **My finances** at the bottom of the sidebar to begin with empty personal records. Switching workspaces preserves each dataset separately. Nothing is published or sent to a server.

## Code map

```text
src/
  app/                 App shell, routes, workspace actions, and notifications
  components/          Modal, expense form, chart, transaction table, summaries
  features/
    overview/          Daily Overview
    transactions/      Searchable transaction history
    budgets/           Monthly budget and category editor
    goals/             Goal planning and recorded contributions
  hooks/               Browser-local state and persistence
  lib/                 Money, dates, financial rules, schemas, storage, sample data
  styles.css           Shared visual system and responsive layout
tests/                 Financial rules, storage boundaries, and modal interactions
```

## Stack and decisions

React, TypeScript, Vite, React Router, Tailwind CSS, Recharts, React Hook Form, Zod, Radix Dialog, and Lucide. Vitest and Testing Library cover calculations and key input behaviour. Prettier keeps the source formatting consistent. The chart and secondary screens load as separate bundles. The visual system is custom; no generated shadcn component collection is included yet.

Financial rules do not depend on React, browser storage, or AI. Runtime schemas validate saved data. A version field allows a later migration to database-backed records. No authentication, API secrets, Supabase connection, or AI calls are present in this milestone.

## Calculation assumptions

- The remaining expense budget is the monthly limit minus expenses, not a bank balance.
- Current-month projections include recorded fixed expenses, unpaid scheduled bills, and daily variable spending projected across the month. These are estimates; early-month predictions are particularly sensitive to limited data.
- Link a fixed expense to a scheduled bill in the expense form to avoid counting it twice. Scheduled bills are currently supplied by the sample dataset; recurring-bill editing is a later milestone.
- Closed months show actual spending. Future months do not invent a variable-spending forecast.
- Goal contribution requirements divide the remaining target by monthly contribution slots, rounding up to a cent. The current month counts as one slot for a same-month goal; otherwise slots run across the remaining calendar months. These plans do not assume future income is guaranteed.
- Refunds, income records, bank transfers, and bank imports are outside this first implementation.

## Local data and next milestones

Records live in this browser profile's localStorage and are not encrypted or synced between devices. Export a backup before clearing browser data. If saved data is incompatible or unreadable, the app retains the original entry and avoids automatically overwriting it; recovery/import UI is planned.

Next: recurring-bill management, category archiving, backup import/CSV export, dated income schedules, Supabase authentication and row-level security, then optional server-side AI explanations. The broader plan is in `../FINANCE-PROJECT-PLAN.md`.
