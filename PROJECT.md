# 3AM Collective Movement — Project Documentation

> **For new developers and AI agents** — Read this file first to understand the entire system instantly.

---

## 1. Project Overview

**3AM Collective Movement** is a sophisticated recurring event and responsibility scheduler built for a collective/community movement based in Chennai, India.

It supports two primary concepts that run in parallel:

- **Activities** — Group events with participants, registration, attendance tracking, and pay-as-you-wish contributions.
- **Responsibilities** — Personal or assigned tasks with owners, used for operational ownership within the movement.

The system has **very strong recurrence capabilities** and has completed its migration to a hybrid materialization model with an active nightly maintenance job.

---

## 2. Technology Stack

| Layer              | Technology                          | Notes |
|--------------------|-------------------------------------|-------|
| Framework          | Next.js 16.2.4 (App Router)         | React 19.2 |
| Database           | PostgreSQL                          | Via Prisma |
| ORM + Extensions   | Prisma 7.8 + custom query extension | Heavy use of `$extends` for ACL + system columns + auto role sync |
| Adapter            | `@prisma/adapter-pg`                | PrismaPg adapter for connection pooling |
| Recurrence Engine  | `rrule` + custom generator          | New materialization system fully active |
| Calendar UI        | `react-big-calendar`                | With custom views and holiday integration |
| Auth               | JWT (via `jose`) stored in cookies  | Session-based |
| Security           | Custom RBAC + ACL system            | ServiceNow-inspired |
| Icons              | `lucide-react`                      | Comprehensive icon set |
| Styling            | Tailwind CSS 4                      | Permanent dark theme (no theme switcher) |
| Fonts              | Geist, Space Mono + Google Fonts    | Playfair Display, Courier Prime, Bebas Neue, IM Fell English |
| Validation         | Zod                                 | |
| Date handling      | `date-fns`                          | |
| Password hashing   | `bcryptjs`                          | |
| Animation          | GSAP                                | Scroll transitions, stagger effects |
| Spreadsheet export | `xlsx`                              | Data export to Excel |

**Important**: This is **not** the classic Next.js you may know. See `AGENTS.md` and read `node_modules/next/dist/docs/` for breaking changes in Next.js 16+.

---

## 3. Domain Model (Core Entities)

### Primary Business Entities

| Entity                | Purpose                                      | Recurring? | Notes |
|-----------------------|----------------------------------------------|------------|-------|
| `Activity`            | Group events with participants               | Yes        | Has `Participant` join table; `category` + `state` fields |
| `Responsibility`      | Owned tasks / duties                         | Yes        | Has `owner` / `ownerId`; `category` + `state` fields |
| `RecurrenceTemplate`  | Source of truth for recurring series          | N/A        | Versioned, typed (`activity` \| `responsibility`) |
| `Participant`         | Join table for Activity + User + role + attendance | -     | `type`, `attendance` (0/1/2), `payAsYouWish` (Float) |
| `Testimonial`         | Community testimonials (HTML content)        | No         | Mapped to `testimonials` table |

### Security & Organization (Enterprise Grade)

- `User` — Core identity (username, email, phone, password, `skills[]`)
- `Group` — Organizational units (e.g., "everyone")
- `Role` — Permission roles (e.g., "developer", "core", "inhouse")
- `AccessControlList` (ACL) — Fine-grained permissions per table + operation (mapped to `sys_acl`)
- `UserGroupM2M`, `UserRole`, `RoleGroupM2M` — Many-to-many relationships (mapped to `user_group_m2m`, `user_role`, `role_group_m2m`)

### System Columns (ServiceNow Style)

Every table includes these audit fields:
- `sys_created_by`, `sys_updated_by`
- `sys_created_at`, `sys_updated_at`

These are **automatically stamped** by the Prisma extension (see `src/lib/prisma.ts`).

---

## 4. Recurrence Architecture (The Heart of the System)

This is the most complex and important part of the project.

### Current State: Hybrid / Shadow Mode (PHASE 5 — Fully Operational)

The recurrence materialization system is **fully operational** with an active nightly maintenance job.

#### Legacy Approach (still active in UI)
- Every recurring `Activity` / `Responsibility` stores a `recurrenceRule` (iCal RRULE string).
- At read time, `expandRecurringActivity()` (in `src/lib/recurrence/expander.ts`) virtually generates occurrences.
- Detached instances are tracked via `detachReason` enum.

#### New Approach (fully active)
- A dedicated `RecurrenceTemplate` table is the **single source of truth**.
- Concrete future occurrences are **materialized** as real rows in `Activity` / `Responsibility` tables.
- Uses a pure, isolated **generator service** (`src/lib/recurrence/generator/`).
- Supports versioning of recurrence rules (`versionSeriesId`, `version`, `status`).

#### Shadow Mode (Current — PHASE 5)
- When a new recurring item is created via the old path, the system **also** creates a `RecurrenceTemplate` and materializes future rows **in the background**.
- Newly materialized rows are **hidden** from the UI using the `isShadowGeneratedRow()` predicate.
- Every creation logs a `CompareResult` that compares legacy virtual expansion vs materialized rows.
- This allows safe validation before the full cutover.

#### Nightly Materialization Job (Active)
- A daily maintenance job runs via external cron calling `GET /api/cron/advance-materialization` (or `npm run cron:advance`).
- Protected by `CRON_SECRET` (Bearer token or `x-cron-secret` header).
- Responsibilities:
  1. **Advance rolling horizon** — Materialize new occurrences up to 45 days ahead for active templates.
  2. **Close generation gaps** — Reconcile templates whose `lastGeneratedAt` is older than 7 days.
- All writes use the dedicated `system-cron` database user for full audit trail.
- Also available as a standalone CLI script: `npx tsx scripts/advance-materialization.ts`.

**Key Files**:
- `src/lib/recurrence/generator/` — Isolated, testable generator (PHASE 4/5)
- `src/lib/recurrence/shadow.ts` — Shadow-mode wiring and `isShadowGeneratedRow` filter
- `src/lib/recurrence/maintenance/advanceWindows.ts` — Nightly maintenance job logic
- `src/lib/recurrence/expander.ts`, `builder.ts`, `parser.ts` — Legacy virtual expansion (being phased out)
- `scripts/advance-materialization.ts` — CLI entrypoint for maintenance job
- `src/app/api/cron/advance-materialization/route.ts` — HTTP endpoint for nightly cron

**Core Guarantees of the Generator**:
- Idempotent (`createMany(skipDuplicates)`)
- Never mutates past or detached rows
- `asOf`-aware rolling window (currently maintained at 45 days by nightly job)
- Full lineage tracking via `recurrenceTemplateId` + `generatedFromTemplateId`

---

## 5. Security Model

Security is implemented at the **database access layer** via a Prisma client extension.

### How It Works (`src/lib/prisma.ts`)

1. Every Prisma operation passes through `$allOperations` on `$allModels`.
2. **ACL Check**: Looks for matching rows in `sys_acl` table (`table` + `operation`).
3. If ACLs exist for that table/operation, the caller's roles (from `UserRole`) are checked.
4. **System Column Stamping**: `sys_created_by` / `sys_updated_by` are set from the security context on every write.
5. **ACL Bypass Tables**: `AccessControlList`, `Role`, `UserRole`, `UserGroupM2M`, `RoleGroupM2M`, `Participant`, `RecurrenceTemplate`, `User`, `Group`, `Testimonial` — these are managed internally or have no ACL rows.
6. **Auto Role Sync**: When group membership changes (`UserGroupM2M` create/delete) or group-role assignments change (`RoleGroupM2M` create/delete), the system automatically rebuilds the user's effective roles by merging direct roles with group-inherited roles.

### Context Propagation
- `getSessionContext()` → `getSecurityContext()` reads JWT and loads roles.
- Context is propagated via `AsyncLocalStorage` (preferred) or the special `_context` arg (fallback).
- Helper: `withAuth(user, fn)` is available for low-level Prisma operations that bypass the extension.

**Auth Flow**:
- Login → JWT in `session_token` cookie
- `/api/auth/me` used for session restoration on the client (returns user + roles + permissions)

---

## 6. Application Structure

```
src/
├── app/
│   ├── page.tsx                     # Root: redirects to /home
│   ├── layout.tsx                   # Root layout (fonts, GlobalSearch)
│   ├── globals.css                  # Global styles + dark theme
│   ├── home/
│   │   ├── page.tsx                 # Main landing + dashboard shell
│   │   ├── Home.tsx                 # Full page component (logged-in / landing)
│   │   ├── Home.css                 # Desktop styles
│   │   ├── Home_mobile.tsx          # Mobile-responsive variant
│   │   ├── Home_mobile.css
│   │   ├── aboutus/                 # About Us section
│   │   └── testimonials/            # Testimonials section
│   ├── activities/
│   │   ├── [id]/page.tsx            # Activity detail page
│   │   └── @modal/(.)[id]/          # Intercepting route for activity detail modal
│   ├── groups/[id]/                 # Group pages
│   ├── responsibilities/[id]/       # Responsibility pages
│   ├── roles/[id]/                  # Role pages
│   └── api/
│       ├── activities/              # CRUD + register/unregister/close
│       │   └── check-overlap/       # Overlap detection
│       ├── responsibilities/        # CRUD + complete
│       ├── admin/                   # Groups, Roles, ACLs, User management, Tables
│       ├── users/
│       ├── events/                  # Aggregated events (activities + responsibilities)
│       ├── recurrence-templates/
│       ├── holidays/                # Holiday data
│       ├── testimonials/
│       ├── login, logout, auth/me
│       └── cron/
│           └── advance-materialization/  # Nightly maintenance endpoint
├── components/
│   ├── CalendarView.tsx             # react-big-calendar wrapper + custom logic
│   ├── ActivityForm.tsx / ResponsibilityForm.tsx
│   ├── ActivityModal.tsx, EditActivityModal.tsx
│   ├── ActivityDetailModal.tsx / ResponsibilityDetailModal.tsx / HolidayDetailModal.tsx
│   ├── AdminDashboard.tsx           # Full admin interface
│   ├── HeaderPanel.tsx              # Landing page header with sign-in
│   ├── BannerSlideshow.tsx          # Decorative image slideshow
│   ├── ActivityCarousel.tsx         # Activity card carousel
│   ├── MarqueeBanner.tsx            # Animated marquee text
│   ├── AboutUs.tsx                  # About the collective
│   ├── Testimonials.tsx             # Community testimonials
│   ├── ProfileModal.tsx             # User profile editing
│   ├── LoginForm.tsx / RegisterForm.tsx
│   ├── SkillPicker.tsx              # Skill selection UI
│   ├── UserTypeahead.tsx            # User search/autocomplete
│   ├── GlobalSearch.tsx             # Global search widget
│   ├── StaggeredTransition.tsx      # Page transition animations
│   ├── Icons.tsx                    # Custom icon components
│   ├── EmptyState.tsx               # Empty state placeholder
│   ├── ManageActivity.tsx           # Activity management view
│   ├── ActivityForm/
│   │   └── useActivityForm.ts       # Form logic hook
│   └── __tests__/
│       └── EmptyState.test.tsx
├── hooks/
│   └── useMouseMove.ts              # Mouse position tracking hook
└── lib/
    ├── recurrence/                  # The recurrence subsystem (see section 4)
    │   ├── generator/               # Isolated materializer (PHASE 4/5)
    │   ├── maintenance/             # Nightly job: advanceWindows.ts
    │   ├── expander.ts              # Legacy virtual expansion
    │   ├── shadow.ts                # Shadow-mode wiring
    │   └── ...                      # builder.ts, parser.ts, types.ts, utils.ts
    ├── prisma.ts                    # Extended Prisma client (ACL + stamping + role sync)
    ├── auth.ts, jwt.ts              # Authentication + JWT utilities
    ├── calendar.ts, holidays.ts, validations.ts
    ├── constants.ts                 # Categories, skills, location
    └── fetch.ts                     # Typed fetch utilities
```

### UI Sections (in `Home.tsx`)

The main application is a **landing page + dashboard** with these sections:

| Section | Description | Auth Required |
|---------|-------------|---------------|
| **Participate** | Landing: MarqueeBanner → BannerSlideshow → ActivityCarousel | No |
| **About Us** | Full-screen about the collective | No |
| **Testimonials** | Community testimonials | No |
| **Calendar View** | Interactive calendar (logged-in dashboard) | Yes |
| **Developer Panel** | Admin: Groups, Roles, ACL, Users | Yes (`developer` role) |

---

## 7. Key Features

- Recurring Activities and Responsibilities with complex rules (daily, weekly, custom via rrule)
- Participant registration + attendance tracking with pay-as-you-wish contributions
- Holiday awareness in the calendar
- Permanent dark theme
- Full admin interface for RBAC configuration (Groups, Roles, ACLs, Users)
- Profile management with skill selection
- Detachment / editing of individual occurrences in a series (via `detachReason`)
- Auto role synchronization via group membership
- Nightly materialization maintenance job
- Community testimonials
- Responsive design (dedicated mobile components)
- Animated page transitions (GSAP, IntersectionObserver scroll reveals, marquee banners)

---

## 8. Development Guide

### Getting Started

```bash
npm install
# Ensure PostgreSQL is running and DATABASE_URL is set in .env
npx prisma migrate dev
npm run dev
```

The Prisma client is generated to `src/generated/prisma/` (configured in `prisma/schema.prisma`).

### Seeding

```bash
npm run seed                  # General seed (everyone group, roles, etc.)
npm run seed:security         # Security-related seed
npm run seed:acl              # In-house ACL seed
npm run seed:roles-users      # Role/user wiring
npm run seed:system-cron      # Creates system-cron automation user + ACLs (required for nightly job)
```

Seeds live in `prisma/seed.js`.

### Testing the Recurrence Generator

The generator has an isolated test suite that does **not** touch your real database:

```bash
npm run test:generator
```

Tests live in `src/lib/recurrence/generator/**/*.test.ts`.

### Running the Nightly Maintenance Job

```bash
# Via CLI (for local testing / traditional cron):
npx tsx scripts/advance-materialization.ts

# Via HTTP endpoint (for cloud cron services):
# Set CRON_SECRET in .env, then:
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/advance-materialization
```

### Running Tests

```bash
npm test                      # Component tests (tsx --test)
```

Tests use Node's native test runner with `tsx` for TypeScript support.

### Important Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required)
- `CRON_SECRET` — Secret for authenticating nightly cron requests (required in production)
- JWT secret is handled internally via `src/lib/jwt.ts`

---

## 9. Current Status & Architectural Notes (as of June 2026)

- **Recurrence Migration**: In PHASE 5 (Shadow Mode). The nightly materialization job is **fully operational** with a 45-day rolling horizon. Legacy virtual expansion is preserved for the UI while the new generator runs in parallel for validation.
- **RecurrenceTemplate** model is fully integrated with versioning (`versionSeriesId`, `version`, `status`).
- **Nightly materialization job** runs daily via external cron calling `GET /api/cron/advance-materialization` or `npm run cron:advance`. It advances the 45-day horizon and closes gaps for stale templates. All writes use the dedicated `system-cron` database user.
- **Auto role sync** is active: when users join/leave groups or groups gain/lose roles, the system automatically rebuilds effective user roles.
- **Permanent dark theme**: The theme switcher has been removed; all rendering uses `data-theme='dark'`.
- **Mobile responsive**: Dedicated mobile components exist (`Home_mobile.tsx`, `BannerSlideshow_mobile.tsx`, `ActivityCarousel_mobile.tsx`, `MarqueeBanner_mobile.tsx`).
- **Testimonial model** was added for community testimonials (HTML content, mapped to `testimonials` table).
- ACL system is production-grade and applies to almost all business tables.

**When modifying recurrence logic**:
- Legacy expander lives in `src/lib/recurrence/`
- New generator lives in `src/lib/recurrence/generator/` (treat as a separate module)
- Maintenance job lives in `src/lib/recurrence/maintenance/`
- Shadow wiring is in `shadow.ts`

---

## 10. Conventions & Gotchas

1. **Never** mutate past occurrences or rows with `detachReason !== 'none'`.
2. The Prisma client is heavily extended — always go through the exported `prisma` instance.
3. Many tables bypass ACL checks intentionally (`aclBypassTables` — see `src/lib/prisma.ts` for the full list).
4. `RecurrenceTemplate` rows are versioned (`versionSeriesId` + `version` + `status`).
5. The UI still shows virtual expansions for recurring items during shadow mode.
6. System columns are stamped automatically — you rarely set them manually.
7. Group membership changes trigger automatic role synchronization — be aware of side effects when modifying `UserGroupM2M` or `RoleGroupM2M` directly.
8. The `system-cron` database user must exist for the nightly job to work (created by `npm run seed:system-cron`).
9. The root page (`/`) redirects to `/home` — all application routes are under `/home`.

---

## 11. Where to Go Next

| Goal                              | Start Here |
|-----------------------------------|------------|
| Understand recurrence             | `src/lib/recurrence/generator/README.md` + `types.ts` |
| Understand security               | `src/lib/prisma.ts` (the `$extends` block) |
| Add a new feature to Activities   | `src/app/api/activities/route.ts` + form components |
| Work on the generator             | `src/lib/recurrence/generator/generator.ts` (pure functions first) |
| Modify ACL behavior               | `src/lib/prisma.ts` + `prisma/seed/seed-inhouse-acl.js` |
| Modify nightly maintenance job    | `src/lib/recurrence/maintenance/advanceWindows.ts` + `src/app/api/cron/advance-materialization/route.ts` |
| Database changes                  | `prisma/schema.prisma` + migrations |
| Add new UI section                | `src/app/page.tsx` (routing) + `src/components/` + `src/app/home/Home.tsx` |
| Work on mobile layout             | `src/app/home/Home_mobile.tsx` + corresponding `_mobile.css` files |

---

**This document is the single source of truth for architectural understanding.**  
Keep it updated as the recurrence migration progresses.