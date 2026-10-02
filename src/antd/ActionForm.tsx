/**
 * The inputs an action collects before it runs (`action.form`): the same field types, rules and
 * widgets as resource forms. Values are encoded like a create payload and handed to `run`; a
 * thrown `HttpError` with field errors puts them on the matching inputs.
 */
import { Form, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { AnyRecord } from '../core/data-provider.ts';
import { errorMessage, isHttpError } from '../core/http-error.ts';
import { buildSubmitPayload } from '../core/payload.ts';
import { normalizeResource } from '../core/resource.ts';
import type { ActionForm as ActionFormConfig } from '../core/actions.ts';
import { useInsta } from '../react/context.tsx';
import { FormError, FormFooter, TypeToConfirmInput, useFieldForm } from './form-parts.tsx';
import { applyFieldErrors, FormFields, resetDependents } from './FormFields.tsx';

export interface ActionFormProps {
  /** Unique per action, e.g. `orders.refund`. */
  id: string;
  config: ActionFormConfig;
  submitLabel: string;
  /** Wire-format initial values. */
  initial?: AnyRecord;
  /** Shown above the inputs (the action's `confirm.description`). */
  description?: string;
  /** Red submit button. */
  danger?: boolean;
  /** The user must type this word before submitting. */
  typeToConfirm?: string;
  onSubmit(values: AnyRecord): Promise<void>;
  onCancel(): void;
}

export function ActionForm({
  id,
  config,
  submitLabel,
  initial,
  description,
  danger,
  typeToConfirm,
  onSubmit,
  onCancel,
}: ActionFormProps) {
  const { env, ctx, registry } = useInsta();
  // A throwaway resource gives the fields the same normalisation and codecs as resource forms.
  const resource = useMemo(
    () => normalizeResource({ name: id, fields: config.fields, form: { emptyValue: 'omit' } }),
    [id, config.fields],
  );
  const { form, initialValues, values } = useFieldForm(resource, initial, 'create');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [typed, setTyped] = useState('');

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={(changed: AnyRecord) => resetDependents(form, resource.fields, changed)}
      onFinish={async (submitted: AnyRecord) => {
        setBusy(true);
        setError(undefined);
        try {
          const payload = buildSubmitPayload({
            resource,
            mode: 'create',
            values: submitted,
            ctx,
            env,
            codecs: registry.codecs,
          });
          await onSubmit(payload);
        } catch (e) {
          const formLevel =
            isHttpError(e) && e.fieldErrors ? applyFieldErrors(form, e.fieldErrors) : undefined;
          setError(formLevel ?? errorMessage(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      {description ? <Typography.Paragraph>{description}</Typography.Paragraph> : null}
      <FormError message={error} />
      <FormFields fields={resource.fields} mode="create" form={form} values={values} />
      {typeToConfirm ? (
        <Form.Item>
          <TypeToConfirmInput word={typeToConfirm} value={typed} onChange={setTyped} />
        </Form.Item>
      ) : null}
      <FormFooter
        submitLabel={submitLabel}
        busy={busy}
        danger={danger}
        disabled={typeToConfirm ? typed !== typeToConfirm : false}
        onCancel={onCancel}
      />
    </Form>
  );
}
