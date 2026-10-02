# instaui

> **Status:** `0.0.14`. Pre-1.0, so the API may still change. 0.0.10 and earlier (`ItemCrud`) are deprecated.

**Turn a REST API into a complete admin app by describing its resources, without changing the API and without writing CRUD screens.**

## The problem

Every API grows an internal back-office: tables with paging, sorting and filters, a detail view, create and edit forms, delete, and a few domain actions ("ship", "refund", "deactivate"). Teams build these screens by hand, app after app. The copies drift, repeat the same mistakes against the API (wrong parameter names, wrong id fields, unhandled errors), and need React skills that the people who know the API often don't have.

## What instaui does

You describe each resource once: its fields, the actions it allows, and who may do what. instaui renders the whole app from that description and talks to your API:

- a menu, and a list per resource with server-side paging, sorting, filters, search and saved views, synced to the URL;
- a detail view, and create and edit forms with validation, dependent fields, and server errors shown on the right field;
- delete with confirmation, and your own actions (row, detail, toolbar or bulk), with confirmations and inputs;
- relation pickers that search on the server, and related lists opened from a record;
- access rules that hide what a user may not do.

```tsx
import axios from 'axios';
import { InstaApp, defineResource } from 'instaui';

// Your own HTTP client: auth headers and interceptors keep working.
const http = axios.create({ baseURL: '/api' });
const apiClient = {
  get: (url: string, config?: object) => http.get(url, config).then((r) => r.data),
  post: (url: string, data?: unknown) => http.post(url, data).then((r) => r.data),
  patch: (url: string, data?: unknown) => http.patch(url, data).then((r) => r.data),
  delete: (url: string) => http.delete(url).then((r) => r.data),
};

const customers = defineResource({
  name: 'customers',
  recordLabel: '{name}',
  fields: [
    { key: 'name', type: 'text', required: true, list: { sortable: true }, filter: true },
    { key: 'email', type: 'text', required: true },
    {
      key: 'status',
      type: 'enum',
      display: 'tag',
      props: {
        options: [
          { value: 'ACTIVE', label: 'Active', color: 'green' },
          { value: 'CLOSED', label: 'Closed' },
        ],
      },
    },
    { key: 'teamId', label: 'Team', type: 'relation', props: { resource: 'teams' } },
  ],
  // Only closed customers can be deleted.
  access: { delete: { status: 'CLOSED' } },
});
const teams = defineResource({ name: 'teams', fields: [{ key: 'name', type: 'text' }] });

export const App = () => (
  <InstaApp title="Backoffice" apiClient={apiClient} resources={[customers, teams]} />
);
```

## Why instaui

- **It fits the API you already have.** Parameter names, envelopes, error formats, missing routes (no GET-one, no search) and nested paths are configured in the frontend. The API doesn't change.
- **The description is data.** Conditions, access rules and filters are JSON ([`Where`](docs/where.md)); widgets, displays and custom screens are referenced by name. A definition can be checked with `validateConfig`, and it can be served by your backend.
- **Built for the people who know the API.** Backend developers can ship an admin with config alone ([a guide for them](docs/for-backend-developers.md)).
- **Custom where it matters, standard everywhere else.** You can replace one field's input or display, one view, or a whole screen with your own React component. The rest stays generated.
- **Small and unopinionated about your stack.** antd 5.25+ or 6, React 18 or 19, your router or none, TanStack Query for caching, and no runtime dependencies of its own.

## When it fits

- **Good fit:** internal tools, admin panels, back-offices and support consoles over REST-style APIs.
- **Not a fit:** customer-facing UIs with a bespoke design, or page builders. instaui renders standard REST resources well and leaves bespoke screens to you.

## Start here

- **New to React?** [A frontend for your REST API](docs/for-backend-developers.md) goes from an empty folder to a working admin.
- **Using React already?** Read [Getting started](docs/getting-started.md), then the [documentation](docs/README.md): resources and fields, `Where`, data providers, routing, actions and access, server-driven config, and escape hatches.

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
