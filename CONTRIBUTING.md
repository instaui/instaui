# Contributing

## Setup

- Node **22.13+** (24 recommended; see `.nvmrc`) and Yarn via Corepack (`corepack enable`).
- `yarn install`, then `yarn ci` runs everything CI runs.

| Script                      | What it does                                                  |
| --------------------------- | ------------------------------------------------------------- |
| `yarn build`                | `tsc -p tsconfig.build.json` → `dist/` (ESM + `.d.ts` + maps) |
| `yarn typecheck`            | Type-check `src`, `test` and configs                          |
| `yarn lint` / `yarn format` | ESLint / Prettier                                             |
| `yarn test`                 | Vitest (jsdom). Unmocked network requests fail the test.      |
| `yarn check:docs`           | Type-check every `tsx` example in `docs/` against the source  |
| `yarn check:package`        | `npm pack`, then publint + attw on the tarball                |
| `yarn check:version`        | semver validity, burned versions, tag ↔ version match         |

## Scope

instaui renders **standard REST resources** from their definitions: lists, filters, detail, forms, actions and access. Anything specific to one app's screens (dashboards, wizards, editors) is a **custom view** in that app: a `kind: 'page'` resource or a `components.*` override, using `useApiClient()` or the data provider for its own requests. A feature belongs here only if it is about rendering or reaching REST resources in general.

## Layout

Three layers: `src/core`, then `src/react`, then `src/antd`. Each imports only the layers before it, and lint enforces it. `src/utils` holds small helpers any layer may use.

| Path               | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/`        | Plain TypeScript: no React, antd or TanStack. Resource definitions (`resource.ts`, `actions.ts`), the `Where` language (`where.ts`), codecs and payloads, list state and its URL codecs (`list-state.ts`), the DataProvider contract with its REST (`rest-provider.ts`), axios-style (`api-client.ts`) and in-memory implementations, list fallbacks (`lookup.ts`), `validateConfig` and `mergeResource`. The rules live here: which actions show and are enabled (`actions.ts`), access checks (`access.ts`), and list defaults, tabs and filters (`list-state.ts`). |
| `src/react/`       | React bindings, no antd: `InstaProvider` and its context, data hooks (TanStack Query), `useCan`, router adapters and routes, client-side links (`link.ts`), the submit pipeline, messages.                                                                                                                                                                                                                                                                                                                                                                            |
| `src/antd/`        | The antd renderer: `InstaApp`, `InstaAdmin`, `ResourceCrud`, `ResourceTable`, `ResourceDetail`, forms (`ResourceForm`, `ActionForm`, `FormFields`, and `form-parts.tsx` for what forms and dialogs share), action buttons and the confirm dialog (`actions.tsx`), `RelationSelect`, `FilterBar`, notifications.                                                                                                                                                                                                                                                       |
| `src/antd/crud/`   | `ResourceCrud`'s parts: running actions and their dialogs (`useActionRunner`), bulk selection, the list header, detail and form containers, view overrides.                                                                                                                                                                                                                                                                                                                                                                                                           |
| `src/antd/fields/` | Built-in field renderers: `displays`, `widgets`, `filters`, and their shared render context.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/utils/`       | Small local helpers in place of dependencies (`debounce.ts`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Keep files to one concern; when a component grows past a few hundred lines, split its parts into a folder beside it, as `crud/` does.

## Design rules

These keep the [three claims](README.md#why-instaui) true as the code grows.

- **Decisions go in the core; renderers draw.** Whether an action shows or is enabled, what a user may do, what a list filters by, and how values are encoded belong in `src/core` as plain functions with unit tests. `src/react` binds them to data and routing. `src/antd` draws and asks the core. If a change needs a new decision inside `src/antd`, the rule probably belongs in the core.
- **Keep the description data.** Prefer options that JSON can express: a `Where`, a registry key or a `{…}` template, with a function form alongside where it helps, as `idField`, `recordLabel` and `access` have. Today these options are code only: a field's and the form's `validate`, `form.beforeSubmit`, `form.validatePayload`, `form.confirm`, and an action's `run` and `form.initialValues`. Add to that list only when an option can't be data, and update [Server-driven config](docs/server-driven-config.md) when you do. Add new resource and field keys to `validateConfig`'s known keys, or it reports them as unknown.
- **Fit the API, don't change it.** Support a backend convention through the data provider's options (`encodeList`, `api.*`, fallbacks), never by expecting the API to change.

## Conventions

- **Single entry point.** Everything public is exported from `src/index.ts`. No deep imports, no subpath exports.
- **Imports.** Relative imports use explicit `.ts`/`.tsx` extensions; `tsc` rewrites them to `.js` on build. Use `import type` for types.
- **antd types** come from `'antd'` only (see `src/antd/compat.ts`), never `antd/es/*` or `antd/lib/*`.
- **No runtime dependencies.** Peers only. Small helpers live in `src/utils`.
- **No router imports.** Routing goes through hooks the app injects. Never import `react-router` directly.
- **Tests.** Every bug fix comes with a regression test, next to the code it covers (`src/<layer>/*.test.ts(x)`) and named for the behaviour it guards. Render antd UI with `render` from `test/render.tsx` (animations off, so closed dialogs leave the DOM); never match on transition class names or sleep. Use MSW for HTTP.
- **Public repo hygiene.** Never copy code, fixtures, endpoint names or data from private consumer apps into this repo. Use generic examples.

## Local development against an app

Link the checkout (`"instaui": "portal:../instaui"` with Yarn, or a preview package). Make sure the app's bundler dedupes the peers. For Vite, use `resolve.dedupe: ['react', 'react-dom', 'antd', '@ant-design/icons', 'dayjs']`.

## Releases

The preferred path is `.github/workflows/release.yml`, which publishes with npm trusted publishing and provenance once a trusted publisher is configured on npmjs.com. To release:

1. Set `version` in `package.json` and update `CHANGELOG.md`.
2. Merge to `main`.
3. Push the tag `v<version>`. Prerelease versions (`1.0.0-next.N`) publish to the `next` dist-tag.

Until trusted publishing is configured, an owner may publish manually from a clean checkout: `yarn ci && npm publish --tag next`. Prerelease versions **must** be given `--tag`, otherwise npm moves `latest`.
