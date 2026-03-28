# Verification Rules

Defines what the fos-verifier agent must check after generating or modifying a Frontier OS app. Every rule has a category, a description, and the expected pass condition.

---

## Structure Checks

These verify the generated file tree matches the standard Frontier OS app layout.

### S-01: Required files exist

The following files must be present:

```
index.html
package.json
postcss.config.js
tsconfig.json
vercel.json
vite.config.ts
src/main.tsx
src/lib/sdk-context.tsx
src/views/Layout.tsx
src/styles/index.css
```

**Pass condition:** All files exist at the project root (or under `src/` as indicated).

### S-02: Directory structure matches pattern

The `src/` directory must contain at minimum:

```
src/
  main.tsx
  lib/
    sdk-context.tsx
  views/
    Layout.tsx
  styles/
    index.css
```

Optional but expected directories:

```
src/
  router.tsx             # Present if app uses react-router-dom
  components/            # Present if app has reusable components
  hooks/                 # Present if app has custom hooks
  test/                  # Present if app has tests
    setup.ts
    lib/
    views/
    hooks/
    components/
```

**Pass condition:** All required paths exist. Optional paths should be present when the corresponding feature is used (e.g., `router.tsx` when `react-router-dom` is a dependency).

### S-03: No extraneous top-level files

The project root should not contain unexpected configuration files. Allowed top-level files:

```
index.html
package.json
postcss.config.js
tsconfig.json
vercel.json
vite.config.ts
.gitignore
.env.local
favicon.svg
README.md
```

**Pass condition:** No unexpected configuration files in the project root.

---

## SDK Integration Checks

These verify the app correctly integrates with the Frontier SDK.

### I-01: isInFrontierApp() call in Layout.tsx

`src/views/Layout.tsx` must import and call `isInFrontierApp` from `@frontiertower/frontier-sdk/ui-utils`.

**Pass condition:** The import statement `import { isInFrontierApp, createStandaloneHTML } from '@frontiertower/frontier-sdk/ui-utils'` is present, and `isInFrontierApp()` is called inside a `useEffect`.

### I-02: createStandaloneHTML() fallback in Layout.tsx

When `isInFrontierApp()` returns `false`, the Layout must call `createStandaloneHTML('App Name')` and render the result.

**Pass condition:** The following pattern exists in Layout.tsx:
```tsx
if (!inFrontier) {
  setStandaloneHtml(createStandaloneHTML('<AppName>'));
  setLoading(false);
  return;
}
```

And the standalone HTML is rendered via `dangerouslySetInnerHTML`:
```tsx
if (standaloneHtml) {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dangerouslySetInnerHTML={{ __html: standaloneHtml }}
    />
  );
}
```

### I-03: SdkProvider wrapping children in Layout.tsx

When inside the Frontier app, the Layout must wrap its children (either `<Outlet />` or a single component) with `<SdkProvider>`.

**Pass condition:** The return statement for the "in Frontier" case contains:
```tsx
<SdkProvider>
  <Outlet />  {/* or a single component */}
</SdkProvider>
```

### I-04: useSdk() hook available and used

`src/lib/sdk-context.tsx` must export `useSdk` and `SdkProvider`. Any view component that accesses the SDK must call `useSdk()`.

**Pass condition:**
- `sdk-context.tsx` exports `useSdk` and `SdkProvider`.
- Every file that accesses SDK methods imports `useSdk` from `../lib/sdk-context` (or appropriate relative path) and calls it within the component body.
- No direct `new FrontierSDK()` calls outside of `sdk-context.tsx`.

---

## Configuration Checks

These verify configuration files have the correct content.

### C-01: vercel.json has all 3 CORS origin blocks

The `vercel.json` file must contain exactly 3 header blocks, one for each allowed origin:

1. `https://os.frontiertower.io`
2. `https://sandbox.os.frontiertower.io`
3. `http://localhost:5173`

Each block must include:
- `Access-Control-Allow-Origin` matching the origin
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

It must also include the SPA rewrite:
```json
{ "source": "/(.*)", "destination": "/index.html" }
```

**Pass condition:** All 3 origin blocks are present with correct headers. The rewrite rule exists.

### C-02: tsconfig.json has strict mode and vitest types

`tsconfig.json` must include:
- `"strict": true`
- `"types": ["vitest/globals", "@testing-library/jest-dom"]` (when tests exist)
- `"noEmit": true`
- `"jsx": "react-jsx"`
- `"exclude": ["src/test", "**/*.test.ts", "**/*.test.tsx"]`

**Pass condition:** All listed fields are present with the expected values.

### C-03: postcss.config.js imports @tailwindcss/postcss

`postcss.config.js` must import from `@tailwindcss/postcss` and include `tailwindcss()` in its plugins array.

**Pass condition:** The file contains:
```js
import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: [tailwindcss()],
};
```

### C-04: package.json has correct scripts

`package.json` must include:

| Script    | Command              |
| --------- | -------------------- |
| `dev`     | `vite`               |
| `build`   | `tsc && vite build`  |
| `preview` | `vite preview`       |
| `lint`    | `tsc --noEmit`       |
| `test`    | `vitest run`         |

The `test` script may be omitted if the app has no tests and vitest is not in devDependencies.

**Pass condition:** All listed scripts are present with exact command values. If vitest is in devDependencies, the `test` script must be present.

### C-05: package.json has required dependencies

The following must be in `dependencies`:
- `@frontiertower/frontier-sdk`
- `react`
- `react-dom`

The following must be in `devDependencies`:
- `@tailwindcss/postcss`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `postcss`
- `tailwindcss`
- `typescript`
- `vite`

When the app uses routing, `react-router-dom` must be in `dependencies`.

When the app has tests, the following must be in `devDependencies`:
- `@testing-library/jest-dom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@vitest/coverage-v8`
- `jsdom`
- `vitest`

**Pass condition:** All listed packages are present in the correct section.

---

## Permission Checks

These verify that declared permissions match actual SDK usage.

### P-01: Manifest permissions match SDK method calls

Every SDK method called in source code must have a corresponding permission declared in the app's manifest/registry entry.

To verify:
1. Scan all `.ts` and `.tsx` files under `src/` (excluding `src/test/`).
2. Identify all SDK method calls (e.g., `sdk.getWallet().getBalance()` requires `wallet:getBalance`).
3. Compare against the permissions declared in the app manifest.

**Pass condition:** Every SDK method call in source has a corresponding permission. No undeclared SDK methods are called.

### P-02: No SDK methods called without corresponding permission

The inverse check: no source file should call an SDK method that is not in the manifest.

Method-to-permission mapping follows the pattern:
- `sdk.getWallet().<method>()` --> `wallet:<method>`
- `sdk.getStorage().<method>()` --> `storage:<method>`
- `sdk.getUser().<method>()` --> `user:<method>`
- `sdk.getCommunities().<method>()` --> `communities:<method>`
- `sdk.getPartnerships().<method>()` --> `partnerships:<method>`
- `sdk.getEvents().<method>()` --> `events:<method>`
- `sdk.getOffices().<method>()` --> `offices:<method>`
- `sdk.getThirdParty().<method>()` --> `thirdParty:<method>`
- `sdk.getChain().<method>()` --> `chain:<method>`
- `sdk.getNavigation().<method>()` --> `navigation:<method>`

**Pass condition:** No SDK method is called without the corresponding permission being declared.

### P-03: No unnecessary permissions

Permissions should not be declared if no corresponding SDK method is called in the source code. Unnecessary permissions violate the principle of least privilege.

**Pass condition:** Every declared permission has at least one corresponding SDK method call in the source code.

---

## Build Checks

These verify the app compiles and passes automated tests.

### B-01: tsc --noEmit passes

TypeScript type checking must complete without errors.

**Command:** `npx tsc --noEmit`

**Pass condition:** Exit code 0, no error output.

### B-02: vite build succeeds

The production build must complete successfully.

**Command:** `npm run build` (which runs `tsc && vite build`)

**Pass condition:** Exit code 0, `dist/` directory is created with `index.html` and bundled assets.

### B-03: vitest run passes

If tests exist (any `.test.ts` or `.test.tsx` files under `src/test/`), they must pass.

**Command:** `npx vitest run`

**Pass condition:** Exit code 0, all tests pass. If no test files exist, this check is skipped.

---

## Theme Checks

These verify the app uses the standard Frontier dark theme.

### T-01: Dark theme CSS variables defined in index.css

`src/styles/index.css` must contain a `@theme` block with at minimum these variables:

```
--font-sans
--color-primary
--color-primary-foreground
--color-accent
--color-accent-foreground
--color-alert
--color-alert-foreground
--color-danger
--color-danger-foreground
--color-success
--color-background
--color-foreground
--color-muted
--color-muted-foreground
--color-muted-background
--color-card
--color-card-foreground
--color-border
--color-input
--color-ring
--color-outline
```

**Pass condition:** All listed CSS custom properties are defined inside the `@theme` block.

### T-02: body class="dark" in index.html

`index.html` must have `class="dark"` on the `<body>` tag.

**Pass condition:** The `<body>` tag contains `class="dark"`.

### T-03: Plus Jakarta Sans font loaded

`index.html` must load the Plus Jakarta Sans font from Google Fonts with weights 400, 500, 600, and 700.

**Pass condition:** The following elements are in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### T-04: @import "tailwindcss" in index.css

`src/styles/index.css` must begin with `@import "tailwindcss";` to load Tailwind 4.

**Pass condition:** The first non-comment, non-empty line is `@import "tailwindcss";`.

### T-05: Base layer styles

The `@layer base` block must include:
- `box-sizing: border-box` on `*`
- `font-family: var(--font-sans)` on `body`
- `color: var(--color-foreground)` on `body`
- `background-color: var(--color-background)` on `body`
- `min-height: 100vh` on `body` and `#root`
- `#root` as flex column (`display: flex; flex-direction: column`)

**Pass condition:** All listed styles are present in the `@layer base` block.

---

## Summary Checklist

| ID   | Category      | Rule                                                | Severity |
| ---- | ------------- | --------------------------------------------------- | -------- |
| S-01 | Structure     | Required files exist                                | Error    |
| S-02 | Structure     | Directory structure matches pattern                 | Error    |
| S-03 | Structure     | No extraneous top-level files                       | Warning  |
| I-01 | SDK           | isInFrontierApp() call in Layout.tsx                | Error    |
| I-02 | SDK           | createStandaloneHTML() fallback in Layout.tsx        | Error    |
| I-03 | SDK           | SdkProvider wrapping children in Layout.tsx          | Error    |
| I-04 | SDK           | useSdk() hook available and used                    | Error    |
| C-01 | Configuration | vercel.json has all 3 CORS origin blocks            | Error    |
| C-02 | Configuration | tsconfig.json has strict mode and vitest types      | Error    |
| C-03 | Configuration | postcss.config.js imports @tailwindcss/postcss      | Error    |
| C-04 | Configuration | package.json has correct scripts                    | Error    |
| C-05 | Configuration | package.json has required dependencies              | Error    |
| P-01 | Permissions   | Manifest permissions match SDK method calls         | Error    |
| P-02 | Permissions   | No SDK methods called without permission            | Error    |
| P-03 | Permissions   | No unnecessary permissions declared                 | Warning  |
| B-01 | Build         | tsc --noEmit passes                                 | Error    |
| B-02 | Build         | vite build succeeds                                 | Error    |
| B-03 | Build         | vitest run passes (if tests exist)                  | Error    |
| T-01 | Theme         | Dark theme CSS variables defined in index.css       | Error    |
| T-02 | Theme         | body class="dark" in index.html                     | Error    |
| T-03 | Theme         | Plus Jakarta Sans font loaded                       | Error    |
| T-04 | Theme         | @import "tailwindcss" in index.css                  | Error    |
| T-05 | Theme         | Base layer styles present                           | Error    |
