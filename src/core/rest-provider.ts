/**
 * `createRestProvider`: a DataProvider for REST backends, configured with small functions rather
 * than option matrices. Defaults follow a generic convention:
 *   GET    {path}?page=&pageSize=&sort=&order=&<field>=<v>&<field>[op]=<v>&q=   → list
 *   GET    {path}/{id}                                                        → one
 *   POST   {path}                                                             → create
 *   PATCH  {path}/{id}                                                        → update
 *   DELETE {path}/{id}                                                        → delete
 * Ids are always percent-encoded. Custom paths must be relative to `baseUrl`.
 */
import type {
  AnyRecord,
  CustomParams,
  DataProvider,
  HttpMethod,
  Id,
  InstaContext,
  ListParams,
  ListResult,
  QueryValue,
  ResourceRef,
} from './data-provider.ts';
import { HttpError, type FieldErrors } from './http-error.ts';
import { getPath } from './path.ts';
import { renderTemplate } from './template.ts';
import { toConditions } from './where.ts';

export interface RestRequest {
  method: HttpMethod;
  /** Path relative to `baseUrl` (already templated and encoded). */
  url: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  responseType?: 'json' | 'blob' | 'text';
}

export type RestOperation =
  'list' | 'one' | 'create' | 'update' | 'delete' | 'updateMany' | 'deleteMany';

export interface RestProviderOptions {
  baseUrl?: string;
  /** Performs a request and resolves to the parsed body. Default: `fetch`. Throw `HttpError` on failure. */
  request?: (req: RestRequest) => Promise<unknown>;
  /** Extra headers for the default `fetch` request (e.g. auth). */
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  urlFor?: (
    op: RestOperation,
    info: { resource: ResourceRef; ctx: InstaContext; id?: Id },
  ) => string;
  encodeList?: (params: ListParams) => Record<string, QueryValue>;
  decodeList?: (raw: unknown, params: ListParams) => ListResult<AnyRecord>;
  decodeOne?: (raw: unknown, resource: ResourceRef) => AnyRecord;
  encodeBody?: (
    data: AnyRecord,
    info: { op: 'create' | 'update' | 'updateMany'; resource: ResourceRef },
  ) => unknown;
  /** Maps a failed `fetch` response to an `HttpError`. */
  mapError?: (status: number, body: unknown, statusText: string) => HttpError;
  updateMethod?: 'PATCH' | 'PUT';
}

const isRecord = (v: unknown): v is AnyRecord =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

export function resourcePath(resource: ResourceRef, ctx: InstaContext): string {
  const template = resource.api.path ?? resource.name;
  return renderTemplate(
    template,
    (path) => (path.startsWith('ctx.') ? getPath(ctx, path.slice(4)) : undefined),
    {
      encode: true,
    },
  );
}

export function defaultUrlFor(
  op: RestOperation,
  { resource, ctx, id }: { resource: ResourceRef; ctx: InstaContext; id?: Id },
): string {
  const base = resourcePath(resource, ctx);
  return id === undefined || op === 'list' || op === 'create'
    ? base
    : `${base}/${encodeURIComponent(String(id))}`;
}

const joinValue = (v: unknown): QueryValue =>
  Array.isArray(v) ? v.map(String).join(',') : (v as QueryValue);

/** `?page=2&pageSize=20&sort=name,createdAt&order=asc,desc&status=A&amount[gte]=10&q=text` */
export function defaultEncodeList(params: ListParams): Record<string, QueryValue> {
  const query: Record<string, QueryValue> = {};
  if (params.pagination.mode === 'offset') {
    query.page = params.pagination.page;
    query.pageSize = params.pagination.pageSize;
  } else if (params.pagination.mode === 'cursor') {
    query.cursor = params.pagination.cursor;
    query.pageSize = params.pagination.pageSize;
  }
  if (params.sort.length > 0) {
    query.sort = params.sort.map((s) => s.field).join(',');
    query.order = params.sort.map((s) => s.order).join(',');
  }
  for (const { field, op, value } of toConditions(params.filter, { ctx: params.ctx })) {
    const range = params.resource.paramRanges?.[field];
    if (range && (op === '$gte' || op === '$lte' || op === '$between')) {
      const [lo, hi] =
        op === '$between'
          ? (value as [unknown, unknown])
          : op === '$gte'
            ? [value, undefined]
            : [undefined, value];
      if (lo !== undefined) query[range[0]] = lo as QueryValue;
      if (hi !== undefined) query[range[1]] = hi as QueryValue;
      continue;
    }
    const name = params.resource.params?.[field] ?? field;
    query[op === '$eq' ? name : `${name}[${op.slice(1)}]`] = joinValue(value);
  }
  if (params.search) query.q = params.search;
  return query;
}

/**
 * Accepts `T[]`, `{ data: T[] }`, `{ items: T[] }`, `{ results: T[] }`, with `total` or `count`
 * next to the list; `resource.api.listKey` selects a keyed list (`{ data: { users: [...] } }`).
 * Anything else throws instead of rendering the whole envelope as one row.
 */
export function defaultDecodeList(raw: unknown, params: ListParams): ListResult<AnyRecord> {
  const listKey = params.resource.api.listKey;
  const candidates: unknown[] = [raw];
  if (isRecord(raw) && isRecord(raw.data)) candidates.push(raw.data);
  for (const node of candidates) {
    if (Array.isArray(node)) return { data: node as AnyRecord[] };
    if (!isRecord(node)) continue;
    const list = listKey
      ? node[listKey]
      : [node.data, node.items, node.results].find((v) => Array.isArray(v));
    if (Array.isArray(list)) {
      const total = [
        node.total,
        node.count,
        isRecord(raw) ? raw.total : undefined,
        isRecord(raw) ? raw.count : undefined,
      ].find((v) => typeof v === 'number');
      return { data: list as AnyRecord[], total: total as number | undefined };
    }
  }
  throw new Error(
    `Unrecognised list response for "${params.resource.name}". Set resource.api.listKey or provide decodeList.`,
  );
}

export function defaultDecodeOne(raw: unknown): AnyRecord {
  if (isRecord(raw) && isRecord(raw.data)) return raw.data;
  if (isRecord(raw)) return raw;
  throw new Error('Unrecognised record response; provide decodeOne.');
}

const hasBinary = (data: AnyRecord) =>
  Object.values(data).some((v) => typeof Blob !== 'undefined' && v instanceof Blob);

/** JSON by default; multipart only when a top-level value is a File/Blob. `undefined` is omitted. */
export function defaultEncodeBody(data: AnyRecord): unknown {
  if (!hasBinary(data)) return data;
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value instanceof Blob) form.append(key, value);
    else if (value === null) form.append(key, '');
    else if (typeof value === 'object') form.append(key, JSON.stringify(value));
    else form.append(key, String(value));
  }
  return form;
}

export function defaultMapError(status: number, body: unknown, statusText: string): HttpError {
  const message =
    (isRecord(body) && typeof body.message === 'string' && body.message) ||
    (typeof body === 'string' && body) ||
    statusText ||
    `Request failed with status ${status}`;
  const errors = isRecord(body) && isRecord(body.errors) ? (body.errors as FieldErrors) : undefined;
  return new HttpError({ status, message, fieldErrors: errors, body });
}

function buildQuery(query: Record<string, QueryValue> | undefined): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
    else search.append(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

const ABSOLUTE = /^([a-z][a-z\d+.-]*:|\/\/)/i;

function assertRelative(path: string) {
  if (ABSOLUTE.test(path))
    throw new Error(`Refusing absolute URL "${path}": paths must be relative to baseUrl`);
}

function createFetchRequest(options: RestProviderOptions) {
  const mapError = options.mapError ?? defaultMapError;
  return async (req: RestRequest): Promise<unknown> => {
    const base = (options.baseUrl ?? '').replace(/\/+$/, '');
    const url = `${base}/${req.url.replace(/^\/+/, '')}${buildQuery(req.query)}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(await options.headers?.()),
    };
    let body: BodyInit | undefined;
    if (req.body instanceof FormData || req.body instanceof Blob) body = req.body;
    else if (req.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(req.body);
    }
    const res = await fetch(url, { method: req.method, headers, body, signal: req.signal });
    const type = res.headers.get('content-type') ?? '';
    const parsed =
      req.responseType === 'blob'
        ? await res.blob()
        : req.responseType === 'text' || !type.includes('json')
          ? await res.text()
          : await res.json();
    if (!res.ok) throw mapError(res.status, parsed, res.statusText);
    return parsed;
  };
}

export function createRestProvider(options: RestProviderOptions = {}): DataProvider {
  const request = options.request ?? createFetchRequest(options);
  const urlFor = options.urlFor ?? defaultUrlFor;
  const encodeList = options.encodeList ?? defaultEncodeList;
  const decodeList = options.decodeList ?? defaultDecodeList;
  const decodeOne = options.decodeOne ?? ((raw: unknown) => defaultDecodeOne(raw));
  const encodeBody = options.encodeBody ?? ((data: AnyRecord) => defaultEncodeBody(data));
  const updateMethod = options.updateMethod ?? 'PATCH';

  const provider: DataProvider = {
    async getList<T>(params: ListParams) {
      const raw = await request({
        method: 'GET',
        url: urlFor('list', params),
        query: encodeList(params),
        signal: params.signal,
      });
      return decodeList(raw, params) as ListResult<T>;
    },
    async getOne<T>(params: {
      resource: ResourceRef;
      ctx: InstaContext;
      id: Id;
      signal?: AbortSignal;
    }) {
      const raw = await request({
        method: 'GET',
        url: urlFor('one', params),
        signal: params.signal,
      });
      return { data: decodeOne(raw, params.resource) as T };
    },
    async create<T>(params: {
      resource: ResourceRef;
      ctx: InstaContext;
      data: AnyRecord;
      signal?: AbortSignal;
    }) {
      const raw = await request({
        method: 'POST',
        url: urlFor('create', params),
        body: encodeBody(params.data, { op: 'create', resource: params.resource }),
        signal: params.signal,
      });
      return {
        data: (isRecord(raw) ? decodeOne(raw, params.resource) : undefined) as T | undefined,
      };
    },
    async update<T>(params: {
      resource: ResourceRef;
      ctx: InstaContext;
      id: Id;
      data: AnyRecord;
      signal?: AbortSignal;
    }) {
      const raw = await request({
        method: updateMethod,
        url: urlFor('update', params),
        body: encodeBody(params.data, { op: 'update', resource: params.resource }),
        signal: params.signal,
      });
      return {
        data: (isRecord(raw) ? decodeOne(raw, params.resource) : undefined) as T | undefined,
      };
    },
    async deleteOne(params: {
      resource: ResourceRef;
      ctx: InstaContext;
      id: Id;
      signal?: AbortSignal;
    }) {
      await request({ method: 'DELETE', url: urlFor('delete', params), signal: params.signal });
    },
    async custom<R>(params: CustomParams) {
      assertRelative(params.path);
      return (await request({
        method: params.method,
        url: params.path,
        query: params.query,
        body: params.body,
        signal: params.signal,
        responseType: params.responseType,
      })) as R;
    },
  };
  return provider;
}

/** The client shape apps already have: axios-like methods returning the parsed body. */
export interface ApiClientLike {
  get(
    url: string,
    config?: { params?: unknown; signal?: AbortSignal; responseType?: string },
  ): Promise<unknown>;
  post(
    url: string,
    data?: unknown,
    config?: { signal?: AbortSignal; responseType?: string },
  ): Promise<unknown>;
  patch(url: string, data?: unknown, config?: { signal?: AbortSignal }): Promise<unknown>;
  put?(url: string, data?: unknown, config?: { signal?: AbortSignal }): Promise<unknown>;
  delete(url: string, config?: { signal?: AbortSignal }): Promise<unknown>;
}

function toHttpError(error: unknown): unknown {
  if (error instanceof HttpError || !isRecord(error)) return error;
  const response = error.response;
  if (isRecord(response) && typeof response.status === 'number') {
    return defaultMapError(response.status, response.data, String(response.statusText ?? ''));
  }
  return error; // e.g. an app interceptor's Error(message): its message is shown as-is
}

/** Adapts an existing axios-style client. All other options work as in `createRestProvider`. */
export function fromApiClient(
  client: ApiClientLike,
  options: Omit<RestProviderOptions, 'request'> = {},
): DataProvider {
  const request = async (req: RestRequest): Promise<unknown> => {
    const config = { signal: req.signal, responseType: req.responseType };
    try {
      switch (req.method) {
        case 'GET':
          return await client.get(req.url, { ...config, params: req.query });
        case 'POST':
          return await client.post(req.url, req.body, config);
        case 'PATCH':
          return await client.patch(req.url, req.body, config);
        case 'PUT':
          if (!client.put) throw new Error('The api client has no put() method');
          return await client.put(req.url, req.body, config);
        case 'DELETE':
          return await client.delete(req.url, config);
      }
    } catch (error) {
      throw toHttpError(error);
    }
  };
  return createRestProvider({ ...options, request });
}
