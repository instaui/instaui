/**
 * Returns `url` when it is safe to render as a link or image source, otherwise `undefined`.
 * Allowed: relative URLs and the http, https, blob, mailto and tel schemes. Everything else
 * (notably `javascript:` and `data:`) is rejected, because stored values may be attacker-controlled.
 */
const ALLOWED = new Set(['http:', 'https:', 'blob:', 'mailto:', 'tel:']);

export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (trimmed === '') return undefined;
  // Browsers ignore ASCII control characters and spaces inside the scheme ("java\tscript:").
  let normalised = '';
  for (const char of trimmed) {
    const code = char.charCodeAt(0);
    if (code > 0x20 && code !== 0x7f) normalised += char;
  }
  const scheme = /^([a-zA-Z][a-zA-Z\d+.-]*):/.exec(normalised)?.[1];
  if (scheme === undefined) return trimmed;
  return ALLOWED.has(`${scheme.toLowerCase()}:`) ? trimmed : undefined;
}
