/**
 * `Where`: the one condition/filter language used for field conditions, action visibility,
 * access rules, permanent list filters, relation option filters and DataProvider filters.
 *
 * A closed Mongo-style subset. There is deliberately no `$regex` or `$where`: configs can come
 * from a server, and neither code evaluation nor user-supplied regular expressions are allowed.
 */
import { getPath } from './path.ts';

/** Reference to a value in the evaluation scope: `values.x`, `record.x` or `ctx.x`. */
export interface VarRef {
  $var: string;
}

export interface PredicateOps {
  $eq?: unknown;
  $ne?: unknown;
  $in?: unknown[];
  $nin?: unknown[];
  $lt?: unknown;
  $lte?: unknown;
  $gt?: unknown;
  $gte?: unknown;
  $between?: [unknown, unknown];
  $contains?: unknown;
  $startsWith?: unknown;
  $null?: boolean;
  $empty?: boolean;
}

/** A bare value (or `VarRef`) means `$eq`. */
export type Predicate = string | number | boolean | null | VarRef | PredicateOps;

export interface WhereGroup {
  $and?: Where[];
  $or?: Where[];
  $not?: Where;
}

export type Where = WhereGroup & { [path: string]: Predicate | Where | Where[] | undefined };

export type Operator = keyof PredicateOps;

export const OPERATORS: readonly Operator[] = [
  '$eq',
  '$ne',
  '$in',
  '$nin',
  '$lt',
  '$lte',
  '$gt',
  '$gte',
  '$between',
  '$contains',
  '$startsWith',
  '$null',
  '$empty',
];
const OPERATOR_SET = new Set<string>(OPERATORS);
const GROUP_KEYS = new Set(['$and', '$or', '$not']);

export class WhereError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhereError';
  }
}

/** Scope for `$var` references. The tested object is `target`, defaulting to `values ?? record`. */
export interface WhereScope {
  values?: unknown;
  record?: unknown;
  ctx?: unknown;
}

export function isVarRef(value: unknown): value is VarRef {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof (value as VarRef).$var === 'string'
  );
}

function isOps(value: unknown): value is PredicateOps {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || isVarRef(value))
    return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((k) => k.startsWith('$'));
}

export function resolveVar(ref: VarRef, scope: WhereScope): unknown {
  const [root, ...rest] = ref.$var.split('.');
  if (root !== 'values' && root !== 'record' && root !== 'ctx') {
    throw new WhereError(`$var must start with values., record. or ctx. (got "${ref.$var}")`);
  }
  return getPath(scope[root], rest.join('.'));
}

const operand = (value: unknown, scope: WhereScope) =>
  isVarRef(value) ? resolveVar(value, scope) : value;

const isEmptyValue = (v: unknown) =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

function comparable(a: unknown, b: unknown): boolean {
  return (
    (typeof a === 'number' && typeof b === 'number' && !Number.isNaN(a) && !Number.isNaN(b)) ||
    (typeof a === 'string' && typeof b === 'string')
  );
}

/** Tests one scalar against one operator. Array-valued fields are handled by the caller (any-match). */
function testScalar(op: Operator, actual: unknown, expected: unknown): boolean {
  switch (op) {
    case '$eq':
      return actual === expected;
    case '$ne':
      return actual !== expected;
    case '$in':
      return (expected as unknown[]).includes(actual);
    case '$nin':
      return !(expected as unknown[]).includes(actual);
    case '$lt':
      return comparable(actual, expected) && (actual as number) < (expected as number);
    case '$lte':
      return comparable(actual, expected) && (actual as number) <= (expected as number);
    case '$gt':
      return comparable(actual, expected) && (actual as number) > (expected as number);
    case '$gte':
      return comparable(actual, expected) && (actual as number) >= (expected as number);
    case '$between': {
      const [lo, hi] = expected as [unknown, unknown];
      return (
        comparable(actual, lo) &&
        comparable(actual, hi) &&
        (actual as number) >= (lo as number) &&
        (actual as number) <= (hi as number)
      );
    }
    case '$contains':
      return (
        typeof actual === 'string' &&
        typeof expected === 'string' &&
        actual.toLowerCase().includes(expected.toLowerCase())
      );
    case '$startsWith':
      return (
        typeof actual === 'string' &&
        typeof expected === 'string' &&
        actual.toLowerCase().startsWith(expected.toLowerCase())
      );
    default:
      throw new WhereError(`Unknown operator ${String(op)}`);
  }
}

function checkOperand(op: Operator, value: unknown) {
  if ((op === '$in' || op === '$nin') && !Array.isArray(value)) {
    throw new WhereError(`${op} expects an array`);
  }
  if (op === '$between' && !(Array.isArray(value) && value.length === 2)) {
    throw new WhereError('$between expects [min, max]');
  }
  if ((op === '$null' || op === '$empty') && typeof value !== 'boolean') {
    throw new WhereError(`${op} expects true or false`);
  }
}

function testPredicate(predicate: Predicate, actual: unknown, scope: WhereScope): boolean {
  const ops: PredicateOps = isOps(predicate) ? predicate : { $eq: predicate };
  for (const [key, raw] of Object.entries(ops)) {
    if (!OPERATOR_SET.has(key)) throw new WhereError(`Unknown operator ${key}`);
    const op = key as Operator;
    const expected = operand(raw, scope);
    checkOperand(op, expected);
    let ok: boolean;
    if (op === '$null') ok = (actual === null || actual === undefined) === expected;
    else if (op === '$empty') ok = isEmptyValue(actual) === expected;
    else if (Array.isArray(actual)) {
      // Array-valued fields match when any element matches; negations require that none match.
      ok =
        op === '$ne' || op === '$nin'
          ? actual.every((el) => testScalar(op, el, expected))
          : actual.some((el) => testScalar(op, el, expected));
    } else ok = testScalar(op, actual, expected);
    if (!ok) return false;
  }
  return true;
}

/**
 * Evaluates `where` against `target` (default: `scope.values ?? scope.record`).
 * Missing paths read as `undefined`; `$eq` is strict; comparisons across types are false;
 * unknown operators throw `WhereError`. Keys in one object are AND-ed.
 */
export function evaluateWhere(where: Where, scope: WhereScope = {}, target?: unknown): boolean {
  const subject = target !== undefined ? target : (scope.values ?? scope.record);
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === '$and') {
      if (!(value as Where[]).every((w) => evaluateWhere(w, scope, subject))) return false;
    } else if (key === '$or') {
      if (!(value as Where[]).some((w) => evaluateWhere(w, scope, subject))) return false;
    } else if (key === '$not') {
      if (evaluateWhere(value as Where, scope, subject)) return false;
    } else if (key.startsWith('$')) {
      throw new WhereError(`Unknown group operator ${key}`);
    } else if (!testPredicate(value as Predicate, getPath(subject, key), scope)) {
      return false;
    }
  }
  return true;
}

/** A flat field condition, as REST encoders usually need. */
export interface Condition {
  field: string;
  op: Operator;
  value: unknown;
}

/**
 * Flattens a `Where` made only of field predicates and `$and` into conditions.
 * `$var` references are resolved against `scope`. Throws `WhereError` for `$or`/`$not`, which a
 * flat query string cannot express; providers that support them should walk the tree themselves.
 */
export function toConditions(where: Where, scope: WhereScope = {}): Condition[] {
  const out: Condition[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === '$and') {
      for (const w of value as Where[]) out.push(...toConditions(w, scope));
    } else if (GROUP_KEYS.has(key)) {
      throw new WhereError(`${key} cannot be flattened into field conditions`);
    } else {
      const predicate = value as Predicate;
      const ops: PredicateOps = isOps(predicate) ? predicate : { $eq: predicate };
      for (const [op, raw] of Object.entries(ops)) {
        if (!OPERATOR_SET.has(op)) throw new WhereError(`Unknown operator ${op}`);
        const resolved = operand(raw, scope);
        checkOperand(op as Operator, resolved);
        out.push({ field: key, op: op as Operator, value: resolved });
      }
    }
  }
  return out;
}

/** Builds a `Where` from flat conditions (the inverse of `toConditions`). */
export function fromConditions(conditions: Condition[]): Where {
  const where: Record<string, PredicateOps> = {};
  for (const { field, op, value } of conditions) {
    where[field] = { ...where[field], [op]: value };
  }
  return where as Where;
}

/** Returns `where` with every `$var` replaced by its value from `scope`. */
export function resolveVars(where: Where, scope: WhereScope): Where {
  const resolve = (node: unknown): unknown => {
    if (isVarRef(node)) return resolveVar(node, scope);
    if (Array.isArray(node)) return node.map(resolve);
    if (node !== null && typeof node === 'object') {
      return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolve(v)]));
    }
    return node;
  };
  return resolve(where) as Where;
}
