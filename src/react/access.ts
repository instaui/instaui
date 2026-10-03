/** `useCan(resource)`: the access check of core/access.ts with the provider's context and `can()`. */
import { useCallback } from 'react';
import { isAllowed, type AccessAction } from '../core/access.ts';
import type { AnyRecord } from '../core/data-provider.ts';
import { useInsta, useResource } from './context.tsx';

export function useCan(resourceName: string) {
  const resource = useResource(resourceName);
  const { ctx, can } = useInsta();
  return useCallback(
    (action: AccessAction, record?: AnyRecord) => isAllowed(resource, action, record, ctx, can),
    [resource, ctx, can],
  );
}
