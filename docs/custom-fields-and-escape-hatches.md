# Custom fields and escape hatches

When config isn't enough, step down one rung at a time. Don't fork.

## 1. Widgets and displays

A **widget** is a form input that receives `value`/`onChange`. A **display** renders a value in cells and in the detail view. Pass either one as a component, or register it under a key.

```tsx
import { Rate } from 'antd';
import {
  InstaProvider,
  InstaAdmin,
  createRestProvider,
  defineResource,
  type DisplayProps,
  type WidgetProps,
} from 'instaui';

const StarsInput = ({ value, onChange, disabled }: WidgetProps) => (
  <Rate value={Number(value ?? 0)} disabled={disabled} onChange={(v) => onChange?.(v)} />
);
const StarsDisplay = ({ value }: DisplayProps) => <Rate value={Number(value ?? 0)} disabled />;

const reviews = defineResource({
  name: 'reviews',
  fields: [
    { key: 'title', type: 'text' },
    { key: 'rating', type: 'number', widget: 'stars', display: 'stars' },
  ],
});

export const App = () => (
  <InstaProvider
    dataProvider={createRestProvider({ baseUrl: '/api' })}
    resources={[reviews]}
    registry={{ widgets: { stars: StarsInput }, displays: { stars: StarsDisplay } }}
  >
    <InstaAdmin />
  </InstaProvider>
);
```

| Component | Receives                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Widget    | `value`, `onChange`, `id`, `disabled`, `field`, `mode` (`'create'`/`'edit'`), `values` (the whole form), `params` (resolved relation params) |
| Display   | `value`, `record`, `field`, `resource`, `context`: `'list'` in a table cell, `'detail'` in the detail view                                   |

`context` lets one display render compactly in cells and in full in the detail view, for example a nested record's name in the list and a linked card in the detail.

Built-in displays: `text`, `link`, `image`, `tag` (uses the enum options' `color`), `json`, `copyable`, `relation`, and `table`. `table` shows nested rows that come inside a record (an array of objects) with the columns of the resource named by `props.resource`, paged in the browser: `{ key: 'lines', type: 'json', display: 'table', props: { resource: 'orderLines' } }`.

Register a custom **codec** (`registry.codecs`) for a new field type that needs its own wire format.

## 2. Whole views

`components.page`, `components.detail`, `components.create` and `components.edit` replace a view. Each one receives `ViewProps`:

| Prop                  | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `resource`            | The normalised resource definition         |
| `dataProvider`, `ctx` | Data access and app context                |
| `record`              | The current record (detail and edit views) |
| `refresh()`           | Reload the resource's data                 |
| `close()`             | Close the view                             |
| `navigate(to)`        | Go to another route                        |
| `notify`              | Show success or error messages             |

A resource with `kind: 'page'` renders only `components.page` and never fetches a list.

## 3. Tables and forms in your own screens

```tsx
import { ResourceTable, useResourceTable, unstable_ResourceForm as ResourceForm } from 'instaui';

export function ProjectTasks({ projectId }: { projectId: number }) {
  const { tableProps } = useResourceTable('tasks', { filter: { projectId } }); // local state: the page URL is untouched
  return <ResourceTable {...tableProps} />;
}

export const EditTask = ({ id, onDone }: { id: number; onDone(): void }) => (
  <ResourceForm resource="tasks" mode="edit" id={id} onDone={onDone} />
);
```

`unstable_*` exports may change in minor releases.

### A resource inside another view

`<ResourceCrud embedded>` is the whole list-detail-form for one resource inside another screen, such as a parent's detail. Its list state and open record stay in component state, so the page URL is untouched.

| Prop       | Purpose                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `ctx`      | Merged over the provider's context for this view: fills `{ctx.x}` in `api.path`, `$var` and access |
| `filter`   | Always applied, AND-ed with the user's filters, and not shown in the filter bar                    |
| `defaults` | Initial values for records created here                                                            |
| `title`    | The heading; `false` hides it                                                                      |

```tsx
import { ResourceCrud, defineResource, type ViewProps } from 'instaui';

// GET/POST/PATCH/DELETE teams/{teamId}/members[/{id}]
export const members = defineResource({
  name: 'members',
  api: { path: 'teams/{ctx.teamId}/members' },
  menu: false,
  fields: [
    { key: 'userId', type: 'relation', props: { resource: 'users' } },
    { key: 'role', type: 'text' },
  ],
});

/** A team's detail view with its members underneath. */
export const TeamDetail = ({ record }: ViewProps) => (
  <ResourceCrud
    resource="members"
    embedded
    ctx={{ teamId: record?.id }}
    defaults={{ role: 'member' }}
    title="Members"
  />
);
```

## 4. Headless

`useResourceList`, `useResourceRecord`, `useResourceMutations`, `useRelationOptions`, `useResourceSubmit` and `useCan` give you data, saving and access with your own UI.

`RelationSelect` is the relation picker on its own, for your own screens and forms. It needs an `<InstaProvider>` above it with the target resource registered. It loads options when opened, searches on the server, pages on scroll, and resolves the labels of selected ids. Inside an antd `Form.Item` it receives `value` and `onChange` like any input.

```tsx
import { Form } from 'antd';
import { RelationSelect } from 'instaui';

export function AssignForm({ countryId }: { countryId?: string }) {
  return (
    <Form layout="vertical">
      <Form.Item name="userId" label="User" rules={[{ required: true }]}>
        <RelationSelect resource="users" placeholder="Search users" />
      </Form.Item>
      <Form.Item name="cityIds" label="Cities">
        <RelationSelect resource="cities" multiple params={{ countryId }} disabled={!countryId} />
      </Form.Item>
    </Form>
  );
}
```

`params` here is already resolved (no `$var`); an `undefined` value means no filter. `ctx` gives the picker extra context, e.g. `ctx={{ orderId }}` for a target whose path is `orders/{ctx.orderId}/items`.
