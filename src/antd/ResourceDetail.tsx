import { Descriptions, Drawer, Modal } from 'antd';
import { useMemo, type ReactNode } from 'react';
import type { AnyRecord } from '../core/data-provider.ts';
import { getPath } from '../core/path.ts';
import { conditionMet, type ContainerOptions, type NormalizedResource } from '../core/resource.ts';
import { useInsta } from '../react/context.tsx';
import { drawerWidth } from './compat.ts';
import { FieldDisplay, RenderEnvContext } from './fields.tsx';
import { useRelatedRecords } from './ResourceTable.tsx';

export function ResourceDetail({
  resource,
  record,
  basePathOf,
}: {
  resource: NormalizedResource;
  record: AnyRecord;
  basePathOf(resource: string): string;
}) {
  const { ctx } = useInsta();
  const fields = useMemo(
    () => resource.fields.filter((f) => f.detail && conditionMet(f.visibleIf, record, ctx)),
    [resource.fields, record, ctx],
  );
  const rows = useMemo(() => [record], [record]);
  const related = useRelatedRecords(rows, fields);
  return (
    <RenderEnvContext.Provider value={{ basePathOf, related }}>
      <Descriptions
        column={1}
        bordered
        size="small"
        items={fields.map((field) => ({
          key: field.key,
          label: field.label,
          children: (
            <FieldDisplay
              value={getPath(record, field.key)}
              record={record}
              field={field}
              resource={resource}
            />
          ),
        }))}
      />
    </RenderEnvContext.Provider>
  );
}

/** Modal, drawer or inline page, per the resource's container options. */
export function Container({
  options,
  open,
  title,
  onClose,
  footer,
  children,
}: {
  options: ContainerOptions;
  open: boolean;
  title: ReactNode;
  onClose(): void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (options.type === 'page')
    return open ? (
      <section aria-label={typeof title === 'string' ? title : undefined}>
        {children}
        {footer}
      </section>
    ) : null;
  if (options.type === 'drawer') {
    return (
      <Drawer
        open={open}
        title={title}
        onClose={onClose}
        destroyOnHidden
        footer={footer}
        {...drawerWidth(options.width)}
      >
        {children}
      </Drawer>
    );
  }
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      footer={footer ?? null}
      width={options.width}
      destroyOnHidden
    >
      {children}
    </Modal>
  );
}
