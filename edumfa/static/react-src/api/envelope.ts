export interface EduMfaErrorPayload {
  code: number;
  message: string;
}

export interface EduMfaSuccessEnvelope<TValue> {
  detail?: Record<string, unknown>;
  id: number;
  jsonrpc: string;
  result: {
    status: true;
    value: TValue;
  };
  time?: number;
  version?: string;
  versionnumber?: string;
}

export interface EduMfaErrorEnvelope {
  detail?: Record<string, unknown>;
  id: number;
  jsonrpc: string;
  result: {
    error: EduMfaErrorPayload;
    status: false;
  };
  time?: number;
  version?: string;
}

export type EduMfaEnvelope<TValue> =
  | EduMfaSuccessEnvelope<TValue>
  | EduMfaErrorEnvelope;

export class ApiError extends Error {
  readonly code: number | null;
  readonly details: Record<string, unknown> | null;
  readonly status: number;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.code = options.code ?? null;
    this.details = options.details ?? null;
    this.status = options.status ?? 0;
  }
}

interface ApiErrorOptions {
  code?: number | null;
  details?: Record<string, unknown> | null;
  status?: number;
}

export function unwrapEduMfaEnvelope(payload: unknown): unknown {
  if (!isRecord(payload) || !isRecord(payload.result)) {
    throw new ApiError("The server returned an invalid eduMFA response.");
  }

  if (payload.result.status === true && "value" in payload.result) {
    return payload.result.value;
  }

  if (
    payload.result.status === false &&
    isRecord(payload.result.error) &&
    typeof payload.result.error.message === "string"
  ) {
    const errorCode =
      typeof payload.result.error.code === "number" ? payload.result.error.code : null;

    throw new ApiError(payload.result.error.message, {
      code: errorCode,
      details: isRecord(payload.detail) ? payload.detail : null
    });
  }

  throw new ApiError("The server returned an unsupported eduMFA response.");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
