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

`useResourceList`, `useResourceRecord`, `useResourceMutations`, `useRelationOptions`, `useResourceSubmit` and `useCan` give you data, saving and access with your own UI. `RelationSelect` is a standalone, server-searched relation picker.
