// instaui: config-first CRUD for antd. The single entry point.

// ── core ─────────────────────────────────────────────────────────────────────
export { builtinCodecs, CodecError, setupDayjs } from './core/codecs.ts';
export type { CodecContext, CodecEnv, FieldCodec, Timezone } from './core/codecs.ts';
export { recordId } from './core/data-provider.ts';
export type {
  AnyRecord,
  CustomParams,
  DataProvider,
  HttpMethod,
  Id,
  InstaContext,
  ListParams,
  ListResult,
  PageInfo,
  Pagination,
  QueryValue,
  ResourceApi,
  ResourceRef,
  SortSpec,
} from './core/data-provider.ts';
export { errorMessage, HttpError, isHttpError } from './core/http-error.ts';
export type { FieldErrors, HttpErrorInit } from './core/http-error.ts';
export { recordLabel } from './core/label.ts';
export { defaultUrlCodec } from './core/list-state.ts';
export type { ListDefaults, ListState, UrlCodec } from './core/list-state.ts';
export { createMemoryProvider } from './core/memory-provider.ts';
export type { MemoryProviderOptions } from './core/memory-provider.ts';
export { resourceKeys } from './core/query-keys.ts';
export { conditionMet, defineResource, normalizeResource } from './core/resource.ts';
export type {
  ActionConfirm,
  ActionContext,
  ActionDefinition,
  ActionPlacement,
  BuiltinAction,
  BuiltinActionConfig,
  BuiltinFieldType,
  Condition,
  ContainerOptions,
  EnumOption,
  FieldDefinition,
  FieldMode,
  FieldProps,
  FieldTypeName,
  FilterOptions,
  FormMode,
  ListColumnOptions,
  NormalizedField,
  NormalizedResource,
  ResourceAction,
  ResourceDefinition,
  Validator,
} from './core/resource.ts';
export {
  createRestProvider,
  defaultDecodeList,
  defaultDecodeOne,
  defaultEncodeBody,
  defaultEncodeList,
  defaultMapError,
  defaultUrlFor,
  fromApiClient,
} from './core/rest-provider.ts';
export type {
  ApiClientLike,
  RestOperation,
  RestProviderOptions,
  RestRequest,
} from './core/rest-provider.ts';
export { safeUrl } from './core/safe-url.ts';
export { renderTemplate, TemplateError } from './core/template.ts';
export {
  evaluateWhere,
  fromConditions,
  resolveVars,
  toConditions,
  WhereError,
} from './core/where.ts';
export type {
  Condition as WhereCondition,
  Operator,
  Predicate,
  PredicateOps,
  VarRef,
  Where,
  WhereScope,
} from './core/where.ts';

// ── react ────────────────────────────────────────────────────────────────────
export { isAllowed, useCan } from './react/access.ts';
export { createInstaQueryClient, InstaProvider, useInsta, useResource } from './react/context.tsx';
export type {
  AccessAction,
  AccessCheck,
  InstaConfig,
  InstaProviderProps,
  InstaRegistry,
} from './react/context.tsx';
export {
  andWhere,
  fetchRecordsByIds,
  useRecordsByIds,
  useRelationOptions,
  useResourceList,
  useResourceMutations,
  useResourceRecord,
} from './react/data.ts';
export type { RelationOptionsQuery } from './react/data.ts';
export { defaultMessages } from './react/messages.ts';
export type { Messages } from './react/messages.ts';
export { createRouterAdapter, historyAdapter, memoryAdapter } from './react/router.ts';
export type {
  LinkProps,
  NavigateOptions,
  RouterAdapter,
  RouterApi,
  RouterHooks,
  RouterLocation,
} from './react/router.ts';
export { buildPath, matchView, useResourceRouting } from './react/routes.ts';
export type { ResourcePaths, ResourceRouting, ResourceView } from './react/routes.ts';
export { useResourceSubmit } from './react/submit.ts';
export type { SubmitResult } from './react/submit.ts';

// ── antd ─────────────────────────────────────────────────────────────────────
export { builtinDisplays, builtinWidgets, FieldDisplay, FilterControl } from './antd/fields.tsx';
export type { DisplayProps, FilterControlProps, WidgetProps } from './antd/fields.tsx';
export { InstaAdmin } from './antd/InstaAdmin.tsx';
export type { InstaAdminProps } from './antd/InstaAdmin.tsx';
export { RelationSelect } from './antd/RelationSelect.tsx';
export type { RelationSelectProps } from './antd/RelationSelect.tsx';
export { ResourceCrud } from './antd/ResourceCrud.tsx';
export type { ResourceCrudProps, ViewProps } from './antd/ResourceCrud.tsx';
export { ResourceTable } from './antd/ResourceTable.tsx';
export type { ResourceTableProps } from './antd/ResourceTable.tsx';
