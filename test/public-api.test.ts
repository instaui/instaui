import { expect, test } from 'vitest';
import * as instaui from '../src/index.ts';

// The single entry point's runtime surface. Any change here is a public API change.
test('public runtime exports', () => {
  expect(Object.keys(instaui).sort()).toEqual([
    'ItemCrud',
    'RelationField',
    'UI_CONSTANTS',
    'formatDate',
    'formatDateTime',
    'getRelationString',
  ]);
});
