/** The DataProvider contract: how instaui talks to any backend. */
import type { Where } from './where.ts';

export type Id = string | number;

/** App context (organisation, user, …) that flows into URL templates, `$var`, access rules and query keys. */
export type InstaContext = Record<string, unknown>;

/** Provider-owned transport settings of a resource. The REST provider reads `path` and `listKey`. */
export interface ResourceApi {
  /** Path relative to the provider's base URL; may contain `{ctx.x}` placeholders. Default: the resource name. */
  path?: string;
  /** Key holding the list in list responses, when the backend wraps it (`{ data: { users: [...] } }`). */
  listKey?: string;
  [key: string]: unknown;
}

export interface ResourceRef {
  name: string;
  idField: string | ((record: Record<string, unknown>) => Id);
  api: ResourceApi;
  /** Query param name per field key, when it differs (from `field.filter.param`). */
  params?: Readonly<Record<string, string>>;
  /** Two-param ranges per field key (from `field.filter.paramRange`). */
  paramRanges?: Readonly<Record<string, readonly [string, string]>>;
}

interface BaseParams {
  resource: ResourceRef;
  ctx: InstaContext;
  signal?: AbortSignal;
  meta?: Record<string, unknown>;
}

export type Pagination =
  | { mode: 'offset'; page: number; pageSize: number }
  | { mode: 'cursor'; cursor?: string; pageSize: number }
  | { mode: 'off' };

export interface SortSpec {
  field: string;
  order: 'asc' | 'desc';
}

export interface ListParams extends BaseParams {
  pagination: Pagination;
  sort: SortSpec[];
  filter: Where;
  search?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface ListResult<T> {
  data: T[];
  total?: number;
  pageInfo?: PageInfo;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue =
  string | number | boolean | null | undefined | Array<string | number | boolean>;

export interface CustomParams extends Partial<BaseParams> {
  method: HttpMethod;
  /** Relative to the provider's base URL. Absolute URLs are rejected. */
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  responseType?: 'json' | 'blob' | 'text';
}

export type AnyRecord = Record<string, unknown>;

export interface DataProvider {
  getList<T = AnyRecord>(params: ListParams): Promise<ListResult<T>>;
  getOne<T = AnyRecord>(params: BaseParams & { id: Id }): Promise<{ data: T }>;
  /** Optional; callers fall back to batched `getOne`. Used to label already-selected relation values. */
  getMany?<T = AnyRecord>(params: BaseParams & { ids: Id[] }): Promise<{ data: T[] }>;
  create<T = AnyRecord>(params: BaseParams & { data: AnyRecord }): Promise<{ data?: T }>;
  update<T = AnyRecord>(
    params: BaseParams & { id: Id; data: AnyRecord; previousData?: T },
  ): Promise<{ data?: T }>;
  deleteOne<T = AnyRecord>(params: BaseParams & { id: Id; previousData?: T }): Promise<void>;
  updateMany?(params: BaseParams & { ids: Id[]; data: AnyRecord }): Promise<void>;
  deleteMany?(params: BaseParams & { ids: Id[] }): Promise<void>;
  custom<R = unknown>(params: CustomParams): Promise<R>;
}

/** Reads a record's id using the resource's `idField`. */
export function recordId(
  resource: Pick<ResourceRef, 'idField'>,
  record: AnyRecord,
): Id | undefined {
  const value =
    typeof resource.idField === 'function' ? resource.idField(record) : record[resource.idField];
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}
