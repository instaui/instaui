/**
 * Access checks: the resource's `access[action]` (boolean, `Where` on the record or a function)
 * AND the app's `can()`. Synchronous by design, so every view and route can enforce them.
 */
import type { AnyRecord, InstaContext } from './data-provider.ts';
import type { NormalizedResource } from './resource.ts';
import { evaluateWhere } from './where.ts';

export type AccessAction = 'list' | 'detail' | 'create' | 'edit' | 'delete' | (string & {});

export interface AccessCheck {
  resource: string;
  action: AccessAction;
  record?: AnyRecord;
}

export function isAllowed(
  resource: NormalizedResource,
  action: AccessAction,
  record: AnyRecord | undefined,
  ctx: InstaContext,
  can?: (check: AccessCheck) => boolean,
): boolean {
  const rule = resource.access?.[action];
  const ruleOk =
    rule === undefined ||
    (typeof rule === 'boolean'
      ? rule
      : typeof rule === 'function'
        ? rule(record, ctx)
        : evaluateWhere(rule, { record, ctx }, record ?? {}));
  return ruleOk && (can ? can({ resource: resource.name, action, record }) : true);
}
