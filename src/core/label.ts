/** The one record-label resolver, shared by relation options, cells and the detail view. */
import { recordId, type AnyRecord } from './data-provider.ts';
import { getPath } from './path.ts';
import { renderTemplate } from './template.ts';

const FALLBACK_KEYS = ['name', 'title', 'label', 'displayName'];

export interface LabelSource {
  recordLabel?: string | ((record: never) => string);
  idField: string | ((record: never) => string | number);
}

/** Template (or `recordLabel`), then `name`/`title`/`label`/`displayName`, then `#id`. */
export function recordLabel(resource: LabelSource, record: AnyRecord, template?: string): string {
  const source = template ?? resource.recordLabel;
  if (typeof source === 'function') return (source as (r: AnyRecord) => string)(record);
  if (typeof source === 'string') {
    const text = renderTemplate(source, (path) => getPath(record, path), {
      onMissing: 'empty',
    }).trim();
    if (text) return text;
  }
  for (const key of FALLBACK_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  const id = recordId({ idField: resource.idField as (r: AnyRecord) => string | number }, record);
  return id === undefined ? '' : `#${id}`;
}
