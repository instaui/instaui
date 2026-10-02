/** Built-in widgets: the form input for each field type. */
import { DatePicker, Input, InputNumber, Radio, Select, Switch, TimePicker } from 'antd';
import type dayjs from 'dayjs';
import type { ComponentType } from 'react';
import type { AnyRecord, Id } from '../../core/data-provider.ts';
import type { FormMode, NormalizedField } from '../../core/resource.ts';
import type { Where } from '../../core/where.ts';
import { RelationSelect } from '../RelationSelect.tsx';

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
