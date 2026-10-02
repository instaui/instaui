/** TanStack Query hooks over the DataProvider. No effect depends on app-supplied object identity. */
import {
  keepPreviousData,
  useQueries,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  AnyRecord,
  DataProvider,
  Id,
  InstaContext,
  ListParams,
  ListResult,
  ResourceRef,
} from '../core/data-provider.ts';
import { recordId } from '../core/data-provider.ts';
import type { ListState } from '../core/list-state.ts';
import { resourceKeys } from '../core/query-keys.ts';
import { getRecordsByIds } from '../core/lookup.ts';
import { getPath } from '../core/path.ts';
import type { NormalizedField } from '../core/resource.ts';
import type { Where } from '../core/where.ts';
import { useInsta, useResource } from './context.tsx';
import { valuesOf } from '../core/value.ts';

const isEmptyWhere = (w: Where | undefined) => !w || Object.keys(w).length === 0;

/** AND-combines non-empty filters. */
export function andWhere(...filters: (Where | undefined)[]): Where {
  const present = filters.filter((f): f is Where => !isEmptyWhere(f));
  return present.length === 0 ? {} : present.length === 1 ? present[0]! : { $and: present };
}

/** The active tab: the one named by `key`, else the first. */
export function activeTab<T extends { key: string }>(
  tabs: readonly T[],
  key: string | undefined,
): T | undefined {
  return tabs.find((t) => t.key === key) ?? tabs[0];
}

export function useResourceList(
  resourceName: string,
  state: ListState,
  options: { enabled?: boolean } = {},
) {
  const resource = useResource(resourceName);
  const { dataProvider, ctx } = useInsta();
  const params = {
    pagination: { mode: 'offset' as const, page: state.page, pageSize: state.pageSize },
    sort: state.sort,
    filter: andWhere(
      resource.list.filter,
      activeTab(resource.list.tabs, state.tab)?.filter,
      state.filter,
    ),
    ...(state.search ? { search: state.search } : {}),
  };
  return useQuery({
    queryKey: resourceKeys.list(resourceName, params, ctx),
    queryFn: ({ signal }) =>
      dataProvider.getList<AnyRecord>({ ...params, resource: resource.ref, ctx, signal }),
    placeholderData: keepPreviousData,
    enabled: resource.kind === 'collection' && (options.enabled ?? true),
  });
}

export function useResourceRecord(
  resourceName: string,
  id: Id | undefined,
  options: { enabled?: boolean } = {},
) {
  const resource = useResource(resourceName);
  const { dataProvider, ctx } = useInsta();
  return useQuery({
    queryKey: resourceKeys.one(resourceName, id ?? '', ctx),
    queryFn: async ({ signal }) =>
      (await dataProvider.getOne<AnyRecord>({ resource: resource.ref, ctx, id: id as Id, signal }))
        .data,
    enabled: id !== undefined && id !== '' && (options.enabled ?? true),
  });
}

/**
 * A records-by-id query (relation labels): records keyed by their id, cached for a minute.
 * Without a resource it is disabled.
 */
function recordsByIdsQuery(
  dataProvider: DataProvider,
  ref: ResourceRef | undefined,
  ids: string[],
  ctx: InstaContext,
) {
  return {
    queryKey: resourceKeys.many(ref?.name ?? '', ids, ctx),
    enabled: ref !== undefined && ids.length > 0,
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      if (!ref) throw new Error('recordsByIdsQuery ran without a resource');
      const byId = new Map<string, AnyRecord>();
      for (const r of await getRecordsByIds(dataProvider, { resource: ref, ctx, ids, signal })) {
        const rid = recordId(ref, r);
        if (rid !== undefined) byId.set(String(rid), r);
      }
      return byId;
    },
    staleTime: 60_000,
  };
}

/** Records by id (relation labels). */
export function useRecordsByIds(resourceName: string | undefined, ids: Id[]) {
  const { dataProvider, ctx, resources } = useInsta();
  const resource = resourceName ? resources.get(resourceName) : undefined;
  const unique = useMemo(() => [...new Set(ids.map(String))].sort(), [ids]);
  return useQuery(recordsByIdsQuery(dataProvider, resource?.ref, unique, ctx));
}

/** Related records for relation cells, one request per related resource per page. */
export function useRelatedRecords(rows: AnyRecord[], fields: NormalizedField[]) {
  const { dataProvider, ctx, resources } = useInsta();
  const requests = useMemo(() => {
    const byTarget = new Map<string, Set<string>>();
    for (const field of fields) {
      const target = field.type === 'relation' ? field.props.resource : undefined;
      if (!target || !resources.has(target)) continue;
      for (const row of rows) {
        const raw = getPath(row, field.key);
        for (const item of valuesOf(raw)) {
          if (typeof item === 'object') continue;
          if (!byTarget.has(target)) byTarget.set(target, new Set());
          byTarget.get(target)!.add(String(item));
        }
      }
    }
    return [...byTarget].map(([target, ids]) => ({ target, ids: [...ids].sort() }));
  }, [fields, rows, resources]);

  // `combine` output is structurally shared by TanStack Query, so it is stable between renders.
  const datas = useQueries({
    queries: requests.map(({ target, ids }) => ({
      ...recordsByIdsQuery(dataProvider, resources.get(target)?.ref, ids, ctx),
    })),
    combine: (results) => results.map((r) => r.data),
  });
  return useMemo(() => {
    const map = new Map<string, Map<string, AnyRecord>>();
    requests.forEach(({ target }, i) => {
      const data = datas[i];
      if (data) map.set(target, data);
    });
    return map;
  }, [requests, datas]);
}

export interface RelationOptionsQuery {
  resource: string;
  search?: string;
  filter?: Where;
  pageSize?: number;
  searchFields?: string[];
  enabled?: boolean;
}

/** Paged, server-searched options. Out-of-order responses can't win: each search has its own key. */
export function useRelationOptions({
  resource: name,
  search,
  filter,
  pageSize = 20,
  searchFields,
  enabled = true,
}: RelationOptionsQuery) {
  const resource = useResource(name);
  const { dataProvider, ctx } = useInsta();
  const where = andWhere(resource.list.filter, filter);
  const query = useInfiniteQuery<
    ListResult<AnyRecord>,
    Error,
    InfiniteData<ListResult<AnyRecord>>,
    readonly unknown[],
    number
  >({
    queryKey: ['instaui', name, 'options', { search: search ?? '', where, pageSize }, ctx],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params: ListParams = {
        resource: resource.ref,
        ctx,
        signal,
        pagination: { mode: 'offset', page: pageParam, pageSize },
        sort: resource.list.sort,
        filter: where,
        ...(search ? { search } : {}),
        ...(searchFields ? { meta: { searchFields } } : {}),
      };
      return dataProvider.getList<AnyRecord>(params);
    },
    getNextPageParam: (last, pages, lastPage) => {
      const loaded = pages.reduce((n, p) => n + p.data.length, 0);
      if (typeof last.total === 'number') return loaded < last.total ? lastPage + 1 : undefined;
      return last.data.length >= pageSize ? lastPage + 1 : undefined;
    },
    enabled,
  });
  const records = useMemo(() => {
    const seen = new Set<string>();
    const out: AnyRecord[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const r of page.data) {
        const id = String(recordId(resource.ref, r));
        if (!seen.has(id)) {
          seen.add(id);
          out.push(r);
        }
      }
    }
    return out;
  }, [query.data, resource.ref]);
  return { ...query, records };
}

export function useResourceMutations(resourceName: string) {
  const resource = useResource(resourceName);
  const { dataProvider, ctx } = useInsta();
  const client = useQueryClient();
  const settle = (id?: Id) => {
    void client.invalidateQueries({ queryKey: resourceKeys.lists(resourceName) });
    if (id !== undefined)
      void client.invalidateQueries({ queryKey: resourceKeys.one(resourceName, id, ctx) });
  };
  const create = useMutation({
    mutationFn: (data: AnyRecord) => dataProvider.create({ resource: resource.ref, ctx, data }),
    onSettled: () => settle(),
  });
  const update = useMutation({
    mutationFn: ({
      id,
      data,
      previousData,
    }: {
      id: Id;
      data: AnyRecord;
      previousData?: AnyRecord;
    }) => dataProvider.update({ resource: resource.ref, ctx, id, data, previousData }),
    onSettled: (_r, _e, { id }) => settle(id),
  });
  const remove = useMutation({
    mutationFn: ({ id, previousData }: { id: Id; previousData?: AnyRecord }) =>
      dataProvider.deleteOne({ resource: resource.ref, ctx, id, previousData }),
    onSettled: (_r, _e, { id }) => settle(id),
  });
  return { create, update, remove };
}
