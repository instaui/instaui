/** What cells and detail fields share: relation links and prefetched related records. */
import { createContext } from 'react';
import type { AnyRecord } from '../../core/data-provider.ts';

export interface RenderEnv {
  /** Base path per resource name, for relation links. */
  basePathOf(resource: string): string;
  /** Prefetched related records: resource → id → record. */
  related: ReadonlyMap<string, ReadonlyMap<string, AnyRecord>>;
}

export const RenderEnvContext = createContext<RenderEnv>({
  basePathOf: (name) => `/${name}`,
  related: new Map(),
});
