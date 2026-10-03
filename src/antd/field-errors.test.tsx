/** Server validation errors from an axios-style client land on the form fields. */
import { fireEvent, screen } from '@testing-library/react';
import { render } from '../../test/render.tsx';
import { expect, test, vi } from 'vitest';
import { defineResource } from '../core/resource.ts';
import { InstaApp } from './InstaApp.tsx';

test('a 400 with { errors: { field } } shows the message under that field', async () => {
  window.history.replaceState(null, '', '/customers/new');
  const apiClient = {
    get: vi.fn(async () => ({ data: [], total: 0 })),
    post: vi.fn(async () => {
      throw Object.assign(new Error('Request failed with status code 400'), {
        response: { status: 400, data: { message: 'Invalid', errors: { email: 'already taken' } } },
      });
    }),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  render(
    <InstaApp
      apiClient={apiClient}
      resources={[
        defineResource({
          name: 'customers',
          fields: [
            { key: 'name', type: 'text' },
            { key: 'email', type: 'text' },
          ],
        }),
      ]}
    />,
  );
  fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'a@b.c' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('already taken')).toBeTruthy();
});
