/** The detail and create/edit containers of `ResourceCrud`: access, loading and not-found states. */
import { Flex, Result, Spin } from 'antd';
import { createElement, type ComponentType, type ReactNode } from 'react';
import type { AnyRecord, Id } from '../../core/data-provider.ts';
import { errorMessage } from '../../core/http-error.ts';
import { recordLabel } from '../../core/label.ts';
import type { NormalizedResource } from '../../core/resource.ts';
import { useInsta } from '../../react/context.tsx';
import type { Notify } from '../notify.tsx';
import { Container, ResourceDetail } from '../ResourceDetail.tsx';
import { ResourceForm } from '../ResourceForm.tsx';
import type { ViewProps } from './viewProps.ts';

interface RecordState {
  record?: AnyRecord;
  /** The record could not be loaded. */
  error?: unknown;
  /** The user may see this view. */
  allowed: boolean;
}

/** 403 / 404 / loading, or the content. A render function, not a component: no remounts. */
function guarded(
  { record, error, allowed }: RecordState,
  needsRecord: boolean,
  messages: { notAllowed: string; notFound: string },
  content: () => ReactNode,
): ReactNode {
  if (!allowed) return <Result status="403" title={messages.notAllowed} />;
  if (needsRecord && error) {
    return <Result status="404" title={messages.notFound} subTitle={errorMessage(error)} />;
  }
  if (needsRecord && !record) return <Spin />;
  return content();
}

export function DetailView({
  resource,
  open,
  state,
  override,
  viewProps,
  footer,
  basePathOf,
  onClose,
}: {
  resource: NormalizedResource;
  open: boolean;
  state: RecordState;
  override?: ComponentType<ViewProps>;
  viewProps: ViewProps;
  footer: ReactNode;
  basePathOf(name: string): string;
  onClose(): void;
}) {
  const { messages } = useInsta();
  const { record } = state;
  const body = guarded(state, true, messages, () =>
    override ? (
      createElement(override, viewProps)
    ) : (
      <ResourceDetail resource={resource} record={record!} basePathOf={basePathOf} />
    ),
  );
  return (
    <Container
      options={resource.detail?.container ?? { type: 'drawer', width: 560 }}
      open={open}
      title={record ? recordLabel(resource, record) : resource.label.one}
      onClose={onClose}
      footer={
        record && state.allowed ? (
          <Flex justify="end" gap={8}>
            {footer}
          </Flex>
        ) : undefined
      }
    >
      {body}
    </Container>
  );
}

export function FormView({
  resource,
  mode,
  id,
  state,
  defaults,
  override,
  viewProps,
  notify,
  onClose,
}: {
  resource: NormalizedResource;
  mode?: 'create' | 'edit';
  id?: Id;
  state: RecordState;
  defaults?: AnyRecord;
  override?: ComponentType<ViewProps>;
  viewProps: ViewProps;
  notify: Notify;
  onClose(): void;
}) {
  const { messages } = useInsta();
  const label = resource.label.one.toLowerCase();
  const title =
    mode === 'create'
      ? (resource.form?.title?.create ?? messages.createTitle(label))
      : (resource.form?.title?.edit ?? messages.editTitle(label));
  const body = guarded(state, mode === 'edit', messages, () =>
    override ? (
      createElement(override, viewProps)
    ) : (
      <ResourceForm
        key={`${resource.name}:${id ?? 'new'}:${mode}`}
        resource={resource}
        mode={mode!}
        record={mode === 'edit' ? state.record : undefined}
        id={id}
        defaults={defaults}
        notify={notify}
        onCancel={onClose}
        onDone={onClose}
      />
    ),
  );
  return (
    <Container
      options={resource.form?.container ?? { type: 'modal', width: 640 }}
      open={mode !== undefined}
      title={title}
      onClose={onClose}
    >
      {mode === undefined ? null : body}
    </Container>
  );
}
