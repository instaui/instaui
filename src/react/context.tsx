import { QueryClient, QueryClientContext, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setupDayjs, type CodecEnv, type FieldCodec, type Timezone } from '../core/codecs.ts';
import type { AnyRecord, DataProvider, InstaContext } from '../core/data-provider.ts';
import { isHttpError } from '../core/http-error.ts';
import type { UrlCodec } from '../core/list-state.ts';
import { defaultUrlCodec } from '../core/list-state.ts';
import {
  normalizeResource,
  type NormalizedResource,
  type ResourceDefinition,
} from '../core/resource.ts';
import { defaultMessages, type Messages } from './messages.ts';
import { memoryAdapter, type RouterAdapter } from './router.ts';
import { validateConfig } from '../core/validate-config.ts';
import { warn } from '../core/warn.ts';

export type AccessAction = 'list' | 'detail' | 'create' | 'edit' | 'delete' | (string & {});

export interface AccessCheck {
  resource: string;
  action: AccessAction;
  record?: AnyRecord;
}

export interface InstaRegistry {
  /** Extra or overriding codecs, by field type. */
  codecs?: Record<string, FieldCodec>;
  /** Renderer-specific registries (widgets, displays, components) live here too. */
  [key: string]: unknown;
}

export interface InstaProviderProps {
  dataProvider: DataProvider;
  /** Definitions of any record type (the record type only appears in callback parameters). */
  resources: ResourceDefinition<never>[];
  router?: RouterAdapter;
  ctx?: InstaContext;
  timezone?: Timezone;
  messages?: Partial<Messages>;
  registry?: InstaRegistry;
  /** App-level permission check, AND-ed with each resource's `access` rules. Must be synchronous. */
  can?: (check: AccessCheck) => boolean;
  urlCodec?: UrlCodec;
  defaults?: { pageSize?: number };
  /** Config validation: `'report'` (default) warns, `'strict'` throws on errors, `false` skips. */
  validate?: 'report' | 'strict' | false;
  /** Used only when no `QueryClientProvider` is above. */
  queryClient?: QueryClient;
  children?: ReactNode;
}

export interface InstaConfig {
  dataProvider: DataProvider;
  resources: ReadonlyMap<string, NormalizedResource>;
  router: RouterAdapter;
  /** False when the provider fell back to its default (memory) router. */
  routerProvided: boolean;
  ctx: InstaContext;
  messages: Messages;
  registry: InstaRegistry;
  can?: (check: AccessCheck) => boolean;
  urlCodec: UrlCodec;
  env: CodecEnv;
}

const InstaContextValue = createContext<InstaConfig | null>(null);

/** Admin UIs: no retries on client errors, no surprise refetch on window focus. */
export function createInstaQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failures, error) => failures < 1 && !(isHttpError(error) && error.status < 500),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  });
}

export function InstaProvider({
  dataProvider,
  resources,
  router,
  ctx,
  timezone = 'local',
  messages,
  registry,
  can,
  urlCodec = defaultUrlCodec,
  defaults,
  validate = 'report',
  queryClient,
  children,
}: InstaProviderProps) {
  setupDayjs();
  const hostClient = useContext(QueryClientContext);
  const [ownClient] = useState(() => queryClient ?? createInstaQueryClient());
  const [ownRouter] = useState(() => router ?? memoryAdapter());

  const issues = useMemo(() => {
    if (validate === false) return [];
    const keys = (v: unknown) => (v && typeof v === 'object' ? Object.keys(v) : []);
    return validateConfig(resources, {
      mode: validate,
      fieldTypes: keys(registry?.codecs),
      widgets: keys(registry?.widgets),
      displays: keys(registry?.displays),
      components: keys(registry?.components),
    });
  }, [resources, registry, validate]);
  useEffect(() => {
    for (const i of issues) {
      warn(
        `${i.level === 'error' ? 'Config error' : 'Config warning'} in ${i.resource}.${i.path}: ${i.message}`,
      );
    }
  }, [issues]);

  const normalized = useMemo(() => {
    const map = new Map<string, NormalizedResource>();
    for (const definition of resources) {
      if (map.has(definition.name)) throw new Error(`Duplicate resource name "${definition.name}"`);
      map.set(
        definition.name,
        normalizeResource(definition, defaults) as unknown as NormalizedResource,
      );
    }
    return map;
  }, [resources, defaults]);

  const mergedMessages = useMemo(() => ({ ...defaultMessages, ...messages }), [messages]);
  const value = useMemo<InstaConfig>(
    () => ({
      dataProvider,
      resources: normalized,
      router: router ?? ownRouter,
      routerProvided: router !== undefined,
      ctx: ctx ?? {},
      messages: mergedMessages,
      registry: registry ?? {},
      can,
      urlCodec,
      env: {
        timezone,
        messages: { yes: mergedMessages.yes, no: mergedMessages.no },
        idFieldOf: (name) => {
          const idField = normalized.get(name)?.idField;
          return typeof idField === 'string' ? idField : 'id';
        },
      },
    }),
    [
      dataProvider,
      normalized,
      router,
      ownRouter,
      ctx,
      mergedMessages,
      registry,
      can,
      urlCodec,
      timezone,
    ],
  );

  const tree = <InstaContextValue.Provider value={value}>{children}</InstaContextValue.Provider>;
  return hostClient ? tree : <QueryClientProvider client={ownClient}>{tree}</QueryClientProvider>;
}

/** Re-provides a modified config to a subtree (e.g. a different router). */
export function InstaConfigOverride({
  value,
  children,
}: {
  value: InstaConfig;
  children?: ReactNode;
}) {
  return <InstaContextValue.Provider value={value}>{children}</InstaContextValue.Provider>;
}

export function useInsta(): InstaConfig {
  const config = useContext(InstaContextValue);
  if (!config) throw new Error('instaui components must be rendered inside <InstaProvider>');
  return config;
}

export function useResource(name: string): NormalizedResource {
  const { resources } = useInsta();
  const resource = resources.get(name);
  if (!resource) {
    throw new Error(
      `Unknown resource "${name}". Registered: ${[...resources.keys()].join(', ') || '(none)'}`,
    );
  }
  return resource;
}
