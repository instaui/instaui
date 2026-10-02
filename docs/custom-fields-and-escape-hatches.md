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

`params` here is already resolved (no `$var`); an `undefined` value means no filter.
