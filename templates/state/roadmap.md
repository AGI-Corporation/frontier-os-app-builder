# Roadmap Template

Template for `.frontier-app/ROADMAP.md` — the phased build plan.

<template>

```markdown
# Roadmap: {{APP_NAME}}

## Overview

[One paragraph describing the journey from scaffold to shipped app.
What makes this app worth building and what does the finished product look like?]

## {{MILESTONE_VERSION}} Phases

- [ ] **Phase 1: Scaffold + SDK Core** — Project setup, SdkProvider, iframe detection, dark theme, standalone fallback
- [ ] **Phase 2: [Feature Name]** — [One-line description]
- [ ] **Phase 3: [Feature Name]** — [One-line description]
- [ ] **Phase N: [Feature Name]** — [One-line description]

## Phase Details

### Phase 1: Scaffold + SDK Core
**Goal**: Working app shell with SDK connected, running in iframe and standalone
**Depends on**: Nothing (always first)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):
  1. App renders inside Frontier OS iframe without errors
  2. App detects standalone mode and shows appropriate fallback UI
  3. Dark theme applied — no white backgrounds, no light-mode artifacts
  4. SdkProvider initializes and useSdk() returns a valid SDK instance
  5. Dev server runs on assigned port with HMR working
**Plans**: 1 plan

Plans:
- [ ] 01-01: Vite + React scaffold, SdkProvider, iframe detection, dark theme, dev config

### Phase 2: [Feature Name]
**Goal**: [What this phase delivers — one sentence]
**Depends on**: Phase 1
**Requirements**: [REQ-01, REQ-02, REQ-03]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
  3. [Observable behavior from user perspective]
**Plans**: [Number of plans or TBD]

Plans:
- [ ] 02-01: [Brief description of first plan]
- [ ] 02-02: [Brief description of second plan]

### Phase N: [Feature Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase [N-1]
**Requirements**: [REQ-XX, REQ-YY]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
**Plans**: [Number of plans or TBD]

Plans:
- [ ] NN-01: [Brief description]

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + SDK Core | 0/1 | Not started | - |
| 2. [Name] | 0/N | Not started | - |
| N. [Name] | 0/N | Not started | - |

---
*Roadmap created: {{DATE}}*
*Last updated: {{DATE}} after {{TRIGGER}}*
```

</template>

<guidelines>

**Phase 1 is always the same:**
- "Scaffold + SDK Core" — never skip, never rename
- Covers all PLAT-* requirements
- Always 1 plan (the scaffold is well-defined)
- Success criteria are standardized (see template)
- Uses templates from `templates/app/` directory

**Phase structure:**
- Phase 1: Scaffold (always)
- Phases 2-N: Feature phases (from requirements)
- Keep to 3-6 total phases for v1 — ship fast
- Each phase delivers something coherent and testable

**Success criteria:**
- 2-5 observable behaviors per phase
- Written from user perspective ("User can..." or "[Thing] works")
- Cross-checked against requirements during creation
- Flow downstream to `must_haves` in PLAN.md
- Verified after execution

**Plans within phases:**
- Phase 1 always has 1 plan
- Feature phases have 1-3 plans depending on complexity
- Plans use naming: {phase}-{plan}-PLAN.md (e.g., 02-01-PLAN.md)
- Plan count can be "TBD" initially, refined during /fos:plan

**Progress tracking:**
- Updated after each plan completes
- Status values: Not started, In progress, Complete, Deferred

</guidelines>

<frontier_specifics>

**Phase 1 always generates from templates:**
- `templates/app/vite.config.ts` → configured with app's dev port
- `templates/app/sdk-context.tsx` → SdkProvider + useSdk hook
- `templates/app/layout.tsx` → dark theme shell with iframe detection
- `templates/app/main-simple.tsx` or `main-router.tsx` → entry point
- `templates/app/tsconfig.json` → TypeScript config
- `templates/app/postcss.config.js` → Tailwind setup

**Feature phases should reference SDK modules:**
- If a phase uses Events module, note it in the goal
- If a phase uses Wallet module, note it in the goal
- This helps the planner know which SDK APIs to use

</frontier_specifics>
