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

| Placement | Where it shows                            |
| --------- | ----------------------------------------- |
| `row`     | The table's actions column                |
| `detail`  | The detail view's footer                  |
| `toolbar` | Above the table                           |
| `bulk`    | Selected rows (coming in a later release) |

Handlers receive a stable `ActionContext` with these members:

| Member                | Purpose                                |
| --------------------- | -------------------------------------- |
| `record`              | The record the action was triggered on |
| `dataProvider`, `ctx` | Data access and app context            |
| `refresh()`           | Reload the resource's data             |
| `navigate(to)`        | Go to another route                    |
| `notify`              | Show success or error messages         |
| `open(content)`       | Open a modal owned by instaui          |
| `close()`             | Close that modal                       |

After a custom action succeeds, the resource's data is refreshed. Set `onSuccess: 'none'` to skip that.

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
