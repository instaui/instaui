import { describe, expect, test } from 'vitest';
import { paramUrlCodec, passthroughUrlCodec } from './list-state.ts';
import { mergeResource } from './merge-resource.ts';
import { defineResource, normalizeResource, type ResourceDefinition } from './resource.ts';
import { defaultEncodeList } from './rest-provider.ts';
import { ConfigError, validateConfig } from './validate-config.ts';

const teams = defineResource({ name: 'teams', fields: [{ key: 'name', type: 'text' }] });

describe('validateConfig', () => {
  test('a valid config has no issues', () => {
    const projects = defineResource({
      name: 'projects',
      recordLabel: '{name}',
      fields: [
        { key: 'name', type: 'text', required: true },
        { key: 'teamId', type: 'relation', props: { resource: 'teams' } },
        {
          key: 'status',
          type: 'enum',
          props: { options: [{ value: 'A', label: 'A' }] },
          display: 'tag',
        },
      ],
      'x-audit': true,
    });
    expect(validateConfig([projects, teams] as ResourceDefinition<never>[])).toEqual([]);
  });

  test('reports the mistakes a server-sent config typically has', () => {
    const json = {
      name: 'projects',
      recordLable: '{name}',
      recordLabel: '{title}',
      fields: [
        { key: 'name', type: 'txt' },
        { key: 'name', type: 'text' },
        { key: 'owner', type: 'relation', props: { resource: 'people' } },
        { key: 'status', type: 'enum', filter: { operators: ['$regex'] } },
        { key: 'code', type: 'text', edit: 'locked', widget: 'fancy' },
      ],
      actions: [
        'create',
        'archive',
        { id: 'approve', label: 'Approve', placement: [], run: () => {} },
      ],
      components: { page: 'Missing' },
    } as unknown as ResourceDefinition<never>;
    const messages = validateConfig([json]).map((i) => `${i.level} ${i.path}: ${i.message}`);
    expect(messages).toEqual([
      'warning recordLable: Unknown key "recordLable" (vendor extensions must start with "x-")',
      'error fields.name.type: Unknown field type "txt"',
      'error fields.name: Duplicate field key "name"',
      'error fields.owner.props.resource: Relation to unknown resource "people"',
      'warning fields.status.props.options: enum fields need options',
      'error fields.status.filter.operators: Unknown operator "$regex"',
      'error fields.code.edit: Must be editable, readonly or hidden',
      'error fields.code.widget: Unknown widget "fancy"',
      'warning recordLabel: Placeholder {title} is not a field',
      'error actions.1: Unknown built-in action "archive"',
      'warning actions.approve: Custom action has no placement, so it is never shown',
      'error components.page: Unknown component "Missing"',
    ]);
  });

  test('registered types and components are accepted; strict mode throws', () => {
    const r = {
      name: 'r',
      fields: [{ key: 'hours', type: 'schedule' }],
      components: { page: 'Board' },
    } as ResourceDefinition<never>;
    expect(validateConfig([r], { fieldTypes: ['schedule'], components: ['Board'] })).toEqual([]);
    expect(() => validateConfig([r], { mode: 'strict' })).toThrow(ConfigError);
  });
});

describe('mergeResource', () => {
  test('server JSON plus local code: fields merge by key, objects deep-merge', () => {
    const server = defineResource({
      name: 'users',
      label: 'Users',
      list: { pageSize: 50, search: true },
      fields: [
        { key: 'email', type: 'text', required: true },
        { key: 'role', type: 'enum', props: { options: [{ value: 'admin', label: 'Admin' }] } },
      ],
    });
    const validate = (v: unknown) => (String(v).includes('@') ? undefined : 'Invalid email');
    const merged = mergeResource(server, {
      list: { pageSize: 20 },
      fields: [
        { key: 'email', validate },
        { key: 'notes', type: 'text' },
      ],
    });
    expect(merged.list).toEqual({ pageSize: 20, search: true });
    expect(merged.fields[0]).toEqual({ key: 'email', type: 'text', required: true, validate });
    expect(merged.fields.map((f) => f.key)).toEqual(['email', 'role', 'notes']);
    expect(server.fields).toHaveLength(2);
  });
});

describe('per-field query params', () => {
  const resource = normalizeResource(
    defineResource({
      name: 'projects',
      fields: [
        {
          key: 'teamId',
          type: 'relation',
          props: { resource: 'teams' },
          filter: { param: 'team' },
        },
      ],
    }),
  );

  test('the REST provider renames the field on the wire', () => {
    expect(
      defaultEncodeList({
        resource: resource.ref,
        ctx: {},
        pagination: { mode: 'off' },
        sort: [],
        filter: { teamId: { $in: ['t1', 't2'] } },
      }),
    ).toEqual({ 'team[in]': 't1,t2' });
  });

  test('paramUrlCodec mirrors the API query and ignores undeclared params', () => {
    const defaults = {
      pageSize: 10,
      fieldTypes: { teamId: 'relation', budget: 'number' },
      fieldParams: { teamId: 'team' },
    };
    const state = {
      page: 3,
      pageSize: 10,
      sort: [{ field: 'budget', order: 'desc' as const }],
      filter: { teamId: { $eq: 't1' }, budget: { $gte: 5 } },
      search: 'apollo',
    };
    const url = passthroughUrlCodec.stringify(state, defaults);
    expect(url).toBe('?page=3&sort=budget&order=desc&team=t1&budget%5Bgte%5D=5&q=apollo');
    expect(passthroughUrlCodec.parse(`${url}&utm_source=x`, defaults)).toEqual(state);
    expect(
      paramUrlCodec({ sort: 'sortBy', order: 'sortOrder', pageSize: 'limit' }).stringify(
        { ...state, page: 1, pageSize: 25 },
        defaults,
      ),
    ).toBe('?limit=25&sortBy=budget&sortOrder=desc&team=t1&budget%5Bgte%5D=5&q=apollo');
  });
});
