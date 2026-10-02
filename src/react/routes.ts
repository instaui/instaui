/**
 * Per-resource routes, relative to the resource's base path:
 *   {base}             list
 *   {base}/{id}        detail     (paths.detail)
 *   {base}/{id}/edit   edit       (paths.edit)
 *   {base}/new         create     (paths.create; `false` = no create route)
 * The list query string travels with every view, so the list behind a record keeps its state.
 */
import { useCallback, useMemo } from 'react';
import type { ListState } from '../core/list-state.ts';
import { useInsta, useResource } from './context.tsx';

export interface ResourcePaths {
  detail?: string;
  edit?: string;
  create?: string | false;
}

export const DEFAULT_PATHS = { detail: '{id}', edit: '{id}/edit', create: 'new' } as const;

export type ResourceView =
  | { view: 'list' }
  | { view: 'create' }
  | { view: 'detail' | 'edit'; id: string }
  | { view: 'unknown' };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function compile(template: string): RegExp {
  const parts = template.split('{id}').map(escape);
  return new RegExp(`^${parts.join('([^/]+)')}$`);
}

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, '');

export function matchView(pathname: string, base: string, paths: ResourcePaths = {}): ResourceView {
  const root = `/${trimSlashes(base)}`;
  const path = `/${trimSlashes(pathname)}`;
  if (path !== root && !path.startsWith(root === '/' ? '/' : `${root}/`))
    return { view: 'unknown' };
  const rest = trimSlashes(path.slice(root.length));
  if (rest === '') return { view: 'list' };
  const create = paths.create ?? DEFAULT_PATHS.create;
  if (create !== false && rest === trimSlashes(create)) return { view: 'create' };
  for (const view of ['edit', 'detail'] as const) {
    const match = compile(trimSlashes(paths[view] ?? DEFAULT_PATHS[view])).exec(rest);
    if (match?.[1]) {
      try {
        return { view, id: decodeURIComponent(match[1]) };
      } catch {
        return { view: 'unknown' };
      }
    }
  }
  return { view: 'unknown' };
}

export function buildPath(
  base: string,
  view: 'list' | 'create' | 'detail' | 'edit',
  id?: string | number,
  paths: ResourcePaths = {},
): string {
  const root = `/${trimSlashes(base)}`.replace(/\/$/, '') || '';
  if (view === 'list') return root || '/';
  const template =
    view === 'create'
      ? paths.create === false
        ? undefined
        : (paths.create ?? DEFAULT_PATHS.create)
      : (paths[view] ?? DEFAULT_PATHS[view]);
  if (template === undefined) throw new Error('This resource has no create route');
  const segment = trimSlashes(template).replace('{id}', encodeURIComponent(String(id ?? '')));
  return `${root}/${segment}`;
}

export interface ResourceRouting {
  current: ResourceView;
  list: ListState;
  setList(next: ListState): void;
  openDetail(id: string | number): void;
  openEdit(id: string | number): void;
  openCreate(): void;
  /** Back to the list, keeping its query. */
  close(): void;
  hrefFor(view: 'list' | 'detail' | 'edit' | 'create', id?: string | number): string;
}

export function useResourceRouting(
  resourceName: string,
  base: string,
  paths?: ResourcePaths,
): ResourceRouting {
  const resource = useResource(resourceName);
  const { router, urlCodec } = useInsta();
  const { location, navigate } = router.useRouter();

  const defaults = useMemo(
    () => ({
      pageSize: resource.list.pageSize,
      sort: resource.list.sort,
      fieldTypes: Object.fromEntries(resource.fields.map((f) => [f.key, f.type])),
      fieldParams: { ...resource.ref.params },
      fieldParamRanges: { ...resource.ref.paramRanges },
      defaultTab: resource.list.tabs[0]?.key,
    }),
    [resource],
  );
  const list = useMemo(
    () => urlCodec.parse(location.search, defaults),
    [urlCodec, location.search, defaults],
  );
  const current = useMemo(
    () => matchView(location.pathname, base, paths),
    [location.pathname, base, paths],
  );

  const hrefFor = useCallback(
    (view: 'list' | 'detail' | 'edit' | 'create', id?: string | number) =>
      `${buildPath(base, view, id, paths)}${location.search}`,
    [base, paths, location.search],
  );

  return {
    current,
    list,
    setList: useCallback(
      (next: ListState) => {
        navigate(
          `${buildPath(base, 'list', undefined, paths)}${urlCodec.stringify(next, defaults)}`,
          {
            replace: true,
          },
        );
      },
      [base, paths, navigate, urlCodec, defaults],
    ),
    openDetail: useCallback(
      (id: string | number) => navigate(hrefFor('detail', id)),
      [navigate, hrefFor],
    ),
    openEdit: useCallback(
      (id: string | number) => navigate(hrefFor('edit', id)),
      [navigate, hrefFor],
    ),
    openCreate: useCallback(() => navigate(hrefFor('create')), [navigate, hrefFor]),
    close: useCallback(() => navigate(hrefFor('list'), { replace: true }), [navigate, hrefFor]),
    hrefFor,
  };
}
