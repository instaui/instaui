import { describe, expect, test } from 'vitest';
import { getPath, setPath } from './path.ts';
import { evaluateWhere, fromConditions, resolveVars, toConditions, WhereError } from './where.ts';
import type { Where } from './where.ts';

describe('path helpers', () => {
  test('getPath reads nested values and returns undefined for missing segments', () => {
    const obj = { a: { b: { c: 1 } }, list: [{ id: 'x' }] };
    expect(getPath(obj, 'a.b.c')).toBe(1);
    expect(getPath(obj, 'list.0.id')).toBe('x');
    expect(getPath(obj, 'a.missing.c')).toBeUndefined();
    expect(getPath(null, 'a')).toBeUndefined();
  });

  test('setPath writes immutably and creates intermediate objects', () => {
    const original = { a: { b: 1 }, keep: true };
    const next = setPath(original, 'a.c.d', 2);
    expect(next).toEqual({ a: { b: 1, c: { d: 2 } }, keep: true });
    expect(original).toEqual({ a: { b: 1 }, keep: true });
  });
});

describe('evaluateWhere', () => {
  const record = {
    status: 'ACTIVE',
    amount: 10,
    name: 'Acme Ltd',
    tags: ['a', 'b'],
    owner: { id: 7 },
    note: null,
  };
  const is = (where: Where, target: unknown = record) => evaluateWhere(where, {}, target);

  test('a bare value means strict $eq', () => {
    expect(is({ status: 'ACTIVE' })).toBe(true);
    expect(is({ amount: '10' })).toBe(false);
  });

  test('missing paths read as undefined', () => {
    expect(is({ missing: { $null: true } })).toBe(true);
    expect(is({ missing: 'x' })).toBe(false);
    expect(is({ 'owner.id': 7 })).toBe(true);
  });

  test('comparison operators require same-type operands', () => {
    expect(is({ amount: { $gte: 10, $lt: 11 } })).toBe(true);
    expect(is({ amount: { $gt: '5' } })).toBe(false);
    expect(is({ amount: { $between: [1, 10] } })).toBe(true);
    expect(is({ name: { $gt: 'A' } })).toBe(true);
  });

  test('$in/$nin, $contains and $startsWith (case-insensitive)', () => {
    expect(is({ status: { $in: ['ACTIVE', 'PAUSED'] } })).toBe(true);
    expect(is({ status: { $nin: ['ACTIVE'] } })).toBe(false);
    expect(is({ name: { $contains: 'acme' } })).toBe(true);
    expect(is({ name: { $startsWith: 'ACM' } })).toBe(true);
  });

  test('$null and $empty', () => {
    expect(is({ note: { $null: true } })).toBe(true);
    expect(is({ note: { $empty: true } })).toBe(true);
    expect(is({ tags: { $empty: false } })).toBe(true);
    expect(is({ name: { $empty: true } }, { name: '' })).toBe(true);
  });

  test('array fields match when any element matches; negations need none to match', () => {
    expect(is({ tags: 'b' })).toBe(true);
    expect(is({ tags: { $in: ['z', 'a'] } })).toBe(true);
    expect(is({ tags: { $ne: 'a' } })).toBe(false);
    expect(is({ tags: { $nin: ['x', 'y'] } })).toBe(true);
  });

  test('$and, $or, $not and implicit AND across keys', () => {
    expect(is({ status: 'ACTIVE', amount: 10 })).toBe(true);
    expect(is({ $or: [{ status: 'PAUSED' }, { amount: { $gt: 5 } }] })).toBe(true);
    expect(is({ $not: { status: 'ACTIVE' } })).toBe(false);
    expect(is({ $and: [{ status: 'ACTIVE' }, { $not: { amount: 0 } }] })).toBe(true);
  });

  test('$var resolves against values, record and ctx', () => {
    const scope = { values: { plan: 'FREE', limit: 5 }, ctx: { orgId: 'o1' } };
    expect(evaluateWhere({ plan: { $ne: 'FREE' } }, scope)).toBe(false);
    expect(evaluateWhere({ limit: { $lte: { $var: 'values.limit' } } }, scope)).toBe(true);
    expect(evaluateWhere({ org: { $var: 'ctx.orgId' } }, scope, { org: 'o1' })).toBe(true);
    expect(() => evaluateWhere({ a: { $var: 'window.x' } }, scope)).toThrow(WhereError);
  });

  test('unknown or malformed operators throw instead of being ignored', () => {
    expect(() => is({ status: { $regex: '.*' } as never })).toThrow(WhereError);
    expect(() => is({ $where: 'x' } as never)).toThrow(WhereError);
    expect(() => is({ status: { $in: 'ACTIVE' } as never })).toThrow(WhereError);
    expect(() => is({ amount: { $between: [1] } as never })).toThrow(WhereError);
  });
});

describe('toConditions / fromConditions / resolveVars', () => {
  test('flattens field predicates and $and, resolving $var', () => {
    const where: Where = {
      status: 'ACTIVE',
      amount: { $gte: 10, $lte: { $var: 'ctx.max' } },
      $and: [{ tags: { $in: ['a'] } }],
    };
    expect(toConditions(where, { ctx: { max: 99 } })).toEqual([
      { field: 'status', op: '$eq', value: 'ACTIVE' },
      { field: 'amount', op: '$gte', value: 10 },
      { field: 'amount', op: '$lte', value: 99 },
      { field: 'tags', op: '$in', value: ['a'] },
    ]);
  });

  test('refuses $or and $not', () => {
    expect(() => toConditions({ $or: [{ a: 1 }] })).toThrow(WhereError);
    expect(() => toConditions({ $not: { a: 1 } })).toThrow(WhereError);
  });

  test('fromConditions round-trips flat conditions', () => {
    const conditions = toConditions({ status: { $eq: 'A' }, amount: { $gte: 1, $lt: 5 } });
    expect(fromConditions(conditions)).toEqual({
      status: { $eq: 'A' },
      amount: { $gte: 1, $lt: 5 },
    });
  });

  test('resolveVars replaces references throughout the tree', () => {
    const resolved = resolveVars(
      { $or: [{ owner: { $var: 'ctx.user' } }, { public: true }] },
      { ctx: { user: 'u1' } },
    );
    expect(resolved).toEqual({ $or: [{ owner: 'u1' }, { public: true }] });
  });
});
