# Graph Report - event-scheduler  (2026-06-16)

## Corpus Check
- 108 files · ~169,778 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 634 nodes · 1227 edges · 49 communities (35 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a4ae5868`
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
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]

## God Nodes (most connected - your core abstractions)
1. `getSessionContext()` - 63 edges
2. `withAuth()` - 61 edges
3. `base()` - 48 edges
4. `User()` - 18 edges
5. `compilerOptions` - 17 edges
6. `scripts` - 15 edges
7. `secureFetch()` - 15 edges
8. `parseRecurrenceForForm()` - 13 edges
9. `materializeTemplateWindow()` - 13 edges
10. `X()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `getSecurityContext()`  [EXTRACTED]
  scripts/advance-materialization.ts → src/lib/auth.ts
- `main()` --calls--> `runDailyMaterializationMaintenance()`  [EXTRACTED]
  scripts/advance-materialization.ts → src/lib/recurrence/maintenance/advanceWindows.ts
- `ActivityForm()` --calls--> `parseRecurrenceForForm()`  [EXTRACTED]
  src/components/ActivityForm.tsx → src/lib/recurrence/parser.ts
- `POST()` --calls--> `materializeTemplateWindow()`  [EXTRACTED]
  src/app/api/responsibilities/route.ts → src/lib/recurrence/generator/generator.ts
- `PUT()` --calls--> `reconcileFutureOccurrences()`  [EXTRACTED]
  src/app/api/recurrence-templates/[id]/route.ts → src/lib/recurrence/generator/generator.ts

## Hyperedges (group relationships)
- **Recurrence Migration System** — project_recurrence_architecture, project_shadow_mode, project_legacy_virtual_expansion, project_materialized_occurrences, project_recurrence_template [EXTRACTED 1.00]
- **Security & Auth Stack** — project_security_model, project_rbac, project_jwt_auth, project_acl_bypass [EXTRACTED 1.00]
- **Generator Design Principles** — project_generator_guarantees, project_idempotent_creation, project_rolling_window, project_lineage_tracking [EXTRACTED 1.00]

## Communities (49 total, 14 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.06
Nodes (62): GET(), POST(), GET(), POST(), formatParticipantNames(), PATCH(), PATCH(), DELETE() (+54 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.06
Nodes (35): devDependencies, autoprefixer, eslint, eslint-config-next, graphify, postcss, prisma, tailwindcss (+27 more)

### Community 2 - "Recurrence Generator"
Cohesion: 0.08
Nodes (40): GET(), isAuthorized(), compareVirtualToMaterialized(), generateOccurrences(), loadTemplateSnapshot(), materializeTemplateWindow(), reconcileFutureOccurrences(), asOf (+32 more)

### Community 3 - "UI Components (Carousel & Icons)"
Cohesion: 0.11
Nodes (30): AlertCircle(), AlertTriangle(), ArrowRight(), base(), ChevronLeft(), ChevronUp(), ClockFill(), Eye() (+22 more)

### Community 4 - "Activity Form System"
Cohesion: 0.10
Nodes (15): ActivityData, ActivityForm(), ActivityFormProps, DAYS_OF_WEEK, User, EditActivityModalProps, Check(), Clock() (+7 more)

### Community 5 - "Legacy Recurrence Engine"
Cohesion: 0.17
Nodes (24): POST(), ResponsibilityForm(), buildOccurrenceCreatePayload(), checkOverlapSchema, buildRecurrenceRule(), applyExdates(), expandRecurringActivity(), generateOccurrenceDates() (+16 more)

### Community 6 - "Admin Dashboard"
Cohesion: 0.12
Nodes (13): Acl, ACL_OPERATIONS, ACL_TABLES, AdminTab, Group, GroupMember, GroupRole, GROUPS_CATEGORIES (+5 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, jsxImportSource, lib (+12 more)

### Community 8 - "Profile & Icon Components"
Cohesion: 0.13
Nodes (13): Tag(), ERROR_MESSAGES, ProfileModalProps, UserData, COUNTRY_CODES, EMPTY_FORM, ERROR_MESSAGES, RegisterFormProps (+5 more)

### Community 9 - "Architecture Concepts"
Cohesion: 0.15
Nodes (14): ACL Bypass Tables Pattern, Admin Interface (RBAC Config), Detach Reason Mechanism, JWT Authentication Flow, Legacy Virtual Expansion, Recurrence Lineage Tracking, Materialized Occurrences, Participant Registration & Attendance (+6 more)

### Community 10 - "Activity Detail Modals"
Cohesion: 0.14
Nodes (11): ActivityData, ActivityDetailModalProps, ERROR_MESSAGES, UserData, CalendarFill(), Edit(), ResponsibilityData, ResponsibilityDetailModalProps (+3 more)

### Community 11 - "Calendar View"
Cohesion: 0.16
Nodes (9): ApiActivity, CalendarActivity, CalendarViewProps, CustomAgendaProps, FETCH_WINDOW, LOCALES, localizer, getHolidays() (+1 more)

### Community 12 - "Responsibility Detail & Calendar Utils"
Cohesion: 0.07
Nodes (29): 10. Conventions & Gotchas, 11. Where to Go Next, 1. Project Overview, 2. Technology Stack, 3. Domain Model (Core Entities), 3AM Collective Movement — Project Documentation, 4. Recurrence Architecture (The Heart of the System), 5. Security Model (+21 more)

### Community 13 - "System Cron Seed"
Cohesion: 0.08
Nodes (27): ArrowLeft(), CheckCircle(), ChevronRight(), Layers(), Refresh(), Share2(), Trash(), Users() (+19 more)

### Community 14 - "Main Page Shell"
Cohesion: 0.10
Nodes (21): dependencies, bcryptjs, date-fns, gsap, jose, lucide-react, next, npx (+13 more)

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
Cohesion: 0.29
Nodes (6): AI Instructions: Pre-Requisite Steps, AI Mobile UI Development Guidelines, Code Structure & Organization, Core Mobile UI Principles to Follow, Execution Workflow, Neo-Brutalism Design Aesthetics

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

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (3): ActivityModalProps, Info(), ShieldCheck()

### Community 40 - "Community 40"
Cohesion: 0.20
Nodes (9): Activity, ActivityCarousel(), ActivityCarouselProps, CARD_COLORS, Activity, ActivityCarouselProps, shuffle(), CalendarDays() (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (3): cursorRef, cursorRingRef, wrapper

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (4): LogOut(), StaggeredTransition, StaggeredTransitionProps, StaggeredTransitionRef

### Community 44 - "Community 44"
Cohesion: 0.32
Nodes (3): PlusCircle(), MarqueeBannerMobileProps, logoFiles

## Knowledge Gaps
- **245 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateOccurrenceDates()` connect `Legacy Recurrence Engine` to `Recurrence Generator`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `User()` connect `Admin Dashboard` to `UI Components (Carousel & Icons)`, `Activity Form System`, `Community 39`, `Profile & Icon Components`, `Community 42`, `Community 43`, `Activity Detail Modals`, `Community 44`, `Seed Roles & Users`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _246 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06282847587195413 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Recurrence Generator` be split into smaller, more focused modules?**
  _Cohesion score 0.08078431372549019 - nodes in this community are weakly interconnected._
- **Should `UI Components (Carousel & Icons)` be split into smaller, more focused modules?**
  _Cohesion score 0.10873440285204991 - nodes in this community are weakly interconnected._