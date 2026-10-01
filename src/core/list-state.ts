/**
 * List state ↔ browser URL. The URL codec is deliberately separate from the provider's query
 * encoding: the browser URL is UI state, the API query is the backend's contract.
 *
 * Default format: `?page=2&pageSize=20&sort=-createdAt,name&f.status=ACTIVE&f.amount.gte=10&q=text`
 */
import type { SortSpec } from './data-provider.ts';
import {
  fromConditions,
  OPERATORS,
  toConditions,
  type Condition,
  type Operator,
  type Where,
} from './where.ts';

export interface ListState {
  page: number;
  pageSize: number;
  sort: SortSpec[];
  filter: Where;
  search?: string;
}

export interface ListDefaults {
  pageSize: number;
  sort?: SortSpec[];
  /** Field types by path, used to restore typed filter values (`'number'`, `'boolean'`). */
  fieldTypes?: Record<string, string>;
}

export interface UrlCodec {
  parse(search: string, defaults: ListDefaults): ListState;
  stringify(state: ListState, defaults: ListDefaults): string;
}

const MULTI: ReadonlySet<Operator> = new Set(['$in', '$nin', '$between']);
const OPS = new Set<string>(OPERATORS.map((o) => o.slice(1)));

function positiveInt(raw: string | null, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function coerce(raw: string, type: string | undefined, op: Operator): unknown {
  if (op === '$null' || op === '$empty' || type === 'boolean')
    return raw === 'true' ? true : raw === 'false' ? false : raw;
  if (type === 'number' && raw.trim() !== '' && Number.isFinite(Number(raw))) return Number(raw);
  return raw;
}

const encodeValue = (value: unknown) =>
  Array.isArray(value) ? value.map(String).join(',') : String(value);

export const defaultUrlCodec: UrlCodec = {
  parse(search, defaults) {
    const params = new URLSearchParams(search);
    const conditions: Condition[] = [];
    for (const [key, raw] of params) {
      if (!key.startsWith('f.')) continue;
      const parts = key.slice(2).split('.');
      const last = parts[parts.length - 1]!;
      const op: Operator = OPS.has(last) && parts.length > 1 ? (`$${last}` as Operator) : '$eq';
      const field = op === '$eq' ? parts.join('.') : parts.slice(0, -1).join('.');
      const type = defaults.fieldTypes?.[field];
      const value = MULTI.has(op)
        ? raw.split(',').map((v) => coerce(v, type, op))
        : coerce(raw, type, op);
      if (op === '$between' && (value as unknown[]).length !== 2) continue;
      conditions.push({ field, op, value });
    }
    const sortParam = params.get('sort');
    const sort: SortSpec[] = params.has('sort')
      ? (sortParam ?? '')
          .split(',')
          .filter(Boolean)
          .map((s) =>
            s.startsWith('-') ? { field: s.slice(1), order: 'desc' } : { field: s, order: 'asc' },
          )
      : (defaults.sort ?? []);
    const query = params.get('q') ?? undefined;
    return {
      page: positiveInt(params.get('page'), 1),
      pageSize: positiveInt(params.get('pageSize'), defaults.pageSize),
      sort,
      filter: fromConditions(conditions),
      ...(query ? { search: query } : {}),
    };
  },

  stringify(state, defaults) {
    const params = new URLSearchParams();
    if (state.page !== 1) params.set('page', String(state.page));
    if (state.pageSize !== defaults.pageSize) params.set('pageSize', String(state.pageSize));
    const sortText = state.sort
      .map((s) => (s.order === 'desc' ? `-${s.field}` : s.field))
      .join(',');
    const defaultSort = (defaults.sort ?? [])
      .map((s) => (s.order === 'desc' ? `-${s.field}` : s.field))
      .join(',');
    if (sortText !== defaultSort) params.set('sort', sortText);
    for (const { field, op, value } of toConditions(state.filter)) {
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0))
        continue;
      params.set(op === '$eq' ? `f.${field}` : `f.${field}.${op.slice(1)}`, encodeValue(value));
    }
    if (state.search) params.set('q', state.search);
    const text = params.toString();
    return text ? `?${text}` : '';
  },
};
