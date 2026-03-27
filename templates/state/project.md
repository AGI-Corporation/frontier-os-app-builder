# PROJECT.md Template

Template for `.frontier-app/PROJECT.md` — the living app context document.

<template>

```markdown
# {{APP_NAME}}

## What This Is

{{APP_DESCRIPTION}}

[2-3 sentences. What does this app do and who is it for within the Frontier ecosystem?
Use the user's language and framing. Update whenever reality drifts from this description.]

## Core Value

[The ONE thing that matters most. If everything else fails, this must work.
One sentence that drives prioritization when tradeoffs arise.]

## SDK Modules

| Module | Why Needed | Key APIs |
|--------|-----------|----------|
| [Module] | [What it enables for this app] | [Primary methods used] |

[Only modules this app actually uses. Each must have a clear reason.
Common modules: Events, Wallet, Identity, Storage, Notifications, Social, Commerce.]

## Target Users

[Who uses this app? Be specific to the Frontier ecosystem.
- Primary users: [Who and what they want]
- Secondary users: [If applicable]
- Non-users: [Who this is NOT for — prevents scope creep]]

## Constraints

These are hard limits on all implementation choices:

- **Runtime**: Runs inside Frontier OS iframe — no direct DOM access to parent, postMessage communication only
- **Theme**: Dark theme mandatory — must match Frontier OS visual language
- **SDK**: All platform features via `@frontiertower/frontier-sdk` — no direct API calls to Frontier services
- **Auth**: Identity provided by Frontier OS — no custom auth flows
- **CORS**: All external API calls must handle CORS (app runs in iframe on different origin)
- **Standalone**: Must detect iframe vs standalone and degrade gracefully
- **[App-specific]**: [What] — [Why]

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [Choice] | [Why] | [Pending] |

---
*Last updated: {{DATE}} after {{TRIGGER}}*
```

</template>

<guidelines>

**What This Is:**
- Current accurate description of the app
- 2-3 sentences capturing what it does and who it's for
- Use the user's words and framing
- Update when the app evolves beyond this description

**Core Value:**
- The single most important thing this app does
- Everything else can fail; this cannot
- Drives prioritization when tradeoffs arise
- Rarely changes; if it does, it's a significant pivot

**SDK Modules:**
- Only list modules the app actually uses
- Each module must have a clear reason (not "might need later")
- Key APIs column helps planner and executor know which methods to use
- Updated when new modules are added or removed during development

**Target Users:**
- Specific to Frontier ecosystem (members, operators, admins)
- Include non-users to prevent scope creep
- Informs UX decisions throughout development

**Constraints:**
- The first 6 constraints are ALWAYS present for every Frontier OS app
- App-specific constraints added during /fos:new-app
- Include the "why" — constraints without rationale get questioned

**Key Decisions:**
- Significant choices that affect future work
- Added during /fos:discuss phases
- Track outcome when known:
  - Good — decision proved correct
  - Revisit — decision may need reconsideration
  - Pending — too early to evaluate

</guidelines>

<evolution>

**After each phase transition:**
1. SDK modules still accurate? Update if new modules needed or old ones dropped
2. Decisions to log? Add to Key Decisions
3. "What This Is" still accurate? Update if drifted
4. Constraints changed? (rare — usually only app-specific ones)

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Target Users check — did the audience shift?
4. SDK Modules audit — any unused modules to remove?

</evolution>
