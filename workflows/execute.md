<purpose>
Execute all plans in a phase using wave-based execution. Orchestrator stays lean — delegates plan execution to subagents, each getting a fresh context window with the full execute-plan workflow. After all plans complete, spawns a verifier to confirm the phase delivers what it promised.
</purpose>

<core_principle>
Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans -> analyze deps -> group waves -> spawn agents -> collect results -> verify.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
</required_reading>

<available_agent_types>
Valid FOS subagent types (use exact names):
- fos-researcher — Researches existing Frontier OS apps for patterns
- fos-planner — Creates detailed execution plans from research + context
- fos-plan-checker — Reviews plan quality before execution
- fos-executor — Executes plan tasks, commits, creates SUMMARY.md
- fos-verifier — Verifies phase completion, checks quality gates
</available_agent_types>

<process>

<step name="initialize" priority="first">
**Phase number from argument (required).**

```bash
INIT=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" init execute "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase`, `phase_dir`, `plans`, `summaries`, `incomplete_plans`, `all_complete`, `manifest`, `state`, `project_path`, `roadmap_path`, `template_home`, `version`.

**If .frontier-app/ not found:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

**If `phase_dir` is null:**
```
Error: Phase [N] directory not found.

Run `/fos:plan [N]` first to create execution plans.
```
Exit workflow.

**If `plans` is empty:**
```
Error: No plans found in Phase [N].

Run `/fos:plan [N]` first to create execution plans.
```
Exit workflow.

**If `all_complete` is true:**
```
Phase [N] is already fully executed — all plans have SUMMARY.md files.

Run `/fos:status` to see project state, or `/fos:next` for the next step.
```
Exit workflow.

Report status:
```
## Phase [N]: [Name]

Found [total] plan(s), [incomplete] remaining to execute.
[If some complete: "[complete] plan(s) already done — resuming from where we left off."]
```
</step>

<step name="discover_and_group_plans">
**Read all plan files and group into execution waves.**

For each plan file in `incomplete_plans`:
1. Read the plan file
2. Parse frontmatter for: `wave`, `depends_on`, `autonomous`, `files_modified`
3. Parse `<objective>` for the plan description

**Group plans by wave number:**
- Wave 1: Plans with `depends_on: []` or `wave: 1`
- Wave 2: Plans with `wave: 2` (depends on Wave 1 plans)
- Wave 3+: Subsequent waves

**If no wave field in frontmatter:** Default to Wave 1 (no dependencies).

**Report execution plan:**
```
## Execution Plan

**Phase [N]: [Name]** — [count] plans across [wave_count] wave(s)

| Wave | Plans | What It Builds |
|------|-------|----------------|
| 1 | 01-01, 01-02 | [from plan objectives, 3-8 words] |
| 2 | 01-03 | [from plan objectives, 3-8 words] |
```
</step>

<step name="execute_waves">
**Execute each wave in sequence. Plans within a wave run in parallel.**

**For each wave:**

1. **Describe what's being built (BEFORE spawning):**

   ```
   ---
   ## Wave [N]

   **[Plan ID]: [Plan Name]**
   [2-3 sentences: what this builds, which SDK modules, why it matters]

   Spawning [count] agent(s)...
   ---
   ```

2. **Spawn fos-executor per plan:**

   ```
   Task(
     subagent_type="fos-executor",
     prompt="
       <objective>
       Execute plan [plan_number] of Phase [phase_number]-[phase_name].
       Commit each task atomically. Create SUMMARY.md when done. Update STATE.md.
       </objective>

       <execution_context>
       @$HOME/.claude/frontier-os-app-builder/workflows/execute-plan.md
       @$HOME/.claude/frontier-os-app-builder/templates/state/summary.md
       @$HOME/.claude/frontier-os-app-builder/references/sdk-surface.md
       @$HOME/.claude/frontier-os-app-builder/references/app-patterns.md
       @$HOME/.claude/frontier-os-app-builder/references/verification-rules.md
       </execution_context>

       <files_to_read>
       Read these files at execution start using the Read tool:
       - $PHASE_DIR/[plan_file] (The plan to execute)
       - .frontier-app/PROJECT.md (App vision, SDK modules)
       - .frontier-app/manifest.json (Permissions)
       - .frontier-app/STATE.md (Current state)
       - $PHASE_DIR/$PADDED-CONTEXT.md (User decisions, if exists)
       - $PHASE_DIR/$PADDED-RESEARCH.md (Research findings, if exists)
       </files_to_read>

       <success_criteria>
       - [ ] All tasks executed
       - [ ] Each task committed individually
       - [ ] SUMMARY.md created in phase directory
       - [ ] Build succeeds (npm run build)
       - [ ] No TypeScript errors (npx tsc --noEmit)
       - [ ] Dark theme verified
       </success_criteria>
     "
   )
   ```

3. **Wait for all agents in wave to complete before starting next wave.**

   **Completion verification (per plan):**
   ```bash
   SUMMARY_FILE="$PHASE_DIR/[plan_prefix]-SUMMARY.md"
   test -f "$SUMMARY_FILE" && echo "complete" || echo "incomplete"
   ```

   If SUMMARY.md exists and git log shows recent commits for this plan: treat as complete.
   If SUMMARY.md missing after agent returns: report as failed.

4. **Report wave completion:**

   For each completed plan, read its SUMMARY.md and extract:
   - One-liner description
   - Files created/modified
   - Any deviations from plan

   ```
   ---
   ## Wave [N] Complete

   **[Plan ID]: [Plan Name]**
   [What was built — from SUMMARY.md]
   [Notable deviations, if any]

   [If more waves: what this enables for next wave]
   ---
   ```

5. **Handle failures:**

   If a plan fails:
   - Report which plan failed and why (from agent output or error)
   - Ask: "Retry this plan?" / "Skip and continue?" / "Stop execution?"
   - If retry: re-spawn the executor for that plan
   - If skip: note the gap for the verifier
   - If stop: save state and exit
</step>

<step name="spawn_verifier">
**After all waves complete: verify the phase.**

```
Task(
  subagent_type="fos-verifier",
  prompt="
    <objective>
    Verify Phase [N]: [Name] delivers what the roadmap promised.
    Check all success criteria from ROADMAP.md are met.
    Check all SUMMARY.md files for issues.
    Run structural and permission validation.
    </objective>

    <files_to_read>
    Read these files at execution start using the Read tool:
    - .frontier-app/ROADMAP.md (Phase success criteria)
    - .frontier-app/PROJECT.md (App constraints)
    - .frontier-app/manifest.json (Permissions)
    - All SUMMARY.md files in $PHASE_DIR/
    </files_to_read>

    <verification_commands>
    Run these checks:
    - node '$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs' validate structure
    - node '$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs' validate permissions
    - npx tsc --noEmit (if app source exists)
    - npm run build (if package.json exists)
    </verification_commands>

    <output>
    Return structured result:
    - verdict: PASS or FAIL
    - criteria_results: each success criterion with pass/fail
    - gaps: list of gaps found (if any)
    - suggestions: optional improvements
    </output>
  "
)
```

**If verifier returns FAIL:**
```
## Verification Issues

The verifier found [count] issue(s):

1. [Issue description]
2. [Issue description]

Options:
- Generate fix plans for these gaps
- Address manually and re-verify
- Accept and move on (gaps noted)
```

Use AskUserQuestion to let user decide.

**If "Generate fix plans":** Create gap-closure plans in the phase directory and re-execute.
</step>

<step name="update_state_and_roadmap">
**Update STATE.md and ROADMAP.md.**

**Determine next phase:**
- Read ROADMAP.md for total phase count
- If current phase < total phases: next is discuss for phase N+1
- If current phase = total phases: next is ship

```bash
# Update state
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "phase-complete"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update phase "$PHASE"

# Set next action based on whether more phases remain
if [ "$PHASE" -lt "$TOTAL_PHASES" ]; then
  NEXT_PHASE=$((PHASE + 1))
  node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:discuss $NEXT_PHASE"
  node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-discuss"
else
  node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:ship"
  node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "milestone-complete"
fi
```

**Update ROADMAP.md:**
- Mark phase plans as complete in the progress table
- Update phase status to "Complete" (or "Partial" if gaps)
- Add completion date

**Update STATE.md body:**
- Current Position: Advance to next phase or "Ready to ship"
- Update progress bar
- Update metrics (plans completed, duration)
- Last activity: [today] — Executed Phase [N]: [Name]

```bash
git add .frontier-app/
git commit -m "docs: Phase $PHASE complete — [plan_count] plans executed

Verification: [PASS/FAIL]
Next: [/fos:discuss N+1 or /fos:ship]"
```
</step>

<step name="next_up">
**Display completion and next step.**

```
## Phase [N]: [Name] — Complete

Executed [plan_count] plan(s) across [wave_count] wave(s).
Verification: [PASS / PASS with notes / FAIL with gaps]

Plans completed:
- [Plan 01]: [one-liner from SUMMARY.md]
- [Plan 02]: [one-liner from SUMMARY.md]

[If more phases remain:]
────────────────────────────────────────
Next up: `/fos:discuss [N+1]`
  Discuss Phase [N+1]: [Name] — capture implementation decisions before planning.

Run `/clear` first to free your context window.
────────────────────────────────────────

[If all phases complete:]
────────────────────────────────────────
Next up: `/fos:ship`
  Deploy to Vercel and register in the Frontier app store.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
