import type { AnyRecord, DataProvider, InstaContext } from '../../core/data-provider.ts';
import type { NormalizedResource } from '../../core/resource.ts';
import type { Notify } from '../notify.tsx';

/** Props given to `components.page | detail | create | edit | rowActions`. */
export interface ViewProps {
  resource: NormalizedResource;
  dataProvider: DataProvider;
  ctx: InstaContext;
  record?: AnyRecord;
  refresh(): Promise<void>;
  close(): void;
  navigate(to: string): void;
  notify: Notify;
}
