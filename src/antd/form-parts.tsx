/** What the resource form, action forms and the confirm dialog share. */
import { Alert, Button, Flex, Form, Input } from 'antd';
import { useState } from 'react';
import type { AnyRecord } from '../core/data-provider.ts';
import { decodeRecord } from '../core/payload.ts';
import type { FormMode, NormalizedResource } from '../core/resource.ts';
import { useInsta } from '../react/context.tsx';

/**
 * An antd form over a resource's fields: initial values decoded once at mount (a refetch never
 * overwrites typing), and the current values for conditions.
 */
export function useFieldForm(
  resource: NormalizedResource,
  initial: AnyRecord | undefined,
  mode: FormMode,
) {
  const { env, registry } = useInsta();
  const [form] = Form.useForm();
  const [initialValues] = useState(() =>
    decodeRecord(resource, initial, mode, env, registry.codecs),
  );
  const watched = Form.useWatch((all: AnyRecord) => all, form) as AnyRecord | undefined;
  return { form, initialValues, values: watched ?? initialValues };
}

export function FormError({ message }: { message: string | undefined }) {
  return message ? (
    <Alert type="error" showIcon message={message} style={{ marginBottom: 16 }} />
  ) : null;
}

/** Cancel and submit, right-aligned. */
export function FormFooter({
  submitLabel,
  busy,
  danger,
  disabled,
  onCancel,
}: {
  submitLabel: string;
  busy: boolean;
  danger?: boolean;
  disabled?: boolean;
  onCancel(): void;
}) {
  const { messages } = useInsta();
  return (
    <Flex justify="end" gap={8}>
      <Button onClick={onCancel}>{messages.cancel}</Button>
      <Button type="primary" htmlType="submit" danger={danger} loading={busy} disabled={disabled}>
        {submitLabel}
      </Button>
    </Flex>
  );
}

/** The box where the user types `word` before a dangerous action. */
export function TypeToConfirmInput({
  word,
  value,
  onChange,
  autoFocus,
}: {
  word: string;
  value: string;
  onChange(value: string): void;
  autoFocus?: boolean;
}) {
  const { messages } = useInsta();
  return (
    <Input
      autoFocus={autoFocus}
      aria-label={messages.typeToConfirm(word)}
      placeholder={messages.typeToConfirm(word)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
