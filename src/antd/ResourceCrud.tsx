/**
 * `<ResourceCrud resource="projects" />`: list, filters, detail, create/edit and actions for one
 * resource, driven by its definition and the URL. Embeddable anywhere inside `<InstaProvider>`.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Button, Flex, Input, Modal, Result, Segmented, Spin, Typography } from 'antd';
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { AnyRecord, DataProvider, InstaContext } from '../core/data-provider.ts';
import { recordId } from '../core/data-provider.ts';
import { errorMessage } from '../core/http-error.ts';
import { recordLabel } from '../core/label.ts';
import { resourceKeys } from '../core/query-keys.ts';
import {
  conditionMet,
  type ActionContext,
  type ActionDefinition,
  type NormalizedResource,
} from '../core/resource.ts';
import type { Where } from '../core/where.ts';
import { useCan } from '../react/access.ts';
import { InstaConfigOverride, useInsta, useResource, useScopedConfig } from '../react/context.tsx';
import {
  andWhere,
  useResourceList,
  useResourceMutations,
  useResourceRecord,
} from '../react/data.ts';
import { memoryAdapter } from '../react/router.ts';
import { useResourceRouting, type ResourcePaths } from '../react/routes.ts';
import { ActionForm } from './ActionForm.tsx';
import {
  ActionButton,
  actionDisabled,
  actionVisible,
  ConfirmDialog,
  resolveActions,
  type ConfirmState,
  type ResolvedAction,
} from './actions.tsx';
import { FilterBar } from './FilterBar.tsx';
import { useNotify, type Notify } from './notify.tsx';
import { Container, ResourceDetail } from './ResourceDetail.tsx';
import { ResourceForm } from './ResourceForm.tsx';
import { ResourceTable } from './ResourceTable.tsx';

/** Props given to `components.page | detail | create | edit` overrides. */
export interface ViewProps {
  resource: NormalizedResource;
  dataProvider: DataProvider;
  ctx: InstaContext;
  record?: AnyRecord;
  refresh(): Promise<void>;
  close(): void;
  navigate(to: string): void;
  notify: Notify;
}

export interface ResourceCrudProps {
  resource: string;
  /** URL path of this resource (default `/{name}`). */
  basePath?: string;
  paths?: ResourcePaths;
  /** Base path of other resources, for relation links (default `/{name}`). */
  basePathOf?(resource: string): string;
  /** Rendered above the table, next to the title. */
  toolbar?: ReactNode;
  /** The heading above the list (default: the resource's plural label); `false` hides it. */
  title?: ReactNode | false;
  /**
   * Keep this view's list state and open record in component state instead of the URL, e.g. a
   * child resource inside another resource's detail. Navigation by actions still uses the app's router.
   */
  embedded?: boolean;
  /** Extra context for this view, merged over the provider's (path templates, access, `$var`). */
  ctx?: InstaContext;
  /** A filter always applied to this view, AND-ed with the user's (not shown in the filter bar). */
  filter?: Where;
  /** Initial values for records created here, in wire format. */
  defaults?: AnyRecord;
}

const defaultBasePathOf = (name: string) => `/${name}`;

export function ResourceCrud(props: ResourceCrudProps) {
  const insta = useInsta();
  const outer = insta.router.useRouter();
  const { embedded, ctx: extraCtx } = props;
  const base = props.basePath ?? (props.basePathOf ?? defaultBasePathOf)(props.resource);
  const [localRouter] = useState(() => (embedded ? memoryAdapter(base) : undefined));
  const config = useScopedConfig(extraCtx, localRouter);
  if (!localRouter && !extraCtx) return <ResourceCrudView {...props} navigate={outer.navigate} />;
  return (
    <InstaConfigOverride value={config}>
      <ResourceCrudView {...props} navigate={outer.navigate} />
    </InstaConfigOverride>
  );
}

interface FormRun {
  action: ResolvedAction & { custom: ActionDefinition };
  record?: AnyRecord;
  selection?: AnyRecord[];
}

function ResourceCrudView({
  resource: name,
  basePath,
  paths,
  basePathOf = defaultBasePathOf,
  toolbar,
  title,
  filter: scope,
  defaults,
  navigate,
}: ResourceCrudProps & { navigate(to: string): void }) {
  const resource = useResource(name);
  const { dataProvider, ctx, messages, registry } = useInsta();
  const { notify, holder } = useNotify();
  const base = basePath ?? basePathOf(name);
  const routing = useResourceRouting(name, base, paths);
  const can = useCan(name);
  const client = useQueryClient();
  const { remove } = useResourceMutations(name);
  const [confirm, setConfirm] = useState<ConfirmState>();
  const [opened, setOpened] = useState<{
    content: ReactNode;
    title?: string;
    width?: number | string;
  }>();
  const [formRun, setFormRun] = useState<FormRun>();
  const [selected, setSelected] = useState<{ keys: string[]; rows: AnyRecord[] }>({
    keys: [],
    rows: [],
  });

  const actions = useMemo(() => resolveActions(resource, messages), [resource, messages]);
  const actionKeys = new Set(actions.map((a) => a.key));
  const { current, list } = routing;
  const id = current.view === 'detail' || current.view === 'edit' ? current.id : undefined;

  const scopedList = useMemo(
    () => (scope ? { ...list, filter: andWhere(list.filter, scope) } : list),
    [list, scope],
  );
  const listQuery = useResourceList(name, scopedList, { enabled: resource.kind === 'collection' });
  // A selection belongs to the rows on screen: any change to the list clears it.
  const listKey = JSON.stringify(scopedList);
  useEffect(() => setSelected({ keys: [], rows: [] }), [listKey]);
  const recordQuery = useResourceRecord(name, id);
  const record = recordQuery.data;

  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: resourceKeys.all(name) }),
    [client, name],
  );

  const viewProps = (rec?: AnyRecord): ViewProps => ({
    resource,
    dataProvider,
    ctx,
    record: rec,
    refresh,
    close: routing.close,
    navigate,
    notify,
  });

  const actionContext = (rec?: AnyRecord, selection?: AnyRecord[]): ActionContext => ({
    record: rec,
    selection,
    resource: resource.ref,
    dataProvider,
    ctx,
    refresh,
    navigate,
    notify,
    open: (content, options) => setOpened({ content: content as ReactNode, ...options }),
    openResource: (target, { ctx: extra, filter, defaults: initial, title: heading, width } = {}) =>
      setOpened({
        content: (
          <ResourceCrud
            resource={target}
            embedded
            title={false}
            ctx={extra}
            filter={filter}
            defaults={initial}
          />
        ),
        title: heading,
        width: width ?? 800,
      }),
    close: () => setOpened(undefined),
  });

  const runAction = (action: ResolvedAction, rec?: AnyRecord, selection?: AnyRecord[]) => {
    const rid = rec ? recordId(resource.ref, rec) : undefined;
    if (action.builtin === 'create') return routing.openCreate();
    if (action.builtin === 'detail' && rid !== undefined) return routing.openDetail(rid);
    if (action.builtin === 'edit' && rid !== undefined) return routing.openEdit(rid);
    if (action.custom?.form) {
      setFormRun({ action: action as FormRun['action'], record: rec, selection });
      return;
    }
    const exec = async () => {
      try {
        if (action.builtin === 'delete' && rid !== undefined) {
          await remove.mutateAsync({ id: rid, previousData: rec });
          notify.success(messages.deleted);
          if (current.view !== 'list') routing.close();
          // Deleting the last row of a page steps back a page.
          const rows = listQuery.data?.data.length ?? 0;
          if (rows <= 1 && list.page > 1) routing.setList({ ...list, page: list.page - 1 });
        } else if (action.custom) {
          await action.custom.run(actionContext(rec, selection));
          if (selection) setSelected({ keys: [], rows: [] });
          if ((action.custom.onSuccess ?? 'refetch') === 'refetch') await refresh();
        }
      } catch (error) {
        notify.error(
          action.builtin === 'delete' ? messages.deleteFailed : action.label,
          errorMessage(error),
        );
      }
    };
    if (action.confirm) {
      const options = typeof action.confirm === 'object' ? action.confirm : {};
      setConfirm({
        title:
          options.title ??
          (action.builtin === 'delete'
            ? messages.deleteConfirmTitle(resource.label.one.toLowerCase())
            : action.label),
        description:
          options.description ??
          (action.builtin === 'delete' ? messages.deleteConfirmDescription : undefined),
        typeToConfirm: options.typeToConfirm,
        okText: options.okText ?? (action.builtin === 'delete' ? messages.delete : action.label),
        danger: options.danger ?? action.danger ?? false,
        run: exec,
      });
    } else void exec();
  };

  const actionsFor = (placement: 'row' | 'detail' | 'toolbar', rec?: AnyRecord) =>
    actions
      .filter(
        (a) =>
          a.placement.includes(placement) && actionVisible(a, rec, (key, r) => can(key, r), ctx),
      )
      .filter((a) => !(placement === 'detail' && a.builtin === 'detail'))
      .map((a) => (
        <ActionButton
          key={a.key}
          action={a}
          compact={placement === 'row'}
          disabled={actionDisabled(a, rec, ctx)}
          onClick={() => runAction(a, rec)}
        />
      ));

  const override = (
    slot: 'page' | 'detail' | 'create' | 'edit' | 'rowActions',
  ): ComponentType<ViewProps> | undefined => {
    const c = resource.components?.[slot];
    if (typeof c === 'function') return c as ComponentType<ViewProps>;
    if (typeof c === 'string')
      return (registry.components as Record<string, ComponentType<ViewProps>> | undefined)?.[c];
    return undefined;
  };

  // ── page resources: no list fetch ──────────────────────────────────────────
  if (resource.kind === 'page') {
    const Page = override('page');
    return (
      <>
        {holder}
        {title === false ? null : (
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            {title ?? resource.label.other}
          </Typography.Title>
        )}
        {Page ? (
          createElement(Page, viewProps())
        ) : (
          <Result status="warning" title={`${resource.label.one}: no page component`} />
        )}
      </>
    );
  }

  if (!can('list')) return <Result status="403" title={messages.notAllowed} />;

  const canOpenDetail = actionKeys.has('detail') && can('detail');
  const bulkActions = actions.filter((a) => a.custom && a.placement.includes('bulk') && can(a.key));
  const selectable = resource.list.selectable;
  const formContainer = resource.form?.container ?? { type: 'modal', width: 640 };
  const detailContainer = resource.detail?.container ?? { type: 'drawer', width: 560 };
  const formMode =
    current.view === 'create' ? 'create' : current.view === 'edit' ? 'edit' : undefined;
  const allowed =
    current.view === 'create'
      ? can('create')
      : current.view === 'edit'
        ? !record || can('edit', record)
        : current.view === 'detail'
          ? !record || can('detail', record)
          : true;

  const formTitle =
    formMode === 'create'
      ? (resource.form?.title?.create ?? messages.createTitle(resource.label.one.toLowerCase()))
      : (resource.form?.title?.edit ?? messages.editTitle(resource.label.one.toLowerCase()));

  const FormOverride = formMode ? override(formMode) : undefined;
  const DetailOverride = override('detail');
  const RowActions = override('rowActions');
  const rows = listQuery.data?.data ?? [];
  const tabs = resource.list.tabs;
  const hasRowActions =
    actions.some((a) => a.placement.includes('row')) || RowActions !== undefined;

  return (
    <div>
      {holder}
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
              onSearch={(q) => routing.setList({ ...list, page: 1, search: q || undefined })}
              style={{ width: 240 }}
            />
          ) : null}
          {toolbar}
          {actionsFor('toolbar')}
        </Flex>
      </Flex>

      {tabs.length > 1 ? (
        <Segmented
          style={{ marginBottom: 12 }}
          value={list.tab ?? tabs[0]!.key}
          options={tabs.map((t) => ({ value: t.key, label: t.label }))}
          onChange={(key) =>
            routing.setList({
              ...list,
              page: 1,
              tab: key === tabs[0]!.key ? undefined : String(key),
            })
          }
        />
      ) : null}
      {resource.list.filterBar ? (
        <FilterBar
          resource={resource}
          list={list}
          onListChange={routing.setList}
          savedViews={resource.list.filterBar.savedViews}
        />
      ) : null}

      {listQuery.isError ? (
        <Result
          status="error"
          title={messages.loadFailed}
          subTitle={errorMessage(listQuery.error)}
        />
      ) : null}

      {bulkActions.length > 0 ? (
        <Flex align="center" gap={8} wrap style={{ marginBottom: 12 }}>
          <Typography.Text type="secondary">
            {messages.selected(selected.keys.length)}
          </Typography.Text>
          {bulkActions.map((a) => (
            <ActionButton
              key={a.key}
              action={a}
              disabled={selected.keys.length === 0}
              onClick={() => runAction(a, undefined, selected.rows)}
            />
          ))}
          {selected.keys.length > 0 ? (
            <Button type="link" size="small" onClick={() => setSelected({ keys: [], rows: [] })}>
              {messages.clearSelection}
            </Button>
          ) : null}
        </Flex>
      ) : null}

      <ResourceTable
        resource={resource}
        rows={rows}
        selection={
          bulkActions.length > 0
            ? {
                keys: selected.keys,
                onChange: (keys, selectedRows) => setSelected({ keys, rows: selectedRows }),
                isSelectable: selectable
                  ? (r) => conditionMet(selectable as never, r as never, ctx, r)
                  : undefined,
              }
            : undefined
        }
        total={listQuery.data?.total}
        loading={listQuery.isFetching}
        list={list}
        onListChange={routing.setList}
        onRowOpen={
          canOpenDetail
            ? (r) => {
                const rid = recordId(resource.ref, r);
                if (rid !== undefined) routing.openDetail(rid);
              }
            : undefined
        }
        renderActions={
          hasRowActions
            ? (r) => (
                <Flex gap={4} align="center">
                  {RowActions ? createElement(RowActions, viewProps(r)) : null}
                  {actionsFor('row', r)}
                </Flex>
              )
            : undefined
        }
        basePathOf={basePathOf}
      />

      {/* detail */}
      <Container
        options={detailContainer}
        open={current.view === 'detail'}
        title={record ? recordLabel(resource, record) : resource.label.one}
        onClose={routing.close}
        footer={
          record && allowed ? (
            <Flex justify="end" gap={8}>
              {actionsFor('detail', record)}
            </Flex>
          ) : undefined
        }
      >
        {!allowed ? (
          <Result status="403" title={messages.notAllowed} />
        ) : recordQuery.isError ? (
          <Result
            status="404"
            title={messages.notFound}
            subTitle={errorMessage(recordQuery.error)}
          />
        ) : record ? (
          DetailOverride ? (
            createElement(DetailOverride, viewProps(record))
          ) : (
            <ResourceDetail resource={resource} record={record} basePathOf={basePathOf} />
          )
        ) : (
          <Spin />
        )}
      </Container>

      {/* create / edit */}
      <Container
        options={formContainer}
        open={formMode !== undefined}
        title={formTitle}
        onClose={routing.close}
      >
        {formMode === undefined ? null : !allowed ? (
          <Result status="403" title={messages.notAllowed} />
        ) : formMode === 'edit' && recordQuery.isError ? (
          <Result
            status="404"
            title={messages.notFound}
            subTitle={errorMessage(recordQuery.error)}
          />
        ) : formMode === 'edit' && !record ? (
          <Spin />
        ) : FormOverride ? (
          createElement(FormOverride, viewProps(record))
        ) : (
          <ResourceForm
            key={`${name}:${id ?? 'new'}:${formMode}`}
            resource={resource}
            mode={formMode}
            record={formMode === 'edit' ? record : undefined}
            id={id}
            defaults={defaults}
            notify={notify}
            onCancel={routing.close}
            onDone={routing.close}
          />
        )}
      </Container>

      <ConfirmDialog state={confirm} onDone={() => setConfirm(undefined)} messages={messages} />
      <Modal
        open={formRun !== undefined}
        title={formRun ? (formRun.action.custom.form!.title ?? formRun.action.label) : undefined}
        width={formRun?.action.custom.form!.width}
        footer={null}
        onCancel={() => setFormRun(undefined)}
        destroyOnHidden
      >
        {formRun ? (
          <ActionForm
            id={`${name}.${formRun.action.key}`}
            config={formRun.action.custom.form!}
            submitLabel={formRun.action.custom.form!.submitLabel ?? formRun.action.label}
            initial={formRun.action.custom.form!.initialValues?.({
              record: formRun.record,
              selection: formRun.selection,
            })}
            onCancel={() => setFormRun(undefined)}
            onSubmit={async (values) => {
              const { action, record: rec, selection } = formRun;
              await action.custom.run({ ...actionContext(rec, selection), values });
              setFormRun(undefined);
              if (selection) setSelected({ keys: [], rows: [] });
              if ((action.custom.onSuccess ?? 'refetch') === 'refetch') await refresh();
            }}
          />
        ) : null}
      </Modal>
      <Modal
        open={opened !== undefined}
        title={opened?.title}
        width={opened?.width}
        footer={null}
        onCancel={() => setOpened(undefined)}
        destroyOnHidden
      >
        {opened?.content}
      </Modal>
    </div>
  );
}
