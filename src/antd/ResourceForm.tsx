/**
 * The create/edit form. Keyed by resource + record + mode with initial values taken once at mount:
 * values can't leak between records, and a background refetch never overwrites what the user typed.
 */
import { Form, Modal } from 'antd';
import { useState } from 'react';
import type { AnyRecord, Id } from '../core/data-provider.ts';
import { setPath } from '../core/path.ts';
import type { FormMode, NormalizedResource } from '../core/resource.ts';
import { useInsta } from '../react/context.tsx';
import { useResourceSubmit } from '../react/submit.ts';
import { FormError, FormFooter, useFieldForm } from './form-parts.tsx';
import { applyFieldErrors, FormFields, resetDependents } from './FormFields.tsx';
import type { Notify } from './notify.tsx';

export interface ResourceFormProps {
  resource: NormalizedResource;
  mode: FormMode;
  record?: AnyRecord;
  id?: Id;
  /** Initial values for a new record, in wire format (merged over field defaults). */
  defaults?: AnyRecord;
  notify: Notify;
  onDone(saved?: AnyRecord): void;
  onCancel(): void;
}

export function ResourceForm({
  resource,
  mode,
  record,
  id,
  defaults,
  notify,
  onDone,
  onCancel,
}: ResourceFormProps) {
  const { ctx, messages } = useInsta();
  const [modal, modalHolder] = Modal.useModal();
  const { form, initialValues, values } = useFieldForm(
    resource,
    mode === 'create' && defaults ? { ...fieldDefaults(resource), ...defaults } : record,
    mode,
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const submit = useResourceSubmit(resource.name);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      scrollToFirstError
      onValuesChange={(changed: AnyRecord) => resetDependents(form, resource.fields, changed)}
      onFinishFailed={() => notify.error(messages.formInvalid)}
      onFinish={async (submitted: AnyRecord) => {
        const ask = resource.form?.confirm?.(submitted, { mode, ctx, record });
        if (ask) {
          const ok = await modal.confirm({
            title: ask.title,
            content: ask.description,
            okText: ask.okText ?? messages.save,
            okButtonProps: { danger: ask.danger },
            cancelText: messages.cancel,
          });
          if (!ok) return;
        }
        setSaving(true);
        setFormError(undefined);
        try {
          const result = await submit({ mode, values: submitted, original: record, id });
          if (result.ok) {
            notify.success(mode === 'create' ? messages.created : messages.saved);
            onDone(result.data);
          } else {
            const formLevel = applyFieldErrors(form, result.fieldErrors);
            setFormError(formLevel ?? result.message);
            notify.error(messages.saveFailed, formLevel ?? result.message);
          }
        } finally {
          setSaving(false);
        }
      }}
    >
      {modalHolder}
      <FormError message={formError} />
      <FormFields
        fields={resource.fields}
        mode={mode}
        form={form}
        values={values}
        record={record}
      />
      <FormFooter submitLabel={messages.save} busy={saving} onCancel={onCancel} />
    </Form>
  );
}

/** Field defaults as a wire-format record, so `defaults` can be merged over them. */
function fieldDefaults(resource: NormalizedResource): AnyRecord {
  let out: AnyRecord = {};
  for (const field of resource.fields) {
    if (field.default !== undefined) out = setPath(out, field.key, field.default);
  }
  return out;
}
