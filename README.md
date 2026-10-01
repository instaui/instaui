# instaui

> **Status:** `0.9.0-rc.1` is a pre-1.0 release candidate. It repackages the existing `ItemCrud` component as a correct ESM package with peer dependencies. **1.0 is in development**, and its API will differ. The `0.0.x` releases are deprecated.

**Config-first CRUD for antd.** Define a resource once, in TypeScript or as JSON served by your backend, and get the list, filters, forms, detail view, actions and permissions from that one definition.

## Using 0.9.0-rc.1

```bash
npm install instaui@next
```

`ItemCrud` renders a list, detail view and forms for each configured endpoint. It needs two routes:

```tsx
import { ItemCrud } from 'instaui';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const crud = <ItemCrud apiClient={apiClient} config={{ endpoints }} />;

<BrowserRouter>
  <Routes>
    <Route path="/:entity" element={crud} />
    <Route path="/:entity/:operation/:id" element={crud} />
  </Routes>
</BrowserRouter>;
```

List requests expect the `apiClient` to resolve to `{ data: Item[], count }`. The endpoint and field configuration types (`EndpointConfig`, `FieldConfig`, `ApiClient`) are exported.

## What 1.0 will be

- **One definition drives everything:** list columns, URL-synced filters and sorting, create and edit forms, the detail view, row, bulk and toolbar actions, and access rules.
- **TypeScript or JSON.** Every behaviour slot accepts either code or a JSON value. A JSON config is just one that uses only JSON values, so a backend can serve it and validate it against a published JSON Schema.
- **Your backend, your conventions.** A small `DataProvider` contract with a configurable REST provider. Pagination, sorting, filter encoding and response envelopes are all plain functions you can override.
- **No router lock-in.** Routing goes through hooks you pass in (`useLocation`/`useNavigate` from your own react-router, or anything else).
- **antd 6 first,** with antd `^5.25` supported as a migration bridge.
- **Extensible without forking.** Custom field types, widgets, displays and page components plug in through registries, with headless hooks as the last escape hatch.

## Requirements (peer dependencies)

| Package              | Range                                                    |
| -------------------- | -------------------------------------------------------- |
| `react`, `react-dom` | `^18.2 \|\| ^19`                                         |
| `antd`               | `^5.25 \|\| ^6`                                          |
| `@ant-design/icons`  | `^5.6 \|\| ^6`                                           |
| `dayjs`              | `^1.11`                                                  |
| `react-router-dom`   | `^6.20 \|\| ^7` (0.9 only; 1.0 has no router dependency) |

The package is **ESM-only** and has a single entry point (`import { … } from 'instaui'`). With Jest, add `instaui` to `transformIgnorePatterns` exceptions. With antd 5 on React 19, install and import `@ant-design/v5-patch-for-react-19` in your app; instaui never imports it.

## Development

```bash
corepack enable
yarn install
yarn ci        # lint, format check, typecheck, tests, version guard, package checks
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and conventions.

## License

[MIT](LICENSE)
