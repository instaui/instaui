# Getting started

## Install

```bash
npm install instaui @tanstack/react-query
```

Peer dependencies: `react` and `react-dom` (`^18.2 || ^19`), `antd` (`^5.25 || ^6`), `@ant-design/icons` (`^5.6 || ^6`), `dayjs` (`^1.11`) and `@tanstack/react-query` (`^5.90`). The package is ESM-only.

Notes:

- **antd 5 on React 19:** install and import `@ant-design/v5-patch-for-react-19` in your app. instaui never imports it.
- **Jest:** add `instaui` to the `transformIgnorePatterns` exceptions, because the package is ESM-only.
- **Linked local checkout:** make your bundler dedupe the peers. For Vite, use `resolve.dedupe: ['react', 'react-dom', 'antd', '@ant-design/icons', 'dayjs']`.

## An app from an API client and config

`InstaApp` is a whole admin app: give it your HTTP client and your resource definitions.

```tsx
import axios from 'axios';
import { InstaApp, defineResource } from 'instaui';

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
    { key: 'name', type: 'text', required: true, filter: true },
    { key: 'email', type: 'text' },
  ],
});

export const App = () => (
  <InstaApp title="Backoffice" apiClient={apiClient} resources={[customers]} />
);
```

`InstaApp` routes with the browser URL and builds the data provider from the client. If your API's query parameters or envelopes differ from the defaults, pass them once as `rest={{ encodeList, decodeList, … }}` (see [Data providers](data-providers.md)).

### Custom views

A screen with its own design is a resource too, so it gets a menu entry and a route. Use `kind: 'page'` for a whole screen, or `components.detail` / `create` / `edit` / `rowActions` to replace one view. Custom views make their own requests with the app's client:

```tsx
import { useApiClient, defineResource } from 'instaui';
import { useEffect, useState } from 'react';

type Client = { get(url: string): Promise<{ data: { total: number } }> };

function Overview() {
  const api = useApiClient<Client>();
  const [total, setTotal] = useState<number>();
  useEffect(() => void api.get('stats').then((r) => setTotal(r.data.total)), [api]);
  return <p>{total ?? '…'} customers</p>;
}

export const overview = defineResource({
  name: 'overview',
  kind: 'page',
  fields: [],
  components: { page: Overview },
});
```

## A first admin, step by step

```tsx
import { InstaAdmin, InstaProvider, createMemoryProvider, defineResource } from 'instaui';

const books = defineResource({
  name: 'books',
  recordLabel: '{title}',
  fields: [
    { key: 'title', type: 'text', required: true, list: { sortable: true }, filter: true },
    { key: 'pages', type: 'number', props: { min: 1 } },
    { key: 'publishedOn', type: 'date' },
    { key: 'authorId', type: 'relation', props: { resource: 'authors' }, filter: true },
  ],
});
const authors = defineResource({
  name: 'authors',
  fields: [{ key: 'name', type: 'text', required: true }],
});

const dataProvider = createMemoryProvider({
  authors: [{ id: 1, name: 'Ursula K. Le Guin' }],
  books: [{ id: 1, title: 'The Dispossessed', pages: 387, publishedOn: '1974-05-01', authorId: 1 }],
});

export function App() {
  return (
    <InstaProvider dataProvider={dataProvider} resources={[books, authors]}>
      <InstaAdmin title="Library" />
    </InstaProvider>
  );
}
```

What you get:

- A menu with **Books** and **Authors**.
- A sortable, filterable, paginated list, synced to the URL.
- A detail drawer and create/edit forms with validation.
- Delete with confirmation.
- Relation pickers that search on the server.

Replace `createMemoryProvider` with `createRestProvider({ baseUrl: '/api' })` to talk to your API (see [Data providers](data-providers.md)).

## One resource, anywhere

`InstaApp` is `InstaProvider` + `InstaAdmin`, and both are optional. To embed a single resource in your own layout, render `ResourceCrud`:

```tsx
import { InstaProvider, ResourceCrud, createRestProvider, defineResource } from 'instaui';

const tickets = defineResource({ name: 'tickets', fields: [{ key: 'subject', type: 'text' }] });

export const Tickets = () => (
  <InstaProvider dataProvider={createRestProvider({ baseUrl: '/api' })} resources={[tickets]}>
    <ResourceCrud resource="tickets" />
  </InstaProvider>
);
```
