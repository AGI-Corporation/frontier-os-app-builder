# Context Template

Template for `.frontier-app/phases/XX-name/{phase_num}-CONTEXT.md` — captures implementation decisions for a phase.

**Purpose:** Document decisions that downstream agents need. Planner uses this to know what choices are locked vs flexible. Executor uses this to know what to build.

**Key principle:** Categories emerge from what was actually discussed for THIS phase. An events phase has events-relevant sections, a payments phase has payments-relevant sections.

---

## File Template

```markdown
# Phase {{PHASE_NUM}}: {{PHASE_NAME}} — Context

**Gathered:** {{DATE}}
**Status:** Ready for planning

<domain>
## Phase Boundary

[Clear statement of what this phase delivers — the scope anchor.
This comes from ROADMAP.md and is fixed.
Discussion during /fos:discuss clarifies implementation within this boundary.]

</domain>

<decisions>
## Implementation Decisions

### [Area 1 that was discussed]
- **D-01:** [Specific decision made]
- **D-02:** [Another decision if applicable]

### [Area 2 that was discussed]
- **D-03:** [Specific decision made]

### SDK Usage
- **D-XX:** [Which SDK module methods to use and how]
- **D-YY:** [Data flow: SDK → component state → UI]

### Claude's Discretion
[Areas where user explicitly said "you decide" — Claude has flexibility here during planning/implementation]

- [Area Claude can decide]
- [Area Claude can decide]

</decisions>

<specifics>
## Specific Ideas

[Any particular references, examples, or "I want it like X" moments from discussion.
Product references, specific behaviors, interaction patterns, visual references.]

[If none: "No specific requirements — open to standard Frontier OS app patterns"]

</specifics>

<sdk_context>
## SDK Module Context

### Modules Used in This Phase

| Module | Methods | Purpose |
|--------|---------|---------|
| [Module] | [method1(), method2()] | [What they enable] |

### Integration Pattern
[How SDK data flows into the UI for this phase.
Example: "Events.list() → React Query → EventList component → EventCard"]

### Known SDK Constraints
[Any SDK limitations that affect this phase's implementation.
Example: "Events.list() returns max 50 items — need pagination"]

[If no SDK modules: "No SDK modules in this phase — UI/scaffold only"]

</sdk_context>

<references>
## References to Read

**Planner and executor MUST read these before working on this phase.**

### SDK Documentation
- `frontier-sdk/docs/[module].md` — [What this doc covers]

### Existing App Patterns
- `[app-name]/src/[path]` — [What pattern to reference]

### Project State
- `.frontier-app/PROJECT.md` — App vision, constraints, SDK modules
- `.frontier-app/REQUIREMENTS.md` — Requirements this phase addresses

[If no external references: "No external references — requirements fully captured in decisions above"]

</references>

<deferred>
## Deferred Ideas

[Ideas that came up during /fos:discuss but belong in other phases.
Captured here so they're not lost, but explicitly out of scope for this phase.]

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: XX-name*
*Context gathered: {{DATE}}*
```

---

## Good Examples

**Example: Events feature phase**

```markdown
# Phase 2: Event Listing — Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Display upcoming events from the Frontier Events module in a browsable list. Users can view event details and RSVP. Event creation is a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Layout
- **D-01:** Card grid layout, responsive — 1 column mobile, 2 tablet, 3 desktop
- **D-02:** Each card shows: event name, date/time, location, attendee count, RSVP button
- **D-03:** Cards sorted by date (soonest first), past events filtered out

### RSVP Flow
- **D-04:** Single-tap RSVP — no confirmation modal (keep it fast)
- **D-05:** Optimistic UI update — show RSVP immediately, revert on error
- **D-06:** RSVP count updates in real-time for all viewers

### Empty State
- **D-07:** "No upcoming events" with illustration — no CTA to create (that's a different phase)

### SDK Usage
- **D-08:** Use Events.list() for fetching, Events.rsvp() for RSVP action
- **D-09:** Poll every 30 seconds for new events (no WebSocket available)

### Claude's Discretion
- Loading skeleton design
- Exact card spacing and border radius
- Error toast styling
- Animation for RSVP button state change

</decisions>

<specifics>
## Specific Ideas

- "I want the event cards to feel like Luma's event pages — clean, focused on the key info"
- RSVP should feel instant — "tap and done, like a Like button"

</specifics>

<sdk_context>
## SDK Module Context

### Modules Used in This Phase

| Module | Methods | Purpose |
|--------|---------|---------|
| Events | Events.list(), Events.rsvp(), Events.get() | Fetch events, handle RSVP |

### Integration Pattern
Events.list() → React Query with 30s refetch → EventGrid component → EventCard with RSVP button → Events.rsvp() on click → optimistic update

### Known SDK Constraints
- Events.list() returns max 50 items — sufficient for v1, pagination deferred
- Events.rsvp() requires user identity from SDK — no anonymous RSVP

</sdk_context>

<references>
## References to Read

### SDK Documentation
- `frontier-sdk/docs/events.md` — Events module API, method signatures, return types

### Existing App Patterns
- `frontier-tower-pwa/src/components/EventCard.tsx` — Card pattern from the main PWA

### Project State
- `.frontier-app/PROJECT.md` — App vision and SDK modules
- `.frontier-app/REQUIREMENTS.md` — REQ-01 through REQ-03

</references>

<deferred>
## Deferred Ideas

- Event creation form — Phase 3
- Event categories/filtering — add to backlog
- Calendar view — future milestone

</deferred>

---

*Phase: 02-event-listing*
*Context gathered: 2026-03-27*
```

---

## Guidelines

**This template captures DECISIONS for downstream planning and execution.**

The output should answer: "What choices are locked? What's flexible? Which SDK methods to use?"

**Good content (concrete decisions):**
- "Card grid, 1/2/3 columns responsive"
- "Use Events.list() with 30s polling"
- "Optimistic UI for RSVP"
- "Sort by date, filter out past events"

**Bad content (too vague):**
- "Should look nice"
- "Good user experience"
- "Fast loading"
- "Use the SDK"

**SDK Module Context is mandatory:**
- Every Frontier OS app phase that touches SDK modules must document which methods are used
- Include the data flow: SDK call → state management → UI
- Note any SDK constraints that affect implementation

**After creation:**
- File lives in phase directory: `.frontier-app/phases/XX-name/{phase_num}-CONTEXT.md`
- /fos:plan reads this to create specific tasks
- /fos:execute reads this to know what choices are locked
- Downstream agents should NOT need to ask the user again about captured decisions
