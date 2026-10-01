/**
 * TanStack Query keys. Public so apps can invalidate (`queryClient.invalidateQueries({ queryKey: resourceKeys.all('users') })`).
 * Every key includes `ctx`, so switching organisation/workspace never shows another one's cached data.
 */
import type { Id, InstaContext, Pagination, SortSpec } from './data-provider.ts';
import type { Where } from './where.ts';

export interface ListKeyParams {
  pagination: Pagination;
  sort: SortSpec[];
  filter: Where;
  search?: string;
}

export const resourceKeys = {
  all: (resource: string) => ['instaui', resource] as const,
  lists: (resource: string) => ['instaui', resource, 'list'] as const,
  list: (resource: string, params: ListKeyParams, ctx: InstaContext) =>
    ['instaui', resource, 'list', params, ctx] as const,
  one: (resource: string, id: Id, ctx: InstaContext) =>
    ['instaui', resource, 'one', String(id), ctx] as const,
  many: (resource: string, ids: Id[], ctx: InstaContext) =>
    ['instaui', resource, 'many', ids.map(String).sort(), ctx] as const,
};
