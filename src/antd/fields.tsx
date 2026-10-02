/**
 * Built-in widgets (inputs), displays (cells/detail) and filters, keyed by field type.
 * Custom ones are registered on `<InstaProvider registry={{ widgets, displays }}>` or set per field.
 */
import {
  DatePicker,
  Image,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { createContext, useContext, useState, type ComponentType, type ReactNode } from 'react';
import { codecFor } from '../core/codecs.ts';
import type { AnyRecord, Id } from '../core/data-provider.ts';
import { recordLabel } from '../core/label.ts';
import type { ListState } from '../core/list-state.ts';
import type { FormMode, NormalizedField, NormalizedResource } from '../core/resource.ts';
import { safeUrl } from '../core/safe-url.ts';
import type { PredicateOps, Where } from '../core/where.ts';
import { useInsta } from '../react/context.tsx';
import { makeLink } from '../react/router.ts';
import { buildPath } from '../react/routes.ts';
import { RelationSelect } from './RelationSelect.tsx';
import { ResourceTable } from './ResourceTable.tsx';

// ─── shared context ──────────────────────────────────────────────────────────

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

// ─── displays ────────────────────────────────────────────────────────────────

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
  const codecs = registry.codecs as Parameters<typeof codecFor>[1];
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
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ''
      ? []
      : [value];
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
  if (value === undefined || value === null || value === '') return null;
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{text}</pre>;
}

function CopyableDisplay({ value }: DisplayProps) {
  if (value === undefined || value === null || value === '') return null;
  return <Typography.Text copyable>{String(value)}</Typography.Text>;
}

function RelationDisplay({ value, field }: DisplayProps) {
  const { resources, router } = useInsta();
  const { basePathOf, related } = useContext(RenderEnvContext);
  const routerApi = router.useRouter();
  const targetName = field.props.resource;
  const target = targetName ? resources.get(targetName) : undefined;
  const items = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ''
      ? []
      : [value];
  if (!target) return <>{items.map(String).join(', ')}</>;
  const Link = router.Link ?? makeLink(routerApi);
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
  const { basePathOf } = useContext(RenderEnvContext);
  const [list, setList] = useState<ListState>({ page: 1, pageSize: 10, sort: [], filter: {} });
  const target = field.props.resource ? resources.get(field.props.resource) : undefined;
  const rows = Array.isArray(value) ? (value as AnyRecord[]) : [];
  if (!target) return <>{rows.length}</>;
  const start = (list.page - 1) * list.pageSize;
  return (
    <ResourceTable
      resource={target}
      rows={rows.slice(start, start + list.pageSize)}
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
    ...(registry.displays as Record<string, ComponentType<DisplayProps>> | undefined),
  };
  const Display = displays[key] ?? TextDisplay;
  return <Display {...props} />;
}

// ─── widgets ─────────────────────────────────────────────────────────────────

export interface WidgetProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  id?: string;
  field: NormalizedField;
  mode: FormMode;
  disabled?: boolean;
  /** Current form values (for dependent widgets). */
  values: AnyRecord;
  /** Relation params with `$var` already resolved. */
  params?: Where;
}

const pickerFormat = (field: NormalizedField, fallback: string) =>
  typeof field.props.format === 'string' ? field.props.format : fallback;

export const builtinWidgets: Record<string, ComponentType<WidgetProps>> = {
  input: ({ value, onChange, id, disabled, field }) => (
    <Input
      id={id}
      value={(value as string) ?? ''}
      disabled={disabled}
      placeholder={field.placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  textarea: ({ value, onChange, id, disabled, field }) => (
    <Input.TextArea
      id={id}
      rows={4}
      value={(value as string) ?? ''}
      disabled={disabled}
      placeholder={field.placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  password: ({ value, onChange, id, disabled }) => (
    <Input.Password
      id={id}
      value={(value as string) ?? ''}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  email: ({ value, onChange, id, disabled, field }) => (
    <Input
      id={id}
      type="email"
      value={(value as string) ?? ''}
      disabled={disabled}
      placeholder={field.placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  url: ({ value, onChange, id, disabled, field }) => (
    <Input
      id={id}
      type="url"
      value={(value as string) ?? ''}
      disabled={disabled}
      placeholder={field.placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  number: ({ value, onChange, id, disabled, field }) => (
    <InputNumber
      id={id}
      style={{ width: '100%' }}
      value={value as number | null | undefined}
      disabled={disabled}
      min={field.props.min}
      max={field.props.max}
      precision={field.props.precision}
      placeholder={field.placeholder}
      onChange={(v) => onChange?.(v ?? undefined)}
    />
  ),
  switch: ({ value, onChange, id, disabled }) => (
    <Switch
      id={id}
      checked={value === true}
      disabled={disabled}
      onChange={(checked) => onChange?.(checked)}
    />
  ),
  date: ({ value, onChange, id, disabled, field }) => (
    <DatePicker
      id={id}
      style={{ width: '100%' }}
      value={value as dayjs.Dayjs | undefined}
      disabled={disabled}
      format={pickerFormat(field, 'YYYY-MM-DD')}
      onChange={(d) => onChange?.(d ?? undefined)}
    />
  ),
  datetime: ({ value, onChange, id, disabled, field }) => (
    <DatePicker
      id={id}
      style={{ width: '100%' }}
      showTime
      value={value as dayjs.Dayjs | undefined}
      disabled={disabled}
      format={pickerFormat(field, 'YYYY-MM-DD HH:mm')}
      onChange={(d) => onChange?.(d ?? undefined)}
    />
  ),
  time: ({ value, onChange, id, disabled, field }) => (
    <TimePicker
      id={id}
      style={{ width: '100%' }}
      value={value as dayjs.Dayjs | undefined}
      disabled={disabled}
      format={pickerFormat(field, 'HH:mm')}
      onChange={(d) => onChange?.(d ?? undefined)}
    />
  ),
  select: ({ value, onChange, id, disabled, field }) => (
    <Select
      id={id}
      style={{ width: '100%' }}
      mode={field.props.multiple ? 'multiple' : undefined}
      allowClear
      value={value as never}
      disabled={disabled}
      placeholder={field.placeholder}
      options={(field.props.options ?? []).map((o) => ({
        value: o.value as string | number,
        label: o.label,
      }))}
      onChange={(v) => onChange?.(v)}
    />
  ),
  radio: ({ value, onChange, id, disabled, field }) => (
    <Radio.Group
      id={id}
      value={value}
      disabled={disabled}
      options={(field.props.options ?? []).map((o) => ({
        value: o.value as string | number,
        label: o.label,
      }))}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
  tags: ({ value, onChange, id, disabled, field }) => (
    <Select
      id={id}
      mode="tags"
      style={{ width: '100%' }}
      // e.g. `props.tokenSeparators: [',', '\n']` turns a pasted column into separate values
      tokenSeparators={field.props.tokenSeparators as string[] | undefined}
      value={(value as string[]) ?? []}
      disabled={disabled}
      placeholder={field.placeholder}
      onChange={(v) => onChange?.(v)}
    />
  ),
  relation: ({ value, onChange, id, disabled, field, params }) => (
    <RelationSelect
      id={id}
      resource={field.props.resource ?? ''}
      multiple={field.props.multiple}
      label={field.props.label}
      searchFields={field.props.searchFields}
      params={params}
      placeholder={field.placeholder}
      disabled={disabled}
      value={value as Id | Id[] | undefined}
      onChange={(v) => onChange?.(v)}
    />
  ),
  json: ({ value, onChange, id, disabled }) => (
    <Input.TextArea
      id={id}
      rows={6}
      spellCheck={false}
      style={{ fontFamily: 'monospace' }}
      value={(value as string) ?? ''}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
};

const DEFAULT_WIDGET: Record<string, string> = {
  text: 'input',
  number: 'number',
  boolean: 'switch',
  date: 'date',
  datetime: 'datetime',
  time: 'time',
  enum: 'select',
  tags: 'tags',
  relation: 'relation',
  json: 'json',
};

export function resolveWidget(
  field: NormalizedField,
  registry: Record<string, unknown>,
): ComponentType<WidgetProps> {
  const custom = field.widget;
  if (typeof custom === 'function') return custom as ComponentType<WidgetProps>;
  const widgets = {
    ...builtinWidgets,
    ...(registry.widgets as Record<string, ComponentType<WidgetProps>> | undefined),
  };
  const key = typeof custom === 'string' ? custom : (DEFAULT_WIDGET[field.type] ?? 'input');
  return widgets[key] ?? builtinWidgets.input!;
}

// ─── filters ─────────────────────────────────────────────────────────────────

export interface FilterControlProps {
  field: NormalizedField;
  value: PredicateOps | undefined;
  onChange(next: PredicateOps | undefined): void;
}

const emptyToUndefined = (ops: PredicateOps) =>
  Object.values(ops).every(
    (v) => v === undefined || v === '' || (Array.isArray(v) && v.length === 0),
  )
    ? undefined
    : ops;

/** The filter input for a field type; returns a predicate for the list's `Where`. */
export function FilterControl({ field, value, onChange }: FilterControlProps) {
  const { messages } = useInsta();
  const filterOptions = field.filter === false ? {} : field.filter;
  const kind = filterOptions.widget ?? field.type;
  const multiple = filterOptions.multiple ?? true;
  const options = (field.props.options ?? []).map((o) => ({
    value: o.value as string | number,
    label: o.label,
  }));
  switch (kind) {
    case 'number':
      return (
        <Space.Compact>
          <InputNumber
            aria-label={`${field.label} ${messages.min}`}
            placeholder={messages.min}
            value={value?.$gte as number | undefined}
            onChange={(v) => onChange(emptyToUndefined({ ...value, $gte: v ?? undefined }))}
          />
          <InputNumber
            aria-label={`${field.label} ${messages.max}`}
            placeholder={messages.max}
            value={value?.$lte as number | undefined}
            onChange={(v) => onChange(emptyToUndefined({ ...value, $lte: v ?? undefined }))}
          />
        </Space.Compact>
      );
    case 'boolean':
      return (
        <Select
          aria-label={field.label}
          style={{ width: 160 }}
          allowClear
          value={value?.$eq as boolean | undefined}
          options={[
            { value: true, label: messages.yes },
            { value: false, label: messages.no },
          ]}
          onChange={(v) => onChange(v === undefined ? undefined : { $eq: v })}
        />
      );
    case 'enum':
    case 'tags':
      if (kind === 'enum' && !multiple) {
        return (
          <Select
            aria-label={field.label}
            style={{ width: 220 }}
            allowClear
            value={value?.$eq as string | number | undefined}
            options={options}
            onChange={(v: string | number | undefined) =>
              onChange(v === undefined ? undefined : { $eq: v })
            }
          />
        );
      }
      return (
        <Select
          aria-label={field.label}
          style={{ width: 220 }}
          mode={field.type === 'tags' ? 'tags' : 'multiple'}
          allowClear
          value={(value?.$in as (string | number)[] | undefined) ?? []}
          options={options}
          onChange={(v: (string | number)[]) => onChange(v.length ? { $in: v } : undefined)}
        />
      );
    case 'relation':
      return (
        <RelationSelect
          resource={field.props.resource ?? ''}
          multiple={multiple}
          label={field.props.label}
          style={{ width: 240 }}
          value={
            multiple ? ((value?.$in as Id[] | undefined) ?? []) : (value?.$eq as Id | undefined)
          }
          onChange={(v) =>
            onChange(
              multiple
                ? Array.isArray(v) && v.length
                  ? { $in: v }
                  : undefined
                : v === undefined || Array.isArray(v)
                  ? undefined
                  : { $eq: v },
            )
          }
        />
      );
    case 'date':
    case 'datetime': {
      const range = value?.$between as [string, string] | undefined;
      const encode = (d: dayjs.Dayjs) =>
        field.type === 'date' ? d.format('YYYY-MM-DD') : d.toISOString();
      return (
        <DatePicker.RangePicker
          aria-label={field.label}
          showTime={field.type === 'datetime'}
          value={range ? [dayjs(range[0]), dayjs(range[1])] : null}
          onChange={(r) =>
            onChange(
              r && r[0] && r[1]
                ? {
                    $between: [
                      encode(r[0]),
                      encode(field.type === 'date' ? r[1] : r[1].endOf('minute')),
                    ],
                  }
                : undefined,
            )
          }
        />
      );
    }
    default:
      return (
        <Input
          aria-label={field.label}
          allowClear
          placeholder={messages.search}
          value={(value?.$contains as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value ? { $contains: e.target.value } : undefined)}
        />
      );
  }
}
