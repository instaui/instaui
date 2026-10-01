export type FieldErrors = Record<string, string | string[]>;

export interface HttpErrorInit {
  status: number;
  message: string;
  /** Per-field messages, mapped onto form fields. `_form` is shown as a form-level message. */
  fieldErrors?: FieldErrors;
  body?: unknown;
}

/** Errors thrown by data providers. Non-`HttpError` errors are shown by their `message`. */
export class HttpError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;
  readonly body?: unknown;

  constructor({ status, message, fieldErrors, body }: HttpErrorInit) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.body = body;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/** Best-effort user-facing message for any thrown value. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
