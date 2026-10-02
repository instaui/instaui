/**
 * `{…}` templates, the only template syntax: `'{id}/approve'`, `'orgs/{ctx.orgId}/projects'`,
 * `'{name} ({code})'`. A placeholder is a dot path looked up by the caller.
 */

const PLACEHOLDER = /\{([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\}/g;

export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

export interface TemplateOptions {
  /** Percent-encode each substituted value (use for URL paths). */
  encode?: boolean;
  /** `'throw'` (URLs: never call a wrong endpoint) or `'empty'` (labels). Default `'throw'`. */
  onMissing?: 'throw' | 'empty';
}

export function renderTemplate(
  template: string,
  lookup: (path: string) => unknown,
  { encode = false, onMissing = 'throw' }: TemplateOptions = {},
): string {
  return template.replace(PLACEHOLDER, (_match, path: string) => {
    const value = lookup(path);
    if (value === undefined || value === null || value === '') {
      if (onMissing === 'throw')
        throw new TemplateError(`Template "${template}" has no value for {${path}}`);
      return '';
    }
    const text = String(value);
    return encode ? encodeURIComponent(text) : text;
  });
}

export function templatePlaceholders(template: string): string[] {
  return Array.from(template.matchAll(PLACEHOLDER), (m) => m[1] as string);
}
