/**
 * Resource definitions: one definition drives list, filters, forms, detail, actions and access.
 * Behaviour slots accept a JSON form (often with a code form too), so a definition can be served by
 * a backend. Code only: a field's and the form's `validate`, `form.beforeSubmit`,
 * `form.validatePayload`, `form.confirm`, and an action's `run` and `form.initialValues`.
 */
import type {
  AnyRecord,
  Id,
  InstaContext,
  ResourceApi,
  ResourceRef,
  SortSpec,
} from './data-provider.ts';
import type { FieldErrors } from './http-error.ts';
import type { BuiltinAction, ResourceAction } from './actions.ts';
import { evaluateWhere, type Operator, type Where } from './where.ts';

export type FieldMode = 'editable' | 'readonly' | 'hidden';
export type FormMode = 'create' | 'edit';

/** Built-in field types. Custom types are any other string registered on the provider. */
export type BuiltinFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'enum'
  | 'tags'
  | 'relation'
  | 'json';
export type FieldTypeName = BuiltinFieldType | (string & {});

export interface EnumOption {
  value: string | number | boolean;
  label: string;
  color?: string;
}

/** Type-specific props. Unknown keys are allowed for custom field types. */
export interface FieldProps {
  /** enum */
  options?: EnumOption[];
  /** enum, relation, tags */
  multiple?: boolean;
  /** relation: target resource name */
  resource?: string;
  /** relation: `{…}` label template for options and display */
  label?: string;
  /** relation: fields searched server-side */
  searchFields?: string[];
  /** relation: extra filter for options; may reference `{ $var: 'values.x' }` */
  params?: Where;
  /** relation: whether a value links to its record's route (default) or is plain text */
  link?: 'route' | 'none';
  /** text */
  trim?: boolean;
  /** number */
  min?: number;
  max?: number;
  precision?: number;
  /** date/datetime/time display and picker format */
  format?: string;
  [key: string]: unknown;
}

export interface ListColumnOptions {
  sortable?: boolean;
  width?: number;
  pin?: 'start' | 'end';
}

export interface FilterOptions {
  operators?: Operator[];
  /** Query/URL param name, when it differs from the field key. */
  param?: string;
  /** Range filters sent as two params, e.g. `['createdFrom', 'createdTo']` (`$gte` / `$lte`). */
  paramRange?: [string, string];
  /** enum/relation/tags filters: pick several values (`$in`, default) or one (`$eq`). */
  multiple?: boolean;
  /** Filter input override, e.g. `'relation'` (with `props.resource`) on a text field. */
  widget?: string;
}

/** A `Where` or a function. In forms, `record` is the record being edited (undefined on create). */
export type Condition<T> = Where | ((values: T, ctx: InstaContext, record?: AnyRecord) => boolean);

/** An access rule: boolean, `Where` on the record, or a function. */
export type AccessRule =
  boolean | Where | ((record: AnyRecord | undefined, ctx: InstaContext) => boolean);

export interface ListTab {
  key: string;
  label: string;
  /** Filter applied while this tab is active (AND-ed with the user's filters). */
  filter?: Where;
}

export interface FieldDefinition<T = AnyRecord> {
  /** Dot paths allowed (`'manager.email'`). */
  key: string;
  type: FieldTypeName;
  props?: FieldProps;
  label?: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  default?: unknown;
  validate?: (value: unknown, values: T) => string | undefined | Promise<string | undefined>;
  /** Show in the list (default true). */
  list?: boolean | ListColumnOptions;
  /** Show in the detail view (default true). */
  detail?: boolean;
  /** Offer a filter (default false). */
  filter?: boolean | FilterOptions;
  create?: FieldMode;
  edit?: FieldMode;
  visibleIf?: Condition<T>;
  requiredIf?: Condition<T>;
  readOnlyIf?: Condition<T>;
  /** Clear this field when any of these fields change. */
  resetOn?: string[];
  /** Input component: registry key or component. */
  widget?: unknown;
  /** Read-only renderer for cells and detail: registry key or component. */
  display?: unknown;
  /** `'whenVisible'` (default) drops hidden/read-only fields from the payload. */
  submit?: 'always' | 'whenVisible' | 'never';
}

/** A confirmation shown before a form is saved (`form.confirm`). */
export interface SubmitConfirm {
  title: string;
  description?: string;
  okText?: string;
  danger?: boolean;
}

/** Passed to submit hooks. `record` is the record being edited (undefined on create). */
export interface SubmitInfo {
  mode: FormMode;
  ctx: InstaContext;
  record?: AnyRecord;
}

export type Validator<T> = (
  values: T,
  info: { mode: FormMode; ctx: InstaContext },
) => FieldErrors | undefined | Promise<FieldErrors | undefined>;

export interface ContainerOptions {
  type: 'modal' | 'drawer' | 'page';
  width?: number | string;
}

export interface ResourceDefinition<T extends object = AnyRecord> {
  /** Registry key, default route segment and i18n namespace. */
  name: string;
  label?: string | { one: string; other: string };
  idField?: string | ((record: T) => Id);
  /** Record label: `{…}` template or function. */
  recordLabel?: string | ((record: T) => string);
  api?: ResourceApi;
  /** `'page'` renders `components.page` and never fetches a list. */
  kind?: 'collection' | 'page';
  /** In `InstaAdmin`'s menu (default true), optionally ordered: `{ order: 2 }`. */
  menu?: boolean | { order?: number };
  fields: FieldDefinition<T>[];
  list?: {
    pageSize?: number;
    sort?: SortSpec[];
    /** Permanent filter, AND-ed with the user's filters. */
    filter?: Where;
    search?: boolean;
    /** Tabs above the list; the first is the default. Synced to `?tab=`. */
    tabs?: ListTab[];
    /** Active-filter chips with clear buttons; `savedViews` stores named filter sets per browser. */
    filterBar?: boolean | { savedViews?: boolean };
    /** Rows that bulk actions may select (default: all). */
    selectable?: Condition<T>;
  };
  form?: {
    container?: ContainerOptions;
    title?: { create?: string; edit?: string };
    validate?: Validator<T>;
    /** Escape hatch run after encoding; prefer field codecs. Defaults `patch` to `'full'`. */
    beforeSubmit?: (payload: AnyRecord, info: SubmitInfo) => AnyRecord;
    patch?: 'diff' | 'full';
    /** What an update sends for an empty value: `'null'` (default: clears it) or `'omit'` (sends nothing). */
    emptyValue?: 'null' | 'omit';
    /**
     * Validates the final payload (after encoding and `beforeSubmit`), for rules written against the
     * API shape. Return field messages, a form-level message, or nothing. A thrown error is shown too.
     */
    validatePayload?: (
      payload: AnyRecord,
      info: SubmitInfo,
    ) => FieldErrors | string | undefined | Promise<FieldErrors | string | undefined>;
    /**
     * Ask before saving, e.g. when a change has consequences. Receives the form values; return a
     * confirmation to show, or nothing to save straight away.
     */
    confirm?: (values: T, info: SubmitInfo) => SubmitConfirm | undefined | false;
  };
  detail?: { container?: ContainerOptions };
  actions?: ResourceAction<T>[];
  /** Per action: boolean or a `Where` on the record. AND-ed with the provider's `can()`. */
  access?: Partial<Record<BuiltinAction | 'list' | (string & {}), AccessRule>>;
  /** View overrides, plus `rowActions`: extra content rendered in each row's actions cell. */
  components?: Partial<Record<'page' | 'detail' | 'create' | 'edit' | 'rowActions', unknown>>;
  [extension: `x-${string}`]: unknown;
}

/**
 * Identity function that type-checks a definition. `NoInfer` keeps the record type from being
 * inferred from where the result goes (e.g. inline in `resources={[…]}`), which would make it `never`.
 */
export function defineResource<T extends object = AnyRecord>(
  definition: ResourceDefinition<T>,
): ResourceDefinition<NoInfer<T>> {
  return definition;
}

export interface NormalizedField<T = AnyRecord> extends FieldDefinition<T> {
  label: string;
  props: FieldProps;
  list: false | ListColumnOptions;
  detail: boolean;
  filter: false | FilterOptions;
  create: FieldMode;
  edit: FieldMode;
  submit: 'always' | 'whenVisible' | 'never';
}

export interface NormalizedResource<T extends object = AnyRecord> extends ResourceDefinition<T> {
  label: { one: string; other: string };
  idField: string | ((record: T) => Id);
  api: ResourceApi;
  kind: 'collection' | 'page';
  fields: NormalizedField<T>[];
  list: {
    pageSize: number;
    sort: SortSpec[];
    filter: Where;
    search: boolean;
    tabs: ListTab[];
    filterBar?: { savedViews?: boolean };
    selectable?: Condition<T>;
  };
  patch: 'diff' | 'full';
  actions: ResourceAction<T>[];
  ref: ResourceRef;
}

const humanize = (key: string) =>
  key
    .split('.')
    .pop()!
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_ACTIONS: BuiltinAction[] = ['create', 'detail', 'edit', 'delete'];

export function normalizeField<T>(field: FieldDefinition<T>): NormalizedField<T> {
  const list = field.list ?? field.type !== 'json';
  const filter = field.filter ?? false;
  return {
    ...field,
    label: field.label ?? humanize(field.key),
    props: field.props ?? {},
    list: list === true ? {} : list,
    detail: field.detail ?? true,
    filter: filter === true ? {} : filter,
    create: field.create ?? 'editable',
    edit: field.edit ?? 'editable',
    submit: field.submit ?? 'whenVisible',
  };
}

export function normalizeResource<T extends object>(
  definition: ResourceDefinition<T>,
  defaults: { pageSize?: number } = {},
): NormalizedResource<T> {
  const label =
    typeof definition.label === 'object'
      ? definition.label
      : {
          one: definition.label ?? humanize(definition.name),
          other: definition.label ?? humanize(definition.name),
        };
  const idField = definition.idField ?? 'id';
  const api = definition.api ?? {};
  return {
    ...definition,
    label,
    idField,
    api,
    kind: definition.kind ?? 'collection',
    fields: definition.fields.map(normalizeField),
    list: {
      pageSize: definition.list?.pageSize ?? defaults.pageSize ?? DEFAULT_PAGE_SIZE,
      sort: definition.list?.sort ?? [],
      filter: definition.list?.filter ?? {},
      search: definition.list?.search ?? false,
      tabs: definition.list?.tabs ?? [],
      filterBar:
        definition.list?.filterBar === true
          ? { savedViews: false }
          : definition.list?.filterBar || undefined,
      selectable: definition.list?.selectable,
    },
    patch: definition.form?.patch ?? (definition.form?.beforeSubmit ? 'full' : 'diff'),
    actions: definition.actions ?? DEFAULT_ACTIONS,
    ref: {
      name: definition.name,
      idField: idField as ResourceRef['idField'],
      api,
      params: Object.fromEntries(
        definition.fields.flatMap((f) =>
          typeof f.filter === 'object' && f.filter.param ? [[f.key, f.filter.param]] : [],
        ),
      ),
      paramRanges: Object.fromEntries(
        definition.fields.flatMap((f) =>
          typeof f.filter === 'object' && f.filter.paramRange ? [[f.key, f.filter.paramRange]] : [],
        ),
      ),
    },
  };
}

/** Evaluates a `Condition` (JSON `Where` or function) against form values. */
export function conditionMet<T>(
  condition: Condition<T> | undefined,
  values: T,
  ctx: InstaContext,
  record?: AnyRecord,
): boolean {
  if (condition === undefined) return true;
  return typeof condition === 'function'
    ? condition(values, ctx, record)
    : evaluateWhere(condition, { values, ctx, record });
}
