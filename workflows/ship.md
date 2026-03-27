<purpose>
Deploy the Frontier OS app to Vercel and optionally register it in the Frontier app store. Runs preflight checks (build, typecheck, tests), deploys to Vercel, and guides through app registration via the ThirdParty SDK module.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
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
**Load project state and verify readiness.**

```bash
INIT=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" init ship)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `manifest`, `state`, `all_verified`, `project_path`, `roadmap_path`, `version`.

**If .frontier-app/ not found:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

**If `all_verified` is false:**
```
Warning: Not all phases have been verified.

Recommended: Run `/fos:status` to see which phases are incomplete.
Continue with deployment anyway? Some features may be missing.
```

Use AskUserQuestion:
- header: "Incomplete Phases"
- question: "Deploy with incomplete phases?"
- options:
  - "Deploy anyway" — Ship what's built
  - "Check status first" — Run /fos:status to see what's missing
  - "Cancel" — Go back and finish phases

**If "Check status first" or "Cancel":** Exit workflow.

**Display ship summary:**
```
## Ship: [App Name]

**Description:** [from manifest]
**SDK Modules:** [from manifest]
**Permissions:** [count]
**Dev Port:** [from manifest]
```
</step>

<step name="preflight_checks">
**Run all preflight checks. ALL must pass before deployment.**

```bash
echo "=== Preflight Checks ==="

# 1. TypeScript compilation
echo "--- TypeScript ---"
npx tsc --noEmit 2>&1
TSC_STATUS=$?

# 2. Vite build
echo "--- Build ---"
npm run build 2>&1
BUILD_STATUS=$?

# 3. Tests (if configured)
echo "--- Tests ---"
if grep -q '"test"' package.json 2>/dev/null; then
  npx vitest run --reporter=verbose 2>&1
  TEST_STATUS=$?
else
  echo "No test script found — skipping"
  TEST_STATUS=0
fi

# 4. FOS structure validation
echo "--- Structure ---"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate structure
STRUCT_STATUS=$?

# 5. FOS permissions validation
echo "--- Permissions ---"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate permissions
PERMS_STATUS=$?
```

**Report results:**
```
## Preflight Results

| Check | Status |
|-------|--------|
| TypeScript | [PASS/FAIL] |
| Build | [PASS/FAIL] |
| Tests | [PASS/FAIL/SKIPPED] |
| Structure | [PASS/FAIL] |
| Permissions | [PASS/FAIL] |
```

**If ANY check fails:**
```
Preflight failed. Fix the issues above before deploying.

[For TypeScript errors: show the specific errors]
[For build errors: show the Vite error output]
[For test failures: show failing test names]
[For structure issues: list missing files or patterns]
[For permission issues: list missing permissions]
```

**Do NOT proceed to deployment if preflight fails.** The user must fix issues and re-run `/fos:ship`.
</step>

<step name="check_vercel_cli">
**Check if Vercel CLI is available.**

```bash
which vercel 2>/dev/null && vercel --version 2>/dev/null
```

**If Vercel CLI not found:**
```
Vercel CLI is not installed. Install it to deploy:

  npm i -g vercel

Then log in:

  vercel login

After that, re-run `/fos:ship`.
```

Use AskUserQuestion:
- header: "Vercel CLI"
- question: "Vercel CLI is not installed. What do you want to do?"
- options:
  - "Install it now" — Run `npm i -g vercel` and continue
  - "Skip deployment" — Just run preflight, I'll deploy manually
  - "Cancel" — Exit

**If "Install it now":**
```bash
npm i -g vercel
echo "Vercel installed. Run 'vercel login' to authenticate, then re-run /fos:ship."
```
Exit — user needs to authenticate manually.

**If "Skip deployment":** Jump to update_state step, mark as "preflight-passed".
</step>

<step name="deploy_to_vercel">
**Deploy to Vercel production.**

```bash
# Check if already linked to a Vercel project
if [ -d ".vercel" ]; then
  echo "Vercel project already linked."
else
  echo "First deployment — Vercel will prompt for project setup."
fi

# Deploy to production
vercel --prod 2>&1
DEPLOY_STATUS=$?
```

**If deployment succeeds:**
Extract the deployment URL from output.

```
## Deployed

URL: [deployment URL]
Status: Live

The app is now accessible at the URL above.
```

**If deployment fails:**
```
Deployment failed. Common issues:
- Not authenticated: run `vercel login`
- Build error on Vercel: check the build output above
- Missing environment variables: check Vercel dashboard
```
</step>

<step name="app_registration">
**Optionally register the app in the Frontier app store.**

Use AskUserQuestion:
- header: "App Store"
- question: "Register this app in the Frontier app store? This makes it discoverable to Frontier OS users."
- options:
  - "Register now" — Guide me through ThirdParty.createApp()
  - "Later" — Skip registration, I'll do it manually
  - "Not needed" — This is a private/internal app

**If "Register now":**
```
## App Registration

To register your app in the Frontier app store, you'll need to call the
ThirdParty SDK module's createApp() method. Here's how:

1. Open the Frontier OS developer portal
2. Navigate to "My Apps"
3. Click "Register New App"
4. Fill in:
   - **Name:** [from manifest]
   - **Description:** [from manifest]
   - **URL:** [deployment URL from step 4]
   - **Permissions:** [from manifest — the permissions your app requests]

Or use the SDK programmatically:
```typescript
const thirdParty = sdk.getThirdParty();
await thirdParty.createApp({
  name: "[app name]",
  description: "[description]",
  url: "[deployment URL]",
  permissions: [/* from manifest */]
});
```

Note: App registration requires developer access. If you don't have it,
contact a Frontier OS admin.
```

**If "Later" or "Not needed":** Continue to update_state.
</step>

<step name="update_state">
**Update STATE.md for ship completion.**

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "shipped"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:new-milestone"
```

Update STATE.md body:
- Status: Shipped
- Last activity: [today] — Deployed to Vercel
- Deployment URL: [URL if available]
- App store: [Registered / Not registered]
- Next command: /fos:new-milestone or /fos:add-feature

```bash
git add .frontier-app/
git commit -m "docs: v1 shipped — deployed to Vercel

URL: [deployment URL or 'manual deployment']
Preflight: all checks passed
App store: [registered/skipped]"
```
</step>

<step name="next_up">
**Display completion and next steps.**

```
## Shipped: [App Name]

[If deployed:] Live at: [URL]
[If skipped:] Preflight passed — deploy manually when ready.

Milestone v1 is complete. What's next?

────────────────────────────────────────
Next up: `/fos:new-milestone` or `/fos:add-feature`
  Start v2 with new features, or add a feature to the current milestone.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
