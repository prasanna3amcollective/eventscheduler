# 3AM Collective Movement — Project Documentation

> **For new developers and AI agents** — Read this file first to understand the entire system instantly.

---

## 1. Project Overview

**3AM Collective Movement** is a sophisticated recurring event and responsibility scheduler built for a collective/community movement.

It supports two primary concepts that run in parallel:

- **Activities** — Group events with participants, registration, attendance tracking, and pay-as-you-wish contributions.
- **Responsibilities** — Personal or assigned tasks with owners, used for operational ownership within the movement.

The system has **very strong recurrence capabilities** and is currently undergoing a major architectural migration from virtual recurrence expansion to a hybrid materialization model.

---

## 2. Technology Stack

| Layer              | Technology                          | Notes |
|--------------------|-------------------------------------|-------|
| Framework          | Next.js 16.2.4 (App Router)         | React 19.2 |
| Database           | PostgreSQL                          | Via Prisma |
| ORM + Extensions   | Prisma 7.8 + custom query extension | Heavy use of `$extends` for ACL + system columns |
| Recurrence Engine  | `rrule` + custom generator          | Hybrid legacy + new system |
| Calendar UI        | `react-big-calendar`                | With custom views and holiday integration |
| Auth               | JWT (via `jose`) stored in cookies  | Session-based |
| Security           | Custom RBAC + ACL system            | ServiceNow-inspired |
| Styling            | Tailwind CSS 4                      | Dark/light theme support |
| Validation         | Zod                                 | |
| Date handling      | `date-fns`                          | |

**Important**: This is **not** the classic Next.js you may know. See `AGENTS.md` and read `node_modules/next/dist/docs/` for breaking changes in Next.js 16+.

---

## 3. Domain Model (Core Entities)

### Primary Business Entities

| Entity                | Purpose                                      | Recurring? | Notes |
|-----------------------|----------------------------------------------|------------|-------|
| `Activity`            | Group events with participants               | Yes        | Has `Participant` join table |
| `Responsibility`      | Owned tasks / duties                         | Yes        | Has `owner` / `ownerId` |
| `RecurrenceTemplate`  | Source of truth for recurring series (new)   | N/A        | Versioned, typed (`activity` \| `responsibility`) |
| `Participant`         | Join table for Activity + User + role + attendance | -     | `type`, `attendance`, `payAsYouWish` |

### Security & Organization (Enterprise Grade)

- `User` — Core identity (username, email, phone, password)
- `Group` — Organizational units (e.g., "everyone")
- `Role` — Permission roles (e.g., "developer", "core", "inhouse")
- `AccessControlList` (ACL) — Fine-grained permissions per table + operation
- `UserGroupM2M`, `UserRole`, `RoleGroupM2M` — Many-to-many relationships

### System Columns (ServiceNow Style)

Every table includes these audit fields:
- `sys_created_by`, `sys_updated_by`
- `sys_created_at`, `sys_updated_at`

These are **automatically stamped** by the Prisma extension (see `src/lib/prisma.ts`).

---

## 4. Recurrence Architecture (The Heart of the System)

This is the most complex and important part of the project.

### Current State: Hybrid / Shadow Mode (PHASE 5)

The system is in the middle of a **major migration**:

#### Legacy Approach (still active in UI)
- Every recurring `Activity` / `Responsibility` stores a `recurrenceRule` (iCal RRULE string).
- At read time, `expandRecurringActivity()` (in `src/lib/recurrence/expander.ts`) virtually generates occurrences.
- Detached instances are tracked via `detachReason` enum.

#### New Approach (being introduced)
- A dedicated `RecurrenceTemplate` table is the **single source of truth**.
- Concrete future occurrences are **materialized** as real rows in `Activity` / `Responsibility` tables.
- Uses a pure, isolated **generator service** (`src/lib/recurrence/generator/`).
- Supports versioning of recurrence rules.

#### Shadow Mode (Current — PHASE 5)
- When a new recurring item is created via the old path, the system **also** creates a `RecurrenceTemplate` and materializes future rows **in the background**.
- Newly materialized rows are **hidden** from the UI using the `isShadowGeneratedRow()` predicate.
- Every creation logs a `CompareResult` that compares legacy virtual expansion vs materialized rows.
- This allows safe validation before the full cutover.

**Key Files**:
- `src/lib/recurrence/generator/` — Isolated, testable generator (PHASE 4/5)
- `src/lib/recurrence/shadow.ts` — Shadow-mode wiring and `isShadowGeneratedRow` filter
- `src/lib/recurrence/expander.ts`, `builder.ts`, `parser.ts` — Legacy virtual expansion (being phased out)

**Core Guarantees of the Generator**:
- Idempotent (`createMany(skipDuplicates)`)
- Never mutates past or detached rows
- `asOf`-aware rolling window (currently maintained at 45 days by nightly job)
- Full lineage tracking via `recurrenceTemplateId` + `generatedFromTemplateId`

---

## 5. Security Model

Security is implemented at the **database access layer** via a Prisma client extension.

### How It Works (`src/lib/prisma.ts`)

1. Every Prisma operation passes through `$allOperations`.
2. **ACL Check**: Looks for matching rows in `sys_acl` table (`table` + `operation`).
3. If ACLs exist for that table/operation, the caller's roles (from `UserRole`) are checked.
4. **System Column Stamping**: `sys_created_by` / `sys_updated_by` are set from the security context on every write.
5. Some tables are in `aclBypassTables` (including `RecurrenceTemplate`, `Participant`, junction tables) because they are managed internally.

### Context Propagation
- `getSessionContext()` → `getSecurityContext()` reads JWT and loads roles.
- Context is passed either via `AsyncLocalStorage` or the special `_context` arg.
- Helper: `withAuth(user, fn)` is available for low-level control.

**Auth Flow**:
- Login → JWT in `session_token` cookie
- `/api/auth/me` used for session restoration on the client

---

## 6. Application Structure

```
src/
├── app/
│   ├── api/
│   │   ├── activities/          # CRUD + register/unregister/close
│   │   ├── responsibilities/    # CRUD + complete
│   │   ├── admin/               # Groups, Roles, ACLs, User management
│   │   ├── users/
│   │   ├── recurrence-templates/
│   │   ├── login, logout, auth/me
│   │   └── holidays/
│   ├── activities/[id]/         # Detail page
│   ├── page.tsx                 # Main shell (tabs + modals)
│   └── layout.tsx
├── components/
│   ├── CalendarView.tsx         # react-big-calendar wrapper + custom logic
│   ├── ActivityForm.tsx / ResponsibilityForm.tsx
│   ├── ActivityModal.tsx, DetailModal, etc.
│   └── AdminDashboard.tsx
└── lib/
    ├── recurrence/              # The recurrence subsystem (see section 4)
    │   ├── generator/           # New isolated materializer (PHASE 4/5)
    │   ├── expander.ts          # Legacy virtual expansion
    │   └── ...
    ├── prisma.ts                # Extended Prisma client with ACL + stamping
    ├── auth.ts, jwt.ts
    ├── calendar.ts, holidays.ts, validations.ts
    └── constants.ts
```

**Main UI Tabs** (in `page.tsx`):
- **Calendar** — Visual overview using `react-big-calendar`
- **Scheduler** — Forms for creating/editing Activities & Responsibilities
- **Admin** — User, Group, Role, and ACL management

---

## 7. Key Features

- Recurring Activities and Responsibilities with complex rules (daily, weekly, custom via rrule)
- Participant registration + attendance tracking
- Holiday awareness in the calendar
- Theme switching (dark/light)
- Full admin interface for RBAC configuration
- Profile management
- Detachment / editing of individual occurrences in a series (via `detachReason`)

---

## 8. Development Guide

### Getting Started

```bash
npm install
# Ensure PostgreSQL is running and DATABASE_URL is set in .env
npx prisma migrate dev
npm run dev
```

### Seeding

```bash
npm run seed                  # General seed (everyone group, roles, etc.)
npm run seed:security         # Security-related seed
npm run seed:acl              # In-house ACL seed
npm run seed:roles-users      # Role/user wiring
npm run seed:system-cron      # Creates system-cron automation user + ACLs (required for nightly job)
```

### Testing the Recurrence Generator

The generator has an isolated test suite that does **not** touch your real database:

```bash
npm run test:generator
```

Tests live in `src/lib/recurrence/generator/generator.test.ts`.

### Important Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required)
- JWT secret is handled internally via `src/lib/jwt.ts`

---

## 9. Current Status & Architectural Notes (as of May 2026)

- **Recurrence Migration**: In PHASE 5 (Shadow Mode). Legacy behavior is preserved for users while the new generator runs in parallel for validation.
- **RecurrenceTemplate** model was added recently along with lineage fields (`recurrenceTemplateId`, `generatedFromTemplateId`, `detachReason`).
- The generator service is intentionally isolated — do **not** import it into production paths until the integration phase is complete.
- **Nightly materialization job** is now active: 45-day rolling horizon advancement + automatic gap reconciliation. Runs via external cron calling `/api/cron/advance-materialization` or `npm run cron:advance`. All writes use the dedicated `system-cron` database user.
- ACL system is production-grade and applies to almost all business tables.

**When modifying recurrence logic**:
- Legacy expander lives in `src/lib/recurrence/`
- New generator lives in `src/lib/recurrence/generator/` (treat as a separate module)
- Shadow wiring is in `shadow.ts`

---

## 10. Conventions & Gotchas

1. **Never** mutate past occurrences or rows with `detachReason !== 'none'`.
2. The Prisma client is heavily extended — always go through the exported `prisma` instance.
3. Many tables bypass ACL checks intentionally (`aclBypassTables`).
4. `RecurrenceTemplate` rows are versioned (`versionSeriesId` + `version`).
5. The UI still shows virtual expansions for recurring items during shadow mode.
6. System columns are stamped automatically — you rarely set them manually.

---

## 11. Where to Go Next

| Goal                              | Start Here |
|-----------------------------------|------------|
| Understand recurrence             | `src/lib/recurrence/generator/README.md` + `types.ts` |
| Understand security               | `src/lib/prisma.ts` (the `$extends` block) |
| Add a new feature to Activities   | `src/app/api/activities/route.ts` + form components |
| Work on the generator             | `src/lib/recurrence/generator/generator.ts` (pure functions first) |
| Modify ACL behavior               | `src/lib/prisma.ts` + `prisma/seed/seed-inhouse-acl.js` |
| Database changes                  | `prisma/schema.prisma` + migrations |

---

**This document is the single source of truth for architectural understanding.**  
Keep it updated as the recurrence migration progresses.
