// instaui: config-first CRUD for antd. The single entry point.

// ── core ─────────────────────────────────────────────────────────────────────
export { builtinCodecs, CodecError } from './core/codecs.ts';
export type { CodecContext, CodecEnv, FieldCodec, Timezone } from './core/codecs.ts';
export { withListFallbacks } from './core/lookup.ts';
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
export { HttpError, isHttpError } from './core/http-error.ts';
export type { FieldErrors, HttpErrorInit } from './core/http-error.ts';
export { defaultUrlCodec, paramUrlCodec, passthroughUrlCodec } from './core/list-state.ts';
export type { ListDefaults, ListState, ParamUrlCodecOptions, UrlCodec } from './core/list-state.ts';
export { mergeResource } from './core/merge-resource.ts';
export type { FieldPatch, ResourcePatch } from './core/merge-resource.ts';
export { ConfigError, validateConfig } from './core/validate-config.ts';
export type { ConfigIssue, ValidateOptions } from './core/validate-config.ts';
export { createMemoryProvider } from './core/memory-provider.ts';
export type { MemoryProviderOptions } from './core/memory-provider.ts';
export { resourceKeys } from './core/query-keys.ts';
export { defineResource } from './core/resource.ts';
export type {
  AccessRule,
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
  ListTab,
  NormalizedField,
  NormalizedResource,
  ResourceDefinition,
  SubmitConfirm,
  SubmitInfo,
  Validator,
} from './core/resource.ts';
export type {
  ActionConfirm,
  ActionContext,
  ActionDefinition,
  ActionForm,
  ActionPlacement,
  BuiltinAction,
  BuiltinActionConfig,
  OpenResourceOptions,
  ResourceAction,
} from './core/actions.ts';
export {
  createRestProvider,
  defaultDecodeList,
  defaultDecodeOne,
  defaultEncodeBody,
  defaultEncodeList,
  defaultMapError,
  defaultUrlFor,
} from './core/rest-provider.ts';
export { fromApiClient } from './core/api-client.ts';
export type { ApiClientLike } from './core/api-client.ts';
export type { RestOperation, RestProviderOptions, RestRequest } from './core/rest-provider.ts';
export { evaluateWhere, toConditions, WhereError } from './core/where.ts';
export type {
  WhereCondition,
  Operator,
  Predicate,
  PredicateOps,
  VarRef,
  Where,
  WhereScope,
} from './core/where.ts';

// ── react ────────────────────────────────────────────────────────────────────
export { useCan } from './react/access.ts';
export { InstaProvider, useApiClient, useInsta, useResource } from './react/context.tsx';
export type { AccessAction, AccessCheck } from './core/access.ts';
export type { InstaConfig, InstaProviderProps, InstaRegistry } from './react/context.tsx';
export {
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
export type { ResourcePaths } from './react/routes.ts';
export { useResourceSubmit } from './react/submit.ts';
export type { SubmitResult } from './react/submit.ts';

// ── antd ─────────────────────────────────────────────────────────────────────
export { builtinDisplays, FieldDisplay } from './antd/fields/displays.tsx';
export type { DisplayProps } from './antd/fields/displays.tsx';
export { builtinWidgets } from './antd/fields/widgets.tsx';
export type { WidgetProps } from './antd/fields/widgets.tsx';
export { InstaAdmin } from './antd/InstaAdmin.tsx';
export { InstaApp } from './antd/InstaApp.tsx';
export type { InstaAppProps } from './antd/InstaApp.tsx';
export type { InstaAdminProps } from './antd/InstaAdmin.tsx';
export { RelationSelect } from './antd/RelationSelect.tsx';
export type { RelationSelectProps } from './antd/RelationSelect.tsx';
export { ResourceCrud } from './antd/ResourceCrud.tsx';
export type { ResourceCrudProps, ViewProps } from './antd/ResourceCrud.tsx';
export { ResourceTable } from './antd/ResourceTable.tsx';
export type { ResourceTableProps } from './antd/ResourceTable.tsx';
export { useResourceTable } from './antd/useResourceTable.tsx';
export type { UseResourceTableOptions } from './antd/useResourceTable.tsx';
export {
  UnstableResourceDetail as unstable_ResourceDetail,
  UnstableResourceForm as unstable_ResourceForm,
} from './antd/unstable.tsx';
export type { UnstableResourceDetailProps, UnstableResourceFormProps } from './antd/unstable.tsx';
