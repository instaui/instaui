import { http, HttpResponse } from 'msw';
import { describe, expect, test, vi } from 'vitest';
import { server } from '../../test/msw/server.ts';
import type { ListParams, ResourceRef } from './data-provider.ts';
import { HttpError } from './http-error.ts';
import { createMemoryProvider } from './memory-provider.ts';
import { fromApiClient } from './api-client.ts';
import { createRestProvider, defaultDecodeList, defaultEncodeList } from './rest-provider.ts';
import { safeUrl } from './safe-url.ts';
import { renderTemplate, TemplateError } from './template.ts';

const users: ResourceRef = { name: 'users', idField: 'id', api: {} };
const listParams = (over: Partial<ListParams> = {}): ListParams => ({
  resource: users,
  ctx: {},
  pagination: { mode: 'offset', page: 1, pageSize: 10 },
  sort: [],
  filter: {},
  ...over,
});

describe('renderTemplate', () => {
  test('substitutes dot paths, encoding when asked', () => {
    const lookup = (p: string) => ({ id: 'a/b', 'ctx.orgId': 'o 1' })[p];
    expect(renderTemplate('{id}/approve', lookup, { encode: true })).toBe('a%2Fb/approve');
    expect(renderTemplate('orgs/{ctx.orgId}', lookup, { encode: true })).toBe('orgs/o%201');
  });
  test('missing values throw for URLs and render empty for labels', () => {
    expect(() => renderTemplate('{missing}', () => undefined)).toThrow(TemplateError);
    expect(
      renderTemplate('{name} ({code})', (p) => (p === 'name' ? 'Acme' : undefined), {
        onMissing: 'empty',
      }),
    ).toBe('Acme ()');
  });
});

describe('safeUrl', () => {
  test.each([
    ['https://example.com/a.pdf', 'https://example.com/a.pdf'],
    ['/files/a.pdf', '/files/a.pdf'],
    ['mailto:a@example.com', 'mailto:a@example.com'],
    ['javascript:alert(1)', undefined],
    ['JaVaScRiPt:alert(1)', undefined],
    ['java\tscript:alert(1)', undefined],
    ['data:text/html;base64,PHNjcmlwdD4=', undefined],
    [42, undefined],
  ])('%s', (input, expected) => expect(safeUrl(input)).toBe(expected));
});

describe('defaultEncodeList', () => {
  test('pagination, sort, filters and search', () => {
    const query = defaultEncodeList(
      listParams({
        pagination: { mode: 'offset', page: 2, pageSize: 20 },
        sort: [
          { field: 'name', order: 'asc' },
          { field: 'createdAt', order: 'desc' },
        ],
        filter: {
          status: 'ACTIVE',
          amount: { $gte: 10 },
          role: { $in: ['a', 'b'] },
          owner: { $var: 'ctx.me' },
        },
        search: 'acme',
        ctx: { me: 'u1' },
      }),
    );
    expect(query).toEqual({
      page: 2,
      pageSize: 20,
      sort: 'name,createdAt',
      order: 'asc,desc',
      status: 'ACTIVE',
      'amount[gte]': 10,
      'role[in]': 'a,b',
      owner: 'u1',
      q: 'acme',
    });
  });
});

describe('defaultDecodeList', () => {
  const rows = [{ id: 1 }];
  test.each([
    ['bare array', rows, { data: rows }],
    ['{data,total}', { data: rows, total: 5 }, { data: rows, total: 5 }],
    ['{items,count}', { items: rows, count: 3 }, { data: rows, total: 3 }],
    ['{results,count}', { results: rows, count: 3 }, { data: rows, total: 3 }],
    ['nested {data:{data,total}}', { data: { data: rows, total: 2 } }, { data: rows, total: 2 }],
  ])('%s', (_name, raw, expected) =>
    expect(defaultDecodeList(raw, listParams())).toEqual(expected),
  );

  test('listKey selects a keyed list, with the count beside it', () => {
    const params = listParams({ resource: { ...users, api: { listKey: 'users' } } });
    expect(defaultDecodeList({ status: 'ok', data: { users: rows, count: 9 } }, params)).toEqual({
      data: rows,
      total: 9,
    });
  });

  test('an unrecognised envelope throws instead of becoming one bogus row', () => {
    expect(() => defaultDecodeList({ data: { users: rows } }, listParams())).toThrow(/listKey/);
  });
});

describe('createRestProvider over fetch', () => {
  const api = createRestProvider({
    baseUrl: 'https://api.test/v1',
    headers: () => ({ Authorization: 'Bearer t' }),
  });

  test('list request uses the generic query convention and decodes the result', async () => {
    let seen: URL | undefined;
    let auth: string | null = null;
    server.use(
      http.get('https://api.test/v1/users', ({ request }) => {
        seen = new URL(request.url);
        auth = request.headers.get('authorization');
        return HttpResponse.json({ data: [{ id: 1, name: 'Ada' }], total: 1 });
      }),
    );
    const result = await api.getList(listParams({ filter: { status: 'ACTIVE' } }));
    expect(result).toEqual({ data: [{ id: 1, name: 'Ada' }], total: 1 });
    expect(seen?.searchParams.toString()).toBe('page=1&pageSize=10&status=ACTIVE');
    expect(auth).toBe('Bearer t');
  });

  test('ids are percent-encoded and updates PATCH JSON', async () => {
    let path = '';
    let body: unknown;
    server.use(
      http.patch('https://api.test/v1/users/*', async ({ request }) => {
        path = new URL(request.url).pathname;
        body = await request.json();
        return HttpResponse.json({ id: '../admin', name: 'B' });
      }),
    );
    const res = await api.update({
      resource: users,
      ctx: {},
      id: '../admin',
      data: { name: 'B', note: null },
    });
    expect(path).toBe('/v1/users/..%2Fadmin');
    expect(body).toEqual({ name: 'B', note: null });
    expect(res.data).toEqual({ id: '../admin', name: 'B' });
  });

  test('ctx placeholders in api.path are filled and encoded', async () => {
    server.use(http.get('https://api.test/v1/orgs/o%201/projects', () => HttpResponse.json([])));
    const projects: ResourceRef = {
      name: 'projects',
      idField: 'id',
      api: { path: 'orgs/{ctx.orgId}/projects' },
    };
    await expect(
      api.getList(listParams({ resource: projects, ctx: { orgId: 'o 1' } })),
    ).resolves.toEqual({ data: [] });
  });

  test('error responses become HttpError with field errors', async () => {
    server.use(
      http.post('https://api.test/v1/users', () =>
        HttpResponse.json({ message: 'Invalid', errors: { email: 'Taken' } }, { status: 422 }),
      ),
    );
    const error = await api.create({ resource: users, ctx: {}, data: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({
      status: 422,
      message: 'Invalid',
      fieldErrors: { email: 'Taken' },
    });
  });

  test('custom() refuses absolute URLs', async () => {
    await expect(api.custom({ method: 'GET', path: 'https://evil.test/x' })).rejects.toThrow(
      /absolute/,
    );
    await expect(api.custom({ method: 'GET', path: '//evil.test/x' })).rejects.toThrow(/absolute/);
  });
});

describe('fromApiClient', () => {
  test('accepts a client typed like axios (literal responseType, typed config)', () => {
    // axios declares `responseType` as a string union, so a wider `string` here would reject it.
    type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
    interface AxiosLikeConfig {
      params?: unknown;
      signal?: { aborted: boolean };
      responseType?: ResponseType;
    }
    const axiosLike: {
      get(url: string, config?: AxiosLikeConfig): Promise<unknown>;
      post(url: string, data?: unknown, config?: AxiosLikeConfig): Promise<unknown>;
      patch(url: string, data?: unknown, config?: AxiosLikeConfig): Promise<unknown>;
      delete(url: string, config?: AxiosLikeConfig): Promise<unknown>;
    } = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
    expect(fromApiClient(axiosLike)).toBeTruthy();
  });

  test('routes calls through an axios-style client and maps its errors', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ data: { users: [{ id: 1 }], count: 1 } }),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi
        .fn()
        .mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden' } } }),
    };
    const api = fromApiClient(client);
    const keyed: ResourceRef = { ...users, api: { listKey: 'users' } };
    await expect(api.getList(listParams({ resource: keyed }))).resolves.toEqual({
      data: [{ id: 1 }],
      total: 1,
    });
    expect(client.get).toHaveBeenCalledWith(
      'users',
      expect.objectContaining({ params: { page: 1, pageSize: 10 } }),
    );
    await expect(api.deleteOne({ resource: users, ctx: {}, id: 1 })).rejects.toMatchObject({
      name: 'HttpError',
      status: 403,
      message: 'Forbidden',
    });
  });

  test('plain Error messages from app interceptors pass through unchanged', async () => {
    const client = {
      get: vi.fn().mockRejectedValue(new Error('Session expired')),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };
    await expect(fromApiClient(client).getOne({ resource: users, ctx: {}, id: 1 })).rejects.toThrow(
      'Session expired',
    );
  });
});

describe('createMemoryProvider', () => {
  const seed = {
    users: [
      { id: 1, name: 'Ada', role: 'admin', age: 36 },
      { id: 2, name: 'Grace', role: 'user', age: 45 },
      { id: 3, name: 'Alan', role: 'user', age: 41 },
    ],
  };

  test('filters with Where, searches, sorts and paginates', async () => {
    const api = createMemoryProvider(seed);
    const res = await api.getList(
      listParams({
        filter: { role: 'user' },
        sort: [{ field: 'age', order: 'desc' }],
        pagination: { mode: 'offset', page: 1, pageSize: 1 },
      }),
    );
    expect(res).toEqual({ data: [seed.users[1]], total: 2 });
    expect((await api.getList(listParams({ search: 'ala' }))).data.map((u) => u.id)).toEqual([3]);
  });

  test('CRUD round trip without mutating the seed', async () => {
    const api = createMemoryProvider(seed);
    const created = await api.create({ resource: users, ctx: {}, data: { name: 'Linus' } });
    expect(created.data).toMatchObject({ id: 4, name: 'Linus' });
    await api.update({ resource: users, ctx: {}, id: 4, data: { role: 'user' } });
    await api.deleteOne({ resource: users, ctx: {}, id: 1 });
    expect((await api.getMany!({ resource: users, ctx: {}, ids: [4, 1] })).data).toEqual([
      { id: 4, name: 'Linus', role: 'user' },
    ]);
    expect(seed.users).toHaveLength(3);
    await expect(api.getOne({ resource: users, ctx: {}, id: 1 })).rejects.toMatchObject({
      status: 404,
    });
  });
});
