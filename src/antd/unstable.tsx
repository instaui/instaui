/**
 * Building blocks for custom screens. Exported with an `unstable_` prefix: outside semver until
 * real custom forms have proven the API.
 */
import { Spin } from 'antd';
import type { AnyRecord, Id } from '../core/data-provider.ts';
import type { FormMode } from '../core/resource.ts';
import { useResource } from '../react/context.tsx';
import { useResourceRecord } from '../react/data.ts';
import { useNotify } from './notify.tsx';
import { ResourceDetail } from './ResourceDetail.tsx';
import { ResourceForm } from './ResourceForm.tsx';
import { defaultBasePathOf } from '../react/routes.ts';

export interface UnstableResourceFormProps {
  resource: string;
  mode: FormMode;
  /** Edit mode: the record id (loaded if `record` is not given). */
  id?: Id;
  record?: AnyRecord;
  onDone?(saved?: AnyRecord): void;
  onCancel?(): void;
}

export function UnstableResourceForm({
  resource: name,
  mode,
  id,
  record,
  onDone,
  onCancel,
}: UnstableResourceFormProps) {
  const resource = useResource(name);
  const { notify, holder } = useNotify();
  const loaded = useResourceRecord(name, id, { enabled: mode === 'edit' && record === undefined });
  const current = record ?? loaded.data;
  if (mode === 'edit' && !current) return <Spin />;
  return (
    <>
      {holder}
      <ResourceForm
        key={`${name}:${id ?? 'new'}:${mode}`}
        resource={resource}
        mode={mode}
        record={mode === 'edit' ? current : undefined}
        id={id}
        notify={notify}
        onDone={(saved) => onDone?.(saved)}
        onCancel={() => onCancel?.()}
      />
    </>
  );
}

export interface UnstableResourceDetailProps {
  resource: string;
  id?: Id;
  record?: AnyRecord;
  basePathOf?(resource: string): string;
}

export function UnstableResourceDetail({
  resource: name,
  id,
  record,
  basePathOf = defaultBasePathOf,
}: UnstableResourceDetailProps) {
  const resource = useResource(name);
  const loaded = useResourceRecord(name, id, { enabled: record === undefined });
  const current = record ?? loaded.data;
  return current ? (
    <ResourceDetail resource={resource} record={current} basePathOf={basePathOf} />
  ) : (
    <Spin />
  );
}
