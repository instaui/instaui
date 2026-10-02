import { useCallback, useEffect, useState } from 'react';
import type { AnyRecord } from '../../core/data-provider.ts';

export interface Selection {
  keys: string[];
  rows: AnyRecord[];
}

const NONE: Selection = { keys: [], rows: [] };

/** Rows ticked for bulk actions. Cleared whenever `scopeKey` (the list on screen) changes. */
export function useSelection(scopeKey: string) {
  const [selection, setSelection] = useState<Selection>(NONE);
  const clear = useCallback(() => setSelection(NONE), []);
  useEffect(clear, [scopeKey, clear]);
  return { selection, setSelection, clear };
}
