/**
 * Config validation, mainly for server-sent (JSON) definitions: reports problems as data instead of
 * failing at render time. `report` mode (the default) never throws; `strict` throws on errors.
 */
import { builtinCodecs } from './codecs.ts';
import type { BuiltinAction, ResourceDefinition } from './resource.ts';
import { templatePlaceholders } from './template.ts';
import { OPERATORS } from './where.ts';

export interface ConfigIssue {
  level: 'error' | 'warning';
  resource: string;
  /** Dot path inside the resource definition, e.g. `fields.status.props.options`. */
  path: string;
  message: string;
}

export interface ValidateOptions {
  /** Field types registered beyond the built-ins (codecs or widgets). */
  fieldTypes?: string[];
  /** Registered component keys (`components.page: 'Dashboard'`). */
  components?: string[];
  widgets?: string[];
  displays?: string[];
  mode?: 'report' | 'strict';
}

const RESOURCE_KEYS = new Set([
  'name',
  'label',
  'idField',
  'recordLabel',
  'api',
  'kind',
  'menu',
  'fields',
  'list',
  'form',
  'detail',
  'actions',
  'access',
  'components',
]);
const FIELD_KEYS = new Set([
  'key',
  'type',
  'props',
  'label',
  'help',
  'placeholder',
  'required',
  'default',
  'validate',
  'list',
  'detail',
  'filter',
  'create',
  'edit',
  'visibleIf',
  'requiredIf',
  'readOnlyIf',
  'resetOn',
  'widget',
  'display',
  'span',
  'submit',
]);
const BUILTIN_ACTIONS = new Set<BuiltinAction>(['create', 'detail', 'edit', 'delete']);
const BUILTIN_WIDGETS = [
  'input',
  'textarea',
  'password',
  'email',
  'url',
  'number',
  'switch',
  'date',
  'datetime',
  'time',
  'select',
  'radio',
  'tags',
  'relation',
  'json',
];
const BUILTIN_DISPLAYS = ['text', 'link', 'image', 'tag', 'json', 'copyable', 'relation'];
const FIELD_MODES = new Set(['editable', 'readonly', 'hidden']);
const operators = new Set<string>(OPERATORS);

export class ConfigError extends Error {
  readonly issues: ConfigIssue[];
  constructor(issues: ConfigIssue[]) {
    super(
      `Invalid instaui config:\n${issues.map((i) => `  ${i.resource}.${i.path}: ${i.message}`).join('\n')}`,
    );
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

const isExtension = (key: string) => key.startsWith('x-');

export function validateConfig(
  resources: readonly ResourceDefinition<never>[],
  {
    fieldTypes = [],
    components = [],
    widgets = [],
    displays = [],
    mode = 'report',
  }: ValidateOptions = {},
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const names = new Set<string>();
  const knownTypes = new Set([...Object.keys(builtinCodecs), ...fieldTypes]);
  const knownWidgets = new Set([...BUILTIN_WIDGETS, ...widgets]);
  const knownDisplays = new Set([...BUILTIN_DISPLAYS, ...displays]);
  const knownComponents = new Set(components);
  const allNames = new Set(resources.map((r) => r.name));

  for (const resource of resources) {
    const name = typeof resource.name === 'string' && resource.name ? resource.name : '(unnamed)';
    const add = (level: ConfigIssue['level'], path: string, message: string) =>
      issues.push({ level, resource: name, path, message });

    if (name === '(unnamed)') add('error', 'name', 'Every resource needs a non-empty name');
    else if (names.has(name)) add('error', 'name', `Duplicate resource name "${name}"`);
    names.add(name);

    for (const key of Object.keys(resource)) {
      if (!RESOURCE_KEYS.has(key) && !isExtension(key))
        add('warning', key, `Unknown key "${key}" (vendor extensions must start with "x-")`);
    }
    if (!Array.isArray(resource.fields)) {
      add('error', 'fields', 'fields must be an array');
      continue;
    }

    const fieldKeys = new Set<string>();
    for (const field of resource.fields) {
      const at = `fields.${field.key ?? '?'}`;
      if (typeof field.key !== 'string' || !field.key) {
        add('error', 'fields', 'Every field needs a key');
        continue;
      }
      if (fieldKeys.has(field.key)) add('error', at, `Duplicate field key "${field.key}"`);
      fieldKeys.add(field.key);
      for (const key of Object.keys(field)) {
        if (!FIELD_KEYS.has(key) && !isExtension(key))
          add('warning', `${at}.${key}`, `Unknown field key "${key}"`);
      }
      if (!knownTypes.has(field.type))
        add('error', `${at}.type`, `Unknown field type "${String(field.type)}"`);
      if (field.type === 'enum' && !(field.props?.options && field.props.options.length > 0)) {
        add('warning', `${at}.props.options`, 'enum fields need options');
      }
      if (field.type === 'relation') {
        const target = field.props?.resource;
        if (!target) add('error', `${at}.props.resource`, 'relation fields need props.resource');
        else if (!allNames.has(target))
          add('error', `${at}.props.resource`, `Relation to unknown resource "${target}"`);
      }
      for (const m of ['create', 'edit'] as const) {
        if (field[m] !== undefined && !FIELD_MODES.has(field[m]))
          add('error', `${at}.${m}`, `Must be editable, readonly or hidden`);
      }
      if (field.required && field.create === 'hidden' && field.edit === 'hidden') {
        add('warning', `${at}.required`, 'Required but hidden in both create and edit');
      }
      const filter = field.filter;
      if (typeof filter === 'object' && filter.operators) {
        for (const op of filter.operators)
          if (!operators.has(op))
            add('error', `${at}.filter.operators`, `Unknown operator "${op}"`);
      }
      if (typeof field.widget === 'string' && !knownWidgets.has(field.widget))
        add('error', `${at}.widget`, `Unknown widget "${field.widget}"`);
      if (typeof field.display === 'string' && !knownDisplays.has(field.display))
        add('error', `${at}.display`, `Unknown display "${field.display}"`);
    }

    if (typeof resource.recordLabel === 'string') {
      for (const p of templatePlaceholders(resource.recordLabel)) {
        const root = p.split('.')[0]!;
        if (![...fieldKeys].some((k) => k === p || k.split('.')[0] === root)) {
          add('warning', 'recordLabel', `Placeholder {${p}} is not a field`);
        }
      }
    }
    for (const [i, action] of (resource.actions ?? []).entries()) {
      if (typeof action === 'string' && !BUILTIN_ACTIONS.has(action))
        add('error', `actions.${i}`, `Unknown built-in action "${action}"`);
      if (
        typeof action === 'object' &&
        'builtin' in action &&
        !BUILTIN_ACTIONS.has(action.builtin)
      ) {
        add('error', `actions.${i}`, `Unknown built-in action "${String(action.builtin)}"`);
      }
      if (
        typeof action === 'object' &&
        'id' in action &&
        (!Array.isArray(action.placement) || action.placement.length === 0)
      ) {
        add(
          'warning',
          `actions.${action.id}`,
          'Custom action has no placement, so it is never shown',
        );
      }
    }
    for (const [slot, component] of Object.entries(resource.components ?? {})) {
      if (typeof component === 'string' && !knownComponents.has(component)) {
        add('error', `components.${slot}`, `Unknown component "${component}"`);
      }
    }
    if (resource.kind === 'page' && !resource.components?.page)
      add('error', 'components.page', 'Page resources need components.page');
  }

  if (mode === 'strict' && issues.some((i) => i.level === 'error')) throw new ConfigError(issues);
  return issues;
}
