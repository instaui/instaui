# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).
Note: versions `1.0.2` and `1.0.3` can never be published (npm reserved them from an unrelated 2016 package), so the release after `1.0.1` is `1.1.0`.

## Unreleased

### Breaking

- `messages.close` and `messages.loading` are removed: nothing displayed them.

### Added

- `messages.expandMenu` and `messages.collapseMenu` label `InstaAdmin`'s menu toggle (they were fixed English).
- Types used by public signatures are exported too: `BaseParams` (data provider calls), `ActionTarget` and `ActionText` (action `confirm` texts), `Notify` (`ViewProps.notify`), `WhereGroup` (part of `Where`) and `ListKeyParams` (`resourceKeys.list`).

### Fixed

- `api.search: 'client'` searches the whole list, page by page (up to 5,000 rows, in the list's sort order). It only searched the first 100 rows, so matches further down were missing.
- The list search box no longer keeps old text after the search is cleared elsewhere (its chip, "Clear all", a saved view or the browser's Back button).
- `ctx` on `ResourceCrud`, `openResource` and `RelationSelect` passes values through as given: dates and functions were turned into strings or dropped.

## 0.0.14

### Breaking (a smaller, honest API)

- **Removed options that did nothing:** `menu.group`, `menu.icon`, action `icon`, `onSuccess: 'close'`, field `span`, `props.link: 'drawer'`, and the `updateMany` / `deleteMany` provider methods (bulk endpoints go through `custom`).
- **Removed internal exports:** `setupDayjs`, `normalizeResource`, `conditionMet`, `resolveVars`, `fromConditions`, `renderTemplate`, `TemplateError`, `safeUrl`, `recordId`, `recordLabel`, `errorMessage`, `isAllowed` (use `useCan`), `andWhere`, `createInstaQueryClient`, `fetchRecordsByIds`, `useRecordsByIds`, `buildPath`, `matchView`, `useResourceRouting`, `FilterBar`, `FilterControl` (part of every table).
- `InstaApp`'s REST conventions prop is `rest` (`resource.api` keeps meaning a resource's path and list key).
- An action's dialog text is its `confirm`; `form.title` and `form.submitLabel` are gone.

### Added

- **Bulk actions:** custom actions with `placement: ['bulk']` add row checkboxes and run with `selection`. `list.selectable` limits which rows can be selected.
- **Action forms:** `action.form` adds inputs (ordinary fields; optional unless `required`) to the action's dialog; `run` receives them as `values`. Server field errors land on the inputs.
- `confirm` is the dialog for every action, with or without a form: `title`, `description`, `okText`, `danger`, `typeToConfirm`. Texts can be functions of `{ record, selection }`.
- **Embedded views:** `<ResourceCrud embedded ctx={…} filter={…} defaults={…} title={…} />` renders a resource inside another view, with its own list state and context, without touching the URL.
- `form.confirm(values, info)` asks before saving.
- `confirm.okText` and `confirm.danger` for custom actions: a custom action's confirm no longer says "Delete".
- `tags` fields accept `props.tokenSeparators`, so pasted lists split into values.
- **`<InstaApp apiClient resources>`:** a whole admin app from an HTTP client and resource definitions. Custom views reach the client with `useApiClient()`.
- **List fallbacks:** `api.lookup` (`'list'` or `{ search }`) for backends without a usable GET-one, and `api.search: 'client'` for lists that cannot search. Applied by `createRestProvider`; `withListFallbacks` wraps other providers.
- `ActionContext.openResource(name, options)` opens a related resource's list in a modal.
- Display `'table'` for nested rows, using another resource's columns.
- `RelationSelect` accepts `ctx`.
- `InstaAdmin` only routes menu entries (lookup-only resources are not screens); page resources show their heading.
- `defineResource` written inline in `resources={[…]}` no longer infers the record type as `never`.
- Internals: `ResourceCrud` split into `antd/crud/`, field renderers into `antd/fields/`, the axios adapter into `core/api-client.ts`, action types into `core/actions.ts`.

## 0.0.13

- `form.emptyValue: 'omit'`: updates leave empty values out instead of sending `null`.
- `form.validatePayload(payload)`: validates the final payload (after encoding and `beforeSubmit`) for rules written against the API's shape. Returns field messages, a form-level message, or nothing. A thrown error stops the save and is shown.
- `form.beforeSubmit` and `form.validatePayload` receive `record`, the record being edited (undefined on create).
- Display components receive `context: 'list' | 'detail'`, so one display can render differently in cells and in the detail view.
- Fix: `fromApiClient` accepts clients typed like axios. `responseType` was typed `string`, which axios's literal union could not satisfy.
- Docs: fitting an existing API (custom `encodeList`, per-resource `api` options, backends without GET-one), dependent relation pickers, `RelationSelect` in your own forms, and what widgets and displays receive.

## 0.0.12

The new engine, published on the 0.0.x line. (0.0.11 was lost to an npm registry publishing error and is never available.) The API is not stable yet and may change before 1.0.

### Engine

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

### Features for apps migrating from config-driven CRUD forks

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

## 0.9.0-rc.1

A pre-1.0 release candidate. It repackages the existing `ItemCrud` component, **unchanged in behaviour**, with a correct modern package (plan phase R0). The new engine shipped in 0.0.12.

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
