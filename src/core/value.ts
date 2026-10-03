/** Value checks shared by every layer. */

/** `undefined`, `null` or `''`: a value that isn't there. */
export const isBlank = (v: unknown): v is undefined | null | '' =>
  v === undefined || v === null || v === '';

/** A plain object (not an array or `null`). */
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/** A one-or-many value as a list: blank is none, an array is itself, anything else is one. */
export const valuesOf = <T>(v: T | readonly T[] | undefined | null | ''): T[] =>
  Array.isArray(v) ? [...(v as readonly T[])] : isBlank(v) ? [] : [v as T];

/** One page of rows (pages count from 1). */
export const pageOf = <T>(rows: readonly T[], page: number, pageSize: number): T[] =>
  rows.slice((page - 1) * pageSize, page * pageSize);
