/**
 * A controlled, server-searched relation select: works inside a `Form.Item` (value/onChange are
 * injected) or standalone. Labels for already-selected values are fetched by id, so the select
 * never shows a raw id.
 */
import { Select, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { AnyRecord, Id, InstaContext } from '../core/data-provider.ts';
import { recordId } from '../core/data-provider.ts';
import { recordLabel } from '../core/label.ts';
import type { Where } from '../core/where.ts';
import { debounce } from '../utils/debounce.ts';
import { InstaConfigOverride, useInsta, useResource, useScopedConfig } from '../react/context.tsx';
import { useRecordsByIds, useRelationOptions } from '../react/data.ts';
import { valuesOf } from '../core/value.ts';

export interface RelationSelectProps {
  /** Target resource name. */
  resource: string;
  value?: Id | Id[] | null;
  onChange?: (value: Id | Id[] | undefined, record?: AnyRecord | AnyRecord[]) => void;
  multiple?: boolean;
  /** Extra filter for options (already resolved; no `$var`). */
  params?: Where;
  /** `{…}` label template; defaults to the target's `recordLabel`. */
  label?: string;
  searchFields?: string[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  id?: string;
  status?: 'error' | 'warning';
  style?: React.CSSProperties;
  /** Extra context for this picker's queries, e.g. `{ orderId }` for `orders/{ctx.orderId}/items`. */
  ctx?: InstaContext;
}

const asIds = (v: RelationSelectProps['value']): Id[] => valuesOf(v);

/** With `ctx`, the picker's queries use that context too (fills `{ctx.x}` in the target's path). */
export function RelationSelect({ ctx, ...props }: RelationSelectProps) {
  const config = useScopedConfig(ctx);
  if (!ctx) return <Picker {...props} />;
  return (
    <InstaConfigOverride value={config}>
      <Picker {...props} />
    </InstaConfigOverride>
  );
}

function Picker({
  resource: name,
  value,
  onChange,
  multiple = false,
  params,
  label,
  searchFields,
  placeholder,
  disabled,
  allowClear = true,
  id,
  status,
  style,
}: Omit<RelationSelectProps, 'ctx'>) {
  const target = useResource(name);
  const { messages } = useInsta();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const update = useMemo(() => debounce((s: string) => setDebounced(s), 300), []);
  useEffect(() => () => update.cancel(), [update]);

  // Options load lazily, when the dropdown opens: N relation fields no longer mean N requests.
  const options = useRelationOptions({
    resource: name,
    search: debounced,
    filter: params,
    searchFields,
    enabled: open,
  });
  const selected = useMemo(() => asIds(value), [value]);
  const known = useMemo(
    () => new Map(options.records.map((r) => [String(recordId(target.ref, r)), r])),
    [options.records, target.ref],
  );
  const missing = useMemo(() => selected.filter((s) => !known.has(String(s))), [selected, known]);
  const byId = useRecordsByIds(missing.length > 0 ? name : undefined, missing);

  const selectOptions = useMemo(() => {
    const toOption = (r: AnyRecord) => ({
      value: recordId(target.ref, r) as Id,
      label: recordLabel(target, r, label),
    });
    const list = options.records.map(toOption);
    for (const s of missing) {
      const r = byId.data?.get(String(s));
      list.unshift({ value: s, label: r ? recordLabel(target, r, label) : String(s) });
    }
    return list;
  }, [options.records, missing, byId.data, target, label]);

  return (
    <Select<Id | Id[]>
      id={id}
      style={{ width: '100%', ...style }}
      status={status}
      mode={multiple ? 'multiple' : undefined}
      value={multiple ? selected : (selected[0] ?? undefined)}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      showSearch
      filterOption={false}
      searchValue={search}
      onSearch={(s) => {
        setSearch(s);
        update(s);
      }}
      onOpenChange={setOpen}
      loading={options.isFetching}
      notFoundContent={options.isFetching ? <Spin size="small" /> : messages.noData}
      options={selectOptions}
      onPopupScroll={(e) => {
        const el = e.currentTarget;
        if (
          el.scrollTop + el.clientHeight >= el.scrollHeight - 24 &&
          options.hasNextPage &&
          !options.isFetchingNextPage
        ) {
          void options.fetchNextPage();
        }
      }}
      onChange={(next) => {
        const ids = asIds(next as Id | Id[]);
        const records = ids
          .map((i) => known.get(String(i)) ?? byId.data?.get(String(i)))
          .filter(Boolean) as AnyRecord[];
        if (multiple) onChange?.(ids, records);
        else onChange?.(ids[0], records[0]);
      }}
    />
  );
}
