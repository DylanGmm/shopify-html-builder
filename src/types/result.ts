/**
 * Lightweight Result type (neverthrow-style discriminated union).
 * 轻量 Result 类型，用于可预期的失败路径。
 */

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
