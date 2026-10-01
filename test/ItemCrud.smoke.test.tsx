import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { ItemCrud } from '../src/index.ts';
import type { ApiClient, EndpointConfig } from '../src/index.ts';

// Proves the toolchain (React 19 + antd + router + jsdom) renders the current component.
// The pre-1.0 component is replaced in R1; this test is replaced with it.
test('renders a list from the api client', async () => {
  const endpoint: EndpointConfig = {
    key: 'users',
    label: 'Users',
    url: '/users',
    idField: 'id',
    fields: [{ key: 'name', label: 'Name', type: 'text', showInList: true }],
    validator: () => ({}),
  };
  const apiClient: ApiClient = {
    get: vi.fn().mockResolvedValue({ data: [{ id: '1', name: 'Ada Lovelace' }], count: 1 }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  const element = <ItemCrud apiClient={apiClient} config={{ endpoints: [endpoint] }} />;

  render(
    <MemoryRouter initialEntries={['/users?page=1&pageSize=10']}>
      <Routes>
        <Route path="/:entity" element={element} />
        <Route path="/:entity/:operation/:id" element={element} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
  expect(apiClient.get).toHaveBeenCalledWith('/users', expect.anything());
});
