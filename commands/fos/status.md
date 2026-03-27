---
name: fos:status
description: Show current project state — milestone, phases, modules, progress
allowed-tools:
  - Read
  - Bash
---
<objective>
Display the current state of the Frontier OS app project: milestone, phases with status, SDK modules, permissions, and what to do next.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/status.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the status workflow from @$HOME/.claude/frontier-os-app-builder/workflows/status.md end-to-end.
</process>
