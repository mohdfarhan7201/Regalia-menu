---
name: ordering-model-and-txns
description: Regalia POS ordering is captain-led (no guest self-order); order write-paths now require MongoDB transactions
metadata:
  type: project
---

Two confirmed constraints for Regalia-SAAS restaurant POS:

1. **Ordering is captain-led by design.** Guests scan QR → browse menu → call captain (table mode) or WhatsApp deep-link (room mode). There is NO guest self-order endpoint; `/api/orders` POST stays staff-only (admin/captain/cashier). Decided 2026-06-21 — do not "fix" the customer cart to POST orders unless the user reverses this.

2. **Order/billing/table-occupancy write paths now use MongoDB transactions** via `src/lib/db/withTransaction.ts`. This REQUIRES a replica set / Atlas (the app uses `mongodb+srv` Atlas, which supports it). A standalone mongod will throw on every order mutation. Every DB call inside a `withTransaction` block must pass `{ session }` or it escapes the transaction.

**Why:** table `isOccupied` had read-then-write races across ~8 handlers (stuck-occupied or wrongly-freed tables) and `pay_table` lost payment data on partial failure. Transactions make the status-change + occupancy + payment writes atomic.

**How to apply:** when adding any handler that changes order status AND table occupancy together, wrap it in `withTransaction` and thread the session. Related: [[regalia-secrets-rotation]].
