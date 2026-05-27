# Graph Report - .  (2026-05-27)

## Corpus Check
- 98 files · ~424,965 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 475 nodes · 915 edges · 36 communities (25 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `withAuth()` - 51 edges
2. `getSessionContext()` - 51 edges
3. `base()` - 46 edges
4. `compilerOptions` - 17 edges
5. `User()` - 14 edges
6. `parseRecurrenceForForm()` - 13 edges
7. `materializeTemplateWindow()` - 13 edges
8. `scripts` - 12 edges
9. `normalizeRuleString()` - 10 edges
10. `safeRrulestr()` - 10 edges

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

## Communities (36 total, 11 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.06
Nodes (60): GET(), POST(), GET(), POST(), GET(), isAuthorized(), POST(), PATCH() (+52 more)

### Community 1 - "Package Dependencies"
Cohesion: 0.04
Nodes (47): dependencies, bcryptjs, date-fns, jose, lucide-react, next, pg, @prisma/adapter-pg (+39 more)

### Community 2 - "Recurrence Generator"
Cohesion: 0.09
Nodes (35): buildOccurrenceCreatePayload(), compareVirtualToMaterialized(), generateOccurrences(), loadTemplateSnapshot(), materializeTemplateWindow(), reconcileFutureOccurrences(), asOf, BASE (+27 more)

### Community 3 - "UI Components (Carousel & Icons)"
Cohesion: 0.12
Nodes (27): Activity, ActivityCarouselProps, AlertCircle(), ArrowLeft(), ArrowRight(), base(), CalendarDays(), CalendarFill() (+19 more)

### Community 4 - "Activity Form System"
Cohesion: 0.09
Nodes (20): ActivityData, ActivityForm(), ActivityFormProps, DAYS_OF_WEEK, User, AlertTriangle(), Check(), Repeat() (+12 more)

### Community 5 - "Legacy Recurrence Engine"
Cohesion: 0.23
Nodes (19): buildRecurrenceRule(), applyExdates(), expandRecurringActivity(), generateOccurrenceDates(), extractByDays(), extractExdates(), extractFreq(), extractRecurrenceInterval() (+11 more)

### Community 6 - "Admin Dashboard"
Cohesion: 0.09
Nodes (18): Acl, ACL_OPERATIONS, ACL_TABLES, AdminTab, Group, GroupMember, GroupRole, GROUPS_CATEGORIES (+10 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, jsxImportSource, lib (+12 more)

### Community 8 - "Profile & Icon Components"
Cohesion: 0.11
Nodes (13): Lock(), Mail(), Phone(), Save(), UserPlus(), ERROR_MESSAGES, ProfileModalProps, UserData (+5 more)

### Community 9 - "Architecture Concepts"
Cohesion: 0.15
Nodes (14): ACL Bypass Tables Pattern, Admin Interface (RBAC Config), Detach Reason Mechanism, JWT Authentication Flow, Legacy Virtual Expansion, Recurrence Lineage Tracking, Materialized Occurrences, Participant Registration & Attendance (+6 more)

### Community 10 - "Activity Detail Modals"
Cohesion: 0.14
Nodes (8): ActivityData, ActivityDetailModalProps, ERROR_MESSAGES, UserData, ActivityModalProps, Edit(), Eye(), X()

### Community 11 - "Calendar View"
Cohesion: 0.16
Nodes (9): ApiActivity, CalendarActivity, CalendarViewProps, CustomAgendaProps, FETCH_WINDOW, LOCALES, localizer, getHolidays() (+1 more)

### Community 12 - "Responsibility Detail & Calendar Utils"
Cohesion: 0.24
Nodes (7): Loader(), Tag(), ResponsibilityData, ResponsibilityDetailModalProps, buildGoogleCalendarUrl(), CalendarItem, toGoogleCalendarDate()

### Community 13 - "System Cron Seed"
Cohesion: 0.25
Nodes (8): adapter, bcrypt, crypto, generateStrongPassword(), prisma, { PrismaClient }, { PrismaPg }, seedSystemCron()

### Community 14 - "Main Page Shell"
Cohesion: 0.22
Nodes (4): Info(), LogOut(), PlusCircle(), ShieldCheck()

### Community 15 - "Login Form"
Cohesion: 0.33
Nodes (3): ERROR_MESSAGES, LoginFormProps, UserData

### Community 16 - "Database Seed (Main)"
Cohesion: 0.33
Nodes (4): adapter, prisma, { PrismaClient }, { PrismaPg }

### Community 17 - "Seed Roles & Users"
Cohesion: 0.33
Nodes (4): adapter, prisma, { PrismaClient }, { PrismaPg }

### Community 18 - "Tree Generator Script"
Cohesion: 0.40
Nodes (5): fs, generate(), OUTPUT_FILE, path, walk()

### Community 20 - "Security Seed"
Cohesion: 0.40
Nodes (3): bcrypt, prisma, { PrismaClient }

### Community 21 - "Generator Design Principles"
Cohesion: 0.40
Nodes (5): Generator Core Guarantees, Idempotent Creation (skipDuplicates), Nightly Materialization Job, 45-Day Rolling Window, System Cron Automation User

### Community 22 - "App Layout & Fonts"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 23 - "Holiday API"
Cohesion: 0.67
Nodes (3): GET(), isGovernmentHolidayName(), TAMIL_NADU_SPECIFIC

## Knowledge Gaps
- **179 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateOccurrenceDates()` connect `Legacy Recurrence Engine` to `API Route Handlers`, `Recurrence Generator`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `User()` connect `Admin Dashboard` to `UI Components (Carousel & Icons)`, `Activity Form System`, `Profile & Icon Components`, `Activity Detail Modals`, `Responsibility Detail & Calendar Utils`, `Main Page Shell`, `Login Form`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06230847803881512 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `Recurrence Generator` be split into smaller, more focused modules?**
  _Cohesion score 0.09302325581395349 - nodes in this community are weakly interconnected._
- **Should `UI Components (Carousel & Icons)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._