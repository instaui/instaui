import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { render } from '../../test/render.tsx';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import type { DataProvider } from '../core/data-provider.ts';
import { createMemoryProvider } from '../core/memory-provider.ts';
import { defineResource } from '../core/resource.ts';
import { InstaProvider } from '../react/context.tsx';
import { createRouterAdapter, memoryAdapter } from '../react/router.ts';
import { InstaAdmin } from './InstaAdmin.tsx';
import { ResourceCrud } from './ResourceCrud.tsx';

const teams = defineResource({ name: 'teams', fields: [{ key: 'name', type: 'text' }] });
const projects = defineResource({
  name: 'projects',
  recordLabel: '{name}',
  fields: [
    { key: 'name', type: 'text', required: true, list: { sortable: true } },
    { key: 'budget', type: 'number' },
    {
      key: 'status',
      type: 'enum',
      props: {
        options: [
          { value: 'OPEN', label: 'Open' },
          { value: 'DONE', label: 'Done' },
        ],
      },
    },
    { key: 'teamId', type: 'relation', props: { resource: 'teams' } },
    { key: 'site', type: 'text', display: 'link' },
    { key: 'notes', type: 'text', list: false },
  ],
  access: { delete: { status: { $ne: 'OPEN' } } },
});

const seed = () => ({
  projects: [
    {
      id: 1,
      name: 'Apollo',
      budget: 0,
      status: 'OPEN',
      teamId: 1,
      site: 'https://apollo.example',
      notes: 'first',
    },
    { id: 2, name: 'Gemini', budget: 1, status: 'DONE', teamId: 2, site: 'javascript:alert(1)' },
  ],
  teams: [
    { id: 1, name: 'Core' },
    { id: 2, name: 'Edge' },
  ],
});

function setup(path = '/projects', extra: { dataProvider?: DataProvider } = {}) {
  const router = memoryAdapter(path);
  const dataProvider = extra.dataProvider ?? createMemoryProvider(seed());
  const spy = {
    getList: vi.spyOn(dataProvider, 'getList'),
    getMany: dataProvider.getMany ? vi.spyOn(dataProvider, 'getMany') : undefined,
  };
  const view = render(
    <InstaProvider dataProvider={dataProvider} resources={[projects, teams]} router={router}>
      <ResourceCrud resource="projects" />
    </InstaProvider>,
  );
  return { router, dataProvider, spy, view };
}

const row = (text: string) => screen.getByText(text).closest('tr') as HTMLElement;

describe('list', () => {
  test('B07/B35/B19/S1: 0 shows, enum labels, relation labels (one batched request), safe links only', async () => {
    const { spy } = setup();
    expect(await screen.findByText('Apollo')).toBeTruthy();
    const apollo = row('Apollo');
    expect(within(apollo).getByText('0')).toBeTruthy();
    expect(within(apollo).getByText('Open')).toBeTruthy();
    expect(await within(apollo).findByText('Core')).toBeTruthy();
    expect(
      within(apollo).getByRole('link', { name: 'https://apollo.example' }).getAttribute('rel'),
    ).toBe('noopener noreferrer');
    expect(within(row('Gemini')).queryByRole('link', { name: /javascript/ })).toBeNull();
    expect(spy.getMany).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('first')).toBeNull(); // list: false
  });

  test('B01: a deep link with filters and a record keeps both', async () => {
    const { spy } = setup('/projects/2?f.status=DONE');
    expect(await screen.findByRole('dialog')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText('Gemini').length).toBeGreaterThan(0));
    expect(screen.queryByText('Apollo')).toBeNull();
    expect(spy.getList.mock.calls[0]![0].filter).toEqual({ status: { $eq: 'DONE' } });
  });

  test('sorting writes the URL', async () => {
    const { router } = setup();
    await screen.findByText('Apollo');
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    await waitFor(() => expect(router.current().search).toBe('?sort=name'));
  });
});

describe('detail, edit, delete', () => {
  test('B15: clicking a row pushes a detail route; closing returns to the list query', async () => {
    const { router } = setup('/projects?pageSize=20');
    fireEvent.click(await screen.findByText('Apollo'));
    await waitFor(() => expect(router.current().pathname).toBe('/projects/1'));
    expect(router.history).toEqual(['/projects?pageSize=20', '/projects/1?pageSize=20']);
    expect(await screen.findByText('first')).toBeTruthy(); // detail shows list:false fields
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() =>
      expect(router.current()).toEqual({ pathname: '/projects', search: '?pageSize=20' }),
    );
  });

  test('B03/B04: editing sends only the change, and the next record opens with its own values', async () => {
    const { router, dataProvider } = setup();
    const update = vi.spyOn(dataProvider, 'update');
    await screen.findByText('Apollo');
    act(() => router.navigate('/projects/1/edit'));
    const name = (await screen.findByDisplayValue('Apollo')) as HTMLInputElement;
    fireEvent.change(name, { target: { value: 'Apollo 2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]![0]).toMatchObject({ id: '1', data: { name: 'Apollo 2' } });
    await waitFor(() => expect(router.current().pathname).toBe('/projects'));

    act(() => router.navigate('/projects/2/edit'));
    expect(await screen.findByDisplayValue('Gemini')).toBeTruthy();
    expect(screen.queryByDisplayValue('first')).toBeNull();
  });

  test('required fields block submit; server field errors land on the field', async () => {
    const dataProvider = createMemoryProvider(seed());
    const { HttpError } = await import('../core/http-error.ts');
    dataProvider.create = () =>
      Promise.reject(
        new HttpError({ status: 422, message: 'Invalid', fieldErrors: { name: 'Name taken' } }),
      );
    const { router } = setup('/projects/new', { dataProvider });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Name is required')).toBeTruthy();
    fireEvent.change(screen.getAllByRole('textbox')[0]!, { target: { value: 'Apollo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Name taken')).toBeTruthy();
    expect(router.current().pathname).toBe('/projects/new');
  });

  test('access rules hide delete per record; delete confirms once and removes the row', async () => {
    const { dataProvider } = setup();
    await screen.findByText('Apollo');
    expect(within(row('Apollo')).queryByRole('button', { name: 'Delete' })).toBeNull();
    fireEvent.click(within(row('Gemini')).getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByText('Gemini')).toBeNull());
    expect(
      (dataProvider as ReturnType<typeof createMemoryProvider>).snapshot().projects,
    ).toHaveLength(1);
  });
});

describe('page resources and shells', () => {
  test('B27: a page resource renders its component and never fetches a list', async () => {
    const dashboard = defineResource({
      name: 'dashboard',
      kind: 'page',
      fields: [],
      components: { page: () => <p>Hello dashboard</p> },
    });
    const dataProvider = createMemoryProvider();
    const getList = vi.spyOn(dataProvider, 'getList');
    render(
      <InstaProvider dataProvider={dataProvider} resources={[dashboard]}>
        <ResourceCrud resource="dashboard" />
      </InstaProvider>,
    );
    expect(await screen.findByText('Hello dashboard')).toBeTruthy();
    expect(getList).not.toHaveBeenCalled();
  });

  test("createRouterAdapter drives the app's own react-router", async () => {
    const adapter = createRouterAdapter({ useLocation, useNavigate });
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <InstaProvider
          dataProvider={createMemoryProvider(seed())}
          resources={[projects, teams]}
          router={adapter}
        >
          <Routes>
            <Route path="/projects/*" element={<ResourceCrud resource="projects" />} />
          </Routes>
        </InstaProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByText('Gemini'));
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  test('InstaAdmin lists resources in the menu and opens the first one', async () => {
    const router = memoryAdapter('/admin');
    render(
      <InstaProvider
        dataProvider={createMemoryProvider(seed())}
        resources={[projects, teams]}
        router={router}
      >
        <InstaAdmin basePath="/admin" title="Admin" />
      </InstaProvider>,
    );
    await waitFor(() => expect(router.current().pathname).toBe('/admin/projects'));
    expect(await screen.findByText('Apollo')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Teams' }).getAttribute('href')).toBe('/admin/teams');
    expect(screen.getByLabelText('Collapse menu')).toBeTruthy();
  });
});

describe('escape hatches', () => {
  test('useResourceTable with local state renders a filtered child list without touching the URL', async () => {
    const { useResourceTable } = await import('./useResourceTable.tsx');
    const { ResourceTable } = await import('./ResourceTable.tsx');
    function OpenProjects() {
      const { tableProps } = useResourceTable('projects', { filter: { status: 'OPEN' } });
      return <ResourceTable {...tableProps} />;
    }
    const router = memoryAdapter('/somewhere');
    render(
      <InstaProvider
        dataProvider={createMemoryProvider(seed())}
        resources={[projects, teams]}
        router={router}
      >
        <OpenProjects />
      </InstaProvider>,
    );
    expect(await screen.findByText('Apollo')).toBeTruthy();
    expect(screen.queryByText('Gemini')).toBeNull();
    fireEvent.click(screen.getByRole('columnheader', { name: /Name/ }));
    expect(router.current()).toEqual({ pathname: '/somewhere', search: '' });
  });

  test('unstable_ResourceForm loads, edits and saves a record outside ResourceCrud', async () => {
    const { UnstableResourceForm: ResourceFormBlock } = await import('./unstable.tsx');
    const dataProvider = createMemoryProvider(seed());
    const onDone = vi.fn();
    render(
      <InstaProvider dataProvider={dataProvider} resources={[projects, teams]}>
        <ResourceFormBlock resource="projects" mode="edit" id={2} onDone={onDone} />
      </InstaProvider>,
    );
    fireEvent.change(await screen.findByDisplayValue('Gemini'), { target: { value: 'Gemini II' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(dataProvider.snapshot().projects![1]).toMatchObject({ name: 'Gemini II' });
  });
});
