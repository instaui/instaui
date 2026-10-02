/**
 * Field codecs: the single place that converts between wire values (API), form values (inputs)
 * and display text. Fixes the classic CRUD bugs: date-only values shifting a day across time zones,
 * 0/1 rendered blank, `null` sent as the string "null", JSON fields re-formatted while typing.
 */
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import type { FieldProps, FieldTypeName } from './resource.ts';
import { isBlank } from './value.ts';

export type Timezone = 'local' | 'utc';

export interface CodecContext {
  props: FieldProps;
  timezone: Timezone;
  /** Resolves a relation target's id field (default `'id'`). */
  idFieldOf?: (resource: string) => string;
  messages: { yes: string; no: string };
}

/** Everything a codec needs except the field's own props. */
export type CodecEnv = Omit<CodecContext, 'props'>;

export interface FieldCodec {
  /** wire → form value */
  decode(wire: unknown, c: CodecContext): unknown;
  /** form value → wire. `undefined` means "no value". Throw `CodecError` for invalid input. */
  encode(value: unknown, c: CodecContext): unknown;
  /** wire → display text (cells, detail, labels) */
  toText(wire: unknown, c: CodecContext): string;
  isEmpty?(value: unknown): boolean;
}

export class CodecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodecError';
  }
}

let dayjsReady = false;
/** Registers the dayjs plugins instaui needs. Idempotent; called by `InstaProvider`. */
export function setupDayjs(): void {
  if (dayjsReady) return;
  dayjs.extend(utc);
  dayjs.extend(customParseFormat);
  dayjsReady = true;
}

const isDayjs = (v: unknown): v is Dayjs => dayjs.isDayjs(v);
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

function toDayjs(wire: unknown): Dayjs | undefined {
  if (isDayjs(wire)) return wire;
  if (typeof wire === 'number' || typeof wire === 'string' || wire instanceof Date) {
    const d = dayjs(wire);
    return d.isValid() ? d : undefined;
  }
  return undefined;
}

const inZone = (d: Dayjs, timezone: Timezone) => {
  if (timezone !== 'utc') return d;
  setupDayjs();
  return d.utc();
};

const scalarText = (v: unknown) =>
  isBlank(v) ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

const text: FieldCodec = {
  decode: (w) => (isBlank(w) ? undefined : typeof w === 'string' ? w : scalarText(w)),
  encode: (v, c) =>
    v === undefined ? undefined : typeof v === 'string' && c.props.trim ? v.trim() : v,
  toText: scalarText,
};

const number: FieldCodec = {
  decode: (w) => {
    if (typeof w === 'number') return Number.isFinite(w) ? w : undefined;
    if (typeof w === 'string' && w.trim() !== '' && Number.isFinite(Number(w))) return Number(w);
    return undefined;
  },
  encode: (v) => (isBlank(v) ? undefined : Number(v)),
  toText: (w, c) => {
    const n = number.decode(w, c);
    if (typeof n !== 'number') return '';
    const digits = c.props.precision;
    return new Intl.NumberFormat(
      undefined,
      digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits },
    ).format(n);
  },
};

const TRUE = new Set<unknown>([true, 'true', 1, '1']);
const FALSE = new Set<unknown>([false, 'false', 0, '0']);
const boolean: FieldCodec = {
  decode: (w) => (TRUE.has(w) ? true : FALSE.has(w) ? false : undefined),
  encode: (v) => (v === undefined || v === null ? undefined : Boolean(v)),
  toText: (w, c) => {
    const b = boolean.decode(w, c);
    return b === undefined ? '' : b ? c.messages.yes : c.messages.no;
  },
};

/** A calendar date: `YYYY-MM-DD` on the wire, never shifted by time zones. */
const date: FieldCodec = {
  decode: (w) => {
    if (typeof w === 'string') {
      const m = DATE_ONLY.exec(w);
      return m ? dayjs(`${m[1]}-${m[2]}-${m[3]}`) : undefined;
    }
    return toDayjs(w)?.startOf('day');
  },
  encode: (v) => (isDayjs(v) && v.isValid() ? v.format('YYYY-MM-DD') : undefined),
  toText: (w, c) => {
    const d = date.decode(w, c) as Dayjs | undefined;
    return d ? d.format(c.props.format ?? 'MMM D, YYYY') : '';
  },
};

/** An instant: ISO 8601 with offset on the wire; displayed in the provider's time zone. */
const datetime: FieldCodec = {
  decode: (w) => toDayjs(w),
  encode: (v) => (isDayjs(v) && v.isValid() ? v.toISOString() : undefined),
  toText: (w, c) => {
    const d = toDayjs(w);
    return d ? inZone(d, c.timezone).format(c.props.format ?? 'MMM D, YYYY HH:mm') : '';
  },
};

const TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const time: FieldCodec = {
  decode: (w) => {
    if (isDayjs(w)) return w;
    if (typeof w !== 'string') return undefined;
    const m = TIME.exec(w.trim());
    return m
      ? dayjs()
          .startOf('day')
          .hour(Number(m[1]))
          .minute(Number(m[2]))
          .second(Number(m[3] ?? 0))
      : undefined;
  },
  encode: (v) => (isDayjs(v) && v.isValid() ? v.format('HH:mm:ss') : undefined),
  toText: (w, c) => {
    const d = time.decode(w, c) as Dayjs | undefined;
    return d ? d.format(c.props.format ?? 'HH:mm') : '';
  },
};

const asList = (w: unknown): unknown[] =>
  Array.isArray(w)
    ? w
    : typeof w === 'string' && w !== ''
      ? w.split(',').map((s) => s.trim())
      : isBlank(w)
        ? []
        : [w];

const enumCodec: FieldCodec = {
  decode: (w, c) => (c.props.multiple ? asList(w) : isBlank(w) ? undefined : w),
  encode: (v, c) =>
    c.props.multiple ? (Array.isArray(v) ? v : isBlank(v) ? [] : [v]) : isBlank(v) ? undefined : v,
  toText: (w, c) => {
    const options = c.props.options ?? [];
    const label = (v: unknown) => options.find((o) => o.value === v)?.label ?? scalarText(v);
    return (c.props.multiple ? asList(w) : isBlank(w) ? [] : [w]).map(label).join(', ');
  },
  isEmpty: (v) => isBlank(v) || (Array.isArray(v) && v.length === 0),
};

const tags: FieldCodec = {
  decode: (w) => asList(w).map(String),
  encode: (v) => (Array.isArray(v) ? v.map(String) : []),
  toText: (w) => asList(w).map(String).join(', '),
  isEmpty: (v) => !Array.isArray(v) || v.length === 0,
};

const relationId = (w: unknown, c: CodecContext): unknown => {
  if (w !== null && typeof w === 'object' && !Array.isArray(w)) {
    const idField = c.props.resource ? (c.idFieldOf?.(c.props.resource) ?? 'id') : 'id';
    return (w as Record<string, unknown>)[idField];
  }
  return isBlank(w) ? undefined : w;
};

/** Values may arrive as ids or as nested records; the form always holds ids. */
const relation: FieldCodec = {
  decode: (w, c) => (c.props.multiple ? asList(w).map((x) => relationId(x, c)) : relationId(w, c)),
  encode: (v, c) => (c.props.multiple ? (Array.isArray(v) ? v : []) : isBlank(v) ? undefined : v),
  toText: (w, c) =>
    (c.props.multiple ? asList(w) : [w]).map((x) => scalarText(relationId(x, c))).join(', '),
  isEmpty: (v) => isBlank(v) || (Array.isArray(v) && v.length === 0),
};

/** The form holds the JSON text; it is parsed only on submit, never while typing. */
const json: FieldCodec = {
  decode: (w) =>
    w === undefined || w === null ? '' : typeof w === 'string' ? w : JSON.stringify(w, null, 2),
  encode: (v) => {
    if (isBlank(v)) return undefined;
    if (typeof v !== 'string') return v;
    try {
      return JSON.parse(v);
    } catch {
      throw new CodecError('Invalid JSON');
    }
  },
  toText: (w) => (isBlank(w) ? '' : typeof w === 'string' ? w : JSON.stringify(w)),
};

export const builtinCodecs: Record<string, FieldCodec> = {
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
};

export function codecFor(
  type: FieldTypeName,
  registry: Record<string, FieldCodec> = builtinCodecs,
): FieldCodec {
  return registry[type] ?? builtinCodecs.text!;
}

export function isEmptyValue(codec: FieldCodec, value: unknown): boolean {
  return codec.isEmpty ? codec.isEmpty(value) : isBlank(value);
}
