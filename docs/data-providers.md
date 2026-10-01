# Data providers

instaui talks to your backend through a `DataProvider`: `getList`, `getOne`, `getMany?`, `create`, `update`, `deleteOne`, `updateMany?`, `deleteMany?` and `custom`.

## REST

```tsx
import { createRestProvider } from 'instaui';

export const api = createRestProvider({
  baseUrl: 'https://api.example.com/v1',
  headers: () => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` }),
});
```

Default conventions:

| Operation                | Request                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| List                     | `GET {path}?page=1&pageSize=20&sort=name&order=asc&status=OPEN&amount[gte]=10&q=text` |
| One                      | `GET {path}/{id}` (ids are always URL-encoded)                                        |
| Create / update / delete | `POST {path}`, `PATCH {path}/{id}`, `DELETE {path}/{id}`                              |

- **`{path}`** is `resource.api.path`, which defaults to the resource name and can contain `{ctx.x}` placeholders, for example `'orgs/{ctx.orgId}/projects'`.
- **Request bodies** are JSON. They switch to multipart only when a value is a `File` or `Blob`.
- **Errors** are thrown as `HttpError`, and its `errors` become field errors.
- **List responses** may be an array, or `{ data | items | results, total | count }`. A keyed envelope is selected with `resource.api.listKey`. Unrecognised shapes throw a clear error.

Every convention is a small function you can replace: `urlFor`, `encodeList`, `decodeList`, `decodeOne`, `encodeBody`, `mapError`, plus `request` itself.

```tsx
import { createRestProvider, defaultEncodeList, type ListParams } from 'instaui';

export const api = createRestProvider({
  baseUrl: '/api',
  // This backend uses offset/limit and wraps lists as { rows, totalCount }.
  encodeList: (params: ListParams) => {
    const { page, pageSize, ...rest } = defaultEncodeList(params);
    return { ...rest, offset: (Number(page) - 1) * Number(pageSize), limit: pageSize };
  },
  decodeList: (raw) => {
    const body = raw as { rows: Record<string, unknown>[]; totalCount: number };
    return { data: body.rows, total: body.totalCount };
  },
});
```

## An existing HTTP client

`fromApiClient` adapts an axios-style client (`get`, `post`, `patch`, `delete` returning the parsed body). All other options work as above.

```tsx
import axios from 'axios';
import { fromApiClient, type ApiClientLike } from 'instaui';

const http = axios.create({ baseURL: '/api' });
const client: ApiClientLike = {
  get: (url, config) => http.get(url, config as never).then((r) => r.data),
  post: (url, data) => http.post(url, data).then((r) => r.data),
  patch: (url, data) => http.patch(url, data).then((r) => r.data),
  delete: (url) => http.delete(url).then((r) => r.data),
};

export const api = fromApiClient(client);
```

## In memory

`createMemoryProvider(seed)` implements the whole contract, including `Where` filters. Use it for tests, demos and prototypes.

## Caching

Data goes through TanStack Query.

- **Your own client:** if your app already renders a `QueryClientProvider`, instaui uses that client.
- **Default client:** otherwise it creates one with no retries on 4xx and no refetch on window focus.
- **Query keys:** `resourceKeys` builds them. They include `ctx`, so switching organisation never shows another one's cached data.

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { resourceKeys } from 'instaui';

export function useRefreshOrders() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: resourceKeys.all('orders') });
}
```
