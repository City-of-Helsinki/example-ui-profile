export type AnyObject = Record<string, unknown>;
export type AnyNonNullishValue = NonNullable<unknown>;
export type AnyValue = AnyNonNullishValue | undefined | null;
export type AnyFunction = (props?: unknown) => unknown;
