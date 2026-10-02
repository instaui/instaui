# Routing

instaui never imports a router. Routing goes through a small adapter, passed as `<InstaProvider router={…}>`:

- **`historyAdapter`:** the browser URL. `InstaAdmin` uses it when no router is given.
- **`memoryAdapter(initial)`:** in memory. The default for embedded views and tests.
- **`createRouterAdapter({ useLocation, useNavigate, Link })`:** your app's router. Pass the hooks from your own `react-router-dom` (v6, v7 or v8), or from any router that exposes a location and a navigate function. Using your app's copy avoids a second router context.

```tsx
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  InstaProvider,
  ResourceCrud,
  createRestProvider,
  createRouterAdapter,
  defineResource,
  type LinkProps,
} from 'instaui';

const Link = ({ to, children, className }: LinkProps) => (
  <RouterLink to={to} className={className}>
    {children}
  </RouterLink>
);
const router = createRouterAdapter({ useLocation, useNavigate, Link });
const projects = defineResource({ name: 'projects', fields: [{ key: 'name', type: 'text' }] });

// Mount under any path, e.g. <Route path="/admin/projects/*" element={<Projects />} />
export const Projects = () => (
  <InstaProvider
    dataProvider={createRestProvider({ baseUrl: '/api' })}
    resources={[projects]}
    router={router}
  >
    <ResourceCrud
      resource="projects"
      basePath="/admin/projects"
      basePathOf={(name) => `/admin/${name}`}
    />
  </InstaProvider>
);
```

## URLs

Each resource lives under its base path:

| Path               | View   |
| ------------------ | ------ |
| `{base}`           | List   |
| `{base}/new`       | Create |
| `{base}/{id}`      | Detail |
| `{base}/{id}/edit` | Edit   |

To change the scheme, pass `paths`, for example `{ detail: 'view/{id}', edit: 'edit/{id}', create: false }`.

The list's state (page, page size, sort, filters, search) is in the query string, and it travels with every view. So:

- **Deep links work:** a link to a record keeps the filtered list behind it.
- **Back closes:** opening a record adds a history entry, so Back closes it.
- **Closing restores:** closing returns to the same list.

The query format is `?page=2&sort=-name&f.status=OPEN&f.amount.gte=10&q=text`. Pass `<InstaProvider urlCodec={passthroughUrlCodec}>` to make the browser URL mirror the REST query instead. `paramUrlCodec({ sort: 'sortBy', … })` changes the param names.
