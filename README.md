# instaui

> **Status:** `0.0.14`. Pre-1.0, so the API may still change. 0.0.10 and earlier (`ItemCrud`) are deprecated.

**Turn a REST API into a complete admin app by describing its resources as data: no CRUD screens to write, and no changes to the API.**

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

Three things set instaui apart from other admin tools ([how it compares](docs/comparison.md)):

1. **Describe resources, not screens.** You describe each resource once: its fields, actions and access rules. The menu, lists, filters, forms, detail views, relation pickers and action dialogs all follow from that description. Most other tools have you write or assemble each screen.
2. **The description is data.** A resource is a plain object. Conditions, access rules and filters are JSON ([`Where`](docs/where.md)); widgets, displays and custom screens are referenced by name. TypeScript types and `validateConfig` check a definition before it ships, and your backend can serve it ([server-driven config](docs/server-driven-config.md)).
3. **It fits the API you have.** instaui calls your API through your own HTTP client, so auth headers and interceptors keep working. Parameter names, envelopes and error formats are configured in one place, and fallbacks cover routes your API lacks (no GET-one, no search). The API doesn't change.

And because of those three:

- **The people who know the API can build the admin.** Backend developers can ship one with config alone ([a guide for them](docs/for-backend-developers.md)).
- **You customise only where it matters.** Replace one field's input or display, one view, or a whole screen with your own React component; the rest stays generated.
- **It stays small and fits your stack.** antd 5.25+ or 6, React 18 or 19, your router or none, TanStack Query for caching, and no runtime dependencies of its own.

## When it fits

See [how instaui compares](docs/comparison.md) with react-admin, Refine, Ant Design ProComponents, amis, API Platform Admin, Retool, Appsmith, ToolJet, AdminJS and Forest Admin.

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
