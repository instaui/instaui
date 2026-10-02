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

`fromApiClient` adapts an axios-style client: `get`, `post`, `patch`, `delete` (and optionally `put`) that resolve to the parsed body. All other options work as above. Errors with a `response.status` (axios errors) become `HttpError`s; any other error, such as one your interceptor throws, is shown with its own message.

```tsx
import axios from 'axios';
import { fromApiClient } from 'instaui';

const http = axios.create({ baseURL: '/api' });

export const api = fromApiClient({
  get: (url, config) => http.get(url, config).then((r) => r.data),
  post: (url, data, config) => http.post(url, data, config).then((r) => r.data),
  patch: (url, data, config) => http.patch(url, data, config).then((r) => r.data),
  delete: (url, config) => http.delete(url, config).then((r) => r.data),
});
```

## Fitting an existing API

Most backends differ from the defaults in a few ways: other parameter names, one search box, keyed envelopes, a missing route. You adapt the provider, never the resources.

### What `encodeList` receives

`encodeList(params)` turns a `ListParams` into query parameters:

| Field                  | Contents                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `pagination`           | `{ mode: 'offset', page, pageSize }`, `{ mode: 'cursor', … }` or `{ mode: 'off' }`                       |
| `sort`                 | `[{ field, order: 'asc' \| 'desc' }]`                                                                    |
| `filter`               | A [`Where`](where.md). `toConditions(filter, { ctx })` flattens it to `{ field, op, value }` conditions. |
| `search`               | Text typed in a relation picker or the list search box                                                   |
| `meta.searchFields`    | The relation field's `props.searchFields`, when set                                                      |
| `resource.params`      | `filter.param` renames, by field key                                                                     |
| `resource.paramRanges` | `filter.paramRange` pairs, by field key                                                                  |
| `resource.api`         | The resource's `api` object, **passed through untouched**, so it can carry your own per-resource options |

Filter controls produce `$eq` and `$in` (enums, relations, booleans), `$between` (dates), `$gte`/`$lte` (numbers) and `$contains` (text). A condition whose `{ $var: … }` has nothing to resolve to, such as a dependent picker before its parent is chosen, arrives with `value: undefined`. Skip it.

This backend reads `limit` instead of `pageSize`, searches one column at a time (`column` + `search`), takes lists as `a,b`, and wraps each list under the resource's name:

```tsx
import {
  fromApiClient,
  toConditions,
  type ApiClientLike,
  type ListParams,
  type QueryValue,
} from 'instaui';

const join = (v: unknown) => (Array.isArray(v) ? v.map(String).join(',') : String(v));

export function encodeList(params: ListParams): Record<string, QueryValue> {
  const query: Record<string, QueryValue> = {};
  const { resource } = params;
  if (params.pagination.mode === 'offset') {
    query.page = params.pagination.page;
    query.limit = Math.min(params.pagination.pageSize, 100);
  }
  const [sort] = params.sort;
  if (sort) Object.assign(query, { sortBy: sort.field, sortOrder: sort.order });

  for (const { field, op, value } of toConditions(params.filter, { ctx: params.ctx })) {
    if (value === undefined || value === null) continue; // unresolved $var: no filter
    const range = resource.paramRanges?.[field];
    if (range && (op === '$gte' || op === '$lte' || op === '$between')) {
      const [lo, hi] =
        op === '$between' ? (value as unknown[]) : op === '$gte' ? [value] : [undefined, value];
      if (lo !== undefined) query[range[0]] = join(lo);
      if (hi !== undefined) query[range[1]] = join(hi);
    } else if (op === '$contains') {
      query.column = resource.params?.[field] ?? field;
      query.search = String(value);
    } else {
      query[resource.params?.[field] ?? field] = join(value);
    }
  }
  // A per-resource option of ours, read from `api`: which column picker text searches.
  const column = (params.meta?.searchFields ?? resource.api.searchColumns) as string[] | undefined;
  if (params.search && column?.[0])
    Object.assign(query, { column: column[0], search: params.search });
  return query;
}

export const makeProvider = (client: ApiClientLike) => fromApiClient(client, { encodeList });

// A resource then names its envelope key and its search column:
// api: { path: 'customers', listKey: 'customers', searchColumns: ['name'] }
```

### Routes the backend doesn't have

A provider is a plain object, so you can wrap one and replace single methods. Relation labels call `getMany(ids)` once per page of rows; when a provider has no `getMany`, instaui calls `getOne` for each id. Here a backend with no `GET /{path}/{id}` for some resources finds those records in the list instead:

```tsx
import {
  HttpError,
  recordId,
  type AnyRecord,
  type DataProvider,
  type Id,
  type InstaContext,
  type ResourceRef,
} from 'instaui';

/** For resources whose `api.lookup` is `'list'`: find records by id in the first 100 rows. */
export function withListLookup(base: DataProvider): DataProvider {
  const findByIds = async (resource: ResourceRef, ctx: InstaContext, ids: Id[]) => {
    const wanted = new Set(ids.map(String));
    const { data } = await base.getList<AnyRecord>({
      resource,
      ctx,
      pagination: { mode: 'offset', page: 1, pageSize: 100 },
      sort: [],
      filter: {},
    });
    return data.filter((row) => wanted.has(String(recordId(resource, row))));
  };
  return {
    ...base,
    async getOne<T>(params: Parameters<DataProvider['getOne']>[0]) {
      if (params.resource.api.lookup !== 'list') return base.getOne<T>(params);
      const [record] = await findByIds(params.resource, params.ctx, [params.id]);
      if (!record) throw new HttpError({ status: 404, message: 'Not found' });
      return { data: record as T };
    },
    async getMany<T>(params: { resource: ResourceRef; ctx: InstaContext; ids: Id[] }) {
      if (params.resource.api.lookup === 'list') {
        return { data: (await findByIds(params.resource, params.ctx, params.ids)) as T[] };
      }
      const rows = await Promise.allSettled(
        params.ids.map((id) => base.getOne<T>({ ...params, id })),
      );
      // A deleted or forbidden related record must not break the whole list.
      return { data: rows.flatMap((r) => (r.status === 'fulfilled' ? [r.value.data] : [])) };
    },
  };
}
```

For a missing **update or delete** route, don't offer the action: `actions: ['create', 'detail']` or `access: { edit: false }` (see [Actions and access](actions-and-access.md)).

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
