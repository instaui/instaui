/**
 * `<InstaApp apiClient={…} resources={…} />`: a whole admin app from an HTTP client and resource
 * definitions. Builds the data provider, routes with the browser URL and renders `<InstaAdmin>`.
 * Custom screens are resources too (`kind: 'page'` or `components.*`); they reach the same client
 * with `useApiClient()`.
 */
import { useMemo, useState } from 'react';
import type { DataProvider } from '../core/data-provider.ts';
import { fromApiClient, type ApiClientLike } from '../core/api-client.ts';
import { createRestProvider, type RestProviderOptions } from '../core/rest-provider.ts';
import { InstaProvider, type InstaProviderProps } from '../react/context.tsx';
import { InstaAdmin, type InstaAdminProps } from './InstaAdmin.tsx';

export interface InstaAppProps
  extends Omit<InstaProviderProps, 'dataProvider' | 'apiClient' | 'children'>, InstaAdminProps {
  /** An axios-style client (`get`, `post`, `patch`, `delete` resolving to the body). */
  apiClient?: ApiClientLike;
  /** The REST conventions, when they differ from the defaults: `encodeList`, `decodeList`, `mapError`, … Read once, at mount. */
  rest?: Omit<RestProviderOptions, 'request'>;
  /** A complete data provider instead of `apiClient` + `rest`. */
  dataProvider?: DataProvider;
}

export function InstaApp({
  apiClient,
  rest,
  dataProvider,
  basePath,
  title,
  paths,
  slots,
  ...provider
}: InstaAppProps) {
  const [options] = useState(rest);
  const resolved = useMemo(
    () =>
      dataProvider ?? (apiClient ? fromApiClient(apiClient, options) : createRestProvider(options)),
    [dataProvider, apiClient, options],
  );
  return (
    <InstaProvider {...provider} dataProvider={resolved} apiClient={apiClient}>
      <InstaAdmin basePath={basePath} title={title} paths={paths} slots={slots} />
    </InstaProvider>
  );
}
