/**
 * `<ResourceCrud resource="projects" />`: list, filters, detail, create/edit and actions for one
 * resource, driven by its definition and the URL. Embeddable anywhere inside `<InstaProvider>`.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Flex, Input, Modal, Result, Segmented, Spin, Typography } from 'antd';
import {
  createElement,
  useCallback,
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
import type { ActionContext, NormalizedResource } from '../core/resource.ts';
import { useCan } from '../react/access.ts';
import { useInsta, useResource } from '../react/context.tsx';
import { useResourceList, useResourceMutations, useResourceRecord } from '../react/data.ts';
import { useResourceRouting, type ResourcePaths } from '../react/routes.ts';
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
}

const defaultBasePathOf = (name: string) => `/${name}`;

export function ResourceCrud({
  resource: name,
  basePath,
  paths,
  basePathOf = defaultBasePathOf,
  toolbar,
}: ResourceCrudProps) {
  const resource = useResource(name);
  const { dataProvider, ctx, messages, router, registry } = useInsta();
  const { notify, holder } = useNotify();
  const routerApi = router.useRouter();
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

  const actions = useMemo(() => resolveActions(resource, messages), [resource, messages]);
  const actionKeys = new Set(actions.map((a) => a.key));
  const { current, list } = routing;
  const id = current.view === 'detail' || current.view === 'edit' ? current.id : undefined;

  const listQuery = useResourceList(name, list, { enabled: resource.kind === 'collection' });
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
    navigate: (to) => routerApi.navigate(to),
    notify,
  });

  const actionContext = (rec?: AnyRecord): ActionContext => ({
    record: rec,
    resource: resource.ref,
    dataProvider,
    ctx,
    refresh,
    navigate: (to) => routerApi.navigate(to),
    notify,
    open: (content, options) => setOpened({ content: content as ReactNode, ...options }),
    close: () => setOpened(undefined),
  });

  const runAction = (action: ResolvedAction, rec?: AnyRecord) => {
    const rid = rec ? recordId(resource.ref, rec) : undefined;
    if (action.builtin === 'create') return routing.openCreate();
    if (action.builtin === 'detail' && rid !== undefined) return routing.openDetail(rid);
    if (action.builtin === 'edit' && rid !== undefined) return routing.openEdit(rid);
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
          await action.custom.run(actionContext(rec));
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
        <Typography.Title level={4} style={{ margin: 0 }}>
          {resource.label.other}
        </Typography.Title>
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

      <ResourceTable
        resource={resource}
        rows={rows}
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
            notify={notify}
            onCancel={routing.close}
            onDone={routing.close}
          />
        )}
      </Container>

      <ConfirmDialog state={confirm} onDone={() => setConfirm(undefined)} messages={messages} />
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
