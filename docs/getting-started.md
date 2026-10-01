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

## A first admin

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

`InstaAdmin` is optional. To embed a single resource in your own layout, render `ResourceCrud`:

```tsx
import { InstaProvider, ResourceCrud, createRestProvider, defineResource } from 'instaui';

const tickets = defineResource({ name: 'tickets', fields: [{ key: 'subject', type: 'text' }] });

export const Tickets = () => (
  <InstaProvider dataProvider={createRestProvider({ baseUrl: '/api' })} resources={[tickets]}>
    <ResourceCrud resource="tickets" />
  </InstaProvider>
);
```
