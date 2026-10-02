# instaui

> **Status:** `0.0.14` is the current release of the new engine (introduced in `0.0.12`). It is pre-1.0, so the API may still change. 0.0.10 and earlier (`ItemCrud`) are deprecated.

**Config-first CRUD for antd.** Define a resource once, in TypeScript or as JSON served by your backend, and get the list, filters, forms, detail view, actions and permissions from that one definition.

## Quick start

```bash
npm install instaui @tanstack/react-query
```

```tsx
import { InstaAdmin, InstaProvider, createRestProvider, defineResource } from 'instaui';

const projects = defineResource({
  name: 'projects',
  recordLabel: '{name}',
  fields: [
    { key: 'name', type: 'text', required: true, list: { sortable: true }, filter: true },
    { key: 'budget', type: 'number', props: { min: 0 } },
    {
      key: 'status',
      type: 'enum',
      props: {
        options: [
          { value: 'OPEN', label: 'Open' },
          { value: 'DONE', label: 'Done' },
        ],
      },
      filter: true,
    },
    { key: 'startsOn', type: 'date' },
    { key: 'teamId', type: 'relation', props: { resource: 'teams' } },
  ],
  access: { delete: { status: { $ne: 'OPEN' } } },
});
const teams = defineResource({ name: 'teams', fields: [{ key: 'name', type: 'text' }] });

export const App = () => (
  <InstaProvider
    dataProvider={createRestProvider({ baseUrl: '/api' })}
    resources={[projects, teams]}
  >
    <InstaAdmin title="Admin" />
  </InstaProvider>
);
```

- **From your own HTTP client:** `<InstaApp apiClient={client} resources={[…]} />` is the whole app; custom screens are resources with `kind: 'page'` and call the same client through `useApiClient()`. See [Getting started](docs/getting-started.md).
- **Using your app's router:** pass `router={createRouterAdapter({ useLocation, useNavigate })}` with the hooks from your own `react-router-dom`, and render `<ResourceCrud resource="projects" basePath="/projects" />` wherever you like.
- **Using an existing axios-style client:** `fromApiClient(apiClient, { encodeList, decodeList })`. [Fitting an existing API](docs/data-providers.md#fitting-an-existing-api) covers other parameter names, single-column search and missing routes.
- **Tests and demos:** `createMemoryProvider(seed)`.

Read the [documentation](docs/README.md) for resources, fields, `Where`, data providers, routing, actions, access and escape hatches.

## What 1.0 will be

- **One definition drives everything:** list columns, URL-synced filters and sorting, create and edit forms, the detail view, row, bulk and toolbar actions, and access rules.
- **TypeScript or JSON.** Every behaviour slot accepts either code or a JSON value. A JSON config is just one that uses only JSON values, so a backend can serve it and validate it against a published JSON Schema.
- **Your backend, your conventions.** A small `DataProvider` contract with a configurable REST provider. Pagination, sorting, filter encoding and response envelopes are all plain functions you can override.
- **No router lock-in.** Routing goes through hooks you pass in (`useLocation`/`useNavigate` from your own react-router, or anything else).
- **antd 6 first,** with antd `^5.25` supported as a migration bridge.
- **Extensible without forking.** Custom field types, widgets, displays and page components plug in through registries, with headless hooks as the last escape hatch.

## Requirements (peer dependencies)

| Package                 | Range            |
| ----------------------- | ---------------- |
| `react`, `react-dom`    | `^18.2 \|\| ^19` |
| `antd`                  | `^5.25 \|\| ^6`  |
| `@ant-design/icons`     | `^5.6 \|\| ^6`   |
| `dayjs`                 | `^1.11`          |
| `@tanstack/react-query` | `^5.90`          |

The package is **ESM-only** and has a single entry point (`import { … } from 'instaui'`). With Jest, add `instaui` to `transformIgnorePatterns` exceptions. With antd 5 on React 19, install and import `@ant-design/v5-patch-for-react-19` in your app; instaui never imports it.

## Development

```bash
corepack enable
yarn install
yarn ci        # lint, format check, typecheck, tests, docs examples, version guard, package checks
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and conventions.

## License

[MIT](LICENSE)
