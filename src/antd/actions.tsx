/** Action buttons and the confirmation dialog. What actions exist and when they show is core/actions. */
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Modal } from 'antd';
import { useState, type ReactNode } from 'react';
import type { ActionDialogText, BuiltinAction, ResolvedAction } from '../core/actions.ts';
import type { Messages } from '../react/messages.ts';

const BUILTIN_ICON: Record<BuiltinAction, ReactNode> = {
  create: <PlusOutlined />,
  detail: <EyeOutlined />,
  edit: <EditOutlined />,
  delete: <DeleteOutlined />,
};

export interface ConfirmState extends ActionDialogText {
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
  const icon = action.builtin ? BUILTIN_ICON[action.builtin] : undefined;
  return (
    <Button
      type={compact ? 'link' : action.builtin === 'create' ? 'primary' : 'default'}
      size={compact ? 'small' : 'middle'}
      danger={action.danger}
      icon={icon}
      disabled={disabled}
      aria-label={action.label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {compact && icon ? null : action.label}
    </Button>
  );
}
