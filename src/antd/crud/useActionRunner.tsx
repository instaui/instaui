/**
 * Runs a resource's actions: built-ins open views or delete; custom actions confirm, collect a
 * form, or run straight away. Owns the dialogs those need and returns them as `dialogs`.
 */
import { Modal } from 'antd';
import { useMemo, useState, type ReactNode } from 'react';
import { recordId, type AnyRecord } from '../../core/data-provider.ts';
import { errorMessage } from '../../core/http-error.ts';
import type { NormalizedResource } from '../../core/resource.ts';
import {
  actionDialogText,
  actionDisabled,
  actionVisible,
  isCustom,
  resolveActions,
  type ActionContext,
  type ActionTarget,
  type CustomAction,
  type OpenResourceOptions,
  type ResolvedAction,
} from '../../core/actions.ts';
import { useCan } from '../../react/access.ts';
import { useInsta } from '../../react/context.tsx';
import { useResourceMutations } from '../../react/data.ts';
import type { ResourceRouting } from '../../react/routes.ts';
import { ActionForm } from '../ActionForm.tsx';
import { ActionButton, ConfirmDialog, type ConfirmState } from '../actions.tsx';
import type { Notify } from '../notify.tsx';

interface FormRun {
  action: CustomAction;
  record?: AnyRecord;
  selection?: AnyRecord[];
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
  const content = useContentModal();
  const actions = useMemo(
    () =>
      resolveActions(resource, {
        create: messages.create,
        detail: messages.view,
        edit: messages.edit,
        delete: messages.delete,
      }),
    [resource, messages],
  );

  const contextFor = (record?: AnyRecord, selection?: AnyRecord[]): ActionContext => ({
    record,
    selection,
    resource: resource.ref,
    dataProvider,
    ctx,
    refresh,
    navigate,
    notify,
    open: (node, options) => content.open({ content: node as ReactNode, ...options }),
    openResource: (name, options = {}) =>
      content.open({
        content: renderResource(name, options),
        title: options.title,
        width: options.width ?? 800,
      }),
    close: content.close,
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

  const dialogText = (action: ResolvedAction, target: ActionTarget) =>
    actionDialogText(action, target, {
      title: messages.deleteConfirmTitle(resource.label.one.toLowerCase()),
      description: messages.deleteConfirmDescription,
      okText: messages.delete,
    });

  const run = (action: ResolvedAction, record?: AnyRecord, selection?: AnyRecord[]) => {
    const id = record ? recordId(resource.ref, record) : undefined;
    if (action.builtin === 'create') return routing.openCreate();
    if (action.builtin === 'detail' && id !== undefined) return routing.openDetail(id);
    if (action.builtin === 'edit' && id !== undefined) return routing.openEdit(id);
    if (isCustom(action) && action.custom.form) return setFormRun({ action, record, selection });

    const exec = async () => {
      try {
        if (action.builtin === 'delete' && record) await remove_(record);
        else if (isCustom(action)) {
          await action.custom.run(contextFor(record, selection));
          await settle(action, selection);
        }
      } catch (error) {
        notify.error(
          action.builtin === 'delete' ? messages.deleteFailed : action.label,
          errorMessage(error),
        );
      }
    };
    if (action.confirm) setConfirm({ ...dialogText(action, { record, selection }), run: exec });
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
  const formText = formRun ? dialogText(formRun.action, formRun) : undefined;
  const dialogs = (
    <>
      <ConfirmDialog state={confirm} onDone={() => setConfirm(undefined)} messages={messages} />
      <Modal
        open={formRun !== undefined}
        title={formText?.title}
        width={form?.width}
        footer={null}
        onCancel={() => setFormRun(undefined)}
        destroyOnHidden
      >
        {formRun && form ? (
          <ActionForm
            id={`${resource.name}.${formRun.action.key}`}
            config={form}
            submitLabel={formText!.okText}
            description={formText!.description}
            danger={formText!.danger}
            typeToConfirm={formText!.typeToConfirm}
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
      {content.modal}
    </>
  );

  return { actions, can, run, buttons, dialogs };
}

interface Opened {
  content: ReactNode;
  title?: string;
  width?: number | string;
}

/** The modal an action's `open` / `openResource` show content in. */
function useContentModal() {
  const [opened, setOpened] = useState<Opened>();
  const close = () => setOpened(undefined);
  const modal = (
    <Modal
      open={opened !== undefined}
      title={opened?.title}
      width={opened?.width}
      footer={null}
      onCancel={close}
      destroyOnHidden
    >
      {opened?.content}
    </Modal>
  );
  return { open: setOpened, close, modal };
}
