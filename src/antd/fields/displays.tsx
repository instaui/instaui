/** Built-in displays: how a value is shown in list cells and the detail view. */
import { Image, Tag, Typography } from 'antd';
import { useContext, useState, type ComponentType, type ReactNode } from 'react';
import { codecFor } from '../../core/codecs.ts';
import type { AnyRecord, Id } from '../../core/data-provider.ts';
import { recordLabel } from '../../core/label.ts';
import type { ListState } from '../../core/list-state.ts';
import type { NormalizedField, NormalizedResource } from '../../core/resource.ts';
import { safeUrl } from '../../core/safe-url.ts';
import { useInsta } from '../../react/context.tsx';
import { useLink } from '../../react/link.ts';
import { buildPath } from '../../react/routes.ts';
import { antdRegistry } from '../registry.ts';
import { RenderEnvContext } from './context.ts';
import { isBlank, pageOf, valuesOf } from '../../core/value.ts';

export interface DisplayProps {
  value: unknown;
  record: AnyRecord;
  field: NormalizedField;
  resource: NormalizedResource;
  /** Where the value is shown: a list cell or the detail view. */
  context?: 'list' | 'detail';
}

function TextDisplay({ value, field }: DisplayProps) {
  const { env, registry } = useInsta();
  const codecs = registry.codecs;
  return <>{codecFor(field.type, codecs).toText(value, { ...env, props: field.props })}</>;
}

function LinkDisplay({ value }: DisplayProps) {
  const href = safeUrl(value);
  if (!href) return <>{typeof value === 'string' ? value : ''}</>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
      {href}
    </a>
  );
}

function ImageDisplay({ value, field }: DisplayProps) {
  const src = safeUrl(value);
  return src ? <Image src={src} alt={field.label} width={48} /> : null;
}

function TagDisplay({ value, field }: DisplayProps) {
  const options = field.props.options ?? [];
  const values = valuesOf(value);
  return (
    <>
      {values.map((v) => {
        const option = options.find((o) => o.value === v);
        return (
          <Tag key={String(v)} color={option?.color}>
            {option?.label ?? String(v)}
          </Tag>
        );
      })}
    </>
  );
}

function JsonDisplay({ value }: DisplayProps) {
  if (isBlank(value)) return null;
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{text}</pre>;
}

function CopyableDisplay({ value }: DisplayProps) {
  if (isBlank(value)) return null;
  return <Typography.Text copyable>{String(value)}</Typography.Text>;
}

function RelationDisplay({ value, field }: DisplayProps) {
  const { resources } = useInsta();
  const { basePathOf, related } = useContext(RenderEnvContext);
  const Link = useLink();
  const targetName = field.props.resource;
  const target = targetName ? resources.get(targetName) : undefined;
  const items = valuesOf(value);
  if (!target) return <>{items.map(String).join(', ')}</>;
  const idField = typeof target.idField === 'string' ? target.idField : 'id';
  return (
    <>
      {items.map((item, i) => {
        const nested = item !== null && typeof item === 'object' ? (item as AnyRecord) : undefined;
        const id = (nested ? nested[idField] : item) as Id;
        const record = nested ?? related.get(target.name)?.get(String(id));
        const label = record ? recordLabel(target, record, field.props.label) : String(id);
        const link = field.props.link ?? 'route';
        return (
          <span key={String(id)}>
            {i > 0 ? ', ' : null}
            {link === 'none' ? (
              label
            ) : (
              <span onClick={(e) => e.stopPropagation()}>
                <Link to={buildPath(basePathOf(target.name), 'detail', id)}>{label}</Link>
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}

/**
 * Nested rows that come inside a record (an array of objects), shown as a table with the columns
 * of the resource named by `props.resource`. Paged in the browser.
 */
function TableDisplay({ value, field }: DisplayProps) {
  const { resources } = useInsta();
  const { basePathOf, Table } = useContext(RenderEnvContext);
  const [list, setList] = useState<ListState>({ page: 1, pageSize: 10, sort: [], filter: {} });
  const target = field.props.resource ? resources.get(field.props.resource) : undefined;
  const rows = Array.isArray(value) ? (value as AnyRecord[]) : [];
  if (!target || !Table) return <>{rows.length}</>;
  return (
    <Table
      resource={target}
      rows={pageOf(rows, list.page, list.pageSize)}
      total={rows.length}
      list={list}
      onListChange={setList}
      basePathOf={basePathOf}
    />
  );
}

export const builtinDisplays: Record<string, ComponentType<DisplayProps>> = {
  text: TextDisplay,
  link: LinkDisplay,
  image: ImageDisplay,
  tag: TagDisplay,
  json: JsonDisplay,
  copyable: CopyableDisplay,
  relation: RelationDisplay,
  table: TableDisplay,
};

const defaultDisplayFor = (field: NormalizedField): string =>
  field.type === 'relation' ? 'relation' : field.type === 'json' ? 'json' : 'text';

export function FieldDisplay(props: DisplayProps): ReactNode {
  const { registry } = useInsta();
  const custom = props.field.display;
  if (typeof custom === 'function') {
    const Custom = custom as ComponentType<DisplayProps>;
    return <Custom {...props} />;
  }
  const key = typeof custom === 'string' ? custom : defaultDisplayFor(props.field);
  const displays = {
    ...builtinDisplays,
    ...antdRegistry(registry).displays,
  };
  const Display = displays[key] ?? TextDisplay;
  return <Display {...props} />;
}
