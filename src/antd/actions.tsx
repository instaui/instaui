/** Built-in and custom actions: one model, access-checked everywhere they appear. */
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Modal } from 'antd';
import { useState, type ReactNode } from 'react';
import type { AnyRecord } from '../core/data-provider.ts';
import { conditionMet, type NormalizedResource } from '../core/resource.ts';
import {
  type ActionConfirm,
  type ActionDefinition,
  type ActionPlacement,
  type BuiltinAction,
} from '../core/actions.ts';
import type { Messages } from '../react/messages.ts';

export interface ResolvedAction {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  placement: ActionPlacement[];
  confirm?: ActionConfirm;
  builtin?: BuiltinAction;
  custom?: ActionDefinition;
}

const BUILTIN_PLACEMENT: Record<BuiltinAction, ActionPlacement[]> = {
  create: ['toolbar'],
  detail: ['row'],
  edit: ['row', 'detail'],
  delete: ['row', 'detail'],
};

const BUILTIN_ICON: Record<BuiltinAction, ReactNode> = {
  create: <PlusOutlined />,
  detail: <EyeOutlined />,
  edit: <EditOutlined />,
  delete: <DeleteOutlined />,
};

export function resolveActions(resource: NormalizedResource, messages: Messages): ResolvedAction[] {
  const labelOf: Record<BuiltinAction, string> = {
    create: messages.create,
    detail: messages.view,
    edit: messages.edit,
    delete: messages.delete,
  };
  return resource.actions.map((action): ResolvedAction => {
    if (typeof action === 'string') {
      return {
        key: action,
        builtin: action,
        label: labelOf[action],
        icon: BUILTIN_ICON[action],
        danger: action === 'delete',
        placement: BUILTIN_PLACEMENT[action],
        confirm: action === 'delete' ? true : undefined,
      };
    }
    if ('builtin' in action) {
      return {
        key: action.builtin,
        builtin: action.builtin,
        label: action.label ?? labelOf[action.builtin],
        icon: BUILTIN_ICON[action.builtin],
        danger: action.builtin === 'delete',
        placement: action.placement ?? BUILTIN_PLACEMENT[action.builtin],
        confirm: action.confirm ?? (action.builtin === 'delete' ? true : undefined),
      };
    }
    return {
      key: action.id,
      label: action.label,
      danger: action.danger,
      placement: action.placement,
      confirm: action.confirm,
      custom: action as ActionDefinition,
    };
  });
}

export function actionVisible(
  action: ResolvedAction,
  record: AnyRecord | undefined,
  allowed: (key: string, record?: AnyRecord) => boolean,
  ctx: Record<string, unknown>,
): boolean {
  if (!allowed(action.key, record)) return false;
  return action.custom?.visibleIf
    ? conditionMet(action.custom.visibleIf as never, (record ?? {}) as never, ctx, record)
    : true;
}

export function actionDisabled(
  action: ResolvedAction,
  record: AnyRecord | undefined,
  ctx: Record<string, unknown>,
): boolean {
  return action.custom?.disabledIf
    ? conditionMet(action.custom.disabledIf as never, (record ?? {}) as never, ctx, record)
    : false;
}

export interface ConfirmState {
  title: string;
  description?: string;
  typeToConfirm?: string;
  okText: string;
  danger: boolean;
  run(): Promise<unknown>;
}

/** Confirmation with loading state (no double submits) and optional type-to-confirm. */
export function ConfirmDialog({
  state,
  onDone,
  messages,
}: {
  state: ConfirmState | undefined;
  onDone(): void;
  messages: Messages;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const needsWord = state?.typeToConfirm;
  return (
    <Modal
      open={state !== undefined}
      title={state?.title}
      okText={state?.okText}
      okButtonProps={{ danger: state?.danger, disabled: needsWord ? typed !== needsWord : false }}
      confirmLoading={busy}
      cancelText={messages.cancel}
      destroyOnHidden
      onCancel={() => {
        setTyped('');
        onDone();
      }}
      onOk={async () => {
        if (!state) return;
        setBusy(true);
        try {
          await state.run();
        } finally {
          setBusy(false);
          setTyped('');
          onDone();
        }
      }}
    >
      {state?.description ? <p>{state.description}</p> : null}
      {needsWord ? (
        <Input
          autoFocus
          aria-label={messages.typeToConfirm(needsWord)}
          placeholder={messages.typeToConfirm(needsWord)}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
      ) : null}
    </Modal>
  );
}

export function ActionButton({
  action,
  disabled,
  onClick,
  compact,
}: {
  action: ResolvedAction;
  disabled?: boolean;
  onClick(): void;
  compact?: boolean;
}) {
  return (
    <Button
      type={compact ? 'link' : action.builtin === 'create' ? 'primary' : 'default'}
      size={compact ? 'small' : 'middle'}
      danger={action.danger}
      icon={action.icon}
      disabled={disabled}
      aria-label={action.label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {compact && action.icon ? null : action.label}
    </Button>
  );
}
