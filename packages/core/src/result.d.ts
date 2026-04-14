export type Result<T, E = Error> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};
export declare function ok<T>(value: T): Result<T, never>;
export declare function err<E>(error: E): Result<never, E>;
export declare function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
export declare function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>;
export declare function unwrap<T, E>(result: Result<T, E>): T;
export declare function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T;
export declare function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>>;
//# sourceMappingURL=result.d.ts.map