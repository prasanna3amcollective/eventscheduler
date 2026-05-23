# Isolated Recurrence Generator Service

**Status:** PHASE 5 — Shadow generation complete (compare + best-effort wiring live; cutover pending in later phases)

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

## PHASE 5 — Shadow Mode (Production Wiring)

During PHASE 5 the generator is no longer dead code:

- `src/lib/recurrence/shadow.ts:ensureShadowTemplateAndMaterialize` is called (best-effort, post-create) from both
  `/api/activities` and `/api/responsibilities` POST handlers **only** for brand-new recurring masters
  (`isRecurring && recurrenceRule && !recurrenceTemplateId`).
- It creates a `RecurrenceTemplate`, calls `materializeTemplateWindow`, back-links the legacy master
  via `recurrenceTemplateId` + `generatedFromTemplateId`, then runs `compareVirtualToMaterialized`.
- A refined `isShadowGeneratedRow` predicate (exported from the same file) is applied in both GET list
  routes so the newly materialized rows (which correctly have `recurrenceRule: null`) are invisible to
  the UI. Back-linked masters still carry their `recurrenceRule` and continue to drive the legacy
  virtual expander → zero user-visible change.
- ACL safety: `RecurrenceTemplate` added to `aclBypassTables`; all generator writes receive the caller's
  `_context` so `sys_*` stamping and permission inheritance work.
- Every real create now logs either `match=true` or a loud `[Shadow Generation] MISMATCH` with the
  full `CompareResult`.

### Public API additions (PHASE 5)

```ts
import {
  ...,
  compareVirtualToMaterialized,   // returns CompareResult
} from '@/lib/recurrence/generator';

export type { CompareResult, GeneratorContext, ... } from '@/lib/recurrence/generator';
```

### CompareResult contract (used for continuous validation)

```ts
{
  templateId: string;
  virtualDates: Date[];            // what legacy expander would produce
  materializedDates: Date[];
  match: boolean;                  // date sets equal + no dataDrift
  missingInMaterialized: Date[];
  extraInMaterialized: Date[];
  dataDrift: any[];                // name/duration/category/endDateTime mismatches on overlap
  errors: string[];
}
```

### How to observe / force a mismatch (dev only)

- Create a recurring Activity or Responsibility via the normal UI.
- Watch server console: you will see `[Shadow Generation] match=true ...` (or the error variant).
- To inject deliberate drift: temporarily edit a materialized row in DB or change `computeEndDateTime`
  inside the generator, then create another series.
- The compare is also callable directly in tests or (later) from an admin dry-run endpoint.

See the master plan `.kilo/plans/1779524733532-eager-island.md` for the full shadow-mode rationale,
the exact `isShadowGeneratedRow` predicate, rollback story, and the post-PHASE-5 cutover roadmap.

## Implementation Phases (inside PHASE 4)

See the master plan at `.kilo/plans/1779521965088-clever-engine.md`.

## Future Integration (not yet)

- Called from a `RecurrenceTemplateService`
- Nightly / scheduled job for window advancement
- Versioning flows (`createNewVersion` → reconcile with `newVersionId`)

---

**Do not import this module from production code until the integration phase is explicitly approved.**
