/** Adapts an app's own axios-style HTTP client to the REST provider. */
import { HttpError } from './http-error.ts';
import {
  createRestProvider,
  defaultMapError,
  type RestProviderOptions,
  type RestRequest,
} from './rest-provider.ts';
import type { DataProvider } from './data-provider.ts';
import { isRecord } from './value.ts';

/** The client shape apps already have: axios-like methods returning the parsed body. */
export interface ApiClientLike {
  get(
    url: string,
    config?: { params?: unknown; signal?: AbortSignal; responseType?: RestRequest['responseType'] },
  ): Promise<unknown>;
  post(
    url: string,
    data?: unknown,
    config?: { signal?: AbortSignal; responseType?: RestRequest['responseType'] },
  ): Promise<unknown>;
  patch(url: string, data?: unknown, config?: { signal?: AbortSignal }): Promise<unknown>;
  put?(url: string, data?: unknown, config?: { signal?: AbortSignal }): Promise<unknown>;
  delete(url: string, config?: { signal?: AbortSignal }): Promise<unknown>;
}

function toHttpError(error: unknown): unknown {
  if (error instanceof HttpError || !isRecord(error)) return error;
  const response = error.response;
  if (isRecord(response) && typeof response.status === 'number') {
    return defaultMapError(response.status, response.data, String(response.statusText ?? ''));
  }
  return error; // e.g. an app interceptor's Error(message): its message is shown as-is
}

/** Adapts an existing axios-style client. All other options work as in `createRestProvider`. */
export function fromApiClient(
  client: ApiClientLike,
  options: Omit<RestProviderOptions, 'request'> = {},
): DataProvider {
  const request = async (req: RestRequest): Promise<unknown> => {
    const config = { signal: req.signal, responseType: req.responseType };
    try {
      switch (req.method) {
        case 'GET':
          return await client.get(req.url, { ...config, params: req.query });
        case 'POST':
          return await client.post(req.url, req.body, config);
        case 'PATCH':
          return await client.patch(req.url, req.body, config);
        case 'PUT':
          if (!client.put) throw new Error('The api client has no put() method');
          return await client.put(req.url, req.body, config);
        case 'DELETE':
          return await client.delete(req.url, config);
      }
    } catch (error) {
      throw toHttpError(error);
    }
  };
  return createRestProvider({ ...options, request });
}
