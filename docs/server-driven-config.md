# Server-driven config

Every definition can be plain JSON: field types, widgets, displays and components are referenced by registry key, and conditions use [`Where`](where.md). A backend can therefore serve the admin's configuration.

```tsx
import {
  InstaAdmin,
  InstaProvider,
  createRestProvider,
  mergeResource,
  type ResourceDefinition,
} from 'instaui';

// e.g. fetched from GET /admin/config
const fromServer: ResourceDefinition = {
  name: 'members',
  fields: [
    { key: 'email', type: 'text', required: true },
    {
      key: 'kind',
      type: 'enum',
      props: {
        options: [
          { value: 'STAFF', label: 'Staff' },
          { value: 'GUEST', label: 'Guest' },
        ],
      },
    },
    {
      key: 'sponsorId',
      type: 'relation',
      props: { resource: 'members', label: '{email}' },
      visibleIf: { kind: 'GUEST' },
    },
  ],
  'x-owner': 'directory-team',
};

// Code-only behaviour is merged in locally, by field key.
const members = mergeResource(fromServer, {
  fields: [
    {
      key: 'email',
      validate: (v) => (String(v).includes('@') ? undefined : 'Enter an email address'),
    },
  ],
});

export const App = () => (
  <InstaProvider dataProvider={createRestProvider({ baseUrl: '/api' })} resources={[members]}>
    <InstaAdmin />
  </InstaProvider>
);
```

Validation:

- **`validateConfig(resources)`** reports unknown keys and types, relations to unknown resources, bad operators, and unknown widgets, displays and components.
- **`InstaProvider` runs it automatically** and warns once per config change. Pass `validate="strict"` to throw, or `validate={false}` to skip it.
- **Vendor extensions** (`x-…` keys) are allowed.
- **Strict mode in CI:** use `validateConfig(json, { mode: 'strict' })` to check a config before your backend serves it.

Security rules for configs:

- **Strings are never evaluated as code.**
- **There is no `$regex` or `$where`.**
- **Custom request paths must be relative** to the provider's base URL.
- **Links are sanitised.**
