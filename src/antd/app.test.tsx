/** An app from an API client and resource definitions: InstaApp, list fallbacks, related lists. */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { render } from '../../test/render.tsx';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineResource, normalizeResource } from '../core/resource.ts';
import { withListFallbacks } from '../core/lookup.ts';
import { createMemoryProvider } from '../core/memory-provider.ts';
import type { DataProvider, ListParams } from '../core/data-provider.ts';
import { InstaProvider, useApiClient } from '../react/context.tsx';
import { memoryAdapter } from '../react/router.ts';
import { InstaApp } from './InstaApp.tsx';
import { InstaAdmin } from './InstaAdmin.tsx';
import { RelationSelect } from './RelationSelect.tsx';
import { ResourceCrud } from './ResourceCrud.tsx';

afterEach(() => window.history.replaceState(null, '', '/'));

/** An axios-style client over an in-memory table of rows per path. */
function fakeClient(tables: Record<string, Record<string, unknown>[]>) {
  const calls: { method: string; url: string; params?: Record<string, unknown> }[] = [];
  const client = {
    calls,
    get: vi.fn(async (url: string, config?: { params?: Record<string, unknown> }) => {
      calls.push({ method: 'GET', url, params: config?.params });
      const [path, id] = url.split(/\/(?=[^/]+$)/);
      if (tables[url]) return { data: tables[url], total: tables[url].length };
      const row = tables[path!]?.find((r) => String(r.id) === id);
      if (row) return { data: row };
      throw { response: { status: 404, data: { message: 'Not found' } } };
    }),
    post: vi.fn(async () => ({})),
    patch: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  };
  return client;
}

describe('InstaApp', () => {
  test('an API client and resources are a whole app; custom pages reach the client', async () => {
    const client = fakeClient({ projects: [{ id: 1, name: 'Apollo' }] });
    function Report() {
      const api = useApiClient<typeof client>();
      return <p>Report via {api === client ? 'the app client' : 'another client'}</p>;
    }
    render(
      <InstaApp
        title="Ops"
        apiClient={client}
        resources={[
          defineResource({ name: 'projects', fields: [{ key: 'name', type: 'text' }] }),
          defineResource({
            name: 'report',
            kind: 'page',
            fields: [],
            components: { page: Report },
          }),
          defineResource({ name: 'secrets', menu: false, fields: [{ key: 'name', type: 'text' }] }),
        ]}
      />,
    );
    expect(await screen.findByText('Apollo')).toBeTruthy();
    expect(window.location.pathname).toBe('/projects');

    fireEvent.click(screen.getByRole('link', { name: 'Report' }));
    expect(await screen.findByText('Report via the app client')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Report' })).toBeTruthy();

    // Lookup-only resources are not screens: their URL goes to the first menu entry.
    window.history.pushState(null, '', '/secrets');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await waitFor(() => expect(window.location.pathname).toBe('/projects'));
  });
});

describe('list fallbacks', () => {
  const rows = Array.from({ length: 130 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
  const params = (api: Record<string, unknown>, over: Partial<ListParams> = {}): ListParams => ({
    resource: normalizeResource({ name: 'items', api, fields: [{ key: 'name', type: 'text' }] })
      .ref,
    ctx: {},
    pagination: { mode: 'offset', page: 1, pageSize: 5 },
    sort: [],
    filter: {},
    ...over,
  });
  const provider = () => {
    const base = createMemoryProvider({ items: rows });
    const spy = { getOne: vi.spyOn(base, 'getOne'), getList: vi.spyOn(base, 'getList') };
    return { provider: withListFallbacks(base), spy };
  };

  test("lookup: 'list' finds a record past the first page without GET-one", async () => {
    const { provider: p, spy } = provider();
    const { data } = await p.getOne({
      resource: params({ lookup: 'list' }).resource,
      ctx: {},
      id: 120,
    });
    expect(data).toMatchObject({ name: 'Item 120' });
    expect(spy.getOne).not.toHaveBeenCalled();
    expect(spy.getList).toHaveBeenCalledTimes(2);
  });

  test('lookup: { search } finds each distinct id with one search', async () => {
    const base: DataProvider = {
      ...createMemoryProvider({}),
      getList: vi.fn(async (q: ListParams) => ({
        data: [{ id: q.search, name: `#${String(q.search)}` }],
      })),
    } as DataProvider;
    const p = withListFallbacks(base);
    const { data } = await p.getMany!({
      resource: params({ lookup: { search: 'id' } }).resource,
      ctx: {},
      ids: ['7', '7', '9'],
    });
    expect(data.map((r) => (r as { name: string }).name)).toEqual(['#7', '#9']);
    expect(base.getList).toHaveBeenCalledTimes(2);
    expect((base.getList as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toMatchObject({
      search: '7',
      meta: { searchFields: ['id'] },
    });
  });

  test("search: 'client' searches every page and honours the page asked for", async () => {
    const { provider: p, spy } = provider();
    const page2 = await p.getList(
      params(
        { search: 'client' },
        { search: 'Item 1', pagination: { mode: 'offset', page: 2, pageSize: 5 } },
      ),
    );
    // 130 rows over two pages: 1, 10..19, 100..130 match. Page 2 of 5 is 14..18.
    expect(page2.total).toBe(42);
    expect(page2.data.map((r) => (r as { id: number }).id)).toEqual([14, 15, 16, 17, 18]);
    expect(spy.getList).toHaveBeenCalledTimes(2);
    // A match that only exists on the second page of the API's list is found.
    const late = await p.getList(params({ search: 'client' }, { search: 'Item 129' }));
    expect(late.data.map((r) => (r as { id: number }).id)).toEqual([129]);
  });
});

describe('related lists and nested rows', () => {
  test('openResource shows another resource, scoped by ctx, in a modal', async () => {
    const client = fakeClient({
      orders: [{ id: 1, number: 'A-1' }],
      'orders/1/events': [{ id: 10, what: 'Shipped' }],
    });
    render(
      <InstaApp
        apiClient={client}
        resources={[
          defineResource({
            name: 'orders',
            fields: [{ key: 'number', type: 'text' }],
            actions: [
              {
                id: 'events',
                label: 'Events',
                placement: ['row'],
                onSuccess: 'none',
                run: ({ record, openResource }) =>
                  openResource('events', { ctx: { orderId: record?.id }, title: 'Order events' }),
              },
            ],
          }),
          defineResource({
            name: 'events',
            menu: false,
            api: { path: 'orders/{ctx.orderId}/events' },
            fields: [{ key: 'what', type: 'text' }],
            actions: [],
          }),
        ]}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Events' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Order events')).toBeTruthy();
    expect(await within(dialog).findByText('Shipped')).toBeTruthy();
  });

  test("display 'table' renders nested rows with another resource's columns", async () => {
    const invoices = defineResource({
      name: 'invoices',
      fields: [
        { key: 'number', type: 'text' },
        {
          key: 'lines',
          type: 'json',
          list: false,
          display: 'table',
          props: { resource: 'invoiceLines' },
        },
      ],
    });
    const invoiceLines = defineResource({
      name: 'invoiceLines',
      menu: false,
      fields: [
        { key: 'item', type: 'text' },
        { key: 'amount', type: 'number' },
      ],
    });
    render(
      <InstaProvider
        dataProvider={createMemoryProvider({
          invoices: [{ id: 1, number: 'INV-1', lines: [{ id: 'a', item: 'Widget', amount: 3 }] }],
        })}
        resources={[invoices, invoiceLines]}
        router={memoryAdapter('/invoices/1')}
      >
        <ResourceCrud resource="invoices" />
      </InstaProvider>,
    );
    expect(await screen.findByText('Widget')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeTruthy();
  });

  test('RelationSelect ctx fills the target path', async () => {
    const client = fakeClient({ 'teams/7/members': [{ id: 1, name: 'Ann' }] });
    const members = defineResource({
      name: 'members',
      api: { path: 'teams/{ctx.teamId}/members' },
      recordLabel: '{name}',
      fields: [{ key: 'name', type: 'text' }],
    });
    function Picker() {
      return <RelationSelect resource="members" ctx={{ teamId: 7 }} placeholder="Member" />;
    }
    render(
      <InstaApp
        apiClient={client}
        resources={[
          defineResource({ name: 'pick', kind: 'page', fields: [], components: { page: Picker } }),
          { ...members, menu: false },
        ]}
      />,
    );
    fireEvent.mouseDown(await screen.findByRole('combobox'));
    expect(await screen.findByText('Ann')).toBeTruthy();
    expect(client.calls.some((c) => c.url === 'teams/7/members')).toBe(true);
  });
});

describe('InstaAdmin', () => {
  test('page resources get their heading; title={false} on a page hides it', async () => {
    render(
      <InstaProvider
        dataProvider={createMemoryProvider({})}
        resources={[
          defineResource({
            name: 'stats',
            label: 'Statistics',
            kind: 'page',
            fields: [],
            components: { page: () => <p>Numbers</p> },
          }),
        ]}
        router={memoryAdapter('/stats')}
      >
        <InstaAdmin />
      </InstaProvider>,
    );
    expect(await screen.findByText('Numbers')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Statistics' })).toBeTruthy();
  });
});

describe('config validation knows every built-in renderer', () => {
  test('each built-in display and widget validates without errors', async () => {
    const { builtinDisplays } = await import('./fields/displays.tsx');
    const { builtinWidgets } = await import('./fields/widgets.tsx');
    const { validateConfig } = await import('../core/validate-config.ts');
    const resource = defineResource({
      name: 'everything',
      fields: [
        ...Object.keys(builtinDisplays).map((display) => ({
          key: `d_${display}`,
          type: 'text',
          display,
        })),
        ...Object.keys(builtinWidgets).map((widget) => ({
          key: `w_${widget}`,
          type: 'text',
          widget,
        })),
      ],
    });
    expect(validateConfig([resource]).filter((i) => i.level === 'error')).toEqual([]);
  });
});

describe('browser routing', () => {
  test('a URL changed outside instaui before mount is the one used', async () => {
    const client = fakeClient({ a: [{ id: 1, name: 'In A' }], b: [{ id: 2, name: 'In B' }] });
    const resources = ['a', 'b'].map((name) =>
      defineResource({ name, fields: [{ key: 'name', type: 'text' }] }),
    );
    const first = render(<InstaApp apiClient={client} resources={resources} />);
    expect(await screen.findByText('In A')).toBeTruthy();
    first.unmount();
    // e.g. an app stripping a login token from the URL with history.replaceState.
    window.history.replaceState(null, '', '/b');
    render(<InstaApp apiClient={client} resources={resources} />);
    expect(await screen.findByText('In B')).toBeTruthy();
  });
});
