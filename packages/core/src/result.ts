export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return ok(fn(result.value));
  }
  return result;
}

export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error instanceof Error ? result.error : new Error(String(result.error));
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  if (result.ok) {
    return result.value;
  }
  return fallback;
}

export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
