/** Features for apps migrating from config-driven CRUD forks: tabs, filter bar, ranges, row slots, access functions. */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { paramUrlCodec, defaultUrlCodec } from '../core/list-state.ts';
import { createMemoryProvider } from '../core/memory-provider.ts';
import { conditionMet, defineResource, normalizeResource } from '../core/resource.ts';
import { defaultEncodeList } from '../core/rest-provider.ts';
import { InstaProvider } from '../react/context.tsx';
import { memoryAdapter } from '../react/router.ts';
import type { ViewProps } from './ResourceCrud.tsx';
import { InstaAdmin } from './InstaAdmin.tsx';
import { ResourceCrud } from './ResourceCrud.tsx';

afterEach(() => localStorage.clear());

const orders = defineResource({
  name: 'orders',
  fields: [
    { key: 'number', type: 'text', list: { sortable: true } },
    {
      key: 'kind',
      type: 'enum',
      props: {
        options: [
          { value: 'STANDARD', label: 'Standard' },
          { value: 'RUSH', label: 'Rush' },
        ],
      },
    },
    {
      key: 'status',
      type: 'enum',
      filter: { multiple: false },
      props: {
        options: [
          { value: 'OPEN', label: 'Open' },
          { value: 'ARCHIVED', label: 'Archived' },
        ],
      },
    },
    { key: 'total', type: 'number', filter: { paramRange: ['totalFrom', 'totalTo'] } },
    { key: 'code', type: 'text', readOnlyIf: (_values, _ctx, record) => record?.kind === 'RUSH' },
  ],
  list: {
    tabs: [
      { key: 'active', label: 'Active', filter: { status: { $ne: 'ARCHIVED' } } },
      { key: 'archived', label: 'Archived', filter: { status: 'ARCHIVED' } },
    ],
    filterBar: { savedViews: true },
  },
  access: { edit: (record) => record?.status !== 'ARCHIVED' },
  components: {
    rowActions: ({ record }: ViewProps) => (
      <button type="button">Track {String(record?.number)}</button>
    ),
  },
});

const seed = () => ({
  orders: [
    { id: 1, number: 'A-1', kind: 'STANDARD', status: 'OPEN', total: 10, code: 'x' },
    { id: 2, number: 'A-2', kind: 'RUSH', status: 'OPEN', total: 50, code: 'y' },
    { id: 3, number: 'A-3', kind: 'STANDARD', status: 'ARCHIVED', total: 99, code: 'z' },
  ],
});

function setup(path = '/orders') {
  const router = memoryAdapter(path);
  const dataProvider = createMemoryProvider(seed());
  render(
    <InstaProvider dataProvider={dataProvider} resources={[orders]} router={router}>
      <ResourceCrud resource="orders" />
    </InstaProvider>,
  );
  return { router, dataProvider };
}

describe('core', () => {
  test('conditions see the record being edited', () => {
    const fn = vi.fn(
      (_v: unknown, _c: unknown, record?: Record<string, unknown>) => record?.kind === 'RUSH',
    );
    expect(conditionMet(fn, {}, {}, { kind: 'RUSH' })).toBe(true);
    expect(
      conditionMet({ kind: { $var: 'record.kind' } }, { kind: 'RUSH' }, {}, { kind: 'RUSH' }),
    ).toBe(true);
  });

  test('two-param ranges on the wire and in mirrored URLs', () => {
    const resource = normalizeResource(orders);
    const encode = (filter: Record<string, unknown>) =>
      defaultEncodeList({
        resource: resource.ref,
        ctx: {},
        pagination: { mode: 'off' },
        sort: [],
        filter: filter as never,
      });
    expect(encode({ total: { $gte: 5, $lte: 60 } })).toEqual({ totalFrom: 5, totalTo: 60 });
    expect(encode({ total: { $between: [1, 2] } })).toEqual({ totalFrom: 1, totalTo: 2 });

    const defaults = {
      pageSize: 10,
      fieldTypes: { total: 'number' },
      fieldParamRanges: { total: ['totalFrom', 'totalTo'] as const },
    };
    const codec = paramUrlCodec();
    const state = { page: 1, pageSize: 10, sort: [], filter: { total: { $gte: 5, $lte: 60 } } };
    const url = codec.stringify(state, defaults);
    expect(url).toBe('?totalFrom=5&totalTo=60');
    expect(codec.parse(url, defaults)).toEqual(state);
  });

  test('tabs round-trip in URLs; the default tab is omitted', () => {
    const defaults = { pageSize: 10, defaultTab: 'active' };
    expect(
      defaultUrlCodec.stringify(
        { page: 1, pageSize: 10, sort: [], filter: {}, tab: 'active' },
        defaults,
      ),
    ).toBe('');
    const url = defaultUrlCodec.stringify(
      { page: 1, pageSize: 10, sort: [], filter: {}, tab: 'archived' },
      defaults,
    );
    expect(url).toBe('?tab=archived');
    expect(defaultUrlCodec.parse(url, defaults).tab).toBe('archived');
  });
});

describe('list tabs', () => {
  test('the first tab is the default; switching tabs filters the list and writes ?tab=', async () => {
    const { router } = setup();
    expect(await screen.findByText('A-1')).toBeTruthy();
    expect(screen.queryByText('A-3')).toBeNull();
    fireEvent.click(screen.getByText('Archived', { selector: '.ant-segmented-item-label' }));
    expect(await screen.findByText('A-3')).toBeTruthy();
    expect(screen.queryByText('A-1')).toBeNull();
    expect(router.current().search).toBe('?tab=archived');
  });
});

describe('filter bar', () => {
  test('shows active filters with labels, clears them, and saves/applies views', async () => {
    const { router } = setup('/orders?f.status=OPEN&f.total.gte=20');
    expect(await screen.findByText('A-2')).toBeTruthy();
    expect(screen.getByText('Status:').parentElement?.textContent).toBe('Status: Open');
    expect(screen.getByText('Total:').parentElement?.textContent).toBe('Total: ≥ 20');

    fireEvent.click(screen.getByRole('button', { name: /Save view/ }));
    fireEvent.change(await screen.findByLabelText('View name'), { target: { value: 'Big open' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));
    expect(JSON.parse(localStorage.getItem('instaui.savedViews.orders') ?? '[]')).toEqual([
      { name: 'Big open', filter: { status: { $eq: 'OPEN' }, total: { $gte: 20 } } },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    await waitFor(() => expect(router.current().search).toBe(''));
    expect(screen.getByText('No filters applied')).toBeTruthy();
  });
});

describe('rows and access', () => {
  test('rowActions renders custom content per row; edit access is a function of the record', async () => {
    setup('/orders?tab=archived');
    expect(await screen.findByRole('button', { name: 'Track A-3' })).toBeTruthy();
    const archivedRow = screen.getByText('A-3').closest('tr')!;
    expect(within(archivedRow).queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  test('readOnlyIf can depend on the record being edited', async () => {
    const { router } = setup();
    await screen.findByText('A-2');
    router.navigate('/orders/2/edit');
    expect(((await screen.findByDisplayValue('y')) as HTMLInputElement).disabled).toBe(true);
    router.navigate('/orders/1/edit');
    expect(((await screen.findByDisplayValue('x')) as HTMLInputElement).disabled).toBe(false);
  });

  test('InstaAdmin applies a custom route scheme (view/{id})', async () => {
    const router = memoryAdapter('/orders');
    render(
      <InstaProvider
        dataProvider={createMemoryProvider(seed())}
        resources={[orders]}
        router={router}
      >
        <InstaAdmin paths={{ detail: 'view/{id}', edit: 'edit/{id}', create: false }} />
      </InstaProvider>,
    );
    fireEvent.click(await screen.findByText('A-1'));
    await waitFor(() => expect(router.current().pathname).toBe('/orders/view/1'));
  });
});

describe('display context', () => {
  test('a display knows whether it renders a list cell or the detail view', async () => {
    const notes = defineResource({
      name: 'notes',
      fields: [
        {
          key: 'title',
          type: 'text',
          display: ({ value, context }: { value: unknown; context?: string }) => (
            <span>{`${context}:${String(value)}`}</span>
          ),
        },
      ],
    });
    render(
      <InstaProvider
        dataProvider={createMemoryProvider({ notes: [{ id: 1, title: 'Hi' }] })}
        resources={[notes]}
        router={memoryAdapter('/notes/1')}
      >
        <ResourceCrud resource="notes" />
      </InstaProvider>,
    );
    expect(await screen.findByText('list:Hi')).toBeTruthy();
    expect(await screen.findByText('detail:Hi')).toBeTruthy();
  });
});
