# Actions and access

## Actions

Built-in and custom actions share one `actions` array. The default is `['create', 'detail', 'edit', 'delete']`.

```tsx
import { defineResource } from 'instaui';

export const invoices = defineResource({
  name: 'invoices',
  fields: [
    { key: 'number', type: 'text' },
    {
      key: 'status',
      type: 'enum',
      props: {
        options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'SENT', label: 'Sent' },
        ],
      },
    },
  ],
  actions: [
    'create',
    'detail',
    { builtin: 'edit', label: 'Modify' },
    { builtin: 'delete', confirm: { typeToConfirm: 'DELETE' } },
    {
      id: 'send',
      label: 'Send',
      placement: ['row', 'detail'],
      visibleIf: { status: 'DRAFT' },
      confirm: { title: 'Send this invoice?' },
      run: async ({ record, dataProvider, ctx, notify }) => {
        await dataProvider.custom({
          method: 'POST',
          path: `invoices/${String(record?.id)}/send`,
          ctx,
        });
        notify.success('Sent');
      },
    },
  ],
});
```

Placements:

| Placement | Where it shows                         |
| --------- | -------------------------------------- |
| `row`     | The table's actions column             |
| `detail`  | The detail view's footer               |
| `toolbar` | Above the table                        |
| `bulk`    | Above the table, for the selected rows |

Handlers receive a stable `ActionContext` with these members:

| Member                | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `record`              | The record the action was triggered on         |
| `selection`           | The selected rows (bulk actions)               |
| `values`              | The action form's values, when it has a `form` |
| `dataProvider`, `ctx` | Data access and app context                    |
| `refresh()`           | Reload the resource's data                     |
| `navigate(to)`        | Go to another route                            |
| `notify`              | Show success or error messages                 |
| `open(content)`       | Open a modal owned by instaui                  |
| `close()`             | Close that modal                               |

After a custom action succeeds, the resource's data is refreshed. Set `onSuccess: 'none'` to skip that.

`confirm` takes `title`, `description`, `typeToConfirm`, `okText` (default: the action's label) and `danger` (default: the action's `danger`).

### Bulk actions

A custom action with `placement: ['bulk']` adds row checkboxes and a bar above the table. The action runs with the selected rows as `selection`. `list.selectable` limits which rows can be ticked; a selection is cleared when the list changes (page, filters, tab).

### Action forms

`form` collects inputs before the action runs: a reason, a date, a quantity. Its fields are ordinary [field definitions](resources-and-fields.md), with the same types, rules, `visibleIf` and widgets. Their values reach `run` as `values`, encoded like a create payload (dates as `YYYY-MM-DD`, empty values left out). A thrown `HttpError` with field errors puts them on the inputs and keeps the form open.

```tsx
import { defineResource } from 'instaui';

export const devices = defineResource({
  name: 'devices',
  fields: [
    { key: 'serial', type: 'text' },
    {
      key: 'state',
      type: 'enum',
      props: {
        options: [
          { value: 'IN_STOCK', label: 'In stock' },
          { value: 'RETIRED', label: 'Retired' },
        ],
      },
    },
  ],
  list: { selectable: { state: 'IN_STOCK' } },
  actions: [
    'detail',
    {
      id: 'retire',
      label: 'Retire',
      danger: true,
      placement: ['bulk', 'row'],
      visibleIf: { state: 'IN_STOCK' },
      form: {
        title: 'Retire devices',
        fields: [
          { key: 'reason', type: 'text', widget: 'textarea', required: true },
          { key: 'from', type: 'date' },
        ],
      },
      run: ({ record, selection, values, dataProvider, ctx }) =>
        dataProvider.custom({
          method: 'POST',
          path: 'devices/retire',
          ctx,
          body: { serials: (selection ?? [record]).map((d) => d?.serial), ...values },
        }),
    },
  ],
});
```

An action can also show a result instead of a form: `open(content, { title, width })` puts any React content in a modal owned by instaui.

### Related lists

`openResource(name, { ctx, filter, defaults, title, width })` opens another resource's list in that modal, with its own detail, forms and actions. Give the related resource `menu: false` and an `api.path` that reads the parent from `ctx`:

```tsx
import { defineResource } from 'instaui';

export const shipments = defineResource({
  name: 'shipments',
  fields: [{ key: 'number', type: 'text' }],
  actions: [
    'detail',
    {
      id: 'events',
      label: 'Tracking',
      placement: ['row', 'detail'],
      onSuccess: 'none',
      run: ({ record, openResource }) =>
        openResource('shipmentEvents', { ctx: { shipmentId: record?.id }, title: 'Tracking' }),
    },
  ],
});

export const shipmentEvents = defineResource({
  name: 'shipmentEvents',
  menu: false,
  api: { path: 'shipments/{ctx.shipmentId}/events' },
  fields: [
    { key: 'at', type: 'datetime' },
    { key: 'status', type: 'text' },
  ],
  actions: [],
});
```

## Access

`access` maps an action (built-in or custom id, or `list`) to `true`/`false`, a [`Where`](where.md) on the record, or a function `(record, ctx) => boolean`. `<InstaProvider can={…}>` adds an app-wide check, and the two are AND-ed. Checks are synchronous.

```tsx
import {
  InstaProvider,
  InstaAdmin,
  createRestProvider,
  defineResource,
  type AccessCheck,
} from 'instaui';

const posts = defineResource({
  name: 'posts',
  fields: [
    { key: 'title', type: 'text' },
    { key: 'published', type: 'boolean' },
  ],
  access: { delete: { published: false }, edit: { $not: { locked: true } } },
});

const can = ({ action }: AccessCheck) =>
  action !== 'delete' || localStorage.getItem('role') === 'admin';

export const App = () => (
  <InstaProvider
    dataProvider={createRestProvider({ baseUrl: '/api' })}
    resources={[posts]}
    can={can}
  >
    <InstaAdmin />
  </InstaProvider>
);
```

Access is enforced:

- **on buttons,** which are hidden when not allowed
- **on rows,** which only open when `detail` is allowed
- **on routes:** opening `/posts/7/edit` for a record you can't edit shows "not allowed" instead of the form

## Custom row content

`components.rowActions` renders extra content in each row's actions cell, before the built-in buttons. Use it for buttons with their own logic. It receives `ViewProps`, with `record` set to the row.

```tsx
import { Button } from 'antd';
import { defineResource, type ViewProps } from 'instaui';

const History = ({ record, navigate }: ViewProps) => (
  <Button type="link" size="small" onClick={() => navigate(`/audit?entity=${String(record?.id)}`)}>
    History
  </Button>
);

export const accounts = defineResource({
  name: 'accounts',
  fields: [{ key: 'name', type: 'text' }],
  components: { rowActions: History },
});
```
