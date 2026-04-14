export function ok(value) {
    return { ok: true, value };
}
export function err(error) {
    return { ok: false, error };
}
export function map(result, fn) {
    if (result.ok) {
        return ok(fn(result.value));
    }
    return result;
}
export function flatMap(result, fn) {
    if (result.ok) {
        return fn(result.value);
    }
    return result;
}
export function unwrap(result) {
    if (result.ok) {
        return result.value;
    }
    throw result.error instanceof Error ? result.error : new Error(String(result.error));
}
export function unwrapOr(result, fallback) {
    if (result.ok) {
        return result.value;
    }
    return fallback;
}
export async function tryCatch(fn) {
    try {
        const value = await fn();
        return ok(value);
    }
    catch (e) {
        return err(e instanceof Error ? e : new Error(String(e)));
    }
}
//# sourceMappingURL=result.js.map