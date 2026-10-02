import { Flex, Input, Segmented, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { ListState } from '../../core/list-state.ts';
import type { NormalizedResource } from '../../core/resource.ts';
import { useInsta } from '../../react/context.tsx';
import { FilterBar } from '../FilterBar.tsx';

/** Title, search, toolbar, tabs and the filter bar above a list. */
export function ListHeader({
  resource,
  title,
  list,
  onListChange,
  toolbar,
}: {
  resource: NormalizedResource;
  title?: ReactNode | false;
  list: ListState;
  onListChange(next: ListState): void;
  toolbar: ReactNode;
}) {
  const { messages } = useInsta();
  const tabs = resource.list.tabs;
  return (
    <>
      <Flex justify="space-between" align="center" gap={12} wrap style={{ marginBottom: 16 }}>
        {title === false ? (
          <span />
        ) : (
          <Typography.Title level={4} style={{ margin: 0 }}>
            {title ?? resource.label.other}
          </Typography.Title>
        )}
        <Flex gap={8} align="center" wrap>
          {resource.list.search ? (
            <Input.Search
              aria-label={messages.search}
              placeholder={messages.search}
              allowClear
              defaultValue={list.search}
              onSearch={(q) => onListChange({ ...list, page: 1, search: q || undefined })}
              style={{ width: 240 }}
            />
          ) : null}
          {toolbar}
        </Flex>
      </Flex>
      {tabs.length > 1 ? (
        <Segmented
          style={{ marginBottom: 12 }}
          value={list.tab ?? tabs[0]!.key}
          options={tabs.map((t) => ({ value: t.key, label: t.label }))}
          onChange={(key) =>
            onListChange({ ...list, page: 1, tab: key === tabs[0]!.key ? undefined : String(key) })
          }
        />
      ) : null}
      {resource.list.filterBar ? (
        <FilterBar
          resource={resource}
          list={list}
          onListChange={onListChange}
          savedViews={resource.list.filterBar.savedViews}
        />
      ) : null}
    </>
  );
}
