/**
 * List fallbacks for backends that lack a route, driven by `resource.api`:
 *  - `lookup: 'list'`: no `GET {path}/{id}`; records are found by id by paging through the list.
 *  - `lookup: { search: 'field' }`: found by searching the list for the id in that field (for
 *    lists that can search an id column, when GET-one is missing or more restricted).
 *  - `search: 'client'`: the list cannot search; typed text filters its first rows here.
 * `createRestProvider` applies these; wrap another provider with `withListFallbacks`.
 */
import {
  recordId,
  type AnyRecord,
  type DataProvider,
  type Id,
  type InstaContext,
  type ListParams,
  type ResourceRef,
} from './data-provider.ts';
import { HttpError } from './http-error.ts';
import { warn } from './warn.ts';
import { pageOf } from './value.ts';

/** Rows fetched per page when paging through a list. */
export const LOOKUP_PAGE_SIZE = 100;
const MAX_PAGES = 50;

type Lookup = 'list' | { search: string };

const lookupOf = (resource: ResourceRef) => resource.api.lookup as Lookup | undefined;

const matches = (row: AnyRecord, text: string) => {
  const needle = text.toLowerCase();
  return Object.values(row).some(
    (v) =>
      (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(needle),
  );
};

/** Every row of a list, page by page (stops at the end, or after 5,000 rows with a warning). */
export async function fetchAll(
  provider: DataProvider,
  params: {
    resource: ResourceRef;
    ctx: InstaContext;
    filter?: ListParams['filter'];
    signal?: AbortSignal;
  },
): Promise<AnyRecord[]> {
  const rows: AnyRecord[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, total } = await provider.getList<AnyRecord>({
      resource: params.resource,
      ctx: params.ctx,
      signal: params.signal,
      filter: params.filter ?? {},
      sort: [],
      pagination: { mode: 'offset', page, pageSize: LOOKUP_PAGE_SIZE },
    });
    rows.push(...data);
    if (data.length < LOOKUP_PAGE_SIZE || total === undefined || rows.length >= total) return rows;
  }
  warn(
    `${params.resource.name} has more than ${MAX_PAGES * LOOKUP_PAGE_SIZE} rows; the rest were not loaded`,
  );
  return rows;
}

type ByIds = { resource: ResourceRef; ctx: InstaContext; ids: Id[]; signal?: AbortSignal };

/** One `getOne` per id. A deleted or forbidden record is skipped, not an error for the rest. */
async function eachById(provider: DataProvider, { ids, ...params }: ByIds) {
  const found = await Promise.allSettled(
    ids.map(async (id) => (await provider.getOne<AnyRecord>({ ...params, id })).data),
  );
  return found.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []));
}

/** Records by id: the provider's `getMany` when it has one, else one `getOne` per id. */
export async function getRecordsByIds(provider: DataProvider, params: ByIds): Promise<AnyRecord[]> {
  return provider.getMany
    ? (await provider.getMany<AnyRecord>(params)).data
    : eachById(provider, params);
}

export function withListFallbacks(base: DataProvider): DataProvider {
  const findByIds = async (
    resource: ResourceRef,
    ctx: InstaContext,
    ids: Id[],
    signal?: AbortSignal,
  ) => {
    const lookup = lookupOf(resource);
    const wanted = [...new Set(ids.map(String))];
    if (lookup === 'list') {
      const set = new Set(wanted);
      const rows = await fetchAll(base, { resource, ctx, signal });
      return rows.filter((r) => set.has(String(recordId(resource, r))));
    }
    if (!lookup) return eachById(base, { resource, ctx, ids: wanted, signal });
    const found = await Promise.allSettled(
      wanted.map(async (id) => {
        const { data } = await base.getList<AnyRecord>({
          resource,
          ctx,
          signal,
          filter: {},
          sort: [],
          pagination: { mode: 'offset', page: 1, pageSize: 10 },
          search: id,
          meta: { searchFields: [lookup.search] },
        });
        return data.find((r) => String(recordId(resource, r)) === id);
      }),
    );
    // A deleted or forbidden record must not break the rows around it.
    return found.flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []));
  };

  return {
    ...base,
    async getList<T>(params: ListParams) {
      if (!params.search || params.resource.api.search !== 'client') return base.getList<T>(params);
      const { data } = await base.getList<AnyRecord>({
        ...params,
        search: undefined,
        pagination: { mode: 'offset', page: 1, pageSize: LOOKUP_PAGE_SIZE },
      });
      const rows = data.filter((row) => matches(row, params.search!));
      if (params.pagination.mode !== 'offset') return { data: rows as T[], total: rows.length };
      const { page, pageSize } = params.pagination;
      return {
        data: pageOf(rows, page, pageSize) as T[],
        total: rows.length,
      };
    },
    async getOne<T>(params: Parameters<DataProvider['getOne']>[0]) {
      if (!lookupOf(params.resource)) return base.getOne<T>(params);
      const [record] = await findByIds(params.resource, params.ctx, [params.id], params.signal);
      if (!record) throw new HttpError({ status: 404, message: 'Not found' });
      return { data: record as T };
    },
    async getMany<T>(params: {
      resource: ResourceRef;
      ctx: InstaContext;
      ids: Id[];
      signal?: AbortSignal;
    }) {
      if (base.getMany && !lookupOf(params.resource)) return base.getMany<T>(params);
      return {
        data: (await findByIds(params.resource, params.ctx, params.ids, params.signal)) as T[],
      };
    },
  };
}
