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

| Path               | Contents                                                                                                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/`        | Framework-free: resource definitions (`resource.ts`, `actions.ts`), the `Where` language, codecs and payloads, the DataProvider contract and its REST (`rest-provider.ts`), axios-style (`api-client.ts`) and in-memory implementations, list fallbacks (`lookup.ts`), config validation. No React or antd (lint-enforced). |
| `src/react/`       | React bindings: `InstaProvider` and context, data hooks (TanStack Query), access, routing adapters, submit, messages. No antd.                                                                                                                                                                                              |
| `src/antd/`        | The antd renderer: `InstaApp`, `InstaAdmin`, `ResourceCrud`, `ResourceTable`, `ResourceDetail`, forms (`ResourceForm`, `ActionForm`, shared `FormFields`), `RelationSelect`, `FilterBar`.                                                                                                                                   |
| `src/antd/crud/`   | `ResourceCrud`'s parts: actions and their dialogs (`useActionRunner`), bulk selection, list header, detail/form containers, view overrides.                                                                                                                                                                                 |
| `src/antd/fields/` | Built-in field renderers: `displays`, `widgets`, `filters`, and their shared render context.                                                                                                                                                                                                                                |

Keep files to one concern; when a component grows past a few hundred lines, split its parts into a folder beside it, as `crud/` does.

## Conventions

- **Single entry point.** Everything public is exported from `src/index.ts`. No deep imports, no subpath exports.
- **Imports.** Relative imports use explicit `.ts`/`.tsx` extensions; `tsc` rewrites them to `.js` on build. Use `import type` for types.
- **antd types** come from `'antd'` only (see `src/antd/compat.ts`), never `antd/es/*` or `antd/lib/*`.
- **No runtime dependencies.** Peers only. Small helpers live in `src/utils`.
- **No router imports.** Routing goes through hooks the app injects. Never import `react-router` directly.
- **Tests.** Every bug fix comes with a regression test named after its plan ID (for example `B01-deep-link.test.tsx`). Use MSW for HTTP.
- **Public repo hygiene.** Never copy code, fixtures, endpoint names or data from private consumer apps into this repo. Use generic examples.

## Local development against an app

Link the checkout (`"instaui": "portal:../instaui"` with Yarn, or a preview package). Make sure the app's bundler dedupes the peers. For Vite, use `resolve.dedupe: ['react', 'react-dom', 'antd', '@ant-design/icons', 'dayjs']`.

## Releases

The preferred path is `.github/workflows/release.yml`, which publishes with npm trusted publishing and provenance once a trusted publisher is configured on npmjs.com. To release:

1. Set `version` in `package.json` and update `CHANGELOG.md`.
2. Merge to `main`.
3. Push the tag `v<version>`. Prerelease versions (`1.0.0-next.N`) publish to the `next` dist-tag.

Until trusted publishing is configured, an owner may publish manually from a clean checkout: `yarn ci && npm publish --tag next`. Prerelease versions **must** be given `--tag`, otherwise npm moves `latest`.
