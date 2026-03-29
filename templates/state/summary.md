# Summary Template

Template for `.frontier-app/phases/XX-name/{phase}-{plan}-SUMMARY.md` — plan completion documentation.

---

## File Template

```markdown
---
phase: XX-name
plan: NN
subsystem: [primary category: scaffold, ui, feature, integration, sdk-module, etc.]
tags: [searchable tech: react, vite, tailwind, frontier-sdk, events, wallet]

requires:
  - phase: [prior phase this depends on]
    provides: [what that phase built that this uses]
provides:
  - [bullet list of what this plan built/delivered]
affects: [list of phase names that will need this context]

tech-stack:
  added: [libraries/tools added]
  patterns: [patterns established]

key-files:
  created: [important files created]
  modified: [important files modified]

key-decisions:
  - "Decision 1"
  - "Decision 2"

patterns-established:
  - "Pattern 1: description"
  - "Pattern 2: description"

sdk-modules-used: []

requirements-completed: []

duration: Xmin
completed: YYYY-MM-DD
---

# Phase [X]: [Name] — Plan [Y] Summary

**[Substantive one-liner — NOT "phase complete" or "scaffold done"]**

## Performance

- **Duration:** [time]
- **Started:** [ISO timestamp]
- **Completed:** [ISO timestamp]
- **Tasks:** [count completed]
- **Files modified:** [count]

## Accomplishments

- [Most important outcome]
- [Second key accomplishment]
- [Third if applicable]

## Task Commits

Each task was committed atomically:

1. **Task 1: [name]** — `abc123f` (feat/fix/scaffold)
2. **Task 2: [name]** — `def456g` (feat/fix/test)

## Files Created/Modified

- `src/App.tsx` — What it does
- `src/lib/sdk-context.tsx` — What it does

## SDK Integration Notes

[How SDK modules were integrated, any gotchas, patterns established for SDK usage.
Or "No SDK module integration in this plan" if scaffold-only.]

## Decisions Made

[Key decisions with brief rationale, or "None — followed plan as specified"]

## Deviations from Plan

[If no deviations: "None — plan executed exactly as written"]

[If deviations occurred:]

### Auto-fixed Issues

**1. [Category] Brief description**
- **Found during:** Task [N] ([task name])
- **Issue:** [What was wrong]
- **Fix:** [What was done]
- **Files modified:** [file paths]
- **Verification:** [How it was verified]

---

**Total deviations:** [N] auto-fixed
**Impact on plan:** [Brief assessment]

## Issues Encountered

[Problems and how they were resolved, or "None"]

## Verification Results

- [ ] Build: [pass/fail]
- [ ] Dev server: [pass/fail on port XXXX]
- [ ] TypeScript: [pass/fail]
- [ ] Dark theme: [pass/fail]
- [ ] Iframe mode: [pass/fail or N/A]
- [ ] Standalone mode: [pass/fail or N/A]

## Next Phase Readiness

[What's ready for next phase]
[Any blockers or concerns]

---
*Phase: XX-name*
*Completed: [date]*
```

<guidelines>

**Frontmatter:**
- MANDATORY — complete all fields
- `sdk-modules-used` tracks which Frontier SDK modules this plan touched
- `requirements-completed` lists requirement IDs fulfilled by this plan
- Enables automatic context assembly for future planning

**One-liner:**
Must be substantive. Examples:
- "Vite + React scaffold with SdkProvider, iframe detection, and dark Tailwind theme"
- "Event listing page with real-time updates via Events SDK module"
- "Wallet integration for USDC payments with transaction confirmation UI"

NOT: "Phase complete" / "Scaffold done" / "Feature implemented"

**SDK Integration Notes:**
- Document how SDK modules were wired up in this plan
- Document how SDK modules were wired up
- Note any SDK quirks or workarounds
- Helps future phases that use the same modules

**Verification Results:**
- Frontier-specific checks always included (dark theme, iframe, standalone)
- Mark N/A for checks not applicable to this plan
- All must pass before plan is considered complete

**After creation:** STATE.md updated with position, decisions, metrics.

</guidelines>

<example>

```markdown
---
phase: 01-scaffold
plan: 01
subsystem: scaffold
tags: [react, vite, tailwind, frontier-sdk, iframe-detection]

requires: []
provides:
  - "Vite + React project structure"
  - "SdkProvider context with useSdk hook"
  - "Iframe detection with standalone fallback"
  - "Dark theme via Tailwind"
affects: [02-event-listing, 03-event-creation]

tech-stack:
  added: [react, vite, tailwind, @frontiertower/frontier-sdk]
  patterns: [SdkProvider wrapper, useSdk hook, iframe detection utility]

key-files:
  created: [src/App.tsx, src/lib/sdk-context.tsx, src/lib/iframe.ts, src/components/Layout.tsx]
  modified: []

key-decisions:
  - "Used Tailwind for styling — matches Frontier OS design system"
  - "Iframe detection via window.self !== window.top with fallback UI"

patterns-established:
  - "SdkProvider: All SDK access via useSdk() hook, never direct instantiation"
  - "Dark theme: bg-neutral-950 base, text-white, no light mode support"

sdk-modules-used: []

requirements-completed: [PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05]

duration: 18min
completed: 2026-03-27
---

# Phase 1: Scaffold + Standalone Shell — Plan 1 Summary

**Vite + React scaffold with services layer, mock data, dark Tailwind theme on port 5180**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-27T10:00:00Z
- **Completed:** 2026-03-27T10:18:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Full Vite + React + TypeScript project scaffolded
- SdkProvider wraps app, useSdk() available everywhere
- Iframe detection works — shows standalone banner when not in Frontier OS
- Dark theme via Tailwind — bg-neutral-950 base, all components dark

## Task Commits

1. **Task 1: Scaffold Vite project** — `a1b2c3d` (feat: scaffold)
2. **Task 2: SdkProvider + iframe detection** — `e4f5g6h` (feat: sdk integration)
3. **Task 3: Dark theme + layout** — `i7j8k9l` (feat: dark theme)

## Files Created/Modified

- `src/App.tsx` — Root component with SdkProvider
- `src/lib/sdk-context.tsx` — SdkProvider + useSdk hook
- `src/lib/iframe.ts` — Iframe detection utility
- `src/components/Layout.tsx` — Dark theme shell
- `vite.config.ts` — Dev server on port 5180
- `tailwind.config.ts` — Dark theme configuration
- `tsconfig.json` — TypeScript strict mode
- `postcss.config.js` — Tailwind PostCSS setup

## SDK Integration Notes

- SDK initialized once in SdkProvider via useRef to prevent re-instantiation
- SDK destroyed on unmount via cleanup in useEffect
- useSdk() throws if used outside SdkProvider — fail-fast pattern
- No SDK modules used yet — just core initialization

## Decisions Made

- Used Tailwind instead of CSS modules — better dark theme support, matches Frontier OS
- Iframe detection uses window.self !== window.top — simple, reliable

## Deviations from Plan

None — plan executed exactly as written

## Verification Results

- [x] Build: pass
- [x] Dev server: pass on port 5180
- [x] TypeScript: pass (strict mode, no errors)
- [x] Dark theme: pass (no white backgrounds)
- [x] Iframe mode: pass (renders in Frontier OS)
- [x] Standalone mode: pass (shows fallback banner)

## Next Phase Readiness

- Scaffold complete, ready for feature development
- SdkProvider available for module integration in Phase 2
- No blockers

---
*Phase: 01-scaffold*
*Completed: 2026-03-27*
```

</example>
