---
name: fos:execute
description: Execute all plans in a phase with automatic verification
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Execute all plans in a phase using wave-based execution, then automatically verify the result.

**Flow:** Analyze plan dependencies → spawn executor agents (parallel within waves) → spawn verifier agent

Orchestrator stays lean: discover plans, group into waves, spawn subagents, collect results. Each executor gets a fresh context window with the full execute-plan workflow.

**After this command:** Routes to `/fos:discuss <N+1>` for the next phase, or `/fos:ship` if all phases are done.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/execute.md
</execution_context>

<context>
Phase: $ARGUMENTS
</context>

<process>
Execute the execute workflow from @$HOME/.claude/frontier-os-app-builder/workflows/execute.md end-to-end.
</process>
