/**
 * Builds the request body from form values: field modes and visibility decide what is sent,
 * codecs encode, and updates send only changed fields (`patch: 'diff'`, the default).
 */
import type { CodecEnv, FieldCodec } from './codecs.ts';
import { codecFor } from './codecs.ts';
import type { AnyRecord, InstaContext } from './data-provider.ts';
import { getPath, setPath } from './path.ts';
import type { FormMode, NormalizedField, NormalizedResource } from './resource.ts';
import { conditionMet } from './resource.ts';

export interface PayloadInput<T extends object = AnyRecord> {
  resource: NormalizedResource<T>;
  mode: FormMode;
  /** Form values (nested by dot path). */
  values: AnyRecord;
  /** The record as loaded from the API (edit mode), used for the diff. */
  original?: AnyRecord;
  ctx: InstaContext;
  env: CodecEnv;
  codecs?: Record<string, FieldCodec>;
}

/** JSON-stable comparison; `null` and `undefined` count as the same "no value". */
function same(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): unknown =>
    v === undefined || v === null
      ? null
      : Array.isArray(v)
        ? v.map(norm)
        : typeof v === 'object'
          ? Object.fromEntries(
              Object.keys(v as AnyRecord)
                .sort()
                .map((k) => [k, norm((v as AnyRecord)[k])]),
            )
          : v;
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
}

export function isFieldSubmitted<T extends object>(
  field: NormalizedField<T>,
  mode: FormMode,
  values: AnyRecord,
  ctx: InstaContext,
  record?: AnyRecord,
): boolean {
  if (field.submit === 'never') return false;
  if (field.submit === 'always') return true;
  return field[mode] === 'editable' && conditionMet(field.visibleIf, values as T, ctx, record);
}

/**
 * Returns the payload. Cleared values are sent as `null` on update (never dropped, never the string
 * "null"); on create, empty values are omitted. Throws `CodecError` for invalid input (e.g. JSON).
 */
export function buildSubmitPayload<T extends object>({
  resource,
  mode,
  values,
  original,
  ctx,
  env,
  codecs,
}: PayloadInput<T>): AnyRecord {
  let payload: AnyRecord = {};
  for (const field of resource.fields) {
    if (!isFieldSubmitted(field, mode, values, ctx, original)) continue;
    const codec = codecFor(field.type, codecs);
    const c = { ...env, props: field.props };
    const encoded = codec.encode(getPath(values, field.key), c);
    if (mode === 'edit' && resource.patch === 'diff' && original) {
      const before = codec.encode(codec.decode(getPath(original, field.key), c), c);
      if (same(before, encoded)) continue;
    }
    if (encoded === undefined) {
      if (mode === 'create' || resource.form?.emptyValue === 'omit') continue;
      payload = setPath(payload, field.key, null);
    } else {
      payload = setPath(payload, field.key, encoded);
    }
  }
  return resource.form?.beforeSubmit ? resource.form.beforeSubmit(payload, { mode, ctx }) : payload;
}

/** Decodes a record into initial form values. Fields hidden in this mode are skipped. */
export function decodeRecord<T extends object>(
  resource: NormalizedResource<T>,
  record: AnyRecord | undefined,
  mode: FormMode,
  env: CodecEnv,
  codecs?: Record<string, FieldCodec>,
): AnyRecord {
  let values: AnyRecord = {};
  for (const field of resource.fields) {
    if (field[mode] === 'hidden') continue;
    const wire = record ? getPath(record, field.key) : field.default;
    const decoded = codecFor(field.type, codecs).decode(wire, { ...env, props: field.props });
    if (decoded !== undefined) values = setPath(values, field.key, decoded);
  }
  return values;
}
