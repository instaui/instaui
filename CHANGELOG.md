# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).
Note: versions `1.0.2` and `1.0.3` can never be published (npm reserved them from an unrelated 2016 package), so the release after `1.0.1` is `1.1.0`.

## 1.0.0-next.1 (unreleased)

Features for apps migrating from config-driven CRUD forks:

- **Lists:**
  - `list.tabs`: tabs above the list, each with its own filter, kept in `?tab=`.
  - `list.filterBar`: active-filter chips with clear buttons, plus optional saved views stored in localStorage.
- **Filters:**
  - `filter.paramRange: [from, to]` sends a range as two params (REST encoding and `paramUrlCodec`).
  - `filter.multiple: false` makes an enum or relation filter single-select.
  - `filter.widget: 'relation'` filters a plain id field with a relation picker.
- **Access and conditions:**
  - Access rules accept a function `(record, ctx) => boolean`.
  - Conditions (`visibleIf`, `requiredIf`, `readOnlyIf`, action conditions) receive the record being edited.
- **Custom row content:** `components.rowActions` renders it in each row, before the built-in actions.
- **Routing:** `InstaAdmin` accepts `paths`, for route schemes such as `view/{id}`.

## 1.0.0-next.0 (unreleased)

The new engine (plan phase R1). **Breaking:** `ItemCrud`, `RelationField`, `getRelationString`, `UI_CONSTANTS` and `formatDate`/`formatDateTime` are removed.

- `defineResource` + `InstaProvider` + `ResourceCrud` / `InstaAdmin`: one definition drives list, filters, detail, forms, actions and access.
- DataProvider contract with `createRestProvider` (fetch), `fromApiClient` (axios-style clients) and `createMemoryProvider`.
- `Where` condition/filter language shared by filters, field conditions and access rules.
- No router dependency: `historyAdapter`, `memoryAdapter`, or `createRouterAdapter` with your app's own hooks.
- TanStack Query for caching, deduplication and cancellation (new peer dependency `@tanstack/react-query ^5.90`). `react-router-dom` is no longer a peer.
- Fixes, each with a regression test:
  - **Navigation:** deep links keep their filters; Back closes an opened record.
  - **Dates and numbers:** calendar dates never shift across time zones; 0/1 render; enum labels display.
  - **Saves:** updates send only changed fields; cleared values are sent as `null`; form values never leak between records.
  - **Relations:** related records are labelled with one batched request.
  - **Links and URLs:** unsafe link schemes are refused; ids are always URL-encoded.
  - **Deletes and pages:** deletes confirm with a loading state; page resources never fetch a list.
- Notifications follow the host antd `<App>`; static `message` APIs are no longer used.

## 0.9.0-rc.1

A pre-1.0 release candidate. It repackages the existing `ItemCrud` component, **unchanged in behaviour**, with a correct modern package (plan phase R0). The new 1.0 engine will ship as `1.0.0-next.*`.

### Packaging

- Valid semver version (`0.9.0.rc1` was invalid and rejected by `npm publish`).
- ESM-only build with `tsc` (ES2020, `.d.ts`, declaration and source maps). This replaces the ES5 CommonJS output, which was mislabelled as `import`.
- A single entry point with a correct `exports` map (`types` first, `./package.json` exported) and `sideEffects: false`.
- `react`, `react-dom`, `antd`, `@ant-design/icons` and `dayjs` are now **peer** dependencies, so consumers no longer get duplicate copies. `react-router-dom` is a temporary peer until R1 removes the router dependency.
- Removed unused `axios` and `@babel/runtime`, and replaced `lodash` with a local `debounce`. The package now has **zero runtime dependencies**.
- Public types no longer deep-import `antd/es/*` (these broke `node16`/`nodenext` consumers).
- Added a LICENSE file (MIT).
- publint and `@arethetypeswrong/cli` run against the packed tarball in CI.

### Repository

- `dist/` and `.idea/` are no longer committed. The `.gitignore` is expanded.
- `.yarnrc.yml` uses the `node-modules` linker.
- Removed the outdated `docs/` and the broken `examples/simple-crud-app` (CRA with `react-scripts@^0.0.0`).
- Added ESLint (flat config), Prettier (2 spaces, applied once across the repo), EditorConfig and Vitest (jsdom, Testing Library, and MSW with unhandled requests failing tests).
- Added CI (lint, format, typecheck, test, version guard, package checks; Node 22 and 24; antd 5 and React 18 compatibility lanes) and a tag-triggered release workflow using npm trusted publishing with provenance.
- Added a version guard that refuses invalid semver and the burned versions `1.0.2`/`1.0.3`.
