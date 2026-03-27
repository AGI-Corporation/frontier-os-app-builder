---
name: fos:ship
description: Deploy to Vercel and register app in Frontier app store
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---
<objective>
Deploy the Frontier OS app to Vercel and optionally register it in the Frontier app store.

**Flow:** Preflight checks (build, tests, verification) → Vercel deploy → app registration

**After this command:** `/fos:new-milestone` to plan v2, or `/fos:add-feature` to extend.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/ship.md
@$HOME/.claude/frontier-os-app-builder/references/deployment.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the ship workflow from @$HOME/.claude/frontier-os-app-builder/workflows/ship.md end-to-end.
</process>
