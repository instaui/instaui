/** Bulk actions, action forms and embedded views: screens that used to need custom components. */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { HttpError } from '../core/http-error.ts';
import { createMemoryProvider } from '../core/memory-provider.ts';
import { defineResource, type ActionContext, type ResourceDefinition } from '../core/resource.ts';
import { createRestProvider } from '../core/rest-provider.ts';
import { InstaProvider } from '../react/context.tsx';
import { memoryAdapter } from '../react/router.ts';
import { ResourceCrud } from './ResourceCrud.tsx';

// jsdom never ends antd's leave transition, so a closed modal stays in the DOM, leaving.
const isClosed = () => {
  const dialog = screen.queryByRole('dialog');
  return !dialog || /-leave/.test(dialog.className);
};

const seed = () => ({
  numbers: [
    { id: 1, number: '100', state: 'AVAILABLE' },
    { id: 2, number: '200', state: 'AVAILABLE' },
    { id: 3, number: '300', state: 'ACTIVE' },
  ],
});

function setup(resource: ResourceDefinition, path = '/numbers') {
  const router = memoryAdapter(path);
  render(
    <InstaProvider
      dataProvider={createMemoryProvider(seed())}
      resources={[resource]}
      router={router}
    >
      <ResourceCrud resource={resource.name} />
    </InstaProvider>,
  );
  return router;
}

const rowOf = (text: string) => screen.getByText(text).closest('tr')!;
const checkboxIn = (row: HTMLElement) => within(row).getByRole('checkbox') as HTMLInputElement;

describe('bulk actions', () => {
  test('select rows, run with the selection; only selectable rows can be ticked', async () => {
    const run = vi.fn();
    setup(
      defineResource({
        name: 'numbers',
        fields: [
          { key: 'number', type: 'text' },
          { key: 'state', type: 'text' },
        ],
        list: { selectable: { state: 'AVAILABLE' } },
        actions: [{ id: 'park', label: 'Park', placement: ['bulk'], run }],
      }),
    );
    await screen.findByText('100');
    expect(screen.getByText('Select rows for bulk actions')).toBeTruthy();
    const park = screen.getByRole('button', { name: 'Park' }) as HTMLButtonElement;
    expect(park.disabled).toBe(true);
    expect(checkboxIn(rowOf('300')).disabled).toBe(true);

    fireEvent.click(checkboxIn(rowOf('100')));
    fireEvent.click(checkboxIn(rowOf('200')));
    expect(screen.getByText('2 selected')).toBeTruthy();
    fireEvent.click(park);

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    const context = run.mock.calls[0]![0] as ActionContext;
    expect(context.selection?.map((r) => r.number)).toEqual(['100', '200']);
    await waitFor(() => expect(screen.getByText('Select rows for bulk actions')).toBeTruthy());
  });

  test('ticking a checkbox does not open the row', async () => {
    const router = setup(
      defineResource({
        name: 'numbers',
        fields: [{ key: 'number', type: 'text' }],
        actions: ['detail', { id: 'park', label: 'Park', placement: ['bulk'], run: () => {} }],
      }),
    );
    await screen.findByText('100');
    fireEvent.click(checkboxIn(rowOf('100')));
    expect(router.current().pathname).toBe('/numbers');
  });
});

describe('action forms', () => {
  const withForm = (run: (c: ActionContext) => unknown, placement: ('row' | 'bulk')[] = ['row']) =>
    defineResource({
      name: 'numbers',
      fields: [{ key: 'number', type: 'text' }],
      actions: [
        {
          id: 'park',
          label: 'Park',
          placement,
          form: {
            title: 'Park numbers',
            fields: [
              { key: 'reason', type: 'text', required: true },
              { key: 'from', type: 'date' },
            ],
            initialValues: () => ({ from: '2026-03-01' }),
          },
          run,
        },
      ],
    });

  test('collects required inputs and passes encoded values to run', async () => {
    const run = vi.fn();
    setup(withForm(run));
    await screen.findByText('100');
    fireEvent.click(within(rowOf('100')).getByRole('button', { name: 'Park' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Park numbers')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Park' }));
    expect(await within(dialog).findByText('Reason is required')).toBeTruthy();
    expect(run).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'Spare' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Park' }));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    const context = run.mock.calls[0]![0] as ActionContext;
    expect(context.values).toEqual({ reason: 'Spare', from: '2026-03-01' });
    expect(context.record?.number).toBe('100');
    await waitFor(() => expect(isClosed()).toBe(true));
  });

  test('server field errors land on the inputs and keep the form open', async () => {
    const run = vi
      .fn()
      .mockRejectedValue(
        new HttpError({ status: 400, message: 'Invalid', fieldErrors: { reason: 'Too vague' } }),
      );
    setup(withForm(run));
    await screen.findByText('100');
    fireEvent.click(within(rowOf('100')).getByRole('button', { name: 'Park' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'x' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Park' }));
    expect(await within(dialog).findByText('Too vague')).toBeTruthy();
    expect(isClosed()).toBe(false);
  });

  test('a bulk action with a form gets both the selection and the values', async () => {
    const run = vi.fn();
    setup(withForm(run, ['bulk']));
    await screen.findByText('100');
    fireEvent.click(checkboxIn(rowOf('200')));
    fireEvent.click(screen.getByRole('button', { name: 'Park' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: 'Spare' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Park' }));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    const context = run.mock.calls[0]![0] as ActionContext;
    expect(context.selection?.map((r) => r.number)).toEqual(['200']);
    expect(context.values?.reason).toBe('Spare');
  });
});

describe('embedded views', () => {
  test('ctx fills the path, the scope filter is applied, the URL is untouched, defaults prefill create', async () => {
    const requests: { method: string; url: string; query?: Record<string, unknown> }[] = [];
    const dataProvider = createRestProvider({
      request: async (req) => {
        requests.push({ method: req.method, url: req.url, query: req.query });
        if (req.method === 'GET' && req.url === 'teams/7/members')
          return { data: [{ id: 1, name: 'Ann', teamId: 7, active: true }], total: 1 };
        if (req.method === 'GET') return { data: { id: 1, name: 'Ann', teamId: 7, active: true } };
        return { data: {} };
      },
    });
    const members = defineResource({
      name: 'members',
      api: { path: 'teams/{ctx.teamId}/members' },
      fields: [
        { key: 'name', type: 'text' },
        { key: 'role', type: 'text' },
      ],
    });
    const router = memoryAdapter('/teams/7');
    render(
      <InstaProvider dataProvider={dataProvider} resources={[members]} router={router}>
        <ResourceCrud
          resource="members"
          embedded
          ctx={{ teamId: 7 }}
          filter={{ active: true }}
          defaults={{ role: 'viewer' }}
          title={false}
        />
      </InstaProvider>,
    );
    expect(await screen.findByText('Ann')).toBeTruthy();
    expect(requests[0]).toMatchObject({ url: 'teams/7/members', query: { active: true } });
    expect(screen.queryByRole('heading', { name: 'Members' })).toBeNull();

    fireEvent.click(screen.getByText('Ann'));
    await waitFor(() => expect(requests.some((r) => r.url === 'teams/7/members/1')).toBe(true));
    expect(router.current().pathname).toBe('/teams/7');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(((await screen.findByLabelText('Role')) as HTMLInputElement).value).toBe('viewer');
    expect(router.current().pathname).toBe('/teams/7');
  });
});

describe('confirmations', () => {
  test("a custom action's confirm uses its own button text", async () => {
    const run = vi.fn();
    setup(
      defineResource({
        name: 'numbers',
        fields: [{ key: 'number', type: 'text' }],
        actions: [
          {
            id: 'release',
            label: 'Release',
            placement: ['row'],
            confirm: { title: 'Release this number?', okText: 'Yes, release' },
            run,
          },
        ],
      }),
    );
    await screen.findByText('100');
    fireEvent.click(within(rowOf('100')).getByRole('button', { name: 'Release' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Yes, release' }));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
  });

  test('form.confirm asks before saving; cancelling does not save', async () => {
    const dataProvider = createMemoryProvider(seed());
    const update = vi.spyOn(dataProvider, 'update');
    const numbers = defineResource({
      name: 'numbers',
      fields: [
        { key: 'number', type: 'text' },
        { key: 'state', type: 'text' },
      ],
      form: {
        confirm: (values, { record }) =>
          values.state !== record?.state
            ? { title: `Change state to ${String(values.state)}?`, okText: 'Change', danger: true }
            : undefined,
      },
    });
    render(
      <InstaProvider
        dataProvider={dataProvider}
        resources={[numbers]}
        router={memoryAdapter('/numbers/1/edit')}
      >
        <ResourceCrud resource="numbers" />
      </InstaProvider>,
    );
    fireEvent.change(await screen.findByDisplayValue('AVAILABLE'), { target: { value: 'PARKED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const confirmBox = (await screen.findAllByText('Change state to PARKED?'))
      .at(-1)!
      .closest('.ant-modal') as HTMLElement;
    fireEvent.click(within(confirmBox).getByRole('button', { name: 'Cancel' }));
    await new Promise((r) => setTimeout(r, 50));
    expect(update).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    // The cancelled confirm may still be leaving; act on the one that is open.
    const open = await waitFor(() => {
      const boxes = [...document.querySelectorAll<HTMLElement>('.ant-modal-confirm')].filter(
        (b) => !/-leave/.test(b.className) && b.textContent?.includes('Change state to PARKED?'),
      );
      expect(boxes).toHaveLength(1);
      return boxes[0]!;
    });
    fireEvent.click(within(open).getByRole('button', { name: 'Change' }));
    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]![0].data).toEqual({ state: 'PARKED' });
  });
});
