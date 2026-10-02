import type { ComponentType } from 'react';
import type { NormalizedResource } from '../../core/resource.ts';
import { useInsta } from '../../react/context.tsx';
import { antdRegistry } from '../registry.ts';
import type { ViewProps } from './viewProps.ts';

export type OverrideSlot = 'page' | 'detail' | 'create' | 'edit' | 'rowActions';

/** The component a resource puts in a slot: given directly, or by registry key. */
export function useOverrides(resource: NormalizedResource) {
  const { registry } = useInsta();
  const { components } = antdRegistry(registry);
  return (slot: OverrideSlot): ComponentType<ViewProps> | undefined => {
    const c = resource.components?.[slot];
    if (typeof c === 'function') return c as ComponentType<ViewProps>;
    return typeof c === 'string' ? components?.[c] : undefined;
  };
}
