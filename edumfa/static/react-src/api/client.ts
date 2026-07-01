import { ApiError, unwrapEduMfaEnvelope } from "./envelope";

const authErrorCodes = new Set([403, 4031, 4032, 4033, 4034, 4035, 4036]);

export interface ApiClient {
  delete: <TValue>(path: string, options?: ApiRequestOptions) => Promise<TValue>;
  get: <TValue>(path: string, options?: ApiRequestOptions) => Promise<TValue>;
  post: <TValue>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ) => Promise<TValue>;
  put: <TValue>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ) => Promise<TValue>;
}

export interface ApiClientOptions {
  baseUrl?: string;
  getAuthToken?: () => string | null | undefined;
  onAuthError?: (error: ApiError) => void;
}

export interface ApiRequestOptions {
  formData?: FormData | undefined;
  headers?: Record<string, string> | undefined;
  params?: Record<string, QueryValue> | undefined;
  signal?: AbortSignal | undefined;
}

type QueryValue = boolean | number | string | null | undefined;

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const request = async <TValue>(
    method: string,
    path: string,
    body?: unknown,
    requestOptions: ApiRequestOptions = {}
  ): Promise<TValue> => {
    try {
      const requestBody = createRequestBody(body, requestOptions);
      const requestInit: RequestInit = {
        credentials: "same-origin",
        headers: createHeaders(options.getAuthToken, body, requestOptions),
        method
      };

      if (requestBody !== undefined) {
        requestInit.body = requestBody;
      }

      if (requestOptions.signal) {
        requestInit.signal = requestOptions.signal;
      }

      const response = await fetch(
        buildUrl(path, options.baseUrl, requestOptions),
        requestInit
      );
      const payload = await readJsonPayload(response);

      if (!response.ok) {
        throw createHttpError(response, payload);
      }

      return unwrapEduMfaEnvelope(payload) as TValue;
    } catch (error) {
      if (error instanceof ApiError) {
        if (isAuthError(error)) {
          options.onAuthError?.(error);
        }

        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      throw new ApiError("The request failed before the server responded.");
    }
  };

  return {
    delete: (path, requestOptions) =>
      request("DELETE", path, undefined, requestOptions),
    get: (path, requestOptions) => request("GET", path, undefined, requestOptions),
    post: (path, body, requestOptions) => request("POST", path, body, requestOptions),
    put: (path, body, requestOptions) => request("PUT", path, body, requestOptions)
  };
}

function buildUrl(
  path: string,
  baseUrl: string | undefined,
  requestOptions: ApiRequestOptions
): string {
  const origin =
    typeof window === "undefined" ? "http://127.0.0.1" : window.location.origin;
  const url = new URL(path, baseUrl ? new URL(baseUrl, origin) : origin);

  Object.entries(requestOptions.params ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function createHeaders(
  getAuthToken: ApiClientOptions["getAuthToken"],
  body: unknown,
  requestOptions: ApiRequestOptions
): Headers {
  const headers = new Headers(requestOptions.headers);
  const authToken = getAuthToken?.();

  if (authToken) {
    headers.set("Authorization", authToken);
  }

  if (body !== undefined && !requestOptions.formData) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function createRequestBody(
  body: unknown,
  requestOptions: ApiRequestOptions
): BodyInit | undefined {
  if (requestOptions.formData) {
    return requestOptions.formData;
  }

  if (body === undefined) {
    return undefined;
  }

  return JSON.stringify(body);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("The server returned invalid JSON.", {
      status: response.status
    });
  }
}

function createHttpError(response: Response, payload: unknown): ApiError {
  try {
    unwrapEduMfaEnvelope(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiError(error.message, {
        code: error.code,
        details: error.details,
        status: response.status
      });
    }
  }

  return new ApiError(response.statusText || "The request failed.", {
    status: response.status
  });
}

function isAuthError(error: ApiError): boolean {
  return [401, 403].includes(error.status) || authErrorCodes.has(error.code ?? 0);
}
