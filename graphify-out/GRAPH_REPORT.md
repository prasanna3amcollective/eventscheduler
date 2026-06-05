# Graph Report - event-scheduler  (2026-06-05)

## Corpus Check
- 93 files · ~104,619 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 577 nodes · 1123 edges · 38 communities (26 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d8d807a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_API Route Handlers|API Route Handlers]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Recurrence Generator|Recurrence Generator]]
- [[_COMMUNITY_UI Components (Carousel & Icons)|UI Components (Carousel & Icons)]]
- [[_COMMUNITY_Activity Form System|Activity Form System]]
- [[_COMMUNITY_Legacy Recurrence Engine|Legacy Recurrence Engine]]
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Profile & Icon Components|Profile & Icon Components]]
- [[_COMMUNITY_Architecture Concepts|Architecture Concepts]]
- [[_COMMUNITY_Activity Detail Modals|Activity Detail Modals]]
- [[_COMMUNITY_Calendar View|Calendar View]]
- [[_COMMUNITY_Responsibility Detail & Calendar Utils|Responsibility Detail & Calendar Utils]]
- [[_COMMUNITY_System Cron Seed|System Cron Seed]]
- [[_COMMUNITY_Main Page Shell|Main Page Shell]]
- [[_COMMUNITY_Login Form|Login Form]]
- [[_COMMUNITY_Database Seed (Main)|Database Seed (Main)]]
- [[_COMMUNITY_Seed Roles & Users|Seed Roles & Users]]
- [[_COMMUNITY_Tree Generator Script|Tree Generator Script]]
- [[_COMMUNITY_User API Routes|User API Routes]]
- [[_COMMUNITY_Security Seed|Security Seed]]
- [[_COMMUNITY_Generator Design Principles|Generator Design Principles]]
- [[_COMMUNITY_App Layout & Fonts|App Layout & Fonts]]
- [[_COMMUNITY_Holiday API|Holiday API]]
- [[_COMMUNITY_ACL Seed|ACL Seed]]
- [[_COMMUNITY_Instagram Embed|Instagram Embed]]
- [[_COMMUNITY_Prisma Seed (TS)|Prisma Seed (TS)]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_Holiday Awareness|Holiday Awareness]]
- [[_COMMUNITY_Generator Documentation|Generator Documentation]]
- [[_COMMUNITY_Project Overview|Project Overview]]
- [[_COMMUNITY_Agent Rules|Agent Rules]]
- [[_COMMUNITY_Fist Logo|Fist Logo]]
- [[_COMMUNITY_Community 36|Community 36]]

## God Nodes (most connected - your core abstractions)
1. `withAuth()` - 61 edges
2. `getSessionContext()` - 61 edges
3. `base()` - 48 edges
4. `compilerOptions` - 17 edges
5. `User()` - 17 edges
6. `scripts` - 14 edges
7. `parseRecurrenceForForm()` - 13 edges
8. `materializeTemplateWindow()` - 13 edges
9. `3AM Collective Movement — Project Documentation` - 12 edges
10. `secureFetch()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `getSecurityContext()`  [EXTRACTED]
  scripts/advance-materialization.ts → src/lib/auth.ts
- `main()` --calls--> `runDailyMaterializationMaintenance()`  [EXTRACTED]
  scripts/advance-materialization.ts → src/lib/recurrence/maintenance/advanceWindows.ts
- `POST()` --calls--> `generateOccurrenceDates()`  [EXTRACTED]
  src/app/api/activities/check-overlap/route.ts → src/lib/recurrence/expander.ts
- `ActivityForm()` --calls--> `parseRecurrenceForForm()`  [EXTRACTED]
  src/components/ActivityForm.tsx → src/lib/recurrence/parser.ts
- `ResponsibilityForm()` --calls--> `parseRecurrenceForForm()`  [EXTRACTED]
  src/components/ResponsibilityForm.tsx → src/lib/recurrence/parser.ts

## Hyperedges (group relationships)
- **Recurrence Migration System** — project_recurrence_architecture, project_shadow_mode, project_legacy_virtual_expansion, project_materialized_occurrences, project_recurrence_template [EXTRACTED 1.00]
- **Security & Auth Stack** — project_security_model, project_rbac, project_jwt_auth, project_acl_bypass [EXTRACTED 1.00]
- **Generator Design Principles** — project_generator_guarantees, project_idempotent_creation, project_rolling_window, project_lineage_tracking [EXTRACTED 1.00]

## Communities (38 total, 12 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.06
Nodes (68): GET(), POST(), GET(), POST(), GET(), isAuthorized(), POST(), PATCH() (+60 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.06
Nodes (34): devDependencies, autoprefixer, eslint, eslint-config-next, graphify, postcss, prisma, tailwindcss (+26 more)

### Community 2 - "Recurrence Generator"
Cohesion: 0.10
Nodes (33): compareVirtualToMaterialized(), generateOccurrences(), loadTemplateSnapshot(), materializeTemplateWindow(), reconcileFutureOccurrences(), asOf, BASE, ctx (+25 more)

### Community 3 - "UI Components (Carousel & Icons)"
Cohesion: 0.11
Nodes (31): AlertCircle(), AlertTriangle(), ArrowRight(), base(), ChevronLeft(), ChevronRight(), ChevronUp(), ClockFill() (+23 more)

### Community 4 - "Activity Form System"
Cohesion: 0.11
Nodes (15): ActivityData, ActivityForm(), ActivityFormProps, DAYS_OF_WEEK, User, Check(), Tag(), DAYS_OF_WEEK (+7 more)

### Community 5 - "Legacy Recurrence Engine"
Cohesion: 0.21
Nodes (21): buildOccurrenceCreatePayload(), buildRecurrenceRule(), applyExdates(), expandRecurringActivity(), generateOccurrenceDates(), extractByDays(), extractExdates(), extractFreq() (+13 more)

### Community 6 - "Admin Dashboard"
Cohesion: 0.12
Nodes (13): Acl, ACL_OPERATIONS, ACL_TABLES, AdminTab, Group, GroupMember, GroupRole, GROUPS_CATEGORIES (+5 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, jsxImportSource, lib (+12 more)

### Community 8 - "Profile & Icon Components"
Cohesion: 0.12
Nodes (14): CheckCircle(), X(), ERROR_MESSAGES, ProfileModalProps, UserData, COUNTRY_CODES, EMPTY_FORM, ERROR_MESSAGES (+6 more)

### Community 9 - "Architecture Concepts"
Cohesion: 0.15
Nodes (14): ACL Bypass Tables Pattern, Admin Interface (RBAC Config), Detach Reason Mechanism, JWT Authentication Flow, Legacy Virtual Expansion, Recurrence Lineage Tracking, Materialized Occurrences, Participant Registration & Attendance (+6 more)

### Community 10 - "Activity Detail Modals"
Cohesion: 0.10
Nodes (18): ActivityData, ActivityDetailModalProps, ERROR_MESSAGES, UserData, CalendarFill(), Clock(), Edit(), Users() (+10 more)

### Community 11 - "Calendar View"
Cohesion: 0.06
Nodes (21): Activity, ActivityCarouselProps, ActivityModalProps, ApiActivity, CalendarActivity, CalendarViewProps, CustomAgendaProps, FETCH_WINDOW (+13 more)

### Community 12 - "Responsibility Detail & Calendar Utils"
Cohesion: 0.07
Nodes (29): 10. Conventions & Gotchas, 11. Where to Go Next, 1. Project Overview, 2. Technology Stack, 3. Domain Model (Core Entities), 3AM Collective Movement — Project Documentation, 4. Recurrence Architecture (The Heart of the System), 5. Security Model (+21 more)

### Community 13 - "System Cron Seed"
Cohesion: 0.13
Nodes (15): ArrowLeft(), Layers(), Refresh(), Shield(), Trash(), UserGroup, UserRole, Group (+7 more)

### Community 14 - "Main Page Shell"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs, date-fns, jose, lucide-react, next, pg, @prisma/adapter-pg (+10 more)

### Community 15 - "Login Form"
Cohesion: 0.12
Nodes (15): code:ts (import {), code:bash (npm run test:generator), code:ts (import {), code:ts ({), CompareResult contract (used for continuous validation), Core Guarantees, Current Status (as of 2026-05), Default Rolling Window (+7 more)

### Community 16 - "Database Seed (Main)"
Cohesion: 0.29
Nodes (5): adapter, bcrypt, prisma, { PrismaClient }, { PrismaPg }

### Community 17 - "Seed Roles & Users"
Cohesion: 0.15
Nodes (11): buttonContainerStyle, cancelButtonStyle, cardStyle, formStyle, headerStyle, iconButtonStyle, inputStyle, labelStyle (+3 more)

### Community 18 - "Tree Generator Script"
Cohesion: 0.33
Nodes (5): AI Instructions: Pre-Requisite Steps, AI Mobile UI Development Guidelines, Code Structure & Organization, Core Mobile UI Principles to Follow, Execution Workflow

### Community 20 - "Security Seed"
Cohesion: 0.40
Nodes (4): code:bash (npm run dev), Deploy on Vercel, Getting Started, Learn More

### Community 21 - "Generator Design Principles"
Cohesion: 0.40
Nodes (5): Generator Core Guarantees, Idempotent Creation (skipDuplicates), Nightly Materialization Job, 45-Day Rolling Window, System Cron Automation User

### Community 22 - "App Layout & Fonts"
Cohesion: 0.33
Nodes (4): geistMono, geistSans, metadata, spaceMono

### Community 23 - "Holiday API"
Cohesion: 0.67
Nodes (3): GET(), isGovernmentHolidayName(), TAMIL_NADU_SPECIFIC

## Knowledge Gaps
- **227 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+222 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateOccurrenceDates()` connect `Legacy Recurrence Engine` to `API Route Handlers`, `Recurrence Generator`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `materializeTemplateWindow()` connect `Recurrence Generator` to `API Route Handlers`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.05656565656565657 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Recurrence Generator` be split into smaller, more focused modules?**
  _Cohesion score 0.0975609756097561 - nodes in this community are weakly interconnected._
- **Should `UI Components (Carousel & Icons)` be split into smaller, more focused modules?**
  _Cohesion score 0.10588235294117647 - nodes in this community are weakly interconnected._