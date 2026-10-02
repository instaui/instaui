/**
 * The inputs an action collects before it runs (`action.form`): the same field types, rules and
 * widgets as resource forms. Values are encoded like a create payload and handed to `run`; a
 * thrown `HttpError` with field errors puts them on the matching inputs.
 */
import { Alert, Button, Flex, Form } from 'antd';
import { useMemo, useState } from 'react';
import type { codecFor } from '../core/codecs.ts';
import type { AnyRecord } from '../core/data-provider.ts';
import { errorMessage, isHttpError } from '../core/http-error.ts';
import { buildSubmitPayload, decodeRecord } from '../core/payload.ts';
import { normalizeResource, type ActionForm as ActionFormConfig } from '../core/resource.ts';
import { useInsta } from '../react/context.tsx';
import { applyFieldErrors, FormFields, resetDependents } from './FormFields.tsx';

export interface ActionFormProps {
  /** Unique per action, e.g. `orders.refund`. */
  id: string;
  config: ActionFormConfig;
  submitLabel: string;
  /** Wire-format initial values. */
  initial?: AnyRecord;
  onSubmit(values: AnyRecord): Promise<void>;
  onCancel(): void;
}

export function ActionForm({
  id,
  config,
  submitLabel,
  initial,
  onSubmit,
  onCancel,
}: ActionFormProps) {
  const { env, ctx, registry, messages } = useInsta();
  const codecs = registry.codecs as Parameters<typeof codecFor>[1];
  // A throwaway resource gives the fields the same normalisation and codecs as resource forms.
  const resource = useMemo(
    () => normalizeResource({ name: id, fields: config.fields, form: { emptyValue: 'omit' } }),
    [id, config.fields],
  );
  const [form] = Form.useForm();
  const [initialValues] = useState(() => decodeRecord(resource, initial, 'create', env, codecs));
  const watched = Form.useWatch((all: AnyRecord) => all, form) as AnyRecord | undefined;
  const values = watched ?? initialValues;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

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
            codecs,
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
      {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}
      <FormFields fields={resource.fields} mode="create" form={form} values={values} />
      <Flex justify="end" gap={8}>
        <Button onClick={onCancel}>{messages.cancel}</Button>
        <Button type="primary" htmlType="submit" loading={busy}>
          {submitLabel}
        </Button>
      </Flex>
    </Form>
  );
}
