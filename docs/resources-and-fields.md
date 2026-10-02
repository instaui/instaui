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
| `tags`     | string array                                  | `props.tokenSeparators` (e.g. `[',', '\n']`) splits pasted text into values.                                  |
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

## Relations

A `relation` field stores the target's id and edits it with a server-searched picker. The target is another resource, registered like any other; give it `menu: false` when it exists only for pickers.

| Prop                 | Effect                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `props.resource`     | The target resource's name.                                                                                  |
| `props.label`        | A `{…}` template for options and cells. The default is the target's `recordLabel`.                           |
| `props.multiple`     | Pick several ids.                                                                                            |
| `props.searchFields` | Passed to the provider as `meta.searchFields` with the typed text (see [Data providers](data-providers.md)). |
| `props.params`       | A [`Where`](where.md) for the options. `{ $var: 'values.x' }` reads another form value.                      |
| `props.link`         | How a cell links to the record: `'route'` (default), `'drawer'` or `'none'`.                                 |

Pickers that depend on each other combine `props.params` with `resetOn` and `readOnlyIf`:

```tsx
import { defineResource } from 'instaui';

export const branches = defineResource({
  name: 'branches',
  fields: [
    { key: 'name', type: 'text' },
    { key: 'countryId', type: 'relation', required: true, props: { resource: 'countries' } },
    {
      key: 'cityId',
      type: 'relation',
      required: true,
      placeholder: 'Pick a country first',
      // Only the chosen country's active cities; cleared when the country changes.
      props: {
        resource: 'cities',
        params: { countryId: { $var: 'values.countryId' }, active: true },
      },
      resetOn: ['countryId'],
      readOnlyIf: (values) => !values.countryId,
    },
  ],
});
```

If the API returns the related record nested next to the id, a [display](custom-fields-and-escape-hatches.md) can show its name directly, without a lookup.

```tsx
import { defineResource } from 'instaui';

export const tickets = defineResource({
  name: 'tickets',
  fields: [
    { key: 'subject', type: 'text', filter: true },
    {
      key: 'priority',
      type: 'enum',
      filter: { multiple: false },
      props: {
        options: [
          { value: 'HIGH', label: 'High' },
          { value: 'LOW', label: 'Low' },
        ],
      },
    },
    { key: 'createdAt', type: 'datetime', filter: { paramRange: ['createdFrom', 'createdTo'] } },
    {
      key: 'assigneeId',
      type: 'text',
      filter: { widget: 'relation' },
      props: { resource: 'users' },
    },
  ],
  list: {
    tabs: [
      { key: 'open', label: 'Open', filter: { closed: false } },
      { key: 'closed', label: 'Closed', filter: { closed: true } },
    ],
    filterBar: { savedViews: true },
  },
});
```

| Option                      | Effect                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `tabs`                      | Show above the list. The first tab is the default; others are kept in `?tab=`.                                            |
| `filterBar`                 | Shows active filters as chips you can clear. With `savedViews`, the current filters can be saved by name in this browser. |
| `filter.paramRange`         | Sends a range as two params, e.g. `?createdFrom=…&createdTo=…`.                                                           |
| `filter.multiple: false`    | Makes an enum or relation filter pick a single value.                                                                     |
| `filter.widget: 'relation'` | Filters a plain id field with a relation picker.                                                                          |

## Saving

- **Updates send only changed fields.** Set `form.patch: 'full'` to send everything.
- **A cleared value is sent as `null`.**
- **Validation order:** field rules (`required`, `validate`) run first, then `form.validate(values)`, which can return `{ field: message }` or `{ _form: message }`, and finally the server. Server errors with `fieldErrors` are shown on the matching fields.
- **`form.emptyValue: 'omit'`** makes updates leave empty values out instead of sending `null`.
- **`form.validatePayload(payload)`** validates the final payload, after encoding and `beforeSubmit`, for rules written against the API's shape. It returns field messages, a form-level message, or nothing.
- **`form.beforeSubmit(payload, { mode, ctx, record })`** is an escape hatch for reshaping the payload. Prefer field types and codecs. Using it switches the default to full updates. `record` is the record being edited (undefined on create), and `validatePayload` receives the same second argument.
- **`readOnlyIf` and `visibleIf` functions** receive `(values, ctx, record)`, so a field can lock depending on the stored record.
- **`form.confirm(values, { mode, ctx, record })`** asks before saving. Return `{ title, description?, okText?, danger? }` to show a confirmation, or nothing to save straight away, e.g. `values.status === 'INACTIVE' && record?.status !== 'INACTIVE' ? { title: 'Deactivate this user?', danger: true } : undefined`.

A strict update endpoint that accepts only some keys, and only for some records:

```tsx
import { defineResource } from 'instaui';

export const invoices = defineResource({
  name: 'invoices',
  fields: [
    { key: 'number', type: 'text', edit: 'readonly' },
    {
      key: 'kind',
      type: 'enum',
      edit: 'readonly',
      props: {
        options: [
          { value: 'STANDARD', label: 'Standard' },
          { value: 'CREDIT', label: 'Credit note' },
        ],
      },
    },
    { key: 'notes', type: 'text', widget: 'textarea' },
    {
      key: 'lines',
      type: 'json',
      list: false,
      readOnlyIf: (_values, _ctx, record) => record?.kind === 'CREDIT',
    },
  ],
  form: {
    // PATCH accepts { notes, lines } only, and credit notes take notes only.
    beforeSubmit: (payload, { mode, record }) =>
      mode === 'create'
        ? payload
        : record?.kind === 'CREDIT'
          ? { notes: payload.notes }
          : { notes: payload.notes, lines: payload.lines },
  },
});
```
