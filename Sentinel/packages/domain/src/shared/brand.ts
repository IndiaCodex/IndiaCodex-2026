/**
 * Nominal-typing helper. Two branded types with the same underlying
 * primitive (e.g. two different UUID-shaped strings) are not
 * interchangeable at compile time unless explicitly cast, which is what
 * lets `ExecutionId` and `WorkflowId` both be strings without being
 * assignable to each other by accident.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };
