import dayjs from 'dayjs';
import { afterAll, describe, expect, test } from 'vitest';
import { builtinCodecs, CodecError, type CodecContext } from './codecs.ts';
import { recordLabel } from './label.ts';
import { defaultUrlCodec } from './list-state.ts';
import { buildSubmitPayload, decodeRecord } from './payload.ts';
import { defineResource, normalizeResource, type FieldProps } from './resource.ts';

const ctx = (props: FieldProps = {}, timezone: 'local' | 'utc' = 'local'): CodecContext => ({
  props,
  timezone,
  messages: { yes: 'Yes', no: 'No' },
});
const {
  text,
  number,
  boolean,
  date,
  datetime,
  time,
  enum: enumCodec,
  tags,
  relation,
  json,
} = builtinCodecs as Required<typeof builtinCodecs>;

const originalTz = process.env.TZ;
afterAll(() => {
  process.env.TZ = originalTz;
});

describe.each(['UTC', 'Asia/Kolkata', 'America/Los_Angeles'])('dates in TZ=%s', (tz) => {
  test('B06: a calendar date never shifts, whatever the zone', () => {
    process.env.TZ = tz;
    for (const wire of ['2026-09-26', '2026-09-26T00:00:00Z', '2026-09-26T23:30:00-08:00']) {
      expect(date!.encode(date!.decode(wire, ctx()), ctx())).toBe('2026-09-26');
      expect(date!.toText(wire, ctx())).toBe('Sep 26, 2026');
    }
  });

  test('a datetime round-trips as the same instant, with an offset on the wire', () => {
    process.env.TZ = tz;
    const wire = '2026-09-26T10:15:00.000Z';
    const encoded = datetime!.encode(datetime!.decode(wire, ctx()), ctx()) as string;
    expect(encoded).toBe(wire);
    expect(datetime!.toText(wire, ctx({}, 'utc'))).toBe('Sep 26, 2026 10:15');
  });
});

describe('codecs', () => {
  test('B07: numbers 0 and 1 stay numbers; booleans only coerce for boolean fields', () => {
    expect(number!.decode(0, ctx())).toBe(0);
    expect(number!.toText(1, ctx())).toBe('1');
    expect(text!.toText(0, ctx())).toBe('0');
    expect(boolean!.decode('1', ctx())).toBe(true);
    expect(boolean!.toText(0, ctx())).toBe('No');
    expect(number!.decode('100.50', ctx())).toBe(100.5);
    expect(number!.decode('', ctx())).toBeUndefined();
  });

  test('B35: enums display option labels', () => {
    const props = {
      options: [
        { value: 'A', label: 'Active' },
        { value: 'P', label: 'Paused' },
      ],
    };
    expect(enumCodec!.toText('A', ctx(props))).toBe('Active');
    expect(enumCodec!.toText(['A', 'P'], ctx({ ...props, multiple: true }))).toBe('Active, Paused');
  });

  test('time parses HH:mm(:ss) without extra plugins', () => {
    expect(time!.encode(time!.decode('09:05', ctx()), ctx())).toBe('09:05:00');
    expect(time!.toText('17:30:00', ctx())).toBe('17:30');
  });

  test('tags accept arrays or comma strings', () => {
    expect(tags!.decode('a, b', ctx())).toEqual(['a', 'b']);
  });

  test('relations decode nested records to ids', () => {
    const c = { ...ctx({ resource: 'teams' }), idFieldOf: () => 'key' };
    expect(relation!.decode({ key: 't1', name: 'Core' }, c)).toBe('t1');
    expect(
      relation!.decode([{ key: 't1' }, 't2'], {
        ...c,
        props: { resource: 'teams', multiple: true },
      }),
    ).toEqual(['t1', 't2']);
  });

  test('B31: JSON is edited as text and parsed on submit; invalid JSON is an error', () => {
    expect(json!.decode({ a: 1 }, ctx())).toBe('{\n  "a": 1\n}');
    expect(json!.encode('{"a": 1}', ctx())).toEqual({ a: 1 });
    expect(() => json!.encode('{oops', ctx())).toThrow(CodecError);
  });
});

describe('buildSubmitPayload', () => {
  const resource = normalizeResource(
    defineResource({
      name: 'projects',
      fields: [
        { key: 'name', type: 'text', props: { trim: true } },
        { key: 'budget', type: 'number' },
        { key: 'startsOn', type: 'date' },
        { key: 'code', type: 'text', edit: 'readonly' },
        { key: 'kind', type: 'enum' },
        { key: 'clientId', type: 'text', visibleIf: { kind: 'CLIENT_PROJECT' } },
        { key: 'owner.email', type: 'text' },
      ],
    }),
  );
  const original = {
    id: 1,
    name: 'Apollo',
    budget: 0,
    startsOn: '2026-09-26',
    code: 'AP',
    kind: 'INTERNAL',
    owner: { email: 'a@x.io' },
  };
  const env = { timezone: 'local' as const, messages: { yes: 'Yes', no: 'No' } };
  const editValues = () => decodeRecord(resource, original, 'edit', env);

  test('B04: an update sends only changed fields', () => {
    const values = { ...editValues(), name: '  Apollo 2 ' };
    expect(buildSubmitPayload({ resource, mode: 'edit', values, original, ctx: {}, env })).toEqual({
      name: 'Apollo 2',
    });
  });

  test('B06/B04: an untouched date and an untouched 0 are not re-sent', () => {
    expect(
      buildSubmitPayload({ resource, mode: 'edit', values: editValues(), original, ctx: {}, env }),
    ).toEqual({});
  });

  test('B09/B10: a cleared value is sent as null, never "null" and never dropped', () => {
    const values = { ...editValues(), budget: undefined };
    expect(buildSubmitPayload({ resource, mode: 'edit', values, original, ctx: {}, env })).toEqual({
      budget: null,
    });
  });

  test('read-only and hidden-by-condition fields are not submitted; dot paths nest', () => {
    const values = {
      ...editValues(),
      code: 'CHANGED',
      clientId: 'p1',
      owner: { email: 'b@x.io' },
    };
    expect(buildSubmitPayload({ resource, mode: 'edit', values, original, ctx: {}, env })).toEqual({
      owner: { email: 'b@x.io' },
    });
  });

  test('create omits empty values and includes visible conditional fields', () => {
    const values = {
      name: 'New',
      kind: 'CLIENT_PROJECT',
      clientId: 'p1',
      startsOn: dayjs('2026-01-02'),
    };
    expect(buildSubmitPayload({ resource, mode: 'create', values, ctx: {}, env })).toEqual({
      name: 'New',
      kind: 'CLIENT_PROJECT',
      clientId: 'p1',
      startsOn: '2026-01-02',
    });
  });

  test('beforeSubmit switches the default to full updates', () => {
    const withHook = normalizeResource(
      defineResource({ name: 'x', fields: [], form: { beforeSubmit: (p) => p } }),
    );
    expect(withHook.patch).toBe('full');
  });
});

describe('recordLabel', () => {
  const r = { idField: 'id' };
  test('template, then fallbacks, then #id', () => {
    expect(
      recordLabel({ ...r, recordLabel: '{name} ({code})' }, { id: 1, name: 'Acme', code: 'AC' }),
    ).toBe('Acme (AC)');
    expect(recordLabel(r, { id: 1, title: 'Hello' })).toBe('Hello');
    expect(recordLabel(r, { id: 7 })).toBe('#7');
  });
});

describe('defaultUrlCodec', () => {
  const defaults = { pageSize: 10, fieldTypes: { amount: 'number', active: 'boolean' } };

  test('round-trips page, sort, typed filters and search', () => {
    const state = {
      page: 2,
      pageSize: 20,
      sort: [
        { field: 'createdAt', order: 'desc' as const },
        { field: 'name', order: 'asc' as const },
      ],
      filter: {
        status: { $eq: 'ACTIVE' },
        amount: { $gte: 10 },
        active: { $eq: true },
        role: { $in: ['a', 'b'] },
      },
      search: 'acme',
    };
    const url = defaultUrlCodec.stringify(state, defaults);
    expect(url).toBe(
      '?page=2&pageSize=20&sort=-createdAt%2Cname&f.status=ACTIVE&f.amount.gte=10&f.active=true&f.role.in=a%2Cb&q=acme',
    );
    expect(defaultUrlCodec.parse(url, defaults)).toEqual(state);
  });

  test('defaults are omitted and invalid params fall back', () => {
    expect(
      defaultUrlCodec.stringify({ page: 1, pageSize: 10, sort: [], filter: {} }, defaults),
    ).toBe('');
    expect(defaultUrlCodec.parse('?page=abc&pageSize=-3', defaults)).toMatchObject({
      page: 1,
      pageSize: 10,
    });
  });

  test('an explicitly cleared sort overrides the default sort', () => {
    const withSort = { ...defaults, sort: [{ field: 'name', order: 'asc' as const }] };
    const url = defaultUrlCodec.stringify(
      { page: 1, pageSize: 10, sort: [], filter: {} },
      withSort,
    );
    expect(defaultUrlCodec.parse(url, withSort).sort).toEqual([]);
  });
});
