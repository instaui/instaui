/**
 * Active-filter chips (clear one / clear all) and optional saved views. A saved view stores the
 * filters, search and tab only, never the page or sort, so it describes *what* you are looking at.
 * Views live in this browser's localStorage; when storage is unavailable there are simply none.
 */
import { CloseOutlined, DeleteOutlined, FilterOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Select, Tag, Typography, theme } from 'antd';
import { useState } from 'react';
import { codecFor } from '../core/codecs.ts';
import type { ListState } from '../core/list-state.ts';
import type { NormalizedResource } from '../core/resource.ts';
import { toConditions, type WhereCondition, type Where } from '../core/where.ts';
import { useInsta } from '../react/context.tsx';

interface SavedView {
  name: string;
  filter: Where;
  search?: string;
  tab?: string;
}

const storageKey = (resource: string) => `instaui.savedViews.${resource}`;

function readViews(resource: string): SavedView[] {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey(resource));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedView[]) : [];
  } catch {
    return [];
  }
}

function writeViews(resource: string, views: SavedView[]): boolean {
  try {
    globalThis.localStorage?.setItem(storageKey(resource), JSON.stringify(views));
    return true;
  } catch {
    return false;
  }
}

export interface FilterBarProps {
  resource: NormalizedResource;
  list: ListState;
  onListChange(next: ListState): void;
  savedViews?: boolean;
}

export function FilterBar({ resource, list, onListChange, savedViews = false }: FilterBarProps) {
  const { env, registry, messages } = useInsta();
  const { token } = theme.useToken();
  const [views, setViews] = useState<SavedView[]>(() =>
    savedViews ? readViews(resource.name) : [],
  );
  const [naming, setNaming] = useState<string>();

  const conditions = toConditions(list.filter);
  const byField = new Map<string, WhereCondition[]>();
  for (const c of conditions) byField.set(c.field, [...(byField.get(c.field) ?? []), c]);

  const describe = (fieldKey: string, items: WhereCondition[]) => {
    const field = resource.fields.find((f) => f.key === fieldKey);
    const label = field?.label ?? fieldKey;
    const text = (v: unknown) =>
      field
        ? codecFor(field.type, registry.codecs).toText(v, { ...env, props: field.props })
        : String(v);
    const parts = items.map(({ op, value }) => {
      switch (op) {
        case '$gte':
          return `≥ ${text(value)}`;
        case '$lte':
          return `≤ ${text(value)}`;
        case '$between':
          return `${text((value as unknown[])[0])} – ${text((value as unknown[])[1])}`;
        case '$contains':
          return `“${String(value)}”`;
        case '$in':
          return (value as unknown[]).map(text).join(', ');
        default:
          return text(value);
      }
    });
    return { label, value: parts.join(' ') };
  };

  const clearField = (key: string) => {
    const next = { ...(list.filter as Record<string, unknown>) };
    delete next[key];
    onListChange({ ...list, page: 1, filter: next as Where });
  };
  const hasFilters = byField.size > 0 || Boolean(list.search);
  const persist = (next: SavedView[]) => {
    setViews(next);
    writeViews(resource.name, next);
  };

  return (
    <Flex
      align="center"
      gap={8}
      wrap
      style={{
        marginBottom: 12,
        padding: '6px 12px',
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        background: token.colorFillQuaternary,
      }}
    >
      <FilterOutlined aria-hidden style={{ color: token.colorTextSecondary }} />
      {hasFilters ? null : <Typography.Text type="secondary">{messages.noFilters}</Typography.Text>}
      {[...byField].map(([key, items]) => {
        const { label, value } = describe(key, items);
        return (
          <Tag
            key={key}
            color="blue"
            closable
            closeIcon={<CloseOutlined aria-label={messages.clearFilter(label)} />}
            onClose={(e) => {
              e.preventDefault();
              clearField(key);
            }}
          >
            <strong>{label}:</strong> {value}
          </Tag>
        );
      })}
      {list.search ? (
        <Tag
          color="blue"
          closable
          onClose={(e) => (
            e.preventDefault(),
            onListChange({ ...list, page: 1, search: undefined })
          )}
        >
          <strong>{messages.search}:</strong> {list.search}
        </Tag>
      ) : null}
      {hasFilters ? (
        <Button
          size="small"
          type="link"
          onClick={() => onListChange({ ...list, page: 1, filter: {}, search: undefined })}
        >
          {messages.clearAll}
        </Button>
      ) : null}
      {savedViews ? (
        <Flex gap={8} style={{ marginInlineStart: 'auto' }}>
          {views.length > 0 ? (
            <Select
              size="small"
              style={{ width: 200 }}
              aria-label={messages.savedViews}
              placeholder={messages.savedViews}
              value={null}
              options={views.map((v) => ({ value: v.name, label: v.name }))}
              optionRender={(option) => (
                <Flex justify="space-between" align="center">
                  <span>{option.label}</span>
                  <DeleteOutlined
                    aria-label={messages.deleteView(String(option.label))}
                    onClick={(e) => {
                      e.stopPropagation();
                      persist(views.filter((v) => v.name !== option.value));
                    }}
                  />
                </Flex>
              )}
              onChange={(name: string) => {
                const view = views.find((v) => v.name === name);
                if (view)
                  onListChange({
                    ...list,
                    page: 1,
                    filter: view.filter,
                    search: view.search,
                    tab: view.tab,
                  });
              }}
            />
          ) : null}
          <Button
            size="small"
            icon={<SaveOutlined />}
            disabled={!hasFilters}
            onClick={() => setNaming('')}
          >
            {messages.saveView}
          </Button>
        </Flex>
      ) : null}
      <Modal
        open={naming !== undefined}
        title={messages.saveView}
        okText={messages.save}
        cancelText={messages.cancel}
        okButtonProps={{ disabled: !naming?.trim() }}
        onCancel={() => setNaming(undefined)}
        onOk={() => {
          const name = naming!.trim();
          persist([
            ...views.filter((v) => v.name !== name),
            { name, filter: list.filter, search: list.search, tab: list.tab },
          ]);
          setNaming(undefined);
        }}
        destroyOnHidden
      >
        <Input
          autoFocus
          aria-label={messages.viewName}
          placeholder={messages.viewName}
          value={naming}
          onChange={(e) => setNaming(e.target.value)}
        />
      </Modal>
    </Flex>
  );
}
