---
name: fos:next
description: Auto-route to the next step in the workflow
allowed-tools:
  - Read
  - Bash
---
<objective>
Determine and route to the next logical step based on current project state.

Reads `.frontier-app/STATE.md` and the project artifacts to determine what's needed next:
- No context for current phase → `/fos:discuss N`
- No plans for current phase → `/fos:plan N`
- Unexecuted plans → `/fos:execute N`
- All phases done → `/fos:ship`
- Already shipped → `/fos:new-milestone` or `/fos:add-feature`
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/next.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the next workflow from @$HOME/.claude/frontier-os-app-builder/workflows/next.md end-to-end.
</process>
