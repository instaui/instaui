/**
 * `<ResourceCrud resource="projects" />`: list, filters, detail, create/edit and actions for one
 * resource, driven by its definition and the URL. Embeddable anywhere inside `<InstaProvider>`.
 *
 * The pieces live in `./crud/`: actions and their dialogs (`useActionRunner`), bulk selection,
 * the list header, and the detail and form containers.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Flex, Result, Typography } from 'antd';
import { createElement, useCallback, useMemo, useState, type ReactNode } from 'react';
import { recordId, type AnyRecord, type InstaContext } from '../core/data-provider.ts';
import { errorMessage } from '../core/http-error.ts';
import { resourceKeys } from '../core/query-keys.ts';
import { conditionMet } from '../core/resource.ts';
import type { Where } from '../core/where.ts';
import { InstaConfigOverride, useInsta, useResource, useScopedConfig } from '../react/context.tsx';
import { andWhere, useResourceList, useResourceRecord } from '../react/data.ts';
import { memoryAdapter } from '../react/router.ts';
import { defaultBasePathOf, useResourceRouting, type ResourcePaths } from '../react/routes.ts';
import { BulkBar } from './crud/BulkBar.tsx';
import { ListHeader } from './crud/ListHeader.tsx';
import { useOverrides } from './crud/overrides.ts';
import { DetailView, FormView } from './crud/RecordViews.tsx';
import { useActionRunner } from './crud/useActionRunner.tsx';
import { useSelection } from './crud/useSelection.ts';
import type { ViewProps } from './crud/viewProps.ts';
import { useNotify } from './notify.tsx';
import { ResourceTable } from './ResourceTable.tsx';

export type { ViewProps } from './crud/viewProps.ts';

export interface ResourceCrudProps {
  resource: string;
  /** URL path of this resource (default `/{name}`). */
  basePath?: string;
  paths?: ResourcePaths;
  /** Base path of other resources, for relation links (default `/{name}`). */
  basePathOf?(resource: string): string;
  /** Rendered above the table, next to the title. */
  toolbar?: ReactNode;
  /** The heading (default: the resource's plural label); `false` hides it. */
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

export function ResourceCrud(props: ResourceCrudProps) {
  const outer = useInsta().router.useRouter();
  const base = props.basePath ?? (props.basePathOf ?? defaultBasePathOf)(props.resource);
  const [localRouter] = useState(() => (props.embedded ? memoryAdapter(base) : undefined));
  const config = useScopedConfig(props.ctx, localRouter);
  const view = <ResourceCrudView {...props} navigate={outer.navigate} />;
  return localRouter || props.ctx ? (
    <InstaConfigOverride value={config}>{view}</InstaConfigOverride>
  ) : (
    view
  );
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
  const { dataProvider, ctx, messages } = useInsta();
  const { notify, holder } = useNotify();
  const client = useQueryClient();
  const routing = useResourceRouting(name, basePath ?? basePathOf(name), paths);
  const override = useOverrides(resource);
  const { current, list } = routing;

  const scopedList = useMemo(
    () => (scope ? { ...list, filter: andWhere(list.filter, scope) } : list),
    [list, scope],
  );
  const listQuery = useResourceList(name, scopedList, { enabled: resource.kind === 'collection' });
  const id = current.view === 'detail' || current.view === 'edit' ? current.id : undefined;
  const recordQuery = useResourceRecord(name, id);
  const record = recordQuery.data;
  const rows = listQuery.data?.data ?? [];
  const { selection, setSelection, clear } = useSelection(JSON.stringify(scopedList));

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
  const runner = useActionRunner({
    resource,
    routing,
    rowsOnPage: rows.length,
    refresh,
    navigate,
    notify,
    onBulkDone: clear,
    renderResource: (target, options) => (
      <ResourceCrud
        resource={target}
        embedded
        title={false}
        ctx={options.ctx}
        filter={options.filter}
        defaults={options.defaults}
      />
    ),
  });
  const { can } = runner;

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

  const canOpenDetail = runner.actions.some((a) => a.key === 'detail') && can('detail');
  const bulkActions = runner.actions.filter(
    (a) => a.custom && a.placement.includes('bulk') && can(a.key),
  );
  const RowActions = override('rowActions');
  const hasRowActions =
    runner.actions.some((a) => a.placement.includes('row')) || RowActions !== undefined;
  const formMode = current.view === 'create' || current.view === 'edit' ? current.view : undefined;
  const allowed =
    current.view === 'create'
      ? can('create')
      : current.view === 'edit' || current.view === 'detail'
        ? !record || can(current.view, record)
        : true;
  const selectable = resource.list.selectable;
  const recordState = {
    record,
    error: recordQuery.isError ? recordQuery.error : undefined,
    allowed,
  };

  return (
    <div>
      {holder}
      <ListHeader
        resource={resource}
        title={title}
        list={list}
        onListChange={routing.setList}
        toolbar={
          <>
            {toolbar}
            {runner.buttons('toolbar')}
          </>
        }
      />
      {listQuery.isError ? (
        <Result
          status="error"
          title={messages.loadFailed}
          subTitle={errorMessage(listQuery.error)}
        />
      ) : null}
      {bulkActions.length > 0 ? (
        <BulkBar
          actions={bulkActions}
          count={selection.keys.length}
          onRun={(action) => runner.run(action, undefined, selection.rows)}
          onClear={clear}
        />
      ) : null}

      <ResourceTable
        resource={resource}
        rows={rows}
        total={listQuery.data?.total}
        loading={listQuery.isFetching}
        list={list}
        onListChange={routing.setList}
        basePathOf={basePathOf}
        selection={
          bulkActions.length > 0
            ? {
                keys: selection.keys,
                onChange: (keys, selected) => setSelection({ keys, rows: selected }),
                isSelectable: selectable ? (r) => conditionMet(selectable, r, ctx, r) : undefined,
              }
            : undefined
        }
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
                  {runner.buttons('row', r)}
                </Flex>
              )
            : undefined
        }
      />

      <DetailView
        resource={resource}
        open={current.view === 'detail'}
        state={recordState}
        override={override('detail')}
        viewProps={viewProps(record)}
        footer={record ? runner.buttons('detail', record) : null}
        basePathOf={basePathOf}
        onClose={routing.close}
      />
      <FormView
        resource={resource}
        mode={formMode}
        id={id}
        state={recordState}
        defaults={defaults}
        override={formMode ? override(formMode) : undefined}
        viewProps={viewProps(record)}
        notify={notify}
        onClose={routing.close}
      />
      {runner.dialogs}
    </div>
  );
}
