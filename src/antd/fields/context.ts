/** What cells and detail fields share: relation links and prefetched related records. */
import { createContext, type ComponentType } from 'react';
import type { AnyRecord } from '../../core/data-provider.ts';
import type { ResourceTableProps } from '../ResourceTable.tsx';

export interface RenderEnv {
  /** Base path per resource name, for relation links. */
  basePathOf(resource: string): string;
  /** Prefetched related records: resource → id → record. */
  related: ReadonlyMap<string, ReadonlyMap<string, AnyRecord>>;
  /** The table for nested rows (display `'table'`), passed in so displays don't import it. */
  Table?: ComponentType<ResourceTableProps>;
}

export const RenderEnvContext = createContext<RenderEnv>({
  basePathOf: (name) => `/${name}`,
  related: new Map(),
});
