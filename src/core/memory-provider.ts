/** In-memory DataProvider for tests, docs demos and prototypes. Supports the full `Where` language. */
import type { AnyRecord, DataProvider, Id, ListParams, ResourceRef } from './data-provider.ts';
import { recordId } from './data-provider.ts';
import { HttpError } from './http-error.ts';
import { getPath } from './path.ts';
import { evaluateWhere } from './where.ts';
import { pageOf } from './value.ts';

export interface MemoryProviderOptions {
  /** Simulated latency in ms (default 0). */
  latency?: number;
  /** Generates ids for created records (default: max numeric id + 1, else a random string). */
  generateId?: (resource: ResourceRef, records: AnyRecord[]) => Id;
}

const clone = <T>(value: T): T => structuredClone(value);

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null) return 1;
  if (b === undefined || b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function createMemoryProvider(
  seed: Record<string, AnyRecord[]> = {},
  { latency = 0, generateId }: MemoryProviderOptions = {},
): DataProvider & { snapshot(): Record<string, AnyRecord[]> } {
  const db: Record<string, AnyRecord[]> = clone(seed);
  const table = (resource: ResourceRef) => (db[resource.name] ??= []);
  const wait = () => (latency > 0 ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());
  const find = (resource: ResourceRef, id: Id) => {
    const record = table(resource).find((r) => String(recordId(resource, r)) === String(id));
    if (!record)
      throw new HttpError({ status: 404, message: `${resource.name} ${String(id)} not found` });
    return record;
  };
  const nextId = (resource: ResourceRef): Id => {
    const records = table(resource);
    if (generateId) return generateId(resource, records);
    const numeric = records
      .map((r) => recordId(resource, r))
      .filter((v): v is number => typeof v === 'number');
    return numeric.length === records.length && records.length > 0
      ? Math.max(...numeric) + 1
      : records.length === 0
        ? 1
        : Math.random().toString(36).slice(2, 10);
  };
  const idKey = (resource: ResourceRef) =>
    typeof resource.idField === 'string' ? resource.idField : 'id';

  return {
    snapshot: () => clone(db),
    async getList<T>(params: ListParams) {
      await wait();
      let rows = table(params.resource).filter((r) =>
        evaluateWhere(params.filter, { ctx: params.ctx }, r),
      );
      if (params.search) {
        const needle = params.search.toLowerCase();
        rows = rows.filter((r) =>
          Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(needle)),
        );
      }
      for (const { field, order } of [...params.sort].reverse()) {
        rows = [...rows].sort(
          (a, b) => compare(getPath(a, field), getPath(b, field)) * (order === 'asc' ? 1 : -1),
        );
      }
      const total = rows.length;
      if (params.pagination.mode === 'offset') {
        const { page, pageSize } = params.pagination;
        rows = pageOf(rows, page, pageSize);
      }
      return { data: clone(rows) as T[], total };
    },
    async getOne<T>({ resource, id }: { resource: ResourceRef; id: Id }) {
      await wait();
      return { data: clone(find(resource, id)) as T };
    },
    async getMany<T>({ resource, ids }: { resource: ResourceRef; ids: Id[] }) {
      await wait();
      const wanted = new Set(ids.map(String));
      return {
        data: clone(
          table(resource).filter((r) => wanted.has(String(recordId(resource, r)))),
        ) as T[],
      };
    },
    async create<T>({ resource, data }: { resource: ResourceRef; data: AnyRecord }) {
      await wait();
      const record = { ...data, [idKey(resource)]: data[idKey(resource)] ?? nextId(resource) };
      table(resource).push(record);
      return { data: clone(record) as T };
    },
    async update<T>({ resource, id, data }: { resource: ResourceRef; id: Id; data: AnyRecord }) {
      await wait();
      const record = find(resource, id);
      Object.assign(record, data);
      return { data: clone(record) as T };
    },
    async deleteOne({ resource, id }: { resource: ResourceRef; id: Id }) {
      await wait();
      const rows = table(resource);
      rows.splice(rows.indexOf(find(resource, id)), 1);
    },
    async custom() {
      throw new Error('createMemoryProvider does not implement custom()');
    },
  };
}
