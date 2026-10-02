/**
 * Merges a base definition (typically JSON from a server) with a local patch (typically code:
 * functions, components). Fields merge by key; unknown patch fields are appended; arrays other
 * than `fields` are replaced; plain objects merge deeply.
 */
import type { FieldDefinition, ResourceDefinition } from './resource.ts';

export type FieldPatch = Partial<FieldDefinition<never>> & { key: string };

export type ResourcePatch = Partial<Omit<ResourceDefinition<never>, 'fields'>> & {
  fields?: FieldPatch[];
};

const isPlain = (v: unknown): v is Record<string, unknown> =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.getPrototypeOf(v) === Object.prototype;

function mergeDeep(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (!isPlain(base) || !isPlain(patch)) return patch;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) out[key] = mergeDeep(base[key], value);
  return out;
}

export function mergeResource<T extends object>(
  base: ResourceDefinition<T>,
  patch: ResourcePatch,
): ResourceDefinition<T> {
  const { fields: fieldPatches, ...rest } = patch;
  const merged = mergeDeep(base, rest) as ResourceDefinition<T>;
  if (!fieldPatches) return merged;
  const byKey = new Map(fieldPatches.map((f) => [f.key, f]));
  const fields = base.fields.map((field) => {
    const p = byKey.get(field.key);
    return p ? (mergeDeep(field, p) as FieldDefinition<T>) : field;
  });
  const known = new Set(base.fields.map((f) => f.key));
  for (const p of fieldPatches)
    if (!known.has(p.key)) fields.push(p as unknown as FieldDefinition<T>);
  return { ...merged, fields };
}
