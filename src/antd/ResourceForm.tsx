/**
 * The create/edit form. Keyed by resource + record + mode with initial values taken once at mount:
 * values can't leak between records, and a background refetch never overwrites what the user typed.
 */
import { Alert, Button, Flex, Form, type FormInstance, type FormRule as Rule } from 'antd';
import { useMemo, useState } from 'react';
import { codecFor, isEmptyValue } from '../core/codecs.ts';
import type { AnyRecord, Id } from '../core/data-provider.ts';
import type { FieldErrors } from '../core/http-error.ts';
import { decodeRecord } from '../core/payload.ts';
import {
  conditionMet,
  type FormMode,
  type NormalizedField,
  type NormalizedResource,
} from '../core/resource.ts';
import { resolveVars } from '../core/where.ts';
import { useInsta } from '../react/context.tsx';
import { useResourceSubmit } from '../react/submit.ts';
import { resolveWidget } from './fields.tsx';
import type { Notify } from './notify.tsx';

export interface ResourceFormProps {
  resource: NormalizedResource;
  mode: FormMode;
  record?: AnyRecord;
  id?: Id;
  notify: Notify;
  onDone(saved?: AnyRecord): void;
  onCancel(): void;
}

const namePath = (key: string) => key.split('.');

function applyFieldErrors(form: FormInstance, errors: FieldErrors): string | undefined {
  const fields = Object.entries(errors)
    .filter(([key]) => key !== '_form')
    .map(([key, message]) => ({
      name: namePath(key),
      errors: Array.isArray(message) ? message : [message],
    }));
  form.setFields(fields);
  const formLevel = errors._form;
  return formLevel === undefined
    ? undefined
    : Array.isArray(formLevel)
      ? formLevel.join(' ')
      : formLevel;
}

export function ResourceForm({
  resource,
  mode,
  record,
  id,
  notify,
  onDone,
  onCancel,
}: ResourceFormProps) {
  const { env, ctx, registry, messages } = useInsta();
  const codecs = registry.codecs as Parameters<typeof codecFor>[1];
  const [form] = Form.useForm();
  const [initialValues] = useState(() => decodeRecord(resource, record, mode, env, codecs));
  const watched = Form.useWatch((all: AnyRecord) => all, form) as AnyRecord | undefined;
  const values = watched ?? initialValues;
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const submit = useResourceSubmit(resource.name);

  const visibleFields = useMemo(
    () =>
      resource.fields.filter(
        (f) => f[mode] !== 'hidden' && conditionMet(f.visibleIf, values, ctx, record),
      ),
    [resource.fields, mode, values, ctx, record],
  );

  const rulesFor = (field: NormalizedField): Rule[] => {
    const codec = codecFor(field.type, codecs);
    const required =
      field.required ||
      (field.requiredIf !== undefined && conditionMet(field.requiredIf, values, ctx, record));
    const rules: Rule[] = [];
    if (required) {
      rules.push({
        validator: (_, v) =>
          isEmptyValue(codec, v)
            ? Promise.reject(new Error(messages.required(field.label)))
            : Promise.resolve(),
      });
    }
    if (field.validate) {
      const validate = field.validate;
      rules.push({
        validator: async (_, v) => {
          if (isEmptyValue(codec, v)) return; // emptiness is `required`'s job
          const message = await validate(v, form.getFieldsValue(true) as never);
          if (message) throw new Error(message);
        },
      });
    }
    if (field.type === 'json') {
      rules.push({
        validator: (_, v) => {
          if (typeof v !== 'string' || v.trim() === '') return Promise.resolve();
          try {
            JSON.parse(v);
            return Promise.resolve();
          } catch {
            return Promise.reject(new Error(messages.invalidJson));
          }
        },
      });
    }
    return rules;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      scrollToFirstError
      onValuesChange={(changed: AnyRecord) => {
        const changedKeys = Object.keys(changed);
        for (const field of resource.fields) {
          if (field.resetOn?.some((k) => changedKeys.includes(k.split('.')[0]!)))
            form.setFieldValue(namePath(field.key), undefined);
        }
      }}
      onFinishFailed={() => notify.error(messages.formInvalid)}
      onFinish={async (submitted: AnyRecord) => {
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
      {formError ? (
        <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} />
      ) : null}
      {visibleFields.map((field) => {
        const Widget = resolveWidget(field, registry);
        const disabled =
          field[mode] === 'readonly' ||
          (field.readOnlyIf !== undefined && conditionMet(field.readOnlyIf, values, ctx, record));
        const params = field.props.params
          ? resolveVars(field.props.params, { values, ctx })
          : undefined;
        return (
          <Form.Item
            key={field.key}
            name={namePath(field.key)}
            label={field.label}
            extra={field.help}
            rules={rulesFor(field)}
          >
            <Widget field={field} mode={mode} disabled={disabled} values={values} params={params} />
          </Form.Item>
        );
      })}
      <Flex justify="end" gap={8}>
        <Button onClick={onCancel}>{messages.cancel}</Button>
        <Button type="primary" htmlType="submit" loading={saving}>
          {messages.save}
        </Button>
      </Flex>
    </Form>
  );
}
