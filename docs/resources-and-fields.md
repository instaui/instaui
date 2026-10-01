# Resources and fields

A **resource** is a named collection: its fields, list settings, forms, actions and access rules.

```tsx
import { defineResource } from 'instaui';

interface Order {
  id: number;
  number: string;
  total: number;
  status: 'NEW' | 'PAID' | 'SHIPPED';
  customerId: number;
  notes?: string;
}

export const orders = defineResource<Order>({
  name: 'orders',
  label: { one: 'Order', other: 'Orders' },
  recordLabel: '#{number}',
  list: { pageSize: 25, sort: [{ field: 'number', order: 'desc' }], search: true },
  fields: [
    { key: 'number', type: 'text', edit: 'readonly', list: { sortable: true } },
    { key: 'total', type: 'number', props: { min: 0, precision: 2 }, filter: true },
    {
      key: 'status',
      type: 'enum',
      display: 'tag',
      filter: true,
      props: {
        options: [
          { value: 'NEW', label: 'New', color: 'blue' },
          { value: 'PAID', label: 'Paid', color: 'green' },
          { value: 'SHIPPED', label: 'Shipped' },
        ],
      },
    },
    {
      key: 'customerId',
      type: 'relation',
      props: { resource: 'customers', label: '{name} ({email})' },
    },
    { key: 'notes', type: 'text', widget: 'textarea', list: false },
  ],
  form: { container: { type: 'drawer', width: 520 } },
});
```

## Field types

| Type       | Wire value                                    | Notes                                                                                                         |
| ---------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `text`     | string                                        | Widgets: `input`, `textarea`, `password`, `email`, `url`. Displays: `text`, `link`, `copyable`. `props.trim`. |
| `number`   | number (numeric strings accepted)             | `props.min`, `max`, `precision`. No implicit minimum.                                                         |
| `boolean`  | boolean (`1`/`0`/`'true'`/`'false'` accepted) | Displays Yes/No text.                                                                                         |
| `date`     | `YYYY-MM-DD`                                  | A calendar date: never shifted by time zones.                                                                 |
| `datetime` | ISO 8601 with offset                          | Displayed in the provider's `timezone` (`'local'` or `'utc'`).                                                |
| `time`     | `HH:mm:ss`                                    |                                                                                                               |
| `enum`     | value, or array with `props.multiple`         | Lists and detail show the option **label**. Display `tag` uses option colours.                                |
| `tags`     | string array                                  |                                                                                                               |
| `relation` | id, or ids with `props.multiple`              | `props.resource` names the target. Nested records are accepted and reduced to ids.                            |
| `json`     | any JSON                                      | Edited as text, parsed on submit, never re-formatted while typing.                                            |

## Where fields appear

| Key               | Default                | Meaning                                                                                 |
| ----------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| `list`            | `true` (except `json`) | Show as a column. `{ sortable, width, pin }` configures it.                             |
| `detail`          | `true`                 | Show in the detail view.                                                                |
| `filter`          | `false`                | Offer a column filter. `{ param }` renames it in the API query.                         |
| `create` / `edit` | `'editable'`           | `'readonly'` shows it disabled; `'hidden'` leaves it out.                               |
| `visibleIf`       | always                 | A [`Where`](where.md) or a function of the form values. Hidden fields aren't submitted. |
| `submit`          | `'whenVisible'`        | `'always'` submits read-only or hidden values too; `'never'` never submits.             |

## Saving

- **Updates send only changed fields.** Set `form.patch: 'full'` to send everything.
- **A cleared value is sent as `null`.**
- **Validation order:** field rules (`required`, `validate`) run first, then `form.validate(values)`, which can return `{ field: message }` or `{ _form: message }`, and finally the server. Server errors with `fieldErrors` are shown on the matching fields.
- **`form.beforeSubmit(payload)`** is an escape hatch for reshaping the payload. Prefer field types and codecs. Using it switches the default to full updates.
