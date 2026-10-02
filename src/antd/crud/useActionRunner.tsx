/**
 * Runs a resource's actions: built-ins open views or delete; custom actions confirm, collect a
 * form, or run straight away. Owns the dialogs those need and returns them as `dialogs`.
 */
import { Modal } from 'antd';
import { useMemo, useState, type ReactNode } from 'react';
import { recordId, type AnyRecord } from '../../core/data-provider.ts';
import { errorMessage } from '../../core/http-error.ts';
import type { NormalizedResource } from '../../core/resource.ts';
import type { ActionContext, ActionDefinition, OpenResourceOptions } from '../../core/actions.ts';
import { useCan } from '../../react/access.ts';
import { useInsta } from '../../react/context.tsx';
import { useResourceMutations } from '../../react/data.ts';
import type { ResourceRouting } from '../../react/routes.ts';
import { ActionForm } from '../ActionForm.tsx';
import {
  ActionButton,
  actionDisabled,
  actionVisible,
  ConfirmDialog,
  resolveActions,
  type ConfirmState,
  type ResolvedAction,
} from '../actions.tsx';
import type { Notify } from '../notify.tsx';

type CustomAction = ResolvedAction & { custom: ActionDefinition };

interface FormRun {
  action: CustomAction;
  record?: AnyRecord;
  selection?: AnyRecord[];
}

interface Opened {
  content: ReactNode;
  title?: string;
  width?: number | string;
}

export interface ActionRunnerOptions {
  resource: NormalizedResource;
  routing: ResourceRouting;
  /** Rows on the current page (deleting the last one steps back a page). */
  rowsOnPage: number;
  refresh(): Promise<void>;
  navigate(to: string): void;
  notify: Notify;
  /** Called after a bulk action succeeds. */
  onBulkDone(): void;
  /** Renders another resource's list, for `openResource`. */
  renderResource(name: string, options: OpenResourceOptions): ReactNode;
}

export function useActionRunner({
  resource,
  routing,
  rowsOnPage,
  refresh,
  navigate,
  notify,
  onBulkDone,
  renderResource,
}: ActionRunnerOptions) {
  const { dataProvider, ctx, messages } = useInsta();
  const can = useCan(resource.name);
  const { remove } = useResourceMutations(resource.name);
  const [confirm, setConfirm] = useState<ConfirmState>();
  const [formRun, setFormRun] = useState<FormRun>();
  const [opened, setOpened] = useState<Opened>();
  const actions = useMemo(() => resolveActions(resource, messages), [resource, messages]);

  const contextFor = (record?: AnyRecord, selection?: AnyRecord[]): ActionContext => ({
    record,
    selection,
    resource: resource.ref,
    dataProvider,
    ctx,
    refresh,
    navigate,
    notify,
    open: (content, options) => setOpened({ content: content as ReactNode, ...options }),
    openResource: (name, options = {}) =>
      setOpened({
        content: renderResource(name, options),
        title: options.title,
        width: options.width ?? 800,
      }),
    close: () => setOpened(undefined),
  });

  /** After a custom action: clear the selection it ran on, then refetch unless told not to. */
  const settle = async (action: CustomAction, selection?: AnyRecord[]) => {
    if (selection) onBulkDone();
    if ((action.custom.onSuccess ?? 'refetch') === 'refetch') await refresh();
  };

  const remove_ = async (record: AnyRecord) => {
    const id = recordId(resource.ref, record)!;
    await remove.mutateAsync({ id, previousData: record });
    notify.success(messages.deleted);
    if (routing.current.view !== 'list') routing.close();
    // Deleting the last row of a page steps back a page.
    const { list } = routing;
    if (rowsOnPage <= 1 && list.page > 1) routing.setList({ ...list, page: list.page - 1 });
  };

  const confirmFor = (action: ResolvedAction, exec: () => Promise<void>): ConfirmState => {
    const options = typeof action.confirm === 'object' ? action.confirm : {};
    const isDelete = action.builtin === 'delete';
    return {
      title:
        options.title ??
        (isDelete ? messages.deleteConfirmTitle(resource.label.one.toLowerCase()) : action.label),
      description:
        options.description ?? (isDelete ? messages.deleteConfirmDescription : undefined),
      typeToConfirm: options.typeToConfirm,
      okText: options.okText ?? (isDelete ? messages.delete : action.label),
      danger: options.danger ?? action.danger ?? false,
      run: exec,
    };
  };

  const run = (action: ResolvedAction, record?: AnyRecord, selection?: AnyRecord[]) => {
    const id = record ? recordId(resource.ref, record) : undefined;
    if (action.builtin === 'create') return routing.openCreate();
    if (action.builtin === 'detail' && id !== undefined) return routing.openDetail(id);
    if (action.builtin === 'edit' && id !== undefined) return routing.openEdit(id);
    if (action.custom?.form)
      return setFormRun({ action: action as CustomAction, record, selection });

    const exec = async () => {
      try {
        if (action.builtin === 'delete' && record) await remove_(record);
        else if (action.custom) {
          await action.custom.run(contextFor(record, selection));
          await settle(action as CustomAction, selection);
        }
      } catch (error) {
        notify.error(
          action.builtin === 'delete' ? messages.deleteFailed : action.label,
          errorMessage(error),
        );
      }
    };
    if (action.confirm) setConfirm(confirmFor(action, exec));
    else void exec();
  };

  /** The visible actions for a placement, as buttons. */
  const buttons = (placement: 'row' | 'detail' | 'toolbar', record?: AnyRecord) =>
    actions
      .filter((a) => a.placement.includes(placement) && actionVisible(a, record, can, ctx))
      .filter((a) => !(placement === 'detail' && a.builtin === 'detail'))
      .map((a) => (
        <ActionButton
          key={a.key}
          action={a}
          compact={placement === 'row'}
          disabled={actionDisabled(a, record, ctx)}
          onClick={() => run(a, record)}
        />
      ));

  const form = formRun?.action.custom.form;
  const dialogs = (
    <>
      <ConfirmDialog state={confirm} onDone={() => setConfirm(undefined)} messages={messages} />
      <Modal
        open={formRun !== undefined}
        title={form?.title ?? formRun?.action.label}
        width={form?.width}
        footer={null}
        onCancel={() => setFormRun(undefined)}
        destroyOnHidden
      >
        {formRun && form ? (
          <ActionForm
            id={`${resource.name}.${formRun.action.key}`}
            config={form}
            submitLabel={form.submitLabel ?? formRun.action.label}
            initial={form.initialValues?.({ record: formRun.record, selection: formRun.selection })}
            onCancel={() => setFormRun(undefined)}
            onSubmit={async (values) => {
              const { action, record, selection } = formRun;
              await action.custom.run({ ...contextFor(record, selection), values });
              setFormRun(undefined);
              await settle(action, selection);
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
    </>
  );

  return { actions, can, run, buttons, dialogs };
}
