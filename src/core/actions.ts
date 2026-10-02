/** Actions: built-in ones (create, detail, edit, delete) and custom ones with their context. */
import type { AnyRecord, DataProvider, InstaContext, ResourceRef } from './data-provider.ts';
import type { Condition, FieldDefinition } from './resource.ts';
import type { Where } from './where.ts';

export type BuiltinAction = 'create' | 'detail' | 'edit' | 'delete';
export type ActionPlacement = 'row' | 'detail' | 'bulk' | 'toolbar';

export interface BuiltinActionConfig<T = AnyRecord> {
  builtin: BuiltinAction;
  label?: string;
  icon?: string;
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
  icon?: string;
  danger?: boolean;
  placement: ActionPlacement[];
  visibleIf?: Condition<T>;
  disabledIf?: Condition<T>;
  confirm?: ActionConfirm<T>;
  /** Collect these inputs first; `run` receives them as `values`. Shown with `confirm`'s text. */
  form?: ActionForm<T>;
  run: (context: ActionContext<T>) => unknown | Promise<unknown>;
  onSuccess?: 'refetch' | 'close' | 'none';
}

export type ResourceAction<T = AnyRecord> =
  BuiltinAction | BuiltinActionConfig<T> | ActionDefinition<T>;
