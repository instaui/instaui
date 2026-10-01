/** Dot-path helpers (`'manager.email'`). Paths never contain brackets; array indexes are numeric segments. */

export function getPath(source: unknown, path: string): unknown {
  if (path === '') return source;
  let current: unknown = source;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Returns a shallow-copied object with `value` written at `path` (intermediate objects are copied or created). */
export function setPath<T extends Record<string, unknown>>(
  target: T,
  path: string,
  value: unknown,
): T {
  const [head, ...rest] = path.split('.');
  if (head === undefined) return target;
  if (rest.length === 0) return { ...target, [head]: value };
  const child = target[head];
  const base =
    child !== null && typeof child === 'object' ? (child as Record<string, unknown>) : {};
  return { ...target, [head]: setPath(base, rest.join('.'), value) };
}
