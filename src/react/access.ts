/**
 * Access checks: the resource's `access[action]` (boolean or `Where` on the record) AND the
 * provider's `can()`. Synchronous by design, and enforced by every view and route, not only buttons.
 */
import { useCallback } from 'react';
import type { AnyRecord } from '../core/data-provider.ts';
import type { NormalizedResource } from '../core/resource.ts';
import { evaluateWhere } from '../core/where.ts';
import { useInsta, useResource, type AccessAction, type AccessCheck } from './context.tsx';

export function isAllowed(
  resource: NormalizedResource,
  action: AccessAction,
  record: AnyRecord | undefined,
  ctx: Record<string, unknown>,
  can?: (check: AccessCheck) => boolean,
): boolean {
  const rule = resource.access?.[action];
  const ruleOk =
    rule === undefined ||
    (typeof rule === 'boolean' ? rule : evaluateWhere(rule, { record, ctx }, record ?? {}));
  return ruleOk && (can ? can({ resource: resource.name, action, record }) : true);
}

export function useCan(resourceName: string) {
  const resource = useResource(resourceName);
  const { ctx, can } = useInsta();
  return useCallback(
    (action: AccessAction, record?: AnyRecord) => isAllowed(resource, action, record, ctx, can),
    [resource, ctx, can],
  );
}
