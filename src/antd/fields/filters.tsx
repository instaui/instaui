/** Column filter controls, by field type. */
import { DatePicker, Input, InputNumber, Select, Space } from 'antd';
import dayjs from 'dayjs';
import type { Id } from '../../core/data-provider.ts';
import type { NormalizedField } from '../../core/resource.ts';
import type { PredicateOps } from '../../core/where.ts';
import { useInsta } from '../../react/context.tsx';
import { RelationSelect } from '../RelationSelect.tsx';

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
