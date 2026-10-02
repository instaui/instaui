/**
 * `useResourceTable`: the escape hatch below `ResourceCrud`. Returns list state, the query and
 * props to spread onto `<ResourceTable>`, for custom screens and child lists (e.g. in a modal).
 */
import { useState } from 'react';
import type { AnyRecord } from '../core/data-provider.ts';
import type { ListState } from '../core/list-state.ts';
import type { Where } from '../core/where.ts';
import { useResource } from '../react/context.tsx';
import { andWhere, useResourceList } from '../react/data.ts';
import { defaultBasePathOf, useResourceRouting } from '../react/routes.ts';
import type { ResourceTableProps } from './ResourceTable.tsx';

export interface UseResourceTableOptions {
  /** `'local'` (default) keeps state in memory; `'url'` syncs it to the browser URL at `basePath`. */
  state?: 'local' | 'url';
  basePath?: string;
  /** Extra permanent filter, e.g. `{ projectId: id }` for a child list. */
  filter?: Where;
  initial?: Partial<ListState>;
  onRowOpen?(record: AnyRecord): void;
  basePathOf?(resource: string): string;
}

export function useResourceTable(name: string, options: UseResourceTableOptions = {}) {
  const resource = useResource(name);
  const basePathOf = options.basePathOf ?? defaultBasePathOf;
  const [local, setLocal] = useState<ListState>(() => ({
    page: 1,
    pageSize: resource.list.pageSize,
    sort: resource.list.sort,
    filter: {},
    ...options.initial,
  }));
  const routing = useResourceRouting(name, options.basePath ?? basePathOf(name));
  const useUrl = options.state === 'url';
  const list = useUrl ? routing.list : local;
  const setList = useUrl ? routing.setList : setLocal;
  const query = useResourceList(name, { ...list, filter: andWhere(options.filter, list.filter) });

  const tableProps: ResourceTableProps = {
    resource,
    rows: query.data?.data ?? [],
    total: query.data?.total,
    loading: query.isFetching,
    list,
    onListChange: setList,
    onRowOpen: options.onRowOpen,
    basePathOf,
  };
  return { list, setList, query, tableProps };
}
