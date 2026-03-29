# Frontier OS App Builder — Project Wiki

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Concepts](#key-concepts)
3. [Repository Structure](#repository-structure)
4. [Technology Stack](#technology-stack)
5. [Architecture](#architecture)
6. [Developer Workflow](#developer-workflow)
7. [Command Reference](#command-reference)
8. [Agent System](#agent-system)
9. [Frontier SDK Integration](#frontier-sdk-integration)
10. [Generated App Structure](#generated-app-structure)
11. [Testing Approach](#testing-approach)
12. [Deployment](#deployment)
13. [References & Knowledge Base](#references--knowledge-base)

---

## Project Overview

**Frontier OS App Builder** is a meta-prompting framework that turns app ideas into deployed [Frontier OS](https://os.frontiertower.io) applications through an AI-guided, multi-agent development workflow running inside **Claude Code**.

Developers install the framework once with `npx frontier-os-app-builder`, then use a set of `/fos:*` commands to guide Claude Code through every phase of building an app — from initial concept discussion all the way to deployment and registration in the Frontier app store.

### What It Solves

- Eliminates boilerplate and decision paralysis through opinionated, production-tested templates
- Embeds deep Frontier SDK knowledge (1 600+ lines of reference) directly into the AI context
- Bridges the gap between a natural-language app idea and a fully deployed, SDK-integrated app
- Maintains project state across Claude Code context-window resets via file-based state

### How Apps Are Used

Generated apps run **inside the Frontier OS shell as iframes**. They communicate with the host operating system through the Frontier SDK's PostMessage protocol, consuming platform services like wallets, user identity, events, communities, and on-chain interactions.

---

## Key Concepts

| Concept | Description |
|---|---|
| **Frontier OS** | The host operating system (os.frontiertower.io) that embeds third-party apps in iframes |
| **Frontier SDK** | npm package `@frontiertower/frontier-sdk` — 10 modules for platform integration |
| **Claude Code** | The AI coding assistant the framework is installed into |
| **Workflow** | An orchestration Markdown file that coordinates the multi-agent pipeline for one phase |
| **Agent** | A specialised sub-agent (researcher, planner, executor, verifier) spawned with fresh context |
| **State** | File-based project metadata in `.frontier-app/` that survives `/clear` commands |
| **Phase** | A self-contained dev cycle (discuss → plan → execute → verify) focused on one concern |
| **Manifest** | `.frontier-app/manifest.json` — declares which SDK permissions the app requests |

---

## Repository Structure

```
frontier-os-app-builder/
├── README.md                        # Quick-start guide and command reference
├── package.json                     # NPM package (npx entry point)
│
├── bin/
│   ├── install.js                   # Installer: copies framework into ~/.claude/
│   └── fos-tools.cjs                # CLI utility for scaffolding, module inference, state queries
│
├── commands/fos/                    # Claude Code /fos:* command definitions (Markdown + frontmatter)
│   ├── new-app.md                   # Bootstrap a new Frontier OS app
│   ├── discuss.md                   # Phase: requirements discussion
│   ├── plan.md                      # Phase: create execution plan
│   ├── execute.md                   # Phase: implement a plan
│   ├── ship.md                      # Deploy to Vercel + register with Frontier
│   ├── new-milestone.md             # Add a new milestone/phase
│   ├── add-feature.md               # Add a feature to current phase
│   ├── next.md                      # Auto-route to the next logical step
│   └── status.md                    # Display current project status
│
├── agents/                          # Specialised sub-agent definitions
│   ├── fos-researcher.md            # Reads existing apps and extracts patterns
│   ├── fos-planner.md               # Produces detailed PLAN.md files
│   ├── fos-plan-checker.md          # Reviews plan quality before execution
│   ├── fos-executor.md              # Writes all code for a plan wave
│   └── fos-verifier.md              # Runs quality gates after execution
│
├── workflows/                       # Orchestration logic (reads state, dispatches agents)
│   ├── new-app.md
│   ├── discuss.md
│   ├── plan.md
│   ├── execute.md
│   ├── execute-plan.md
│   ├── ship.md
│   ├── new-milestone.md
│   ├── add-feature.md
│   ├── next.md
│   └── status.md
│
├── references/                      # Built-in knowledge base (embedded into agent prompts)
│   ├── sdk-surface.md               # Full Frontier SDK API reference (~1 600 lines)
│   ├── module-inference.md          # Algorithm: business description → SDK modules
│   ├── app-patterns.md              # Standard directory layout, naming, conventions
│   ├── deployment.md                # Vercel config, CORS, app registration, webhooks
│   └── verification-rules.md        # Quality gates (design + SDK tiers)
│
├── templates/
│   ├── app/                         # Boilerplate for a new Frontier OS app (20 files)
│   │   ├── package.json             # Parameterised with app name + SDK version
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── vercel.json              # Pre-configured CORS headers
│   │   ├── postcss.config.js
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── router.tsx
│   │       ├── index.html
│   │       ├── styles/index.css
│   │       └── lib/
│   │           ├── frontier-services.tsx   # Service provider + mock services
│   │           ├── sdk-context.tsx         # SDK React context
│   │           └── sdk-services.tsx        # SDK adapter
│   └── state/                       # Empty state templates for .frontier-app/
│       ├── context.md
│       ├── project.md
│       ├── requirements.md
│       ├── roadmap.md
│       ├── state.md
│       ├── manifest.json
│       ├── plan.md
│       └── summary.md
│
└── app-x402-agent-market/           # Reference / example Frontier OS app
    ├── package.json
    ├── vercel.json
    ├── src/ (42 TypeScript files)
    └── .frontier-app/               # Demonstrates a complete project state directory
```

---

## Technology Stack

### Generated App Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.x |
| Routing | React Router DOM | 7.x |
| Build Tool | Vite | 7.x |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS + PostCSS | 4.x |
| Icons | React Icons | 5.x |
| Platform SDK | @frontiertower/frontier-sdk | 0.21 |
| Testing | Vitest | 4.x |
| Test DOM | jsdom | 27.x |
| Component Testing | @testing-library/react | 16.x |
| Coverage | @vitest/coverage-v8 | 4.x |
| Deployment | Vercel | — |

### Framework Tooling

| Tool | Purpose |
|---|---|
| Node.js 18+ | Installer + CLI runtime |
| CommonJS (fos-tools.cjs) | Scaffolding, module inference, state queries |
| Claude Code | Host AI assistant |

---

## Architecture

### High-Level: Prompt-as-Code Framework

Frontier OS App Builder is **not a monorepo** and contains **no runtime application code** of its own. Instead it is a *prompt-as-code* framework: a collection of Markdown files with embedded instructions that, once installed into Claude Code (`~/.claude/`), teach the AI to act as a structured development team.

```
User types /fos:new-app "a marketplace for AI agents"
        │
        ▼
Claude Code loads commands/fos/new-app.md
        │
        ▼
Workflow orchestrator (workflows/new-app.md)
  ├─ Reads/writes .frontier-app/ state files
  ├─ Calls fos-tools.cjs for module inference + scaffolding
  └─ Spawns sub-agents as needed
        │
        ├─ fos-researcher  → reads reference apps, extracts patterns → RESEARCH.md
        ├─ fos-planner     → produces phased PLAN.md with tasks & verification
        ├─ fos-plan-checker→ reviews plan quality, blocks bad plans
        ├─ fos-executor    → writes/edits all code files, runs builds
        └─ fos-verifier    → runs Tier 1 + Tier 2 quality gates
```

### State Machine

The framework maintains project state in a `.frontier-app/` directory inside every generated app:

| File | Purpose |
|---|---|
| `PROJECT.md` | App vision, SDK modules selected, constraints, target users |
| `REQUIREMENTS.md` | Feature list with requirement IDs |
| `ROADMAP.md` | Phase breakdown with status (pending / in-progress / done) |
| `manifest.json` | SDK permission declarations (machine-readable) |
| `STATE.md` | Current workflow position — bridges context-window resets |
| `CONTEXT.md` | User decisions, deferred ideas, Claude's discretion areas |
| `phases/PLAN-<n>.md` | Per-phase execution plans (tasks, subtasks, verification criteria) |
| `phases/SUMMARY-<n>.md` | Post-execution summaries written by fos-executor |

Because all state is in plain files, a developer can `/clear` Claude Code at any time and `/fos:next` will read `STATE.md` to resume exactly where they left off.

### Phase-Based Development

Each feature milestone follows a deterministic loop:

```
discuss  →  plan  →  execute  →  verify
   ↑                                │
   └─────── next milestone ─────────┘
```

Plans are further split into **waves** (sequential groups of parallel tasks) to enable safe, incremental implementation.

### SDK Communication Model

Generated apps run as iframes inside Frontier OS. The Frontier SDK uses a PostMessage protocol between the iframe and the host shell:

```
Frontier OS Shell (os.frontiertower.io)
        │   postMessage ↕
Generated App (Vercel)
  ├─ sdk-context.tsx   — provides SDK instance via React context
  ├─ sdk-services.tsx  — adapts SDK methods to service interface
  └─ frontier-services.tsx — single import point; also exports mock services for tests
```

---

## Developer Workflow

### Installation

```bash
npx frontier-os-app-builder
# Installs to ~/.claude/ — required once per machine
```

### Building a New App

```
1. /fos:new-app "describe your app idea"
   └─ Initialises .frontier-app/, infers SDK modules, scaffolds Vite+React project

2. /fos:discuss
   └─ Clarifies requirements, constraints, user stories

3. /fos:plan
   └─ Produces phased PLAN.md reviewed by fos-plan-checker

4. /fos:execute
   └─ Implements current plan wave: writes code, installs deps, runs build + tests

5. /fos:ship
   └─ Deploys to Vercel, registers app with Frontier OS app store
```

Use `/fos:next` at any point to auto-route to the next logical step based on `STATE.md`.

Use `/fos:status` to display a human-readable summary of the current project state.

### Adding Features

```
/fos:add-feature "description"   # Adds a feature to the current phase
/fos:new-milestone "description" # Starts a new development phase
```

---

## Command Reference

All commands live in `commands/fos/*.md` and are available as `/fos:<name>` inside Claude Code.

| Command | Argument | Description |
|---|---|---|
| `/fos:new-app` | `"app description"` | Bootstrap a new Frontier OS app from scratch |
| `/fos:discuss` | _(optional notes)_ | Requirements discussion with structured output |
| `/fos:plan` | _(optional focus)_ | Generate or update the phased execution plan |
| `/fos:execute` | _(optional wave)_ | Implement the current plan wave |
| `/fos:ship` | — | Deploy to Vercel + register with Frontier |
| `/fos:new-milestone` | `"milestone name"` | Add a new phase to the roadmap |
| `/fos:add-feature` | `"feature description"` | Append a feature to the current phase |
| `/fos:next` | — | Auto-route to the next step in the workflow |
| `/fos:status` | — | Display project state summary |

---

## Agent System

Agents are specialised sub-prompts spawned by workflows with a **fresh context window** to focus on a single concern. Each agent is defined in `agents/fos-*.md`.

### fos-researcher

- **Colour:** cyan
- **Tools:** Read, Bash, Grep, Glob
- **Responsibility:** Reads existing Frontier OS apps (including `app-x402-agent-market/`) and extracts copy-ready patterns, component structures, and SDK usage examples.
- **Output:** `RESEARCH.md` — concrete, actionable patterns for fos-executor to follow.

### fos-planner

- **Colour:** blue
- **Tools:** Read, Write, Bash, Task
- **Responsibility:** Translates requirements and research into a detailed `PLAN.md` with phases, waves, tasks, and per-task verification criteria.
- **Output:** `.frontier-app/phases/PLAN-<n>.md`

### fos-plan-checker

- **Colour:** yellow
- **Tools:** Read, Bash, Grep
- **Responsibility:** Reviews the plan for completeness, feasibility, and compliance with app patterns. Blocks execution of poor-quality plans.
- **Output:** Pass/fail verdict with recommendations.

### fos-executor

- **Colour:** green
- **Tools:** Read, Write, Edit, Bash, Grep, Glob
- **Responsibility:** Implements one wave of tasks from the plan. Writes/edits all code files, installs dependencies, runs builds and tests.
- **Output:** Committed code files + `.frontier-app/phases/SUMMARY-<n>.md`

### fos-verifier

- **Colour:** purple
- **Tools:** Read, Bash, Grep
- **Responsibility:** Runs quality gates after execution:
  - **Tier 1 (Design):** File structure, naming, TypeScript strictness, dark theme, Tailwind usage
  - **Tier 2 (SDK):** CORS origins, iframe detection, SDK permissions, standalone fallback
- **Output:** Verification report with pass/fail per gate.

---

## Frontier SDK Integration

The Frontier SDK (`@frontiertower/frontier-sdk@0.21`) is the primary integration point with the host OS.

### Modules

| Module | Purpose |
|---|---|
| **Wallet** | Read balances, send/receive tokens, sign messages |
| **User** | Current user identity, profile, avatar |
| **Events** | Platform event stream (social, community, chain) |
| **Communities** | Community membership, posts, governance |
| **Partnerships** | B2B relationships, partner data |
| **Offices** | Virtual office/workspace integrations |
| **Storage** | Persistent key-value storage scoped to the app |
| **Chain** | Direct blockchain operations, NFTs, contracts |
| **ThirdParty** | Webhooks and external service integrations |
| **Navigation** | Deep links, URL routing within Frontier OS |

### Module Inference

When a developer describes their app in natural language (e.g., "a marketplace for AI agents with payment"), `fos-tools.cjs` uses the algorithm in `references/module-inference.md` to map the description to the minimal set of required SDK modules. This determines which SDK permissions are written to `manifest.json`.

### React Integration Pattern

```
src/lib/
  ├── frontier-services.tsx   # Re-exports Evolution bridge types; single import point
  ├── sdk-context.tsx         # <FrontierSDKProvider> wraps the app
  └── sdk-services.tsx        # Adapts SDK to a typed service interface
```

The Evolution-Agent bridge types live in `app-x402-agent-market/src/lib/evolution-bridge.ts` and are re-exported through `frontier-services.tsx`.

---

## Generated App Structure

Every app produced by the framework follows the same layout:

```
my-frontier-app/
├── package.json             # React 19 + Vite 7 + Tailwind 4 + Frontier SDK
├── tsconfig.json
├── vite.config.ts
├── vercel.json              # CORS headers for all three Frontier origins
├── postcss.config.js
├── src/
│   ├── index.html
│   ├── main.tsx             # React root
│   ├── router.tsx           # React Router 7 route tree
│   ├── styles/index.css     # Tailwind base styles
│   ├── lib/
│   │   ├── frontier-services.tsx
│   │   ├── sdk-context.tsx
│   │   └── sdk-services.tsx
│   ├── views/               # Page-level components (one per route)
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks (one concern per file)
│   └── test/
│       ├── lib/
│       ├── views/
│       ├── components/
│       └── hooks/
└── .frontier-app/           # Framework project state (not deployed)
    ├── PROJECT.md
    ├── REQUIREMENTS.md
    ├── ROADMAP.md
    ├── manifest.json
    ├── STATE.md
    ├── CONTEXT.md
    └── phases/
        ├── PLAN-1.md
        ├── SUMMARY-1.md
        └── ...
```

---

## Testing Approach

### Tools

| Tool | Version | Role |
|---|---|---|
| Vitest | 4.x | Test runner (replaces Jest) |
| jsdom | 27.x | Browser DOM emulation |
| @testing-library/react | 16.x | Component rendering + queries |
| @testing-library/user-event | 14.x | User interaction simulation |
| @vitest/coverage-v8 | 4.x | Code coverage |
| @testing-library/jest-dom | latest | DOM matchers (`toBeInTheDocument`, etc.) |

### Conventions

- All tests live under `src/test/` mirroring the `src/` structure
- `src/test/setup.ts` bootstraps `@testing-library/jest-dom` matchers
- SDK services are mocked via the service interface (not the real SDK) — enables testing without an active Frontier OS host
- Coverage is collected via V8, not Babel — no transpilation overhead

### Running Tests

```bash
npm run test          # Watch mode (Vitest)
npm run test -- --run # Single pass
npm run coverage      # With coverage report
```

---

## Deployment

### Platform: Vercel

All generated apps are deployed to Vercel as static single-page applications.

**Build command:**
```bash
tsc && vite build
```

**Output directory:** `dist/`

### CORS Headers

Frontier OS loads apps inside `<iframe>` elements. The `vercel.json` template configures three `Access-Control-Allow-Origin` CORS header blocks — one for each allowed origin:

| Origin | Environment |
|---|---|
| `https://os.frontiertower.io` | Production Frontier OS |
| `https://sandbox.os.frontiertower.io` | Sandbox / staging |
| `http://localhost:5173` | Local development |

SPA routing is handled by a catch-all rewrite:
```json
{ "source": "/(.*)", "destination": "/index.html" }
```

### App Registration

After Vercel deployment, `/fos:ship` registers the app in the Frontier OS app store using the metadata in `manifest.json`. Webhook support (async platform events) is handled via the ThirdParty SDK module.

### Framework Installation & Uninstallation

```bash
# Install
npx frontier-os-app-builder

# Uninstall
npx frontier-os-app-builder --uninstall
```

The installer (`bin/install.js`) copies all commands, agents, workflows, references, and templates into `~/.claude/`.

---

## References & Knowledge Base

The `references/` directory is embedded into agent prompts at runtime — it is the primary mechanism by which agents know the Frontier SDK and platform conventions.

| File | Size | Contents |
|---|---|---|
| `sdk-surface.md` | ~1 600 lines | Complete Frontier SDK API: all modules, methods, types, examples |
| `module-inference.md` | ~350 lines | Algorithm for mapping plain-English descriptions to SDK modules |
| `app-patterns.md` | ~590 lines | Directory layout, naming conventions, Tailwind patterns, Router setup |
| `deployment.md` | ~345 lines | Vercel config, CORS blocks, app registration, webhook patterns |
| `verification-rules.md` | ~465 lines | Tier 1 (design) and Tier 2 (SDK) quality gates used by fos-verifier |

### Total Framework Knowledge

- **~8 900 lines** of prompting content across agents, workflows, references, and commands
- **20+ app template files** (HTML, TypeScript, CSS, JSON)
- **42-file reference application** (`app-x402-agent-market/`) demonstrating real SDK usage
- **3 package.json** configurations (framework, example app, template)
