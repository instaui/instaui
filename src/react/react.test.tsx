import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { createMemoryProvider } from '../core/memory-provider.ts';
import { defineResource } from '../core/resource.ts';
import { isAllowed, useCan } from './access.ts';
import { InstaProvider, useResource, useScopedConfig } from './context.tsx';
import { useRecordsByIds, useRelationOptions, useResourceList, useResourceRecord } from './data.ts';
import { createRouterAdapter, memoryAdapter } from './router.ts';
import { buildPath, matchView, useResourceRouting } from './routes.ts';
import { useResourceSubmit } from './submit.ts';

const projects = defineResource({
  name: 'projects',
  fields: [
    { key: 'name', type: 'text', filter: true },
    { key: 'budget', type: 'number', filter: true },
    { key: 'status', type: 'enum', props: { options: [{ value: 'OPEN', label: 'Open' }] } },
    { key: 'teamId', type: 'relation', props: { resource: 'teams' } },
  ],
  access: { delete: { status: { $ne: 'OPEN' } }, edit: true },
  form: {
    validate: (values) => (values.name === 'bad' ? { name: 'Not allowed' } : undefined),
  },
});
const teams = defineResource({ name: 'teams', fields: [{ key: 'name', type: 'text' }] });

const seed = () => ({
  projects: [
    { id: 1, name: 'Apollo', budget: 10, status: 'OPEN', teamId: 1 },
    { id: 2, name: 'Gemini', budget: 0, status: 'DONE', teamId: 2 },
  ],
  teams: [
    { id: 1, name: 'Core' },
    { id: 2, name: 'Edge' },
  ],
});

function setup(path = '/projects', can?: (c: { action: string }) => boolean) {
  const router = memoryAdapter(path);
  const dataProvider = createMemoryProvider(seed());
  const wrapper = ({ children }: { children: ReactNode }) => (
    <InstaProvider
      dataProvider={dataProvider}
      resources={[projects, teams]}
      router={router}
      can={can}
    >
      {children}
    </InstaProvider>
  );
  return { router, dataProvider, wrapper };
}

describe('router adapters', () => {
  test('memoryAdapter records push and replace', () => {
    const router = memoryAdapter('/a');
    const { result } = renderHook(() => router.useRouter());
    act(() => result.current.navigate('/b?x=1'));
    expect(result.current.location).toEqual({ pathname: '/b', search: '?x=1' });
    act(() => result.current.navigate('/c', { replace: true }));
    expect(router.history).toEqual(['/a', '/c']);
  });

  test('createRouterAdapter uses the app router hooks it is given', () => {
    const navigate = vi.fn();
    const adapter = createRouterAdapter({
      useLocation: () => ({ pathname: '/x', search: '?q=1' }),
      useNavigate: () => navigate,
    });
    const { result } = renderHook(() => adapter.useRouter());
    expect(result.current.location).toEqual({ pathname: '/x', search: '?q=1' });
    result.current.navigate('/y', { replace: true });
    expect(navigate).toHaveBeenCalledWith('/y', { replace: true });
  });
});

describe('routes', () => {
  test.each([
    ['/admin/projects', { view: 'list' }],
    ['/admin/projects/', { view: 'list' }],
    ['/admin/projects/new', { view: 'create' }],
    ['/admin/projects/a%2Fb', { view: 'detail', id: 'a/b' }],
    ['/admin/projects/7/edit', { view: 'edit', id: '7' }],
    ['/admin/other', { view: 'unknown' }],
  ])('%s', (path, expected) => expect(matchView(path, '/admin/projects')).toEqual(expected));

  test('custom path schemes, such as view/{id}', () => {
    const paths = { detail: 'view/{id}', edit: 'edit/{id}', create: false as const };
    expect(matchView('/projects/view/3', '/projects', paths)).toEqual({ view: 'detail', id: '3' });
    expect(matchView('/projects/new', '/projects', paths)).toEqual({ view: 'unknown' });
    expect(buildPath('/projects', 'edit', 'a b', paths)).toBe('/projects/edit/a%20b');
  });

  test('B01/B14/B15: deep links keep the list query; open pushes, close replaces', () => {
    const { router, wrapper } = setup('/projects/2?page=2&f.status=DONE');
    const { result } = renderHook(() => useResourceRouting('projects', '/projects'), { wrapper });
    expect(result.current.current).toEqual({ view: 'detail', id: '2' });
    expect(result.current.list).toMatchObject({ page: 2, filter: { status: { $eq: 'DONE' } } });
    act(() => result.current.close());
    expect(router.current()).toEqual({ pathname: '/projects', search: '?page=2&f.status=DONE' });
    act(() => result.current.openEdit(2));
    expect(router.history).toEqual([
      '/projects?page=2&f.status=DONE',
      '/projects/2/edit?page=2&f.status=DONE',
    ]);
  });

  test('setList writes the URL (replace) and restores typed filters', () => {
    const { router, wrapper } = setup();
    const { result } = renderHook(() => useResourceRouting('projects', '/projects'), { wrapper });
    act(() =>
      result.current.setList({ page: 1, pageSize: 10, sort: [], filter: { budget: { $gte: 5 } } }),
    );
    expect(router.current().search).toBe('?f.budget.gte=5');
    expect(result.current.list.filter).toEqual({ budget: { $gte: 5 } });
  });
});

describe('data hooks', () => {
  test('list, record and resource lookup', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => ({
        list: useResourceList('projects', {
          page: 1,
          pageSize: 10,
          sort: [],
          filter: { budget: { $gte: 5 } },
        }),
        one: useResourceRecord('projects', 2),
        resource: useResource('projects'),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());
    expect(result.current.list.data).toEqual({ data: [seed().projects[0]], total: 1 });
    await waitFor(() => expect(result.current.one.data).toEqual(seed().projects[1]));
    expect(result.current.resource.label.one).toBe('Projects');
  });

  test('unknown resources fail loudly', () => {
    const { wrapper } = setup();
    expect(() => renderHook(() => useResource('nope'), { wrapper })).toThrow(
      /Unknown resource "nope"/,
    );
  });

  test('relation options page and dedupe; records by id resolve labels', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => ({
        options: useRelationOptions({ resource: 'teams', pageSize: 1 }),
        byId: useRecordsByIds('teams', [2, 2, 1]),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.options.records).toHaveLength(1));
    expect(result.current.options.hasNextPage).toBe(true);
    await act(() => result.current.options.fetchNextPage());
    await waitFor(() =>
      expect(result.current.options.records.map((r) => r.name)).toEqual(['Core', 'Edge']),
    );
    await waitFor(() =>
      expect(result.current.byId.data?.get('2')).toEqual({ id: 2, name: 'Edge' }),
    );
  });
});

describe('useScopedConfig', () => {
  test('keeps ctx values as given and the same config while they are equal', () => {
    // The provider's own config only stays the same while its props do.
    const resources = [projects, teams];
    const dataProvider = createMemoryProvider(seed());
    const wrapper = ({ children }: { children: ReactNode }) => (
      <InstaProvider dataProvider={dataProvider} resources={resources}>
        {children}
      </InstaProvider>
    );
    const since = new Date('2026-01-01');
    const format = (n: number) => `#${n}`;
    const { result, rerender } = renderHook(({ id }) => useScopedConfig({ id, since, format }), {
      wrapper,
      initialProps: { id: 1 },
    });
    const first = result.current;
    expect(first.ctx.since).toBe(since);
    expect(first.ctx.format).toBe(format);
    rerender({ id: 1 });
    expect(result.current).toBe(first);
    rerender({ id: 2 });
    expect(result.current.ctx.id).toBe(2);
    expect(result.current).not.toBe(first);
  });
});

describe('access', () => {
  test('resource rules are evaluated against the record and AND-ed with can()', () => {
    const { wrapper } = setup('/projects', ({ action }) => action !== 'create');
    const { result } = renderHook(() => useCan('projects'), { wrapper });
    expect(result.current('delete', seed().projects[0])).toBe(false);
    expect(result.current('delete', seed().projects[1])).toBe(true);
    expect(result.current('edit')).toBe(true);
    expect(result.current('create')).toBe(false);
  });

  test('isAllowed without can()', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useResource('projects'), { wrapper });
    expect(isAllowed(result.current, 'detail', undefined, {})).toBe(true);
  });
});

describe('useResourceSubmit', () => {
  test('validates form values, then sends only the diff and refreshes', async () => {
    const { wrapper, dataProvider } = setup();
    const { result } = renderHook(() => useResourceSubmit('projects'), { wrapper });
    const original = seed().projects[1]!;
    const rejected = await result.current({
      mode: 'edit',
      id: 2,
      original,
      values: { ...original, name: 'bad' },
    });
    expect(rejected).toEqual({
      ok: false,
      fieldErrors: { name: 'Not allowed' },
      message: expect.any(String),
    });

    const saved = await result.current({
      mode: 'edit',
      id: 2,
      original,
      values: { ...original, budget: 5 },
    });
    expect(saved).toMatchObject({ ok: true, payload: { budget: 5 } });
    expect(dataProvider.snapshot().projects![1]).toMatchObject({ budget: 5, name: 'Gemini' });
  });

  test('server field errors come back as field errors', async () => {
    const { wrapper, dataProvider } = setup();
    const { HttpError } = await import('../core/http-error.ts');
    dataProvider.create = () =>
      Promise.reject(
        new HttpError({ status: 422, message: 'Invalid', fieldErrors: { name: 'Taken' } }),
      );
    const { result } = renderHook(() => useResourceSubmit('projects'), { wrapper });
    await expect(result.current({ mode: 'create', values: { name: 'Apollo' } })).resolves.toEqual({
      ok: false,
      fieldErrors: { name: 'Taken' },
      message: 'Invalid',
    });
  });
});

describe('config validation in InstaProvider', () => {
  test('reports issues through one warning channel; strict mode throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = defineResource({ name: 'broken', fields: [{ key: 'x', type: 'nope' }] });
    renderHook(() => null, {
      wrapper: ({ children }) => (
        <InstaProvider dataProvider={createMemoryProvider()} resources={[broken]}>
          {children}
        </InstaProvider>
      ),
    });
    expect(warn).toHaveBeenCalledWith(
      '[instaui] Config error in broken.fields.x.type: Unknown field type "nope"',
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderHook(() => null, {
        wrapper: ({ children }) => (
          <InstaProvider
            dataProvider={createMemoryProvider()}
            resources={[broken]}
            validate="strict"
          >
            {children}
          </InstaProvider>
        ),
      }),
    ).toThrow(/Invalid instaui config/);
  });
});

describe('submit options for migrating apps', () => {
  const make = (form: Parameters<typeof defineResource>[0]['form']) =>
    defineResource({
      name: 'notes',
      fields: [
        { key: 'title', type: 'text' },
        { key: 'body', type: 'text' },
      ],
      form,
    });
  const renderSubmit = (resource: ReturnType<typeof make>) => {
    const dataProvider = createMemoryProvider({ notes: [{ id: 1, title: 'A' }] });
    const update = vi.spyOn(dataProvider, 'update');
    const { result } = renderHook(() => useResourceSubmit('notes'), {
      wrapper: ({ children }) => (
        <InstaProvider dataProvider={dataProvider} resources={[resource]}>
          {children}
        </InstaProvider>
      ),
    });
    return { submit: result, update };
  };

  test("emptyValue: 'omit' sends nothing for empty values instead of null", async () => {
    const { submit, update } = renderSubmit(make({ patch: 'full', emptyValue: 'omit' }));
    await submit.current({
      mode: 'edit',
      id: 1,
      original: { id: 1, title: 'A' },
      values: { title: 'B', body: undefined },
    });
    expect(update.mock.calls[0]![0].data).toEqual({ title: 'B' });
  });

  test('validatePayload sees the final payload; field, form-level and thrown errors all stop the save', async () => {
    const seen: unknown[] = [];
    const validatePayload = vi.fn((payload: Record<string, unknown>) => {
      seen.push(payload);
      if (payload.title === 'field') return { title: 'Bad title' };
      if (payload.title === 'form') return 'Not allowed';
      if (payload.title === 'throw') throw new Error('Broken');
      return undefined;
    });
    const { submit, update } = renderSubmit(
      make({
        patch: 'full',
        beforeSubmit: (p, { record }) => ({ ...p, extra: record?.title === 'A' }),
        validatePayload,
      }),
    );
    const original = { id: 1, title: 'A' };
    const run = (title: string) =>
      submit.current({ mode: 'edit', id: 1, original, values: { title } });
    await expect(run('field')).resolves.toMatchObject({
      ok: false,
      fieldErrors: { title: 'Bad title' },
    });
    await expect(run('form')).resolves.toMatchObject({
      ok: false,
      fieldErrors: { _form: 'Not allowed' },
      message: 'Not allowed',
    });
    await expect(run('throw')).resolves.toMatchObject({ ok: false, message: 'Broken' });
    expect(update).not.toHaveBeenCalled();
    await expect(run('ok')).resolves.toMatchObject({ ok: true });
    expect(seen.at(-1)).toEqual({ title: 'ok', body: null, extra: true });
  });
});
