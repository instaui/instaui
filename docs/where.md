# Conditions and filters: `Where`

One small language is used everywhere a condition is needed:

- field visibility (`visibleIf`, `requiredIf`, `readOnlyIf`)
- action visibility
- access rules
- permanent list filters
- relation option filters
- the `filter` sent to your data provider

```tsx
import { evaluateWhere, type Where } from 'instaui';

const overdue: Where = {
  status: { $in: ['NEW', 'PAID'] },
  dueOn: { $lt: { $var: 'ctx.today' } },
  $not: { archived: true },
};

export const isOverdue = (invoice: Record<string, unknown>, today: string) =>
  evaluateWhere(overdue, { ctx: { today } }, invoice);
```

## Operators

| Operator                                 | Meaning                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| `$eq`, `$ne`                             | Strict equality and inequality. A bare value means `$eq`.  |
| `$in`, `$nin`                            | Membership in a list.                                      |
| `$lt`, `$lte`, `$gt`, `$gte`, `$between` | Comparisons; values of different types never match.        |
| `$contains`, `$startsWith`               | Case-insensitive string matching.                          |
| `$null`, `$empty`                        | Null/undefined; empty means null, undefined, `''` or `[]`. |
| `$and`, `$or`, `$not`                    | Grouping. Keys in one object are AND-ed.                   |

`{ $var: 'values.x' | 'record.x' | 'ctx.x' }` reads from the evaluation scope.

Rules:

- **Missing paths read as `undefined`.**
- **Array-valued fields match if any element matches.** For negations (`$ne`, `$nin`), no element may match.
- **Unknown operators are an error, never silently ignored.**
- **There is no `$regex` or `$where`,** so configs from a server can't run code or expensive patterns.
