/** TanStack Query hooks over the DataProvider. No effect depends on app-supplied object identity. */
import {
  keepPreviousData,
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
import type { Where } from '../core/where.ts';
import { useInsta, useResource } from './context.tsx';

const isEmptyWhere = (w: Where | undefined) => !w || Object.keys(w).length === 0;

/** AND-combines non-empty filters. */
export function andWhere(...filters: (Where | undefined)[]): Where {
  const present = filters.filter((f): f is Where => !isEmptyWhere(f));
  return present.length === 0 ? {} : present.length === 1 ? present[0]! : { $and: present };
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
    filter: andWhere(resource.list.filter, state.filter),
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

/** Fetches records by id: `getMany` when available, else parallel `getOne` (failures skipped). */
export async function fetchRecordsByIds(
  dataProvider: DataProvider,
  ref: ResourceRef,
  ids: string[],
  ctx: InstaContext,
  signal?: AbortSignal,
): Promise<Map<string, AnyRecord>> {
  const records = dataProvider.getMany
    ? (await dataProvider.getMany<AnyRecord>({ resource: ref, ctx, ids, signal })).data
    : await Promise.all(
        ids.map(async (id) => {
          try {
            return (await dataProvider.getOne<AnyRecord>({ resource: ref, ctx, id, signal })).data;
          } catch {
            return undefined; // a deleted related record must not break the whole list
          }
        }),
      );
  const byId = new Map<string, AnyRecord>();
  for (const r of records) {
    const rid = r ? recordId(ref, r) : undefined;
    if (r && rid !== undefined) byId.set(String(rid), r);
  }
  return byId;
}

/** Records by id (relation labels). */
export function useRecordsByIds(resourceName: string | undefined, ids: Id[]) {
  const { dataProvider, ctx, resources } = useInsta();
  const resource = resourceName ? resources.get(resourceName) : undefined;
  const unique = useMemo(() => [...new Set(ids.map(String))].sort(), [ids]);
  return useQuery({
    queryKey: resourceKeys.many(resourceName ?? '', unique, ctx),
    queryFn: ({ signal }) => fetchRecordsByIds(dataProvider, resource!.ref, unique, ctx, signal),
    enabled: resource !== undefined && unique.length > 0,
    staleTime: 60_000,
  });
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
