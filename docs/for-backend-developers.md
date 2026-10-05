# A frontend for your REST API, without writing a frontend

You have a REST API. instaui gives it an admin screen: a menu, tables with paging, sorting and
filters, a detail view, create and edit forms with validation, and delete. You don't build those
screens. You describe each of your resources (`/customers`, `/orders`, …) in a few lines, and
instaui draws them and calls your endpoints.

This page assumes you know HTTP and JSON, and no React.

## 1. What your API should look like

instaui works out of the box with this shape. Each piece can be changed later (section 4).

| Screen action   | Request instaui sends                                                          | Response it expects                              |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| Open a list     | `GET /customers?page=1&pageSize=10`                                            | `{ "data": [ … ], "total": 42 }`                 |
| Sort a column   | `…&sort=name&order=asc`                                                        | same                                             |
| Filter          | `…&status=ACTIVE`, `…&status[in]=A,B`, `…&age[gte]=18`, `…&name[contains]=ann` | same                                             |
| Search box      | `…&q=ann`                                                                      | same                                             |
| Open one record | `GET /customers/7`                                                             | `{ "id": 7, … }` or `{ "data": { "id": 7, … } }` |
| Create          | `POST /customers` with a JSON body                                             | the created record                               |
| Edit            | `PATCH /customers/7` with only the changed fields (a cleared field is `null`)  | the updated record                               |
| Delete          | `DELETE /customers/7`                                                          | anything                                         |

- **Lists** may also be a plain array, or use `items` / `results` instead of `data`, and `count` instead of `total`.
- **Records** are identified by an `id` field, unless you say otherwise.
- **Errors:** return a 4xx status with `{ "message": "…", "errors": { "email": "already taken" } }`. The message is shown to the user, and each entry in `errors` appears under the matching form field.

## 2. Create the app (about 5 minutes)

You need Node.js 22 or later.

```bash
npm create vite@latest my-admin -- --template react-ts
cd my-admin
npm install instaui antd @ant-design/icons dayjs @tanstack/react-query axios
```

Replace `src/App.tsx` with the following, then run `npm run dev` and open the address it prints.

```tsx
import axios from 'axios';
import { InstaApp, defineResource } from 'instaui';

// 1. Your API. Add your auth header here.
const http = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
});
const apiClient = {
  get: (url: string, config?: object) => http.get(url, config).then((r) => r.data),
  post: (url: string, data?: unknown) => http.post(url, data).then((r) => r.data),
  patch: (url: string, data?: unknown) => http.patch(url, data).then((r) => r.data),
  delete: (url: string) => http.delete(url).then((r) => r.data),
};

// 2. Your resources: one per collection endpoint.
const customers = defineResource({
  name: 'customers', // the endpoint: /customers
  label: { one: 'Customer', other: 'Customers' }, // for titles like "New customer"
  recordLabel: '{name}', // how a customer is named in titles and pickers
  fields: [
    { key: 'name', type: 'text', required: true, list: { sortable: true }, filter: true },
    { key: 'email', type: 'text', required: true },
    {
      key: 'status',
      type: 'enum',
      display: 'tag', // coloured, using each option's color
      filter: true,
      props: {
        options: [
          { value: 'ACTIVE', label: 'Active', color: 'green' },
          { value: 'BLOCKED', label: 'Blocked', color: 'red' },
        ],
      },
    },
    { key: 'createdAt', type: 'datetime', create: 'hidden', edit: 'readonly' },
  ],
  list: { search: true },
});

const orders = defineResource({
  name: 'orders',
  label: { one: 'Order', other: 'Orders' },
  recordLabel: 'Order #{id}',
  fields: [
    // A link to another resource: a searchable picker in forms, the customer's name in tables.
    {
      key: 'customerId',
      label: 'Customer',
      type: 'relation',
      required: true,
      props: { resource: 'customers' },
    },
    { key: 'total', type: 'number', props: { min: 0, precision: 2 } },
    { key: 'shippedOn', type: 'date' },
  ],
});

// 3. The app.
export default function App() {
  return <InstaApp title="My Admin" apiClient={apiClient} resources={[customers, orders]} />;
}
```

Your API must allow requests from the dev server (CORS): allow the origin `http://localhost:5173`.

## 3. Describing fields

Each field has a `key` (the JSON property) and a `type`:

| `type`     | JSON value                                            | Form input                                    |
| ---------- | ----------------------------------------------------- | --------------------------------------------- |
| `text`     | string                                                | text box (`widget: 'textarea'` for long text) |
| `number`   | number                                                | number box (`props.min`, `max`, `precision`)  |
| `boolean`  | `true` / `false`                                      | switch                                        |
| `date`     | `"2026-03-01"`                                        | date picker                                   |
| `datetime` | ISO timestamp                                         | date and time picker                          |
| `enum`     | one of `props.options` (`props.multiple` for several) | dropdown                                      |
| `tags`     | array of strings                                      | free-text tags                                |
| `relation` | the id of a record of `props.resource`                | searchable picker                             |
| `json`     | any JSON                                              | JSON editor                                   |

Common options on any field:

| Option                                        | Meaning                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `label`                                       | Column and form label (default: from the key, e.g. `createdAt` → "Created At") |
| `required: true`                              | Must be filled in                                                              |
| `validate: (value) => 'message' \| undefined` | Your own check                                                                 |
| `list: false`                                 | Not a table column. `{ sortable: true }` makes it sortable.                    |
| `filter: true`                                | Adds a filter to the column                                                    |
| `create` / `edit`                             | `'editable'` (default), `'readonly'` or `'hidden'` in that form                |
| `default`                                     | Initial value when creating                                                    |

## 4. When your API looks different

Most differences are one line on the resource:

```tsx
import { defineResource } from 'instaui';

export const invoices = defineResource({
  name: 'invoices',
  idField: 'uuid', // records are identified by "uuid", not "id"
  api: {
    path: 'billing/invoices', // the endpoint is /billing/invoices
    listKey: 'invoices', // lists come back as { data: { invoices: [...] } }
    lookup: 'list', // there is no GET /billing/invoices/:id
    search: 'client', // the list cannot search: search all of it in the browser
  },
  fields: [{ key: 'number', type: 'text' }],
});
```

If your query parameters are named differently (for example `limit` and `offset` instead of `page`
and `pageSize`), give `InstaApp` your own encoder once, for every resource:

```tsx
import { defaultEncodeList, type ListParams } from 'instaui';

// Start from the defaults and rename what differs.
export const rest = {
  encodeList: (params: ListParams) => {
    const { page, pageSize, ...others } = defaultEncodeList(params);
    return { ...others, limit: pageSize, offset: (Number(page) - 1) * Number(pageSize) };
  },
};

// Then: <InstaApp rest={rest} apiClient={apiClient} resources={[…]} />
```

See [Data providers](data-providers.md) for envelopes, errors and other conventions.

## 5. Buttons for your other endpoints

For endpoints that are not plain CRUD, such as `POST /orders/7/ship`, add an action. It can ask
for confirmation and for inputs first:

```tsx
import { defineResource } from 'instaui';

export const orders = defineResource({
  name: 'orders',
  fields: [{ key: 'status', type: 'text' }],
  actions: [
    'create',
    'detail',
    'edit',
    {
      id: 'ship',
      label: 'Ship',
      placement: ['row', 'detail'], // or ['bulk'] to run on selected rows
      visibleIf: { status: 'PAID' },
      confirm: { title: 'Ship this order?', okText: 'Ship' },
      form: { fields: [{ key: 'trackingNumber', type: 'text', required: true }] },
      run: ({ record, values, dataProvider }) =>
        dataProvider.custom({
          method: 'POST',
          path: `orders/${String(record?.id)}/ship`,
          body: values,
        }),
    },
  ],
});
```

The list refreshes when the action succeeds. Leaving `'delete'` out of `actions` removes the
delete button. `access: { edit: false }` hides editing, for example for users without the right role.

## 6. A screen of your own

When a screen needs its own design, such as a dashboard, write it as a React component and add it as a page. It appears in the
menu like any other resource, and can call your API with the same client:

```tsx
import { defineResource, useApiClient } from 'instaui';
import { useEffect, useState } from 'react';

type Client = { get(url: string): Promise<{ total: number }> };

function Dashboard() {
  const api = useApiClient<Client>();
  const [total, setTotal] = useState<number>();
  useEffect(() => void api.get('stats').then((r) => setTotal(r.total)), [api]);
  return <p>{total ?? '…'} customers</p>;
}

export const dashboard = defineResource({
  name: 'dashboard',
  kind: 'page',
  fields: [],
  components: { page: Dashboard },
});
```

## If something doesn't work

| Symptom                                      | Likely cause                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| "Unrecognised list response"                 | The list isn't under `data` / `items` / `results`: set `api.listKey`.                 |
| Every list shows 10 rows and paging is wrong | Your API ignores `pageSize`, or returns no `total`.                                   |
| Network errors in the browser console        | CORS: allow the dev server's origin.                                                  |
| Relation shows an id instead of a name       | Set `recordLabel` on the target resource, or `api.lookup` if it has no GET-one route. |
| A field never saves                          | It's `readonly` or hidden in that form, or your PATCH ignores it.                     |

Next: [Resources and fields](resources-and-fields.md) for everything a resource can do.
