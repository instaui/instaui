/**
 * The submit pipeline, renderer-independent:
 *   form values → resource `form.validate` → encode + diff → `beforeSubmit` → provider → field errors.
 * Validation sees the form values, never the transformed payload, so `beforeSubmit` can't hide
 * a field the validator depends on.
 */
import { useCallback } from 'react';
import { CodecError } from '../core/codecs.ts';
import type { AnyRecord, Id } from '../core/data-provider.ts';
import { errorMessage, isHttpError, type FieldErrors } from '../core/http-error.ts';
import { buildSubmitPayload } from '../core/payload.ts';
import type { FormMode } from '../core/resource.ts';
import { useInsta, useResource } from './context.tsx';
import { useResourceMutations } from './data.ts';

export type SubmitResult =
  | { ok: true; data?: AnyRecord; payload: AnyRecord }
  | { ok: false; fieldErrors: FieldErrors; message: string };

const hasErrors = (e: FieldErrors | undefined): e is FieldErrors =>
  !!e && Object.keys(e).length > 0;

export function useResourceSubmit(resourceName: string) {
  const resource = useResource(resourceName);
  const { ctx, env, registry, messages } = useInsta();
  const { create, update } = useResourceMutations(resourceName);

  return useCallback(
    async ({
      mode,
      values,
      original,
      id,
    }: {
      mode: FormMode;
      values: AnyRecord;
      original?: AnyRecord;
      id?: Id;
    }): Promise<SubmitResult> => {
      const invalid = await resource.form?.validate?.(values, { mode, ctx });
      if (hasErrors(invalid))
        return { ok: false, fieldErrors: invalid, message: messages.formInvalid };

      let payload: AnyRecord;
      try {
        payload = buildSubmitPayload({
          resource,
          mode,
          values,
          original,
          ctx,
          env,
          codecs: registry.codecs,
        });
      } catch (error) {
        if (error instanceof CodecError)
          return { ok: false, fieldErrors: {}, message: error.message };
        throw error;
      }

      if (resource.form?.validatePayload) {
        let result: FieldErrors | string | undefined;
        try {
          result = await resource.form.validatePayload(payload, { mode, ctx, record: original });
        } catch (error) {
          result = errorMessage(error, messages.formInvalid);
        }
        if (typeof result === 'string' && result) {
          return { ok: false, fieldErrors: { _form: result }, message: result };
        }
        if (typeof result === 'object' && hasErrors(result)) {
          const formLevel = result._form;
          return {
            ok: false,
            fieldErrors: result,
            message: formLevel === undefined ? messages.formInvalid : [formLevel].flat().join(' '),
          };
        }
      }

      try {
        if (mode === 'create') {
          const res = await create.mutateAsync(payload);
          return { ok: true, data: res.data as AnyRecord | undefined, payload };
        }
        if (id === undefined) throw new Error('Cannot update a record without an id');
        if (Object.keys(payload).length === 0) return { ok: true, payload }; // nothing changed
        const res = await update.mutateAsync({ id, data: payload, previousData: original });
        return { ok: true, data: res.data as AnyRecord | undefined, payload };
      } catch (error) {
        return {
          ok: false,
          fieldErrors: isHttpError(error) ? (error.fieldErrors ?? {}) : {},
          message: errorMessage(error, messages.saveFailed),
        };
      }
    },
    [resource, ctx, env, registry.codecs, messages, create, update],
  );
}
