/** Actions: built-in ones (create, detail, edit, delete) and custom ones with their context. */
import type { AnyRecord, DataProvider, InstaContext, ResourceRef } from './data-provider.ts';
import {
  conditionMet,
  type Condition,
  type FieldDefinition,
  type NormalizedResource,
} from './resource.ts';
import type { Where } from './where.ts';

export type BuiltinAction = 'create' | 'detail' | 'edit' | 'delete';
export type ActionPlacement = 'row' | 'detail' | 'bulk' | 'toolbar';

export interface BuiltinActionConfig<T = AnyRecord> {
  builtin: BuiltinAction;
  label?: string;
  placement?: ActionPlacement[];
  confirm?: ActionConfirm<T>;
}

/** What an action runs on: one record, or the selected rows of a bulk action. */
export interface ActionTarget<T = AnyRecord> {
  record?: T;
  selection?: T[];
}

/** Text that may depend on the target, e.g. `({ selection }) => \`Archive ${selection?.length} orders?\``. */
export type ActionText<T = AnyRecord> = string | ((target: ActionTarget<T>) => string);

/** The text of an action's text slot for this target. */
export const actionText = <T>(text: ActionText<T> | undefined, target: ActionTarget<T>) =>
  typeof text === 'function' ? text(target) : text;

/**
 * Ask before running. With a `form`, this configures the form's dialog (its title, description,
 * button and danger state) and the form adds the inputs.
 */
export type ActionConfirm<T = AnyRecord> =
  | boolean
  | {
      title?: ActionText<T>;
      description?: ActionText<T>;
      /** The user must type this word before confirming. */
      typeToConfirm?: string;
      /** Confirm button text (default: the action's label; "Delete" for delete). */
      okText?: ActionText<T>;
      /** Red confirm button (default: the action's `danger`; true for delete). */
      danger?: boolean;
    };

/** Stable object passed to action handlers: no stale closures over app state. */
export interface ActionContext<T = AnyRecord> {
  record?: T;
  selection?: T[];
  resource: ResourceRef;
  dataProvider: DataProvider;
  ctx: InstaContext;
  refresh(): Promise<void>;
  navigate(to: string): void;
  notify: { success(message: string): void; error(message: string): void };
  /** Opens content (a React node) in a modal owned by instaui. */
  open(content: unknown, options?: { title?: string; width?: number | string }): void;
  /** Opens another resource's list in that modal, e.g. a record's history: `openResource('history', { ctx: { id } })`. */
  openResource(name: string, options?: OpenResourceOptions): void;
  close(): void;
  /** The action form's values, encoded like a create payload (when the action has a `form`). */
  values?: AnyRecord;
}

export interface OpenResourceOptions {
  /** Merged over the provider's context (fills `{ctx.x}` in the resource's `api.path`). */
  ctx?: InstaContext;
  /** Always applied to the list. */
  filter?: Where;
  /** Initial values for records created there. */
  defaults?: AnyRecord;
  title?: string;
  width?: number | string;
}

/**
 * Inputs an action collects before it runs, e.g. a reason or a date: ordinary fields, so each
 * one's `required` decides whether it must be filled. The dialog's text is the action's `confirm`.
 */
export interface ActionForm<T = AnyRecord> {
  fields: FieldDefinition[];
  /** Initial values, in wire format like a record. */
  initialValues?: (target: ActionTarget<T>) => AnyRecord;
  /** Dialog width. */
  width?: number | string;
}

export interface ActionDefinition<T = AnyRecord> {
  /** Also the access key: `access[id]`. */
  id: string;
  label: string;
  danger?: boolean;
  placement: ActionPlacement[];
  visibleIf?: Condition<T>;
  disabledIf?: Condition<T>;
  confirm?: ActionConfirm<T>;
  /** Collect these inputs first; `run` receives them as `values`. Shown with `confirm`'s text. */
  form?: ActionForm<T>;
  run: (context: ActionContext<T>) => unknown | Promise<unknown>;
  /** After `run` succeeds: refetch the resource's data (default), or leave it. */
  onSuccess?: 'refetch' | 'none';
}

export type ResourceAction<T = AnyRecord> =
  BuiltinAction | BuiltinActionConfig<T> | ActionDefinition<T>;

/** An action of a resource, built-in or custom, in one shape. */
export interface ResolvedAction {
  key: string;
  label: string;
  danger?: boolean;
  placement: ActionPlacement[];
  confirm?: ActionConfirm;
  builtin?: BuiltinAction;
  custom?: ActionDefinition;
}

export type CustomAction = ResolvedAction & { custom: ActionDefinition };

export const isCustom = (action: ResolvedAction): action is CustomAction =>
  action.custom !== undefined;

const BUILTIN_PLACEMENT: Record<BuiltinAction, ActionPlacement[]> = {
  create: ['toolbar'],
  detail: ['row'],
  edit: ['row', 'detail'],
  delete: ['row', 'detail'],
};

/** A resource's actions, with built-ins given their labels, placements and delete's confirm. */
export function resolveActions(
  resource: NormalizedResource,
  labels: Record<BuiltinAction, string>,
): ResolvedAction[] {
  return resource.actions.map((action): ResolvedAction => {
    if (typeof action === 'string' || 'builtin' in action) {
      const config: BuiltinActionConfig = typeof action === 'string' ? { builtin: action } : action;
      const { builtin } = config;
      return {
        key: builtin,
        builtin,
        label: config.label ?? labels[builtin],
        danger: builtin === 'delete',
        placement: config.placement ?? BUILTIN_PLACEMENT[builtin],
        confirm: config.confirm ?? (builtin === 'delete' ? true : undefined),
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

/** Allowed, and its `visibleIf` holds for the record. */
export function actionVisible(
  action: ResolvedAction,
  record: AnyRecord | undefined,
  allowed: (key: string, record?: AnyRecord) => boolean,
  ctx: InstaContext,
): boolean {
  if (!allowed(action.key, record)) return false;
  return conditionMet(action.custom?.visibleIf, record ?? {}, ctx, record);
}

export function actionDisabled(
  action: ResolvedAction,
  record: AnyRecord | undefined,
  ctx: InstaContext,
): boolean {
  const { disabledIf } = action.custom ?? {};
  return disabledIf ? conditionMet(disabledIf, record ?? {}, ctx, record) : false;
}

/** What an action's dialog says. */
export interface ActionDialogText {
  title: string;
  description?: string;
  typeToConfirm?: string;
  okText: string;
  danger: boolean;
}

/** Delete's dialog text when its `confirm` doesn't say. */
export interface DeleteDialogDefaults {
  title: string;
  description: string;
  okText: string;
}

/** The dialog text for this target: the action's `confirm`, else defaults (delete has its own). */
export function actionDialogText(
  action: ResolvedAction,
  target: ActionTarget,
  forDelete: DeleteDialogDefaults,
): ActionDialogText {
  const options = typeof action.confirm === 'object' ? action.confirm : {};
  const isDelete = action.builtin === 'delete';
  return {
    title: actionText(options.title, target) ?? (isDelete ? forDelete.title : action.label),
    description:
      actionText(options.description, target) ?? (isDelete ? forDelete.description : undefined),
    typeToConfirm: options.typeToConfirm,
    okText: actionText(options.okText, target) ?? (isDelete ? forDelete.okText : action.label),
    danger: options.danger ?? action.danger ?? false,
  };
}
