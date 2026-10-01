/**
 * The list table: columns, server-side sort and filters (controlled by list state), pagination,
 * row actions, keyboard-reachable rows, and batched labels for relation cells.
 */
import { FilterFilled } from '@ant-design/icons';
import { useQueries } from '@tanstack/react-query';
import { Button, Flex, Table, type TableColumnType, type TableProps } from 'antd';
import { useMemo, useState, type ReactNode } from 'react';
import type { AnyRecord } from '../core/data-provider.ts';
import { recordId } from '../core/data-provider.ts';
import type { ListState } from '../core/list-state.ts';
import { getPath } from '../core/path.ts';
import { resourceKeys } from '../core/query-keys.ts';
import type { NormalizedField, NormalizedResource } from '../core/resource.ts';
import type { PredicateOps, Where } from '../core/where.ts';
import { useInsta } from '../react/context.tsx';
import { fetchRecordsByIds } from '../react/data.ts';
import { FieldDisplay, FilterControl, RenderEnvContext, type RenderEnv } from './fields.tsx';

/** Related records for relation cells, one request per related resource per page. */
export function useRelatedRecords(rows: AnyRecord[], fields: NormalizedField[]) {
  const { dataProvider, ctx, resources } = useInsta();
  const requests = useMemo(() => {
    const byTarget = new Map<string, Set<string>>();
    for (const field of fields) {
      const target = field.type === 'relation' ? field.props.resource : undefined;
      if (!target || !resources.has(target)) continue;
      for (const row of rows) {
        const raw = getPath(row, field.key);
        for (const item of Array.isArray(raw) ? raw : [raw]) {
          if (item === undefined || item === null || item === '' || typeof item === 'object')
            continue;
          if (!byTarget.has(target)) byTarget.set(target, new Set());
          byTarget.get(target)!.add(String(item));
        }
      }
    }
    return [...byTarget].map(([target, ids]) => ({ target, ids: [...ids].sort() }));
  }, [fields, rows, resources]);

  // `combine` output is structurally shared by TanStack Query, so it is stable between renders.
  const datas = useQueries({
    queries: requests.map(({ target, ids }) => ({
      queryKey: resourceKeys.many(target, ids, ctx),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchRecordsByIds(dataProvider, resources.get(target)!.ref, ids, ctx, signal),
      staleTime: 60_000,
    })),
    combine: (results) => results.map((r) => r.data),
  });
  return useMemo(() => {
    const map = new Map<string, Map<string, AnyRecord>>();
    requests.forEach(({ target }, i) => {
      const data = datas[i];
      if (data) map.set(target, data);
    });
    return map;
  }, [requests, datas]);
}

export interface ResourceTableProps {
  resource: NormalizedResource;
  rows: AnyRecord[];
  total?: number;
  loading?: boolean;
  list: ListState;
  onListChange(next: ListState): void;
  onRowOpen?(record: AnyRecord): void;
  renderActions?(record: AnyRecord): ReactNode;
  basePathOf(resource: string): string;
}

type Filter = Record<string, PredicateOps>;

export function ResourceTable({
  resource,
  rows,
  total,
  loading,
  list,
  onListChange,
  onRowOpen,
  renderActions,
  basePathOf,
}: ResourceTableProps) {
  const { messages } = useInsta();
  const columns = useMemo(() => resource.fields.filter((f) => f.list !== false), [resource.fields]);
  const related = useRelatedRecords(rows, columns);
  const renderEnv = useMemo<RenderEnv>(() => ({ basePathOf, related }), [basePathOf, related]);
  const filter = list.filter as Filter;

  const tableColumns = useMemo(() => {
    const cols: TableColumnType<AnyRecord>[] = columns.map((field) => {
      const sort = list.sort.find((s) => s.field === field.key);
      const listOptions = field.list === false ? {} : field.list;
      const column: TableColumnType<AnyRecord> = {
        key: field.key,
        title: field.label,
        width: listOptions.width,
        fixed:
          listOptions.pin === 'start' ? 'left' : listOptions.pin === 'end' ? 'right' : undefined,
        render: (_: unknown, record: AnyRecord) => (
          <FieldDisplay
            value={getPath(record, field.key)}
            record={record}
            field={field}
            resource={resource}
          />
        ),
      };
      if (listOptions.sortable) {
        column.sorter = true;
        column.sortOrder = sort ? (sort.order === 'asc' ? 'ascend' : 'descend') : null;
      }
      if (field.filter !== false) {
        column.filtered = filter[field.key] !== undefined;
        column.filterIcon = (active: boolean) => (
          <FilterFilled
            style={{ color: active ? 'var(--ant-color-primary, #1677ff)' : undefined }}
          />
        );
        column.filterDropdown = ({ close }) => (
          <FilterPanel
            field={field}
            value={filter[field.key]}
            messages={messages}
            onApply={(next) => {
              const nextFilter: Filter = { ...filter };
              if (next) nextFilter[field.key] = next;
              else delete nextFilter[field.key];
              onListChange({ ...list, page: 1, filter: nextFilter as Where });
              close();
            }}
          />
        );
      }
      return column;
    });
    if (renderActions) {
      cols.push({
        key: '__actions',
        title: messages.actions,
        fixed: 'right',
        render: (_: unknown, record: AnyRecord) => renderActions(record),
      });
    }
    return cols;
  }, [columns, list, filter, messages, onListChange, renderActions, resource]);

  const onChange: TableProps<AnyRecord>['onChange'] = (pagination, _filters, sorter) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    const key = single?.columnKey === undefined ? undefined : String(single.columnKey);
    const sort =
      key && single?.order
        ? [{ field: key, order: single.order === 'ascend' ? ('asc' as const) : ('desc' as const) }]
        : [];
    const pageSize = pagination.pageSize ?? list.pageSize;
    const page = pageSize !== list.pageSize ? 1 : (pagination.current ?? 1);
    onListChange({ ...list, page, pageSize, sort });
  };

  return (
    <RenderEnvContext.Provider value={renderEnv}>
      <Table<AnyRecord>
        rowKey={(r) => String(recordId(resource.ref, r) ?? JSON.stringify(r))}
        dataSource={rows}
        columns={tableColumns}
        loading={loading}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: messages.noData }}
        pagination={{
          current: list.page,
          pageSize: list.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (count) => messages.total(count),
        }}
        onChange={onChange}
        onRow={
          onRowOpen
            ? (record) => ({
                tabIndex: 0,
                style: { cursor: 'pointer' },
                onClick: () => onRowOpen(record),
                onKeyDown: (e) => {
                  if (e.key === 'Enter') onRowOpen(record);
                },
              })
            : undefined
        }
      />
    </RenderEnvContext.Provider>
  );
}

function FilterPanel({
  field,
  value,
  messages,
  onApply,
}: {
  field: NormalizedField;
  value: PredicateOps | undefined;
  messages: { filter: string; reset: string };
  onApply(next: PredicateOps | undefined): void;
}) {
  const [draft, setDraft] = useState<PredicateOps | undefined>(value);
  return (
    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
      <Flex vertical gap={8}>
        <FilterControl field={field} value={draft} onChange={setDraft} />
        <Flex gap={8}>
          <Button type="primary" size="small" onClick={() => onApply(draft)}>
            {messages.filter}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setDraft(undefined);
              onApply(undefined);
            }}
          >
            {messages.reset}
          </Button>
        </Flex>
      </Flex>
    </div>
  );
}
