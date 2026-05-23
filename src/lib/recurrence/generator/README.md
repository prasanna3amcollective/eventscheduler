# Isolated Recurrence Generator Service

**Status:** PHASE 4 — In development (completely isolated)

This directory contains the heart of the hybrid rolling materialization architecture for the 3AM Collective Movement event scheduler.

## Public API

```ts
import {
  generateOccurrences,
  materializeTemplateWindow,
  reconcileFutureOccurrences,
} from '@/lib/recurrence/generator';

// 1. Pure date generation (asOf-aware)
const dates = generateOccurrences(rule, start, end, { asOf: new Date(), excludeDates: [...] });

// 2. Create missing future concrete rows (Activity or Responsibility)
await materializeTemplateWindow(prisma, templateId, { horizonDays: 60 });

// 3. Reconcile after rule / version change
await reconcileFutureOccurrences(prisma, templateId, { newVersionId: '...' });
```

## Core Guarantees

- **Isolation** — No existing route, form, or calendar component imports this module yet.
- **Idempotency** — Safe to call repeatedly; `createMany(skipDuplicates)` + unique constraint.
- **Historical integrity** — Never mutates past rows or rows with `detachReason !== 'none'`.
- **Template as source of truth** — `name`, `duration`, `category` are read from the `RecurrenceTemplate` row (added in this phase). `owner` is deliberately left null for responsibilities.
- **Participants** — Generated `Activity` rows start with zero `Participant` records. Registration happens per concrete occurrence.

## Default Rolling Window

- 60 days ahead of `asOf` (configurable via `horizonDays`).

## Testing

Run the isolated test suite (zero production DB impact for unit tests):

```bash
npm run test:generator
```

All tests live in `generator.test.ts` and use mocks for Prisma calls.

## Implementation Phases (inside PHASE 4)

See the master plan at `.kilo/plans/1779521965088-clever-engine.md`.

## Future Integration (not yet)

- Called from a `RecurrenceTemplateService`
- Nightly / scheduled job for window advancement
- Versioning flows (`createNewVersion` → reconcile with `newVersionId`)

---

**Do not import this module from production code until the integration phase is explicitly approved.**
